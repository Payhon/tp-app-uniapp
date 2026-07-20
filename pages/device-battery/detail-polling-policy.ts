export type DetailPollingTab = 0 | 1 | 2 | 3
export type DetailPollingConnType = 'bluetooth' | 'mqtt' | 'offline'

export type DetailPollingPolicy =
	| { mode: 'paused' }
	| { mode: 'normal' }
	| { mode: 'mqtt_keepalive'; intervalMs: number; initialDelayMs: number }

export const DETAIL_MQTT_KEEPALIVE_INTERVAL_MS = 30_000

export function resolveDetailPollingPolicy(options: {
	tab: DetailPollingTab
	connType: DetailPollingConnType
	hasClient: boolean
	connecting: boolean
}): DetailPollingPolicy {
	if (options.connecting || !options.hasClient) return { mode: 'paused' }

	if (options.tab === 2 || options.tab === 3) {
		if (options.connType !== 'mqtt') return { mode: 'paused' }
		return {
			mode: 'mqtt_keepalive',
			intervalMs: DETAIL_MQTT_KEEPALIVE_INTERVAL_MS,
			initialDelayMs: DETAIL_MQTT_KEEPALIVE_INTERVAL_MS,
		}
	}

	if (options.connType !== 'mqtt' && options.connType !== 'bluetooth') return { mode: 'paused' }
	return { mode: 'normal' }
}
