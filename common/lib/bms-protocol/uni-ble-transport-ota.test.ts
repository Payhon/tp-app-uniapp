// Run: pnpm dlx tsx common/lib/bms-protocol/uni-ble-transport-ota.test.ts
import { buildBootFrame } from './boot-frame'
import { BmsProtocolError } from './frame'
import { createUniBleBmsTransport } from './uni-ble-transport'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

type NativeOptions = Record<string, any>
type LogEntry = { level: 'debug' | 'info' | 'warn' | 'error'; args: unknown[] }

function dataFrame(index: number, targetAddress = 0x01) {
	const payload = new Uint8Array(66)
	payload[0] = (index >> 8) & 0xff
	payload[1] = index & 0xff
	return buildBootFrame({ targetAddress, command: 0x53, payload })
}

function ack(frame: Uint8Array, requested: number, status = 0) {
	return buildBootFrame({
		sourceAddress: frame[2],
		targetAddress: frame[1],
		command: frame[3],
		payload: [status, (requested >> 8) & 0xff, requested & 0xff],
	})
}

function createReadyTransport({
	platform = 'android',
	write = null,
	writeNoResponse = null,
	read = null,
}: {
	platform?: 'android' | 'ios'
	write?: boolean | null
	writeNoResponse?: boolean | null
	read?: boolean | null
} = {}) {
	const logs: LogEntry[] = []
	let writeHandler = (_options: NativeOptions) => {}
	let readHandler = (options: NativeOptions) => options.success?.({})
	const transport = createUniBleBmsTransport({
		minFrameIntervalMs: 0,
		logger: {
			debug: (...args) => logs.push({ level: 'debug', args }),
			info: (...args) => logs.push({ level: 'info', args }),
			warn: (...args) => logs.push({ level: 'warn', args }),
			error: (...args) => logs.push({ level: 'error', args }),
		},
	})
	Object.assign(transport, {
		deviceId: 'AA:BB:CC:DD:EE:FF',
		serviceId: 'service',
		writeCharId: 'write',
		notifyCharId: 'notify',
		writeChunkSize: 185,
	})
	Object.assign(transport as any, {
		_connected: true,
		_platform: platform,
		_writeSupportsResponse: write,
		_writeSupportsNoResponse: writeNoResponse,
		_notifySupportsRead: read,
		_preferWriteWithResponse: platform === 'ios' && write === true,
	})
	;(globalThis as any).uni = {
		writeBLECharacteristicValue: (options: NativeOptions) => writeHandler(options),
		readBLECharacteristicValue: (options: NativeOptions) => readHandler(options),
		onBLEConnectionStateChange: () => {},
	}
	return {
		transport,
		logs,
		setWriter: (handler: typeof writeHandler) => { writeHandler = handler },
		setReader: (handler: typeof readHandler) => { readHandler = handler },
	}
}

async function testMtuAndWholeFrameGuard() {
	let mtuResponse: Record<string, unknown> | null = {}
	let mtuError: Error | null = null
	;(globalThis as any).uni = {
		setBLEMTU: (options: NativeOptions) => {
			if (mtuError) return options.fail?.(mtuError)
			options.success?.(mtuResponse || {})
		},
	}
	const transport = createUniBleBmsTransport({ minFrameIntervalMs: 0, logger: {} })
	transport.deviceId = 'AA:BB:CC:DD:EE:FF'

	mtuResponse = { mtu: 78 }
	assert((await transport.setMtu(512)) === 78, 'reported MTU must be used')
	assert(transport.writeChunkSize === 75, 'ATT payload must equal reported MTU minus three')

	mtuResponse = {}
	assert((await transport.setMtu(512)) === null, 'missing negotiated MTU must remain unknown')
	assert(Number(transport.writeChunkSize) === 75, 'unknown MTU must preserve the previous write capacity')

	mtuResponse = { mtu: 512 }
	assert((await transport.setMtu(512)) === 512 && Number(transport.writeChunkSize) === 509, 'MTU 512 must use ATT payload 509')
	mtuResponse = { mtu: 77 }
	assert((await transport.setMtu(512)) === 77 && Number(transport.writeChunkSize) === 74, 'insufficient MTU must not be inflated')

	mtuError = new Error('setBLEMTU failed')
	const rejected = await transport.setMtu(512).then(() => false, () => true)
	assert(rejected && Number(transport.writeChunkSize) === 74, 'MTU failure must retain the previous write capacity')

	mtuError = null
	;(transport as any)._connected = true
	transport.serviceId = 'service'
	transport.writeCharId = 'write'
	await transport.beginExclusiveBootSession()
	const frame = dataFrame(0)
	assert(frame.length === 75, '64-byte OTA payload must produce one 75-byte Boot frame')
	const frameRejected = await transport.writeFrame(frame).then(
		() => false,
		(error) => String((error as Error)?.message || error).startsWith('boot_ble_frame_exceeds_mtu')
	)
	assert(frameRejected, 'OTA data frame must never be split across BLE writes')
	transport.endExclusiveBootSession()
}

async function testCapabilityMatrix() {
	const cases = [
		{ name: 'both', write: true, writeNoResponse: true, expected: 'write' },
		{ name: 'response-only', write: true, writeNoResponse: false, expected: 'write' },
		{ name: 'response-with-unknown-no-response', write: true, writeNoResponse: null, expected: 'write' },
		{ name: 'no-response-only', write: false, writeNoResponse: true, expected: 'writeNoResponse' },
		{ name: 'no-response-with-unknown-response', write: null, writeNoResponse: true, expected: 'writeNoResponse' },
		{ name: 'legacy-no-response-unknown', write: false, writeNoResponse: null, expected: 'writeNoResponse' },
		{ name: 'legacy-unknown', write: null, writeNoResponse: null, expected: 'writeNoResponse' },
	] as const

	for (const item of cases) {
		const link = createReadyTransport(item)
		const calls: NativeOptions[] = []
		link.setWriter((options) => {
			calls.push(options)
			options.success?.({})
			setTimeout(() => link.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer), 0)
		})
		await link.transport.beginExclusiveBootSession()
		const readyLog = link.logs.find(({ args }) => args[0] === '[ble] OTA exclusive session ready')
		const readyData = readyLog?.args[1] as Record<string, unknown> | undefined
		assert(
			readyData?.supportsWrite === item.write && readyData?.supportsWriteNoResponse === item.writeNoResponse,
			`${item.name}: OTA log must retain the reported write capabilities`
		)
		await link.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 })
		assert(calls.length === 1 && calls[0].writeType === item.expected, `${item.name}: wrong Android Boot write type`)
		assert(calls[0].value.byteLength === 75, `${item.name}: Boot frame must remain one native write`)
		link.transport.endExclusiveBootSession()
	}

	for (const capabilities of [
		{ write: false, writeNoResponse: false },
		{ write: null, writeNoResponse: false },
	] as const) {
		const unsupported = createReadyTransport(capabilities)
		let writes = 0
		unsupported.setWriter(() => { writes++ })
		const unsupportedError = await unsupported.transport.beginExclusiveBootSession().then(
			() => null,
			(error) => error as Error
		)
		assert(unsupportedError instanceof BmsProtocolError && writes === 0, 'unsupported no-response mode without confirmed response write must fail before any Boot command')
	}

	const ios = createReadyTransport({ platform: 'ios', write: true, writeNoResponse: true })
	let iosWrite: NativeOptions | null = null
	ios.setWriter((options) => {
		iosWrite = options
		options.success?.({})
		setTimeout(() => ios.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer), 0)
	})
	await ios.transport.beginExclusiveBootSession()
	await ios.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 })
	assert(iosWrite != null && !('writeType' in iosWrite), 'iOS must retain its existing default response-write API mode')
	ios.transport.endExclusiveBootSession()
}

async function testResponseWriteFallback() {
	const link = createReadyTransport({ write: true, writeNoResponse: true })
	const calls: NativeOptions[] = []
	link.setWriter((options) => {
		calls.push(options)
		if (calls.length === 1) return options.fail?.({ errCode: 10007, errMsg: 'property not support' })
		options.success?.({})
		const index = calls.length === 2 ? 0 : 1
		setTimeout(() => link.transport._onNotify(ack(dataFrame(index), index + 1).buffer as ArrayBuffer), 0)
	})
	await link.transport.beginExclusiveBootSession()
	await link.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 })
	await link.transport.request(dataFrame(1), { timeoutMs: 80, bootAckGraceMs: 20 })
	assert(
		calls.map((call) => call.writeType).join(',') === 'write,writeNoResponse,writeNoResponse',
		'10007 must retry the same frame once with no-response and downgrade only the current OTA session'
	)
	assert(link.logs.some(({ args }) => String(args[0]).includes('fallback to writeNoResponse')), '10007 fallback must be diagnosable')
	link.transport.endExclusiveBootSession()

	const noFallback = createReadyTransport({ write: true, writeNoResponse: false })
	let responseOnlyWrites = 0
	noFallback.setWriter((options) => {
		responseOnlyWrites++
		options.fail?.({ errCode: 10007, errMsg: 'property not support' })
	})
	await noFallback.transport.beginExclusiveBootSession()
	const error = await noFallback.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 }).then(
		() => null,
		(caught) => caught as BmsProtocolError
	)
	assert(error instanceof BmsProtocolError && responseOnlyWrites === 1, 'response-only capability must not fall back to an explicitly unsupported mode')
	assert((error.extra as { errCode?: number })?.errCode === 10007, 'native capability error details must be retained')
	noFallback.transport.endExclusiveBootSession()

	const iosNoFallback = createReadyTransport({ platform: 'ios', write: true, writeNoResponse: true })
	let iosWrites = 0
	iosNoFallback.setWriter((options) => {
		iosWrites++
		options.fail?.({ errCode: 10007, errMsg: 'property not support' })
	})
	await iosNoFallback.transport.beginExclusiveBootSession()
	const iosError = await iosNoFallback.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 }).then(
		() => null,
		(caught) => caught as BmsProtocolError
	)
	assert(iosError instanceof BmsProtocolError && iosWrites === 1, 'Android capability fallback must not change the iOS Boot write path')
	iosNoFallback.transport.endExclusiveBootSession()

	const unrelatedUnsupported = createReadyTransport({ write: true, writeNoResponse: true })
	let unrelatedWrites = 0
	unrelatedUnsupported.setWriter((options) => {
		unrelatedWrites++
		options.fail?.({ errCode: 10008, errMsg: 'bluetooth adapter not supported' })
	})
	await unrelatedUnsupported.transport.beginExclusiveBootSession()
	await unrelatedUnsupported.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 }).catch(() => undefined)
	assert(unrelatedWrites === 1, 'only 10007/property-not-support may trigger the same-frame fallback')
	unrelatedUnsupported.transport.endExclusiveBootSession()
}

async function testNativeCallbackRaces() {
	const successFirst = createReadyTransport({ write: true, writeNoResponse: true })
	let successFirstSettled = false
	successFirst.setWriter((options) => {
		options.success?.({})
	})
	await successFirst.transport.beginExclusiveBootSession()
	const successFirstRequest = successFirst.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 }).then((value) => {
		successFirstSettled = true
		return value
	})
	await wait(5)
	const successDiagnostic = (successFirst.transport as any)._pending?.nativeWrites?.[0]
	assert(successDiagnostic?.outcome === 'success' && !successFirstSettled, 'native success must be recorded without completing the protocol request')
	successFirst.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer)
	await successFirstRequest
	successFirst.transport.endExclusiveBootSession()

	const ackFirst = createReadyTransport({ write: true, writeNoResponse: true })
	let ackFirstDiagnostic: { outcome?: string } | null = null
	ackFirst.setWriter((options) => {
		ackFirstDiagnostic = (ackFirst.transport as any)._pending?.nativeWrites?.[0]
		ackFirst.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer)
		setTimeout(() => options.success?.({}), 10)
	})
	await ackFirst.transport.beginExclusiveBootSession()
	const ackStartedAt = Date.now()
	await ackFirst.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 })
	assert(Date.now() - ackStartedAt < 50, 'Boot ACK must not wait for a native success callback')
	await wait(20)
	assert((ackFirstDiagnostic as any)?.outcome === 'late_success', 'success arriving after Boot ACK must stay attached to its old write')
	ackFirst.transport.endExclusiveBootSession()

	const lateFailure = createReadyTransport({ write: true, writeNoResponse: true })
	let firstOptions: NativeOptions | null = null
	let lateFailureDiagnostic: { outcome?: string } | null = null
	let writeCount = 0
	lateFailure.setWriter((options) => {
		writeCount++
		if (writeCount === 1) {
			firstOptions = options
			lateFailureDiagnostic = (lateFailure.transport as any)._pending?.nativeWrites?.[0]
			lateFailure.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer)
			return
		}
		firstOptions?.fail?.({ errCode: 10006, errMsg: 'late old write failure' })
		options.success?.({})
		lateFailure.transport._onNotify(ack(dataFrame(1), 2).buffer as ArrayBuffer)
	})
	await lateFailure.transport.beginExclusiveBootSession()
	await lateFailure.transport.request(dataFrame(0), { timeoutMs: 80, bootAckGraceMs: 20 })
	await lateFailure.transport.request(dataFrame(1), { timeoutMs: 80, bootAckGraceMs: 20 })
	assert((lateFailureDiagnostic as any)?.outcome === 'late_failure', 'late failure must stay attached to its old write')
	assert(lateFailure.logs.some(({ args }) => String(args[0]).includes('late native write failure ignored')), 'late failure must be diagnosable')
	lateFailure.transport.endExclusiveBootSession()

	const activeFailure = createReadyTransport({ write: true, writeNoResponse: true })
	activeFailure.setWriter((options) => options.fail?.(Object.assign(new Error('connection lost'), { code: 10006 })))
	await activeFailure.transport.beginExclusiveBootSession()
	const activeError = await activeFailure.transport.request(dataFrame(0), { timeoutMs: 450, bootAckGraceMs: 220 }).then(
		() => null,
		(caught) => caught as BmsProtocolError
	)
	assert(activeError?.message === 'BLE OTA write failed', 'active native failure must stop immediately instead of becoming an ACK timeout')
	assert((activeError?.extra as { errCode?: number })?.errCode === 10006, 'active native failure details must be retained')
	assert((activeError?.extra as { errMsg?: string })?.errMsg === 'connection lost', 'native Error message must be serialized into diagnostics')
	activeFailure.transport.endExclusiveBootSession()

	const noCallback = createReadyTransport({ write: true, writeNoResponse: true })
	noCallback.setWriter(() => {
		setTimeout(() => noCallback.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer), 350)
	})
	await noCallback.transport.beginExclusiveBootSession()
	const startedAt = Date.now()
	await noCallback.transport.request(dataFrame(0), { timeoutMs: 450, bootAckGraceMs: 220 })
	assert(Date.now() - startedAt >= 320 && Date.now() - startedAt < 450, '300ms native callback timeout must not reject or delay the later Boot ACK')
	assert(
		noCallback.logs.some(({ args }) => String(args[0]).includes('OTA native write callback timeout')),
		'missing native callback must emit one bounded 300ms diagnostic'
	)
	noCallback.transport.endExclusiveBootSession()
}

async function testReadProbeAndDeadline() {
	const recovered = createReadyTransport({ write: true, writeNoResponse: true, read: true })
	let recoveredReads = 0
	recovered.setWriter((options) => options.success?.({}))
	recovered.setReader((options) => {
		recoveredReads++
		options.success?.({})
		recovered.transport._onNotify(ack(dataFrame(0), 1).buffer as ArrayBuffer)
	})
	await recovered.transport.beginExclusiveBootSession()
	const recoveredAt = Date.now()
	await recovered.transport.request(dataFrame(0), { timeoutMs: 450, bootAckGraceMs: 220 })
	const recoveredElapsed = Date.now() - recoveredAt
	assert(recoveredReads === 1 && recoveredElapsed >= 400 && recoveredElapsed < 670, 'Android read probe must run once at the 450ms base timeout and recover within the original deadline')
	recovered.transport.endExclusiveBootSession()

	const timedOut = createReadyTransport({ write: true, writeNoResponse: true, read: true })
	let timeoutReads = 0
	timedOut.setWriter((options) => options.success?.({}))
	timedOut.setReader((options) => { timeoutReads++; options.success?.({}) })
	await timedOut.transport.beginExclusiveBootSession()
	const timeoutAt = Date.now()
	const timeoutError = await timedOut.transport.request(dataFrame(192), { timeoutMs: 450, bootAckGraceMs: 220 }).then(
		() => null,
		(error) => error as Error
	)
	const timeoutElapsed = Date.now() - timeoutAt
	assert(timeoutReads === 1, 'read probe must run at most once per data attempt')
	assert(timeoutElapsed >= 630 && timeoutElapsed < 900, `read probe must not extend the 670ms deadline, got ${timeoutElapsed}ms`)
	assert(timeoutError?.message.includes('450ms + 220ms grace'), 'timeout must retain the 450ms + 220ms contract')
	timedOut.transport.endExclusiveBootSession()

	// 当前OTA不再使用宽限；即使特征可读，也不能在超时重发同时启动旧探测。
	const noGrace = createReadyTransport({ write: true, writeNoResponse: true, read: true })
	let noGraceReads = 0
	noGrace.setWriter((options) => options.success?.({}))
	noGrace.setReader((options) => { noGraceReads++; options.success?.({}) })
	await noGrace.transport.beginExclusiveBootSession()
	for (const timeoutMs of [800, 450]) {
		const error = await noGrace.transport.request(dataFrame(0), { timeoutMs, bootAckGraceMs: 0 }).then(
			() => null, (error) => error as Error
		)
		assert(error?.message.includes(`${timeoutMs}ms + 0ms grace`), 'new deadline must have no grace')
		assert(noGraceReads === 0, 'zero grace must never schedule a read probe')
	}
	noGrace.transport.endExclusiveBootSession()
}

async function testInvalidRxDiagnosticsAndSequence192() {
	const link = createReadyTransport({ write: true, writeNoResponse: true, read: false })
	const sentIndexes: number[] = []
	let requestAttempt = 0
	link.setWriter((options) => {
		options.success?.({})
		const sent = new Uint8Array(options.value as ArrayBuffer)
		sentIndexes.push((sent[6] << 8) | sent[7])
		requestAttempt++
		if (requestAttempt !== 1) return
		const corrupt = ack(dataFrame(192), 193)
		corrupt[corrupt.length - 2] ^= 1
		setTimeout(() => {
			link.transport._onNotify(corrupt.buffer as ArrayBuffer)
			link.transport._onNotify(ack(dataFrame(192), 192).buffer as ArrayBuffer)
		}, 5)
	})
	await link.transport.beginExclusiveBootSession()
	const errors: BmsProtocolError[] = []
	for (let attempt = 0; attempt < 2; attempt += 1) {
		const error = await link.transport.request(dataFrame(192), { timeoutMs: 35, bootAckGraceMs: 20 }).then(
			() => null,
			(caught) => caught as BmsProtocolError
		)
		assert(error instanceof BmsProtocolError, `seq192 attempt ${attempt + 1} must time out`)
		errors.push(error)
	}
	assert(sentIndexes.join(',') === '192,192', 'a missing seq192 ACK must never mutate or advance the transport frame to seq193')
	const firstExtra = errors[0].extra as Record<string, unknown>
	assert(Number(firstExtra.rxChunkCount) === 2, 'timeout diagnostics must count all RX chunks')
	assert(Number(firstExtra.rxByteCount) > 0, 'timeout diagnostics must retain the received byte count')
	assert(Number(firstExtra.invalidBootFrameCount) >= 1, 'invalid Boot frame count must survive collector resynchronization')
	assert(Number(firstExtra.unexpectedFrameCount) >= 1, 'valid but stale ACK must be distinguished from total radio silence')
	assert(String(firstExtra.lastBootParseError || '').length > 0, 'last Boot parse error must be attached to the timeout')
	link.transport.endExclusiveBootSession()
}

async function main() {
	await testMtuAndWholeFrameGuard()
	await testCapabilityMatrix()
	await testResponseWriteFallback()
	await testNativeCallbackRaces()
	await testReadProbeAndDeadline()
	await testInvalidRxDiagnosticsAndSequence192()
	console.log('BLE OTA transport tests passed')
}

void main()
