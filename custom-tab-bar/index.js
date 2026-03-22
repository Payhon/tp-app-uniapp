const I18N = require('./i18n.js')
const {
  resolveDeviceTypeByMac,
  DEVICE_TYPE_BMS,
  DEVICE_TYPE_METER
} = require('../common/device-provision/device-prefix.js')

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
              success: (scanRes) => {
                const raw = String((scanRes && scanRes.result) || '')
                const normalized = raw.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '').toUpperCase()
                const isMac = /^[0-9A-F]{12}$/.test(normalized)
                const isUuid = /^[0-9A-F]{32}$/.test(normalized)
                if (!isMac && !isUuid) {
                  wx.showToast({ title: dict.invalidCode, icon: 'none' })
                  return
                }
                if (isMac) {
                  const deviceType = resolveDeviceTypeByMac(normalized)
                  if (deviceType === DEVICE_TYPE_METER) {
                    wx.navigateTo({ url: `/pages/device-battery/detail?session_mode=instrument&ble_mac=${encodeURIComponent(normalized)}&allow_scan_handoff=1` })
                    return
                  }
                  if (deviceType !== DEVICE_TYPE_BMS) {
                    wx.showToast({ title: dict.unsupportedDeviceType, icon: 'none' })
                    return
                  }
                  wx.navigateTo({ url: `/pages/device-provision/ble-scan?mode=qr&mac=${normalized}` })
                  return
                }
                wx.navigateTo({ url: `/pages/device-provision/uuid-bind?uuid=${normalized}` })
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
