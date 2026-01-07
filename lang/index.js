import Vue from 'vue'
import VueI18n from 'vue-i18n'
import enUS from './en-US'
import zhCN from './zh-CN'
import { getSystemLanguage } from '@/common/platform'

Vue.use(VueI18n)

// Define available languages with their display names
export const AVAILABLE_LANGUAGES = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' }
];

const systemLanguage = getSystemLanguage();
const rawLocale = uni.getStorageSync('language') || systemLanguage || 'en-US';
let locale = rawLocale;
if (rawLocale && (rawLocale.toLowerCase().startsWith('zh') || rawLocale.toLowerCase() === 'zh-cn')) {
  locale = 'zh-CN'
} else if (rawLocale === 'en-US') {
  locale = 'en-US'
} else {
  // Other languages default to en-US
  locale = 'en-US'
}
const i18n = new VueI18n({
  locale: locale,
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN
  }
})

// Keep in sync with pages.json tabBar order
const TABBAR_I18N_KEYS = ['pages.deviceList', 'pages.intelligentControlTitle', 'pages.myAccount']

// Function to update tabBar texts with translation keys
export const updateTabbarText = () => {
  try {
    if (!uni || typeof uni.setTabBarItem !== 'function') return
    setTimeout(() => {
      TABBAR_I18N_KEYS.forEach((key, index) => {
        uni.setTabBarItem({
          index,
          text: i18n.t(key)
        })
      })
    }, 100)
  } catch (e) {}
}

// Function to change language
export const changeLanguage = (locale) => {
  i18n.locale = locale
  // Force reload messages for the new locale
  i18n.setLocaleMessage(locale, i18n.messages[locale])
  uni.setStorageSync('language', locale)
  updateTabbarText()
}

export default i18n
