const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText
const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8')
const page = read('ble-scan.vue')
function between(start, end) {
  const from = page.indexOf(start)
  const to = page.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `missing source section: ${start}`)
  return page.slice(from, to)
}

// Execute production scanning, timeout, button and list logic with the MP-WEIXIN branch.
// Native radio operations, device identity parsing and the clock are isolated test doubles.
const scanSource = compile([
  between('function flushDeviceOrder()', 'const signalLevel'),
  between('function clearList()', 'function normalizeUuid'),
  between('function clearFallbackTimer()', 'function getBluetoothAdapterStateSafe'),
  between('function upsertDevice(', 'function selectDevice('),
  'globalThis.receive = onDeviceFound',
].join('\n').replace(/\/\/ #ifndef MP-WEIXIN[\s\S]*?\/\/ #endif/g, ''))
const listPolicy = compile(read('ble-scan-list-order-policy.ts'))
const entryPolicy = compile(read('ble-scan-entry-policy.ts'))
const drain = () => new Promise((resolve) => setImmediate(resolve))

function createHarness(options = {}) {
  let now = 0
  let timerId = 0
  let leaseId = 0
  const timers = new Map()
  const calls = { discoveries: [], errors: [] }
  class FakeDate extends Date {
    static now() { return now }
  }
  const context = vm.createContext({
    exports: {},
    Date: FakeDate,
    computed: (getter) => ({ get value() { return getter() } }),
    setTimeout: (callback, delay) => {
      const id = ++timerId
      timers.set(id, { callback, due: now + delay })
      return id
    },
    clearTimeout: (id) => timers.delete(id),
    rows: { value: new Map() },
    orderedDeviceIds: { value: [] },
    targetMac: { value: null },
    mode: { value: 'manual' },
    navigated: { value: false },
    starting: { value: false },
    isScanning: { value: false },
    errorMsg: { value: '' },
    pageVisible: true,
    scanSessionId: 0,
    scanQueue: Promise.resolve(),
    scanLease: null,
    stopScanPromise: null,
    fallbackTimer: null,
    scanTimeoutTimer: null,
    autoStartPending: false,
    debugLogFoundCount: { value: 0 },
    debugLogFilteredCount: { value: 0 },
    debugSeenDeviceIds: new Set(),
    normalizeMac: (value) => /^[0-9a-f]{12}$/i.test(value) ? value : null,
    logFoundDeviceOnce() {},
    isTargetDevice: () => ({ ok: true }),
    resolveAdvMacFromFoundDevice: (device) => device.advMac,
    resolveDeviceTypeByMac: () => 'bms',
    t: (key) => key,
    cancelHomeAutoConnectAttempts() {},
    acquireBleDiscoveryLease: async () => ({ id: ++leaseId, release() {} }),
    ensureBluetoothAdapterReady: async () => {},
    bindDeviceFoundListener() {},
    offDeviceFoundListener() {},
    stopDiscovery: async () => {},
    BLE_API_TIMEOUT_MS: 8000,
    SCAN_STOP_SETTLE_MS: 180,
    BMS_BLE_SERVICE_UUID: 'ffc0',
    callBleApiWithTimeout: ({ invoke }) => new Promise((resolve, reject) => {
      invoke({ success: resolve, fail: reject })
    }),
    wx: {
      openBluetoothAdapter: ({ success, fail }) => options.failAdapter ? fail(new Error('adapter failed')) : success({}),
      startBluetoothDevicesDiscovery: (input) => {
        calls.discoveries.push(input.services ? 'filtered' : 'unfiltered')
        input.success({})
      },
    },
    console: { log() {}, warn() {}, error: (...args) => calls.errors.push(args) },
    uni: {},
    formatUniError: String,
    classifyBleScanError: () => 'other',
    format: (template, params) => `${template}: ${params.error}`,
  })
  context.visibleDevices = { get value() { return Array.from(context.rows.value.values()) } }
  vm.runInContext(listPolicy, context)
  vm.runInContext(entryPolicy, context)
  Object.assign(context, context.exports)
  vm.runInContext(scanSource, context)

  return {
    context,
    calls,
    order: () => Array.from(context.orderedDeviceIds.value),
    found: (id, RSSI, advMac = 'AC0000000001') => context.receive({
      devices: [{ deviceId: id, name: id, RSSI, advMac }],
    }),
    async tick(milliseconds) {
      const until = now + milliseconds
      while (true) {
        const next = Array.from(timers.entries())
          .filter(([, task]) => task.due <= until)
          .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0]
        if (!next) break
        const [id, task] = next
        timers.delete(id)
        now = task.due
        task.callback()
        await drain()
      }
      now = until
      await drain()
    },
  }
}

async function main() {
  const scan = createHarness()
  await scan.context.startScan()
  scan.found('old-strong', -40)
  scan.found('old-weak', -80)
  await scan.tick(15000)
  assert.equal(scan.context.isScanning.value, false, 'automatic timeout should stop scanning')
  assert.deepEqual(scan.order(), ['old-strong', 'old-weak'], 'timeout preserves results until the next start')

  await scan.context.toggleScan()
  assert.equal(scan.context.rows.value.size, 0, 'start button clears previous results without a separate clear action')
  assert.deepEqual(scan.order(), [], 'start button also resets the previous display order')
  scan.found('old-weak', -70)
  scan.found('new-strong', -50)
  assert.deepEqual(scan.order(), ['old-weak', 'new-strong'], 'new results initially append without jumping')
  await scan.tick(2000)
  assert.deepEqual(scan.order(), ['new-strong', 'old-weak'], 'only current results sort by fresh RSSI')
  await scan.context.toggleScan()
  assert.deepEqual(scan.order(), ['new-strong', 'old-weak'], 'stop button must not clear this round')
  scan.found('late-device', -20)
  assert.equal(scan.context.rows.value.has('late-device'), false, 'stopped scan rejects late broadcasts')

  // A previous valid MAC must not suppress the new round's unfiltered fallback.
  await scan.context.toggleScan()
  scan.found('unresolved-this-round', -65, null)
  await scan.tick(1500)
  assert.deepEqual(scan.calls.discoveries, ['filtered', 'filtered', 'filtered', 'unfiltered'])
  assert.deepEqual(scan.order(), ['unresolved-this-round'], 'same-round fallback must not clear newly found rows')

  // Touch locks and pending sort timers from the previous round cannot lock the next list.
  const touch = createHarness()
  await touch.context.startScan()
  touch.found('old', -40)
  touch.context.handleListTouchStart()
  await touch.context.stopScan()
  await touch.context.toggleScan()
  touch.found('weak', -80)
  touch.found('strong', -40)
  await touch.tick(2000)
  assert.deepEqual(touch.order(), ['strong', 'weak'], 'restart cancels stale sorting state')
  touch.context.handleListTouchStart()
  touch.found('weak', -20)
  await touch.tick(2500)
  assert.deepEqual(touch.order(), ['strong', 'weak'], 'current-round touch lock remains effective')
  touch.context.handleListTouchEnd()
  await touch.tick(599)
  assert.deepEqual(touch.order(), ['strong', 'weak'])
  await touch.tick(1)
  assert.deepEqual(touch.order(), ['weak', 'strong'], '600ms touch release protection remains effective')

  const failureOptions = {}
  const failed = createHarness(failureOptions)
  await failed.context.startScan()
  failed.found('old', -40)
  await failed.context.stopScan()
  failureOptions.failAdapter = true
  await failed.context.toggleScan()
  assert.deepEqual(failed.order(), [], 'failed restart must not retain misleading old results')
  assert.equal(failed.context.starting.value, false)
  assert.equal(failed.context.isScanning.value, false)
  assert.ok(failed.context.errorMsg.value, 'existing startup failure feedback remains available')
  failureOptions.failAdapter = false
  await failed.context.toggleScan()
  failed.found('recovered', -50)
  assert.deepEqual(failed.order(), ['recovered'], 'manual retry after failure remains available')

  const hidden = createHarness()
  await hidden.context.startScan()
  hidden.found('keep-until-restart', -50)
  await hidden.context.stopScan()
  hidden.context.pageVisible = false
  await hidden.context.startScan()
  assert.deepEqual(hidden.order(), ['keep-until-restart'], 'invalid hidden startup should do no list work')
  assert.equal(hidden.calls.discoveries.length, 1)

  console.log('BLE scan restart list-reset tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
