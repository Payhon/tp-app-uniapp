// Run: pnpm dlx tsx pages/device-battery/ota-session.test.js
// Execute the actual SFC handlers; only native BLE/Socket, UI and firmware input are simulated.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const runtime = require('../../common/lib/bms-protocol/boot-ota-runtime-options.ts')
const { bootOtaUpgrade, resolveBootMaxPacketSizeForMtu } = require('../../common/lib/bms-protocol/boot-ota.ts')
const { buildBootFrame } = require('../../common/lib/bms-protocol/boot-frame.ts')
const { createUniBleBmsTransport } = require('../../common/lib/bms-protocol/uni-ble-transport.ts')
const { resolveDetailPollingPolicy } = require('./detail-polling-policy.ts')

function section(file, start, end) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const from = source.indexOf(start)
  const to = source.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `missing SFC section: ${start}`)
  return source.slice(from, to)
}
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText
const otaCode = compile(section('components/params-tab.vue', 'const isExplicitBleDisconnectError =', 'const startBmsOta =') +
  '\nglobalThis.ota = { run: runBootOtaUpgrade, finish: finishBleOtaRecovery, options: getBleBootOtaRuntimeOptions, isExplicitBleDisconnectError }')
const pollingCode = compile(section('detail.vue', 'const applyCurrentPollingPolicy =', 'watch(\n\t() => canShowHistoryTab.value'))

async function checkSession({ mtu, packetOption = 0, error, connType = 'bluetooth', platform = 'android', isMeterUpgrade = false, throughMeter = false, failUpgrade = false, screenUnavailable = false, retryCommand }) {
  const screen = []
  const deferredLogs = []
  const commands = []
  const requestOptions = []
  const stages = []
  const recoveries = []
  const logger = { info() {}, debug() {}, warn() {}, error() {} }
  const transport = createUniBleBmsTransport({ minFrameIntervalMs: 120, logger })
  Object.assign(transport, { deviceId: 'test-device', serviceId: 'service', writeCharId: 'write', _connected: true, _platform: platform })
  const makeResponse = frame => {
    commands.push(frame[3])
    const index = (frame[6] << 8) | frame[7]
    const payload = frame[3] === 0x52 ? [0, packetOption] : frame[3] === 0x53 ? [0, (index + 1) >> 8, (index + 1) & 255] : [0]
    return buildBootFrame({ sourceAddress: frame[2], targetAddress: frame[1], command: frame[3], payload })
  }
  globalThis.uni = {
    writeBLECharacteristicValue(options) {
      const frame = new Uint8Array(options.value)
      assert.ok(frame[3] !== 0x53 || frame.length <= transport.writeChunkSize, 'Boot data must fit one native write')
      transport._onNotify(makeResponse(frame).buffer)
    },
    setBLEMTU(options) {
      if (mtu === 'failure') return options.fail(new Error('MTU rejected'))
      options.success(typeof mtu === 'number' ? { mtu } : {})
    },
  }
  if (mtu === 'missing') delete globalThis.uni.setBLEMTU
  let released = 0
  const end = transport.endExclusiveBootSession.bind(transport)
  transport.endExclusiveBootSession = () => { released++; end() }
  const request = transport.request.bind(transport)
  let timeoutInjected = false
  transport.request = (frame, options) => {
    requestOptions.push({ command: frame[3], ...options })
    if (frame[3] === retryCommand && !timeoutInjected) {
      timeoutInjected = true
      return Promise.reject(new Error('BLE request timeout'))
    }
    if (connType === 'mqtt') return Promise.resolve(makeResponse(frame))
    return request(frame, options)
  }
  const context = vm.createContext({
    ...runtime, bootOtaUpgrade: failUpgrade ? async () => { throw new Error('simulated failure') } : bootOtaUpgrade,
    resolveBootMaxPacketSizeForMtu,
    props: { connType, battery: { ble_mac: throughMeter || isMeterUpgrade ? 'AA0000000001' : 'AC0000000001' }, status: { meta: { softwareVersion: 3 } },
      client: { getTransport: () => transport, getAddresses: () => ({ sourceAddress: 0xfe }) },
      onRecoverBleOta: async request => {
        assert.equal(released, 1, 'recovery starts only after exclusive Boot cleanup')
        assert.deepEqual(screen, [true, false]); assert.deepEqual(deferredLogs, [true, false])
        assert.equal(transport.minFrameIntervalMs, 120)
        recoveries.push(request)
        return { state: 'ready', version: '4' }
      },
    },
    otaState: { recoveryMessage: '', message: 'original OTA result' }, t: key => key,
    isMeterMac: mac => String(mac).startsWith('AA'),
    getRuntimePlatform: () => platform, developerStore: { enabled: false }, otaLogger: logger,
    setOtaDebugLogDeferred: value => deferredLogs.push(value),
    setOtaKeepScreenOn: async value => { screen.push(value); return !screenUnavailable },
    formatDebugError: String, updateOtaStage: (stage, progress) => stages.push({ stage, progress }), appendMeterOtaDebug() {},
  })
  vm.runInContext(otaCode, context)
  const options = context.ota.options({ isMeterUpgrade, throughMeter })
  assert.equal(options.minFrameIntervalMs, 0)
  assert.equal(options.minFrameIntervalMode, 'set')
  assert.equal(options.packetDelayMs, 0)
  assert.equal(options.pageBoundaryDelayMs, 300)
  assert.equal(options.requireFinalPacketAck, true)
  assert.equal(!!options.allowPostFinalizeBleDisconnectSuccess, connType === 'bluetooth' && !throughMeter)
  if (isMeterUpgrade) Object.assign(options, { skipEnterBoot: true, queryTargetAddress: 0, prepareBaudRate: 9600 })
  const upgrade = context.ota.run(new Uint8Array(packetOption === 2 ? 512 : 64), isMeterUpgrade ? 0xfc : 0x01, options)
  if (error) await assert.rejects(upgrade, error)
  else await upgrade
  assert.deepEqual(screen, [true, false], 'screen-on protection must always be restored')
  assert.deepEqual(deferredLogs, [true, false], 'Boot logging must buffer during transfer and flush in finally')
  assert.equal(released, 1, `${connType}: exclusive session must end in finally`)
  assert.equal(transport._bootSessionExclusive, false)
  assert.equal(transport.minFrameIntervalMs, 120, 'normal transport pacing must be restored')
  assert.equal(transport.logger, logger)
  assert.equal(recoveries.length, 0, 'caller publishes original result before invoking recovery')
  await context.ota.finish()
  await context.ota.finish()
  const expectedRecoveries = connType === 'bluetooth' && requestOptions.length > 0 ? 1 : 0
  assert.equal(recoveries.length, expectedRecoveries, 'only BLE with a started Boot request recovers, exactly once')
  assert.equal(context.otaState.message, 'original OTA result', 'recovery never overwrites original OTA result')
  if (recoveries.length) {
    assert.equal(recoveries[0].upgradeSucceeded, !error)
    assert.equal(recoveries[0].kind, isMeterUpgrade ? 'meter' : throughMeter ? 'meter-bms' : 'bms')
    assert.equal(recoveries[0].debug, undefined, 'debug-off recovery has no log callback')
  }
  const seen = new Set()
  for (const options of requestOptions) {
    const retry = options.command === retryCommand && seen.has(options.command)
    assert.equal(options.timeoutMs, retry ? 450 : options.command === 0x54 ? 5000 : 800)
    assert.equal(options.bootAckGraceMs, 0)
    seen.add(options.command)
  }
  assert.ok(stages.every(p => p.progress < 100 || (!error && commands.includes(0x54))), '100% requires the simulated successful 0x54 response')
  return commands
}

async function run() {
  const packageContext = vm.createContext({ otaState: { running: true }, meterPackagePopup: { show: false }, loadMeterPackages: async () => {} })
  vm.runInContext(compile(section('components/params-tab.vue', 'const openMeterPackagePopup =', 'const closeMeterPackagePopup =') + '\nglobalThis.openPackages = openMeterPackagePopup'), packageContext)
  await packageContext.openPackages()
  assert.equal(packageContext.meterPackagePopup.show, false, 'OTA/recovery must block firmware selection')
  packageContext.otaState.running = false
  await packageContext.openPackages()
  assert.equal(packageContext.meterPackagePopup.show, true, 'normal firmware selection stays available')
  const switchSource = section('detail.vue', 'const switchTab =', 'const sessionActionButtonStyle =')
  for (const connType of ['bluetooth', 'offline', 'mqtt']) {
    const context = vm.createContext({ activeTab: vue.ref(2), otaRunning: vue.ref(true), connType: vue.ref(connType) })
    vm.runInContext(compile(switchSource + '\nglobalThis.changeTab = switchTab'), context)
    context.changeTab(0)
    assert.equal(context.activeTab.value, connType === 'mqtt' ? 0 : 2, 'BLE OTA/recovery keeps its component mounted; MQTT behavior is unchanged')
    context.otaRunning.value = false
    context.changeTab(1)
    assert.equal(context.activeTab.value, 1, 'normal tabs remain available')
  }
  for (const mtu of [512, 78, 'failure', 'missing', 'unknown']) {
    const commands = await checkSession({ mtu, packetOption: mtu === 512 ? 2 : 0 })
    assert.ok(commands.includes(0x53) && commands.includes(0x54), `MTU ${mtu}: full OTA path must remain available`)
  }
  assert.deepEqual(await checkSession({ mtu: 77, error: /boot_ble_mtu_unsupported/ }), [], 'known insufficient MTU must fail before any Boot command')
  const tooLarge = await checkSession({ mtu: 78, packetOption: 1, error: /boot_ble_frame_exceeds_mtu/ })
  assert.ok(!tooLarge.includes(0x53), 'do not silently shrink the packet size requested by the device')
  await checkSession({ mtu: 512, failUpgrade: true, error: /simulated failure/ })
  await checkSession({ mtu: 512, failUpgrade: true, screenUnavailable: true, error: /simulated failure/ })
  await checkSession({ connType: 'mqtt' })
  await checkSession({ connType: 'mqtt', failUpgrade: true, error: /simulated failure/ })
  await checkSession({ throughMeter: true })
  await checkSession({ mtu: 185, isMeterUpgrade: true })
  await checkSession({ platform: 'ios' })
  await checkSession({ platform: 'ios', isMeterUpgrade: true })
  for (const connType of ['bluetooth', 'mqtt']) {
    for (const retryCommand of [0x50, 0x51, 0x52, 0x53, 0x54]) {
      await checkSession({ connType, retryCommand })
    }
  }

  const classifierContext = vm.createContext({
    ...runtime, bootOtaUpgrade, resolveBootMaxPacketSizeForMtu,
    props: { connType: 'bluetooth' }, getRuntimePlatform: () => 'android', developerStore: { enabled: false }, otaLogger: {},
    setOtaDebugLogDeferred() {}, setOtaKeepScreenOn: async () => true,
  })
  vm.runInContext(otaCode, classifierContext)
  assert.equal(classifierContext.ota.isExplicitBleDisconnectError({ extra: { errCode: 10006 } }), true)
  assert.equal(classifierContext.ota.isExplicitBleDisconnectError({ extra: { errCode: 10004 } }), false)
  assert.equal(classifierContext.ota.isExplicitBleDisconnectError(new Error('BLE request timeout')), false)

  // Reproduce the batched Vue watcher that used to re-enable MQTT polling after OTA paused it.
  for (const connType of ['bluetooth', 'mqtt']) {
    for (const sessionMode of ['cloud', 'instrument']) {
      const calls = []
      const context = vm.createContext({
        pageActive: true, activeTab: vue.ref(2), connType: vue.ref(connType), sessionMode: vue.ref(sessionMode),
        client: vue.ref({}), connecting: vue.ref(false), otaRunning: vue.ref(false), meterTargetSwitching: vue.ref(false),
        watch: vue.watch, resolveDetailPollingPolicy,
        pausePolling: () => calls.push('pause'), resumePolling: options => calls.push(options || 'normal'),
      })
      const scope = vue.effectScope()
      scope.run(() => vm.runInContext(pollingCode, context))
      calls.length = 0
      context.otaRunning.value = true
      context.pausePolling()
      await vue.nextTick()
      assert.ok(calls.every(value => value === 'pause'), `${connType}/${sessionMode}: watcher must not restart polling during OTA`)
      context.otaRunning.value = false
      await vue.nextTick()
      assert.equal(calls.at(-1)?.intervalMs, connType === 'mqtt' ? 10000 : undefined)
      scope.stop()
    }
  }
  console.log('OTA page preflight, cleanup and batched polling watcher tests passed')
}
void run()
