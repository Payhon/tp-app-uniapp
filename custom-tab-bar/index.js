const I18N = require('./i18n.js')

const DEVICE_TYPE_BMS = 'bms'
const DEVICE_TYPE_METER = 'meter'
const DEVICE_PREFIXES_STORAGE_KEY = '__DEVICE_MAC_PREFIXES__'
const BOUND_DEVICE_SNAPSHOT_STORAGE_KEY = '__BOUND_DEVICES_SNAPSHOT__'
const DEFAULT_DEVICE_MAC_PREFIXES = Object.freeze({
  [DEVICE_TYPE_BMS]: Object.freeze(['AC']),
  [DEVICE_TYPE_METER]: Object.freeze(['AA'])
})

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

function readStoredDevicePrefixConfig() {
  try {
    const raw = wx.getStorageSync(DEVICE_PREFIXES_STORAGE_KEY)
    if (!raw) return {}
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (e) {
        return {}
      }
    }
    return raw && typeof raw === 'object' ? raw : {}
  } catch (e) {
    return {}
  }
}

function normalizePrefixList(configValue, fallbackValue) {
  const values = []
    .concat(Array.isArray(fallbackValue) ? fallbackValue : [])
    .concat(Array.isArray(configValue) ? configValue : [])
    .map((prefix) => normalizeHex(prefix))
    .filter(Boolean)
  return Array.from(new Set(values))
}

function getDevicePrefixConfig() {
  const stored = readStoredDevicePrefixConfig()
  return {
    [DEVICE_TYPE_BMS]: normalizePrefixList(stored[DEVICE_TYPE_BMS], DEFAULT_DEVICE_MAC_PREFIXES[DEVICE_TYPE_BMS]),
    [DEVICE_TYPE_METER]: normalizePrefixList(stored[DEVICE_TYPE_METER], DEFAULT_DEVICE_MAC_PREFIXES[DEVICE_TYPE_METER])
  }
}

function resolveDeviceTypeByMac(mac) {
  const normalized = normalizeMac(mac)
  if (!normalized) return null
  const prefixConfig = getDevicePrefixConfig()
  const bmsPrefixes = prefixConfig[DEVICE_TYPE_BMS]
  const meterPrefixes = prefixConfig[DEVICE_TYPE_METER]
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
    textMe: '',
    textCancel: '',
    actionSheetVisible: false,
    actionSheetItems: []
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
        textMe: dict.me,
        textCancel: dict.cancel,
        actionSheetItems: [dict.bleSearch, dict.cameraScan]
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
    noop() {},
    closeActionSheet() {
      this.setData({ actionSheetVisible: false })
    },
    isLoginPageActive() {
      try {
        const pages = getCurrentPages()
        const current = pages && pages.length ? pages[pages.length - 1] : null
        const route = String((current && (current.route || current.__route__)) || '')
        return route === 'pages/login/login'
      } catch (e) {}
      return false
    },
    ensureLoggedIn(dict) {
      const token = String(wx.getStorageSync('access_token') || wx.getStorageSync('accessToken') || '').trim()
      if (token) return true
      wx.showToast({ title: dict.pleaseLogin, icon: 'none' })
      if (!this.isLoginPageActive()) {
        wx.navigateTo({ url: '/pages/login/login' })
      }
      return false
    },
    onAdd() {
      const locale = normalizeLocale(wx.getStorageSync('language'))
      const dict = I18N[locale] || I18N['en-US']
      if (!this.ensureLoggedIn(dict)) return
      this.setData({
        textCancel: dict.cancel,
        actionSheetItems: [dict.bleSearch, dict.cameraScan],
        actionSheetVisible: true
      })
    },
    onActionSheetItem(e) {
      const locale = normalizeLocale(wx.getStorageSync('language'))
      const dict = I18N[locale] || I18N['en-US']
      const idx = Number(e.currentTarget.dataset.index)
      this.setData({ actionSheetVisible: false })
      if (idx === 0) {
        wx.navigateTo({ url: '/pages/device-provision/ble-scan' })
        return
      }
      if (idx === 1) {
        wx.scanCode({
          success: async (scanRes) => {
            const raw = String((scanRes && scanRes.result) || '')
            const normalized = raw.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '').toUpperCase()
            const mac = normalizeMac(normalized)
            const isMac = !!mac
            const isUuid = /^[0-9A-F]{32}$/.test(normalized)
            if (!isMac && !isUuid) {
              wx.showToast({ title: dict.invalidCode, icon: 'none' })
              return
            }
            const parsed = isMac
              ? { type: 'mac', value: mac, deviceType: resolveDeviceTypeByMac(mac) }
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
    }
  }
})
