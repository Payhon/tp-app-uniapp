import { buildBootFrame } from '../../common/lib/bms-protocol/boot-frame'
import {
	buildMeterBmsOtaCheckPayload,
	normalizeBmsItemUuid,
	resolveMeterBmsOtaAvailability,
} from './meter-bms-ota-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const available = resolveMeterBmsOtaAvailability({
	connType: 'bluetooth',
	sessionMode: 'instrument',
	isMeterDevice: true,
	hasClient: true,
	hardwareModel: 'FJ-BMS-A',
	softwareVersion: 10,
})
assert(available.visible, 'meter BMS OTA card should be visible in a Bluetooth instrument session')
assert(available.enabled, 'meter BMS OTA card should be enabled when BMS identity is ready')
assert(available.model === 'FJ-BMS-A' && available.version === '10', 'BMS identity should be normalized')

const mqttState = resolveMeterBmsOtaAvailability({
	connType: 'mqtt',
	sessionMode: 'instrument',
	isMeterDevice: true,
	hasClient: true,
	hardwareModel: 'FJ-BMS-A',
	softwareVersion: 10,
})
assert(!mqttState.visible, 'meter BMS OTA card must not be visible for MQTT')

const cloudState = resolveMeterBmsOtaAvailability({
	connType: 'bluetooth',
	sessionMode: 'cloud',
	isMeterDevice: true,
	hasClient: true,
	hardwareModel: 'FJ-BMS-A',
	softwareVersion: 10,
})
assert(!cloudState.visible, 'meter BMS OTA card must not be visible outside the instrument session')

const missingIdentity = resolveMeterBmsOtaAvailability({
	connType: 'bluetooth',
	sessionMode: 'instrument',
	isMeterDevice: true,
	hasClient: true,
	hardwareModel: '',
	softwareVersion: null,
})
assert(missingIdentity.visible && !missingIdentity.enabled, 'card should remain visible but disabled without BMS identity')

assert(
	normalizeBmsItemUuid('00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff') ===
		'00112233445566778899AABBCCDDEEFF',
	'BMS UUID should be normalized to 32 uppercase hex characters'
)

const uuidPayload = buildMeterBmsOtaCheckPayload({
	itemUuid: '00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff',
	model: ' FJ-BMS-A ',
	version: 10,
})
assert(uuidPayload.item_uuid === '00112233445566778899AABBCCDDEEFF', 'valid UUID should be sent to OTA check')
assert(uuidPayload.model === 'FJ-BMS-A' && uuidPayload.version === '10', 'model and version should be sent to OTA check')

const fallbackPayload = buildMeterBmsOtaCheckPayload({ itemUuid: 'invalid', model: 'FJ-BMS-A', version: '10' })
assert(!fallbackPayload.item_uuid, 'invalid UUID should fall back to model and version matching')

const queryFrame = Array.from(buildBootFrame({ sourceAddress: 0xfe, targetAddress: 0x01, command: 0x50 }))
assert(
	queryFrame.join(',') === [0x55, 0xfe, 0x01, 0x50, 0x00, 0x00, 0x0c, 0x39, 0xfd].join(','),
	'meter passthrough BMS OTA must start with 55 FE 01 50 00 00 0C 39 FD'
)

console.log('meter passthrough BMS OTA policy tests passed')
