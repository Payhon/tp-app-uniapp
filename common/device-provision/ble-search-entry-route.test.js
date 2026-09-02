const fs = require('node:fs')
const path = require('node:path')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const projectRoot = path.resolve(__dirname, '../..')
const uniActionSheetSource = fs.readFileSync(
  path.join(projectRoot, 'common/composables/useAddDeviceActionSheet.ts'),
  'utf8'
)
const wechatTabBarSource = fs.readFileSync(path.join(projectRoot, 'custom-tab-bar/index.js'), 'utf8')
const bleScanSource = fs.readFileSync(path.join(projectRoot, 'pages/device-provision/ble-scan.vue'), 'utf8')
const homeSource = fs.readFileSync(path.join(projectRoot, 'pages/home/home.vue'), 'utf8')
const orgDevicesSource = fs.readFileSync(path.join(projectRoot, 'pages/org-devices/index.vue'), 'utf8')

const automaticSearchUrl = '/pages/device-provision/ble-scan?auto_start=1&entry_source=ble_search'
assert(
  uniActionSheetSource.includes(`uni.navigateTo({ url: '${automaticSearchUrl}' })`),
  'UniApp add-device search entry should request one-shot automatic scanning'
)
assert(
  wechatTabBarSource.includes(`wx.navigateTo({ url: '${automaticSearchUrl}' })`),
  'WeChat custom TabBar search entry should request one-shot automatic scanning'
)
assert(
	automaticSearchUrl.includes('entry_source=ble_search') && !automaticSearchUrl.includes('entry_source=scan'),
	'ordinary Bluetooth search must use its own detail source instead of the camera scan source'
)
assert(
  uniActionSheetSource.includes('/pages/device-provision/ble-scan?mode=qr&mac='),
  'camera scan should preserve the QR matching route'
)
assert(
	wechatTabBarSource.includes('/pages/device-provision/ble-scan?mode=qr&mac='),
	'WeChat TabBar camera scan must pass QR mode and target MAC to the shared automatic-start policy'
)
assert(
	bleScanSource.includes('targetMac: targetMac.value,'),
	'BLE scan page must pass its normalized QR target to the automatic-start policy'
)
assert(
	bleScanSource.includes("entrySource.value = m === 'qr' ? 'scan' : 'ble_search'"),
	'BLE scan page should distinguish camera matching from ordinary Bluetooth search'
)
assert(
	bleScanSource.includes('device_name=${encodeURIComponent(d.displayName)}${detailEntrySourceQuery()}'),
	'meter details selected from Bluetooth search should preserve the BLE search source'
)
assert(
	bleScanSource.includes("${detailEntrySourceQuery()}`"),
	'BMS provision selected from Bluetooth search should preserve the BLE search source'
)
assert(
	homeSource.includes('`/pages/device-battery/detail?device_id=${encodeURIComponent(String(id || \'\'))}`'),
	'home device-list detail route should remain unmarked and preserve warm BLE behavior'
)
assert(
	orgDevicesSource.includes('`/pages/device-battery/detail?device_id=${encodeURIComponent(String(item.device_id))}`'),
	'organization device-list detail route should remain unmarked and preserve warm BLE behavior'
)

console.log('BLE search entry route tests passed')
