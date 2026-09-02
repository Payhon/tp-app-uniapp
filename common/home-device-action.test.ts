import { resolveHomeDeviceActionId } from './home-device-action'

function assertEqual(actual: unknown, expected: unknown, message: string) {
	if (actual !== expected) throw new Error(`${message}: got ${String(actual)}, want ${String(expected)}`)
}

assertEqual(resolveHomeDeviceActionId({ id: 'device-123' }), 'device-123', 'valid id')
assertEqual(resolveHomeDeviceActionId({ id: '  device-456  ' }), 'device-456', 'trimmed id')
assertEqual(resolveHomeDeviceActionId({ id: undefined }), '', 'undefined property')
assertEqual(resolveHomeDeviceActionId({ id: null }), '', 'null property')
assertEqual(resolveHomeDeviceActionId({ id: 'undefined' }), '', 'undefined string')
assertEqual(resolveHomeDeviceActionId({ id: 'null' }), '', 'null string')
assertEqual(resolveHomeDeviceActionId({ id: '[object Object]' }), '', 'stringified object')
assertEqual(
	resolveHomeDeviceActionId({
		type: 'longpress',
		detail: { x: 100, y: 200 },
	} as unknown as { id?: unknown }),
	'',
	'native longpress event object'
)

console.log('home device action policy tests passed')
