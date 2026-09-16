// Run: pnpm dlx tsx pages/device-battery/ota-debug-log.test.ts
import {
	appendOtaDebugLog, copyOtaDebugLogs, formatOtaDebugLogs, getOtaDebugLogs,
	otaDebugLogs, resetOtaDebugLog, setOtaDebugLogDeferred,
} from './ota-debug-log'
import { BmsProtocolError } from '../../common/lib/bms-protocol/frame'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

function bootDataFrameHex(packetIndex: number, packetSize = 64): string {
	const bytes = new Uint8Array(packetSize + 11)
	bytes[0] = 0x55
	bytes[1] = 0xfe
	bytes[2] = 0xfc
	bytes[3] = 0x53
	bytes[4] = ((packetSize + 2) >>> 8) & 0xff
	bytes[5] = (packetSize + 2) & 0xff
	bytes[6] = (packetIndex >>> 8) & 0xff
	bytes[7] = packetIndex & 0xff
	bytes[bytes.length - 1] = 0xfd
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function bootAckFrameHex(requested: number, status = 0): string {
	const bytes = Uint8Array.from([
		0x55, 0xfc, 0xfe, 0x53, 0, 3, status & 0xff,
		(requested >>> 8) & 0xff, requested & 0xff, 0, 0, 0xfd,
	])
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function messageHex(message: string): string {
	return message.match(/\bhex=([0-9A-F]+)/)?.[1] || ''
}

async function run() {
	let writes = 0
	let clipboard = ''
	;(globalThis as any).uni = {
		setStorageSync: () => { writes++ },
		removeStorageSync: () => {},
		setClipboardData: (options: any) => { clipboard = options.data; options.success() },
	}
	resetOtaDebugLog()
	setOtaDebugLogDeferred(true)
	const before = writes
	const displayed = otaDebugLogs.value
	for (let index = 0; index < 6100; index++) {
		appendOtaDebugLog({ message: `packet ${index}`, data: { index } })
	}
	assert(writes === before && otaDebugLogs.value === displayed, 'Boot packet logs must not synchronously persist or replace the reactive list')
	assert(getOtaDebugLogs().length === 6000 && getOtaDebugLogs()[0].message === 'packet 100', 'in-memory logs must retain the bounded latest entries')
	assert(formatOtaDebugLogs().includes('packet 6099'), 'export must include the current in-memory tail')
	await copyOtaDebugLogs()
	assert(clipboard.includes('packet 6099'), 'copy during Boot must use live memory, not the stale UI snapshot')
	setOtaDebugLogDeferred(false)
	assert(writes === before + 1 && otaDebugLogs.value.length === 6000, 'session end must publish and persist exactly once')
	setOtaDebugLogDeferred(false)
	assert(writes === before + 1, 'repeated cleanup must not persist again')

	setOtaDebugLogDeferred(true)
	resetOtaDebugLog({ retry: true })
	assert(writes === before + 1 && getOtaDebugLogs().length === 1, 'reset during Boot must clear memory without blocking storage work')
	setOtaDebugLogDeferred(true)
	appendOtaDebugLog({ level: 'error', message: 'test failure', data: new Error('native failure') })
	assert(getOtaDebugLogs().length === 2, 're-entering deferred mode must not replace the buffered logs')
	setOtaDebugLogDeferred(false)
	assert(Number(otaDebugLogs.value.length) === 2 && writes === before + 2, 'failure logs must remain available after cleanup')
	;(globalThis as any).uni.setStorageSync = () => { throw new Error('storage full') }
	setOtaDebugLogDeferred(true)
	appendOtaDebugLog({ message: 'success' })
	setOtaDebugLogDeferred(false)
	const logs = getOtaDebugLogs()
	assert(logs[logs.length - 1]?.message === 'success', 'storage failure must not destroy logs or fail a completed OTA')

	setOtaDebugLogDeferred(true)
	resetOtaDebugLog({ packetTotal: 1585 })
	appendOtaDebugLog({ scope: 'ble', message: '[ble] OTA exclusive session ready' })
	for (let packetIndex = 0; packetIndex < 1585; packetIndex++) {
		const requested = packetIndex + 1
		const txHex = bootDataFrameHex(packetIndex)
		const rxHex = bootAckFrameHex(requested)
		appendOtaDebugLog({ scope: 'boot', message: '[boot] tx', data: { cmd: '0x53', len: 75, hex: txHex } })
		appendOtaDebugLog({ scope: 'ble', message: '[ble] OTA whole-frame write', data: { frameLen: 75, writeCapacity: 185, writeType: 'write' } })
		appendOtaDebugLog({ scope: 'ble', message: `[ble] tx frame len=75 hex=${txHex}` })
		appendOtaDebugLog({ scope: 'ble', message: `[ble] rx frame len=12 hex=${rxHex}` })
		appendOtaDebugLog({ scope: 'boot', message: '[boot] rx', data: { len: 12, hex: rxHex } })
		appendOtaDebugLog({ scope: 'boot', message: '[boot] packet ack', data: { packetIndex, status: 0, requested } })
	}
	appendOtaDebugLog({ scope: 'ble', message: '[ble] OTA exclusive session ended' })
	const compactLogs = getOtaDebugLogs()
	assert(compactLogs[0]?.message === 'debug session started', 'a 1585-packet session must retain its start metadata')
	assert(compactLogs.filter((item) => item.message === '[boot] packet ack').length === 1585, 'each packet must retain one core Boot ACK record')
	assert(!compactLogs.some((item) => /^\[boot\]\s+(?:tx|rx)$/.test(item.message)), 'duplicate Boot-layer 0x53 hex must be dropped')
	assert(compactLogs.filter((item) => item.message.includes('[ble] tx frame')).length === 26, 'BLE TX hex must keep only first, 4KB boundaries, and last packet')
	assert(compactLogs.filter((item) => item.message.includes('[ble] rx frame')).length === 26, 'BLE RX hex must keep only first, 4KB boundaries, and last ACK')
	assert(compactLogs.length < 2000, 'a complete 1585-packet session must stay well below the 6000-entry cap')

	resetOtaDebugLog({ transport: 'socket', packetTotal: 130 })
	appendOtaDebugLog({ scope: 'socket', message: '[socket] OTA exclusive session ready' })
	for (let packetIndex = 0; packetIndex < 130; packetIndex++) {
		const requested = packetIndex + 1
		const txHex = bootDataFrameHex(packetIndex)
		const rxHex = bootAckFrameHex(requested)
		appendOtaDebugLog({ scope: 'boot', message: '[boot] tx', data: { cmd: '0x53', hex: txHex } })
		appendOtaDebugLog({ scope: 'socket', message: `[socket] tx frame len=75 hex=${txHex}` })
		appendOtaDebugLog({ scope: 'socket', message: `[socket] rx frame len=12 hex=${rxHex}` })
		appendOtaDebugLog({ scope: 'boot', message: '[boot] rx', data: { hex: rxHex } })
		appendOtaDebugLog({ scope: 'socket', message: '[socket] boot request timing', data: { cmd: '0x53', requested } })
		appendOtaDebugLog({ scope: 'boot', message: '[boot] packet ack', data: { packetIndex, status: 0, requested } })
	}
	appendOtaDebugLog({ scope: 'socket', message: '[socket] OTA exclusive session ended' })
	const socketLogs = getOtaDebugLogs()
	const socketTxHex = socketLogs.filter((item) => item.message.includes('[socket] tx frame')).map((item) => messageHex(item.message))
	const socketRxHex = socketLogs.filter((item) => item.message.includes('[socket] rx frame')).map((item) => messageHex(item.message))
	assert(
		socketTxHex.join(',') === [0, 64, 128, 129].map((sequence) => bootDataFrameHex(sequence)).join(','),
		'Socket TX hex must keep exactly the first packet, 4KB page starts, and final packet'
	)
	assert(
		socketRxHex.join(',') === [1, 64, 128, 130].map((requested) => bootAckFrameHex(requested)).join(','),
		'Socket RX hex must keep exactly the first ACK, 4KB confirmations, and final ACK'
	)
	const socketAcks = socketLogs.filter((item) => item.message === '[boot] packet ack')
	assert(socketAcks.length === 130, 'Socket must retain exactly one structured ACK per ordinary 0x53 packet')
	assert(!socketLogs.some((item) => item.message === '[socket] boot request timing'), 'Socket per-packet timing duplicates must be dropped')

	resetOtaDebugLog({ transport: 'socket-retry' })
	appendOtaDebugLog({ scope: 'socket', message: '[socket] OTA exclusive session ready' })
	const socketRetryHex = bootDataFrameHex(5)
	appendOtaDebugLog({ scope: 'socket', message: `[socket] tx frame len=75 hex=${socketRetryHex}` })
	appendOtaDebugLog({ scope: 'socket', message: `[socket] tx frame len=75 hex=${socketRetryHex}` })
	appendOtaDebugLog({ scope: 'socket', message: `[socket] rx frame len=12 hex=${bootAckFrameHex(5, 3)}` })
	appendOtaDebugLog({ scope: 'socket', level: 'warn', message: '[socket] boot request failed', data: { cmd: '0x53' } })
	appendOtaDebugLog({ scope: 'socket', message: '[socket] OTA exclusive session ended' })
	const socketRetryLogs = getOtaDebugLogs()
	assert(socketRetryLogs.filter((item) => item.message.includes('[socket] tx frame')).length === 1, 'Socket retry hex must be retained once')
	assert(socketRetryLogs.some((item) => item.message.includes('[socket] rx frame')), 'Socket nonzero-status ACK hex must be retained')
	assert(socketRetryLogs.some((item) => item.message === '[socket] boot request failed'), 'Socket request exceptions must be retained')

	setOtaDebugLogDeferred(true)
	resetOtaDebugLog()
	const retryHex = bootDataFrameHex(5)
	appendOtaDebugLog({ scope: 'ble', message: `[ble] tx frame len=75 hex=${retryHex}` })
	appendOtaDebugLog({ scope: 'ble', message: `[ble] tx frame len=75 hex=${retryHex}` })
	appendOtaDebugLog({ scope: 'ble', message: `[ble] rx frame len=12 hex=${bootAckFrameHex(5, 3)}` })
	const nativeError = new BmsProtocolError('BLE OTA write failed', { errCode: 10006, errMsg: 'connection lost' })
	appendOtaDebugLog({ level: 'error', scope: 'ble', message: '[ble] OTA whole-frame write failed', data: { error: nativeError } })
	const exceptionalLogs = getOtaDebugLogs()
	assert(exceptionalLogs.filter((item) => item.message.includes('[ble] tx frame')).length === 1, 'a repeated packet must retain its retry hex')
	assert(exceptionalLogs.some((item) => item.message.includes('[ble] rx frame')), 'a nonzero Boot status must retain its response hex')
	assert(formatOtaDebugLogs().includes('"errCode":10006') && formatOtaDebugLogs().includes('connection lost'), 'BmsProtocolError.extra must retain native error details')
	setOtaDebugLogDeferred(false)
	console.log('OTA deferred logging tests passed')
}

void run()
