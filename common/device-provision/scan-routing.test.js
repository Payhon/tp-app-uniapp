const { resolveAddDeviceScanRoute } = require('./scan-routing.js')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const bound = resolveAddDeviceScanRoute(
  { type: 'uuid', value: '00112233445566778899AABBCCDDEEFF' },
  [{ device_id: 'device-A', item_uuid: '00112233445566778899AABBCCDDEEFF' }]
)
assert(bound.action === 'bound_detail', 'bound scan should open device detail')
assert(bound.url.includes('entry_source=scan'), 'bound scan detail should preserve scan entry source')

const uuidBind = resolveAddDeviceScanRoute(
  { type: 'uuid', value: '00112233445566778899AABBCCDDEEFF' },
  []
)
assert(uuidBind.action === 'uuid_bind', 'unbound UUID scan should open UUID bind')
assert(uuidBind.url.includes('entry_source=scan'), 'UUID bind should preserve scan entry source')

const bmsProvision = resolveAddDeviceScanRoute(
  { type: 'mac', value: 'AC1122334455', deviceType: 'bms' },
  []
)
assert(bmsProvision.action === 'bms_provision', 'unbound BMS scan should open BLE provision')
assert(bmsProvision.url.includes('entry_source=scan'), 'BLE provision should preserve scan entry source')

console.log('scan routing tests passed')
