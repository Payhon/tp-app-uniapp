import { crc16Modbus } from './crc16modbus'
import { BMS_FUNC, BMS_FRAME, registersToBytesBE } from './frame'
import { isExpectedMqttSocketResponse, type MqttSocketResponseExpectation } from './uni-mqtt-socket-transport'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

function buildReadResponse({
	functionCode = BMS_FUNC.READ_HOLDING_REGISTERS,
	data,
}: {
	functionCode?: number
	data: Uint8Array
}): Uint8Array {
	const bytes = [BMS_FRAME.HEAD_0, BMS_FRAME.HEAD_1, 0x01, 0xfe, functionCode, data.length]
	for (const byte of data) bytes.push(byte)
	const crc = crc16Modbus(bytes.slice(3))
	bytes.push(crc & 0xff, (crc >> 8) & 0xff, BMS_FRAME.TAIL)
	return Uint8Array.from(bytes)
}

function buildRegisterReadResponse(registers: number[]): Uint8Array {
	return buildReadResponse({ data: registersToBytesBE(Uint16Array.from(registers)) })
}

function buildSocketReadResponse(startAddress: number, registers: number[]): Uint8Array {
	const payload = registersToBytesBE(Uint16Array.from(registers))
	const data = new Uint8Array(4 + payload.length)
	data[0] = (startAddress >> 8) & 0xff
	data[1] = startAddress & 0xff
	data[2] = (registers.length >> 8) & 0xff
	data[3] = registers.length & 0xff
	data.set(payload, 4)
	return buildReadResponse({ functionCode: BMS_FUNC.SOCKET_READ, data })
}

const normalExpect: MqttSocketResponseExpectation = {
	functionCode: BMS_FUNC.READ_HOLDING_REGISTERS,
	targetAddress: 0xfe,
	sourceAddress: 0x01,
	readByteCount: 4,
}

assert(
	!isExpectedMqttSocketResponse(buildRegisterReadResponse([0x1802]), normalExpect),
	'normal 0x03 response with the wrong byteCount must not satisfy the pending request',
)

assert(
	isExpectedMqttSocketResponse(buildRegisterReadResponse([0x1234, 0x5678]), normalExpect),
	'normal 0x03 response with the expected byteCount should satisfy the pending request',
)

const socketExpect: MqttSocketResponseExpectation = {
	functionCode: BMS_FUNC.SOCKET_READ,
	targetAddress: 0xfe,
	sourceAddress: 0xfa,
	socketStartAddress: 0x0901,
	socketQuantity: 1,
}

assert(
	isExpectedMqttSocketResponse(buildSocketReadResponse(0x0900, [0x1111, 0x2222]), socketExpect),
	'SOCKET_READ response may cover a wider range as long as it overlaps the request',
)

assert(
	!isExpectedMqttSocketResponse(buildSocketReadResponse(0x0910, [0x3333]), socketExpect),
	'SOCKET_READ response outside the requested range must not satisfy the pending request',
)
