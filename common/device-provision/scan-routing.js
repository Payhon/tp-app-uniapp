/**
 * @typedef {'bms' | 'meter'} SupportedDeviceType
 * @typedef {{ type: 'mac', value: string, deviceType: SupportedDeviceType | null } | { type: 'uuid', value: string }} AddDeviceScanCode
 * @typedef {{ device_id?: string, ble_mac?: string | null, item_uuid?: string | null }} BoundDeviceLike
 * @typedef {'bound_detail' | 'meter_session' | 'bms_provision' | 'uuid_bind' | 'unsupported'} AddDeviceScanAction
 * @typedef {{ action: AddDeviceScanAction, url?: string, matchedDevice?: BoundDeviceLike | null }} AddDeviceScanRouteDecision
 */

const devicePrefix = require('./device-prefix.js')

const DEVICE_TYPE_BMS = devicePrefix.DEVICE_TYPE_BMS
const DEVICE_TYPE_METER = devicePrefix.DEVICE_TYPE_METER

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
 * @param {AddDeviceScanCode} parsed
 * @param {BoundDeviceLike[]} devices
 * @returns {BoundDeviceLike | null}
 */
function findBoundDeviceByScanCode(parsed, devices) {
  const list = Array.isArray(devices) ? devices : []
  if (!parsed) return null
  if (parsed.type === 'mac') {
    const targetMac = normalizeMac(parsed.value)
    if (!targetMac) return null
    return list.find((item) => normalizeMac(item && item.ble_mac) === targetMac) || null
  }
  const targetUuid = normalizeHex(parsed.value)
  if (!/^[0-9A-F]{32}$/.test(targetUuid)) return null
  return list.find((item) => normalizeHex(item && item.item_uuid) === targetUuid) || null
}

/**
 * @param {string} deviceId
 * @returns {string}
 */
function buildBoundDetailUrl(deviceId) {
  return `/pages/device-battery/detail?device_id=${encodeURIComponent(String(deviceId || ''))}`
}

/**
 * @param {string} mac
 * @returns {string}
 */
function buildInstrumentSessionUrl(mac) {
  return `/pages/device-battery/detail?session_mode=instrument&ble_mac=${encodeURIComponent(String(mac || ''))}&allow_scan_handoff=1`
}

/**
 * @param {string} mac
 * @returns {string}
 */
function buildBmsProvisionUrl(mac) {
  return `/pages/device-provision/ble-scan?mode=qr&mac=${encodeURIComponent(String(mac || ''))}`
}

/**
 * @param {string} uuid
 * @returns {string}
 */
function buildUuidBindUrl(uuid) {
  return `/pages/device-provision/uuid-bind?uuid=${encodeURIComponent(String(uuid || ''))}`
}

/**
 * @param {AddDeviceScanCode} parsed
 * @param {BoundDeviceLike[] | undefined | null} devices
 * @returns {AddDeviceScanRouteDecision}
 */
function resolveAddDeviceScanRoute(parsed, devices) {
  const matchedDevice = findBoundDeviceByScanCode(parsed, devices || [])
  const matchedDeviceId = String(matchedDevice && matchedDevice.device_id || '').trim()
  if (matchedDeviceId) {
    return {
      action: 'bound_detail',
      url: buildBoundDetailUrl(matchedDeviceId),
      matchedDevice,
    }
  }

  if (parsed.type === 'mac') {
    if (parsed.deviceType === DEVICE_TYPE_METER) {
      return {
        action: 'meter_session',
        url: buildInstrumentSessionUrl(parsed.value),
        matchedDevice: null,
      }
    }
    if (parsed.deviceType === DEVICE_TYPE_BMS) {
      return {
        action: 'bms_provision',
        url: buildBmsProvisionUrl(parsed.value),
        matchedDevice: null,
      }
    }
    return { action: 'unsupported', matchedDevice: null }
  }

  return {
    action: 'uuid_bind',
    url: buildUuidBindUrl(parsed.value),
    matchedDevice: null,
  }
}

exports.resolveAddDeviceScanRoute = resolveAddDeviceScanRoute
exports.findBoundDeviceByScanCode = findBoundDeviceByScanCode
