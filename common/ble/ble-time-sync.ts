import type { BmsClient } from '../lib/bms-protocol/client'
import { isBmsMac } from '../device-provision/device-prefix-shared'

// 每次物理重连创建新 client；配网交接与缓存复用保持同一个 client。
const attempts = new WeakMap<BmsClient, Promise<void>>()

export function syncBleBmsTimeOnce(client: BmsClient, connectionMac: string | null, bmsCommType?: number | null): Promise<void> {
	if (bmsCommType !== 1 || !connectionMac || !isBmsMac(connectionMac)) return Promise.resolve()
	const pending = attempts.get(client)
	if (pending) return pending
	// 在实际发送前登记，所有并发调用等待同一次尝试（失败也不重发）。
	const task = Promise.resolve().then(async () => {
		const timestampSeconds = Math.floor(Date.now() / 1000)
		try {
			await client.syncTime(timestampSeconds, {
				timeoutMs: 3000,
				writeApiTimeoutMs: 3000,
				disableAlternateWriteRetry: true,
			})
			console.log('[ble-time-sync] acknowledged', { mac: connectionMac, timestampSeconds })
		} catch (error) {
			console.warn('[ble-time-sync] failed', { mac: connectionMac, timestampSeconds, error: error instanceof Error ? error.message : String(error) })
		}
	})
	attempts.set(client, task)
	return task
}
