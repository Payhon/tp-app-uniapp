const I18N = require('./i18n.js')

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
      wx.navigateTo({ url: '/pages/fishery-monitor/addMonitor' })
    }
  }
})
