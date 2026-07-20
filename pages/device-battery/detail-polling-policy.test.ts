import { DETAIL_MQTT_KEEPALIVE_INTERVAL_MS, resolveDetailPollingPolicy } from './detail-polling-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const dashboardPolicy = resolveDetailPollingPolicy({
	tab: 0,
	connType: 'mqtt',
	hasClient: true,
	connecting: false,
})
assert(dashboardPolicy.mode === 'normal', 'MQTT dashboard should use normal realtime polling')

const paramsPolicy = resolveDetailPollingPolicy({
	tab: 2,
	connType: 'mqtt',
	hasClient: true,
	connecting: false,
})
assert(paramsPolicy.mode === 'mqtt_keepalive', 'MQTT params page should keep low-frequency polling active')
assert(paramsPolicy.intervalMs === 30_000, 'MQTT params polling interval should be 30 seconds')
assert(paramsPolicy.initialDelayMs === 30_000, 'first MQTT params keepalive poll should be delayed by 30 seconds')
assert(DETAIL_MQTT_KEEPALIVE_INTERVAL_MS < 180_000, 'MQTT keepalive interval should remain below the device sleep threshold')

const bleParamsPolicy = resolveDetailPollingPolicy({
	tab: 2,
	connType: 'bluetooth',
	hasClient: true,
	connecting: false,
})
assert(bleParamsPolicy.mode === 'paused', 'BLE params page should preserve paused polling behavior')

const historyPolicy = resolveDetailPollingPolicy({
	tab: 3,
	connType: 'mqtt',
	hasClient: true,
	connecting: false,
})
assert(historyPolicy.mode === 'mqtt_keepalive', 'MQTT history page should keep low-frequency polling active')
assert(historyPolicy.intervalMs === 30_000, 'MQTT history polling interval should be 30 seconds')
assert(historyPolicy.initialDelayMs === 30_000, 'first MQTT history keepalive poll should be delayed by 30 seconds')

const bleHistoryPolicy = resolveDetailPollingPolicy({
	tab: 3,
	connType: 'bluetooth',
	hasClient: true,
	connecting: false,
})
assert(bleHistoryPolicy.mode === 'paused', 'BLE history page should preserve paused polling behavior')

const pendingConnectionPolicy = resolveDetailPollingPolicy({
	tab: 2,
	connType: 'mqtt',
	hasClient: false,
	connecting: true,
})
assert(pendingConnectionPolicy.mode === 'paused', 'params keepalive should wait for the MQTT client to become ready')

console.log('detail polling policy tests passed')
