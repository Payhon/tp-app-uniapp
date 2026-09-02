import {
	formatDetailMac,
	normalizeDetailUuid,
	resolveDashboardDeviceIdentifier,
} from './device-detail-identifier'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const fourG = resolveDashboardDeviceIdentifier({
	connType: 'mqtt',
	bmsCommType: 2,
	imei: '862415074075885',
	batteryBleMac: 'AC1122334455',
})
assert(fourG.kind === 'imei' && fourG.text === 'IMEI: 862415074075885', '4G must display IMEI')

const dualOffline = resolveDashboardDeviceIdentifier({
	connType: 'offline',
	bmsCommType: 3,
	imei: '860000000000003',
	batteryBleMac: 'AC1122334455',
})
assert(dualOffline.kind === 'imei' && dualOffline.value === '860000000000003', 'offline dual-mode must keep IMEI')

const missingImei = resolveDashboardDeviceIdentifier({
	connType: 'mqtt',
	bmsCommType: 3,
	imei: ' ',
	batteryBleMac: 'AC1122334455',
})
assert(missingImei.text === 'IMEI: -', 'missing 4G IMEI must not fall back to MAC')

const dualBluetooth = resolveDashboardDeviceIdentifier({
	connType: 'bluetooth',
	bmsCommType: 3,
	imei: '860000000000003',
	batteryBleMac: 'AC1122334455',
})
assert(dualBluetooth.kind === 'mac' && dualBluetooth.text === 'AC:11:22:33:44:55', 'dual-mode Bluetooth must display MAC')

const bluetooth = resolveDashboardDeviceIdentifier({
	connType: 'bluetooth',
	bmsCommType: 1,
	batteryBleMac: ' ',
	statusBleMac: 'ac-a1-b2-c3-d4-e5',
})
assert(bluetooth.text === 'AC:A1:B2:C3:D4:E5', 'blank battery MAC must fall back to formatted status MAC')
assert(formatDetailMac('') === '-', 'empty MAC must display a dash')
assert(normalizeDetailUuid(' 00112233445566778899AABBCCDDEEFF ') === '00112233445566778899AABBCCDDEEFF', 'UUID must trim outer whitespace')
assert(normalizeDetailUuid(null) === '', 'missing UUID must stay empty for disabled copy')

console.log('device detail identifier tests passed')
