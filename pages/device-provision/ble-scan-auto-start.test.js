const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function compile(source) {
  return ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText
}

const policyContext = vm.createContext({ exports: {} })
vm.runInContext(compile(fs.readFileSync(path.join(__dirname, 'ble-scan-entry-policy.ts'), 'utf8')), policyContext)
const policy = policyContext.exports
const pageSource = fs.readFileSync(path.join(__dirname, 'ble-scan.vue'), 'utf8')

// Run the actual lifecycle and button handlers; native BLE and the store are mocked.
function sourceBetween(start, end) {
  const from = pageSource.indexOf(start)
  const to = pageSource.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `page source should contain ${start} through ${end}`)
  return pageSource.slice(from, to)
}
const handlers = compile(
  sourceBetween('function detailEntrySourceQuery()', 'function clearList()') +
  sourceBetween('function upsertDevice(', 'const onDeviceFound =') +
  sourceBetween('async function toggleScan()', 'onLoad((option)') +
  sourceBetween('onLoad((option)', '</script>')
)

function createPage(query, options = {}) {
  const hooks = {}
  const calls = { starts: 0, stops: 0, refreshes: 0, redirects: [], navigations: [], tabs: [] }
  const context = vm.createContext({
    ...policy,
    onLoad: (fn) => { hooks.load = fn },
    onShow: (fn) => { hooks.show = fn },
    onHide: (fn) => { hooks.hide = fn },
    onUnload: (fn) => { hooks.unload = fn },
    ensureLoggedIn: () => options.loggedIn !== false,
    // Lifecycle tests supply normalized route MACs; production normalization stays unchanged.
    normalizeMac: (value) => /^[0-9a-f]{12}$/i.test(value) ? value.toUpperCase() : null,
    t: (key) => key,
    mode: { value: 'manual' },
    entrySource: { value: 'ble_search' },
    targetMac: { value: null },
    marginTopHeight: { value: 0 },
    pageHeight: { value: 0 },
    defaultMarginTop: '44px',
    defaultPageHeight: '667px',
    starting: { value: false },
    isScanning: { value: false },
    navigated: { value: false },
    rows: { value: new Map() },
    orderedDeviceIds: { value: [] },
    DEVICE_TYPE_METER: 'meter',
    logFoundDeviceOnce() {},
    isTargetDevice: () => ({ ok: true }),
    resolveAdvMacFromFoundDevice: (device) => device.advMac || null,
    resolveDeviceTypeByMac: () => 'bms',
    appendBleScanDeviceId: (ids, id) => [...ids, id],
    getBoundDeviceByRow: () => options.boundDevice,
    blockedByLoginGuard: false,
    pageVisible: false,
    visibilityGeneration: 0,
    autoStartRequested: false,
    autoStartConsumed: false,
    autoStartPending: false,
    listSortScheduler: { cancel() {}, markDirty() {} },
    boundDevicesStore: {
      refresh() {
        calls.refreshes += 1
        return options.refresh ? options.refresh() : Promise.resolve()
      },
      hasBleMac: () => !!options.boundDevice,
      findByBleMac: () => options.boundDevice,
    },
    uni: {
      getStorageSync: () => undefined,
      redirectTo: ({ url }) => { calls.redirects.push(url) },
      navigateTo: ({ url }) => { calls.navigations.push(url) },
      switchTab: ({ url }) => { calls.tabs.push(url) },
      showToast() {},
    },
    startScan: async () => {
      calls.starts += 1
      context.isScanning.value = !options.scanFails
    },
    stopScan: async () => {
      calls.stops += 1
      context.isScanning.value = false
      context.starting.value = false
    },
  })
  vm.runInContext(handlers, context)
  hooks.load(query)
  return { hooks, calls, context }
}

const flush = () => new Promise((resolve) => setImmediate(resolve))
function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

async function main() {
  const qrQuery = { mode: 'qr', mac: 'AC1122334455', entry_source: 'scan' }
  const qr = createPage(qrQuery)
  qr.hooks.show()
  assert.equal(qr.calls.starts, 0, 'bound-device lookup precedes automatic scanning')
  await flush()
  assert.equal(qr.calls.starts, 1, 'QR entry starts without a separate auto_start flag')
  assert.equal(qr.context.entrySource.value, 'scan', 'QR detail source must stay unchanged')
  qr.hooks.show()
  await flush()
  assert.equal(qr.calls.starts, 1, 'repeated onShow must not start a second scan')
  await qr.context.toggleScan()
  assert.equal(qr.context.isScanning.value, false, 'the user can stop the automatic scan')
  qr.hooks.hide()
  qr.hooks.show()
  await flush()
  assert.equal(qr.calls.starts, 1, 'returning from another page or background must not restart scanning')
  await qr.context.toggleScan()
  assert.equal(qr.calls.starts, 2, 'manual retry must remain available')

  const newQr = createPage(qrQuery)
  newQr.hooks.show()
  await flush()
  assert.equal(newQr.calls.starts, 1, 'a fresh QR navigation gets its own automatic start')

  const target = { deviceId: 'native-BMS', name: 'BMS', advMac: qrQuery.mac, RSSI: -60 }
  const bindingOptions = { boundDevice: null }
  const returning = createPage(qrQuery, bindingOptions)
  returning.hooks.show()
  await flush()
  returning.context.upsertDevice(target)
  await flush()
  assert.equal(returning.calls.navigations.length, 1, 'initial QR match enters provisioning once')
  assert.ok(returning.calls.navigations[0].includes('/provision-wizard?'))
  returning.hooks.hide()
  bindingOptions.boundDevice = { device_id: 'newly-bound-BMS' }
  // Binding changes the store while detail is open; returning must work with or without a prior disconnect.
  returning.hooks.show()
  await flush()
  assert.equal(returning.calls.redirects.length, 0, 'new binding must not redirect back to detail on return')
  assert.equal(returning.calls.starts, 1, 'returning must not restart discovery')
  assert.equal(returning.context.isScanning.value, false)
  returning.hooks.show()
  returning.hooks.hide()
  returning.hooks.show()
  await flush()
  assert.equal(returning.calls.redirects.length, 0, 'repeated visibility and background resume stay on scan page')
  await returning.context.toggleScan()
  returning.context.upsertDevice({ ...target, RSSI: -65 })
  await flush()
  assert.equal(returning.calls.starts, 2, 'manual discovery remains available after returning')
  assert.equal(returning.context.rows.value.get(target.deviceId).RSSI, -65, 'manual discovery updates the list')
  assert.equal(returning.calls.navigations.length, 1, 'manual discovery must not automatically select the target again')
  returning.context.selectDevice(returning.context.rows.value.get(target.deviceId))
  await flush()
  assert.deepEqual(returning.calls.navigations, [
    `/pages/device-provision/provision-wizard?deviceId=native-BMS&qrMac=${qrQuery.mac}&advMac=${qrQuery.mac}&entry_source=scan`,
    '/pages/device-battery/detail?device_id=newly-bound-BMS&entry_source=scan',
  ], 'tapping the bound device explicitly reopens detail')

  const selected = createPage(qrQuery)
  selected.hooks.show()
  await flush()
  selected.context.selectDevice({ ...target, deviceId: 'selected-BMS', advMac: 'AC6677889900', deviceType: 'bms' })
  await flush()
  assert.equal(selected.context.navigated.value, true, 'manual selection also consumes automatic navigation')
  selected.hooks.hide()
  selected.hooks.show()
  await flush()
  await selected.context.toggleScan()
  selected.context.upsertDevice(target)
  await flush()
  assert.equal(selected.calls.navigations.length, 1, 'returning after manual selection requires another tap to connect')

  newQr.context.upsertDevice(target)
  await flush()
  assert.equal(newQr.calls.navigations.length, 1, 'a fresh QR instance can automatically select its target')

  for (const mac of [undefined, '', 'invalid', 'AC1122']) {
    const invalid = createPage({ ...qrQuery, mac, auto_start: '1' })
    invalid.hooks.show()
    await flush()
    assert.equal(invalid.calls.starts, 0, 'invalid QR targets must not start even with auto_start=1')
  }

  for (const auto_start of [undefined, '0', '1']) {
    const manual = createPage({ auto_start, entry_source: 'ble_search' })
    manual.hooks.show()
    await flush()
    assert.equal(manual.calls.starts, auto_start === '1' ? 1 : 0, 'ordinary search keeps its explicit opt-in')
    assert.equal(manual.context.entrySource.value, 'ble_search')
  }

  const bound = createPage(qrQuery, { boundDevice: { device_id: 'bound-BMS' } })
  bound.hooks.show()
  await flush()
  assert.equal(bound.calls.starts, 0, 'bound QR devices bypass scanning')
  assert.deepEqual(bound.calls.redirects, ['/pages/device-battery/detail?device_id=bound-BMS&entry_source=scan'])
  bound.hooks.show()
  await flush()
  assert.equal(bound.calls.redirects.length, 1, 'an already consumed bound lookup must not redirect again')

  const blocked = createPage(qrQuery, { loggedIn: false })
  blocked.hooks.show()
  await flush()
  assert.equal(blocked.calls.starts, 0)
  assert.equal(blocked.calls.refreshes, 0, 'login guard blocks page initialization')

  for (const event of ['hide', 'unload']) {
    for (const boundDevice of [null, { device_id: 'late-BMS' }]) {
      const pending = deferred()
      const leaving = createPage(qrQuery, { refresh: () => pending.promise, boundDevice })
      leaving.hooks.show()
      leaving.hooks[event]()
      pending.resolve()
      await flush()
      assert.equal(leaving.calls.starts, 0, `${event} cancels a pending automatic start`)
      assert.equal(leaving.calls.redirects.length, 0, `${event} prevents late bound-device navigation`)
      assert.equal(leaving.calls.tabs.length, 0)
      assert.equal(leaving.calls.stops, 1)
    }
  }

  const delayed = deferred()
  const manualDuringRefresh = createPage(qrQuery, {
    refresh: () => delayed.promise,
    boundDevice: { device_id: 'late-bound-BMS' },
  })
  manualDuringRefresh.hooks.show()
  await manualDuringRefresh.context.toggleScan()
  await manualDuringRefresh.context.toggleScan()
  delayed.resolve()
  await flush()
  assert.equal(manualDuringRefresh.calls.starts, 1, 'late refresh must not undo a manual start then stop')
  assert.equal(manualDuringRefresh.context.isScanning.value, false)
  assert.equal(manualDuringRefresh.calls.redirects.length, 0, 'late refresh must not navigate after a manual action')

  const firstRefresh = deferred()
  let refreshCount = 0
  const resumed = createPage(qrQuery, {
    refresh: () => ++refreshCount === 1 ? firstRefresh.promise : Promise.resolve(),
  })
  resumed.hooks.show()
  resumed.hooks.hide()
  resumed.hooks.show()
  firstRefresh.resolve()
  await flush()
  assert.equal(resumed.calls.starts, 0, 'a stale visible generation must not start scanning after resume')

  const refreshFailed = createPage(qrQuery, { refresh: () => Promise.reject(new Error('offline')) })
  refreshFailed.hooks.show()
  await flush()
  assert.equal(refreshFailed.calls.starts, 1, 'failed refresh retains the existing BLE fallback')

  const scanFailed = createPage(qrQuery, { scanFails: true })
  scanFailed.hooks.show()
  await flush()
  scanFailed.hooks.show()
  await flush()
  assert.equal(scanFailed.calls.starts, 1, 'failed startup does not create an automatic retry loop')

  console.log('BLE QR auto-start lifecycle tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
