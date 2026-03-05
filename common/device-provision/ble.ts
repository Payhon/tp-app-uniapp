export function normalizeHex(input: string): string {
	return String(input || '')
		.trim()
		.replace(/^0x/i, '')
		.replace(/[^0-9a-fA-F]/g, '')
		.toUpperCase()
}

export function normalizeMac(input: string): string | null {
	let hex = normalizeHex(input)
	if (hex.length < 12) return null
	// 兼容异常上报值：有些链路会把 6-byte MAC 放到 10-byte 区域，尾部补 00。
	while (hex.length > 12 && hex.endsWith('00')) {
		hex = hex.slice(0, -2)
	}
	if (!/^[0-9A-F]{12}$/.test(hex)) return null
	return hex
}

export function mac12ToColon(mac12: string): string {
	const hex = normalizeMac(mac12) || mac12
	const parts: string[] = []
	for (let i = 0; i < 12; i += 2) parts.push(hex.slice(i, i + 2))
	return parts.join(':')
}

function bytesToHex(bytes: Uint8Array): string {
	let out = ''
	for (let i = 0; i < bytes.length; i += 1) out += (bytes[i] & 0xff).toString(16).padStart(2, '0')
	return out.toUpperCase()
}

function hexToBytes(hex: string): Uint8Array | null {
	const clean = String(hex || '')
		.trim()
		.replace(/^0x/i, '')
		.replace(/[^0-9a-fA-F]/g, '')
	if (!clean || clean.length < 2 || clean.length % 2 !== 0) return null
	const out = new Uint8Array(clean.length / 2)
	for (let i = 0; i < clean.length; i += 2) {
		out[i / 2] = parseInt(clean.slice(i, i + 2), 16) & 0xff
	}
	return out
}

function ensureUint8Array(data: unknown): Uint8Array | null {
	if (!data) return null
	if (data instanceof Uint8Array) return data
	if (data instanceof ArrayBuffer) return new Uint8Array(data)
	if (typeof data === 'string') return hexToBytes(data)
	if (typeof data === 'object') {
		const obj = data as Record<string, unknown>
		const manuf = obj.manufacturerData || obj.manufacturerdata
		if (manuf) return ensureUint8Array(manuf)
	}
	return null
}

/**
 * 解析蓝牙广播 data（advertisData/manufacturer data）里携带的 MAC。
 *
 * 需求约定：
 * - 广播 hex 形如：... 07 FF AC 50 2C 2D 64 62 ...
 * - "07FF" 后面的 6 个字节即 MAC（无分隔，12 hex）
 *
 * TODO(4G判定/设备差异): 若不同硬件厂商广播格式变化，需要在此扩展解析规则。
 */
export function parseMacFromAdvertisement(data: ArrayBuffer | Uint8Array | string | Record<string, unknown> | null | undefined): string | null {
	const u8 = ensureUint8Array(data)
	// 微信小程序/iOS 可能只返回 6 字节 MAC（无 0x07 0xFF 前缀）
	if (u8 && u8.length === 6) {
		return bytesToHex(u8)
	}
	if (!u8 || u8.length < 8) return null
	for (let i = 0; i <= u8.length - 8; i += 1) {
		if ((u8[i] & 0xff) !== 0x07) continue
		if ((u8[i + 1] & 0xff) !== 0xff) continue
		const macBytes = u8.slice(i + 2, i + 8)
		return bytesToHex(macBytes)
	}
	return null
}
