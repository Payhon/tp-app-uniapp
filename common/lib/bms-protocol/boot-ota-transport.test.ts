import { buildBootFrame, parseBootFrame } from './boot-frame'
import { bootOtaUpgrade, crc32 } from './boot-ota'
import { MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS } from './boot-ota-runtime-options'
import { BmsProtocolError, buildReadFrame } from './frame'
import type { BmsRequestOptions } from './types'
import { createUniBleBmsTransport } from './uni-ble-transport'
import { createUniMqttSocketBmsTransport } from './uni-mqtt-socket-transport'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const hex = (bytes: Uint8Array) => Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('')
const unhex = (value: string) => Uint8Array.from(value.match(/../g) || [], (v) => parseInt(v, 16))
const normalRequest = buildReadFrame({ targetAddress: 0x01, startAddress: 0x040d, quantity: 4 })
const normalResponse = unhex('7F5501FE030814140B5409603214D464FD')
const dataOptions = {
	timeoutMs: MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
	bootAckGraceMs: 0,
	disableAlternateWriteRetry: true,
}

function dataFrame(index: number, targetAddress = 0x01) {
	const payload = new Uint8Array(66)
	payload.set([index >> 8, index & 0xff])
	return buildBootFrame({ targetAddress, command: 0x53, payload })
}
function reply(frame: Uint8Array, payload: number[], command = frame[3]) {
	return buildBootFrame({ sourceAddress: frame[2], targetAddress: frame[1], command, payload })
}

async function createLink(kind: 'ble' | 'mqtt') {
	const sent: { frame: Uint8Array; at: number }[] = []
	let readProbeCount = 0
	let onWrite = (_frame: Uint8Array) => {}
	let onConnectionStateChange = (_connected: boolean) => {}
	let nextNativeWriteError: unknown = null
	let receive!: (bytes: Uint8Array) => void
	const record = (frame: Uint8Array) => {
		sent.push({ frame, at: Date.now() })
		onWrite(frame)
	}
	let transport: ReturnType<typeof createUniBleBmsTransport> | ReturnType<typeof createUniMqttSocketBmsTransport>
	if (kind === 'ble') {
		const ble = createUniBleBmsTransport({ minFrameIntervalMs: 0, logger: {} })
		Object.assign(ble, { deviceId: 'test-device', serviceId: 'service', writeCharId: 'write', notifyCharId: 'notify' })
		Object.assign(ble as any, { _connected: true, _platform: 'android', _writeSupportsResponse: true })
		;(globalThis as any).uni = {
			writeBLECharacteristicValue: (options: any) => {
				const error = nextNativeWriteError
				nextNativeWriteError = null
				record(new Uint8Array(options.value))
				if (error) options.fail?.(error)
			},
			readBLECharacteristicValue: (options: any) => { readProbeCount++; options.success?.({}) },
			closeBLEConnection: (options: any) => options.success?.({}),
			onBLEConnectionStateChange: (callback: (res: { deviceId: string; connected: boolean }) => void) => {
				onConnectionStateChange = (connected) => callback({ deviceId: 'test-device', connected })
			},
		}
		receive = (bytes) => ble._onNotify(Uint8Array.from(bytes).buffer)
		transport = ble
	} else {
		const handlers: Record<string, Function> = {}
		const task = {
			onOpen: (cb: Function) => { handlers.open = cb },
			onMessage: (cb: Function) => { handlers.message = cb },
			onClose: (cb: Function) => { handlers.close = cb },
			onError: (cb: Function) => { handlers.error = cb },
			close: () => {},
			send: ({ data, success }: { data: string; success?: Function }) => {
				success?.({})
				if (data[0] !== '{' && data !== 'ping') record(unhex(data))
			},
		}
		;(globalThis as any).uni = { connectSocket: () => task }
		const mqtt = createUniMqttSocketBmsTransport({
			wsUrl: 'wss://example.invalid/socket', deviceId: 'test-device', token: 'test-token',
			minFrameIntervalMs: 0, sleepWakeupResendDelayMs: 40, logger: {},
		})
		const connected = mqtt.connect()
		handlers.open()
		handlers.message({ data: JSON.stringify({ type: 'socket_ready', session_id: 'test-session' }) })
		await connected
		receive = (bytes) => handlers.message({ data: hex(bytes) })
		transport = mqtt
	}
	return {
		transport,
		sent,
		receive,
		readProbes: () => readProbeCount,
		setWriter: (fn: typeof onWrite) => { onWrite = fn },
		emitConnectionState: (connected: boolean) => onConnectionStateChange(connected),
		failNextNativeWrite: (error: unknown) => { nextNativeWriteError = error },
	}
}

async function run() {
	for (const kind of ['ble', 'mqtt'] as const) {
		const link = await createLink(kind)
		const { transport, sent, receive } = link
		try {
			await transport.beginExclusiveBootSession()
			for (const delayMs of [449, 500, 640]) {
				const countBefore = sent.length
				const started = Date.now()
				link.setWriter((frame) => {
					setTimeout(() => receive(reply(frame, [0, 0, 1])), Math.max(0, started + delayMs - Date.now()))
				})
				const response = await transport.request(dataFrame(0), dataOptions)
				assert(parseBootFrame(response).data[2] === 1, `${kind}: ACK at ${delayMs}ms must be accepted`)
				assert(sent.length === countBefore + 1, `${kind}: late ACK must not cause a resend`)
				assert(Date.now() - started < delayMs + 150, `${kind}: ACK must release the request immediately`)
			}

			// 普通迟到响应、坏 CRC、重复 ACK 与本包 ACK 同批到达，不能堵住 Boot 解码器。
			link.setWriter((frame) => {
				const corrupt = reply(frame, [0, 0, 5])
				corrupt[corrupt.length - 2] ^= 1
				const combined = [...unhex('7F5501FE030218022791FD'), ...corrupt, ...reply(frame, [0, 0, 3]), ...reply(frame, [0, 0, 5])]
				receive(Uint8Array.from(combined))
			})
			await transport.request(dataFrame(4), dataOptions)

			let released = false
			let pendingFrame!: Uint8Array
			link.setWriter((frame) => {
				pendingFrame = frame
				receive(reply(frame, [0, 0, 1])) // stale
				receive(buildBootFrame({ sourceAddress: 0x02, targetAddress: 0xfe, command: 0x53, payload: [0, 0, 3] }))
			})
			const awaiting = transport.request(dataFrame(2), dataOptions).then(() => { released = true })
			await wait(10)
			assert(!released, `${kind}: old or wrong-device ACK must not release the current request`)
			const ack = reply(pendingFrame, [0, 0, 3])
			receive(ack.slice(0, 5))
			receive(ack.slice(5))
			await awaiting
			link.setWriter((frame) => receive(reply(frame, [0, 0, 9])))
			const future = parseBootFrame(await transport.request(dataFrame(2), dataOptions))
			assert(future.data[2] === 9, `${kind}: a future cursor must reach the engine for immediate validation`)

			// 0x54 不能被残留数据 ACK 或空响应满足。
			link.setWriter((frame) => {
				receive(reply(frame, [0, 0, 3], 0x53))
				receive(reply(frame, []))
				setTimeout(() => receive(reply(frame, [0])), 10)
			})
			const finish = await transport.request(buildBootFrame({ targetAddress: 0x01, command: 0x54, payload: [0, 0, 0, 0] }), { timeoutMs: 100 })
			assert(parseBootFrame(finish).command === 0x54, `${kind}: only a real 0x54 can complete finalize`)

			const confirmed: number[] = []
			let finalized = false
			const runUpgrade = () => bootOtaUpgrade({
				transport: { request: (frame: Uint8Array, options?: BmsRequestOptions) => transport.request(frame, { timeoutMs: 450, ...options }) },
				firmware: new Uint8Array(256), targetAddress: kind === 'ble' ? 0xfc : 0x01,
				skipEnterBoot: true, requireFinalPacketAck: true, finalizeMaxAttempts: 4, finalizeDelayMs: 0, finalizeTimeoutMs: 90,
				onProgress: p => {
					if (p.stage === 'transfer') confirmed.push(p.packetIndex!)
					if (p.stage === 'finalize') finalized = true
				},
			})
			for (const lostAck of [0, 2, 3]) {
				const dataSent: { index: number; at: number }[] = []
				const attemptByIndex = new Map<number, number>()
				confirmed.length = 0
				finalized = false
				link.setWriter((frame) => {
					if (frame[3] === 0x52) return receive(reply(frame, [0, 0]))
					if (frame[3] === 0x54) {
						assert(!finalized, `${kind}: sending 0x54 is not success`)
					}
					if (frame[3] !== 0x53) return receive(reply(frame, [0]))
					const index = (frame[6] << 8) | frame[7]
					dataSent.push({ index, at: Date.now() })
					const attempt = (attemptByIndex.get(index) || 0) + 1
					attemptByIndex.set(index, attempt)
					if (index === lostAck && attempt === 1) return
					const status = index === lostAck && attempt > 1 ? 3 : 0
					setTimeout(() => receive(reply(frame, [status, 0, index + 1])), 1)
				})
				await runUpgrade()
				const expected = [0, 1, 2, 3]
				expected.splice(lostAck + 1, 0, lostAck)
				assert(dataSent.map(p => p.index).join(',') === expected.join(','), `${kind}: missing ACK must resend the same packet`)
				const duplicate = dataSent.filter(p => p.index === lostAck)
				const retryInterval = duplicate[1].at - duplicate[0].at
				assert(retryInterval >= 780 && retryInterval < 1000, `${kind}: first same-packet retry must be 800ms, got ${retryInterval}`)
				assert(confirmed.join(',') === '0,1,2,3', `${kind}: progress must advance only after each requested cursor is confirmed`)
				assert(finalized, `${kind}: all data ACKs plus real 0x54 status=0 must complete`)
			}

			// 设备显式要求旧游标时，回退补包；追平历史高水位前不能重置恢复预算。
			const recoverySent: number[] = []
			link.setWriter((frame) => {
				if (frame[3] === 0x52) return receive(reply(frame, [0, 0]))
				if (frame[3] !== 0x53) return receive(reply(frame, [0]))
				const index = (frame[6] << 8) | frame[7]
				recoverySent.push(index)
				if (index === 2 && recoverySent.length === 3) return receive(reply(frame, [3, 0, 1]))
				receive(reply(frame, [0, 0, index + 1]))
			})
			await runUpgrade()
			assert(recoverySent.join(',') === '0,1,2,1,2,3', `${kind}: explicit device cursor must drive bounded rollback`)

			// 连续无 ACK 必须停在同一包，不能跳号或进入 finalize。
			const exhausted: number[] = []
			confirmed.length = 0
			finalized = false
			link.setWriter((frame) => {
				if (frame[3] === 0x52) return receive(reply(frame, [0, 0]))
				if (frame[3] === 0x53) exhausted.push((frame[6] << 8) | frame[7])
			})
			let exhaustedError: Error | null = null
			try { await runUpgrade() } catch (caught) { exhaustedError = caught as Error }
			assert(exhausted.join(',') === '0,0,0,0', `${kind}: initial send plus three retries must keep packet zero`)
			assert(exhaustedError?.message === 'boot_packet_no_ack:0' && !finalized, `${kind}: retry exhaustion must fail before finalize`)

			for (const finalStatus of [undefined, 2, 0]) {
				const attempted: number[] = []
				let finishCount = 0
				confirmed.length = 0
				finalized = false
				link.setWriter((frame) => {
					if (frame[3] === 0x52) return receive(reply(frame, [0, 0]))
					if (frame[3] === 0x53) {
						const index = (frame[6] << 8) | frame[7]
						attempted.push(index)
						return receive(reply(frame, [0, 0, index + 1]))
					}
					if (frame[3] === 0x54) {
						finishCount++
						const payload = parseBootFrame(frame).data
						assert(new DataView(payload.buffer).getUint32(0) === crc32(new Uint8Array(256)), `${kind}: finalize must retain the real firmware CRC32`)
						assert(!finalized && confirmed.length === 4, `${kind}: finalize requires every data ACK first`)
						if (finalStatus != null) receive(reply(frame, [finalStatus]))
						return
					}
					receive(reply(frame, [0]))
				})
				let error: Error | null = null
				try { await runUpgrade() } catch (caught) { error = caught as Error }
				assert(attempted.join(',') === '0,1,2,3' && finishCount === (finalStatus == null ? 4 : 1), `${kind}: only missing ACK may retry finalize, at most three times`)
				if (finalStatus === 0) assert(error === null && finalized, `${kind}: only real 0x54 status=0 may report success`)
				else assert(!finalized && error?.message === (finalStatus == null ? 'Boot finalize timeout' : 'Boot finalize failed: status=2'), `${kind}: missing or rejecting 0x54 must fail even after all packets were sent`)
			}
			assert(link.readProbes() === 0, `${kind}: OTA must not issue read-characteristic probes`)

			// 清除正在等待及已排队的普通查询，包括 MQTT 的唤醒补发。
			transport.endExclusiveBootSession()
			link.setWriter(() => {})
			const normalCount = sent.length
			const inFlight = transport.request(normalRequest, { timeoutMs: 5000 }).then(() => false, () => true)
			const queued = transport.request(normalRequest, { timeoutMs: 5000 }).then(() => false, () => true)
			await wait(5)
			await transport.beginExclusiveBootSession()
			assert(await inFlight && await queued, `${kind}: in-flight and queued ordinary requests must be canceled`)
			const blocked = await transport.request(normalRequest).then(() => false, () => true)
			assert(blocked, `${kind}: new ordinary requests must be blocked during OTA`)
			await wait(60)
			assert(sent.length === normalCount + 1, `${kind}: no normal/wakeup frame may leak into OTA`)
			transport.endExclusiveBootSession()
			link.setWriter(() => receive(normalResponse))
			await transport.request(normalRequest, { timeoutMs: 100, writeApiTimeoutMs: 20 })

			// 排队请求尚在最小帧间隔等待时启动 OTA，实际写入前仍要重新检查独占。
			transport.minFrameIntervalMs = 40
			const beforeWaiting = sent.length
			const waiting = transport.request(normalRequest, { timeoutMs: 100 }).then(() => false, () => true)
			await wait(1)
			await transport.beginExclusiveBootSession()
			assert(await waiting && sent.length === beforeWaiting, `${kind}: queued send must recheck OTA reservation`)
			transport.minFrameIntervalMs = 0
			link.setWriter(() => {})
			const canceled = transport.request(dataFrame(0), dataOptions).then(() => false, () => true)
			await wait(1)
			transport.endExclusiveBootSession()
			assert(await canceled && !(transport as any)._pending, `${kind}: ending OTA must release the pending ACK timer`)

			if (kind === 'ble') {
				;(transport as any)._connected = true
				await transport.beginExclusiveBootSession()
				link.setWriter(() => setTimeout(() => link.emitConnectionState(false), 0))
				const disconnectStartedAt = Date.now()
				const dataDisconnectError = await transport.request(dataFrame(0), dataOptions).then(
					() => null,
					(error) => error as BmsProtocolError
				)
				const dataDisconnectExtra = dataDisconnectError?.extra as { bootFrameSubmitted?: boolean; command?: number } | undefined
				assert(
					dataDisconnectError instanceof BmsProtocolError &&
					Date.now() - disconnectStartedAt < 200 &&
					dataDisconnectExtra?.bootFrameSubmitted === false &&
					dataDisconnectExtra?.command === 0x53,
					'ble: a 0x53 connection-state disconnect must fail immediately without a finalize marker'
				)
				transport.endExclusiveBootSession()

				let lastFinalizeTransportError: unknown = null
				const finalizeTransport = {
					request: (frame: Uint8Array, options?: BmsRequestOptions) =>
						transport.request(frame, { timeoutMs: 90, ...options }).catch((error) => {
							if ((frame[3] & 0xff) === 0x54) lastFinalizeTransportError = error
							throw error
						}),
					writeFrame: (frame: Uint8Array, options?: { writeWithResponse?: boolean }) =>
						(transport as ReturnType<typeof createUniBleBmsTransport>).writeFrame(frame, options),
					isExplicitDisconnectError: (error: unknown) => {
						const value = error as BmsProtocolError
						const extra = value?.extra as { errMsg?: string } | undefined
						return /connection disconnected|no connection|not connected/i.test(`${value?.message || ''} ${extra?.errMsg || ''}`)
					},
				}
				const runDisconnectFinalize = async (mode: 'preflight' | 'connection-event' | 'primary-fail' | 'retry-fail') => {
					let finalizeWrites = 0
					let completed = false
					lastFinalizeTransportError = null
					link.setWriter((frame) => {
						const command = frame[3] & 0xff
						if (command === 0x52) return receive(reply(frame, [0, 0]))
						if (command === 0x53) {
							const index = (frame[6] << 8) | frame[7]
							receive(reply(frame, [0, 0, index + 1]))
							if (mode === 'preflight') (transport as any)._connected = false
							if (mode === 'primary-fail') {
								link.failNextNativeWrite({ errCode: 10006, errMsg: 'no connection' })
							}
							return
						}
						if (command === 0x54) {
							finalizeWrites += 1
							if (mode === 'connection-event') setTimeout(() => link.emitConnectionState(false), 0)
							if (mode === 'retry-fail' && finalizeWrites === 1) {
								link.failNextNativeWrite({ errCode: 10006, errMsg: 'no connection' })
							}
							return
						}
						receive(reply(frame, [0]))
					})
					let error: Error | null = null
					try {
						await bootOtaUpgrade({
							transport: finalizeTransport,
							firmware: new Uint8Array(1),
							targetAddress: 0xfc,
							skipEnterBoot: true,
							requireFinalPacketAck: true,
							finalizeDelayMs: 0,
							finalizeTimeoutMs: 90,
							finalizeMaxAttempts: 4,
							allowPostFinalizeBleDisconnectSuccess: true,
							onProgress: (progress) => { if (progress.stage === 'finalize') completed = true },
						})
					} catch (caught) {
						error = caught as Error
					}
					return { completed, error, finalizeWrites, transportError: lastFinalizeTransportError as BmsProtocolError | null }
				}

				;(transport as any)._connected = true
				await transport.beginExclusiveBootSession()
				const preflightDisconnect = await runDisconnectFinalize('preflight')
				assert(
					!preflightDisconnect.completed && preflightDisconnect.finalizeWrites === 0 && preflightDisconnect.error?.message === 'BLE is not connected',
					'ble: disconnect before native 0x54 submission must fail'
				)
				transport.endExclusiveBootSession()

				;(transport as any)._connected = true
				await transport.beginExclusiveBootSession()
				const submittedDisconnect = await runDisconnectFinalize('connection-event')
				assert(
					submittedDisconnect.completed && submittedDisconnect.finalizeWrites === 1 && submittedDisconnect.error === null,
					'ble: an explicit disconnect after native 0x54 submission may complete OTA'
				)
				transport.endExclusiveBootSession()

				;(transport as any)._connected = true
				await transport.beginExclusiveBootSession()
				const primaryWriteDisconnect = await runDisconnectFinalize('primary-fail')
				assert(
					primaryWriteDisconnect.completed && primaryWriteDisconnect.finalizeWrites === 1 && primaryWriteDisconnect.error === null,
					`ble: primary 0x54 synchronous disconnect must retain its marker: completed=${primaryWriteDisconnect.completed} writes=${primaryWriteDisconnect.finalizeWrites} error=${primaryWriteDisconnect.error?.message} transport=${primaryWriteDisconnect.transportError?.message} extra=${JSON.stringify(primaryWriteDisconnect.transportError?.extra)}`
				)
				transport.endExclusiveBootSession()

				;(transport as any)._connected = true
				await transport.beginExclusiveBootSession()
				const duplicateWriteDisconnect = await runDisconnectFinalize('retry-fail')
				assert(
					duplicateWriteDisconnect.completed && duplicateWriteDisconnect.finalizeWrites === 2 && duplicateWriteDisconnect.error === null,
					'ble: a disconnect failure from a retried 0x54 write must reject the main pending request with its submission marker'
				)
				transport.endExclusiveBootSession()

				;(transport as any)._connected = true
				link.setWriter(() => {})
				const activeDisconnectStartedAt = Date.now()
				const activeDisconnectPending = transport.request(
					buildBootFrame({ targetAddress: 0xfc, command: 0x54, payload: [0, 0, 0, 0] }),
					{ timeoutMs: 5000 }
				).then(
					() => null,
					(error) => error as BmsProtocolError
				)
				await wait(5)
				await transport.disconnect()
				const activeDisconnectError = await activeDisconnectPending
				const activeDisconnectExtra = activeDisconnectError?.extra as { bootFrameSubmitted?: boolean; command?: number } | undefined
				assert(
					activeDisconnectError instanceof BmsProtocolError &&
					Date.now() - activeDisconnectStartedAt < 200 &&
					activeDisconnectExtra?.bootFrameSubmitted === false &&
					activeDisconnectExtra?.command === 0x54,
					'ble: an app-initiated disconnect must reject pending finalize immediately without a submission marker'
				)
			}
		} finally {
			transport.endExclusiveBootSession()
			await transport.disconnect()
		}
	}
	console.log('Boot OTA BLE/MQTT transport regressions passed')
}

void run()
