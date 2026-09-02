// Run: node pages/device-battery/instrument-session-recovery.test.js
// Production composable + page scan/lifecycle/polling handlers; only native BLE, APIs and time are mocked.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText
const pageSource = fs.readFileSync(path.join(__dirname, 'detail.vue'), 'utf8')
function section(start, end) {
  const from = pageSource.indexOf(start)
  const to = pageSource.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `missing page section: ${start}`)
  return pageSource.slice(from, to)
}
const pageCode = compile([
  section('const meterPanelVisible =', 'const {\n\tbattery,'),
  section('const reconnectInstrumentSession =', 'watch(\n\t() => canShowHistoryTab.value'),
  section('const scanAndBindBms =', 'onLoad((query)'),
  section('onUnload(() => {', '</script>'),
  'globalThis.page = { scan: scanAndBindBms, apply: applyCurrentPollingPolicy, switching: meterTargetSwitching }',
].join('\n'))
const drain = () => new Promise((resolve) => setImmediate(resolve))
const A = 'AC0000000001'
const B = 'AC0000000002'

function createHarness(options = {}) {
  let now = 0
  let timerId = 0
  let callback
  let unload
  let alive = true
  let inFlight = 0
  const timers = new Map()
  const calls = { reads: [], writes: [], scans: 0, connections: 0, disconnects: 0, maxInFlight: 0, toasts: [] }
  const state = { availableAt: options.availableAt ?? 0, target: A, configure: 'ack', connectDelay: 0, connectFailure: false }
  class ClockDate extends Date { static now() { return now } }
  const later = (fn, ms) => {
    const id = ++timerId
    timers.set(id, { fn, due: now + ms })
    return id
  }
  const sleep = (ms) => ms ? new Promise((resolve) => later(resolve, ms)) : Promise.resolve()
  const bleClient = {
    async readAllStatus() {
      const target = state.target
      const available = now >= state.availableAt
      calls.reads.push(now)
      calls.maxInFlight = Math.max(calls.maxInFlight, ++inFlight)
      try {
        await sleep(options.readDelay ?? (available ? 100 : 5000))
        if (!available) throw new Error('BLE request timeout after 5000ms')
        // Deliberately allow stale complete replies; production generation guards must reject them.
        return { identity: { bluetoothMac: target }, energy: { socPct: target === A ? 20 : 80 } }
      } finally { inFlight-- }
    },
    async configureMeterMac(input) {
      calls.writes.push(input)
      if (state.configure === 'failure') throw new Error('BMS error response')
      state.target = input.mac.replace(/:/g, '')
      if (state.configure === 'timeout') throw new Error('BLE request timeout after 5000ms')
    },
  }
  const cache = {
    canBleAutoConnect: (_, mac) => ({ ok: true, mac }),
    async connectBleClient({ mac }) {
      calls.connections++
      await sleep(state.connectDelay)
      if (!alive || state.connectFailure) throw new Error('connect failed')
      return { key: mac, client: bleClient }
    },
    disconnectBleClient: async () => { calls.disconnects++; return true },
    releaseBleClientAndDisconnectIfIdle: async () => true,
    getBleClientEntry: () => null,
    invalidateBleConnectAttempts() {}, retainBleClient() {}, releaseBleClient() {},
  }
  const context = vm.createContext({
    Error, Date: ClockDate, setTimeout: later, clearTimeout: id => timers.delete(id),
    setInterval: later, clearInterval: id => timers.delete(id),
    console: { log() {}, warn() {}, error() {} },
    uni: {
      scanCode: opts => { callback = opts; calls.scans++ },
      showLoading() {}, hideLoading() {},
      showToast: opts => calls.toasts.push(opts.title),
    },
  })
  const mocks = {
    vue,
    '@/common/config': {},
    '@/service/app-battery': {},
    '@/common/lib/bms-protocol/client': { BMS_STATUS_READ_CANCELED_MESSAGE: 'BMS status read canceled' },
    '@/common/lib/bms-protocol/uni-mqtt-socket-transport': {},
    '@/common/ble/ble-client-cache': cache,
    '@/common/device-provision/ble': { normalizeMac: value => value },
  }
  const modules = new Map()
  function load(filename) {
    const file = path.resolve(filename)
    if (modules.has(file)) return modules.get(file)
    const exports = {}
    modules.set(file, exports)
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      assert.ok(name.startsWith('.'), `unexpected dependency: ${name}`)
      return load(path.resolve(path.dirname(file), name + '.ts'))
    }
    const execute = vm.runInContext(`(function(require, exports) {\n${compile(fs.readFileSync(file, 'utf8'))}\n})`, context)
    execute(localRequire, exports)
    return exports
  }
  const detail = load(path.join(__dirname, 'useBatteryDetail.ts')).useBatteryDetail()
  Object.assign(context, detail, {
    resolveDetailPollingPolicy: load(path.join(__dirname, 'detail-polling-policy.ts')).resolveDetailPollingPolicy,
    ref: vue.ref, watch: vue.watch,
    activeTab: vue.ref(0), otaRunning: vue.ref(false),
    showBleDisconnectBtn: { get value() { return detail.connType.value === 'bluetooth' } },
    ensureLoggedIn: () => true, t: key => key, DEVICE_TYPE_BMS: 'bms',
    parseAddDeviceScanCode: value => /^AC[0-9A-F]{10}$/.test(value)
      ? { type: 'mac', deviceType: 'bms', value } : null,
    mac12ToColon: value => value.match(/.{2}/g).join(':'),
    shouldDisconnectBleOnDetailUnload: () => false,
    onUnload: fn => { unload = fn },
  })
  const scope = vue.effectScope()
  scope.run(() => vm.runInContext(pageCode, context))
  return {
    detail, state, calls, context,
    scanCallback: () => callback,
    async start() {
      await detail.loadInstrumentSession({ bleMac: 'AA0000000001' })
      await drain()
    },
    async scan(code = B) {
      await context.page.scan()
      return callback.success({ result: code })
    },
    async cancelScan() { await context.page.scan(); callback.fail(); await drain() },
    async tab(value) { context.activeTab.value = value; await drain() },
    async tick(ms) {
      const until = now + ms
      await drain()
      while (true) {
        const next = [...timers.entries()].filter(([, task]) => task.due <= until)
          .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0]
        if (!next) break
        const [id, task] = next
        timers.delete(id)
        now = task.due
        task.fn()
        await drain()
      }
      now = until
      await drain()
    },
    async unload() { alive = false; unload(); scope.stop(); await drain() },
  }
}

async function main() {
  {
    const h = createHarness({ availableAt: 30000 })
    await h.start()
    await h.tick(10000)
    assert.equal(h.detail.instrumentPassthroughUnavailable.value, true)
    assert.equal(h.detail.bmsDataLoading.value, false, '10 seconds ends the loading mask')
    await h.tick(35000)
    assert.equal(h.detail.status.value.identity.bluetoothMac, A, 'late BMS arrival refreshes without tab changes')
    assert.deepEqual(h.calls.reads.slice(0, 6), [0, 6200, 14200, 22200, 30200, 32300])
    assert.equal(h.calls.maxInFlight, 1, 'steady polling never overlaps')
    assert.equal(h.calls.connections, 1, 'missing BMS data must not reconnect the meter')
    assert.equal(h.detail.instrumentPassthroughUnavailable.value, false)
    await h.unload()
  }
  {
    const h = createHarness({ readDelay: 11000 })
    await h.start()
    await h.tick(10000)
    assert.equal(h.detail.status.value, null)
    await h.tick(1000)
    assert.equal(h.detail.status.value.identity.bluetoothMac, A, 'same-session reply after 10 seconds is accepted')
    await h.unload()
  }
  for (const configure of ['ack', 'timeout']) {
    const h = createHarness()
    await h.start()
    await h.tick(100)
    h.state.configure = configure
    h.state.connectDelay = 2000
    const operation = h.scan()
    await drain()
    assert.equal(h.detail.status.value, null, 'valid scan clears old BMS immediately')
    assert.equal(h.context.page.switching.value, true)
    await h.tick(1000)
    assert.equal(h.context.page.switching.value, true, 'switch awaits real connection completion')
    assert.equal(h.calls.reads.length, 1, 'connection watchers must not resume during configuration')
    await h.tick(1710)
    await operation
    assert.equal(h.context.page.switching.value, false)
    assert.equal(h.detail.status.value.identity.bluetoothMac, B, 'new BMS updates without tab changes')
    assert.equal(h.calls.writes.length, 1, 'timeout must not repeat configuration')
    assert.equal(h.calls.writes[0].meterAddress, 0xfc)
    if (configure === 'timeout') assert.ok(h.calls.toasts.includes('deviceDetail.meter.bindTargetPending'))
    await h.unload()
  }
  {
    const h = createHarness({ availableAt: Infinity })
    await h.start()
    await h.tick(31000)
    h.state.availableAt = 0
    const operation = h.scan()
    await h.tick(710)
    await operation
    assert.equal(h.detail.status.value.identity.bluetoothMac, B, 'scanning after prolonged empty state resumes immediately')
    await h.unload()
  }
  for (const blocker of ['params', 'history', 'ota']) {
    const h = createHarness()
    await h.start()
    await h.tick(100)
    const operation = h.scan()
    await h.tick(200)
    if (blocker === 'ota') h.context.otaRunning.value = true
    else await h.tab(blocker === 'params' ? 2 : 3)
    await h.tick(1000)
    await operation
    assert.equal(h.calls.reads.length, 1, 'completed switch must honor current tab/OTA pause')
    h.context.otaRunning.value = false
    await h.tab(0)
    await h.tick(100)
    assert.equal(h.detail.status.value.identity.bluetoothMac, B)
    await h.unload()
  }
  {
    const h = createHarness()
    await h.start()
    await h.tick(100)
    const first = h.scan()
    await drain()
    const oldCallback = h.scanCallback()
    await h.context.page.scan()
    assert.equal(h.calls.scans, 1, 'duplicate press during switch must not start another scan')
    await h.tick(710)
    await first
    const second = h.scan(A)
    await drain()
    await oldCallback.success({ result: B })
    assert.equal(h.context.page.switching.value, true, 'stale callback cannot release a newer switch lock')
    await h.tick(710)
    await second
    assert.equal(h.detail.status.value.identity.bluetoothMac, A)
    assert.equal(h.calls.writes.length, 2, 'consecutive valid switches each configure exactly once')
    await h.unload()
  }
  {
    const h = createHarness()
    await h.start()
    await h.tick(100)
    const original = h.detail.status.value
    await h.cancelScan()
    await h.scan('invalid')
    assert.equal(h.detail.status.value, original, 'cancel/invalid QR preserve the original status')
    assert.equal(h.calls.writes.length, 0)
    h.state.configure = 'failure'
    const operation = h.scan()
    await h.tick(260)
    await operation
    assert.equal(h.detail.status.value.identity.bluetoothMac, A, 'explicit configuration failure resumes old target queries')
    assert.equal(h.calls.connections, 1)
    await h.unload()
  }
  for (const tab of [2, 3]) {
    const h = createHarness({ availableAt: Infinity })
    await h.start()
    await h.tick(12000)
    await h.tab(tab)
    const reads = h.calls.reads.length
    await h.tick(15000)
    assert.equal(h.calls.reads.length, reads, 'params/history retain paused polling')
    h.state.availableAt = 0
    await h.tab(0)
    await h.tick(100)
    assert.equal(h.detail.status.value.identity.bluetoothMac, A, 'returning after timeout resumes queries')
    h.context.otaRunning.value = true
    await drain()
    await h.tick(10000)
    assert.equal(h.calls.reads.length, reads + 1, 'OTA remains exclusive')
    h.context.otaRunning.value = false
    await drain()
    await h.tick(100)
    assert.equal(h.calls.reads.length, reads + 2)
    await h.unload()
  }
  {
    const h = createHarness()
    await h.start()
    await h.tick(100)
    h.state.connectFailure = true
    const operation = h.scan()
    await h.tick(1000)
    await operation
    assert.equal(h.detail.connType.value, 'offline')
    assert.equal(h.context.page.switching.value, false)
    assert.ok(h.calls.toasts.includes('deviceDetail.meter.reconnectFailed'))
    const connections = h.calls.connections
    await h.tick(30000)
    assert.equal(h.calls.connections, connections, 'connection failure does not create an infinite retry loop')
    await h.unload()
  }
  for (const exitAt of [0, 200, 700]) {
    const h = createHarness()
    await h.start()
    await h.tick(100)
    h.state.connectDelay = 2000
    const operation = h.scan()
    await h.tick(exitAt)
    await h.unload()
    const connections = h.calls.connections
    const reads = h.calls.reads.length
    await h.tick(30000)
    await operation
    assert.equal(h.calls.connections, connections, 'unload must cancel delayed reconnects')
    assert.equal(h.calls.reads.length, reads)
    assert.equal(h.detail.status.value, null)
  }
  {
    const h = createHarness({ readDelay: 11000 })
    await h.start()
    await h.tick(100)
    const operation = h.scan()
    await h.tick(10900)
    await operation
    assert.equal(h.detail.status.value, null, 'old-session complete response cannot repopulate new session')
    await h.tick(710)
    assert.equal(h.detail.status.value.identity.bluetoothMac, B)
    await h.detail.disconnectBluetooth()
    const reads = h.calls.reads.length
    await h.tick(30000)
    assert.equal(h.calls.reads.length, reads, 'manual disconnection stops querying')
    await h.unload()
  }
  console.log('instrument session recovery tests passed (production composable + page handlers)')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
