/**
 * @typedef {'bms' | 'meter'} SupportedDeviceType
 */

/** @type {SupportedDeviceType} */
const DEVICE_TYPE_BMS = 'bms'
/** @type {SupportedDeviceType} */
const DEVICE_TYPE_METER = 'meter'

/** @type {Readonly<Record<SupportedDeviceType, readonly string[]>>} */
const DEVICE_MAC_PREFIXES = Object.freeze({
  [DEVICE_TYPE_BMS]: Object.freeze(['AC']),
  [DEVICE_TYPE_METER]: Object.freeze(['AA'])
})

/** @type {readonly SupportedDeviceType[]} */
const SUPPORTED_DEVICE_TYPES = Object.freeze([
  DEVICE_TYPE_BMS,
  DEVICE_TYPE_METER
])

/**
 * @param {unknown} input
 * @returns {string}
 */
function normalizeHex(input) {
  return String(input || '')
    .trim()
    .replace(/^0x/i, '')
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase()
}

/**
 * @param {unknown} input
 * @returns {string | null}
 */
function normalizeMac(input) {
  let hex = normalizeHex(input)
  if (hex.length < 12) return null
  while (hex.length > 12 && hex.endsWith('00')) {
    hex = hex.slice(0, -2)
  }
  if (!/^[0-9A-F]{12}$/.test(hex)) return null
  return hex
}

/**
 * @param {string} mac
 * @param {readonly string[] | undefined} prefixes
 * @returns {boolean}
 */
function hasPrefix(mac, prefixes) {
  const normalized = normalizeMac(mac)
  if (!normalized) return false
  return (prefixes || []).some((prefix) => normalized.startsWith(normalizeHex(prefix)))
}

/**
 * @param {string} mac
 * @returns {SupportedDeviceType | null}
 */
function resolveDeviceTypeByMac(mac) {
  const normalized = normalizeMac(mac)
  if (!normalized) return null
  return SUPPORTED_DEVICE_TYPES.find((type) => hasPrefix(normalized, DEVICE_MAC_PREFIXES[type])) || null
}

/**
 * @param {string} mac
 * @returns {boolean}
 */
function isBmsMac(mac) {
  return resolveDeviceTypeByMac(mac) === DEVICE_TYPE_BMS
}

/**
 * @param {string} mac
 * @returns {boolean}
 */
function isMeterMac(mac) {
  return resolveDeviceTypeByMac(mac) === DEVICE_TYPE_METER
}

exports.DEVICE_TYPE_BMS = DEVICE_TYPE_BMS
exports.DEVICE_TYPE_METER = DEVICE_TYPE_METER
exports.DEVICE_MAC_PREFIXES = DEVICE_MAC_PREFIXES
exports.SUPPORTED_DEVICE_TYPES = SUPPORTED_DEVICE_TYPES
exports.resolveDeviceTypeByMac = resolveDeviceTypeByMac
exports.isBmsMac = isBmsMac
exports.isMeterMac = isMeterMac
