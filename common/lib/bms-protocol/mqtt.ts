import { BmsProtocolError } from './frame'

function assertUint8Array(u8: unknown, name: string): Uint8Array {
	if (!(u8 instanceof Uint8Array)) throw new BmsProtocolError(`${name} must be Uint8Array`);
	return u8;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
	const out = new Uint8Array(a.length + b.length);
	out.set(a, 0);
	out.set(b, a.length);
	return out;
}

function u16be(n: number): Uint8Array {
	return new Uint8Array([(n >> 8) & 0xff, n & 0xff]);
}

function encodeRemainingLength(len: number): Uint8Array {
	// MQTT v3.1.1 Remaining Length: variable length (7-bit) encoding
	const out: number[] = [];
	let x = len >>> 0;
	do {
		let digit = x % 128;
		x = Math.floor(x / 128);
		if (x > 0) digit |= 0x80;
		out.push(digit);
	} while (x > 0);
	return Uint8Array.from(out);
}

function decodeRemainingLength(bytes: Uint8Array, offset: number): { value: number; bytesUsed: number } | null {
	let multiplier = 1;
	let value = 0;
	let i = 0;
	let digit: number;
	do {
		if (offset + i >= bytes.length) return null;
		digit = bytes[offset + i];
		value += (digit & 0x7f) * multiplier;
		multiplier *= 128;
		i += 1;
		if (i > 4) throw new BmsProtocolError('Malformed MQTT Remaining Length');
	} while (digit & 0x80);
	return { value, bytesUsed: i };
}

function utf8Encode(s: string): Uint8Array {
	if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(s));
	// fallback: ASCII only
	const str = String(s);
	const out = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i += 1) out[i] = str.charCodeAt(i) & 0xff;
	return out;
}

function utf8Decode(bytes: Uint8Array): string {
	if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
	let s = '';
	for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
	return s;
}

export function mqttEncodeString(str: string): Uint8Array {
	const bytes = utf8Encode(str);
	return concatBytes(u16be(bytes.length), bytes);
}

export function mqttDecodeString(
	bytes: Uint8Array,
	offset: number
): { value: string; bytesUsed: number } | null {
	if (offset + 2 > bytes.length) return null;
	const len = (bytes[offset] << 8) | bytes[offset + 1];
	const start = offset + 2;
	const end = start + len;
	if (end > bytes.length) return null;
	return { value: utf8Decode(bytes.slice(start, end)), bytesUsed: 2 + len };
}

export function mqttBuildConnect(
	{
		clientId,
		keepAliveSec = 30,
		username,
		password,
		cleanSession = true
	}: {
		clientId?: string
		keepAliveSec?: number
		username?: string
		password?: string
		cleanSession?: boolean
	} = {}
): Uint8Array {
	if (!clientId) throw new BmsProtocolError('clientId is required');

	// Variable header
	const protoName = mqttEncodeString('MQTT'); // Protocol Name
	const protoLevel = Uint8Array.from([0x04]); // Protocol Level: 4 = MQTT 3.1.1

	let connectFlags = 0x00;
	if (cleanSession) connectFlags |= 0x02;
	if (username != null) connectFlags |= 0x80;
	if (password != null) connectFlags |= 0x40;

	const keepAlive = u16be(keepAliveSec & 0xffff);
	const varHeader = concatBytes(concatBytes(protoName, protoLevel), concatBytes(Uint8Array.from([connectFlags]), keepAlive));

	// Payload
	let payload = mqttEncodeString(clientId);
	if (username != null) payload = concatBytes(payload, mqttEncodeString(username));
	if (password != null) payload = concatBytes(payload, mqttEncodeString(password));

	const remaining = concatBytes(varHeader, payload);
	const fixed = Uint8Array.from([0x10]); // CONNECT
	return concatBytes(concatBytes(fixed, encodeRemainingLength(remaining.length)), remaining);
}

export function mqttBuildPingReq(): Uint8Array {
	return Uint8Array.from([0xc0, 0x00]);
}

export function mqttBuildDisconnect(): Uint8Array {
	return Uint8Array.from([0xe0, 0x00]);
}

export function mqttBuildSubscribe(
	{
		packetId,
		topic,
		qos = 0
	}: {
		packetId?: number
		topic?: string
		qos?: number
	} = {}
): Uint8Array {
	if (!packetId) throw new BmsProtocolError('packetId is required for SUBSCRIBE');
	if (!topic) throw new BmsProtocolError('topic is required for SUBSCRIBE');
	const vh = u16be(packetId);
	const pl = concatBytes(mqttEncodeString(topic), Uint8Array.from([qos & 0x03]));
	const remaining = concatBytes(vh, pl);
	const fixed = Uint8Array.from([0x82]); // SUBSCRIBE with reserved flags 0b0010
	return concatBytes(concatBytes(fixed, encodeRemainingLength(remaining.length)), remaining);
}

export function mqttBuildPublish(
	{
		topic,
		payload,
		qos = 0,
		retain = false
	}: {
		topic?: string
		payload?: Uint8Array | ArrayLike<number>
		qos?: number
		retain?: boolean
	} = {}
): Uint8Array {
	if (!topic) throw new BmsProtocolError('topic is required for PUBLISH');
	const pl = payload instanceof Uint8Array ? payload : Uint8Array.from(payload || []);
	const qosBits = qos & 0x03;
	if (qosBits !== 0) throw new BmsProtocolError('Only QoS 0 is supported by this transport');
	const flags = (retain ? 0x01 : 0x00) | (qosBits << 1);
	const fixed1 = 0x30 | flags; // PUBLISH
	const topicBytes = mqttEncodeString(topic);
	const remaining = concatBytes(topicBytes, pl);
	return concatBytes(concatBytes(Uint8Array.from([fixed1]), encodeRemainingLength(remaining.length)), remaining);
}

export class MqttPacketReader {
	private _buf: Uint8Array

	constructor() {
		this._buf = new Uint8Array(0);
	}

	push(chunk: Uint8Array | ArrayLike<number>): void {
		const bytes = chunk instanceof Uint8Array ? chunk : Uint8Array.from(chunk);
		this._buf = concatBytes(this._buf, bytes);
	}

	tryReadOne(): Uint8Array | null {
		const bytes = this._buf;
		if (bytes.length < 2) return null;
		const rl = decodeRemainingLength(bytes, 1);
		if (!rl) return null;
		const headerLen = 1 + rl.bytesUsed;
		const totalLen = headerLen + rl.value;
		if (bytes.length < totalLen) return null;
		const packet = bytes.slice(0, totalLen);
		this._buf = bytes.slice(totalLen);
		return packet;
	}
}

export type MqttPacket =
	| { type: 'connack'; sessionPresent: boolean; returnCode: number }
	| { type: 'suback'; packetId: number; grantedQos: Uint8Array }
	| { type: 'pingresp' }
	| { type: 'publish'; topic: string; payload: Uint8Array }
	| { type: 'unknown'; mqttType: number; flags: number; raw: Uint8Array }

export function mqttParsePacket(packetBytes: Uint8Array): MqttPacket {
	const bytes = assertUint8Array(packetBytes, 'packetBytes');
	if (bytes.length < 2) throw new BmsProtocolError('MQTT packet too short');
	const type = (bytes[0] >> 4) & 0x0f;
	const flags = bytes[0] & 0x0f;
	const rl = decodeRemainingLength(bytes, 1);
	if (!rl) throw new BmsProtocolError('MQTT remaining length incomplete');
	const headerLen = 1 + rl.bytesUsed;
	const body = bytes.slice(headerLen);

	if (type === 2) {
		// CONNACK: [ackFlags][returnCode]
		if (body.length < 2) throw new BmsProtocolError('Bad CONNACK');
		return { type: 'connack', sessionPresent: !!(body[0] & 0x01), returnCode: body[1] };
	}
	if (type === 9) {
		// SUBACK: [packetId MSB][LSB][granted...]
		if (body.length < 3) throw new BmsProtocolError('Bad SUBACK');
		return { type: 'suback', packetId: (body[0] << 8) | body[1], grantedQos: body.slice(2) };
	}
	if (type === 13) {
		return { type: 'pingresp' };
	}
	if (type === 3) {
		// PUBLISH
		let offset = 0;
		const topicRes = mqttDecodeString(body, offset);
		if (!topicRes) throw new BmsProtocolError('Bad PUBLISH topic');
		offset += topicRes.bytesUsed;
		const qos = (flags >> 1) & 0x03;
		if (qos !== 0) throw new BmsProtocolError('Only QoS 0 PUBLISH is supported');
		const payload = body.slice(offset);
		return { type: 'publish', topic: topicRes.value, payload };
	}

	return { type: 'unknown', mqttType: type, flags, raw: bytes };
}
