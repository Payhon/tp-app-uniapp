const I18N = require('./i18n.js')

const DEVICE_TYPE_BMS = 'bms'
const DEVICE_TYPE_METER = 'meter'
const DEVICE_PREFIXES_STORAGE_KEY = '__DEVICE_MAC_PREFIXES__'
const BOUND_DEVICE_SNAPSHOT_STORAGE_KEY = '__BOUND_DEVICES_SNAPSHOT__'

function normalizeHex(input) {
  return String(input || '')
    .trim()
    .replace(/^0x/i, '')
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase()
}

function normalizeMac(input) {
  let hex = normalizeHex(input)
  if (hex.length < 12) return null
  while (hex.length > 12 && hex.endsWith('00')) {
    hex = hex.slice(0, -2)
  }
  if (!/^[0-9A-F]{12}$/.test(hex)) return null
  return hex
}

function resolveDeviceTypeByMac(mac) {
  const normalized = normalizeMac(mac)
  if (!normalized) return null
  const prefixConfig = wx.getStorageSync(DEVICE_PREFIXES_STORAGE_KEY) || {}
  const bmsPrefixes = Array.isArray(prefixConfig[DEVICE_TYPE_BMS]) ? prefixConfig[DEVICE_TYPE_BMS] : []
  const meterPrefixes = Array.isArray(prefixConfig[DEVICE_TYPE_METER]) ? prefixConfig[DEVICE_TYPE_METER] : []
  if (meterPrefixes.some((prefix) => normalized.startsWith(normalizeHex(prefix)))) return DEVICE_TYPE_METER
  if (bmsPrefixes.some((prefix) => normalized.startsWith(normalizeHex(prefix)))) return DEVICE_TYPE_BMS
  return null
}

function getBoundDeviceSnapshot() {
  const snapshot = wx.getStorageSync(BOUND_DEVICE_SNAPSHOT_STORAGE_KEY)
  return Array.isArray(snapshot) ? snapshot : []
}

function findBoundDeviceByMac(mac) {
  const normalized = normalizeMac(mac)
  if (!normalized) return null
  return getBoundDeviceSnapshot().find((item) => normalizeMac(item && item.ble_mac) === normalized) || null
}

function findBoundDeviceByUuid(uuid) {
  const normalized = normalizeHex(uuid)
  if (!/^[0-9A-F]{32}$/.test(normalized)) return null
  return getBoundDeviceSnapshot().find((item) => normalizeHex(item && item.item_uuid) === normalized) || null
}

function resolveScanRoute(parsed) {
  const matched = parsed.type === 'mac'
    ? findBoundDeviceByMac(parsed.value)
    : findBoundDeviceByUuid(parsed.value)
  const matchedDeviceId = String((matched && matched.device_id) || '').trim()
  if (matchedDeviceId) {
    return { action: 'bound_detail', url: `/pages/device-battery/detail?device_id=${encodeURIComponent(matchedDeviceId)}` }
  }
  if (parsed.type === 'mac') {
    if (parsed.deviceType === DEVICE_TYPE_METER) {
      return {
        action: 'meter_session',
        url: `/pages/device-battery/detail?session_mode=instrument&ble_mac=${encodeURIComponent(parsed.value)}&allow_scan_handoff=1`
      }
    }
    if (parsed.deviceType === DEVICE_TYPE_BMS) {
      return { action: 'bms_provision', url: `/pages/device-provision/ble-scan?mode=qr&mac=${encodeURIComponent(parsed.value)}` }
    }
    return { action: 'unsupported' }
  }
  return { action: 'uuid_bind', url: `/pages/device-provision/uuid-bind?uuid=${encodeURIComponent(parsed.value)}` }
}

const normalizeLocale = (raw) => {
  const v = String(raw || '').trim()
  if (!v) return 'zh-CN'
  const low = v.toLowerCase()
  if (low.startsWith('zh')) return 'zh-CN'
  if (v === 'en-US') return 'en-US'
  return 'en-US'
}

Component({
  data: {
    selected: 0,
    textHome: '',
    textAddDevice: '',
    textMe: ''
  },
  lifetimes: {
    attached() {
      this.updateTexts()
      this.updateSelectedFromRoute()
    }
  },
  pageLifetimes: {
    show() {
      this.updateTexts()
      this.updateSelectedFromRoute()
    }
  },
  methods: {
    updateTexts() {
      const locale = normalizeLocale(wx.getStorageSync('language'))
      const dict = I18N[locale] || I18N['en-US']
      this.setData({
        textHome: dict.home,
        textAddDevice: dict.addDevice,
        textMe: dict.me
      })
    },
    setSelected(index) {
      this.setData({ selected: Number(index) || 0 })
    },
    updateSelectedFromRoute() {
      try {
        const pages = getCurrentPages()
        const current = pages && pages.length ? pages[pages.length - 1] : null
        const route = (current && (current.route || current.__route__)) || ''
        if (String(route).startsWith('pages/my/my')) {
          this.setSelected(1)
        } else {
          this.setSelected(0)
        }
      } catch (e) {}
    },
    onSwitchTab(e) {
      const index = Number(e.currentTarget.dataset.index || 0)
      const url = e.currentTarget.dataset.url
      if (!url) return
      this.setSelected(index)
      wx.switchTab({ url })
    },
    onAdd() {
      const locale = normalizeLocale(wx.getStorageSync('language'))
      const dict = I18N[locale] || I18N['en-US']

      wx.showActionSheet({
        itemList: [dict.bleSearch, dict.cameraScan],
        success: (res) => {
          const idx = Number(res.tapIndex)
          if (idx === 0) {
            wx.navigateTo({ url: '/pages/device-provision/ble-scan' })
            return
          }
          if (idx === 1) {
            wx.scanCode({
              success: async (scanRes) => {
                const raw = String((scanRes && scanRes.result) || '')
                const normalized = raw.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '').toUpperCase()
                const isMac = /^[0-9A-F]{12}$/.test(normalized)
                const isUuid = /^[0-9A-F]{32}$/.test(normalized)
                if (!isMac && !isUuid) {
                  wx.showToast({ title: dict.invalidCode, icon: 'none' })
                  return
                }
                const parsed = isMac
                  ? { type: 'mac', value: normalized, deviceType: resolveDeviceTypeByMac(normalized) }
                  : { type: 'uuid', value: normalized }
                const decision = resolveScanRoute(parsed)
                if (decision.action === 'unsupported' || !decision.url) {
                  wx.showToast({ title: dict.unsupportedDeviceType, icon: 'none' })
                  return
                }
                wx.navigateTo({ url: decision.url })
              },
              fail: () => {
                // 用户取消扫码，不提示
              }
            })
          }
        },
        fail: () => {
          // 用户取消，不提示
        }
      })
    }
  }
})
