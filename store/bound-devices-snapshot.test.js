// Run: node store/bound-devices-snapshot.test.js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const pinia = require('pinia')

const root = path.resolve(__dirname, '..')
const storage = new Map([['access_token', 'test-session']])
const snapshotKey = '__BOUND_DEVICES_SNAPSHOT__'
const target = { device_id: 'device-A', ble_mac: 'AC1122334455', item_uuid: '00112233445566778899AABBCCDDEEFF' }
const other = { device_id: 'device-B', ble_mac: 'AC6677889911', item_uuid: 'FFEEDDCCBBAA99887766554433221100' }
const userStore = { userInfo: { user_kind: 'END_USER' } }
let cloudList = []
let outcome = 200
let modal
let component
let scanTask
let scanResult
let route
const uni = {
  getStorageSync: (key) => storage.get(key),
  setStorageSync: (key, value) => storage.set(key, JSON.parse(JSON.stringify(value))),
  showModal: (options) => { modal = options },
  showToast() {},
}
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
function loadTs(file, imports = {}) {
  const context = { exports: {}, uni, require: (name) => {
    assert.ok(name in imports, `unexpected import: ${name}`)
    return imports[name]
  } }
  vm.runInNewContext(compile(fs.readFileSync(path.join(root, file), 'utf8')), context)
  return context.exports
}
const viewMode = loadTs('common/device-view-mode.ts')
pinia.setActivePinia(pinia.createPinia())
const store = loadTs('store/bound-devices.ts', {
  pinia,
  '@/common/device-provision/ble': {}, // This check exercises refresh/removal; native TabBar handles MAC/UUID lookup below.
  '@/common/device-view-mode': viewMode,
  '@/common/auth/session-expired': { isAuthExpiredApiResponse: () => false },
  '@/service/device': { appBoundDeviceList: async () => ({ code: 200, data: { list: cloudList, total: cloudList.length } }) },
  '@/store/user': { useUserStore: () => userStore },
}).useBoundDevicesStore()

const wx = {
  getStorageSync: uni.getStorageSync,
  navigateTo: ({ url }) => { route = url },
  scanCode: (options) => { scanTask = Promise.resolve(options.success({ result: scanResult })) },
  showToast() {},
}
vm.runInNewContext(fs.readFileSync(path.join(root, 'custom-tab-bar/index.js'), 'utf8'), {
  wx, Component: (value) => { component = value },
  require: (name) => { assert.equal(name, './i18n.js'); return require('../custom-tab-bar/i18n.js') },
})
async function scan(code) {
  scanResult = code
  route = undefined
  component.methods.onActionSheetItem.call({ setData() {} }, { currentTarget: { dataset: { index: 1 } } })
  await scanTask
  assert.ok(route, 'valid scan must navigate')
  return route
}

async function remove(id) {
  if (outcome === 'throw') throw new Error('request failed')
  if (outcome === 200) cloudList = cloudList.filter((item) => item.device_id !== id)
  return { code: outcome }
}
const homeSource = fs.readFileSync(path.join(root, 'pages/home/home.vue'), 'utf8')
const start = homeSource.indexOf('const removeDeviceFromView =')
const end = homeSource.indexOf('const onActionSelect =', start)
assert.ok(start >= 0 && end > start, 'home removal handlers must exist')
const home = {
  uni, userStore, ...viewMode, boundDevicesStore: store,
  ...loadTs('common/home-device-action.ts'),
  deviceCards: { value: [] }, currentViewMode: { value: 'self_bound' },
  selectedDevice: { value: { id: target.device_id, bleMac: target.ble_mac, bmsCommType: 1 } },
  actionSheetShow: { value: false }, submitting: { value: false },
  appUnbindDevice: remove, appRemoveDevice: remove,
  t: (key) => key,
  canBleAutoConnect: (_type, mac) => ({ mac }), homeBleKeys: new Set(), releaseBleClient() {},
}
vm.runInNewContext(compile(homeSource.slice(start, end) + '\nglobalThis.actions = { confirmUnbind, confirmRemove };'), home)
const ids = (list) => Array.from(list, (item) => item.device_id)
async function main() {
  for (const [kind, action] of [['END_USER', 'confirmUnbind'], ['ORG_USER', 'confirmRemove']]) {
    userStore.userInfo = { user_kind: kind }
    home.currentViewMode.value = viewMode.resolveAddTrackingViewMode(userStore.userInfo)
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      // Simulate the next successful add, then run real store refresh, home actions and WeChat scan handler.
      cloudList = [target, other]
      await store.refresh({ force: true })
      home.deviceCards.value = [{ id: target.device_id }, { id: other.device_id }]
      assert.match(await scan(target.ble_mac), /device-battery\/detail\?device_id=device-A&/)
      for (const failure of [500, 'throw', 'cancel']) {
        outcome = failure
        home.actions[action]()
        await modal.success({ confirm: failure !== 'cancel' })
        assert.deepEqual(ids(store.list), ['device-A', 'device-B'])
        assert.deepEqual(ids(storage.get(snapshotKey)), ['device-A', 'device-B'])
        assert.equal(home.deviceCards.value.length, 2)
        assert.match(await scan(target.ble_mac), /device-battery\/detail\?device_id=device-A&/)
      }
      outcome = 200
      home.actions[action]()
      await modal.success({ confirm: true })
      assert.deepEqual(ids(store.list), ['device-B'])
      assert.deepEqual(ids(storage.get(snapshotKey)), ['device-B'], `${kind} removal must immediately clear the scan snapshot (cycle ${cycle})`)
      assert.equal(home.deviceCards.value.length, 1)
      assert.match(await scan(target.ble_mac), /device-provision\/ble-scan\?mode=qr&mac=AC1122334455&/)
      assert.match(await scan(target.item_uuid), /device-provision\/uuid-bind\?uuid=00112233445566778899AABBCCDDEEFF&/)
      assert.match(await scan(other.ble_mac), /device-battery\/detail\?device_id=device-B&/)
      assert.match(await scan(other.item_uuid), /device-battery\/detail\?device_id=device-B&/)
    }
  }
  store.clear()
  assert.deepEqual(ids(storage.get(snapshotKey)), [])
  console.log('bound-device snapshot regression passed: unbind/remove, failures/cancel, MAC/UUID routes and 3 repeated add cycles per user kind')
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
