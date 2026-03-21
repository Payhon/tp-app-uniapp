(global["webpackJsonp"] = global["webpackJsonp"] || []).push([["common/vendor"],[
/* 0 */,
/* 1 */
/*!*********************************************************!*\
  !*** ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var objectKeys = ['qy', 'env', 'error', 'version', 'lanDebug', 'cloud', 'serviceMarket', 'router', 'worklet', '__webpack_require_UNI_MP_PLUGIN__'];
var singlePageDisableKey = ['lanDebug', 'router', 'worklet'];
var target = typeof globalThis !== 'undefined' ? globalThis : function () {
  return this;
}();
var key = ['w', 'x'].join('');
var oldWx = target[key];
var launchOption = oldWx.getLaunchOptionsSync ? oldWx.getLaunchOptionsSync() : null;
function isWxKey(key) {
  if (launchOption && launchOption.scene === 1154 && singlePageDisableKey.includes(key)) {
    return false;
  }
  return objectKeys.indexOf(key) > -1 || typeof oldWx[key] === 'function';
}
function initWx() {
  var newWx = {};
  for (var _key in oldWx) {
    if (isWxKey(_key)) {
      // TODO wrapper function
      newWx[_key] = oldWx[_key];
    }
  }
  return newWx;
}
target[key] = initWx();
if (!target[key].canIUse('getAppBaseInfo')) {
  target[key].getAppBaseInfo = target[key].getSystemInfoSync;
}
if (!target[key].canIUse('getWindowInfo')) {
  target[key].getWindowInfo = target[key].getSystemInfoSync;
}
if (!target[key].canIUse('getDeviceInfo')) {
  target[key].getDeviceInfo = target[key].getSystemInfoSync;
}
var _default = target[key];
exports.default = _default;

/***/ }),
/* 2 */
/*!************************************************************!*\
  !*** ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(wx, global) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createApp = createApp;
exports.createComponent = createComponent;
exports.createPage = createPage;
exports.createPlugin = createPlugin;
exports.createSubpackageApp = createSubpackageApp;
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ 5));
var _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ 11));
var _construct2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/construct */ 15));
var _toConsumableArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ 18));
var _typeof2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/typeof */ 13));
var _uniI18n = __webpack_require__(/*! @dcloudio/uni-i18n */ 22);
var _vue = _interopRequireDefault(__webpack_require__(/*! vue */ 25));
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var realAtob;
var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var b64re = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
if (typeof atob !== 'function') {
  realAtob = function realAtob(str) {
    str = String(str).replace(/[\t\n\f\r ]+/g, '');
    if (!b64re.test(str)) {
      throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    }

    // Adding the padding if missing, for semplicity
    str += '=='.slice(2 - (str.length & 3));
    var bitmap;
    var result = '';
    var r1;
    var r2;
    var i = 0;
    for (; i < str.length;) {
      bitmap = b64.indexOf(str.charAt(i++)) << 18 | b64.indexOf(str.charAt(i++)) << 12 | (r1 = b64.indexOf(str.charAt(i++))) << 6 | (r2 = b64.indexOf(str.charAt(i++)));
      result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255) : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255) : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
    }
    return result;
  };
} else {
  // 注意atob只能在全局对象上调用，例如：`const Base64 = {atob};Base64.atob('xxxx')`是错误的用法
  realAtob = atob;
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(realAtob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
function getCurrentUserInfo() {
  var token = wx.getStorageSync('uni_id_token') || '';
  var tokenArr = token.split('.');
  if (!token || tokenArr.length !== 3) {
    return {
      uid: null,
      role: [],
      permission: [],
      tokenExpired: 0
    };
  }
  var userInfo;
  try {
    userInfo = JSON.parse(b64DecodeUnicode(tokenArr[1]));
  } catch (error) {
    throw new Error('获取当前用户信息出错，详细错误信息为：' + error.message);
  }
  userInfo.tokenExpired = userInfo.exp * 1000;
  delete userInfo.exp;
  delete userInfo.iat;
  return userInfo;
}
function uniIdMixin(Vue) {
  Vue.prototype.uniIDHasRole = function (roleId) {
    var _getCurrentUserInfo = getCurrentUserInfo(),
      role = _getCurrentUserInfo.role;
    return role.indexOf(roleId) > -1;
  };
  Vue.prototype.uniIDHasPermission = function (permissionId) {
    var _getCurrentUserInfo2 = getCurrentUserInfo(),
      permission = _getCurrentUserInfo2.permission;
    return this.uniIDHasRole('admin') || permission.indexOf(permissionId) > -1;
  };
  Vue.prototype.uniIDTokenValid = function () {
    var _getCurrentUserInfo3 = getCurrentUserInfo(),
      tokenExpired = _getCurrentUserInfo3.tokenExpired;
    return tokenExpired > Date.now();
  };
}
var _toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;
function isFn(fn) {
  return typeof fn === 'function';
}
function isStr(str) {
  return typeof str === 'string';
}
function isObject(obj) {
  return obj !== null && (0, _typeof2.default)(obj) === 'object';
}
function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]';
}
function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}
function noop() {}

/**
 * Create a cached version of a pure function.
 */
function cached(fn) {
  var cache = Object.create(null);
  return function cachedFn(str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) {
    return c ? c.toUpperCase() : '';
  });
});
function sortObject(obj) {
  var sortObj = {};
  if (isPlainObject(obj)) {
    Object.keys(obj).sort().forEach(function (key) {
      sortObj[key] = obj[key];
    });
  }
  return !Object.keys(sortObj) ? obj : sortObj;
}
var HOOKS = ['invoke', 'success', 'fail', 'complete', 'returnValue'];
var globalInterceptors = {};
var scopedInterceptors = {};
function mergeHook(parentVal, childVal) {
  var res = childVal ? parentVal ? parentVal.concat(childVal) : Array.isArray(childVal) ? childVal : [childVal] : parentVal;
  return res ? dedupeHooks(res) : res;
}
function dedupeHooks(hooks) {
  var res = [];
  for (var i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i]);
    }
  }
  return res;
}
function removeHook(hooks, hook) {
  var index = hooks.indexOf(hook);
  if (index !== -1) {
    hooks.splice(index, 1);
  }
}
function mergeInterceptorHook(interceptor, option) {
  Object.keys(option).forEach(function (hook) {
    if (HOOKS.indexOf(hook) !== -1 && isFn(option[hook])) {
      interceptor[hook] = mergeHook(interceptor[hook], option[hook]);
    }
  });
}
function removeInterceptorHook(interceptor, option) {
  if (!interceptor || !option) {
    return;
  }
  Object.keys(option).forEach(function (hook) {
    if (HOOKS.indexOf(hook) !== -1 && isFn(option[hook])) {
      removeHook(interceptor[hook], option[hook]);
    }
  });
}
function addInterceptor(method, option) {
  if (typeof method === 'string' && isPlainObject(option)) {
    mergeInterceptorHook(scopedInterceptors[method] || (scopedInterceptors[method] = {}), option);
  } else if (isPlainObject(method)) {
    mergeInterceptorHook(globalInterceptors, method);
  }
}
function removeInterceptor(method, option) {
  if (typeof method === 'string') {
    if (isPlainObject(option)) {
      removeInterceptorHook(scopedInterceptors[method], option);
    } else {
      delete scopedInterceptors[method];
    }
  } else if (isPlainObject(method)) {
    removeInterceptorHook(globalInterceptors, method);
  }
}
function wrapperHook(hook, params) {
  return function (data) {
    return hook(data, params) || data;
  };
}
function isPromise(obj) {
  return !!obj && ((0, _typeof2.default)(obj) === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}
function queue(hooks, data, params) {
  var promise = false;
  for (var i = 0; i < hooks.length; i++) {
    var hook = hooks[i];
    if (promise) {
      promise = Promise.resolve(wrapperHook(hook, params));
    } else {
      var res = hook(data, params);
      if (isPromise(res)) {
        promise = Promise.resolve(res);
      }
      if (res === false) {
        return {
          then: function then() {}
        };
      }
    }
  }
  return promise || {
    then: function then(callback) {
      return callback(data);
    }
  };
}
function wrapperOptions(interceptor) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  ['success', 'fail', 'complete'].forEach(function (name) {
    if (Array.isArray(interceptor[name])) {
      var oldCallback = options[name];
      options[name] = function callbackInterceptor(res) {
        queue(interceptor[name], res, options).then(function (res) {
          /* eslint-disable no-mixed-operators */
          return isFn(oldCallback) && oldCallback(res) || res;
        });
      };
    }
  });
  return options;
}
function wrapperReturnValue(method, returnValue) {
  var returnValueHooks = [];
  if (Array.isArray(globalInterceptors.returnValue)) {
    returnValueHooks.push.apply(returnValueHooks, (0, _toConsumableArray2.default)(globalInterceptors.returnValue));
  }
  var interceptor = scopedInterceptors[method];
  if (interceptor && Array.isArray(interceptor.returnValue)) {
    returnValueHooks.push.apply(returnValueHooks, (0, _toConsumableArray2.default)(interceptor.returnValue));
  }
  returnValueHooks.forEach(function (hook) {
    returnValue = hook(returnValue) || returnValue;
  });
  return returnValue;
}
function getApiInterceptorHooks(method) {
  var interceptor = Object.create(null);
  Object.keys(globalInterceptors).forEach(function (hook) {
    if (hook !== 'returnValue') {
      interceptor[hook] = globalInterceptors[hook].slice();
    }
  });
  var scopedInterceptor = scopedInterceptors[method];
  if (scopedInterceptor) {
    Object.keys(scopedInterceptor).forEach(function (hook) {
      if (hook !== 'returnValue') {
        interceptor[hook] = (interceptor[hook] || []).concat(scopedInterceptor[hook]);
      }
    });
  }
  return interceptor;
}
function invokeApi(method, api, options) {
  for (var _len = arguments.length, params = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    params[_key - 3] = arguments[_key];
  }
  var interceptor = getApiInterceptorHooks(method);
  if (interceptor && Object.keys(interceptor).length) {
    if (Array.isArray(interceptor.invoke)) {
      var res = queue(interceptor.invoke, options);
      return res.then(function (options) {
        // 重新访问 getApiInterceptorHooks, 允许 invoke 中再次调用 addInterceptor,removeInterceptor
        return api.apply(void 0, [wrapperOptions(getApiInterceptorHooks(method), options)].concat(params));
      });
    } else {
      return api.apply(void 0, [wrapperOptions(interceptor, options)].concat(params));
    }
  }
  return api.apply(void 0, [options].concat(params));
}
var promiseInterceptor = {
  returnValue: function returnValue(res) {
    if (!isPromise(res)) {
      return res;
    }
    return new Promise(function (resolve, reject) {
      res.then(function (res) {
        if (!res) {
          resolve(res);
          return;
        }
        if (res[0]) {
          reject(res[0]);
        } else {
          resolve(res[1]);
        }
      });
    });
  }
};
var SYNC_API_RE = /^\$|__f__|Window$|WindowStyle$|sendHostEvent|sendNativeEvent|restoreGlobal|requireGlobal|getCurrentSubNVue|getMenuButtonBoundingClientRect|^report|interceptors|Interceptor$|getSubNVueById|requireNativePlugin|rpx2px|upx2px|hideKeyboard|canIUse|^create|Sync$|Manager$|base64ToArrayBuffer|arrayBufferToBase64|getLocale|setLocale|invokePushCallback|getWindowInfo|getDeviceInfo|getAppBaseInfo|getSystemSetting|getAppAuthorizeSetting|initUTS|requireUTS|registerUTS/;
var CONTEXT_API_RE = /^create|Manager$/;

// Context例外情况
var CONTEXT_API_RE_EXC = ['createBLEConnection'];

// 同步例外情况
var ASYNC_API = ['createBLEConnection', 'createPushMessage'];
var CALLBACK_API_RE = /^on|^off/;
function isContextApi(name) {
  return CONTEXT_API_RE.test(name) && CONTEXT_API_RE_EXC.indexOf(name) === -1;
}
function isSyncApi(name) {
  return SYNC_API_RE.test(name) && ASYNC_API.indexOf(name) === -1;
}
function isCallbackApi(name) {
  return CALLBACK_API_RE.test(name) && name !== 'onPush';
}
function handlePromise(promise) {
  return promise.then(function (data) {
    return [null, data];
  }).catch(function (err) {
    return [err];
  });
}
function shouldPromise(name) {
  if (isContextApi(name) || isSyncApi(name) || isCallbackApi(name)) {
    return false;
  }
  return true;
}

/* eslint-disable no-extend-native */
if (!Promise.prototype.finally) {
  Promise.prototype.finally = function (callback) {
    var promise = this.constructor;
    return this.then(function (value) {
      return promise.resolve(callback()).then(function () {
        return value;
      });
    }, function (reason) {
      return promise.resolve(callback()).then(function () {
        throw reason;
      });
    });
  };
}
function promisify(name, api) {
  if (!shouldPromise(name) || !isFn(api)) {
    return api;
  }
  return function promiseApi() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    for (var _len2 = arguments.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      params[_key2 - 1] = arguments[_key2];
    }
    if (isFn(options.success) || isFn(options.fail) || isFn(options.complete)) {
      return wrapperReturnValue(name, invokeApi.apply(void 0, [name, api, Object.assign({}, options)].concat(params)));
    }
    return wrapperReturnValue(name, handlePromise(new Promise(function (resolve, reject) {
      invokeApi.apply(void 0, [name, api, Object.assign({}, options, {
        success: resolve,
        fail: reject
      })].concat(params));
    })));
  };
}
var EPS = 1e-4;
var BASE_DEVICE_WIDTH = 750;
var isIOS = false;
var deviceWidth = 0;
var deviceDPR = 0;
function checkDeviceWidth() {
  var windowWidth, pixelRatio, platform;
  {
    var windowInfo = typeof wx.getWindowInfo === 'function' && wx.getWindowInfo() ? wx.getWindowInfo() : wx.getSystemInfoSync();
    var deviceInfo = typeof wx.getDeviceInfo === 'function' && wx.getDeviceInfo() ? wx.getDeviceInfo() : wx.getSystemInfoSync();
    windowWidth = windowInfo.windowWidth;
    pixelRatio = windowInfo.pixelRatio;
    platform = deviceInfo.platform;
  }
  deviceWidth = windowWidth;
  deviceDPR = pixelRatio;
  isIOS = platform === 'ios';
}
function upx2px(number, newDeviceWidth) {
  if (deviceWidth === 0) {
    checkDeviceWidth();
  }
  number = Number(number);
  if (number === 0) {
    return 0;
  }
  var result = number / BASE_DEVICE_WIDTH * (newDeviceWidth || deviceWidth);
  if (result < 0) {
    result = -result;
  }
  result = Math.floor(result + EPS);
  if (result === 0) {
    if (deviceDPR === 1 || !isIOS) {
      result = 1;
    } else {
      result = 0.5;
    }
  }
  return number < 0 ? -result : result;
}
var LOCALE_ZH_HANS = 'zh-Hans';
var LOCALE_ZH_HANT = 'zh-Hant';
var LOCALE_EN = 'en';
var LOCALE_FR = 'fr';
var LOCALE_ES = 'es';
var messages = {};
function getLocaleLanguage() {
  var localeLanguage = '';
  {
    var appBaseInfo = typeof wx.getAppBaseInfo === 'function' && wx.getAppBaseInfo() ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
    var language = appBaseInfo && appBaseInfo.language ? appBaseInfo.language : LOCALE_EN;
    localeLanguage = normalizeLocale(language) || LOCALE_EN;
  }
  return localeLanguage;
}
var locale;
{
  locale = getLocaleLanguage();
}
function initI18nMessages() {
  if (!isEnableLocale()) {
    return;
  }
  var localeKeys = Object.keys(__uniConfig.locales);
  if (localeKeys.length) {
    localeKeys.forEach(function (locale) {
      var curMessages = messages[locale];
      var userMessages = __uniConfig.locales[locale];
      if (curMessages) {
        Object.assign(curMessages, userMessages);
      } else {
        messages[locale] = userMessages;
      }
    });
  }
}
initI18nMessages();
var i18n = (0, _uniI18n.initVueI18n)(locale, {});
var t = i18n.t;
var i18nMixin = i18n.mixin = {
  beforeCreate: function beforeCreate() {
    var _this = this;
    var unwatch = i18n.i18n.watchLocale(function () {
      _this.$forceUpdate();
    });
    this.$once('hook:beforeDestroy', function () {
      unwatch();
    });
  },
  methods: {
    $$t: function $$t(key, values) {
      return t(key, values);
    }
  }
};
var setLocale = i18n.setLocale;
var getLocale = i18n.getLocale;
function initAppLocale(Vue, appVm, locale) {
  var state = Vue.observable({
    locale: locale || i18n.getLocale()
  });
  var localeWatchers = [];
  appVm.$watchLocale = function (fn) {
    localeWatchers.push(fn);
  };
  Object.defineProperty(appVm, '$locale', {
    get: function get() {
      return state.locale;
    },
    set: function set(v) {
      state.locale = v;
      localeWatchers.forEach(function (watch) {
        return watch(v);
      });
    }
  });
}
function isEnableLocale() {
  return typeof __uniConfig !== 'undefined' && __uniConfig.locales && !!Object.keys(__uniConfig.locales).length;
}
function include(str, parts) {
  return !!parts.find(function (part) {
    return str.indexOf(part) !== -1;
  });
}
function startsWith(str, parts) {
  return parts.find(function (part) {
    return str.indexOf(part) === 0;
  });
}
function normalizeLocale(locale, messages) {
  if (!locale) {
    return;
  }
  locale = locale.trim().replace(/_/g, '-');
  if (messages && messages[locale]) {
    return locale;
  }
  locale = locale.toLowerCase();
  if (locale === 'chinese') {
    // 支付宝
    return LOCALE_ZH_HANS;
  }
  if (locale.indexOf('zh') === 0) {
    if (locale.indexOf('-hans') > -1) {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf('-hant') > -1) {
      return LOCALE_ZH_HANT;
    }
    if (include(locale, ['-tw', '-hk', '-mo', '-cht'])) {
      return LOCALE_ZH_HANT;
    }
    return LOCALE_ZH_HANS;
  }
  var lang = startsWith(locale, [LOCALE_EN, LOCALE_FR, LOCALE_ES]);
  if (lang) {
    return lang;
  }
}
// export function initI18n() {
//   const localeKeys = Object.keys(__uniConfig.locales || {})
//   if (localeKeys.length) {
//     localeKeys.forEach((locale) =>
//       i18n.add(locale, __uniConfig.locales[locale])
//     )
//   }
// }

function getLocale$1() {
  // 优先使用 $locale
  if (isFn(getApp)) {
    var app = getApp({
      allowDefault: true
    });
    if (app && app.$vm) {
      return app.$vm.$locale;
    }
  }
  return getLocaleLanguage();
}
function setLocale$1(locale) {
  var app = isFn(getApp) ? getApp() : false;
  if (!app) {
    return false;
  }
  var oldLocale = app.$vm.$locale;
  if (oldLocale !== locale) {
    app.$vm.$locale = locale;
    onLocaleChangeCallbacks.forEach(function (fn) {
      return fn({
        locale: locale
      });
    });
    return true;
  }
  return false;
}
var onLocaleChangeCallbacks = [];
function onLocaleChange(fn) {
  if (onLocaleChangeCallbacks.indexOf(fn) === -1) {
    onLocaleChangeCallbacks.push(fn);
  }
}
if (typeof global !== 'undefined') {
  global.getLocale = getLocale$1;
}
var interceptors = {
  promiseInterceptor: promiseInterceptor
};
var baseApi = /*#__PURE__*/Object.freeze({
  __proto__: null,
  upx2px: upx2px,
  rpx2px: upx2px,
  getLocale: getLocale$1,
  setLocale: setLocale$1,
  onLocaleChange: onLocaleChange,
  addInterceptor: addInterceptor,
  removeInterceptor: removeInterceptor,
  interceptors: interceptors
});
function findExistsPageIndex(url) {
  var pages = getCurrentPages();
  var len = pages.length;
  while (len--) {
    var page = pages[len];
    if (page.$page && page.$page.fullPath === url) {
      return len;
    }
  }
  return -1;
}
var redirectTo = {
  name: function name(fromArgs) {
    if (fromArgs.exists === 'back' && fromArgs.delta) {
      return 'navigateBack';
    }
    return 'redirectTo';
  },
  args: function args(fromArgs) {
    if (fromArgs.exists === 'back' && fromArgs.url) {
      var existsPageIndex = findExistsPageIndex(fromArgs.url);
      if (existsPageIndex !== -1) {
        var delta = getCurrentPages().length - 1 - existsPageIndex;
        if (delta > 0) {
          fromArgs.delta = delta;
        }
      }
    }
  }
};
var previewImage = {
  args: function args(fromArgs) {
    var currentIndex = parseInt(fromArgs.current);
    if (isNaN(currentIndex)) {
      return;
    }
    var urls = fromArgs.urls;
    if (!Array.isArray(urls)) {
      return;
    }
    var len = urls.length;
    if (!len) {
      return;
    }
    if (currentIndex < 0) {
      currentIndex = 0;
    } else if (currentIndex >= len) {
      currentIndex = len - 1;
    }
    if (currentIndex > 0) {
      fromArgs.current = urls[currentIndex];
      fromArgs.urls = urls.filter(function (item, index) {
        return index < currentIndex ? item !== urls[currentIndex] : true;
      });
    } else {
      fromArgs.current = urls[0];
    }
    return {
      indicator: false,
      loop: false
    };
  }
};
var UUID_KEY = '__DC_STAT_UUID';
var deviceId;
function useDeviceId(result) {
  deviceId = deviceId || wx.getStorageSync(UUID_KEY);
  if (!deviceId) {
    deviceId = Date.now() + '' + Math.floor(Math.random() * 1e7);
    wx.setStorage({
      key: UUID_KEY,
      data: deviceId
    });
  }
  result.deviceId = deviceId;
}
function addSafeAreaInsets(result) {
  if (result.safeArea) {
    var safeArea = result.safeArea;
    result.safeAreaInsets = {
      top: safeArea.top,
      left: safeArea.left,
      right: result.windowWidth - safeArea.right,
      bottom: result.screenHeight - safeArea.bottom
    };
  }
}
function getOSInfo(system, platform) {
  var osName = '';
  var osVersion = '';
  if (platform && "mp-weixin" === 'mp-baidu') {
    osName = platform;
    osVersion = system;
  } else {
    osName = system.split(' ')[0] || platform;
    osVersion = system.split(' ')[1] || '';
  }
  osName = osName.toLocaleLowerCase();
  switch (osName) {
    case 'harmony': // alipay
    case 'ohos': // weixin
    case 'openharmony':
      // feishu
      osName = 'harmonyos';
      break;
    case 'iphone os':
      // alipay
      osName = 'ios';
      break;
    case 'mac': // weixin qq
    case 'darwin':
      // feishu
      osName = 'macos';
      break;
    case 'windows_nt':
      // feishu
      osName = 'windows';
      break;
  }
  return {
    osName: osName,
    osVersion: osVersion
  };
}
function populateParameters(result) {
  var _result$brand = result.brand,
    brand = _result$brand === void 0 ? '' : _result$brand,
    _result$model = result.model,
    model = _result$model === void 0 ? '' : _result$model,
    _result$system = result.system,
    system = _result$system === void 0 ? '' : _result$system,
    _result$language = result.language,
    language = _result$language === void 0 ? '' : _result$language,
    theme = result.theme,
    version = result.version,
    platform = result.platform,
    fontSizeSetting = result.fontSizeSetting,
    SDKVersion = result.SDKVersion,
    pixelRatio = result.pixelRatio,
    deviceOrientation = result.deviceOrientation;
  // const isQuickApp = "mp-weixin".indexOf('quickapp-webview') !== -1

  var extraParam = {};

  // osName osVersion
  var _getOSInfo = getOSInfo(system, platform),
    osName = _getOSInfo.osName,
    osVersion = _getOSInfo.osVersion;
  var hostVersion = version;

  // deviceType
  var deviceType = getGetDeviceType(result, model);

  // deviceModel
  var deviceBrand = getDeviceBrand(brand);

  // hostName
  var _hostName = getHostName(result);

  // deviceOrientation
  var _deviceOrientation = deviceOrientation; // 仅 微信 百度 支持

  // devicePixelRatio
  var _devicePixelRatio = pixelRatio;

  // SDKVersion
  var _SDKVersion = SDKVersion;

  // hostLanguage
  var hostLanguage = (language || '').replace(/_/g, '-');

  // wx.getAccountInfoSync

  var parameters = {
    appId: "__UNI__A7A028A",
    appName: "superPower",
    appVersion: "1.0.0",
    appVersionCode: "100",
    appLanguage: getAppLanguage(hostLanguage),
    uniCompileVersion: "4.76",
    uniCompilerVersion: "4.76",
    uniRuntimeVersion: "4.76",
    uniPlatform: undefined || "mp-weixin",
    deviceBrand: deviceBrand,
    deviceModel: model,
    deviceType: deviceType,
    devicePixelRatio: _devicePixelRatio,
    deviceOrientation: _deviceOrientation,
    osName: osName.toLocaleLowerCase(),
    osVersion: osVersion,
    hostTheme: theme,
    hostVersion: hostVersion,
    hostLanguage: hostLanguage,
    hostName: _hostName,
    hostSDKVersion: _SDKVersion,
    hostFontSizeSetting: fontSizeSetting,
    windowTop: 0,
    windowBottom: 0,
    // TODO
    osLanguage: undefined,
    osTheme: undefined,
    ua: undefined,
    hostPackageName: undefined,
    browserName: undefined,
    browserVersion: undefined,
    isUniAppX: false
  };
  Object.assign(result, parameters, extraParam);
}
function getGetDeviceType(result, model) {
  var deviceType = result.deviceType || 'phone';
  {
    var deviceTypeMaps = {
      ipad: 'pad',
      windows: 'pc',
      mac: 'pc'
    };
    var deviceTypeMapsKeys = Object.keys(deviceTypeMaps);
    var _model = model.toLocaleLowerCase();
    for (var index = 0; index < deviceTypeMapsKeys.length; index++) {
      var _m = deviceTypeMapsKeys[index];
      if (_model.indexOf(_m) !== -1) {
        deviceType = deviceTypeMaps[_m];
        break;
      }
    }
  }
  return deviceType;
}
function getDeviceBrand(brand) {
  var deviceBrand = brand;
  if (deviceBrand) {
    deviceBrand = brand.toLocaleLowerCase();
  }
  return deviceBrand;
}
function getAppLanguage(defaultLanguage) {
  return getLocale$1 ? getLocale$1() : defaultLanguage;
}
function getHostName(result) {
  var _platform = 'WeChat';
  var _hostName = result.hostName || _platform; // mp-jd
  {
    if (result.environment) {
      _hostName = result.environment;
    } else if (result.host && result.host.env) {
      _hostName = result.host.env;
    }
  }
  return _hostName;
}
var getSystemInfo = {
  returnValue: function returnValue(result) {
    useDeviceId(result);
    addSafeAreaInsets(result);
    populateParameters(result);
  }
};
var showActionSheet = {
  args: function args(fromArgs) {
    if ((0, _typeof2.default)(fromArgs) === 'object') {
      fromArgs.alertText = fromArgs.title;
    }
  }
};
var getAppBaseInfo = {
  returnValue: function returnValue(result) {
    var _result = result,
      version = _result.version,
      language = _result.language,
      SDKVersion = _result.SDKVersion,
      theme = _result.theme;
    var _hostName = getHostName(result);
    var hostLanguage = (language || '').replace('_', '-');
    result = sortObject(Object.assign(result, {
      appId: "__UNI__A7A028A",
      appName: "superPower",
      appVersion: "1.0.0",
      appVersionCode: "100",
      appLanguage: getAppLanguage(hostLanguage),
      hostVersion: version,
      hostLanguage: hostLanguage,
      hostName: _hostName,
      hostSDKVersion: SDKVersion,
      hostTheme: theme,
      isUniAppX: false,
      uniPlatform: undefined || "mp-weixin",
      uniCompileVersion: "4.76",
      uniCompilerVersion: "4.76",
      uniRuntimeVersion: "4.76"
    }));
  }
};
var getDeviceInfo = {
  returnValue: function returnValue(result) {
    var _result2 = result,
      brand = _result2.brand,
      model = _result2.model,
      _result2$system = _result2.system,
      system = _result2$system === void 0 ? '' : _result2$system,
      _result2$platform = _result2.platform,
      platform = _result2$platform === void 0 ? '' : _result2$platform;
    var deviceType = getGetDeviceType(result, model);
    var deviceBrand = getDeviceBrand(brand);
    useDeviceId(result);
    var _getOSInfo2 = getOSInfo(system, platform),
      osName = _getOSInfo2.osName,
      osVersion = _getOSInfo2.osVersion;
    result = sortObject(Object.assign(result, {
      deviceType: deviceType,
      deviceBrand: deviceBrand,
      deviceModel: model,
      osName: osName,
      osVersion: osVersion
    }));
  }
};
var getWindowInfo = {
  returnValue: function returnValue(result) {
    addSafeAreaInsets(result);
    result = sortObject(Object.assign(result, {
      windowTop: 0,
      windowBottom: 0
    }));
  }
};
var getAppAuthorizeSetting = {
  returnValue: function returnValue(result) {
    var locationReducedAccuracy = result.locationReducedAccuracy;
    result.locationAccuracy = 'unsupported';
    if (locationReducedAccuracy === true) {
      result.locationAccuracy = 'reduced';
    } else if (locationReducedAccuracy === false) {
      result.locationAccuracy = 'full';
    }
  }
};

// import navigateTo from 'uni-helpers/navigate-to'

var compressImage = {
  args: function args(fromArgs) {
    // https://developers.weixin.qq.com/community/develop/doc/000c08940c865011298e0a43256800?highLine=compressHeight
    if (fromArgs.compressedHeight && !fromArgs.compressHeight) {
      fromArgs.compressHeight = fromArgs.compressedHeight;
    }
    if (fromArgs.compressedWidth && !fromArgs.compressWidth) {
      fromArgs.compressWidth = fromArgs.compressedWidth;
    }
  }
};
var protocols = {
  redirectTo: redirectTo,
  // navigateTo,  // 由于在微信开发者工具的页面参数，会显示__id__参数，因此暂时关闭mp-weixin对于navigateTo的AOP
  previewImage: previewImage,
  getSystemInfo: getSystemInfo,
  getSystemInfoSync: getSystemInfo,
  showActionSheet: showActionSheet,
  getAppBaseInfo: getAppBaseInfo,
  getDeviceInfo: getDeviceInfo,
  getWindowInfo: getWindowInfo,
  getAppAuthorizeSetting: getAppAuthorizeSetting,
  compressImage: compressImage
};
var todos = ['vibrate', 'preloadPage', 'unPreloadPage', 'loadSubPackage'];
var canIUses = [];
var CALLBACKS = ['success', 'fail', 'cancel', 'complete'];
function processCallback(methodName, method, returnValue) {
  return function (res) {
    return method(processReturnValue(methodName, res, returnValue));
  };
}
function processArgs(methodName, fromArgs) {
  var argsOption = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var returnValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var keepFromArgs = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
  if (isPlainObject(fromArgs)) {
    // 一般 api 的参数解析
    var toArgs = keepFromArgs === true ? fromArgs : {}; // returnValue 为 false 时，说明是格式化返回值，直接在返回值对象上修改赋值
    if (isFn(argsOption)) {
      argsOption = argsOption(fromArgs, toArgs) || {};
    }
    for (var key in fromArgs) {
      if (hasOwn(argsOption, key)) {
        var keyOption = argsOption[key];
        if (isFn(keyOption)) {
          keyOption = keyOption(fromArgs[key], fromArgs, toArgs);
        }
        if (!keyOption) {
          // 不支持的参数
          console.warn("The '".concat(methodName, "' method of platform '\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F' does not support option '").concat(key, "'"));
        } else if (isStr(keyOption)) {
          // 重写参数 key
          toArgs[keyOption] = fromArgs[key];
        } else if (isPlainObject(keyOption)) {
          // {name:newName,value:value}可重新指定参数 key:value
          toArgs[keyOption.name ? keyOption.name : key] = keyOption.value;
        }
      } else if (CALLBACKS.indexOf(key) !== -1) {
        if (isFn(fromArgs[key])) {
          toArgs[key] = processCallback(methodName, fromArgs[key], returnValue);
        }
      } else {
        if (!keepFromArgs) {
          toArgs[key] = fromArgs[key];
        }
      }
    }
    return toArgs;
  } else if (isFn(fromArgs)) {
    fromArgs = processCallback(methodName, fromArgs, returnValue);
  }
  return fromArgs;
}
function processReturnValue(methodName, res, returnValue) {
  var keepReturnValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  if (isFn(protocols.returnValue)) {
    // 处理通用 returnValue
    res = protocols.returnValue(methodName, res);
  }
  return processArgs(methodName, res, returnValue, {}, keepReturnValue);
}
function wrapper(methodName, method) {
  if (hasOwn(protocols, methodName)) {
    var protocol = protocols[methodName];
    if (!protocol) {
      // 暂不支持的 api
      return function () {
        console.error("Platform '\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F' does not support '".concat(methodName, "'."));
      };
    }
    return function (arg1, arg2) {
      // 目前 api 最多两个参数
      var options = protocol;
      if (isFn(protocol)) {
        options = protocol(arg1);
      }
      arg1 = processArgs(methodName, arg1, options.args, options.returnValue);
      var args = [arg1];
      if (typeof arg2 !== 'undefined') {
        args.push(arg2);
      }
      if (isFn(options.name)) {
        methodName = options.name(arg1);
      } else if (isStr(options.name)) {
        methodName = options.name;
      }
      var returnValue = wx[methodName].apply(wx, args);
      if (isSyncApi(methodName)) {
        // 同步 api
        return processReturnValue(methodName, returnValue, options.returnValue, isContextApi(methodName));
      }
      return returnValue;
    };
  }
  return method;
}
var todoApis = Object.create(null);
var TODOS = ['onTabBarMidButtonTap', 'subscribePush', 'unsubscribePush', 'onPush', 'offPush', 'share'];
function createTodoApi(name) {
  return function todoApi(_ref) {
    var fail = _ref.fail,
      complete = _ref.complete;
    var res = {
      errMsg: "".concat(name, ":fail method '").concat(name, "' not supported")
    };
    isFn(fail) && fail(res);
    isFn(complete) && complete(res);
  };
}
TODOS.forEach(function (name) {
  todoApis[name] = createTodoApi(name);
});
var providers = {
  oauth: ['weixin'],
  share: ['weixin'],
  payment: ['wxpay'],
  push: ['weixin']
};
function getProvider(_ref2) {
  var service = _ref2.service,
    success = _ref2.success,
    fail = _ref2.fail,
    complete = _ref2.complete;
  var res = false;
  if (providers[service]) {
    res = {
      errMsg: 'getProvider:ok',
      service: service,
      provider: providers[service]
    };
    isFn(success) && success(res);
  } else {
    res = {
      errMsg: 'getProvider:fail service not found'
    };
    isFn(fail) && fail(res);
  }
  isFn(complete) && complete(res);
}
var extraApi = /*#__PURE__*/Object.freeze({
  __proto__: null,
  getProvider: getProvider
});
var getEmitter = function () {
  var Emitter;
  return function getUniEmitter() {
    if (!Emitter) {
      Emitter = new _vue.default();
    }
    return Emitter;
  };
}();
function apply(ctx, method, args) {
  return ctx[method].apply(ctx, args);
}
function $on() {
  return apply(getEmitter(), '$on', Array.prototype.slice.call(arguments));
}
function $off() {
  return apply(getEmitter(), '$off', Array.prototype.slice.call(arguments));
}
function $once() {
  return apply(getEmitter(), '$once', Array.prototype.slice.call(arguments));
}
function $emit() {
  return apply(getEmitter(), '$emit', Array.prototype.slice.call(arguments));
}
var eventApi = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $on: $on,
  $off: $off,
  $once: $once,
  $emit: $emit
});

/**
 * 框架内 try-catch
 */
/**
 * 开发者 try-catch
 */
function tryCatch(fn) {
  return function () {
    try {
      return fn.apply(fn, arguments);
    } catch (e) {
      // TODO
      console.error(e);
    }
  };
}
function getApiCallbacks(params) {
  var apiCallbacks = {};
  for (var name in params) {
    var param = params[name];
    if (isFn(param)) {
      apiCallbacks[name] = tryCatch(param);
      delete params[name];
    }
  }
  return apiCallbacks;
}
var cid;
var cidErrMsg;
var enabled;
function normalizePushMessage(message) {
  try {
    return JSON.parse(message);
  } catch (e) {}
  return message;
}
function invokePushCallback(args) {
  if (args.type === 'enabled') {
    enabled = true;
  } else if (args.type === 'clientId') {
    cid = args.cid;
    cidErrMsg = args.errMsg;
    invokeGetPushCidCallbacks(cid, args.errMsg);
  } else if (args.type === 'pushMsg') {
    var message = {
      type: 'receive',
      data: normalizePushMessage(args.message)
    };
    for (var i = 0; i < onPushMessageCallbacks.length; i++) {
      var callback = onPushMessageCallbacks[i];
      callback(message);
      // 该消息已被阻止
      if (message.stopped) {
        break;
      }
    }
  } else if (args.type === 'click') {
    onPushMessageCallbacks.forEach(function (callback) {
      callback({
        type: 'click',
        data: normalizePushMessage(args.message)
      });
    });
  }
}
var getPushCidCallbacks = [];
function invokeGetPushCidCallbacks(cid, errMsg) {
  getPushCidCallbacks.forEach(function (callback) {
    callback(cid, errMsg);
  });
  getPushCidCallbacks.length = 0;
}
function getPushClientId(args) {
  if (!isPlainObject(args)) {
    args = {};
  }
  var _getApiCallbacks = getApiCallbacks(args),
    success = _getApiCallbacks.success,
    fail = _getApiCallbacks.fail,
    complete = _getApiCallbacks.complete;
  var hasSuccess = isFn(success);
  var hasFail = isFn(fail);
  var hasComplete = isFn(complete);
  Promise.resolve().then(function () {
    if (typeof enabled === 'undefined') {
      enabled = false;
      cid = '';
      cidErrMsg = 'uniPush is not enabled';
    }
    getPushCidCallbacks.push(function (cid, errMsg) {
      var res;
      if (cid) {
        res = {
          errMsg: 'getPushClientId:ok',
          cid: cid
        };
        hasSuccess && success(res);
      } else {
        res = {
          errMsg: 'getPushClientId:fail' + (errMsg ? ' ' + errMsg : '')
        };
        hasFail && fail(res);
      }
      hasComplete && complete(res);
    });
    if (typeof cid !== 'undefined') {
      invokeGetPushCidCallbacks(cid, cidErrMsg);
    }
  });
}
var onPushMessageCallbacks = [];
// 不使用 defineOnApi 实现，是因为 defineOnApi 依赖 UniServiceJSBridge ，该对象目前在小程序上未提供，故简单实现
var onPushMessage = function onPushMessage(fn) {
  if (onPushMessageCallbacks.indexOf(fn) === -1) {
    onPushMessageCallbacks.push(fn);
  }
};
var offPushMessage = function offPushMessage(fn) {
  if (!fn) {
    onPushMessageCallbacks.length = 0;
  } else {
    var index = onPushMessageCallbacks.indexOf(fn);
    if (index > -1) {
      onPushMessageCallbacks.splice(index, 1);
    }
  }
};
function __f__(type) {
  for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    args[_key3 - 1] = arguments[_key3];
  }
  console[type].apply(console, args);
}
var baseInfo = wx.getAppBaseInfo && wx.getAppBaseInfo();
if (!baseInfo) {
  baseInfo = wx.getSystemInfoSync();
}
var host = baseInfo ? baseInfo.host : null;
var shareVideoMessage = host && host.env === 'SAAASDK' ? wx.miniapp.shareVideoMessage : wx.shareVideoMessage;
var api = /*#__PURE__*/Object.freeze({
  __proto__: null,
  shareVideoMessage: shareVideoMessage,
  getPushClientId: getPushClientId,
  onPushMessage: onPushMessage,
  offPushMessage: offPushMessage,
  invokePushCallback: invokePushCallback,
  __f__: __f__
});
var mocks = ['__route__', '__wxExparserNodeId__', '__wxWebviewId__'];
function findVmByVueId(vm, vuePid) {
  var $children = vm.$children;
  // 优先查找直属(反向查找:https://github.com/dcloudio/uni-app/issues/1200)
  for (var i = $children.length - 1; i >= 0; i--) {
    var childVm = $children[i];
    if (childVm.$scope._$vueId === vuePid) {
      return childVm;
    }
  }
  // 反向递归查找
  var parentVm;
  for (var _i = $children.length - 1; _i >= 0; _i--) {
    parentVm = findVmByVueId($children[_i], vuePid);
    if (parentVm) {
      return parentVm;
    }
  }
}
function initBehavior(options) {
  return Behavior(options);
}
function isPage() {
  return !!this.route;
}
function initRelation(detail) {
  this.triggerEvent('__l', detail);
}
function selectAllComponents(mpInstance, selector, $refs) {
  var components = mpInstance.selectAllComponents(selector) || [];
  components.forEach(function (component) {
    var ref = component.dataset.ref;
    $refs[ref] = component.$vm || toSkip(component);
    {
      if (component.dataset.vueGeneric === 'scoped') {
        component.selectAllComponents('.scoped-ref').forEach(function (scopedComponent) {
          selectAllComponents(scopedComponent, selector, $refs);
        });
      }
    }
  });
}
function syncRefs(refs, newRefs) {
  var oldKeys = (0, _construct2.default)(Set, (0, _toConsumableArray2.default)(Object.keys(refs)));
  var newKeys = Object.keys(newRefs);
  newKeys.forEach(function (key) {
    var oldValue = refs[key];
    var newValue = newRefs[key];
    if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length === newValue.length && newValue.every(function (value) {
      return oldValue.includes(value);
    })) {
      return;
    }
    refs[key] = newValue;
    oldKeys.delete(key);
  });
  oldKeys.forEach(function (key) {
    delete refs[key];
  });
  return refs;
}
function initRefs(vm) {
  var mpInstance = vm.$scope;
  var refs = {};
  Object.defineProperty(vm, '$refs', {
    get: function get() {
      var $refs = {};
      selectAllComponents(mpInstance, '.vue-ref', $refs);
      // TODO 暂不考虑 for 中的 scoped
      var forComponents = mpInstance.selectAllComponents('.vue-ref-in-for') || [];
      forComponents.forEach(function (component) {
        var ref = component.dataset.ref;
        if (!$refs[ref]) {
          $refs[ref] = [];
        }
        $refs[ref].push(component.$vm || toSkip(component));
      });
      return syncRefs(refs, $refs);
    }
  });
}
function handleLink(event) {
  var _ref3 = event.detail || event.value,
    vuePid = _ref3.vuePid,
    vueOptions = _ref3.vueOptions; // detail 是微信,value 是百度(dipatch)

  var parentVm;
  if (vuePid) {
    parentVm = findVmByVueId(this.$vm, vuePid);
  }
  if (!parentVm) {
    parentVm = this.$vm;
  }
  vueOptions.parent = parentVm;
}
function markMPComponent(component) {
  // 在 Vue 中标记为小程序组件
  var IS_MP = '__v_isMPComponent';
  Object.defineProperty(component, IS_MP, {
    configurable: true,
    enumerable: false,
    value: true
  });
  return component;
}
function toSkip(obj) {
  var OB = '__ob__';
  var SKIP = '__v_skip';
  if (isObject(obj) && Object.isExtensible(obj)) {
    // 避免被 @vue/composition-api 观测
    Object.defineProperty(obj, OB, {
      configurable: true,
      enumerable: false,
      value: (0, _defineProperty2.default)({}, SKIP, true)
    });
  }
  return obj;
}
var WORKLET_RE = /_(.*)_worklet_factory_/;
function initWorkletMethods(mpMethods, vueMethods) {
  if (vueMethods) {
    Object.keys(vueMethods).forEach(function (name) {
      var matches = name.match(WORKLET_RE);
      if (matches) {
        var workletName = matches[1];
        mpMethods[name] = vueMethods[name];
        mpMethods[workletName] = vueMethods[workletName];
      }
    });
  }
}
var MPPage = Page;
var MPComponent = Component;
var customizeRE = /:/g;
var customize = cached(function (str) {
  return camelize(str.replace(customizeRE, '-'));
});
function initTriggerEvent(mpInstance) {
  var oldTriggerEvent = mpInstance.triggerEvent;
  var newTriggerEvent = function newTriggerEvent(event) {
    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }
    // 事件名统一转驼峰格式，仅处理：当前组件为 vue 组件、当前组件为 vue 组件子组件
    if (this.$vm || this.dataset && this.dataset.comType) {
      event = customize(event);
    } else {
      // 针对微信/QQ小程序单独补充驼峰格式事件，以兼容历史项目
      var newEvent = customize(event);
      if (newEvent !== event) {
        oldTriggerEvent.apply(this, [newEvent].concat(args));
      }
    }
    return oldTriggerEvent.apply(this, [event].concat(args));
  };
  try {
    // 京东小程序 triggerEvent 为只读
    mpInstance.triggerEvent = newTriggerEvent;
  } catch (error) {
    mpInstance._triggerEvent = newTriggerEvent;
  }
}
function initHook(name, options, isComponent) {
  var oldHook = options[name];
  options[name] = function () {
    markMPComponent(this);
    initTriggerEvent(this);
    if (oldHook) {
      for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }
      return oldHook.apply(this, args);
    }
  };
}
if (!MPPage.__$wrappered) {
  MPPage.__$wrappered = true;
  Page = function Page() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    initHook('onLoad', options);
    return MPPage(options);
  };
  Page.after = MPPage.after;
  Component = function Component() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    initHook('created', options);
    return MPComponent(options);
  };
}
var PAGE_EVENT_HOOKS = ['onPullDownRefresh', 'onReachBottom', 'onAddToFavorites', 'onShareTimeline', 'onShareAppMessage', 'onPageScroll', 'onResize', 'onTabItemTap'];
function initMocks(vm, mocks) {
  var mpInstance = vm.$mp[vm.mpType];
  mocks.forEach(function (mock) {
    if (hasOwn(mpInstance, mock)) {
      vm[mock] = mpInstance[mock];
    }
  });
}
function hasHook(hook, vueOptions) {
  if (!vueOptions) {
    return true;
  }
  if (_vue.default.options && Array.isArray(_vue.default.options[hook])) {
    return true;
  }
  vueOptions = vueOptions.default || vueOptions;
  if (isFn(vueOptions)) {
    if (isFn(vueOptions.extendOptions[hook])) {
      return true;
    }
    if (vueOptions.super && vueOptions.super.options && Array.isArray(vueOptions.super.options[hook])) {
      return true;
    }
    return false;
  }
  if (isFn(vueOptions[hook]) || Array.isArray(vueOptions[hook])) {
    return true;
  }
  var mixins = vueOptions.mixins;
  if (Array.isArray(mixins)) {
    return !!mixins.find(function (mixin) {
      return hasHook(hook, mixin);
    });
  }
}
function initHooks(mpOptions, hooks, vueOptions) {
  hooks.forEach(function (hook) {
    if (hasHook(hook, vueOptions)) {
      mpOptions[hook] = function (args) {
        return this.$vm && this.$vm.__call_hook(hook, args);
      };
    }
  });
}
function initUnknownHooks(mpOptions, vueOptions) {
  var excludes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  findHooks(vueOptions).forEach(function (hook) {
    return initHook$1(mpOptions, hook, excludes);
  });
}
function findHooks(vueOptions) {
  var hooks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  if (vueOptions) {
    Object.keys(vueOptions).forEach(function (name) {
      if (name.indexOf('on') === 0 && isFn(vueOptions[name])) {
        hooks.push(name);
      }
    });
  }
  return hooks;
}
function initHook$1(mpOptions, hook, excludes) {
  if (excludes.indexOf(hook) === -1 && !hasOwn(mpOptions, hook)) {
    mpOptions[hook] = function (args) {
      return this.$vm && this.$vm.__call_hook(hook, args);
    };
  }
}
function initVueComponent(Vue, vueOptions) {
  vueOptions = vueOptions.default || vueOptions;
  var VueComponent;
  if (isFn(vueOptions)) {
    VueComponent = vueOptions;
  } else {
    VueComponent = Vue.extend(vueOptions);
  }
  vueOptions = VueComponent.options;
  return [VueComponent, vueOptions];
}
function initSlots(vm, vueSlots) {
  if (Array.isArray(vueSlots) && vueSlots.length) {
    var $slots = Object.create(null);
    vueSlots.forEach(function (slotName) {
      $slots[slotName] = true;
    });
    vm.$scopedSlots = vm.$slots = $slots;
  }
}
function initVueIds(vueIds, mpInstance) {
  vueIds = (vueIds || '').split(',');
  var len = vueIds.length;
  if (len === 1) {
    mpInstance._$vueId = vueIds[0];
  } else if (len === 2) {
    mpInstance._$vueId = vueIds[0];
    mpInstance._$vuePid = vueIds[1];
  }
}
function initData(vueOptions, context) {
  var data = vueOptions.data || {};
  var methods = vueOptions.methods || {};
  if (typeof data === 'function') {
    try {
      data = data.call(context); // 支持 Vue.prototype 上挂的数据
    } catch (e) {
      if (Object({"NODE_ENV":"development","VUE_APP_DARK_MODE":"false","VUE_APP_NAME":"superPower","VUE_APP_PLATFORM":"mp-weixin","BASE_URL":"/"}).VUE_APP_DEBUG) {
        console.warn('根据 Vue 的 data 函数初始化小程序 data 失败，请尽量确保 data 函数中不访问 vm 对象，否则可能影响首次数据渲染速度。', data);
      }
    }
  } else {
    try {
      // 对 data 格式化
      data = JSON.parse(JSON.stringify(data));
    } catch (e) {}
  }
  if (!isPlainObject(data)) {
    data = {};
  }
  Object.keys(methods).forEach(function (methodName) {
    if (context.__lifecycle_hooks__.indexOf(methodName) === -1 && !hasOwn(data, methodName)) {
      data[methodName] = methods[methodName];
    }
  });
  return data;
}
var PROP_TYPES = [String, Number, Boolean, Object, Array, null];
function createObserver(name) {
  return function observer(newVal, oldVal) {
    if (this.$vm) {
      this.$vm[name] = newVal; // 为了触发其他非 render watcher
    }
  };
}

function initBehaviors(vueOptions, initBehavior) {
  var vueBehaviors = vueOptions.behaviors;
  var vueExtends = vueOptions.extends;
  var vueMixins = vueOptions.mixins;
  var vueProps = vueOptions.props;
  if (!vueProps) {
    vueOptions.props = vueProps = [];
  }
  var behaviors = [];
  if (Array.isArray(vueBehaviors)) {
    vueBehaviors.forEach(function (behavior) {
      behaviors.push(behavior.replace('uni://', "wx".concat("://")));
      if (behavior === 'uni://form-field') {
        if (Array.isArray(vueProps)) {
          vueProps.push('name');
          vueProps.push('value');
        } else {
          vueProps.name = {
            type: String,
            default: ''
          };
          vueProps.value = {
            type: [String, Number, Boolean, Array, Object, Date],
            default: ''
          };
        }
      }
    });
  }
  if (isPlainObject(vueExtends) && vueExtends.props) {
    behaviors.push(initBehavior({
      properties: initProperties(vueExtends.props, true)
    }));
  }
  if (Array.isArray(vueMixins)) {
    vueMixins.forEach(function (vueMixin) {
      if (isPlainObject(vueMixin) && vueMixin.props) {
        behaviors.push(initBehavior({
          properties: initProperties(vueMixin.props, true)
        }));
      }
    });
  }
  return behaviors;
}
function parsePropType(key, type, defaultValue, file) {
  // [String]=>String
  if (Array.isArray(type) && type.length === 1) {
    return type[0];
  }
  return type;
}
function initProperties(props) {
  var isBehavior = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var file = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var options = arguments.length > 3 ? arguments[3] : undefined;
  var properties = {};
  if (!isBehavior) {
    properties.vueId = {
      type: String,
      value: ''
    };
    {
      if (options.virtualHost) {
        properties.virtualHostStyle = {
          type: null,
          value: ''
        };
        properties.virtualHostClass = {
          type: null,
          value: ''
        };
      }
    }
    // scopedSlotsCompiler auto
    properties.scopedSlotsCompiler = {
      type: String,
      value: ''
    };
    properties.vueSlots = {
      // 小程序不能直接定义 $slots 的 props，所以通过 vueSlots 转换到 $slots
      type: null,
      value: [],
      observer: function observer(newVal, oldVal) {
        var $slots = Object.create(null);
        newVal.forEach(function (slotName) {
          $slots[slotName] = true;
        });
        this.setData({
          $slots: $slots
        });
      }
    };
  }
  if (Array.isArray(props)) {
    // ['title']
    props.forEach(function (key) {
      properties[key] = {
        type: null,
        observer: createObserver(key)
      };
    });
  } else if (isPlainObject(props)) {
    // {title:{type:String,default:''},content:String}
    Object.keys(props).forEach(function (key) {
      var opts = props[key];
      if (isPlainObject(opts)) {
        // title:{type:String,default:''}
        var value = opts.default;
        if (isFn(value)) {
          value = value();
        }
        opts.type = parsePropType(key, opts.type);
        properties[key] = {
          type: PROP_TYPES.indexOf(opts.type) !== -1 ? opts.type : null,
          value: value,
          observer: createObserver(key)
        };
      } else {
        // content:String
        var type = parsePropType(key, opts);
        properties[key] = {
          type: PROP_TYPES.indexOf(type) !== -1 ? type : null,
          observer: createObserver(key)
        };
      }
    });
  }
  return properties;
}
function wrapper$1(event) {
  // TODO 又得兼容 mpvue 的 mp 对象
  try {
    event.mp = JSON.parse(JSON.stringify(event));
  } catch (e) {}
  event.stopPropagation = noop;
  event.preventDefault = noop;
  event.target = event.target || {};
  if (!hasOwn(event, 'detail')) {
    event.detail = {};
  }
  if (hasOwn(event, 'markerId')) {
    event.detail = (0, _typeof2.default)(event.detail) === 'object' ? event.detail : {};
    event.detail.markerId = event.markerId;
  }
  if (isPlainObject(event.detail)) {
    event.target = Object.assign({}, event.target, event.detail);
  }
  return event;
}
function getExtraValue(vm, dataPathsArray) {
  var context = vm;
  dataPathsArray.forEach(function (dataPathArray) {
    var dataPath = dataPathArray[0];
    var value = dataPathArray[2];
    if (dataPath || typeof value !== 'undefined') {
      // ['','',index,'disable']
      var propPath = dataPathArray[1];
      var valuePath = dataPathArray[3];
      var vFor;
      if (Number.isInteger(dataPath)) {
        vFor = dataPath;
      } else if (!dataPath) {
        vFor = context;
      } else if (typeof dataPath === 'string' && dataPath) {
        if (dataPath.indexOf('#s#') === 0) {
          vFor = dataPath.substr(3);
        } else {
          vFor = vm.__get_value(dataPath, context);
        }
      }
      if (Number.isInteger(vFor)) {
        context = value;
      } else if (!propPath) {
        context = vFor[value];
      } else {
        if (Array.isArray(vFor)) {
          context = vFor.find(function (vForItem) {
            return vm.__get_value(propPath, vForItem) === value;
          });
        } else if (isPlainObject(vFor)) {
          context = Object.keys(vFor).find(function (vForKey) {
            return vm.__get_value(propPath, vFor[vForKey]) === value;
          });
        } else {
          console.error('v-for 暂不支持循环数据：', vFor);
        }
      }
      if (valuePath) {
        context = vm.__get_value(valuePath, context);
      }
    }
  });
  return context;
}
function processEventExtra(vm, extra, event, __args__) {
  var extraObj = {};
  if (Array.isArray(extra) && extra.length) {
    /**
     *[
     *    ['data.items', 'data.id', item.data.id],
     *    ['metas', 'id', meta.id]
     *],
     *[
     *    ['data.items', 'data.id', item.data.id],
     *    ['metas', 'id', meta.id]
     *],
     *'test'
     */
    extra.forEach(function (dataPath, index) {
      if (typeof dataPath === 'string') {
        if (!dataPath) {
          // model,prop.sync
          extraObj['$' + index] = vm;
        } else {
          if (dataPath === '$event') {
            // $event
            extraObj['$' + index] = event;
          } else if (dataPath === 'arguments') {
            extraObj['$' + index] = event.detail ? event.detail.__args__ || __args__ : __args__;
          } else if (dataPath.indexOf('$event.') === 0) {
            // $event.target.value
            extraObj['$' + index] = vm.__get_value(dataPath.replace('$event.', ''), event);
          } else {
            extraObj['$' + index] = vm.__get_value(dataPath);
          }
        }
      } else {
        extraObj['$' + index] = getExtraValue(vm, dataPath);
      }
    });
  }
  return extraObj;
}
function getObjByArray(arr) {
  var obj = {};
  for (var i = 1; i < arr.length; i++) {
    var element = arr[i];
    obj[element[0]] = element[1];
  }
  return obj;
}
function processEventArgs(vm, event) {
  var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var extra = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var isCustom = arguments.length > 4 ? arguments[4] : undefined;
  var methodName = arguments.length > 5 ? arguments[5] : undefined;
  var isCustomMPEvent = false; // wxcomponent 组件，传递原始 event 对象

  // fixed 用户直接触发 mpInstance.triggerEvent
  var __args__ = isPlainObject(event.detail) ? event.detail.__args__ || [event.detail] : [event.detail];
  if (isCustom) {
    // 自定义事件
    isCustomMPEvent = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.comType === 'wx';
    if (!args.length) {
      // 无参数，直接传入 event 或 detail 数组
      if (isCustomMPEvent) {
        return [event];
      }
      return __args__;
    }
  }
  var extraObj = processEventExtra(vm, extra, event, __args__);
  var ret = [];
  args.forEach(function (arg) {
    if (arg === '$event') {
      if (methodName === '__set_model' && !isCustom) {
        // input v-model value
        ret.push(event.target.value);
      } else {
        if (isCustom && !isCustomMPEvent) {
          ret.push(__args__[0]);
        } else {
          // wxcomponent 组件或内置组件
          ret.push(event);
        }
      }
    } else {
      if (Array.isArray(arg) && arg[0] === 'o') {
        ret.push(getObjByArray(arg));
      } else if (typeof arg === 'string' && hasOwn(extraObj, arg)) {
        ret.push(extraObj[arg]);
      } else {
        ret.push(arg);
      }
    }
  });
  return ret;
}
var ONCE = '~';
var CUSTOM = '^';
function isMatchEventType(eventType, optType) {
  return eventType === optType || optType === 'regionchange' && (eventType === 'begin' || eventType === 'end');
}
function getContextVm(vm) {
  var $parent = vm.$parent;
  // 父组件是 scoped slots 或者其他自定义组件时继续查找
  while ($parent && $parent.$parent && ($parent.$options.generic || $parent.$parent.$options.generic || $parent.$scope._$vuePid)) {
    $parent = $parent.$parent;
  }
  return $parent && $parent.$parent;
}
function handleEvent(event) {
  var _this2 = this;
  event = wrapper$1(event);

  // [['tap',[['handle',[1,2,a]],['handle1',[1,2,a]]]]]
  var dataset = (event.currentTarget || event.target).dataset;
  if (!dataset) {
    return console.warn('事件信息不存在');
  }
  var eventOpts = dataset.eventOpts || dataset['event-opts']; // 支付宝 web-view 组件 dataset 非驼峰
  if (!eventOpts) {
    return console.warn('事件信息不存在');
  }

  // [['handle',[1,2,a]],['handle1',[1,2,a]]]
  var eventType = event.type;
  var ret = [];
  eventOpts.forEach(function (eventOpt) {
    var type = eventOpt[0];
    var eventsArray = eventOpt[1];
    var isCustom = type.charAt(0) === CUSTOM;
    type = isCustom ? type.slice(1) : type;
    var isOnce = type.charAt(0) === ONCE;
    type = isOnce ? type.slice(1) : type;
    if (eventsArray && isMatchEventType(eventType, type)) {
      eventsArray.forEach(function (eventArray) {
        var methodName = eventArray[0];
        if (methodName) {
          var handlerCtx = _this2.$vm;
          if (handlerCtx.$options.generic) {
            // mp-weixin,mp-toutiao 抽象节点模拟 scoped slots
            handlerCtx = getContextVm(handlerCtx) || handlerCtx;
          }
          if (methodName === '$emit') {
            handlerCtx.$emit.apply(handlerCtx, processEventArgs(_this2.$vm, event, eventArray[1], eventArray[2], isCustom, methodName));
            return;
          }
          var handler = handlerCtx[methodName];
          if (!isFn(handler)) {
            var _type = _this2.$vm.mpType === 'page' ? 'Page' : 'Component';
            var path = _this2.route || _this2.is;
            throw new Error("".concat(_type, " \"").concat(path, "\" does not have a method \"").concat(methodName, "\""));
          }
          if (isOnce) {
            if (handler.once) {
              return;
            }
            handler.once = true;
          }
          var params = processEventArgs(_this2.$vm, event, eventArray[1], eventArray[2], isCustom, methodName);
          params = Array.isArray(params) ? params : [];
          // 参数尾部增加原始事件对象用于复杂表达式内获取额外数据
          if (/=\s*\S+\.eventParams\s*\|\|\s*\S+\[['"]event-params['"]\]/.test(handler.toString())) {
            // eslint-disable-next-line no-sparse-arrays
            params = params.concat([,,,,,,,,,, event]);
          }
          ret.push(handler.apply(handlerCtx, params));
        }
      });
    }
  });
  if (eventType === 'input' && ret.length === 1 && typeof ret[0] !== 'undefined') {
    return ret[0];
  }
}
var eventChannels = {};
function getEventChannel(id) {
  var eventChannel = eventChannels[id];
  delete eventChannels[id];
  return eventChannel;
}
var hooks = ['onShow', 'onHide', 'onError', 'onPageNotFound', 'onThemeChange', 'onUnhandledRejection'];
function initEventChannel() {
  _vue.default.prototype.getOpenerEventChannel = function () {
    // 微信小程序使用自身getOpenerEventChannel
    {
      return this.$scope.getOpenerEventChannel();
    }
  };
  var callHook = _vue.default.prototype.__call_hook;
  _vue.default.prototype.__call_hook = function (hook, args) {
    if (hook === 'onLoad' && args && args.__id__) {
      this.__eventChannel__ = getEventChannel(args.__id__);
      delete args.__id__;
    }
    return callHook.call(this, hook, args);
  };
}
function initScopedSlotsParams() {
  var center = {};
  var parents = {};
  function currentId(fn) {
    var vueIds = this.$options.propsData.vueId;
    if (vueIds) {
      var vueId = vueIds.split(',')[0];
      fn(vueId);
    }
  }
  _vue.default.prototype.$hasSSP = function (vueId) {
    var slot = center[vueId];
    if (!slot) {
      parents[vueId] = this;
      this.$on('hook:destroyed', function () {
        delete parents[vueId];
      });
    }
    return slot;
  };
  _vue.default.prototype.$getSSP = function (vueId, name, needAll) {
    var slot = center[vueId];
    if (slot) {
      var params = slot[name] || [];
      if (needAll) {
        return params;
      }
      return params[0];
    }
  };
  _vue.default.prototype.$setSSP = function (name, value) {
    var index = 0;
    currentId.call(this, function (vueId) {
      var slot = center[vueId];
      var params = slot[name] = slot[name] || [];
      params.push(value);
      index = params.length - 1;
    });
    return index;
  };
  _vue.default.prototype.$initSSP = function () {
    currentId.call(this, function (vueId) {
      center[vueId] = {};
    });
  };
  _vue.default.prototype.$callSSP = function () {
    currentId.call(this, function (vueId) {
      if (parents[vueId]) {
        parents[vueId].$forceUpdate();
      }
    });
  };
  _vue.default.mixin({
    destroyed: function destroyed() {
      var propsData = this.$options.propsData;
      var vueId = propsData && propsData.vueId;
      if (vueId) {
        delete center[vueId];
        delete parents[vueId];
      }
    }
  });
}
function parseBaseApp(vm, _ref4) {
  var mocks = _ref4.mocks,
    initRefs = _ref4.initRefs;
  initEventChannel();
  {
    initScopedSlotsParams();
  }
  if (vm.$options.store) {
    _vue.default.prototype.$store = vm.$options.store;
  }
  uniIdMixin(_vue.default);
  _vue.default.prototype.mpHost = "mp-weixin";
  _vue.default.mixin({
    beforeCreate: function beforeCreate() {
      if (!this.$options.mpType) {
        return;
      }
      this.mpType = this.$options.mpType;
      this.$mp = (0, _defineProperty2.default)({
        data: {}
      }, this.mpType, this.$options.mpInstance);
      this.$scope = this.$options.mpInstance;
      delete this.$options.mpType;
      delete this.$options.mpInstance;
      if (this.mpType === 'page' && typeof getApp === 'function') {
        // hack vue-i18n
        var app = getApp();
        if (app.$vm && app.$vm.$i18n) {
          this._i18n = app.$vm.$i18n;
        }
      }
      if (this.mpType !== 'app') {
        initRefs(this);
        initMocks(this, mocks);
      }
    }
  });
  var appOptions = {
    onLaunch: function onLaunch(args) {
      if (this.$vm) {
        // 已经初始化过了，主要是为了百度，百度 onShow 在 onLaunch 之前
        return;
      }
      {
        if (wx.canIUse && !wx.canIUse('nextTick')) {
          // 事实 上2.2.3 即可，简单使用 2.3.0 的 nextTick 判断
          console.error('当前微信基础库版本过低，请将 微信开发者工具-详情-项目设置-调试基础库版本 更换为`2.3.0`以上');
        }
      }
      this.$vm = vm;
      this.$vm.$mp = {
        app: this
      };
      this.$vm.$scope = this;
      // vm 上也挂载 globalData
      this.$vm.globalData = this.globalData;
      this.$vm._isMounted = true;
      this.$vm.__call_hook('mounted', args);
      this.$vm.__call_hook('onLaunch', args);
    }
  };

  // 兼容旧版本 globalData
  appOptions.globalData = vm.$options.globalData || {};
  // 将 methods 中的方法挂在 getApp() 中
  var methods = vm.$options.methods;
  if (methods) {
    Object.keys(methods).forEach(function (name) {
      appOptions[name] = methods[name];
    });
  }
  initAppLocale(_vue.default, vm, getLocaleLanguage$1());
  initHooks(appOptions, hooks);
  initUnknownHooks(appOptions, vm.$options);
  return appOptions;
}
function getLocaleLanguage$1() {
  var localeLanguage = '';
  {
    var appBaseInfo = wx.getAppBaseInfo();
    var language = appBaseInfo && appBaseInfo.language ? appBaseInfo.language : LOCALE_EN;
    localeLanguage = normalizeLocale(language) || LOCALE_EN;
  }
  return localeLanguage;
}
function parseApp(vm) {
  return parseBaseApp(vm, {
    mocks: mocks,
    initRefs: initRefs
  });
}
function createApp(vm) {
  App(parseApp(vm));
  return vm;
}
var encodeReserveRE = /[!'()*]/g;
var encodeReserveReplacer = function encodeReserveReplacer(c) {
  return '%' + c.charCodeAt(0).toString(16);
};
var commaRE = /%2C/g;

// fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
var encode = function encode(str) {
  return encodeURIComponent(str).replace(encodeReserveRE, encodeReserveReplacer).replace(commaRE, ',');
};
function stringifyQuery(obj) {
  var encodeStr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : encode;
  var res = obj ? Object.keys(obj).map(function (key) {
    var val = obj[key];
    if (val === undefined) {
      return '';
    }
    if (val === null) {
      return encodeStr(key);
    }
    if (Array.isArray(val)) {
      var result = [];
      val.forEach(function (val2) {
        if (val2 === undefined) {
          return;
        }
        if (val2 === null) {
          result.push(encodeStr(key));
        } else {
          result.push(encodeStr(key) + '=' + encodeStr(val2));
        }
      });
      return result.join('&');
    }
    return encodeStr(key) + '=' + encodeStr(val);
  }).filter(function (x) {
    return x.length > 0;
  }).join('&') : null;
  return res ? "?".concat(res) : '';
}
function parseBaseComponent(vueComponentOptions) {
  var _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    isPage = _ref5.isPage,
    initRelation = _ref5.initRelation;
  var needVueOptions = arguments.length > 2 ? arguments[2] : undefined;
  var _initVueComponent = initVueComponent(_vue.default, vueComponentOptions),
    _initVueComponent2 = (0, _slicedToArray2.default)(_initVueComponent, 2),
    VueComponent = _initVueComponent2[0],
    vueOptions = _initVueComponent2[1];
  var options = _objectSpread({
    multipleSlots: true,
    // styleIsolation: 'apply-shared',
    addGlobalClass: true
  }, vueOptions.options || {});
  {
    // 微信 multipleSlots 部分情况有 bug，导致内容顺序错乱 如 u-list，提供覆盖选项
    if (vueOptions['mp-weixin'] && vueOptions['mp-weixin'].options) {
      Object.assign(options, vueOptions['mp-weixin'].options);
    }
  }
  var componentOptions = {
    options: options,
    data: initData(vueOptions, _vue.default.prototype),
    behaviors: initBehaviors(vueOptions, initBehavior),
    properties: initProperties(vueOptions.props, false, vueOptions.__file, options),
    lifetimes: {
      attached: function attached() {
        var properties = this.properties;
        var options = {
          mpType: isPage.call(this) ? 'page' : 'component',
          mpInstance: this,
          propsData: properties
        };
        initVueIds(properties.vueId, this);

        // 处理父子关系
        initRelation.call(this, {
          vuePid: this._$vuePid,
          vueOptions: options
        });

        // 初始化 vue 实例
        this.$vm = new VueComponent(options);

        // 处理$slots,$scopedSlots（暂不支持动态变化$slots）
        initSlots(this.$vm, properties.vueSlots);

        // 触发首次 setData
        this.$vm.$mount();
      },
      ready: function ready() {
        // 当组件 props 默认值为 true，初始化时传入 false 会导致 created,ready 触发, 但 attached 不触发
        // https://developers.weixin.qq.com/community/develop/doc/00066ae2844cc0f8eb883e2a557800
        if (this.$vm) {
          this.$vm._isMounted = true;
          this.$vm.__call_hook('mounted');
          this.$vm.__call_hook('onReady');
        }
      },
      detached: function detached() {
        this.$vm && this.$vm.$destroy();
      }
    },
    pageLifetimes: {
      show: function show(args) {
        this.$vm && this.$vm.__call_hook('onPageShow', args);
      },
      hide: function hide() {
        this.$vm && this.$vm.__call_hook('onPageHide');
      },
      resize: function resize(size) {
        this.$vm && this.$vm.__call_hook('onPageResize', size);
      }
    },
    methods: {
      __l: handleLink,
      __e: handleEvent
    }
  };
  // externalClasses
  if (vueOptions.externalClasses) {
    componentOptions.externalClasses = vueOptions.externalClasses;
  }
  if (Array.isArray(vueOptions.wxsCallMethods)) {
    vueOptions.wxsCallMethods.forEach(function (callMethod) {
      componentOptions.methods[callMethod] = function (args) {
        return this.$vm[callMethod](args);
      };
    });
  }
  if (needVueOptions) {
    return [componentOptions, vueOptions, VueComponent];
  }
  if (isPage) {
    return componentOptions;
  }
  return [componentOptions, VueComponent];
}
function parseComponent(vueComponentOptions, needVueOptions) {
  return parseBaseComponent(vueComponentOptions, {
    isPage: isPage,
    initRelation: initRelation
  }, needVueOptions);
}
var hooks$1 = ['onShow', 'onHide', 'onUnload'];
hooks$1.push.apply(hooks$1, PAGE_EVENT_HOOKS);
function parseBasePage(vuePageOptions) {
  var _parseComponent = parseComponent(vuePageOptions, true),
    _parseComponent2 = (0, _slicedToArray2.default)(_parseComponent, 2),
    pageOptions = _parseComponent2[0],
    vueOptions = _parseComponent2[1];
  initHooks(pageOptions.methods, hooks$1, vueOptions);
  pageOptions.methods.onLoad = function (query) {
    this.options = query;
    var copyQuery = Object.assign({}, query);
    delete copyQuery.__id__;
    this.$page = {
      fullPath: '/' + (this.route || this.is) + stringifyQuery(copyQuery)
    };
    this.$vm.$mp.query = query; // 兼容 mpvue
    this.$vm.__call_hook('onLoad', query);
  };
  {
    initUnknownHooks(pageOptions.methods, vuePageOptions, ['onReady']);
  }
  {
    initWorkletMethods(pageOptions.methods, vueOptions.methods);
  }
  return pageOptions;
}
function parsePage(vuePageOptions) {
  return parseBasePage(vuePageOptions);
}
function createPage(vuePageOptions) {
  {
    return Component(parsePage(vuePageOptions));
  }
}
function createComponent(vueOptions) {
  {
    return Component(parseComponent(vueOptions));
  }
}
function createSubpackageApp(vm) {
  var appOptions = parseApp(vm);
  var app = getApp({
    allowDefault: true
  });
  vm.$scope = app;
  var globalData = app.globalData;
  if (globalData) {
    Object.keys(appOptions.globalData).forEach(function (name) {
      if (!hasOwn(globalData, name)) {
        globalData[name] = appOptions.globalData[name];
      }
    });
  }
  Object.keys(appOptions).forEach(function (name) {
    if (!hasOwn(app, name)) {
      app[name] = appOptions[name];
    }
  });
  if (isFn(appOptions.onShow) && wx.onAppShow) {
    wx.onAppShow(function () {
      for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }
      vm.__call_hook('onShow', args);
    });
  }
  if (isFn(appOptions.onHide) && wx.onAppHide) {
    wx.onAppHide(function () {
      for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }
      vm.__call_hook('onHide', args);
    });
  }
  if (isFn(appOptions.onLaunch)) {
    var args = wx.getLaunchOptionsSync && wx.getLaunchOptionsSync();
    vm.__call_hook('onLaunch', args);
  }
  return vm;
}
function createPlugin(vm) {
  var appOptions = parseApp(vm);
  if (isFn(appOptions.onShow) && wx.onAppShow) {
    wx.onAppShow(function () {
      for (var _len8 = arguments.length, args = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }
      vm.__call_hook('onShow', args);
    });
  }
  if (isFn(appOptions.onHide) && wx.onAppHide) {
    wx.onAppHide(function () {
      for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }
      vm.__call_hook('onHide', args);
    });
  }
  if (isFn(appOptions.onLaunch)) {
    var args = wx.getLaunchOptionsSync && wx.getLaunchOptionsSync();
    vm.__call_hook('onLaunch', args);
  }
  return vm;
}
todos.forEach(function (todoApi) {
  protocols[todoApi] = false;
});
canIUses.forEach(function (canIUseApi) {
  var apiName = protocols[canIUseApi] && protocols[canIUseApi].name ? protocols[canIUseApi].name : canIUseApi;
  if (!wx.canIUse(apiName)) {
    protocols[canIUseApi] = false;
  }
});
var uni = {};
if (typeof Proxy !== 'undefined' && "mp-weixin" !== 'app-plus') {
  uni = new Proxy({}, {
    get: function get(target, name) {
      if (hasOwn(target, name)) {
        return target[name];
      }
      if (baseApi[name]) {
        return baseApi[name];
      }
      if (api[name]) {
        return promisify(name, api[name]);
      }
      {
        if (extraApi[name]) {
          return promisify(name, extraApi[name]);
        }
        if (todoApis[name]) {
          return promisify(name, todoApis[name]);
        }
      }
      if (eventApi[name]) {
        return eventApi[name];
      }
      return promisify(name, wrapper(name, wx[name]));
    },
    set: function set(target, name, value) {
      target[name] = value;
      return true;
    }
  });
} else {
  Object.keys(baseApi).forEach(function (name) {
    uni[name] = baseApi[name];
  });
  {
    Object.keys(todoApis).forEach(function (name) {
      uni[name] = promisify(name, todoApis[name]);
    });
    Object.keys(extraApi).forEach(function (name) {
      uni[name] = promisify(name, extraApi[name]);
    });
  }
  Object.keys(eventApi).forEach(function (name) {
    uni[name] = eventApi[name];
  });
  Object.keys(api).forEach(function (name) {
    uni[name] = promisify(name, api[name]);
  });
  Object.keys(wx).forEach(function (name) {
    if (hasOwn(wx, name) || hasOwn(protocols, name)) {
      uni[name] = promisify(name, wrapper(name, wx[name]));
    }
  });
}
wx.createApp = createApp;
wx.createPage = createPage;
wx.createComponent = createComponent;
wx.createSubpackageApp = createSubpackageApp;
wx.createPlugin = createPlugin;
var uni$1 = uni;
var _default = uni$1;
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1)["default"], __webpack_require__(/*! ./../../../webpack/buildin/global.js */ 3)))

/***/ }),
/* 3 */
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 4 */
/*!**********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/interopRequireDefault.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 5 */
/*!**************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/slicedToArray.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayWithHoles = __webpack_require__(/*! ./arrayWithHoles.js */ 6);
var iterableToArrayLimit = __webpack_require__(/*! ./iterableToArrayLimit.js */ 7);
var unsupportedIterableToArray = __webpack_require__(/*! ./unsupportedIterableToArray.js */ 8);
var nonIterableRest = __webpack_require__(/*! ./nonIterableRest.js */ 10);
function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
}
module.exports = _slicedToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 6 */
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/arrayWithHoles.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
module.exports = _arrayWithHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 7 */
/*!*********************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/iterableToArrayLimit.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0) {
        ;
      }
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
module.exports = _iterableToArrayLimit, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 8 */
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeToArray = __webpack_require__(/*! ./arrayLikeToArray.js */ 9);
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
}
module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 9 */
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/arrayLikeToArray.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 10 */
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/nonIterableRest.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableRest, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 11 */
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var toPropertyKey = __webpack_require__(/*! ./toPropertyKey.js */ 12);
function _defineProperty(obj, key, value) {
  key = toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 12 */
/*!**************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/toPropertyKey.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(/*! ./typeof.js */ 13)["default"];
var toPrimitive = __webpack_require__(/*! ./toPrimitive.js */ 14);
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 13 */
/*!*******************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/typeof.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _typeof(o) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 14 */
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/toPrimitive.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(/*! ./typeof.js */ 13)["default"];
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 15 */
/*!**********************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/construct.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var setPrototypeOf = __webpack_require__(/*! ./setPrototypeOf.js */ 16);
var isNativeReflectConstruct = __webpack_require__(/*! ./isNativeReflectConstruct.js */ 17);
function _construct(t, e, r) {
  if (isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
  var o = [null];
  o.push.apply(o, e);
  var p = new (t.bind.apply(t, o))();
  return r && setPrototypeOf(p, r.prototype), p;
}
module.exports = _construct, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 16 */
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/setPrototypeOf.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  return _setPrototypeOf(o, p);
}
module.exports = _setPrototypeOf, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 17 */
/*!*************************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/isNativeReflectConstruct.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
  } catch (t) {}
  return (module.exports = _isNativeReflectConstruct = function _isNativeReflectConstruct() {
    return !!t;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports)();
}
module.exports = _isNativeReflectConstruct, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 18 */
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/toConsumableArray.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayWithoutHoles = __webpack_require__(/*! ./arrayWithoutHoles.js */ 19);
var iterableToArray = __webpack_require__(/*! ./iterableToArray.js */ 20);
var unsupportedIterableToArray = __webpack_require__(/*! ./unsupportedIterableToArray.js */ 8);
var nonIterableSpread = __webpack_require__(/*! ./nonIterableSpread.js */ 21);
function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
}
module.exports = _toConsumableArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 19 */
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/arrayWithoutHoles.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeToArray = __webpack_require__(/*! ./arrayLikeToArray.js */ 9);
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return arrayLikeToArray(arr);
}
module.exports = _arrayWithoutHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 20 */
/*!****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/iterableToArray.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
module.exports = _iterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 21 */
/*!******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/nonIterableSpread.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
module.exports = _nonIterableSpread, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 22 */
/*!*************************************************************!*\
  !*** ./node_modules/@dcloudio/uni-i18n/dist/uni-i18n.es.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni, global) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOCALE_ZH_HANT = exports.LOCALE_ZH_HANS = exports.LOCALE_FR = exports.LOCALE_ES = exports.LOCALE_EN = exports.I18n = exports.Formatter = void 0;
exports.compileI18nJsonStr = compileI18nJsonStr;
exports.hasI18nJson = hasI18nJson;
exports.initVueI18n = initVueI18n;
exports.isI18nStr = isI18nStr;
exports.isString = void 0;
exports.normalizeLocale = normalizeLocale;
exports.parseI18nJson = parseI18nJson;
exports.resolveLocale = resolveLocale;
var _slicedToArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ 5));
var _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ 23));
var _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ 24));
var _typeof2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/typeof */ 13));
var isObject = function isObject(val) {
  return val !== null && (0, _typeof2.default)(val) === 'object';
};
var defaultDelimiters = ['{', '}'];
var BaseFormatter = /*#__PURE__*/function () {
  function BaseFormatter() {
    (0, _classCallCheck2.default)(this, BaseFormatter);
    this._caches = Object.create(null);
  }
  (0, _createClass2.default)(BaseFormatter, [{
    key: "interpolate",
    value: function interpolate(message, values) {
      var delimiters = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultDelimiters;
      if (!values) {
        return [message];
      }
      var tokens = this._caches[message];
      if (!tokens) {
        tokens = parse(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }]);
  return BaseFormatter;
}();
exports.Formatter = BaseFormatter;
var RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
var RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
function parse(format, _ref) {
  var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
    startDelimiter = _ref2[0],
    endDelimiter = _ref2[1];
  var tokens = [];
  var position = 0;
  var text = '';
  while (position < format.length) {
    var char = format[position++];
    if (char === startDelimiter) {
      if (text) {
        tokens.push({
          type: 'text',
          value: text
        });
      }
      text = '';
      var sub = '';
      char = format[position++];
      while (char !== undefined && char !== endDelimiter) {
        sub += char;
        char = format[position++];
      }
      var isClosed = char === endDelimiter;
      var type = RE_TOKEN_LIST_VALUE.test(sub) ? 'list' : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? 'named' : 'unknown';
      tokens.push({
        value: sub,
        type: type
      });
    }
    //  else if (char === '%') {
    //   // when found rails i18n syntax, skip text capture
    //   if (format[position] !== '{') {
    //     text += char
    //   }
    // }
    else {
      text += char;
    }
  }
  text && tokens.push({
    type: 'text',
    value: text
  });
  return tokens;
}
function compile(tokens, values) {
  var compiled = [];
  var index = 0;
  var mode = Array.isArray(values) ? 'list' : isObject(values) ? 'named' : 'unknown';
  if (mode === 'unknown') {
    return compiled;
  }
  while (index < tokens.length) {
    var token = tokens[index];
    switch (token.type) {
      case 'text':
        compiled.push(token.value);
        break;
      case 'list':
        compiled.push(values[parseInt(token.value, 10)]);
        break;
      case 'named':
        if (mode === 'named') {
          compiled.push(values[token.value]);
        } else {
          if (true) {
            console.warn("Type of token '".concat(token.type, "' and format of value '").concat(mode, "' don't match!"));
          }
        }
        break;
      case 'unknown':
        if (true) {
          console.warn("Detect 'unknown' type of token!");
        }
        break;
    }
    index++;
  }
  return compiled;
}
var LOCALE_ZH_HANS = 'zh-Hans';
exports.LOCALE_ZH_HANS = LOCALE_ZH_HANS;
var LOCALE_ZH_HANT = 'zh-Hant';
exports.LOCALE_ZH_HANT = LOCALE_ZH_HANT;
var LOCALE_EN = 'en';
exports.LOCALE_EN = LOCALE_EN;
var LOCALE_FR = 'fr';
exports.LOCALE_FR = LOCALE_FR;
var LOCALE_ES = 'es';
exports.LOCALE_ES = LOCALE_ES;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = function hasOwn(val, key) {
  return hasOwnProperty.call(val, key);
};
var defaultFormatter = new BaseFormatter();
function include(str, parts) {
  return !!parts.find(function (part) {
    return str.indexOf(part) !== -1;
  });
}
function startsWith(str, parts) {
  return parts.find(function (part) {
    return str.indexOf(part) === 0;
  });
}
function normalizeLocale(locale, messages) {
  if (!locale) {
    return;
  }
  locale = locale.trim().replace(/_/g, '-');
  if (messages && messages[locale]) {
    return locale;
  }
  locale = locale.toLowerCase();
  if (locale === 'chinese') {
    // 支付宝
    return LOCALE_ZH_HANS;
  }
  if (locale.indexOf('zh') === 0) {
    if (locale.indexOf('-hans') > -1) {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf('-hant') > -1) {
      return LOCALE_ZH_HANT;
    }
    if (include(locale, ['-tw', '-hk', '-mo', '-cht'])) {
      return LOCALE_ZH_HANT;
    }
    return LOCALE_ZH_HANS;
  }
  var locales = [LOCALE_EN, LOCALE_FR, LOCALE_ES];
  if (messages && Object.keys(messages).length > 0) {
    locales = Object.keys(messages);
  }
  var lang = startsWith(locale, locales);
  if (lang) {
    return lang;
  }
}
var I18n = /*#__PURE__*/function () {
  function I18n(_ref3) {
    var locale = _ref3.locale,
      fallbackLocale = _ref3.fallbackLocale,
      messages = _ref3.messages,
      watcher = _ref3.watcher,
      formater = _ref3.formater;
    (0, _classCallCheck2.default)(this, I18n);
    this.locale = LOCALE_EN;
    this.fallbackLocale = LOCALE_EN;
    this.message = {};
    this.messages = {};
    this.watchers = [];
    if (fallbackLocale) {
      this.fallbackLocale = fallbackLocale;
    }
    this.formater = formater || defaultFormatter;
    this.messages = messages || {};
    this.setLocale(locale || LOCALE_EN);
    if (watcher) {
      this.watchLocale(watcher);
    }
  }
  (0, _createClass2.default)(I18n, [{
    key: "setLocale",
    value: function setLocale(locale) {
      var _this = this;
      var oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        // 可能初始化时不存在
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      // 仅发生变化时，通知
      if (oldLocale !== this.locale) {
        this.watchers.forEach(function (watcher) {
          watcher(_this.locale, oldLocale);
        });
      }
    }
  }, {
    key: "getLocale",
    value: function getLocale() {
      return this.locale;
    }
  }, {
    key: "watchLocale",
    value: function watchLocale(fn) {
      var _this2 = this;
      var index = this.watchers.push(fn) - 1;
      return function () {
        _this2.watchers.splice(index, 1);
      };
    }
  }, {
    key: "add",
    value: function add(locale, message) {
      var override = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach(function (key) {
            if (!hasOwn(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
  }, {
    key: "f",
    value: function f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join('');
    }
  }, {
    key: "t",
    value: function t(key, locale, values) {
      var message = this.message;
      if (typeof locale === 'string') {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn(message, key)) {
        console.warn("Cannot translate the value of keypath ".concat(key, ". Use the value of keypath as default."));
        return key;
      }
      return this.formater.interpolate(message[key], values).join('');
    }
  }]);
  return I18n;
}();
exports.I18n = I18n;
function watchAppLocale(appVm, i18n) {
  // 需要保证 watch 的触发在组件渲染之前
  if (appVm.$watchLocale) {
    // vue2
    appVm.$watchLocale(function (newLocale) {
      i18n.setLocale(newLocale);
    });
  } else {
    appVm.$watch(function () {
      return appVm.$locale;
    }, function (newLocale) {
      i18n.setLocale(newLocale);
    });
  }
}
function getDefaultLocale() {
  if (typeof uni !== 'undefined' && uni.getLocale) {
    return uni.getLocale();
  }
  // 小程序平台，uni 和 uni-i18n 互相引用，导致访问不到 uni，故在 global 上挂了 getLocale
  if (typeof global !== 'undefined' && global.getLocale) {
    return global.getLocale();
  }
  return LOCALE_EN;
}
function initVueI18n(locale) {
  var messages = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var fallbackLocale = arguments.length > 2 ? arguments[2] : undefined;
  var watcher = arguments.length > 3 ? arguments[3] : undefined;
  // 兼容旧版本入参
  if (typeof locale !== 'string') {
    var _ref4 = [messages, locale];
    locale = _ref4[0];
    messages = _ref4[1];
  }
  if (typeof locale !== 'string') {
    // 因为小程序平台，uni-i18n 和 uni 互相引用，导致此时访问 uni 时，为 undefined
    locale = getDefaultLocale();
  }
  if (typeof fallbackLocale !== 'string') {
    fallbackLocale = typeof __uniConfig !== 'undefined' && __uniConfig.fallbackLocale || LOCALE_EN;
  }
  var i18n = new I18n({
    locale: locale,
    fallbackLocale: fallbackLocale,
    messages: messages,
    watcher: watcher
  });
  var _t = function t(key, values) {
    if (typeof getApp !== 'function') {
      // app view
      /* eslint-disable no-func-assign */
      _t = function t(key, values) {
        return i18n.t(key, values);
      };
    } else {
      var isWatchedAppLocale = false;
      _t = function t(key, values) {
        var appVm = getApp().$vm;
        // 可能$vm还不存在，比如在支付宝小程序中，组件定义较早，在props的default里使用了t()函数（如uni-goods-nav），此时app还未初始化
        // options: {
        // 	type: Array,
        // 	default () {
        // 		return [{
        // 			icon: 'shop',
        // 			text: t("uni-goods-nav.options.shop"),
        // 		}, {
        // 			icon: 'cart',
        // 			text: t("uni-goods-nav.options.cart")
        // 		}]
        // 	}
        // },
        if (appVm) {
          // 触发响应式
          appVm.$locale;
          if (!isWatchedAppLocale) {
            isWatchedAppLocale = true;
            watchAppLocale(appVm, i18n);
          }
        }
        return i18n.t(key, values);
      };
    }
    return _t(key, values);
  };
  return {
    i18n: i18n,
    f: function f(message, values, delimiters) {
      return i18n.f(message, values, delimiters);
    },
    t: function t(key, values) {
      return _t(key, values);
    },
    add: function add(locale, message) {
      var override = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      return i18n.add(locale, message, override);
    },
    watch: function watch(fn) {
      return i18n.watchLocale(fn);
    },
    getLocale: function getLocale() {
      return i18n.getLocale();
    },
    setLocale: function setLocale(newLocale) {
      return i18n.setLocale(newLocale);
    }
  };
}
var isString = function isString(val) {
  return typeof val === 'string';
};
exports.isString = isString;
var formater;
function hasI18nJson(jsonObj, delimiters) {
  if (!formater) {
    formater = new BaseFormatter();
  }
  return walkJsonObj(jsonObj, function (jsonObj, key) {
    var value = jsonObj[key];
    if (isString(value)) {
      if (isI18nStr(value, delimiters)) {
        return true;
      }
    } else {
      return hasI18nJson(value, delimiters);
    }
  });
}
function parseI18nJson(jsonObj, values, delimiters) {
  if (!formater) {
    formater = new BaseFormatter();
  }
  walkJsonObj(jsonObj, function (jsonObj, key) {
    var value = jsonObj[key];
    if (isString(value)) {
      if (isI18nStr(value, delimiters)) {
        jsonObj[key] = compileStr(value, values, delimiters);
      }
    } else {
      parseI18nJson(value, values, delimiters);
    }
  });
  return jsonObj;
}
function compileI18nJsonStr(jsonStr, _ref5) {
  var locale = _ref5.locale,
    locales = _ref5.locales,
    delimiters = _ref5.delimiters;
  if (!isI18nStr(jsonStr, delimiters)) {
    return jsonStr;
  }
  if (!formater) {
    formater = new BaseFormatter();
  }
  var localeValues = [];
  Object.keys(locales).forEach(function (name) {
    if (name !== locale) {
      localeValues.push({
        locale: name,
        values: locales[name]
      });
    }
  });
  localeValues.unshift({
    locale: locale,
    values: locales[locale]
  });
  try {
    return JSON.stringify(compileJsonObj(JSON.parse(jsonStr), localeValues, delimiters), null, 2);
  } catch (e) {}
  return jsonStr;
}
function isI18nStr(value, delimiters) {
  return value.indexOf(delimiters[0]) > -1;
}
function compileStr(value, values, delimiters) {
  return formater.interpolate(value, values, delimiters).join('');
}
function compileValue(jsonObj, key, localeValues, delimiters) {
  var value = jsonObj[key];
  if (isString(value)) {
    // 存在国际化
    if (isI18nStr(value, delimiters)) {
      jsonObj[key] = compileStr(value, localeValues[0].values, delimiters);
      if (localeValues.length > 1) {
        // 格式化国际化语言
        var valueLocales = jsonObj[key + 'Locales'] = {};
        localeValues.forEach(function (localValue) {
          valueLocales[localValue.locale] = compileStr(value, localValue.values, delimiters);
        });
      }
    }
  } else {
    compileJsonObj(value, localeValues, delimiters);
  }
}
function compileJsonObj(jsonObj, localeValues, delimiters) {
  walkJsonObj(jsonObj, function (jsonObj, key) {
    compileValue(jsonObj, key, localeValues, delimiters);
  });
  return jsonObj;
}
function walkJsonObj(jsonObj, walk) {
  if (Array.isArray(jsonObj)) {
    for (var i = 0; i < jsonObj.length; i++) {
      if (walk(jsonObj, i)) {
        return true;
      }
    }
  } else if (isObject(jsonObj)) {
    for (var key in jsonObj) {
      if (walk(jsonObj, key)) {
        return true;
      }
    }
  }
  return false;
}
function resolveLocale(locales) {
  return function (locale) {
    if (!locale) {
      return locale;
    }
    locale = normalizeLocale(locale) || locale;
    return resolveLocaleChain(locale).find(function (locale) {
      return locales.indexOf(locale) > -1;
    });
  };
}
function resolveLocaleChain(locale) {
  var chain = [];
  var tokens = locale.split('-');
  while (tokens.length) {
    chain.push(tokens.join('-'));
    tokens.pop();
  }
  return chain;
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"], __webpack_require__(/*! ./../../../webpack/buildin/global.js */ 3)))

/***/ }),
/* 23 */
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/classCallCheck.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 24 */
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/createClass.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var toPropertyKey = __webpack_require__(/*! ./toPropertyKey.js */ 12);
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 25 */
/*!******************************************************************************************!*\
  !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/mp-vue/dist/mp.runtime.esm.js ***!
  \******************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * Vue.js v2.6.11
 * (c) 2014-2024 Evan You
 * Released under the MIT License.
 */
/*  */

var emptyObject = Object.freeze({});

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
function isUndef (v) {
  return v === undefined || v === null
}

function isDef (v) {
  return v !== undefined && v !== null
}

function isTrue (v) {
  return v === true
}

function isFalse (v) {
  return v === false
}

/**
 * Check if value is primitive.
 */
function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 */
var _toString = Object.prototype.toString;

function toRawType (value) {
  return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

function isRegExp (v) {
  return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 */
function isValidArrayIndex (val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

function isPromise (val) {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

/**
 * Convert a value to a string that is actually rendered.
 */
function toString (val) {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (
  str,
  expectsLowerCase
) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()]; }
    : function (val) { return map[val]; }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if an attribute is a reserved attribute.
 */
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array.
 */
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether an object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 */
function cached (fn) {
  var cache = Object.create(null);
  return (function cachedFn (str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

/**
 * Capitalize a string.
 */
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
});

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 */

/* istanbul ignore next */
function polyfillBind (fn, ctx) {
  function boundFn (a) {
    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length;
  return boundFn
}

function nativeBind (fn, ctx) {
  return fn.bind(ctx)
}

var bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind;

/**
 * Convert an Array-like object to a real Array.
 */
function toArray (list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}

/**
 * Mix properties into target object.
 */
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
function toObject (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
function noop (a, b, c) {}

/**
 * Always return false.
 */
var no = function (a, b, c) { return false; };

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
var identity = function (_) { return _; };

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual (a, b) {
  if (a === b) { return true }
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      var isArrayA = Array.isArray(a);
      var isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(function (key) {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 */
function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
function once (fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  }
}

var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
];

/*  */



var config = ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: "development" !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: "development" !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
});

/*  */

/**
 * unicode letters used for parsing html tags, component names and property paths.
 * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
 * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
 */
var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

/**
 * Check if a string starts with $ or _
 */
function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}

/*  */

// can we use __proto__?
var hasProto = '__proto__' in {};

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined';
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
var isPhantomJS = UA && /phantomjs/.test(UA);
var isFF = UA && UA.match(/firefox\/(\d+)/);

// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch;
if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get () {
      }
    })); // https://github.com/facebook/flow/issues/285
    window.addEventListener('test-passive', null, opts);
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer;
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

var hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

var _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = /*@__PURE__*/(function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

/*  */

var warn = noop;
var tip = noop;
var generateComponentTrace = (noop); // work around flow check
var formatComponentName = (noop);

if (true) {
  var hasConsole = typeof console !== 'undefined';
  var classifyRE = /(?:^|[-_])(\w)/g;
  var classify = function (str) { return str
    .replace(classifyRE, function (c) { return c.toUpperCase(); })
    .replace(/[-_]/g, ''); };

  warn = function (msg, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace);
    } else if (hasConsole && (!config.silent)) {
      console.error(("[Vue warn]: " + msg + trace));
    }
  };

  tip = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.warn("[Vue tip]: " + msg + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  formatComponentName = function (vm, includeFile) {
    if (vm.$root === vm) {
      if (vm.$options && vm.$options.__file) { // fixed by xxxxxx
        return ('') + vm.$options.__file
      }
      return '<Root>'
    }
    var options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm;
    var name = options.name || options._componentTag;
    var file = options.__file;
    if (!name && file) {
      var match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
      (file && includeFile !== false ? (" at " + file) : '')
    )
  };

  var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) { res += str; }
      if (n > 1) { str += str; }
      n >>= 1;
    }
    return res
  };

  generateComponentTrace = function (vm) {
    if (vm._isVue && vm.$parent) {
      var tree = [];
      var currentRecursiveSequence = 0;
      while (vm && vm.$options.name !== 'PageBody') {
        if (tree.length > 0) {
          var last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        !vm.$options.isReserved && tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
            ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
            : formatComponentName(vm))); })
        .join('\n')
    } else {
      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
    }
  };
}

/*  */

var uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.SharedObject.target) {
    Dep.SharedObject.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  if ( true && !config.async) {
    // subs aren't sorted in scheduler if not running async
    // we need to sort them now to make sure they fire in correct
    // order
    subs.sort(function (a, b) { return a.id - b.id; });
  }
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// fixed by xxxxxx (nvue shared vuex)
/* eslint-disable no-undef */
Dep.SharedObject = {};
Dep.SharedObject.target = null;
Dep.SharedObject.targetStack = [];

function pushTarget (target) {
  Dep.SharedObject.targetStack.push(target);
  Dep.SharedObject.target = target;
  Dep.target = target;
}

function popTarget () {
  Dep.SharedObject.targetStack.pop();
  Dep.SharedObject.target = Dep.SharedObject.targetStack[Dep.SharedObject.targetStack.length - 1];
  Dep.target = Dep.SharedObject.target;
}

/*  */

var VNode = function VNode (
  tag,
  data,
  children,
  text,
  elm,
  context,
  componentOptions,
  asyncFactory
) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
};

var prototypeAccessors = { child: { configurable: true } };

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
  return this.componentInstance
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

var createEmptyVNode = function (text) {
  if ( text === void 0 ) text = '';

  var node = new VNode();
  node.text = text;
  node.isComment = true;
  return node
};

function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode (vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/*  */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
var shouldObserve = true;

function toggleObserving (value) {
  shouldObserve = value;
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    if (hasProto) {
      {// fixed by xxxxxx 微信小程序使用 plugins 之后，数组方法被直接挂载到了数组对象上，需要执行 copyAugment 逻辑
        if(value.push !== value.__proto__.push){
          copyAugment(value, arrayMethods, arrayKeys);
        } else {
          protoAugment(value, arrayMethods);
        }
      }
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through all properties and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive$$1(obj, keys[i]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue &&
    !value.__v_isMPComponent
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive$$1 (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.SharedObject.target) { // fixed by xxxxxx
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if ( true && customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) { return }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (target, key, val) {
  if ( true &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
     true && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }
  if (!ob) {
    target[key] = val;
    return val
  }
  defineReactive$$1(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del (target, key) {
  if ( true &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
     true && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key];
  if (!ob) {
    return
  }
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
if (true) {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to, from) {
  if (!from) { return to }
  var key, toVal, fromVal;

  var keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from);

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    // in case the object is already observed...
    if (key === '__ob__') { continue }
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}

/**
 * Data
 */
function mergeDataOrFn (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      var instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal;
      var defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
       true && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
};

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook (
  parentVal,
  childVal
) {
  var res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal;
  return res
    ? dedupeHooks(res)
    : res
}

function dedupeHooks (hooks) {
  var res = [];
  for (var i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i]);
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(function (hook) {
  strats[hook] = mergeHook;
});

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (
  parentVal,
  childVal,
  vm,
  key
) {
  var res = Object.create(parentVal || null);
  if (childVal) {
     true && assertObjectType(key, childVal, vm);
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) { parentVal = undefined; }
  if (childVal === nativeWatch) { childVal = undefined; }
  /* istanbul ignore if */
  if (!childVal) { return Object.create(parentVal || null) }
  if (true) {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child];
  }
  return ret
};

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal,
  childVal,
  vm,
  key
) {
  if (childVal && "development" !== 'production') {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = Object.create(null);
  extend(ret, parentVal);
  if (childVal) { extend(ret, childVal); }
  return ret
};
strats.provide = mergeDataOrFn;

/**
 * Default strategy.
 */
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

/**
 * Validate component names
 */
function checkComponents (options) {
  for (var key in options.components) {
    validateComponentName(key);
  }
}

function validateComponentName (name) {
  if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    );
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    );
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options, vm) {
  var props = options.props;
  if (!props) { return }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {
        name = camelize(val);
        res[name] = { type: null };
      } else if (true) {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val)
        ? val
        : { type: val };
    }
  } else if (true) {
    warn(
      "Invalid value for option \"props\": expected an Array or an Object, " +
      "but got " + (toRawType(props)) + ".",
      vm
    );
  }
  options.props = res;
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options, vm) {
  var inject = options.inject;
  if (!inject) { return }
  var normalized = options.inject = {};
  if (Array.isArray(inject)) {
    for (var i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] };
    }
  } else if (isPlainObject(inject)) {
    for (var key in inject) {
      var val = inject[key];
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val };
    }
  } else if (true) {
    warn(
      "Invalid value for option \"inject\": expected an Array or an Object, " +
      "but got " + (toRawType(inject)) + ".",
      vm
    );
  }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def$$1 = dirs[key];
      if (typeof def$$1 === 'function') {
        dirs[key] = { bind: def$$1, update: def$$1 };
      }
    }
  }
}

function assertObjectType (name, value, vm) {
  if (!isPlainObject(value)) {
    warn(
      "Invalid value for option \"" + name + "\": expected an Object, " +
      "but got " + (toRawType(value)) + ".",
      vm
    );
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions (
  parent,
  child,
  vm
) {
  if (true) {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }

  normalizeProps(child, vm);
  normalizeInject(child, vm);
  normalizeDirectives(child);

  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm);
    }
    if (child.mixins) {
      for (var i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm);
      }
    }
  }

  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
function resolveAsset (
  options,
  type,
  id,
  warnMissing
) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  var assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) { return assets[id] }
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
  // fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if ( true && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

/*  */



function validateProp (
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // boolean casting
  var booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }
  if (
    true
  ) {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if ( true && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }

  if (!valid) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}

function isSameType (a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex (type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (var i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

function getInvalidTypeMessage (name, value, expectedTypes) {
  var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
    " Expected " + (expectedTypes.map(capitalize).join(', '));
  var expectedType = expectedTypes[0];
  var receivedType = toRawType(value);
  var expectedValue = styleValue(value, expectedType);
  var receivedValue = styleValue(value, receivedType);
  // check if we need to specify expected value
  if (expectedTypes.length === 1 &&
      isExplicable(expectedType) &&
      !isBoolean(expectedType, receivedType)) {
    message += " with value " + expectedValue;
  }
  message += ", got " + receivedType + " ";
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += "with value " + receivedValue + ".";
  }
  return message
}

function styleValue (value, type) {
  if (type === 'String') {
    return ("\"" + value + "\"")
  } else if (type === 'Number') {
    return ("" + (Number(value)))
  } else {
    return ("" + value)
  }
}

function isExplicable (value) {
  var explicitTypes = ['string', 'number', 'boolean'];
  return explicitTypes.some(function (elem) { return value.toLowerCase() === elem; })
}

function isBoolean () {
  var args = [], len = arguments.length;
  while ( len-- ) args[ len ] = arguments[ len ];

  return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
}

/*  */

function handleError (err, vm, info) {
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  pushTarget();
  try {
    if (vm) {
      var cur = vm;
      while ((cur = cur.$parent)) {
        var hooks = cur.$options.errorCaptured;
        if (hooks) {
          for (var i = 0; i < hooks.length; i++) {
            try {
              var capture = hooks[i].call(cur, err, vm, info) === false;
              if (capture) { return }
            } catch (e) {
              globalHandleError(e, cur, 'errorCaptured hook');
            }
          }
        }
      }
    }
    globalHandleError(err, vm, info);
  } finally {
    popTarget();
  }
}

function invokeWithErrorHandling (
  handler,
  context,
  args,
  vm,
  info
) {
  var res;
  try {
    res = args ? handler.apply(context, args) : handler.call(context);
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true;
    }
  } catch (e) {
    handleError(e, vm, info);
  }
  return res
}

function globalHandleError (err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      if (e !== err) {
        logError(e, null, 'config.errorHandler');
      }
    }
  }
  logError(err, vm, info);
}

function logError (err, vm, info) {
  if (true) {
    warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err
  }
}

/*  */

var callbacks = [];
var pending = false;

function flushCallbacks () {
  pending = false;
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).
var timerFunc;

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  var p = Promise.resolve();
  timerFunc = function () {
    p.then(flushCallbacks);
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) { setTimeout(noop); }
  };
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  var counter = 1;
  var observer = new MutationObserver(flushCallbacks);
  var textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {
    characterData: true
  });
  timerFunc = function () {
    counter = (counter + 1) % 2;
    textNode.data = String(counter);
  };
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else {
  // Fallback to setTimeout.
  timerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };
}

function nextTick (cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    timerFunc();
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}

/*  */

/* not type checking this file because flow doesn't play well with Proxy */

var initProxy;

if (true) {
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var warnNonPresent = function (target, key) {
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    );
  };

  var warnReservedPrefix = function (target, key) {
    warn(
      "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals. ' +
      'See: https://vuejs.org/v2/api/#data',
      target
    );
  };

  var hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }

  var hasHandler = {
    has: function has (target, key) {
      var has = key in target;
      var isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
      if (!has && !isAllowed) {
        if (key in target.$data) { warnReservedPrefix(target, key); }
        else { warnNonPresent(target, key); }
      }
      return has || !isAllowed
    }
  };

  var getHandler = {
    get: function get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) { warnReservedPrefix(target, key); }
        else { warnNonPresent(target, key); }
      }
      return target[key]
    }
  };

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;
      var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

/*  */

var seenObjects = new _Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse (val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

var mark;
var measure;

if (true) {
  var perf = inBrowser && window.performance;
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    mark = function (tag) { return perf.mark(tag); };
    measure = function (name, startTag, endTag) {
      perf.measure(name, startTag, endTag);
      perf.clearMarks(startTag);
      perf.clearMarks(endTag);
      // perf.clearMeasures(name)
    };
  }
}

/*  */

var normalizeEvent = cached(function (name) {
  var passive = name.charAt(0) === '&';
  name = passive ? name.slice(1) : name;
  var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once$$1 ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once$$1,
    capture: capture,
    passive: passive
  }
});

function createFnInvoker (fns, vm) {
  function invoker () {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
    }
  }
  invoker.fns = fns;
  return invoker
}

function updateListeners (
  on,
  oldOn,
  add,
  remove$$1,
  createOnceHandler,
  vm
) {
  var name, def$$1, cur, old, event;
  for (name in on) {
    def$$1 = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    if (isUndef(cur)) {
       true && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm);
      }
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture);
      }
      add(event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}

/*  */

/*  */

// fixed by xxxxxx (mp properties)
function extractPropertiesFromVNodeData(data, Ctor, res, context) {
  var propOptions = Ctor.options.mpOptions && Ctor.options.mpOptions.properties;
  if (isUndef(propOptions)) {
    return res
  }
  var externalClasses = Ctor.options.mpOptions.externalClasses || [];
  var attrs = data.attrs;
  var props = data.props;
  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      var result = checkProp(res, props, key, altKey, true) ||
          checkProp(res, attrs, key, altKey, false);
      // externalClass
      if (
        result &&
        res[key] &&
        externalClasses.indexOf(altKey) !== -1 &&
        context[camelize(res[key])]
      ) {
        // 赋值 externalClass 真正的值(模板里 externalClass 的值可能是字符串)
        res[key] = context[camelize(res[key])];
      }
    }
  }
  return res
}

function extractPropsFromVNodeData (
  data,
  Ctor,
  tag,
  context// fixed by xxxxxx
) {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  var propOptions = Ctor.options.props;
  if (isUndef(propOptions)) {
    // fixed by xxxxxx
    return extractPropertiesFromVNodeData(data, Ctor, {}, context)
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;
  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      if (true) {
        var keyInLowerCase = key.toLowerCase();
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            "Prop \"" + keyInLowerCase + "\" is passed to component " +
            (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
            " \"" + key + "\". " +
            "Note that HTML attributes are case-insensitive and camelCased " +
            "props need to use their kebab-case equivalents when using in-DOM " +
            "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
          );
        }
      }
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false);
    }
  }
  // fixed by xxxxxx
  return extractPropertiesFromVNodeData(data, Ctor, res, context)
}

function checkProp (
  res,
  hash,
  key,
  altKey,
  preserve
) {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true
    }
  }
  return false
}

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
function simpleNormalizeChildren (children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
function normalizeChildren (children) {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function normalizeArrayChildren (children, nestedIndex) {
  var res = [];
  var i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') { continue }
    lastIndex = res.length - 1;
    last = res[lastIndex];
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

/*  */

function initProvide (vm) {
  var provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide;
  }
}

function initInjections (vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach(function (key) {
      /* istanbul ignore else */
      if (true) {
        defineReactive$$1(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
            "overwritten whenever the provided component re-renders. " +
            "injection being mutated: \"" + key + "\"",
            vm
          );
        });
      } else {}
    });
    toggleObserving(true);
  }
}

function resolveInject (inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      // #6574 in case the inject object is observed...
      if (key === '__ob__') { continue }
      var provideKey = inject[key].from;
      var source = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent;
      }
      if (!source) {
        if ('default' in inject[key]) {
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
        } else if (true) {
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  }
}

/*  */



/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */
function resolveSlots (
  children,
  context
) {
  if (!children || !children.length) {
    return {}
  }
  var slots = {};
  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    var data = child.data;
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      var name = data.slot;
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || []);
      } else {
        slot.push(child);
      }
    } else {
      // fixed by xxxxxx 临时 hack 掉 uni-app 中的异步 name slot page
      if(child.asyncMeta && child.asyncMeta.data && child.asyncMeta.data.slot === 'page'){
        (slots['page'] || (slots['page'] = [])).push(child);
      }else{
        (slots.default || (slots.default = [])).push(child);
      }
    }
  }
  // ignore slots that contains only whitespace
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}

function isWhitespace (node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

/*  */

function normalizeScopedSlots (
  slots,
  normalSlots,
  prevSlots
) {
  var res;
  var hasNormalSlots = Object.keys(normalSlots).length > 0;
  var isStable = slots ? !!slots.$stable : !hasNormalSlots;
  var key = slots && slots.$key;
  if (!slots) {
    res = {};
  } else if (slots._normalized) {
    // fast path 1: child component re-render only, parent did not change
    return slots._normalized
  } else if (
    isStable &&
    prevSlots &&
    prevSlots !== emptyObject &&
    key === prevSlots.$key &&
    !hasNormalSlots &&
    !prevSlots.$hasNormal
  ) {
    // fast path 2: stable scoped slots w/ no normal slots to proxy,
    // only need to normalize once
    return prevSlots
  } else {
    res = {};
    for (var key$1 in slots) {
      if (slots[key$1] && key$1[0] !== '$') {
        res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
      }
    }
  }
  // expose normal slots on scopedSlots
  for (var key$2 in normalSlots) {
    if (!(key$2 in res)) {
      res[key$2] = proxyNormalSlot(normalSlots, key$2);
    }
  }
  // avoriaz seems to mock a non-extensible $scopedSlots object
  // and when that is passed down this would cause an error
  if (slots && Object.isExtensible(slots)) {
    (slots)._normalized = res;
  }
  def(res, '$stable', isStable);
  def(res, '$key', key);
  def(res, '$hasNormal', hasNormalSlots);
  return res
}

function normalizeScopedSlot(normalSlots, key, fn) {
  var normalized = function () {
    var res = arguments.length ? fn.apply(null, arguments) : fn({});
    res = res && typeof res === 'object' && !Array.isArray(res)
      ? [res] // single vnode
      : normalizeChildren(res);
    return res && (
      res.length === 0 ||
      (res.length === 1 && res[0].isComment) // #9658
    ) ? undefined
      : res
  };
  // this is a slot using the new v-slot syntax without scope. although it is
  // compiled as a scoped slot, render fn users would expect it to be present
  // on this.$slots because the usage is semantically a normal slot.
  if (fn.proxy) {
    Object.defineProperty(normalSlots, key, {
      get: normalized,
      enumerable: true,
      configurable: true
    });
  }
  return normalized
}

function proxyNormalSlot(slots, key) {
  return function () { return slots[key]; }
}

/*  */

/**
 * Runtime helper for rendering v-for lists.
 */
function renderList (
  val,
  render
) {
  var ret, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i, i, i); // fixed by xxxxxx
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i, i, i); // fixed by xxxxxx
    }
  } else if (isObject(val)) {
    if (hasSymbol && val[Symbol.iterator]) {
      ret = [];
      var iterator = val[Symbol.iterator]();
      var result = iterator.next();
      while (!result.done) {
        ret.push(render(result.value, ret.length, i, i++)); // fixed by xxxxxx
        result = iterator.next();
      }
    } else {
      keys = Object.keys(val);
      ret = new Array(keys.length);
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        ret[i] = render(val[key], key, i, i); // fixed by xxxxxx
      }
    }
  }
  if (!isDef(ret)) {
    ret = [];
  }
  (ret)._isVList = true;
  return ret
}

/*  */

/**
 * Runtime helper for rendering <slot>
 */
function renderSlot (
  name,
  fallback,
  props,
  bindObject
) {
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  if (scopedSlotFn) { // scoped slot
    props = props || {};
    if (bindObject) {
      if ( true && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        );
      }
      props = extend(extend({}, bindObject), props);
    }
    // fixed by xxxxxx app-plus scopedSlot
    nodes = scopedSlotFn(props, this, props._i) || fallback;
  } else {
    nodes = this.$slots[name] || fallback;
  }

  var target = props && props.slot;
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}

/*  */

/**
 * Runtime helper for resolving filters
 */
function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}

/*  */

function isKeyNotMatch (expect, actual) {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
function checkKeyCodes (
  eventKeyCode,
  key,
  builtInKeyCode,
  eventKeyName,
  builtInKeyName
) {
  var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

/*  */

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
function bindObjectProps (
  data,
  tag,
  value,
  asProp,
  isSync
) {
  if (value) {
    if (!isObject(value)) {
       true && warn(
        'v-bind without argument expects an Object or Array value',
        this
      );
    } else {
      if (Array.isArray(value)) {
        value = toObject(value);
      }
      var hash;
      var loop = function ( key ) {
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key)
        ) {
          hash = data;
        } else {
          var type = data.attrs && data.attrs.type;
          hash = asProp || config.mustUseProp(tag, type, key)
            ? data.domProps || (data.domProps = {})
            : data.attrs || (data.attrs = {});
        }
        var camelizedKey = camelize(key);
        var hyphenatedKey = hyphenate(key);
        if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
          hash[key] = value[key];

          if (isSync) {
            var on = data.on || (data.on = {});
            on[("update:" + key)] = function ($event) {
              value[key] = $event;
            };
          }
        }
      };

      for (var key in value) loop( key );
    }
  }
  return data
}

/*  */

/**
 * Runtime helper for rendering static trees.
 */
function renderStatic (
  index,
  isInFor
) {
  var cached = this._staticTrees || (this._staticTrees = []);
  var tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) {
    return tree
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  );
  markStatic(tree, ("__static__" + index), false);
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
function markOnce (
  tree,
  index,
  key
) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}

function markStatic (
  tree,
  key,
  isOnce
) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

function markStaticNode (node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}

/*  */

function bindObjectListeners (data, value) {
  if (value) {
    if (!isPlainObject(value)) {
       true && warn(
        'v-on without argument expects an Object value',
        this
      );
    } else {
      var on = data.on = data.on ? extend({}, data.on) : {};
      for (var key in value) {
        var existing = on[key];
        var ours = value[key];
        on[key] = existing ? [].concat(existing, ours) : ours;
      }
    }
  }
  return data
}

/*  */

function resolveScopedSlots (
  fns, // see flow/vnode
  res,
  // the following are added in 2.6
  hasDynamicKeys,
  contentHashKey
) {
  res = res || { $stable: !hasDynamicKeys };
  for (var i = 0; i < fns.length; i++) {
    var slot = fns[i];
    if (Array.isArray(slot)) {
      resolveScopedSlots(slot, res, hasDynamicKeys);
    } else if (slot) {
      // marker for reverse proxying v-slot without scope on this.$slots
      if (slot.proxy) {
        slot.fn.proxy = true;
      }
      res[slot.key] = slot.fn;
    }
  }
  if (contentHashKey) {
    (res).$key = contentHashKey;
  }
  return res
}

/*  */

function bindDynamicKeys (baseObj, values) {
  for (var i = 0; i < values.length; i += 2) {
    var key = values[i];
    if (typeof key === 'string' && key) {
      baseObj[values[i]] = values[i + 1];
    } else if ( true && key !== '' && key !== null) {
      // null is a special value for explicitly removing a binding
      warn(
        ("Invalid value for dynamic directive argument (expected string or null): " + key),
        this
      );
    }
  }
  return baseObj
}

// helper to dynamically append modifier runtime markers to event names.
// ensure only append when value is already string, otherwise it will be cast
// to string and cause the type check to miss.
function prependModifier (value, symbol) {
  return typeof value === 'string' ? symbol + value : value
}

/*  */

function installRenderHelpers (target) {
  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
  target._d = bindDynamicKeys;
  target._p = prependModifier;
}

/*  */

function FunctionalRenderContext (
  data,
  props,
  children,
  parent,
  Ctor
) {
  var this$1 = this;

  var options = Ctor.options;
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var contextVm;
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent);
    // $flow-disable-line
    contextVm._original = parent;
  } else {
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent;
    // $flow-disable-line
    parent = parent._original;
  }
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () {
    if (!this$1.$slots) {
      normalizeScopedSlots(
        data.scopedSlots,
        this$1.$slots = resolveSlots(children, parent)
      );
    }
    return this$1.$slots
  };

  Object.defineProperty(this, 'scopedSlots', ({
    enumerable: true,
    get: function get () {
      return normalizeScopedSlots(data.scopedSlots, this.slots())
    }
  }));

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
  }

  if (options._scopeId) {
    this._c = function (a, b, c, d) {
      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
  }
}

installRenderHelpers(FunctionalRenderContext.prototype);

function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  var options = Ctor.options;
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
    if (isDef(data.props)) { mergeProps(props, data.props); }
  }

  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  var vnode = options.render.call(null, renderContext._c, renderContext);

  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
  } else if (Array.isArray(vnode)) {
    var vnodes = normalizeChildren(vnode) || [];
    var res = new Array(vnodes.length);
    for (var i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  var clone = cloneVNode(vnode);
  clone.fnContext = contextVm;
  clone.fnOptions = options;
  if (true) {
    (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
  }
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot;
  }
  return clone
}

function mergeProps (to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}

/*  */

/*  */

/*  */

/*  */

// inline hooks to be invoked on component VNodes during patch
var componentVNodeHooks = {
  init: function init (vnode, hydrating) {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      var child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      );
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  },

  prepatch: function prepatch (oldVnode, vnode) {
    var options = vnode.componentOptions;
    var child = vnode.componentInstance = oldVnode.componentInstance;
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      callHook(componentInstance, 'onServiceCreated');
      callHook(componentInstance, 'onServiceAttached');
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  },

  destroy: function destroy (vnode) {
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy();
      } else {
        deactivateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
};

var hooksToMerge = Object.keys(componentVNodeHooks);

function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    if (true) {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  var asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {};

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props
  var propsData = extractPropsFromVNodeData(data, Ctor, tag, context); // fixed by xxxxxx

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  var listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    var slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
    asyncFactory
  );

  return vnode
}

function createComponentInstanceForVnode (
  vnode, // we know it's MountedComponentVNode but flow doesn't
  parent // activeInstance in lifecycle state
) {
  var options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent: parent
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks (data) {
  var hooks = data.hook || (data.hook = {});
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    var existing = hooks[key];
    var toMerge = componentVNodeHooks[key];
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
    }
  }
}

function mergeHook$1 (f1, f2) {
  var merged = function (a, b) {
    // flow complains about extra args which is why we use any
    f1(a, b);
    f2(a, b);
  };
  merged._merged = true;
  return merged
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel (options, data) {
  var prop = (options.model && options.model.prop) || 'value';
  var event = (options.model && options.model.event) || 'input'
  ;(data.attrs || (data.attrs = {}))[prop] = data.model.value;
  var on = data.on || (data.on = {});
  var existing = on[event];
  var callback = data.model.callback;
  if (isDef(existing)) {
    if (
      Array.isArray(existing)
        ? existing.indexOf(callback) === -1
        : existing !== callback
    ) {
      on[event] = [callback].concat(existing);
    }
  } else {
    on[event] = callback;
  }
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement (
  context,
  tag,
  data,
  children,
  normalizationType,
  alwaysNormalize
) {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType)
}

function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (isDef(data) && isDef((data).__ob__)) {
     true && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if ( true &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  var vnode, ns;
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      if ( true && isDef(data) && isDef(data.nativeOn)) {
        warn(
          ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
          context
        );
      }
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) { applyNS(vnode, ns); }
    if (isDef(data)) { registerDeepBindings(data); }
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force);
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings (data) {
  if (isObject(data.style)) {
    traverse(data.style);
  }
  if (isObject(data.class)) {
    traverse(data.class);
  }
}

/*  */

function initRender (vm) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  var options = vm.$options;
  var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
  var renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  var parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  if (true) {
    defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
      !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
    }, true);
    defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, function () {
      !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
    }, true);
  } else {}
}

var currentRenderingInstance = null;

function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var _parentVnode = ref._parentVnode;

    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      );
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm;
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if ( true && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
        } catch (e) {
          handleError(e, vm, "renderError");
          vnode = vm._vnode;
        }
      } else {
        vnode = vm._vnode;
      }
    } finally {
      currentRenderingInstance = null;
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0];
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if ( true && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };
}

/*  */

function ensureCtor (comp, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default;
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

function createAsyncPlaceholder (
  factory,
  data,
  context,
  children,
  tag
) {
  var node = createEmptyVNode();
  node.asyncFactory = factory;
  node.asyncMeta = { data: data, context: context, children: children, tag: tag };
  return node
}

function resolveAsyncComponent (
  factory,
  baseCtor
) {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  var owner = currentRenderingInstance;
  if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
    // already pending
    factory.owners.push(owner);
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  if (owner && !isDef(factory.owners)) {
    var owners = factory.owners = [owner];
    var sync = true;
    var timerLoading = null;
    var timerTimeout = null

    ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

    var forceRender = function (renderCompleted) {
      for (var i = 0, l = owners.length; i < l; i++) {
        (owners[i]).$forceUpdate();
      }

      if (renderCompleted) {
        owners.length = 0;
        if (timerLoading !== null) {
          clearTimeout(timerLoading);
          timerLoading = null;
        }
        if (timerTimeout !== null) {
          clearTimeout(timerTimeout);
          timerTimeout = null;
        }
      }
    };

    var resolve = once(function (res) {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender(true);
      } else {
        owners.length = 0;
      }
    });

    var reject = once(function (reason) {
       true && warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender(true);
      }
    });

    var res = factory(resolve, reject);

    if (isObject(res)) {
      if (isPromise(res)) {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (isPromise(res.component)) {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            timerLoading = setTimeout(function () {
              timerLoading = null;
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender(false);
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          timerTimeout = setTimeout(function () {
            timerTimeout = null;
            if (isUndef(factory.resolved)) {
              reject(
                 true
                  ? ("timeout (" + (res.timeout) + "ms)")
                  : undefined
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}

/*  */

function isAsyncPlaceholder (node) {
  return node.isComment && node.asyncFactory
}

/*  */

function getFirstComponentChild (children) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}

/*  */

/*  */

function initEvents (vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

var target;

function add (event, fn) {
  target.$on(event, fn);
}

function remove$1 (event, fn) {
  target.$off(event, fn);
}

function createOnceHandler (event, fn) {
  var _target = target;
  return function onceHandler () {
    var res = fn.apply(null, arguments);
    if (res !== null) {
      _target.$off(event, onceHandler);
    }
  }
}

function updateComponentListeners (
  vm,
  listeners,
  oldListeners
) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
  target = undefined;
}

function eventsMixin (Vue) {
  var hookRE = /^hook:/;
  Vue.prototype.$on = function (event, fn) {
    var vm = this;
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

  Vue.prototype.$once = function (event, fn) {
    var vm = this;
    function on () {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  Vue.prototype.$off = function (event, fn) {
    var vm = this;
    // all
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
        vm.$off(event[i$1], fn);
      }
      return vm
    }
    // specific event
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    // specific handler
    var cb;
    var i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break
      }
    }
    return vm
  };

  Vue.prototype.$emit = function (event) {
    var vm = this;
    if (true) {
      var lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          "Event \"" + lowerCaseEvent + "\" is emitted in component " +
          (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
          "Note that HTML attributes are case-insensitive and you cannot use " +
          "v-on to listen to camelCase events when using in-DOM templates. " +
          "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
        );
      }
    }
    var cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);
      var info = "event handler for \"" + event + "\"";
      for (var i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info);
      }
    }
    return vm
  };
}

/*  */

var activeInstance = null;
var isUpdatingChildComponent = false;

function setActiveInstance(vm) {
  var prevActiveInstance = activeInstance;
  activeInstance = vm;
  return function () {
    activeInstance = prevActiveInstance;
  }
}

function initLifecycle (vm) {
  var options = vm.$options;

  // locate first non-abstract parent
  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var restoreActiveInstance = setActiveInstance(vm);
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    restoreActiveInstance();
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  Vue.prototype.$forceUpdate = function () {
    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  Vue.prototype.$destroy = function () {
    var vm = this;
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    var parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }
    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
    // fire destroyed hook
    callHook(vm, 'destroyed');
    // turn off all instance listeners.
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null;
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  };
}

function updateChildComponent (
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  if (true) {
    isUpdatingChildComponent = true;
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.

  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  var newScopedSlots = parentVnode.data.scopedSlots;
  var oldScopedSlots = vm.$scopedSlots;
  var hasDynamicScopedSlot = !!(
    (newScopedSlots && !newScopedSlots.$stable) ||
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
  );

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  var needsForceUpdate = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    hasDynamicScopedSlot
  );

  vm.$options._parentVnode = parentVnode;
  vm.$vnode = parentVnode; // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode;
  }
  vm.$options._renderChildren = renderChildren;

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject;
  vm.$listeners = listeners || emptyObject;

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false);
    var props = vm._props;
    var propKeys = vm.$options._propKeys || [];
    for (var i = 0; i < propKeys.length; i++) {
      var key = propKeys[i];
      var propOptions = vm.$options.props; // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm);
    }
    toggleObserving(true);
    // keep a copy of raw propsData
    vm.$options.propsData = propsData;
  }
  
  // fixed by xxxxxx update properties(mp runtime)
  vm._$updateProperties && vm._$updateProperties(vm);
  
  // update listeners
  listeners = listeners || emptyObject;
  var oldListeners = vm.$options._parentListeners;
  vm.$options._parentListeners = listeners;
  updateComponentListeners(vm, listeners, oldListeners);

  // resolve slots + force update if has children
  if (needsForceUpdate) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context);
    vm.$forceUpdate();
  }

  if (true) {
    isUpdatingChildComponent = false;
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) { return true }
  }
  return false
}

function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}

function deactivateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = true;
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true;
    for (var i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'deactivated');
  }
}

function callHook (vm, hook) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget();
  var handlers = vm.$options[hook];
  var info = hook + " hook";
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info);
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
  popTarget();
}

/*  */

var MAX_UPDATE_COUNT = 100;

var queue = [];
var activatedChildren = [];
var has = {};
var circular = {};
var waiting = false;
var flushing = false;
var index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  if (true) {
    circular = {};
  }
  waiting = flushing = false;
}

// Async edge case #6566 requires saving the timestamp when event listeners are
// attached. However, calling performance.now() has a perf overhead especially
// if the page has thousands of event listeners. Instead, we take a timestamp
// every time the scheduler flushes and use that for all event listeners
// attached during that flush.
var currentFlushTimestamp = 0;

// Async edge case fix requires storing an event listener's attach timestamp.
var getNow = Date.now;

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
// All IE versions use low-res event timestamps, and have problematic clock
// implementations (#9632)
if (inBrowser && !isIE) {
  var performance = window.performance;
  if (
    performance &&
    typeof performance.now === 'function' &&
    getNow() > document.createEvent('Event').timeStamp
  ) {
    // if the event timestamp, although evaluated AFTER the Date.now(), is
    // smaller than it, it means the event is using a hi-res timestamp,
    // and we need to use the hi-res version for event listener timestamps as
    // well.
    getNow = function () { return performance.now(); };
  }
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow();
  flushing = true;
  var watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort(function (a, b) { return a.id - b.id; });

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    if (watcher.before) {
      watcher.before();
    }
    id = watcher.id;
    has[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if ( true && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}

function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated');
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
function queueActivatedComponent (vm) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false;
  activatedChildren.push(vm);
}

function callActivatedHooks (queue) {
  for (var i = 0; i < queue.length; i++) {
    queue[i]._inactive = true;
    activateChildComponent(queue[i], true /* true */);
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;

      if ( true && !config.async) {
        flushSchedulerQueue();
        return
      }
      nextTick(flushSchedulerQueue);
    }
  }
}

/*  */



var uid$2 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options,
  isRenderWatcher
) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
    this.before = options.before;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression =  true
    ? expOrFn.toString()
    : undefined;
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = noop;
       true && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps () {
  var i = this.deps.length;
  while (i--) {
    var dep = this.deps[i];
    if (!this.newDepIds.has(dep.id)) {
      dep.removeSub(this);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate () {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend () {
  var i = this.deps.length;
  while (i--) {
    this.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown () {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
    this.active = false;
  }
};

/*  */

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function initState (vm) {
  vm._watchers = [];
  var opts = vm.$options;
  if (opts.props) { initProps(vm, opts.props); }
  if (opts.methods) { initMethods(vm, opts.methods); }
  if (opts.data) {
    initData(vm);
  } else {
    observe(vm._data = {}, true /* asRootData */);
  }
  if (opts.computed) { initComputed(vm, opts.computed); }
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

function initProps (vm, propsOptions) {
  var propsData = vm.$options.propsData || {};
  var props = vm._props = {};
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false);
  }
  var loop = function ( key ) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (true) {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive$$1(props, key, value, function () {
        if (!isRoot && !isUpdatingChildComponent) {
          {
            if(vm.mpHost === 'mp-baidu' || vm.mpHost === 'mp-kuaishou' || vm.mpHost === 'mp-xhs'){//百度、快手、小红书 observer 在 setData callback 之后触发，直接忽略该 warn
                return
            }
            //fixed by xxxxxx __next_tick_pending,uni://form-field 时不告警
            if(
                key === 'value' && 
                Array.isArray(vm.$options.behaviors) &&
                vm.$options.behaviors.indexOf('uni://form-field') !== -1
              ){
              return
            }
            if(vm._getFormData){
              return
            }
            var $parent = vm.$parent;
            while($parent){
              if($parent.__next_tick_pending){
                return  
              }
              $parent = $parent.$parent;
            }
          }
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    } else {}
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, "_props", key);
    }
  };

  for (var key in propsOptions) loop( key );
  toggleObserving(true);
}

function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
     true && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    if (true) {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
       true && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      proxy(vm, "_data", key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

function getData (data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, "data()");
    return {}
  } finally {
    popTarget();
  }
}

var computedWatcherOptions = { lazy: true };

function initComputed (vm, computed) {
  // $flow-disable-line
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if ( true && getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else if (true) {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}

function defineComputed (
  target,
  key,
  userDef
) {
  var shouldCache = !isServerRendering();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef);
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }
  if ( true &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        ("Computed property \"" + key + "\" was assigned to but it has no setter."),
        this
      );
    };
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter (key) {
  return function computedGetter () {
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.SharedObject.target) {// fixed by xxxxxx
        watcher.depend();
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

function initMethods (vm, methods) {
  var props = vm.$options.props;
  for (var key in methods) {
    if (true) {
      if (typeof methods[key] !== 'function') {
        warn(
          "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
          "Did you reference the function correctly?",
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a prop."),
          vm
        );
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
          "Avoid defining component methods that start with _ or $."
        );
      }
    }
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
  }
}

function initWatch (vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher (
  vm,
  expOrFn,
  handler,
  options
) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options)
}

function stateMixin (Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  var dataDef = {};
  dataDef.get = function () { return this._data };
  var propsDef = {};
  propsDef.get = function () { return this._props };
  if (true) {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };
    propsDef.set = function () {
      warn("$props is readonly.", this);
    };
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value);
      } catch (error) {
        handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
      }
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
}

/*  */

var uid$3 = 0;

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    var vm = this;
    // a uid
    vm._uid = uid$3++;

    var startTag, endTag;
    /* istanbul ignore if */
    if ( true && config.performance && mark) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (true) {
      initProxy(vm);
    } else {}
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    !vm._$fallback && initInjections(vm); // resolve injections before data/props  
    initState(vm);
    !vm._$fallback && initProvide(vm); // resolve provide after data/props
    !vm._$fallback && callHook(vm, 'created');      

    /* istanbul ignore if */
    if ( true && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

function initInternalComponent (vm, options) {
  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  var parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  var vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor) {
  var modified;
  var latest = Ctor.options;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) { modified = {}; }
      modified[key] = latest[key];
    }
  }
  return modified
}

function Vue (options) {
  if ( true &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

/*  */

function initUse (Vue) {
  Vue.use = function (plugin) {
    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    var args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args);
    }
    installedPlugins.push(plugin);
    return this
  };
}

/*  */

function initMixin$1 (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
    return this
  };
}

/*  */

function initExtend (Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    var name = extendOptions.name || Super.options.name;
    if ( true && name) {
      validateComponentName(name);
    }

    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

function initProps$1 (Comp) {
  var props = Comp.options.props;
  for (var key in props) {
    proxy(Comp.prototype, "_props", key);
  }
}

function initComputed$1 (Comp) {
  var computed = Comp.options.computed;
  for (var key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

/*  */

function initAssetRegisters (Vue) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if ( true && type === 'component') {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}

/*  */



function getComponentName (opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance, filter) {
  var cache = keepAliveInstance.cache;
  var keys = keepAliveInstance.keys;
  var _vnode = keepAliveInstance._vnode;
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

function pruneCacheEntry (
  cache,
  key,
  keys,
  current
) {
  var cached$$1 = cache[key];
  if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created: function created () {
    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed: function destroyed () {
    for (var key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys);
    }
  },

  mounted: function mounted () {
    var this$1 = this;

    this.$watch('include', function (val) {
      pruneCache(this$1, function (name) { return matches(val, name); });
    });
    this.$watch('exclude', function (val) {
      pruneCache(this$1, function (name) { return !matches(val, name); });
    });
  },

  render: function render () {
    var slot = this.$slots.default;
    var vnode = getFirstComponentChild(slot);
    var componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions);
      var ref = this;
      var include = ref.include;
      var exclude = ref.exclude;
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      var ref$1 = this;
      var cache = ref$1.cache;
      var keys = ref$1.keys;
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
        : vnode.key;
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key);
        keys.push(key);
      } else {
        cache[key] = vnode;
        keys.push(key);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
      }

      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0])
  }
};

var builtInComponents = {
  KeepAlive: KeepAlive
};

/*  */

function initGlobalAPI (Vue) {
  // config
  var configDef = {};
  configDef.get = function () { return config; };
  if (true) {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }
  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive$$1
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  // 2.6 explicit observable API
  Vue.observable = function (obj) {
    observe(obj);
    return obj
  };

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

initGlobalAPI(Vue);

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
});

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get: function get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
});

Vue.version = '2.6.11';

/**
 * https://raw.githubusercontent.com/Tencent/westore/master/packages/westore/utils/diff.js
 */
var ARRAYTYPE = '[object Array]';
var OBJECTTYPE = '[object Object]';
var NULLTYPE = '[object Null]';
var UNDEFINEDTYPE = '[object Undefined]';
// const FUNCTIONTYPE = '[object Function]'

function diff(current, pre) {
    var result = {};
    syncKeys(current, pre);
    _diff(current, pre, '', result);
    return result
}

function syncKeys(current, pre) {
    if (current === pre) { return }
    var rootCurrentType = type(current);
    var rootPreType = type(pre);
    if (rootCurrentType == OBJECTTYPE && rootPreType == OBJECTTYPE) {
        if(Object.keys(current).length >= Object.keys(pre).length){
            for (var key in pre) {
                var currentValue = current[key];
                if (currentValue === undefined) {
                    current[key] = null;
                } else {
                    syncKeys(currentValue, pre[key]);
                }
            }
        }
    } else if (rootCurrentType == ARRAYTYPE && rootPreType == ARRAYTYPE) {
        if (current.length >= pre.length) {
            pre.forEach(function (item, index) {
                syncKeys(current[index], item);
            });
        }
    }
}

function nullOrUndefined(currentType, preType) {
    if(
        (currentType === NULLTYPE || currentType === UNDEFINEDTYPE) && 
        (preType === NULLTYPE || preType === UNDEFINEDTYPE)
    ) {
        return false
    }
    return true
}

function _diff(current, pre, path, result) {
    if (current === pre) { return }
    var rootCurrentType = type(current);
    var rootPreType = type(pre);
    if (rootCurrentType == OBJECTTYPE) {
        if (rootPreType != OBJECTTYPE || Object.keys(current).length < Object.keys(pre).length) {
            setResult(result, path, current);
        } else {
            var loop = function ( key ) {
                var currentValue = current[key];
                var preValue = pre[key];
                var currentType = type(currentValue);
                var preType = type(preValue);
                if (currentType != ARRAYTYPE && currentType != OBJECTTYPE) {
                    if (currentValue !== pre[key] && nullOrUndefined(currentType, preType)) {
                        setResult(result, (path == '' ? '' : path + ".") + key, currentValue);
                    }
                } else if (currentType == ARRAYTYPE) {
                    if (preType != ARRAYTYPE) {
                        setResult(result, (path == '' ? '' : path + ".") + key, currentValue);
                    } else {
                        if (currentValue.length < preValue.length) {
                            setResult(result, (path == '' ? '' : path + ".") + key, currentValue);
                        } else {
                            currentValue.forEach(function (item, index) {
                                _diff(item, preValue[index], (path == '' ? '' : path + ".") + key + '[' + index + ']', result);
                            });
                        }
                    }
                } else if (currentType == OBJECTTYPE) {
                    if (preType != OBJECTTYPE || Object.keys(currentValue).length < Object.keys(preValue).length) {
                        setResult(result, (path == '' ? '' : path + ".") + key, currentValue);
                    } else {
                        for (var subKey in currentValue) {
                            _diff(currentValue[subKey], preValue[subKey], (path == '' ? '' : path + ".") + key + '.' + subKey, result);
                        }
                    }
                }
            };

            for (var key in current) loop( key );
        }
    } else if (rootCurrentType == ARRAYTYPE) {
        if (rootPreType != ARRAYTYPE) {
            setResult(result, path, current);
        } else {
            if (current.length < pre.length) {
                setResult(result, path, current);
            } else {
                current.forEach(function (item, index) {
                    _diff(item, pre[index], path + '[' + index + ']', result);
                });
            }
        }
    } else {
        setResult(result, path, current);
    }
}

function setResult(result, k, v) {
    // if (type(v) != FUNCTIONTYPE) {
        result[k] = v;
    // }
}

function type(obj) {
    return Object.prototype.toString.call(obj)
}

/*  */

function flushCallbacks$1(vm) {
    if (vm.__next_tick_callbacks && vm.__next_tick_callbacks.length) {
        if (Object({"NODE_ENV":"development","VUE_APP_DARK_MODE":"false","VUE_APP_NAME":"superPower","VUE_APP_PLATFORM":"mp-weixin","BASE_URL":"/"}).VUE_APP_DEBUG) {
            var mpInstance = vm.$scope;
            console.log('[' + (+new Date) + '][' + (mpInstance.is || mpInstance.route) + '][' + vm._uid +
                ']:flushCallbacks[' + vm.__next_tick_callbacks.length + ']');
        }
        var copies = vm.__next_tick_callbacks.slice(0);
        vm.__next_tick_callbacks.length = 0;
        for (var i = 0; i < copies.length; i++) {
            copies[i]();
        }
    }
}

function hasRenderWatcher(vm) {
    return queue.find(function (watcher) { return vm._watcher === watcher; })
}

function nextTick$1(vm, cb) {
    //1.nextTick 之前 已 setData 且 setData 还未回调完成
    //2.nextTick 之前存在 render watcher
    if (!vm.__next_tick_pending && !hasRenderWatcher(vm)) {
        if(Object({"NODE_ENV":"development","VUE_APP_DARK_MODE":"false","VUE_APP_NAME":"superPower","VUE_APP_PLATFORM":"mp-weixin","BASE_URL":"/"}).VUE_APP_DEBUG){
            var mpInstance = vm.$scope;
            console.log('[' + (+new Date) + '][' + (mpInstance.is || mpInstance.route) + '][' + vm._uid +
                ']:nextVueTick');
        }
        return nextTick(cb, vm)
    }else{
        if(Object({"NODE_ENV":"development","VUE_APP_DARK_MODE":"false","VUE_APP_NAME":"superPower","VUE_APP_PLATFORM":"mp-weixin","BASE_URL":"/"}).VUE_APP_DEBUG){
            var mpInstance$1 = vm.$scope;
            console.log('[' + (+new Date) + '][' + (mpInstance$1.is || mpInstance$1.route) + '][' + vm._uid +
                ']:nextMPTick');
        }
    }
    var _resolve;
    if (!vm.__next_tick_callbacks) {
        vm.__next_tick_callbacks = [];
    }
    vm.__next_tick_callbacks.push(function () {
        if (cb) {
            try {
                cb.call(vm);
            } catch (e) {
                handleError(e, vm, 'nextTick');
            }
        } else if (_resolve) {
            _resolve(vm);
        }
    });
    // $flow-disable-line
    if (!cb && typeof Promise !== 'undefined') {
        return new Promise(function (resolve) {
            _resolve = resolve;
        })
    }
}

/*  */

function clearInstance(key, value) {
  // 简易去除 Vue 和小程序组件实例
  if (value) {
    if (value._isVue || value.__v_isMPComponent) {
      return {}
    }
  }
  return value
}

function cloneWithData(vm) {
  // 确保当前 vm 所有数据被同步
  var ret = Object.create(null);
  var dataKeys = [].concat(
    Object.keys(vm._data || {}),
    Object.keys(vm._computedWatchers || {}));

  dataKeys.reduce(function(ret, key) {
    ret[key] = vm[key];
    return ret
  }, ret);

  // vue-composition-api
  var compositionApiState = vm.__composition_api_state__ || vm.__secret_vfa_state__;
  var rawBindings = compositionApiState && compositionApiState.rawBindings;
  if (rawBindings) {
    Object.keys(rawBindings).forEach(function (key) {
      ret[key] = vm[key];
    });
  }

  //TODO 需要把无用数据处理掉，比如 list=>l0 则 list 需要移除，否则多传输一份数据
  Object.assign(ret, vm.$mp.data || {});
  if (
    Array.isArray(vm.$options.behaviors) &&
    vm.$options.behaviors.indexOf('uni://form-field') !== -1
  ) { //form-field
    ret['name'] = vm.name;
    ret['value'] = vm.value;
  }

  return JSON.parse(JSON.stringify(ret, clearInstance))
}

var patch = function(oldVnode, vnode) {
  var this$1 = this;

  if (vnode === null) { //destroy
    return
  }
  if (this.mpType === 'page' || this.mpType === 'component') {
    var mpInstance = this.$scope;
    var data = Object.create(null);
    try {
      data = cloneWithData(this);
    } catch (err) {
      console.error(err);
    }
    data.__webviewId__ = mpInstance.data.__webviewId__;
    var mpData = Object.create(null);
    Object.keys(data).forEach(function (key) { //仅同步 data 中有的数据
      mpData[key] = mpInstance.data[key];
    });
    var diffData = this.$shouldDiffData === false ? data : diff(data, mpData);
    if (Object.keys(diffData).length) {
      if (Object({"NODE_ENV":"development","VUE_APP_DARK_MODE":"false","VUE_APP_NAME":"superPower","VUE_APP_PLATFORM":"mp-weixin","BASE_URL":"/"}).VUE_APP_DEBUG) {
        console.log('[' + (+new Date) + '][' + (mpInstance.is || mpInstance.route) + '][' + this._uid +
          ']差量更新',
          JSON.stringify(diffData));
      }
      this.__next_tick_pending = true;
      mpInstance.setData(diffData, function () {
        this$1.__next_tick_pending = false;
        flushCallbacks$1(this$1);
      });
    } else {
      flushCallbacks$1(this);
    }
  }
};

/*  */

function createEmptyRender() {

}

function mountComponent$1(
  vm,
  el,
  hydrating
) {
  if (!vm.mpType) {//main.js 中的 new Vue
    return vm
  }
  if (vm.mpType === 'app') {
    vm.$options.render = createEmptyRender;
  }
  if (!vm.$options.render) {
    vm.$options.render = createEmptyRender;
    if (true) {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  }
  
  !vm._$fallback && callHook(vm, 'beforeMount');

  var updateComponent = function () {
    vm._update(vm._render(), hydrating);
  };

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before: function before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate');
      }
    }
  }, true /* isRenderWatcher */);
  hydrating = false;
  return vm
}

/*  */

function renderClass (
  staticClass,
  dynamicClass
) {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyClass (value) {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}

function stringifyArray (value) {
  var res = '';
  var stringified;
  for (var i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) { res += ' '; }
      res += stringified;
    }
  }
  return res
}

function stringifyObject (value) {
  var res = '';
  for (var key in value) {
    if (value[key]) {
      if (res) { res += ' '; }
      res += key;
    }
  }
  return res
}

/*  */

var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter);
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return res
});

// normalize possible array / string values into Object
function normalizeStyleBinding (bindingStyle) {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/*  */

var MP_METHODS = ['createSelectorQuery', 'createIntersectionObserver', 'selectAllComponents', 'selectComponent'];

function getTarget(obj, path) {
  var parts = path.split('.');
  var key = parts[0];
  if (key.indexOf('__$n') === 0) { //number index
    key = parseInt(key.replace('__$n', ''));
  }
  if (parts.length === 1) {
    return obj[key]
  }
  return getTarget(obj[key], parts.slice(1).join('.'))
}

function internalMixin(Vue) {

  Vue.config.errorHandler = function(err, vm, info) {
    Vue.util.warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    console.error(err);
    /* eslint-disable no-undef */
    var app = typeof getApp === 'function' && getApp();
    if (app && app.onError) {
      app.onError(err);
    }
  };

  var oldEmit = Vue.prototype.$emit;

  Vue.prototype.$emit = function(event) {
    if (this.$scope && event) {
      var triggerEvent = this.$scope['_triggerEvent'] || this.$scope['triggerEvent'];
      if (triggerEvent) {
        try {
          triggerEvent.call(this.$scope, event, {
            __args__: toArray(arguments, 1)
          });
        } catch (error) {

        }
      }
    }
    return oldEmit.apply(this, arguments)
  };

  Vue.prototype.$nextTick = function(fn) {
    return nextTick$1(this, fn)
  };

  MP_METHODS.forEach(function (method) {
    Vue.prototype[method] = function(args) {
      if (this.$scope && this.$scope[method]) {
        return this.$scope[method](args)
      }
      // mp-alipay
      if (typeof my === 'undefined') {
        return
      }
      if (method === 'createSelectorQuery') {
        /* eslint-disable no-undef */
        return my.createSelectorQuery(args)
      } else if (method === 'createIntersectionObserver') {
        /* eslint-disable no-undef */
        return my.createIntersectionObserver(args)
      }
      // TODO mp-alipay 暂不支持 selectAllComponents,selectComponent
    };
  });

  Vue.prototype.__init_provide = initProvide;

  Vue.prototype.__init_injections = initInjections;

  Vue.prototype.__call_hook = function(hook, args) {
    var vm = this;
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget();
    var handlers = vm.$options[hook];
    var info = hook + " hook";
    var ret;
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) {
        ret = invokeWithErrorHandling(handlers[i], vm, args ? [args] : null, vm, info);
      }
    }
    if (vm._hasHookEvent) {
      vm.$emit('hook:' + hook, args);
    }
    popTarget();
    return ret
  };

  Vue.prototype.__set_model = function(target, key, value, modifiers) {
    if (Array.isArray(modifiers)) {
      if (modifiers.indexOf('trim') !== -1) {
        value = value.trim();
      }
      if (modifiers.indexOf('number') !== -1) {
        value = this._n(value);
      }
    }
    if (!target) {
      target = this;
    }
    // 解决动态属性添加
    Vue.set(target, key, value);
  };

  Vue.prototype.__set_sync = function(target, key, value) {
    if (!target) {
      target = this;
    }
    // 解决动态属性添加
    Vue.set(target, key, value);
  };

  Vue.prototype.__get_orig = function(item) {
    if (isPlainObject(item)) {
      return item['$orig'] || item
    }
    return item
  };

  Vue.prototype.__get_value = function(dataPath, target) {
    return getTarget(target || this, dataPath)
  };


  Vue.prototype.__get_class = function(dynamicClass, staticClass) {
    return renderClass(staticClass, dynamicClass)
  };

  Vue.prototype.__get_style = function(dynamicStyle, staticStyle) {
    if (!dynamicStyle && !staticStyle) {
      return ''
    }
    var dynamicStyleObj = normalizeStyleBinding(dynamicStyle);
    var styleObj = staticStyle ? extend(staticStyle, dynamicStyleObj) : dynamicStyleObj;
    return Object.keys(styleObj).map(function (name) { return ((hyphenate(name)) + ":" + (styleObj[name])); }).join(';')
  };

  Vue.prototype.__map = function(val, iteratee) {
    //TODO 暂不考虑 string
    var ret, i, l, keys, key;
    if (Array.isArray(val)) {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = iteratee(val[i], i);
      }
      return ret
    } else if (isObject(val)) {
      keys = Object.keys(val);
      ret = Object.create(null);
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        ret[key] = iteratee(val[key], key, i);
      }
      return ret
    } else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0, l = val; i < l; i++) {
        // 第一个参数暂时仍和小程序一致
        ret[i] = iteratee(i, i);
      }
      return ret
    }
    return []
  };

}

/*  */

var LIFECYCLE_HOOKS$1 = [
    //App
    'onLaunch',
    'onShow',
    'onHide',
    'onUniNViewMessage',
    'onPageNotFound',
    'onThemeChange',
    'onError',
    'onUnhandledRejection',
    //Page
    'onInit',
    'onLoad',
    // 'onShow',
    'onReady',
    // 'onHide',
    'onUnload',
    'onPullDownRefresh',
    'onReachBottom',
    'onTabItemTap',
    'onAddToFavorites',
    'onShareTimeline',
    'onShareAppMessage',
    'onResize',
    'onPageScroll',
    'onNavigationBarButtonTap',
    'onBackPress',
    'onNavigationBarSearchInputChanged',
    'onNavigationBarSearchInputConfirmed',
    'onNavigationBarSearchInputClicked',
    'onUploadDouyinVideo',
    'onNFCReadMessage',
    //Component
    // 'onReady', // 兼容旧版本，应该移除该事件
    'onPageShow',
    'onPageHide',
    'onPageResize'
];
function lifecycleMixin$1(Vue) {

    //fixed vue-class-component
    var oldExtend = Vue.extend;
    Vue.extend = function(extendOptions) {
        extendOptions = extendOptions || {};

        var methods = extendOptions.methods;
        if (methods) {
            Object.keys(methods).forEach(function (methodName) {
                if (LIFECYCLE_HOOKS$1.indexOf(methodName)!==-1) {
                    extendOptions[methodName] = methods[methodName];
                    delete methods[methodName];
                }
            });
        }

        return oldExtend.call(this, extendOptions)
    };

    var strategies = Vue.config.optionMergeStrategies;
    var mergeHook = strategies.created;
    LIFECYCLE_HOOKS$1.forEach(function (hook) {
        strategies[hook] = mergeHook;
    });

    Vue.prototype.__lifecycle_hooks__ = LIFECYCLE_HOOKS$1;
}

/*  */

// install platform patch function
Vue.prototype.__patch__ = patch;

// public mount method
Vue.prototype.$mount = function(
    el ,
    hydrating 
) {
    return mountComponent$1(this, el, hydrating)
};

lifecycleMixin$1(Vue);
internalMixin(Vue);

/*  */

/* harmony default export */ __webpack_exports__["default"] = (Vue);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../../webpack/buildin/global.js */ 3)))

/***/ }),
/* 26 */
/*!**************************************************!*\
  !*** /Users/liran/Desktop/superPower/pages.json ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {



/***/ }),
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */
/*!******************************************************!*\
  !*** /Users/liran/Desktop/superPower/unit/middle.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _vue = _interopRequireDefault(__webpack_require__(/*! vue */ 25));
//中间件 全组件通信
var _default = new _vue.default();
exports.default = _default;

/***/ }),
/* 31 */,
/* 32 */,
/* 33 */
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js ***!
  \**********************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return normalizeComponent; });
/* globals __VUE_SSR_CONTEXT__ */

// IMPORTANT: Do NOT use ES2015 features in this file (except for modules).
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.

function normalizeComponent (
  scriptExports,
  render,
  staticRenderFns,
  functionalTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier, /* server only */
  shadowMode, /* vue-cli only */
  components, // fixed by xxxxxx auto components
  renderjs // fixed by xxxxxx renderjs
) {
  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // fixed by xxxxxx auto components
  if (components) {
    if (!options.components) {
      options.components = {}
    }
    var hasOwn = Object.prototype.hasOwnProperty
    for (var name in components) {
      if (hasOwn.call(components, name) && !hasOwn.call(options.components, name)) {
        options.components[name] = components[name]
      }
    }
  }
  // fixed by xxxxxx renderjs
  if (renderjs) {
    if(typeof renderjs.beforeCreate === 'function'){
			renderjs.beforeCreate = [renderjs.beforeCreate]
		}
    (renderjs.beforeCreate || (renderjs.beforeCreate = [])).unshift(function() {
      this[renderjs.__module] = this
    });
    (options.mixins || (options.mixins = [])).push(renderjs)
  }

  // render functions
  if (render) {
    options.render = render
    options.staticRenderFns = staticRenderFns
    options._compiled = true
  }

  // functional template
  if (functionalTemplate) {
    options.functional = true
  }

  // scopedId
  if (scopeId) {
    options._scopeId = 'data-v-' + scopeId
  }

  var hook
  if (moduleIdentifier) { // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = shadowMode
      ? function () { injectStyles.call(this, this.$root.$options.shadowRoot) }
      : injectStyles
  }

  if (hook) {
    if (options.functional) {
      // for template-only hot-reload because in that case the render fn doesn't
      // go through the normalizer
      options._injectStyles = hook
      // register for functioal component in vue file
      var originalRender = options.render
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return originalRender(h, context)
      }
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    }
  }

  return {
    exports: scriptExports,
    options: options
  }
}


/***/ }),
/* 34 */
/*!*****************************************************!*\
  !*** /Users/liran/Desktop/superPower/lang/index.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _vue = _interopRequireDefault(__webpack_require__(/*! vue */ 25));
var _vueI18n = _interopRequireDefault(__webpack_require__(/*! vue-i18n */ 35));
var _zh = _interopRequireDefault(__webpack_require__(/*! ./zh */ 36));
var _en = _interopRequireDefault(__webpack_require__(/*! ./en */ 37));
_vue.default.use(_vueI18n.default);

// 获取存储的语言设置
var getLanguage = function getLanguage() {
  var lang = uni.getStorageSync('language');
  if (lang) {
    return lang;
  }
  // 获取系统语言
  var systemInfo = uni.getSystemInfoSync();
  var language = systemInfo.language;
  if (language.includes('zh')) {
    return 'zh';
  }
  return 'en';
};
var i18n = new _vueI18n.default({
  locale: getLanguage(),
  fallbackLocale: 'zh',
  messages: {
    zh: _zh.default,
    en: _en.default
  }
});
var _default = i18n;
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 35 */
/*!****************************************************!*\
  !*** ./node_modules/vue-i18n/dist/vue-i18n.esm.js ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/*!
 * vue-i18n v8.28.2 
 * (c) 2022 kazuya kawaguchi
 * Released under the MIT License.
 */
/*  */

/**
 * constants
 */

var numberFormatKeys = [
  'compactDisplay',
  'currency',
  'currencyDisplay',
  'currencySign',
  'localeMatcher',
  'notation',
  'numberingSystem',
  'signDisplay',
  'style',
  'unit',
  'unitDisplay',
  'useGrouping',
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits'
];

var dateTimeFormatKeys = [
  'dateStyle',
  'timeStyle',
  'calendar',
  'localeMatcher',
  "hour12",
  "hourCycle",
  "timeZone",
  "formatMatcher",
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName' ];

/**
 * utilities
 */

function warn (msg, err) {
  if (typeof console !== 'undefined') {
    console.warn('[vue-i18n] ' + msg);
    /* istanbul ignore if */
    if (err) {
      console.warn(err.stack);
    }
  }
}

function error (msg, err) {
  if (typeof console !== 'undefined') {
    console.error('[vue-i18n] ' + msg);
    /* istanbul ignore if */
    if (err) {
      console.error(err.stack);
    }
  }
}

var isArray = Array.isArray;

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

function isBoolean (val) {
  return typeof val === 'boolean'
}

function isString (val) {
  return typeof val === 'string'
}

var toString = Object.prototype.toString;
var OBJECT_STRING = '[object Object]';
function isPlainObject (obj) {
  return toString.call(obj) === OBJECT_STRING
}

function isNull (val) {
  return val === null || val === undefined
}

function isFunction (val) {
  return typeof val === 'function'
}

function parseArgs () {
  var args = [], len = arguments.length;
  while ( len-- ) args[ len ] = arguments[ len ];

  var locale = null;
  var params = null;
  if (args.length === 1) {
    if (isObject(args[0]) || isArray(args[0])) {
      params = args[0];
    } else if (typeof args[0] === 'string') {
      locale = args[0];
    }
  } else if (args.length === 2) {
    if (typeof args[0] === 'string') {
      locale = args[0];
    }
    /* istanbul ignore if */
    if (isObject(args[1]) || isArray(args[1])) {
      params = args[1];
    }
  }

  return { locale: locale, params: params }
}

function looseClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function remove (arr, item) {
  if (arr.delete(item)) {
    return arr
  }
}

function arrayFrom (arr) {
  var ret = [];
  arr.forEach(function (a) { return ret.push(a); });
  return ret
}

function includes (arr, item) {
  return !!~arr.indexOf(item)
}

var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

function merge (target) {
  var arguments$1 = arguments;

  var output = Object(target);
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments$1[i];
    if (source !== undefined && source !== null) {
      var key = (void 0);
      for (key in source) {
        if (hasOwn(source, key)) {
          if (isObject(source[key])) {
            output[key] = merge(output[key], source[key]);
          } else {
            output[key] = source[key];
          }
        }
      }
    }
  }
  return output
}

function looseEqual (a, b) {
  if (a === b) { return true }
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      var isArrayA = isArray(a);
      var isArrayB = isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (!isArrayA && !isArrayB) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(function (key) {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

/**
 * Sanitizes html special characters from input strings. For mitigating risk of XSS attacks.
 * @param rawText The raw input from the user that should be escaped.
 */
function escapeHtml(rawText) {
  return rawText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Escapes html tags and special symbols from all provided params which were returned from parseArgs().params.
 * This method performs an in-place operation on the params object.
 *
 * @param {any} params Parameters as provided from `parseArgs().params`.
 *                     May be either an array of strings or a string->any map.
 *
 * @returns The manipulated `params` object.
 */
function escapeParams(params) {
  if(params != null) {
    Object.keys(params).forEach(function (key) {
      if(typeof(params[key]) == 'string') {
        params[key] = escapeHtml(params[key]);
      }
    });
  }
  return params
}

/*  */

function extend (Vue) {
  if (!Vue.prototype.hasOwnProperty('$i18n')) {
    // $FlowFixMe
    Object.defineProperty(Vue.prototype, '$i18n', {
      get: function get () { return this._i18n }
    });
  }

  Vue.prototype.$t = function (key) {
    var values = [], len = arguments.length - 1;
    while ( len-- > 0 ) values[ len ] = arguments[ len + 1 ];

    var i18n = this.$i18n;
    return i18n._t.apply(i18n, [ key, i18n.locale, i18n._getMessages(), this ].concat( values ))
  };

  Vue.prototype.$tc = function (key, choice) {
    var values = [], len = arguments.length - 2;
    while ( len-- > 0 ) values[ len ] = arguments[ len + 2 ];

    var i18n = this.$i18n;
    return i18n._tc.apply(i18n, [ key, i18n.locale, i18n._getMessages(), this, choice ].concat( values ))
  };

  Vue.prototype.$te = function (key, locale) {
    var i18n = this.$i18n;
    return i18n._te(key, i18n.locale, i18n._getMessages(), locale)
  };

  Vue.prototype.$d = function (value) {
    var ref;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    return (ref = this.$i18n).d.apply(ref, [ value ].concat( args ))
  };

  Vue.prototype.$n = function (value) {
    var ref;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    return (ref = this.$i18n).n.apply(ref, [ value ].concat( args ))
  };
}

/*  */

/**
 * Mixin
 * 
 * If `bridge` mode, empty mixin is returned,
 * else regulary mixin implementation is returned.
 */
function defineMixin (bridge) {
  if ( bridge === void 0 ) bridge = false;

  function mounted () {
    if (this !== this.$root && this.$options.__INTLIFY_META__ && this.$el) {
      this.$el.setAttribute('data-intlify', this.$options.__INTLIFY_META__);
    }
  }

  return bridge
    ? { mounted: mounted } // delegate `vue-i18n-bridge` mixin implementation
    : { // regulary 
    beforeCreate: function beforeCreate () {
      var options = this.$options;
      options.i18n = options.i18n || ((options.__i18nBridge || options.__i18n) ? {} : null);

      if (options.i18n) {
        if (options.i18n instanceof VueI18n) {
          // init locale messages via custom blocks
          if ((options.__i18nBridge || options.__i18n)) {
            try {
              var localeMessages = options.i18n && options.i18n.messages ? options.i18n.messages : {};
              var _i18n = options.__i18nBridge || options.__i18n;
              _i18n.forEach(function (resource) {
                localeMessages = merge(localeMessages, JSON.parse(resource));
              });
              Object.keys(localeMessages).forEach(function (locale) {
                options.i18n.mergeLocaleMessage(locale, localeMessages[locale]);
              });
            } catch (e) {
              if (true) {
                error("Cannot parse locale messages via custom blocks.", e);
              }
            }
          }
          this._i18n = options.i18n;
          this._i18nWatcher = this._i18n.watchI18nData();
        } else if (isPlainObject(options.i18n)) {
          var rootI18n = this.$root && this.$root.$i18n && this.$root.$i18n instanceof VueI18n
            ? this.$root.$i18n
            : null;
          // component local i18n
          if (rootI18n) {
            options.i18n.root = this.$root;
            options.i18n.formatter = rootI18n.formatter;
            options.i18n.fallbackLocale = rootI18n.fallbackLocale;
            options.i18n.formatFallbackMessages = rootI18n.formatFallbackMessages;
            options.i18n.silentTranslationWarn = rootI18n.silentTranslationWarn;
            options.i18n.silentFallbackWarn = rootI18n.silentFallbackWarn;
            options.i18n.pluralizationRules = rootI18n.pluralizationRules;
            options.i18n.preserveDirectiveContent = rootI18n.preserveDirectiveContent;
          }

          // init locale messages via custom blocks
          if ((options.__i18nBridge || options.__i18n)) {
            try {
              var localeMessages$1 = options.i18n && options.i18n.messages ? options.i18n.messages : {};
              var _i18n$1 = options.__i18nBridge || options.__i18n;
              _i18n$1.forEach(function (resource) {
                localeMessages$1 = merge(localeMessages$1, JSON.parse(resource));
              });
              options.i18n.messages = localeMessages$1;
            } catch (e) {
              if (true) {
                warn("Cannot parse locale messages via custom blocks.", e);
              }
            }
          }

          var ref = options.i18n;
          var sharedMessages = ref.sharedMessages;
          if (sharedMessages && isPlainObject(sharedMessages)) {
            options.i18n.messages = merge(options.i18n.messages, sharedMessages);
          }

          this._i18n = new VueI18n(options.i18n);
          this._i18nWatcher = this._i18n.watchI18nData();

          if (options.i18n.sync === undefined || !!options.i18n.sync) {
            this._localeWatcher = this.$i18n.watchLocale();
          }

          if (rootI18n) {
            rootI18n.onComponentInstanceCreated(this._i18n);
          }
        } else {
          if (true) {
            warn("Cannot be interpreted 'i18n' option.");
          }
        }
      } else if (this.$root && this.$root.$i18n && this.$root.$i18n instanceof VueI18n) {
        // root i18n
        this._i18n = this.$root.$i18n;
      } else if (options.parent && options.parent.$i18n && options.parent.$i18n instanceof VueI18n) {
        // parent i18n
        this._i18n = options.parent.$i18n;
      }
    },

    beforeMount: function beforeMount () {
      var options = this.$options;
      options.i18n = options.i18n || ((options.__i18nBridge || options.__i18n) ? {} : null);

      if (options.i18n) {
        if (options.i18n instanceof VueI18n) {
          // init locale messages via custom blocks
          this._i18n.subscribeDataChanging(this);
          this._subscribing = true;
        } else if (isPlainObject(options.i18n)) {
          this._i18n.subscribeDataChanging(this);
          this._subscribing = true;
        } else {
          if (true) {
            warn("Cannot be interpreted 'i18n' option.");
          }
        }
      } else if (this.$root && this.$root.$i18n && this.$root.$i18n instanceof VueI18n) {
        this._i18n.subscribeDataChanging(this);
        this._subscribing = true;
      } else if (options.parent && options.parent.$i18n && options.parent.$i18n instanceof VueI18n) {
        this._i18n.subscribeDataChanging(this);
        this._subscribing = true;
      }
    },

    mounted: mounted,

    beforeDestroy: function beforeDestroy () {
      if (!this._i18n) { return }

      var self = this;
      this.$nextTick(function () {
        if (self._subscribing) {
          self._i18n.unsubscribeDataChanging(self);
          delete self._subscribing;
        }

        if (self._i18nWatcher) {
          self._i18nWatcher();
          self._i18n.destroyVM();
          delete self._i18nWatcher;
        }

        if (self._localeWatcher) {
          self._localeWatcher();
          delete self._localeWatcher;
        }
      });
    }
  }
}

/*  */

var interpolationComponent = {
  name: 'i18n',
  functional: true,
  props: {
    tag: {
      type: [String, Boolean, Object],
      default: 'span'
    },
    path: {
      type: String,
      required: true
    },
    locale: {
      type: String
    },
    places: {
      type: [Array, Object]
    }
  },
  render: function render (h, ref) {
    var data = ref.data;
    var parent = ref.parent;
    var props = ref.props;
    var slots = ref.slots;

    var $i18n = parent.$i18n;
    if (!$i18n) {
      if (true) {
        warn('Cannot find VueI18n instance!');
      }
      return
    }

    var path = props.path;
    var locale = props.locale;
    var places = props.places;
    var params = slots();
    var children = $i18n.i(
      path,
      locale,
      onlyHasDefaultPlace(params) || places
        ? useLegacyPlaces(params.default, places)
        : params
    );

    var tag = (!!props.tag && props.tag !== true) || props.tag === false ? props.tag : 'span';
    return tag ? h(tag, data, children) : children
  }
};

function onlyHasDefaultPlace (params) {
  var prop;
  for (prop in params) {
    if (prop !== 'default') { return false }
  }
  return Boolean(prop)
}

function useLegacyPlaces (children, places) {
  var params = places ? createParamsFromPlaces(places) : {};

  if (!children) { return params }

  // Filter empty text nodes
  children = children.filter(function (child) {
    return child.tag || child.text.trim() !== ''
  });

  var everyPlace = children.every(vnodeHasPlaceAttribute);
  if ( true && everyPlace) {
    warn('`place` attribute is deprecated in next major version. Please switch to Vue slots.');
  }

  return children.reduce(
    everyPlace ? assignChildPlace : assignChildIndex,
    params
  )
}

function createParamsFromPlaces (places) {
  if (true) {
    warn('`places` prop is deprecated in next major version. Please switch to Vue slots.');
  }

  return Array.isArray(places)
    ? places.reduce(assignChildIndex, {})
    : Object.assign({}, places)
}

function assignChildPlace (params, child) {
  if (child.data && child.data.attrs && child.data.attrs.place) {
    params[child.data.attrs.place] = child;
  }
  return params
}

function assignChildIndex (params, child, index) {
  params[index] = child;
  return params
}

function vnodeHasPlaceAttribute (vnode) {
  return Boolean(vnode.data && vnode.data.attrs && vnode.data.attrs.place)
}

/*  */

var numberComponent = {
  name: 'i18n-n',
  functional: true,
  props: {
    tag: {
      type: [String, Boolean, Object],
      default: 'span'
    },
    value: {
      type: Number,
      required: true
    },
    format: {
      type: [String, Object]
    },
    locale: {
      type: String
    }
  },
  render: function render (h, ref) {
    var props = ref.props;
    var parent = ref.parent;
    var data = ref.data;

    var i18n = parent.$i18n;

    if (!i18n) {
      if (true) {
        warn('Cannot find VueI18n instance!');
      }
      return null
    }

    var key = null;
    var options = null;

    if (isString(props.format)) {
      key = props.format;
    } else if (isObject(props.format)) {
      if (props.format.key) {
        key = props.format.key;
      }

      // Filter out number format options only
      options = Object.keys(props.format).reduce(function (acc, prop) {
        var obj;

        if (includes(numberFormatKeys, prop)) {
          return Object.assign({}, acc, ( obj = {}, obj[prop] = props.format[prop], obj ))
        }
        return acc
      }, null);
    }

    var locale = props.locale || i18n.locale;
    var parts = i18n._ntp(props.value, locale, key, options);

    var values = parts.map(function (part, index) {
      var obj;

      var slot = data.scopedSlots && data.scopedSlots[part.type];
      return slot ? slot(( obj = {}, obj[part.type] = part.value, obj.index = index, obj.parts = parts, obj )) : part.value
    });

    var tag = (!!props.tag && props.tag !== true) || props.tag === false ? props.tag : 'span';
    return tag
      ? h(tag, {
        attrs: data.attrs,
        'class': data['class'],
        staticClass: data.staticClass
      }, values)
      : values
  }
};

/*  */

function bind (el, binding, vnode) {
  if (!assert(el, vnode)) { return }

  t(el, binding, vnode);
}

function update (el, binding, vnode, oldVNode) {
  if (!assert(el, vnode)) { return }

  var i18n = vnode.context.$i18n;
  if (localeEqual(el, vnode) &&
    (looseEqual(binding.value, binding.oldValue) &&
     looseEqual(el._localeMessage, i18n.getLocaleMessage(i18n.locale)))) { return }

  t(el, binding, vnode);
}

function unbind (el, binding, vnode, oldVNode) {
  var vm = vnode.context;
  if (!vm) {
    warn('Vue instance does not exists in VNode context');
    return
  }

  var i18n = vnode.context.$i18n || {};
  if (!binding.modifiers.preserve && !i18n.preserveDirectiveContent) {
    el.textContent = '';
  }
  el._vt = undefined;
  delete el['_vt'];
  el._locale = undefined;
  delete el['_locale'];
  el._localeMessage = undefined;
  delete el['_localeMessage'];
}

function assert (el, vnode) {
  var vm = vnode.context;
  if (!vm) {
    warn('Vue instance does not exists in VNode context');
    return false
  }

  if (!vm.$i18n) {
    warn('VueI18n instance does not exists in Vue instance');
    return false
  }

  return true
}

function localeEqual (el, vnode) {
  var vm = vnode.context;
  return el._locale === vm.$i18n.locale
}

function t (el, binding, vnode) {
  var ref$1, ref$2;

  var value = binding.value;

  var ref = parseValue(value);
  var path = ref.path;
  var locale = ref.locale;
  var args = ref.args;
  var choice = ref.choice;
  if (!path && !locale && !args) {
    warn('value type not supported');
    return
  }

  if (!path) {
    warn('`path` is required in v-t directive');
    return
  }

  var vm = vnode.context;
  if (choice != null) {
    el._vt = el.textContent = (ref$1 = vm.$i18n).tc.apply(ref$1, [ path, choice ].concat( makeParams(locale, args) ));
  } else {
    el._vt = el.textContent = (ref$2 = vm.$i18n).t.apply(ref$2, [ path ].concat( makeParams(locale, args) ));
  }
  el._locale = vm.$i18n.locale;
  el._localeMessage = vm.$i18n.getLocaleMessage(vm.$i18n.locale);
}

function parseValue (value) {
  var path;
  var locale;
  var args;
  var choice;

  if (isString(value)) {
    path = value;
  } else if (isPlainObject(value)) {
    path = value.path;
    locale = value.locale;
    args = value.args;
    choice = value.choice;
  }

  return { path: path, locale: locale, args: args, choice: choice }
}

function makeParams (locale, args) {
  var params = [];

  locale && params.push(locale);
  if (args && (Array.isArray(args) || isPlainObject(args))) {
    params.push(args);
  }

  return params
}

var Vue;

function install (_Vue, options) {
  if ( options === void 0 ) options = { bridge: false };

  /* istanbul ignore if */
  if ( true && install.installed && _Vue === Vue) {
    warn('already installed.');
    return
  }
  install.installed = true;

  Vue = _Vue;

  var version = (Vue.version && Number(Vue.version.split('.')[0])) || -1;
  /* istanbul ignore if */
  if ( true && version < 2) {
    warn(("vue-i18n (" + (install.version) + ") need to use Vue 2.0 or later (Vue: " + (Vue.version) + ")."));
    return
  }

  extend(Vue);
  Vue.mixin(defineMixin(options.bridge));
  Vue.directive('t', { bind: bind, update: update, unbind: unbind });
  Vue.component(interpolationComponent.name, interpolationComponent);
  Vue.component(numberComponent.name, numberComponent);

  // use simple mergeStrategies to prevent i18n instance lose '__proto__'
  var strats = Vue.config.optionMergeStrategies;
  strats.i18n = function (parentVal, childVal) {
    return childVal === undefined
      ? parentVal
      : childVal
  };
}

/*  */

var BaseFormatter = function BaseFormatter () {
  this._caches = Object.create(null);
};

BaseFormatter.prototype.interpolate = function interpolate (message, values) {
  if (!values) {
    return [message]
  }
  var tokens = this._caches[message];
  if (!tokens) {
    tokens = parse(message);
    this._caches[message] = tokens;
  }
  return compile(tokens, values)
};



var RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
var RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;

function parse (format) {
  var tokens = [];
  var position = 0;

  var text = '';
  while (position < format.length) {
    var char = format[position++];
    if (char === '{') {
      if (text) {
        tokens.push({ type: 'text', value: text });
      }

      text = '';
      var sub = '';
      char = format[position++];
      while (char !== undefined && char !== '}') {
        sub += char;
        char = format[position++];
      }
      var isClosed = char === '}';

      var type = RE_TOKEN_LIST_VALUE.test(sub)
        ? 'list'
        : isClosed && RE_TOKEN_NAMED_VALUE.test(sub)
          ? 'named'
          : 'unknown';
      tokens.push({ value: sub, type: type });
    } else if (char === '%') {
      // when found rails i18n syntax, skip text capture
      if (format[(position)] !== '{') {
        text += char;
      }
    } else {
      text += char;
    }
  }

  text && tokens.push({ type: 'text', value: text });

  return tokens
}

function compile (tokens, values) {
  var compiled = [];
  var index = 0;

  var mode = Array.isArray(values)
    ? 'list'
    : isObject(values)
      ? 'named'
      : 'unknown';
  if (mode === 'unknown') { return compiled }

  while (index < tokens.length) {
    var token = tokens[index];
    switch (token.type) {
      case 'text':
        compiled.push(token.value);
        break
      case 'list':
        compiled.push(values[parseInt(token.value, 10)]);
        break
      case 'named':
        if (mode === 'named') {
          compiled.push((values)[token.value]);
        } else {
          if (true) {
            warn(("Type of token '" + (token.type) + "' and format of value '" + mode + "' don't match!"));
          }
        }
        break
      case 'unknown':
        if (true) {
          warn("Detect 'unknown' type of token!");
        }
        break
    }
    index++;
  }

  return compiled
}

/*  */

/**
 *  Path parser
 *  - Inspired:
 *    Vue.js Path parser
 */

// actions
var APPEND = 0;
var PUSH = 1;
var INC_SUB_PATH_DEPTH = 2;
var PUSH_SUB_PATH = 3;

// states
var BEFORE_PATH = 0;
var IN_PATH = 1;
var BEFORE_IDENT = 2;
var IN_IDENT = 3;
var IN_SUB_PATH = 4;
var IN_SINGLE_QUOTE = 5;
var IN_DOUBLE_QUOTE = 6;
var AFTER_PATH = 7;
var ERROR = 8;

var pathStateMachine = [];

pathStateMachine[BEFORE_PATH] = {
  'ws': [BEFORE_PATH],
  'ident': [IN_IDENT, APPEND],
  '[': [IN_SUB_PATH],
  'eof': [AFTER_PATH]
};

pathStateMachine[IN_PATH] = {
  'ws': [IN_PATH],
  '.': [BEFORE_IDENT],
  '[': [IN_SUB_PATH],
  'eof': [AFTER_PATH]
};

pathStateMachine[BEFORE_IDENT] = {
  'ws': [BEFORE_IDENT],
  'ident': [IN_IDENT, APPEND],
  '0': [IN_IDENT, APPEND],
  'number': [IN_IDENT, APPEND]
};

pathStateMachine[IN_IDENT] = {
  'ident': [IN_IDENT, APPEND],
  '0': [IN_IDENT, APPEND],
  'number': [IN_IDENT, APPEND],
  'ws': [IN_PATH, PUSH],
  '.': [BEFORE_IDENT, PUSH],
  '[': [IN_SUB_PATH, PUSH],
  'eof': [AFTER_PATH, PUSH]
};

pathStateMachine[IN_SUB_PATH] = {
  "'": [IN_SINGLE_QUOTE, APPEND],
  '"': [IN_DOUBLE_QUOTE, APPEND],
  '[': [IN_SUB_PATH, INC_SUB_PATH_DEPTH],
  ']': [IN_PATH, PUSH_SUB_PATH],
  'eof': ERROR,
  'else': [IN_SUB_PATH, APPEND]
};

pathStateMachine[IN_SINGLE_QUOTE] = {
  "'": [IN_SUB_PATH, APPEND],
  'eof': ERROR,
  'else': [IN_SINGLE_QUOTE, APPEND]
};

pathStateMachine[IN_DOUBLE_QUOTE] = {
  '"': [IN_SUB_PATH, APPEND],
  'eof': ERROR,
  'else': [IN_DOUBLE_QUOTE, APPEND]
};

/**
 * Check if an expression is a literal value.
 */

var literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
function isLiteral (exp) {
  return literalValueRE.test(exp)
}

/**
 * Strip quotes from a string
 */

function stripQuotes (str) {
  var a = str.charCodeAt(0);
  var b = str.charCodeAt(str.length - 1);
  return a === b && (a === 0x22 || a === 0x27)
    ? str.slice(1, -1)
    : str
}

/**
 * Determine the type of a character in a keypath.
 */

function getPathCharType (ch) {
  if (ch === undefined || ch === null) { return 'eof' }

  var code = ch.charCodeAt(0);

  switch (code) {
    case 0x5B: // [
    case 0x5D: // ]
    case 0x2E: // .
    case 0x22: // "
    case 0x27: // '
      return ch

    case 0x5F: // _
    case 0x24: // $
    case 0x2D: // -
      return 'ident'

    case 0x09: // Tab
    case 0x0A: // Newline
    case 0x0D: // Return
    case 0xA0:  // No-break space
    case 0xFEFF:  // Byte Order Mark
    case 0x2028:  // Line Separator
    case 0x2029:  // Paragraph Separator
      return 'ws'
  }

  return 'ident'
}

/**
 * Format a subPath, return its plain form if it is
 * a literal string or number. Otherwise prepend the
 * dynamic indicator (*).
 */

function formatSubPath (path) {
  var trimmed = path.trim();
  // invalid leading 0
  if (path.charAt(0) === '0' && isNaN(path)) { return false }

  return isLiteral(trimmed) ? stripQuotes(trimmed) : '*' + trimmed
}

/**
 * Parse a string path into an array of segments
 */

function parse$1 (path) {
  var keys = [];
  var index = -1;
  var mode = BEFORE_PATH;
  var subPathDepth = 0;
  var c;
  var key;
  var newChar;
  var type;
  var transition;
  var action;
  var typeMap;
  var actions = [];

  actions[PUSH] = function () {
    if (key !== undefined) {
      keys.push(key);
      key = undefined;
    }
  };

  actions[APPEND] = function () {
    if (key === undefined) {
      key = newChar;
    } else {
      key += newChar;
    }
  };

  actions[INC_SUB_PATH_DEPTH] = function () {
    actions[APPEND]();
    subPathDepth++;
  };

  actions[PUSH_SUB_PATH] = function () {
    if (subPathDepth > 0) {
      subPathDepth--;
      mode = IN_SUB_PATH;
      actions[APPEND]();
    } else {
      subPathDepth = 0;
      if (key === undefined) { return false }
      key = formatSubPath(key);
      if (key === false) {
        return false
      } else {
        actions[PUSH]();
      }
    }
  };

  function maybeUnescapeQuote () {
    var nextChar = path[index + 1];
    if ((mode === IN_SINGLE_QUOTE && nextChar === "'") ||
      (mode === IN_DOUBLE_QUOTE && nextChar === '"')) {
      index++;
      newChar = '\\' + nextChar;
      actions[APPEND]();
      return true
    }
  }

  while (mode !== null) {
    index++;
    c = path[index];

    if (c === '\\' && maybeUnescapeQuote()) {
      continue
    }

    type = getPathCharType(c);
    typeMap = pathStateMachine[mode];
    transition = typeMap[type] || typeMap['else'] || ERROR;

    if (transition === ERROR) {
      return // parse error
    }

    mode = transition[0];
    action = actions[transition[1]];
    if (action) {
      newChar = transition[2];
      newChar = newChar === undefined
        ? c
        : newChar;
      if (action() === false) {
        return
      }
    }

    if (mode === AFTER_PATH) {
      return keys
    }
  }
}





var I18nPath = function I18nPath () {
  this._cache = Object.create(null);
};

/**
 * External parse that check for a cache hit first
 */
I18nPath.prototype.parsePath = function parsePath (path) {
  var hit = this._cache[path];
  if (!hit) {
    hit = parse$1(path);
    if (hit) {
      this._cache[path] = hit;
    }
  }
  return hit || []
};

/**
 * Get path value from path string
 */
I18nPath.prototype.getPathValue = function getPathValue (obj, path) {
  if (!isObject(obj)) { return null }

  var paths = this.parsePath(path);
  if (paths.length === 0) {
    return null
  } else {
    var length = paths.length;
    var last = obj;
    var i = 0;
    while (i < length) {
      var value = last[paths[i]];
      if (value === undefined || value === null) {
        return null
      }
      last = value;
      i++;
    }

    return last
  }
};

/*  */



var htmlTagMatcher = /<\/?[\w\s="/.':;#-\/]+>/;
var linkKeyMatcher = /(?:@(?:\.[a-zA-Z]+)?:(?:[\w\-_|./]+|\([\w\-_:|./]+\)))/g;
var linkKeyPrefixMatcher = /^@(?:\.([a-zA-Z]+))?:/;
var bracketsMatcher = /[()]/g;
var defaultModifiers = {
  'upper': function (str) { return str.toLocaleUpperCase(); },
  'lower': function (str) { return str.toLocaleLowerCase(); },
  'capitalize': function (str) { return ("" + (str.charAt(0).toLocaleUpperCase()) + (str.substr(1))); }
};

var defaultFormatter = new BaseFormatter();

var VueI18n = function VueI18n (options) {
  var this$1 = this;
  if ( options === void 0 ) options = {};

  // Auto install if it is not done yet and `window` has `Vue`.
  // To allow users to avoid auto-installation in some cases,
  // this code should be placed here. See #290
  /* istanbul ignore if */
  if (!Vue && typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
  }

  var locale = options.locale || 'en-US';
  var fallbackLocale = options.fallbackLocale === false
    ? false
    : options.fallbackLocale || 'en-US';
  var messages = options.messages || {};
  var dateTimeFormats = options.dateTimeFormats || options.datetimeFormats || {};
  var numberFormats = options.numberFormats || {};

  this._vm = null;
  this._formatter = options.formatter || defaultFormatter;
  this._modifiers = options.modifiers || {};
  this._missing = options.missing || null;
  this._root = options.root || null;
  this._sync = options.sync === undefined ? true : !!options.sync;
  this._fallbackRoot = options.fallbackRoot === undefined
    ? true
    : !!options.fallbackRoot;
  this._fallbackRootWithEmptyString = options.fallbackRootWithEmptyString === undefined
    ? true
    : !!options.fallbackRootWithEmptyString;
  this._formatFallbackMessages = options.formatFallbackMessages === undefined
    ? false
    : !!options.formatFallbackMessages;
  this._silentTranslationWarn = options.silentTranslationWarn === undefined
    ? false
    : options.silentTranslationWarn;
  this._silentFallbackWarn = options.silentFallbackWarn === undefined
    ? false
    : !!options.silentFallbackWarn;
  this._dateTimeFormatters = {};
  this._numberFormatters = {};
  this._path = new I18nPath();
  this._dataListeners = new Set();
  this._componentInstanceCreatedListener = options.componentInstanceCreatedListener || null;
  this._preserveDirectiveContent = options.preserveDirectiveContent === undefined
    ? false
    : !!options.preserveDirectiveContent;
  this.pluralizationRules = options.pluralizationRules || {};
  this._warnHtmlInMessage = options.warnHtmlInMessage || 'off';
  this._postTranslation = options.postTranslation || null;
  this._escapeParameterHtml = options.escapeParameterHtml || false;

  if ('__VUE_I18N_BRIDGE__' in options) {
    this.__VUE_I18N_BRIDGE__ = options.__VUE_I18N_BRIDGE__;
  }

  /**
   * @param choice {number} a choice index given by the input to $tc: `$tc('path.to.rule', choiceIndex)`
   * @param choicesLength {number} an overall amount of available choices
   * @returns a final choice index
  */
  this.getChoiceIndex = function (choice, choicesLength) {
    var thisPrototype = Object.getPrototypeOf(this$1);
    if (thisPrototype && thisPrototype.getChoiceIndex) {
      var prototypeGetChoiceIndex = (thisPrototype.getChoiceIndex);
      return (prototypeGetChoiceIndex).call(this$1, choice, choicesLength)
    }

    // Default (old) getChoiceIndex implementation - english-compatible
    var defaultImpl = function (_choice, _choicesLength) {
      _choice = Math.abs(_choice);

      if (_choicesLength === 2) {
        return _choice
          ? _choice > 1
            ? 1
            : 0
          : 1
      }

      return _choice ? Math.min(_choice, 2) : 0
    };

    if (this$1.locale in this$1.pluralizationRules) {
      return this$1.pluralizationRules[this$1.locale].apply(this$1, [choice, choicesLength])
    } else {
      return defaultImpl(choice, choicesLength)
    }
  };


  this._exist = function (message, key) {
    if (!message || !key) { return false }
    if (!isNull(this$1._path.getPathValue(message, key))) { return true }
    // fallback for flat key
    if (message[key]) { return true }
    return false
  };

  if (this._warnHtmlInMessage === 'warn' || this._warnHtmlInMessage === 'error') {
    Object.keys(messages).forEach(function (locale) {
      this$1._checkLocaleMessage(locale, this$1._warnHtmlInMessage, messages[locale]);
    });
  }

  this._initVM({
    locale: locale,
    fallbackLocale: fallbackLocale,
    messages: messages,
    dateTimeFormats: dateTimeFormats,
    numberFormats: numberFormats
  });
};

var prototypeAccessors = { vm: { configurable: true },messages: { configurable: true },dateTimeFormats: { configurable: true },numberFormats: { configurable: true },availableLocales: { configurable: true },locale: { configurable: true },fallbackLocale: { configurable: true },formatFallbackMessages: { configurable: true },missing: { configurable: true },formatter: { configurable: true },silentTranslationWarn: { configurable: true },silentFallbackWarn: { configurable: true },preserveDirectiveContent: { configurable: true },warnHtmlInMessage: { configurable: true },postTranslation: { configurable: true },sync: { configurable: true } };

VueI18n.prototype._checkLocaleMessage = function _checkLocaleMessage (locale, level, message) {
  var paths = [];

  var fn = function (level, locale, message, paths) {
    if (isPlainObject(message)) {
      Object.keys(message).forEach(function (key) {
        var val = message[key];
        if (isPlainObject(val)) {
          paths.push(key);
          paths.push('.');
          fn(level, locale, val, paths);
          paths.pop();
          paths.pop();
        } else {
          paths.push(key);
          fn(level, locale, val, paths);
          paths.pop();
        }
      });
    } else if (isArray(message)) {
      message.forEach(function (item, index) {
        if (isPlainObject(item)) {
          paths.push(("[" + index + "]"));
          paths.push('.');
          fn(level, locale, item, paths);
          paths.pop();
          paths.pop();
        } else {
          paths.push(("[" + index + "]"));
          fn(level, locale, item, paths);
          paths.pop();
        }
      });
    } else if (isString(message)) {
      var ret = htmlTagMatcher.test(message);
      if (ret) {
        var msg = "Detected HTML in message '" + message + "' of keypath '" + (paths.join('')) + "' at '" + locale + "'. Consider component interpolation with '<i18n>' to avoid XSS. See https://bit.ly/2ZqJzkp";
        if (level === 'warn') {
          warn(msg);
        } else if (level === 'error') {
          error(msg);
        }
      }
    }
  };

  fn(level, locale, message, paths);
};

VueI18n.prototype._initVM = function _initVM (data) {
  var silent = Vue.config.silent;
  Vue.config.silent = true;
  this._vm = new Vue({ data: data, __VUE18N__INSTANCE__: true });
  Vue.config.silent = silent;
};

VueI18n.prototype.destroyVM = function destroyVM () {
  this._vm.$destroy();
};

VueI18n.prototype.subscribeDataChanging = function subscribeDataChanging (vm) {
  this._dataListeners.add(vm);
};

VueI18n.prototype.unsubscribeDataChanging = function unsubscribeDataChanging (vm) {
  remove(this._dataListeners, vm);
};

VueI18n.prototype.watchI18nData = function watchI18nData () {
    var this$1 = this;
  return this._vm.$watch('$data', function () {
    var listeners = arrayFrom(this$1._dataListeners);
    var i = listeners.length;
    while(i--) {
      Vue.nextTick(function () {
        listeners[i] && listeners[i].$forceUpdate();
      });
    }
  }, { deep: true })
};

VueI18n.prototype.watchLocale = function watchLocale (composer) {
  if (!composer) {
    /* istanbul ignore if */
    if (!this._sync || !this._root) { return null }
    var target = this._vm;
    return this._root.$i18n.vm.$watch('locale', function (val) {
      target.$set(target, 'locale', val);
      target.$forceUpdate();
    }, { immediate: true })
  } else {
    // deal with vue-i18n-bridge
    if (!this.__VUE_I18N_BRIDGE__) { return null }
    var self = this;
    var target$1 = this._vm;
    return this.vm.$watch('locale', function (val) {
      target$1.$set(target$1, 'locale', val);
      if (self.__VUE_I18N_BRIDGE__ && composer) {
        composer.locale.value = val;
      }
      target$1.$forceUpdate();
    }, { immediate: true })
  }
};

VueI18n.prototype.onComponentInstanceCreated = function onComponentInstanceCreated (newI18n) {
  if (this._componentInstanceCreatedListener) {
    this._componentInstanceCreatedListener(newI18n, this);
  }
};

prototypeAccessors.vm.get = function () { return this._vm };

prototypeAccessors.messages.get = function () { return looseClone(this._getMessages()) };
prototypeAccessors.dateTimeFormats.get = function () { return looseClone(this._getDateTimeFormats()) };
prototypeAccessors.numberFormats.get = function () { return looseClone(this._getNumberFormats()) };
prototypeAccessors.availableLocales.get = function () { return Object.keys(this.messages).sort() };

prototypeAccessors.locale.get = function () { return this._vm.locale };
prototypeAccessors.locale.set = function (locale) {
  this._vm.$set(this._vm, 'locale', locale);
};

prototypeAccessors.fallbackLocale.get = function () { return this._vm.fallbackLocale };
prototypeAccessors.fallbackLocale.set = function (locale) {
  this._localeChainCache = {};
  this._vm.$set(this._vm, 'fallbackLocale', locale);
};

prototypeAccessors.formatFallbackMessages.get = function () { return this._formatFallbackMessages };
prototypeAccessors.formatFallbackMessages.set = function (fallback) { this._formatFallbackMessages = fallback; };

prototypeAccessors.missing.get = function () { return this._missing };
prototypeAccessors.missing.set = function (handler) { this._missing = handler; };

prototypeAccessors.formatter.get = function () { return this._formatter };
prototypeAccessors.formatter.set = function (formatter) { this._formatter = formatter; };

prototypeAccessors.silentTranslationWarn.get = function () { return this._silentTranslationWarn };
prototypeAccessors.silentTranslationWarn.set = function (silent) { this._silentTranslationWarn = silent; };

prototypeAccessors.silentFallbackWarn.get = function () { return this._silentFallbackWarn };
prototypeAccessors.silentFallbackWarn.set = function (silent) { this._silentFallbackWarn = silent; };

prototypeAccessors.preserveDirectiveContent.get = function () { return this._preserveDirectiveContent };
prototypeAccessors.preserveDirectiveContent.set = function (preserve) { this._preserveDirectiveContent = preserve; };

prototypeAccessors.warnHtmlInMessage.get = function () { return this._warnHtmlInMessage };
prototypeAccessors.warnHtmlInMessage.set = function (level) {
    var this$1 = this;

  var orgLevel = this._warnHtmlInMessage;
  this._warnHtmlInMessage = level;
  if (orgLevel !== level && (level === 'warn' || level === 'error')) {
    var messages = this._getMessages();
    Object.keys(messages).forEach(function (locale) {
      this$1._checkLocaleMessage(locale, this$1._warnHtmlInMessage, messages[locale]);
    });
  }
};

prototypeAccessors.postTranslation.get = function () { return this._postTranslation };
prototypeAccessors.postTranslation.set = function (handler) { this._postTranslation = handler; };

prototypeAccessors.sync.get = function () { return this._sync };
prototypeAccessors.sync.set = function (val) { this._sync = val; };

VueI18n.prototype._getMessages = function _getMessages () { return this._vm.messages };
VueI18n.prototype._getDateTimeFormats = function _getDateTimeFormats () { return this._vm.dateTimeFormats };
VueI18n.prototype._getNumberFormats = function _getNumberFormats () { return this._vm.numberFormats };

VueI18n.prototype._warnDefault = function _warnDefault (locale, key, result, vm, values, interpolateMode) {
  if (!isNull(result)) { return result }
  if (this._missing) {
    var missingRet = this._missing.apply(null, [locale, key, vm, values]);
    if (isString(missingRet)) {
      return missingRet
    }
  } else {
    if ( true && !this._isSilentTranslationWarn(key)) {
      warn(
        "Cannot translate the value of keypath '" + key + "'. " +
        'Use the value of keypath as default.'
      );
    }
  }

  if (this._formatFallbackMessages) {
    var parsedArgs = parseArgs.apply(void 0, values);
    return this._render(key, interpolateMode, parsedArgs.params, key)
  } else {
    return key
  }
};

VueI18n.prototype._isFallbackRoot = function _isFallbackRoot (val) {
  return (this._fallbackRootWithEmptyString? !val : isNull(val)) && !isNull(this._root) && this._fallbackRoot
};

VueI18n.prototype._isSilentFallbackWarn = function _isSilentFallbackWarn (key) {
  return this._silentFallbackWarn instanceof RegExp
    ? this._silentFallbackWarn.test(key)
    : this._silentFallbackWarn
};

VueI18n.prototype._isSilentFallback = function _isSilentFallback (locale, key) {
  return this._isSilentFallbackWarn(key) && (this._isFallbackRoot() || locale !== this.fallbackLocale)
};

VueI18n.prototype._isSilentTranslationWarn = function _isSilentTranslationWarn (key) {
  return this._silentTranslationWarn instanceof RegExp
    ? this._silentTranslationWarn.test(key)
    : this._silentTranslationWarn
};

VueI18n.prototype._interpolate = function _interpolate (
  locale,
  message,
  key,
  host,
  interpolateMode,
  values,
  visitedLinkStack
) {
  if (!message) { return null }

  var pathRet = this._path.getPathValue(message, key);
  if (isArray(pathRet) || isPlainObject(pathRet)) { return pathRet }

  var ret;
  if (isNull(pathRet)) {
    /* istanbul ignore else */
    if (isPlainObject(message)) {
      ret = message[key];
      if (!(isString(ret) || isFunction(ret))) {
        if ( true && !this._isSilentTranslationWarn(key) && !this._isSilentFallback(locale, key)) {
          warn(("Value of key '" + key + "' is not a string or function !"));
        }
        return null
      }
    } else {
      return null
    }
  } else {
    /* istanbul ignore else */
    if (isString(pathRet) || isFunction(pathRet)) {
      ret = pathRet;
    } else {
      if ( true && !this._isSilentTranslationWarn(key) && !this._isSilentFallback(locale, key)) {
        warn(("Value of key '" + key + "' is not a string or function!"));
      }
      return null
    }
  }

  // Check for the existence of links within the translated string
  if (isString(ret) && (ret.indexOf('@:') >= 0 || ret.indexOf('@.') >= 0)) {
    ret = this._link(locale, message, ret, host, 'raw', values, visitedLinkStack);
  }

  return this._render(ret, interpolateMode, values, key)
};

VueI18n.prototype._link = function _link (
  locale,
  message,
  str,
  host,
  interpolateMode,
  values,
  visitedLinkStack
) {
  var ret = str;

  // Match all the links within the local
  // We are going to replace each of
  // them with its translation
  var matches = ret.match(linkKeyMatcher);

  // eslint-disable-next-line no-autofix/prefer-const
  for (var idx in matches) {
    // ie compatible: filter custom array
    // prototype method
    if (!matches.hasOwnProperty(idx)) {
      continue
    }
    var link = matches[idx];
    var linkKeyPrefixMatches = link.match(linkKeyPrefixMatcher);
    var linkPrefix = linkKeyPrefixMatches[0];
      var formatterName = linkKeyPrefixMatches[1];

    // Remove the leading @:, @.case: and the brackets
    var linkPlaceholder = link.replace(linkPrefix, '').replace(bracketsMatcher, '');

    if (includes(visitedLinkStack, linkPlaceholder)) {
      if (true) {
        warn(("Circular reference found. \"" + link + "\" is already visited in the chain of " + (visitedLinkStack.reverse().join(' <- '))));
      }
      return ret
    }
    visitedLinkStack.push(linkPlaceholder);

    // Translate the link
    var translated = this._interpolate(
      locale, message, linkPlaceholder, host,
      interpolateMode === 'raw' ? 'string' : interpolateMode,
      interpolateMode === 'raw' ? undefined : values,
      visitedLinkStack
    );

    if (this._isFallbackRoot(translated)) {
      if ( true && !this._isSilentTranslationWarn(linkPlaceholder)) {
        warn(("Fall back to translate the link placeholder '" + linkPlaceholder + "' with root locale."));
      }
      /* istanbul ignore if */
      if (!this._root) { throw Error('unexpected error') }
      var root = this._root.$i18n;
      translated = root._translate(
        root._getMessages(), root.locale, root.fallbackLocale,
        linkPlaceholder, host, interpolateMode, values
      );
    }
    translated = this._warnDefault(
      locale, linkPlaceholder, translated, host,
      isArray(values) ? values : [values],
      interpolateMode
    );

    if (this._modifiers.hasOwnProperty(formatterName)) {
      translated = this._modifiers[formatterName](translated);
    } else if (defaultModifiers.hasOwnProperty(formatterName)) {
      translated = defaultModifiers[formatterName](translated);
    }

    visitedLinkStack.pop();

    // Replace the link with the translated
    ret = !translated ? ret : ret.replace(link, translated);
  }

  return ret
};

VueI18n.prototype._createMessageContext = function _createMessageContext (values, formatter, path, interpolateMode) {
    var this$1 = this;

  var _list = isArray(values) ? values : [];
  var _named = isObject(values) ? values : {};
  var list = function (index) { return _list[index]; };
  var named = function (key) { return _named[key]; };
  var messages = this._getMessages();
  var locale = this.locale;

  return {
    list: list,
    named: named,
    values: values,
    formatter: formatter,
    path: path,
    messages: messages,
    locale: locale,
    linked: function (linkedKey) { return this$1._interpolate(locale, messages[locale] || {}, linkedKey, null, interpolateMode, undefined, [linkedKey]); }
  }
};

VueI18n.prototype._render = function _render (message, interpolateMode, values, path) {
  if (isFunction(message)) {
    return message(
      this._createMessageContext(values, this._formatter || defaultFormatter, path, interpolateMode)
    )
  }

  var ret = this._formatter.interpolate(message, values, path);

  // If the custom formatter refuses to work - apply the default one
  if (!ret) {
    ret = defaultFormatter.interpolate(message, values, path);
  }

  // if interpolateMode is **not** 'string' ('row'),
  // return the compiled data (e.g. ['foo', VNode, 'bar']) with formatter
  return interpolateMode === 'string' && !isString(ret) ? ret.join('') : ret
};

VueI18n.prototype._appendItemToChain = function _appendItemToChain (chain, item, blocks) {
  var follow = false;
  if (!includes(chain, item)) {
    follow = true;
    if (item) {
      follow = item[item.length - 1] !== '!';
      item = item.replace(/!/g, '');
      chain.push(item);
      if (blocks && blocks[item]) {
        follow = blocks[item];
      }
    }
  }
  return follow
};

VueI18n.prototype._appendLocaleToChain = function _appendLocaleToChain (chain, locale, blocks) {
  var follow;
  var tokens = locale.split('-');
  do {
    var item = tokens.join('-');
    follow = this._appendItemToChain(chain, item, blocks);
    tokens.splice(-1, 1);
  } while (tokens.length && (follow === true))
  return follow
};

VueI18n.prototype._appendBlockToChain = function _appendBlockToChain (chain, block, blocks) {
  var follow = true;
  for (var i = 0; (i < block.length) && (isBoolean(follow)); i++) {
    var locale = block[i];
    if (isString(locale)) {
      follow = this._appendLocaleToChain(chain, locale, blocks);
    }
  }
  return follow
};

VueI18n.prototype._getLocaleChain = function _getLocaleChain (start, fallbackLocale) {
  if (start === '') { return [] }

  if (!this._localeChainCache) {
    this._localeChainCache = {};
  }

  var chain = this._localeChainCache[start];
  if (!chain) {
    if (!fallbackLocale) {
      fallbackLocale = this.fallbackLocale;
    }
    chain = [];

    // first block defined by start
    var block = [start];

    // while any intervening block found
    while (isArray(block)) {
      block = this._appendBlockToChain(
        chain,
        block,
        fallbackLocale
      );
    }

    // last block defined by default
    var defaults;
    if (isArray(fallbackLocale)) {
      defaults = fallbackLocale;
    } else if (isObject(fallbackLocale)) {
      /* $FlowFixMe */
      if (fallbackLocale['default']) {
        defaults = fallbackLocale['default'];
      } else {
        defaults = null;
      }
    } else {
      defaults = fallbackLocale;
    }

    // convert defaults to array
    if (isString(defaults)) {
      block = [defaults];
    } else {
      block = defaults;
    }
    if (block) {
      this._appendBlockToChain(
        chain,
        block,
        null
      );
    }
    this._localeChainCache[start] = chain;
  }
  return chain
};

VueI18n.prototype._translate = function _translate (
  messages,
  locale,
  fallback,
  key,
  host,
  interpolateMode,
  args
) {
  var chain = this._getLocaleChain(locale, fallback);
  var res;
  for (var i = 0; i < chain.length; i++) {
    var step = chain[i];
    res =
      this._interpolate(step, messages[step], key, host, interpolateMode, args, [key]);
    if (!isNull(res)) {
      if (step !== locale && "development" !== 'production' && !this._isSilentTranslationWarn(key) && !this._isSilentFallbackWarn(key)) {
        warn(("Fall back to translate the keypath '" + key + "' with '" + step + "' locale."));
      }
      return res
    }
  }
  return null
};

VueI18n.prototype._t = function _t (key, _locale, messages, host) {
    var ref;

    var values = [], len = arguments.length - 4;
    while ( len-- > 0 ) values[ len ] = arguments[ len + 4 ];
  if (!key) { return '' }

  var parsedArgs = parseArgs.apply(void 0, values);
  if(this._escapeParameterHtml) {
    parsedArgs.params = escapeParams(parsedArgs.params);
  }

  var locale = parsedArgs.locale || _locale;

  var ret = this._translate(
    messages, locale, this.fallbackLocale, key,
    host, 'string', parsedArgs.params
  );
  if (this._isFallbackRoot(ret)) {
    if ( true && !this._isSilentTranslationWarn(key) && !this._isSilentFallbackWarn(key)) {
      warn(("Fall back to translate the keypath '" + key + "' with root locale."));
    }
    /* istanbul ignore if */
    if (!this._root) { throw Error('unexpected error') }
    return (ref = this._root).$t.apply(ref, [ key ].concat( values ))
  } else {
    ret = this._warnDefault(locale, key, ret, host, values, 'string');
    if (this._postTranslation && ret !== null && ret !== undefined) {
      ret = this._postTranslation(ret, key);
    }
    return ret
  }
};

VueI18n.prototype.t = function t (key) {
    var ref;

    var values = [], len = arguments.length - 1;
    while ( len-- > 0 ) values[ len ] = arguments[ len + 1 ];
  return (ref = this)._t.apply(ref, [ key, this.locale, this._getMessages(), null ].concat( values ))
};

VueI18n.prototype._i = function _i (key, locale, messages, host, values) {
  var ret =
    this._translate(messages, locale, this.fallbackLocale, key, host, 'raw', values);
  if (this._isFallbackRoot(ret)) {
    if ( true && !this._isSilentTranslationWarn(key)) {
      warn(("Fall back to interpolate the keypath '" + key + "' with root locale."));
    }
    if (!this._root) { throw Error('unexpected error') }
    return this._root.$i18n.i(key, locale, values)
  } else {
    return this._warnDefault(locale, key, ret, host, [values], 'raw')
  }
};

VueI18n.prototype.i = function i (key, locale, values) {
  /* istanbul ignore if */
  if (!key) { return '' }

  if (!isString(locale)) {
    locale = this.locale;
  }

  return this._i(key, locale, this._getMessages(), null, values)
};

VueI18n.prototype._tc = function _tc (
  key,
  _locale,
  messages,
  host,
  choice
) {
    var ref;

    var values = [], len = arguments.length - 5;
    while ( len-- > 0 ) values[ len ] = arguments[ len + 5 ];
  if (!key) { return '' }
  if (choice === undefined) {
    choice = 1;
  }

  var predefined = { 'count': choice, 'n': choice };
  var parsedArgs = parseArgs.apply(void 0, values);
  parsedArgs.params = Object.assign(predefined, parsedArgs.params);
  values = parsedArgs.locale === null ? [parsedArgs.params] : [parsedArgs.locale, parsedArgs.params];
  return this.fetchChoice((ref = this)._t.apply(ref, [ key, _locale, messages, host ].concat( values )), choice)
};

VueI18n.prototype.fetchChoice = function fetchChoice (message, choice) {
  /* istanbul ignore if */
  if (!message || !isString(message)) { return null }
  var choices = message.split('|');

  choice = this.getChoiceIndex(choice, choices.length);
  if (!choices[choice]) { return message }
  return choices[choice].trim()
};

VueI18n.prototype.tc = function tc (key, choice) {
    var ref;

    var values = [], len = arguments.length - 2;
    while ( len-- > 0 ) values[ len ] = arguments[ len + 2 ];
  return (ref = this)._tc.apply(ref, [ key, this.locale, this._getMessages(), null, choice ].concat( values ))
};

VueI18n.prototype._te = function _te (key, locale, messages) {
    var args = [], len = arguments.length - 3;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 3 ];

  var _locale = parseArgs.apply(void 0, args).locale || locale;
  return this._exist(messages[_locale], key)
};

VueI18n.prototype.te = function te (key, locale) {
  return this._te(key, this.locale, this._getMessages(), locale)
};

VueI18n.prototype.getLocaleMessage = function getLocaleMessage (locale) {
  return looseClone(this._vm.messages[locale] || {})
};

VueI18n.prototype.setLocaleMessage = function setLocaleMessage (locale, message) {
  if (this._warnHtmlInMessage === 'warn' || this._warnHtmlInMessage === 'error') {
    this._checkLocaleMessage(locale, this._warnHtmlInMessage, message);
  }
  this._vm.$set(this._vm.messages, locale, message);
};

VueI18n.prototype.mergeLocaleMessage = function mergeLocaleMessage (locale, message) {
  if (this._warnHtmlInMessage === 'warn' || this._warnHtmlInMessage === 'error') {
    this._checkLocaleMessage(locale, this._warnHtmlInMessage, message);
  }
  this._vm.$set(this._vm.messages, locale, merge(
    typeof this._vm.messages[locale] !== 'undefined' && Object.keys(this._vm.messages[locale]).length
      ? Object.assign({}, this._vm.messages[locale])
      : {},
    message
  ));
};

VueI18n.prototype.getDateTimeFormat = function getDateTimeFormat (locale) {
  return looseClone(this._vm.dateTimeFormats[locale] || {})
};

VueI18n.prototype.setDateTimeFormat = function setDateTimeFormat (locale, format) {
  this._vm.$set(this._vm.dateTimeFormats, locale, format);
  this._clearDateTimeFormat(locale, format);
};

VueI18n.prototype.mergeDateTimeFormat = function mergeDateTimeFormat (locale, format) {
  this._vm.$set(this._vm.dateTimeFormats, locale, merge(this._vm.dateTimeFormats[locale] || {}, format));
  this._clearDateTimeFormat(locale, format);
};

VueI18n.prototype._clearDateTimeFormat = function _clearDateTimeFormat (locale, format) {
  // eslint-disable-next-line no-autofix/prefer-const
  for (var key in format) {
    var id = locale + "__" + key;

    if (!this._dateTimeFormatters.hasOwnProperty(id)) {
      continue
    }

    delete this._dateTimeFormatters[id];
  }
};

VueI18n.prototype._localizeDateTime = function _localizeDateTime (
  value,
  locale,
  fallback,
  dateTimeFormats,
  key,
  options
) {
  var _locale = locale;
  var formats = dateTimeFormats[_locale];

  var chain = this._getLocaleChain(locale, fallback);
  for (var i = 0; i < chain.length; i++) {
    var current = _locale;
    var step = chain[i];
    formats = dateTimeFormats[step];
    _locale = step;
    // fallback locale
    if (isNull(formats) || isNull(formats[key])) {
      if (step !== locale && "development" !== 'production' && !this._isSilentTranslationWarn(key) && !this._isSilentFallbackWarn(key)) {
        warn(("Fall back to '" + step + "' datetime formats from '" + current + "' datetime formats."));
      }
    } else {
      break
    }
  }

  if (isNull(formats) || isNull(formats[key])) {
    return null
  } else {
    var format = formats[key];

    var formatter;
    if (options) {
      formatter = new Intl.DateTimeFormat(_locale, Object.assign({}, format, options));
    } else {
      var id = _locale + "__" + key;
      formatter = this._dateTimeFormatters[id];
      if (!formatter) {
        formatter = this._dateTimeFormatters[id] = new Intl.DateTimeFormat(_locale, format);
      }
    }

    return formatter.format(value)
  }
};

VueI18n.prototype._d = function _d (value, locale, key, options) {
  /* istanbul ignore if */
  if ( true && !VueI18n.availabilities.dateTimeFormat) {
    warn('Cannot format a Date value due to not supported Intl.DateTimeFormat.');
    return ''
  }

  if (!key) {
    var dtf = !options ? new Intl.DateTimeFormat(locale) : new Intl.DateTimeFormat(locale, options);
    return dtf.format(value)
  }

  var ret =
    this._localizeDateTime(value, locale, this.fallbackLocale, this._getDateTimeFormats(), key, options);
  if (this._isFallbackRoot(ret)) {
    if ( true && !this._isSilentTranslationWarn(key) && !this._isSilentFallbackWarn(key)) {
      warn(("Fall back to datetime localization of root: key '" + key + "'."));
    }
    /* istanbul ignore if */
    if (!this._root) { throw Error('unexpected error') }
    return this._root.$i18n.d(value, key, locale)
  } else {
    return ret || ''
  }
};

VueI18n.prototype.d = function d (value) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  var locale = this.locale;
  var key = null;
  var options = null;

  if (args.length === 1) {
    if (isString(args[0])) {
      key = args[0];
    } else if (isObject(args[0])) {
      if (args[0].locale) {
        locale = args[0].locale;
      }
      if (args[0].key) {
        key = args[0].key;
      }
    }

    options = Object.keys(args[0]).reduce(function (acc, key) {
        var obj;

      if (includes(dateTimeFormatKeys, key)) {
        return Object.assign({}, acc, ( obj = {}, obj[key] = args[0][key], obj ))
      }
      return acc
    }, null);

  } else if (args.length === 2) {
    if (isString(args[0])) {
      key = args[0];
    }
    if (isString(args[1])) {
      locale = args[1];
    }
  }

  return this._d(value, locale, key, options)
};

VueI18n.prototype.getNumberFormat = function getNumberFormat (locale) {
  return looseClone(this._vm.numberFormats[locale] || {})
};

VueI18n.prototype.setNumberFormat = function setNumberFormat (locale, format) {
  this._vm.$set(this._vm.numberFormats, locale, format);
  this._clearNumberFormat(locale, format);
};

VueI18n.prototype.mergeNumberFormat = function mergeNumberFormat (locale, format) {
  this._vm.$set(this._vm.numberFormats, locale, merge(this._vm.numberFormats[locale] || {}, format));
  this._clearNumberFormat(locale, format);
};

VueI18n.prototype._clearNumberFormat = function _clearNumberFormat (locale, format) {
  // eslint-disable-next-line no-autofix/prefer-const
  for (var key in format) {
    var id = locale + "__" + key;

    if (!this._numberFormatters.hasOwnProperty(id)) {
      continue
    }

    delete this._numberFormatters[id];
  }
};

VueI18n.prototype._getNumberFormatter = function _getNumberFormatter (
  value,
  locale,
  fallback,
  numberFormats,
  key,
  options
) {
  var _locale = locale;
  var formats = numberFormats[_locale];

  var chain = this._getLocaleChain(locale, fallback);
  for (var i = 0; i < chain.length; i++) {
    var current = _locale;
    var step = chain[i];
    formats = numberFormats[step];
    _locale = step;
    // fallback locale
    if (isNull(formats) || isNull(formats[key])) {
      if (step !== locale && "development" !== 'production' && !this._isSilentTranslationWarn(key) && !this._isSilentFallbackWarn(key)) {
        warn(("Fall back to '" + step + "' number formats from '" + current + "' number formats."));
      }
    } else {
      break
    }
  }

  if (isNull(formats) || isNull(formats[key])) {
    return null
  } else {
    var format = formats[key];

    var formatter;
    if (options) {
      // If options specified - create one time number formatter
      formatter = new Intl.NumberFormat(_locale, Object.assign({}, format, options));
    } else {
      var id = _locale + "__" + key;
      formatter = this._numberFormatters[id];
      if (!formatter) {
        formatter = this._numberFormatters[id] = new Intl.NumberFormat(_locale, format);
      }
    }
    return formatter
  }
};

VueI18n.prototype._n = function _n (value, locale, key, options) {
  /* istanbul ignore if */
  if (!VueI18n.availabilities.numberFormat) {
    if (true) {
      warn('Cannot format a Number value due to not supported Intl.NumberFormat.');
    }
    return ''
  }

  if (!key) {
    var nf = !options ? new Intl.NumberFormat(locale) : new Intl.NumberFormat(locale, options);
    return nf.format(value)
  }

  var formatter = this._getNumberFormatter(value, locale, this.fallbackLocale, this._getNumberFormats(), key, options);
  var ret = formatter && formatter.format(value);
  if (this._isFallbackRoot(ret)) {
    if ( true && !this._isSilentTranslationWarn(key) && !this._isSilentFallbackWarn(key)) {
      warn(("Fall back to number localization of root: key '" + key + "'."));
    }
    /* istanbul ignore if */
    if (!this._root) { throw Error('unexpected error') }
    return this._root.$i18n.n(value, Object.assign({}, { key: key, locale: locale }, options))
  } else {
    return ret || ''
  }
};

VueI18n.prototype.n = function n (value) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  var locale = this.locale;
  var key = null;
  var options = null;

  if (args.length === 1) {
    if (isString(args[0])) {
      key = args[0];
    } else if (isObject(args[0])) {
      if (args[0].locale) {
        locale = args[0].locale;
      }
      if (args[0].key) {
        key = args[0].key;
      }

      // Filter out number format options only
      options = Object.keys(args[0]).reduce(function (acc, key) {
          var obj;

        if (includes(numberFormatKeys, key)) {
          return Object.assign({}, acc, ( obj = {}, obj[key] = args[0][key], obj ))
        }
        return acc
      }, null);
    }
  } else if (args.length === 2) {
    if (isString(args[0])) {
      key = args[0];
    }
    if (isString(args[1])) {
      locale = args[1];
    }
  }

  return this._n(value, locale, key, options)
};

VueI18n.prototype._ntp = function _ntp (value, locale, key, options) {
  /* istanbul ignore if */
  if (!VueI18n.availabilities.numberFormat) {
    if (true) {
      warn('Cannot format to parts a Number value due to not supported Intl.NumberFormat.');
    }
    return []
  }

  if (!key) {
    var nf = !options ? new Intl.NumberFormat(locale) : new Intl.NumberFormat(locale, options);
    return nf.formatToParts(value)
  }

  var formatter = this._getNumberFormatter(value, locale, this.fallbackLocale, this._getNumberFormats(), key, options);
  var ret = formatter && formatter.formatToParts(value);
  if (this._isFallbackRoot(ret)) {
    if ( true && !this._isSilentTranslationWarn(key)) {
      warn(("Fall back to format number to parts of root: key '" + key + "' ."));
    }
    /* istanbul ignore if */
    if (!this._root) { throw Error('unexpected error') }
    return this._root.$i18n._ntp(value, locale, key, options)
  } else {
    return ret || []
  }
};

Object.defineProperties( VueI18n.prototype, prototypeAccessors );

var availabilities;
// $FlowFixMe
Object.defineProperty(VueI18n, 'availabilities', {
  get: function get () {
    if (!availabilities) {
      var intlDefined = typeof Intl !== 'undefined';
      availabilities = {
        dateTimeFormat: intlDefined && typeof Intl.DateTimeFormat !== 'undefined',
        numberFormat: intlDefined && typeof Intl.NumberFormat !== 'undefined'
      };
    }

    return availabilities
  }
});

VueI18n.install = install;
VueI18n.version = '8.28.2';

/* harmony default export */ __webpack_exports__["default"] = (VueI18n);


/***/ }),
/* 36 */
/*!**************************************************!*\
  !*** /Users/liran/Desktop/superPower/lang/zh.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ 11));
var _battery;
var _default = {
  //首页
  'bluetooth': {
    searching: '搜索中',
    search: '搜索',
    noBluetoothDeviceConnected: '未链接蓝牙设备',
    warmTips: '温馨提示',
    bluetoothAdapterUnavailablePleaseRestart: '蓝牙适配器不可用，请重新启动',
    pleaseCheckIfPhoneBluetoothIsOn: '请检查手机蓝牙是否打开',
    bluetoothDeviceNotFound: '未搜索到该蓝牙',
    searchingForDevices: '正在搜索设备',
    bluetoothDeviceSearchFailed: '搜索蓝牙设备失败',
    unableToFindBluetoothDevicePleaseRetry: '无法搜索到蓝牙设备，请重试',
    connecting: '连接中',
    connectedSuccessfully: '连接成功',
    connectionTimeoutPleaseRetry: '连接超时，请重试',
    connectionFailed: '连接失败',
    disconnecting: '断开中',
    disconnectionFailed: '断开失败',
    passwordIncorrect: '密码错误'
  },
  //仪表盘页面
  'battery': (_battery = {
    chargingTime: '充电时间',
    dischargingTime: '放电时间',
    activation: '激活',
    remainingCapacity: '剩余电量',
    time: '时间',
    standby: '待机',
    cycles: '循环次数',
    voltage: '电压',
    current: '电流',
    power: '功率',
    ave: '平均电压',
    max: '最高电压',
    min: '最低电压',
    diff: '电压差',
    state: '状态',
    chargingSwitch: '充电开关',
    dischargingSwitch: '放电开关',
    balance: '均衡',
    protection: '保护',
    batteryHealthStatus: '电池健康状态',
    charging: '充电中',
    discharging: '放电中',
    //保护
    singleCellOvervoltageProtection: '单体过压保护',
    singleCellUndervoltageProtection: '单体欠压保护',
    packOvervoltageProtection: '整组过压保护',
    packUndervoltageProtection: '整组欠压保护',
    chargingOvertemperatureProtection: '充电过温保护',
    chargingUndertemperatureProtection: '充电低温保护',
    dischargeOvertemperatureProtection: '放电过温保护',
    dischargeUndertemperatureProtection: '放电低温保护',
    chargingOvercurrentProtection: '充电过流保护',
    dischargeOvercurrentProtection: '放电过流保护',
    shortCircuitProtection: '短路保护',
    //告警状态
    chargingHighTemperatureAlarm: '充电高温告警（电芯）',
    dischargingAndIdleHighTemperatureAlarm: '放电及静置高温告警（电芯）',
    chargingLowTemperatureAlarm: '充电低温告警（电芯）',
    dischargingAndIdleLowTemperatureAlarm: '放电及静置低温告警（电芯）',
    thermalRunawayAlarm: '热失控告警',
    environmentHighTemperatureAlarm: '环境高温告警',
    environmentLowTemperatureAlarm: '环境低温告警',
    dischargeMosHighTemperatureAlarm: '放电MOS高温告警',
    chargingMosHighTemperatureAlarm: '充电MOS高温告警',
    lowBatteryAlarm: '低电量告警',
    singleCellOverVoltageAlarm: '单体过压告警',
    singleCellUnderVoltageAlarm: '单体低压告警',
    totalVoltageOverVoltageAlarm: '总压过压告警',
    totalVoltageUnderVoltageAlarm: '总压低压告警',
    chargingOvercurrentAlarm: '充电过流告警',
    dischargingOvercurrentAlarm: '放电过流告警',
    pressureDifferenceAlarm: '压差告警',
    temperatureDifferenceAlarm: '温差告警',
    insulationAlarm: '绝缘告警',
    //失效状态
    chargingMosFault: '充电MOS故障',
    dischargingMosFault: '放电MOS故障',
    preChargeMosFailure: '预充MOS失效',
    antiReverseMosFailure: '防反MOS失效',
    heatingMosFailure: '加热MOS失效',
    cellSamplingDisconnectionFailure: '电芯采样断线失效',
    cellUltraLowVoltageChargingDisabled: '电芯超低压禁充失效',
    rtcFailure: 'RTC失效',
    fuseBlownStatus: 'FUSE熔断状态',
    voltageAcquisitionFailure: '电压采集失效',
    currentAcquisitionFailure: '电流采集失效',
    cellAbnormalHighTemperature: '电芯异常高温',
    afeCommunicationFailure: 'AFE通讯失效',
    cellNtcAcquisitionFailure: '电芯NTC采集失效',
    environmentNtcAcquisitionFailure: '环境NTC采集失效',
    mosNtcAcquisitionFailure: 'MOS NTC采集失效',
    //保护状态
    singleCellOverVoltagePrimaryProtection: '单体过压一级保护',
    singleCellOverDischargePrimaryProtection: '单体过放一级保护',
    terminalHighTemperatureProtection: '极柱高温保护',
    reserve1: '保留',
    chargingOverCurrentSecondaryProtection: '充电过流二级保护',
    dischargingOverCurrentSecondaryProtection: '放电过流一级保护'
  }, (0, _defineProperty2.default)(_battery, "shortCircuitProtection", '短路保护'), (0, _defineProperty2.default)(_battery, "insulationProtection", '绝缘保护'), (0, _defineProperty2.default)(_battery, "singleCellOverVoltageSecondaryProtection", '单体过压二级保护'), (0, _defineProperty2.default)(_battery, "singleCellOverDischargeSecondaryProtection", '单体过放二级保护'), (0, _defineProperty2.default)(_battery, "chargingOverCurrentPrimaryProtection", '充电过流一级保护'), (0, _defineProperty2.default)(_battery, "dischargingOverCurrentPrimaryProtection", '放电过流二级保护'), (0, _defineProperty2.default)(_battery, "afeHighTemperatureProtection", 'AFE高温保护'), (0, _defineProperty2.default)(_battery, "reserve2", '保留'), (0, _defineProperty2.default)(_battery, "environmentLowTemperatureProtection", '环境低温保护'), (0, _defineProperty2.default)(_battery, "environmentHighTemperatureProtection", '环境高温保护'), (0, _defineProperty2.default)(_battery, "chargingHighTemperatureProtectionCell", '充电高温保护（电芯）'), (0, _defineProperty2.default)(_battery, "dischargingHighTemperatureProtectionCell", '放电高温保护（电芯）'), (0, _defineProperty2.default)(_battery, "chargingLowTemperatureProtectionCell", '充电低温保护（电芯）'), (0, _defineProperty2.default)(_battery, "dischargingLowTemperatureProtectionCell", '放电低温保护（电芯）'), (0, _defineProperty2.default)(_battery, "cellLowTemperatureProtection", '电芯低温保护'), (0, _defineProperty2.default)(_battery, "cellHighTemperatureProtection", '电芯高温保护'), (0, _defineProperty2.default)(_battery, "reserve3", '保留'), (0, _defineProperty2.default)(_battery, "dischargingMosHighTemperatureProtection", '放电MOS高温保护'), (0, _defineProperty2.default)(_battery, "chargingMosHighTemperatureProtection", '充电MOS高温保护'), (0, _defineProperty2.default)(_battery, "fullChargeProtection", '充满保护'), (0, _defineProperty2.default)(_battery, "pressureDifferenceProtection", '压差保护'), (0, _defineProperty2.default)(_battery, "temperatureDifferenceProtection", '温差保护'), (0, _defineProperty2.default)(_battery, "heatingFilmTemperatureProtection", '加热膜温度保护'), (0, _defineProperty2.default)(_battery, "totalVoltageUnderVoltageProtection", '总压欠压保护'), (0, _defineProperty2.default)(_battery, "totalVoltageOverVoltageProtection", '总压过压保护'), _battery),
  //电池
  'voltage': {
    voltage: '总电压',
    temperature: '温度',
    batteryCell: '电芯'
  },
  //关于
  'info-info': {
    online: '在线升级',
    ask: '在线求助',
    email: '邮件导出',
    setting: '高级设置',
    language: '选择语言',
    history: '历史记录'
  },
  'infooption': {
    groupTerminalOvervoltage: '组端过压',
    groupTerminalUndervoltage: '组端欠压',
    mosOvertemperature: 'mos温度过高',
    lowInsulationResistance: '绝缘电阻过低',
    lowSoc: 'soc过低',
    short: '短路',
    baseSetting: '基础设置',
    functionSetting: '功能设置',
    //基础设置
    numberOfCells: '电芯个数',
    nominalCapacity: '标准容量',
    cycleCapacity: '循环容量',
    cycles: '循环次数',
    dateOfProduction: '生产日期',
    //软件配置
    senseResistance: '检流电阻值',
    chargeOcp: '充电过流',
    chargeOcpRelease: '充电过流释放',
    chargeOcpReleaseDelay: '充电过流释放延时',
    dischargeOcp: '放电过流',
    dischargeOcpRelease: '放电过流释放',
    dischargeOcpReleaseDelay: '放电过流释放延时',
    //电压参数
    cellOVP: "单体过压",
    cellOVPRelease: "单体过压释放",
    cellOVPReleaseDelay: "单体过压释放延时",
    cellUVP: "单体欠压",
    cellUVPRelease: "单体欠压释放",
    cellUVPReleaseDelay: "单体欠压释放延时",
    packOVP: "整组过压",
    packOVPRelease: "整组过压释放",
    packOVPReleaseDelay: "整组过压释放延时",
    packUVP: "整组欠压",
    packUVPRelease: "整组欠压释放",
    packUVPReleaseDelay: "整组欠压释放延时",
    //温度设置
    chargingOTP: "充电高温",
    chargingOTPRelease: "充电高温释放",
    chargingOTPReleaseDelay: "充电高温释放延时",
    chargingUTP: "充电低温",
    chargingUTPRelease: "充电低温释放",
    chargingUTPReleaseDelay: "充电低温释放延时",
    dischargeOTP: "放电高温",
    dischargeOTPRelease: "放电高温释放",
    dischargeOTPReleaseDelay: "放电高温释放延时",
    dischargeUTP: "放电低温",
    dischargeUTPRelease: "放电低温释放",
    dischargeUTPReleaseDelay: "放电低温释放延时",
    //开关
    switchFunction: '弱点开关功能',
    loadCheck: '短路负载检测功能',
    balanceEnable: '均衡功能',
    chargeBalance: '充电均衡',
    temp: '温度',
    tempSetting: '温度设置',
    softwareConfiguration: '软件配置',
    voltageonfiguration: '电压配置',
    //第二个板子的-电压参数
    singleCellOverchargeWarningVoltage: '单体过充告警电压',
    singleCellOverchargeProtectionVoltage: '单体过充保护电压',
    singleCellOverchargeWarningDelay: '单体过充告警延时',
    singleCellOverchargeProtectionDelay: '单体过充保护延时',
    regenerationOverchargeProtectionDelay: '回馈过充保护延时',
    normalTemperatureLowTemperatureThreshold: '常温低温阀值温度',
    singleCellOverchargeWarningReleaseVoltageDifference: '单体过充告警解除电压差',
    singleCellOverchargeProtectionReleaseVoltage: '单体过充保护解除电压',
    capacityReleaseH: '容量解除H',
    protocolVersionNumber: '协议版本号',
    overVoltageDischargeReleaseCurrent: '过压放电解除电流',
    underVoltageChargingReleaseCurrent: '欠压充电解除电流',
    singleCellOvervoltageWarningReleaseDelay: '单体过压告警解除延时',
    singleCellOvervoltageProtectionReleaseDelay: '单体过压保护解除延时',
    normalTemperatureSingleCellOverdischargeWarningVoltage: '常温单体过放告警电压',
    normalTemperatureSingleCellOverdischargeProtectionVoltage: '常温单体过放保护电压',
    lowTemperatureSingleCellOverdischargeWarningVoltage: '低温单体过放告警电压',
    lowTemperatureSingleCellOverdischargeProtectionVoltage: '低温单体过放保护电压',
    singleCellOverdischargeWarningDelay: '单体过放告警延时',
    singleCellOverdischargeProtectionDelay: '单体过放保护延时',
    singleCellOverdischargeWarningReleaseVoltage: '单体过放告警解除电压',
    singleCellOverdischargeProtectionReleaseVoltage: '单体过放保护解除电压',
    singleCellOverdischargeWarningReleaseDelay: '单体过放告警解除延时',
    singleCellOverdischargeProtectionReleaseDelay: '单体过放保护解除延时',
    totalVoltageOvervoltageWarningVoltage: '总压过压告警电压',
    totalVoltageOvervoltageProtectionVoltage: '总压过压保护电压',
    totalVoltageOvervoltageProtectionDelay: '总压过压保护延时',
    totalVoltageOvervoltageWarningDelay: '总压过压告警延时',
    totalVoltageOvervoltageWarningReleaseVoltage: '总压过压告警解除电压',
    totalVoltageOvervoltageProtectionReleaseVoltage: '总压过压保护解除电压',
    totalVoltageOvervoltageProtectionReleaseDelay: '总压过压保护解除延时',
    totalVoltageOvervoltageWarningReleaseDelay: '总压过压告警解除延时',
    normalTemperatureTotalVoltageOverdischargeWarningVoltage: '常温总压过放告警电压',
    normalTemperatureTotalVoltageOverdischargeProtectionVoltage: '常温总压过放保护电压',
    lowTemperatureTotalVoltageOverdischargeWarningVoltage: '低温总压过放告警电压',
    lowTemperatureTotalVoltageOverdischargeProtectionVoltage: '低温总压过放保护电压',
    totalVoltageOverdischargeWarningDelay: '总压过放告警延时',
    totalVoltageOverdischargeProtectionDelay: '总压过放保护延时',
    totalVoltageOverdischargeWarningReleaseVoltage: '总压过放告警解除电压',
    totalVoltageOverdischargeProtectionReleaseVoltage: '总压过放保护解除电压',
    totalVoltageOverdischargeWarningReleaseDelay: '总压过放告警解除延时',
    totalVoltageOverdischargeProtectionReleaseDelay: '总压过放保护解除延时',
    chargingOvercurrentWarningCurrent: '充电过流告警电流',
    chargingOvercurrentProtectionSmallCurrent: '充电过流保护小电流',
    chargingOvercurrentProtectionLargeCurrent: '充电过流保护大电流',
    chargingOvercurrentWarningDelay: '充电过流告警延时',
    chargingOvercurrentProtectionLargeCurrentDelay: '充电过流保护大电流延时',
    currentConfiguration: '电流配置',
    monomer: "单体设置"
  },
  'common': {
    Confirm: '确认',
    Cancel: '取消',
    loading: '加载中'
  },
  'tabber': {
    bluetooth: '蓝牙',
    dashboard: '仪表盘',
    cells: '电芯',
    ablout: '关于'
  }
};
exports.default = _default;

/***/ }),
/* 37 */
/*!**************************************************!*\
  !*** /Users/liran/Desktop/superPower/lang/en.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ 11));
var _battery;
var _default = {
  //Homepage
  'bluetooth': {
    searching: 'Searching',
    search: 'Search',
    noBluetoothDeviceConnected: 'No Bluetooth Device Connected',
    warmTips: 'Warm Tips',
    bluetoothAdapterUnavailablePleaseRestart: 'Bluetooth Adapter Unavailable Please Restart',
    pleaseCheckIfPhoneBluetoothIsOn: 'Please Check If Phone Bluetooth Is On',
    bluetoothDeviceNotFound: 'Bluetooth Device Not Found',
    searchingForDevices: 'Searching For Devices',
    bluetoothDeviceSearchFailed: 'Bluetooth Device Search Failed',
    unableToFindBluetoothDevicePleaseRetry: 'Unable To Find Bluetooth Device Please Retry',
    connecting: 'Connecting',
    connectedSuccessfully: 'Connected Successfully',
    connectionTimeoutPleaseRetry: 'Connection Timeout Please Retry',
    connectionFailed: 'Connection Failed',
    disconnecting: 'Disconnecting',
    disconnectionFailed: 'Disconnection Failed',
    passwordIncorrect: 'Password Incorrect'
  },
  //Dashboard page
  'battery': (_battery = {
    chargingTime: 'Charging',
    dischargingTime: 'Discharging',
    activation: 'Activation',
    remainingCapacity: 'Remaining Capacity',
    time: 'Time',
    standby: 'Standby',
    cycles: 'Cycles',
    voltage: 'Voltage',
    current: 'Current',
    power: 'Power',
    ave: 'Ave',
    max: 'Max',
    min: 'Min',
    diff: 'Diff',
    state: 'State',
    chargingSwitch: 'Charging Switch',
    dischargingSwitch: 'Discharging Switch',
    balance: 'Balance',
    protection: 'Protection',
    batteryHealthStatus: 'Battery Health Status',
    charging: 'Charging',
    discharging: 'Discharging',
    //保护
    singleCellOvervoltageProtection: 'Single Cell Overvoltage Protection',
    singleCellUndervoltageProtection: 'Single Cell Undervoltage Protection',
    packOvervoltageProtection: 'Pack Overvoltage Protection',
    packUndervoltageProtection: 'Pack Undervoltage Protection',
    chargingOvertemperatureProtection: 'Charging Overtemperature Protection',
    chargingUndertemperatureProtection: 'Charging Undertemperature Protection',
    dischargeOvertemperatureProtection: 'Discharge Overtemperature Protection',
    dischargeUndertemperatureProtection: 'Discharge Undertemperature Protection',
    chargingOvercurrentProtection: 'Charging Overcurrent Protection',
    dischargeOvercurrentProtection: 'Discharge Overcurrent Protection',
    shortCircuitProtection: 'Short Circuit Protection',
    //告警状态
    chargingHighTemperatureAlarm: 'Charging High Temperature Alarm',
    dischargingAndIdleHighTemperatureAlarm: 'Discharging and Idle High Temperature Alarm',
    chargingLowTemperatureAlarm: 'Charging Low Temperature Alarm',
    dischargingAndIdleLowTemperatureAlarm: 'Discharging and Idle Low Temperature Alarm',
    thermalRunawayAlarm: 'Thermal Runaway Alarm',
    environmentHighTemperatureAlarm: 'Environment High Temperature Alarm',
    environmentLowTemperatureAlarm: 'Environment Low Temperature Alarm',
    dischargeMosHighTemperatureAlarm: 'Discharge MOS High Temperature Alarm',
    chargingMosHighTemperatureAlarm: 'Charging MOS High Temperature Alarm',
    lowBatteryAlarm: 'Low Battery Alarm',
    singleCellOverVoltageAlarm: 'Single Cell Over Voltage Alarm',
    singleCellUnderVoltageAlarm: 'Single Cell Under Voltage Alarm',
    totalVoltageOverVoltageAlarm: 'Total Voltage Over Voltage Alarm',
    totalVoltageUnderVoltageAlarm: 'Total Voltage Under Voltage Alarm',
    chargingOvercurrentAlarm: 'Charging Overcurrent Alarm',
    dischargingOvercurrentAlarm: 'Discharging Overcurrent Alarm',
    pressureDifferenceAlarm: 'Pressure Difference Alarm',
    temperatureDifferenceAlarm: 'Temperature Difference Alarm',
    insulationAlarm: 'Insulation Alarm',
    //失效状态
    chargingMosFault: 'Charging MOS Fault',
    dischargingMosFault: 'Discharging MOS Fault',
    preChargeMosFailure: 'Pre-charge MOS Failure',
    antiReverseMosFailure: 'Anti-reverse MOS Failure',
    heatingMosFailure: 'Heating MOS Failure',
    cellSamplingDisconnectionFailure: 'Cell Sampling Disconnection Failure',
    cellUltraLowVoltageChargingDisabled: 'Cell Ultra-low Voltage Charging Disabled',
    rtcFailure: 'RTC Failure',
    fuseBlownStatus: 'Fuse Blown Status',
    voltageAcquisitionFailure: 'Voltage Acquisition Failure',
    currentAcquisitionFailure: 'Current Acquisition Failure',
    cellAbnormalHighTemperature: 'Cell Abnormal High Temperature',
    afeCommunicationFailure: 'AFE Communication Failure',
    cellNtcAcquisitionFailure: 'Cell NTC Acquisition Failure',
    environmentNtcAcquisitionFailure: 'Environment NTC Acquisition Failure',
    mosNtcAcquisitionFailure: 'MOS NTC Acquisition Failure',
    //保护状态
    singleCellOverVoltagePrimaryProtection: 'Single Cell Over Voltage Primary Protection',
    singleCellOverDischargePrimaryProtection: 'Single Cell Over Discharge Primary Protection',
    terminalHighTemperatureProtection: 'Terminal High Temperature Protection',
    reserve1: 'Reserve',
    chargingOverCurrentSecondaryProtection: 'Charging Over Current Secondary Protection',
    dischargingOverCurrentSecondaryProtection: 'Discharging Over Current Secondary Protection'
  }, (0, _defineProperty2.default)(_battery, "shortCircuitProtection", 'Short Circuit Protection'), (0, _defineProperty2.default)(_battery, "insulationProtection", 'Insulation Protection'), (0, _defineProperty2.default)(_battery, "singleCellOverVoltageSecondaryProtection", 'Single Cell Over Voltage Secondary Protection'), (0, _defineProperty2.default)(_battery, "singleCellOverDischargeSecondaryProtection", 'Single Cell Over Discharge Secondary Protection'), (0, _defineProperty2.default)(_battery, "chargingOverCurrentPrimaryProtection", 'Charging Over Current Primary Protection'), (0, _defineProperty2.default)(_battery, "dischargingOverCurrentPrimaryProtection", 'Discharging Over Current Primary Protection'), (0, _defineProperty2.default)(_battery, "afeHighTemperatureProtection", 'AFE High Temperature Protection'), (0, _defineProperty2.default)(_battery, "reserve2", 'Reserve'), (0, _defineProperty2.default)(_battery, "environmentLowTemperatureProtection", 'Environment Low Temperature Protection'), (0, _defineProperty2.default)(_battery, "environmentHighTemperatureProtection", 'Environment High Temperature Protection'), (0, _defineProperty2.default)(_battery, "chargingHighTemperatureProtectionCell", 'Charging High Temperature Protection (Cell)'), (0, _defineProperty2.default)(_battery, "dischargingHighTemperatureProtectionCell", 'Discharging High Temperature Protection (Cell)'), (0, _defineProperty2.default)(_battery, "chargingLowTemperatureProtectionCell", 'Charging Low Temperature Protection (Cell)'), (0, _defineProperty2.default)(_battery, "dischargingLowTemperatureProtectionCell", 'Discharging Low Temperature Protection (Cell)'), (0, _defineProperty2.default)(_battery, "cellLowTemperatureProtection", 'Cell Low Temperature Protection'), (0, _defineProperty2.default)(_battery, "cellHighTemperatureProtection", 'Cell High Temperature Protection'), (0, _defineProperty2.default)(_battery, "reserve3", 'Reserve'), (0, _defineProperty2.default)(_battery, "dischargingMosHighTemperatureProtection", 'Discharging MOS High Temperature Protection'), (0, _defineProperty2.default)(_battery, "chargingMosHighTemperatureProtection", 'Charging MOS High Temperature Protection'), (0, _defineProperty2.default)(_battery, "fullChargeProtection", 'Full Charge Protection'), (0, _defineProperty2.default)(_battery, "pressureDifferenceProtection", 'Pressure Difference Protection'), (0, _defineProperty2.default)(_battery, "temperatureDifferenceProtection", 'Temperature Difference Protection'), (0, _defineProperty2.default)(_battery, "heatingFilmTemperatureProtection", 'Heating Film Temperature Protection'), (0, _defineProperty2.default)(_battery, "totalVoltageUnderVoltageProtection", 'Total Voltage Under Voltage Protection'), (0, _defineProperty2.default)(_battery, "totalVoltageOverVoltageProtection", 'Total Voltage Over Voltage Protection'), _battery),
  //Battery
  'voltage': {
    voltage: 'Voltage',
    temperature: 'Temperature',
    batteryCell: 'Battery Cell'
  },
  //About
  'info-info': {
    online: 'Online',
    ask: 'Ask',
    email: 'Email',
    setting: 'Setting',
    language: 'Language',
    history: 'History'
  },
  'infooption': {
    groupTerminalOvervoltage: 'GroupTerminal Overvoltage',
    groupTerminalUndervoltage: 'Group Terminal Undervoltage',
    mosOvertemperature: 'Mos Overtemperature',
    lowInsulationResistance: 'Low Insulation Resistance',
    lowSoc: 'Low Soc',
    short: 'short',
    baseSetting: 'Base Setting',
    functionSetting: 'Function Setting',
    //Basic settings
    numberOfCells: 'Number Of Cells',
    nominalCapacity: 'Nominal Capacity',
    cycleCapacity: 'Cycle Capacity',
    cycles: 'Cycles',
    dateOfProduction: 'Date Of Production',
    //Software configuration
    senseResistance: 'Sense Resistance',
    chargeOcp: 'Charge Ocp',
    chargeOcpRelease: 'Charge Ocp Release',
    chargeOcpReleaseDelay: 'Charge Ocp Release Delay',
    dischargeOcp: 'Discharge Ocp',
    dischargeOcpRelease: 'Discharge Ocp Release',
    dischargeOcpReleaseDelay: 'Discharge Ocp Release Delay',
    //Voltage parameters
    cellOVP: "Cell OVP",
    cellOVPRelease: "Cell OVP Release",
    cellOVPReleaseDelay: "Cell OVP Release Delay",
    cellUVP: "Cell UVP",
    cellUVPRelease: "Cell UVP Release",
    cellUVPReleaseDelay: "Cell UVP Release Delay",
    packOVP: "Pack OVP",
    packOVPRelease: "Pack OVP Release",
    packOVPReleaseDelay: "Pack OVP Release Delay",
    packUVP: "Pack UVP",
    packUVPRelease: "Pack UVP Release",
    packUVPReleaseDelay: "Pack UVP Release Delay",
    //Temperature settings
    chargingOTP: "Charging OTP",
    chargingOTPRelease: "Charging OTP Release",
    chargingOTPReleaseDelay: "Charging OTP Release Delay",
    chargingUTP: "Charging UTP",
    chargingUTPRelease: "Charging UTP Release",
    chargingUTPReleaseDelay: "Charging UTP Release Delay",
    dischargeOTP: "Discharge OTP",
    dischargeOTPRelease: "Discharge OTP Release",
    dischargeOTPReleaseDelay: "Discharge OTP Release Delay",
    dischargeUTP: "Discharge UTP",
    dischargeUTPRelease: "Discharge UTP Release",
    dischargeUTPReleaseDelay: "Discharge UTP Release Delay",
    //开关
    switchFunction: 'Switch Function',
    loadCheck: 'Load Check',
    balanceEnable: 'Balance Enable',
    chargeBalance: 'Charge Balance',
    temp: 'Temp',
    tempSetting: 'Temp Setting',
    softwareConfiguration: 'Software Configuration',
    voltageonfiguration: 'Coltageon Figuration',
    //第二个板子-电压参数
    singleCellOverchargeWarningVoltage: "Single Cell Overcharge Warning Voltage",
    singleCellOverchargeProtectionVoltage: "Single Cell Overcharge Protection Voltage",
    singleCellOverchargeWarningDelay: "Single Cell Overcharge Warning Delay",
    singleCellOverchargeProtectionDelay: "Single Cell Overcharge Protection Delay",
    regenerationOverchargeProtectionDelay: "Regeneration Overcharge Protection Delay",
    normalTemperatureLowTemperatureThreshold: "Normal Temperature Low Temperature Threshold",
    singleCellOverchargeWarningReleaseVoltageDifference: "Single Cell Overcharge Warning Release Voltage Difference",
    singleCellOverchargeProtectionReleaseVoltage: "Single Cell Overcharge Protection Release Voltage",
    capacityReleaseH: "Capacity Release H",
    protocolVersionNumber: "Protocol Version Number",
    overVoltageDischargeReleaseCurrent: "Over Voltage Discharge Release Current",
    underVoltageChargingReleaseCurrent: "Under Voltage Charging Release Current",
    singleCellOvervoltageWarningReleaseDelay: "Single Cell Overvoltage Warning Release Delay",
    singleCellOvervoltageProtectionReleaseDelay: "Single Cell Overvoltage Protection Release Delay",
    normalTemperatureSingleCellOverdischargeWarningVoltage: "Normal Temperature Single Cell Overdischarge Warning Voltage",
    normalTemperatureSingleCellOverdischargeProtectionVoltage: "Normal Temperature Single Cell Overdischarge Protection Voltage",
    lowTemperatureSingleCellOverdischargeWarningVoltage: "Low Temperature Single Cell Overdischarge Warning Voltage",
    lowTemperatureSingleCellOverdischargeProtectionVoltage: "Low Temperature Single Cell Overdischarge Protection Voltage",
    singleCellOverdischargeWarningDelay: "Single Cell Overdischarge Warning Delay",
    singleCellOverdischargeProtectionDelay: "Single Cell Overdischarge Protection Delay",
    singleCellOverdischargeWarningReleaseVoltage: "Single Cell Overdischarge Warning Release Voltage",
    singleCellOverdischargeProtectionReleaseVoltage: "Single Cell Overdischarge Protection Release Voltage",
    singleCellOverdischargeWarningReleaseDelay: "Single Cell Overdischarge Warning Release Delay",
    singleCellOverdischargeProtectionReleaseDelay: "Single Cell Overdischarge Protection Release Delay",
    totalVoltageOvervoltageWarningVoltage: "Total Voltage Overvoltage Warning Voltage",
    totalVoltageOvervoltageProtectionVoltage: "Total Voltage Overvoltage Protection Voltage",
    totalVoltageOvervoltageProtectionDelay: "Total Voltage Overvoltage Protection Delay",
    totalVoltageOvervoltageWarningDelay: "Total Voltage Overvoltage Warning Delay",
    totalVoltageOvervoltageWarningReleaseVoltage: "Total Voltage Overvoltage Warning Release Voltage",
    totalVoltageOvervoltageProtectionReleaseVoltage: "Total Voltage Overvoltage Protection Release Voltage",
    totalVoltageOvervoltageReleaseDelay: "Total Voltage Overvoltage Release Delay",
    totalVoltageOvervoltageWarningReleaseDelay: "Total Voltage Overvoltage Warning Release Delay",
    normalTemperatureTotalVoltageOverdischargeWarningVoltage: "Normal Temperature Total Voltage Overdischarge Warning Voltage",
    normalTemperatureTotalVoltageOverdischargeProtectionVoltage: "Normal Temperature Total Voltage Overdischarge Protection Voltage",
    lowTemperatureTotalVoltageOverdischargeWarningVoltage: "Low Temperature Total Voltage Overdischarge Warning Voltage",
    lowTemperatureTotalVoltageOverdischargeProtectionVoltage: "Low Temperature Total Voltage Overdischarge Protection Voltage",
    totalVoltageOverdischargeWarningDelay: "Total Voltage Overdischarge Warning Delay",
    totalVoltageOverdischargeProtectionDelay: "Total Voltage Overdischarge Protection Delay",
    totalVoltageOverdischargeWarningReleaseVoltage: "Total Voltage Overdischarge Warning Release Voltage",
    totalVoltageOverdischargeProtectionReleaseVoltage: "Total Voltage Overdischarge Protection Release Voltage",
    totalVoltageOverdischargeWarningReleaseDelay: "Total Voltage Overdischarge Warning Release Delay",
    totalVoltageOverdischargeProtectionReleaseDelay: "Total Voltage Overdischarge Protection Release Delay",
    chargingOvercurrentWarningCurrent: "Charging Overcurrent Warning Current",
    chargingOvercurrentProtectionSmallCurrent: "Charging Overcurrent Protection Small Current",
    chargingOvercurrentProtectionLargeCurrent: "Charging Overcurrent Protection Large Current",
    chargingOvercurrentWarningDelay: "Charging Overcurrent Warning Delay",
    chargingOvercurrentProtectionLargeCurrentDelay: "Charging Overcurrent Protection Large Current Delay",
    currentConfiguration: 'Current Configuration',
    monomer: "monomer"
  },
  'common': {
    Confirm: 'Confirm',
    Cancel: 'Cancel',
    Loading: 'Loading'
  }
};
exports.default = _default;

/***/ }),
/* 38 */
/*!******************************************************!*\
  !*** /Users/liran/Desktop/superPower/store/index.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni, wx) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _vue = _interopRequireDefault(__webpack_require__(/*! vue */ 25));
var _vuex = _interopRequireDefault(__webpack_require__(/*! vuex */ 39));
var _unit = _interopRequireDefault(__webpack_require__(/*! @/unit/unit.js */ 40));
var _request = _interopRequireDefault(__webpack_require__(/*! @/unit/request.js */ 41));
_vue.default.use(_vuex.default);
var store = new _vuex.default.Store({
  state: {
    banzi_type: 0,
    //板子类型-第几块
    lanyaInfo: null,
    //蓝牙信息用户仪表盘页面
    homeLanName: null,
    //蓝牙信息（名称，序列号）
    writeNews: null,
    //已经连接设备的写入特征值
    yibiaopan: "",
    //仪表盘数据
    dianchi: "",
    //电池数据
    setting_data: "",
    //设置页面数据
    two_setting_state: false,
    //第二块板子第一次获取数据的状态
    two_setting_page: false,
    //是否进入设置页面
    strLth: "",
    //需要拼接的分段数据
    type_index: 0,
    //发送数据的index和接收数据的类型
    xunhuan_state: true,
    //循环状态
    //设置页面发送指令
    unhuan_setting: true,
    //进来获取一次数据用于接口 获取完改为false
    unhuan_setting_timeOut: null,
    //循环定时器
    setting_data_one_index: 1,
    //设置页面数据index
    setting_data_one: "",
    //01
    setting_data_two: "",
    //02
    setting_data_three: "",
    //03
    setting_page_state: false,
    //是否在设置页面
    kaiguan_state: false,
    //充电放点开关
    dianxin_show: false,
    //电芯页面是否显示
    //固件更新
    updateList: null,
    //固件的包
    updataIndex: 0,
    //升级的状态
    twoZl: "",
    //第二步的指令
    sendIndex: 0,
    //发包的序号
    //第三个板子的数据
    three_data: {
      zdy: '',
      //总电压
      zdl: '',
      //总电流 
      edrl: '',
      //额定容量  
      xhcs: '',
      //循环次数 
      soc: '',
      //SOC剩余容量百分比
      soh: '',
      //SOH 健康度 
      mos: '',
      //MOS状态 
      dx: '',
      //电芯 
      wd: '',
      //温度 
      bh: '' //保护
    },

    // 第三个板子优化相关状态
    three_retry_count: 0,
    // 当前指令重试次数
    three_max_retry: 2,
    // 最大重试次数
    three_timeout: null,
    // 超时定时器
    three_timeout_duration: 1500,
    // 超时时间(毫秒)
    three_command_queue: [],
    // 指令队列
    three_current_command: null,
    // 当前执行的指令
    three_is_processing: false,
    // 是否正在处理指令
    // 第二个板子优化相关状态
    two_retry_count: 0,
    // 当前指令重试次数
    two_max_retry: 2,
    // 最大重试次数
    two_timeout: null,
    // 超时定时器
    two_timeout_duration: 1500,
    // 超时时间(毫秒)
    two_current_command: null // 当前执行的指令
  },

  mutations: {
    //保存第三个板子的数据
    SAVETHREEDATA: function SAVETHREEDATA(state, obj) {
      switch (obj.type) {
        case 'zdy':
          state.three_data.zdy = obj.val;
          break;
        case 'zdl':
          state.three_data.zdl = obj.val;
          break;
        case 'edrl':
          state.three_data.edrl = obj.val;
          break;
        case 'xhcs':
          state.three_data.xhcs = obj.val;
          break;
        case 'soc':
          state.three_data.soc = obj.val;
          break;
        case 'soh':
          state.three_data.soh = obj.val;
          break;
        case 'mos':
          state.three_data.mos = obj.val;
          break;
        case 'dx':
          state.three_data.dx = obj.val;
          break;
        case 'wd':
          state.three_data.wd = obj.val;
          break;
        case 'bh':
          state.three_data.bh = obj.val;
          break;
        default:
          break;
      }
    },
    // 第三个板子优化相关mutations
    SET_THREE_RETRY_COUNT: function SET_THREE_RETRY_COUNT(state, count) {
      state.three_retry_count = count;
    },
    SET_THREE_TIMEOUT: function SET_THREE_TIMEOUT(state, timeout) {
      if (state.three_timeout) {
        clearTimeout(state.three_timeout);
      }
      state.three_timeout = timeout;
    },
    CLEAR_THREE_TIMEOUT: function CLEAR_THREE_TIMEOUT(state) {
      if (state.three_timeout) {
        clearTimeout(state.three_timeout);
        state.three_timeout = null;
      }
    },
    SET_THREE_CURRENT_COMMAND: function SET_THREE_CURRENT_COMMAND(state, command) {
      state.three_current_command = command;
    },
    SET_THREE_IS_PROCESSING: function SET_THREE_IS_PROCESSING(state, status) {
      state.three_is_processing = status;
    },
    // 第二个板子优化相关mutations
    SET_TWO_RETRY_COUNT: function SET_TWO_RETRY_COUNT(state, count) {
      state.two_retry_count = count;
    },
    SET_TWO_TIMEOUT: function SET_TWO_TIMEOUT(state, timeout) {
      if (state.two_timeout) {
        clearTimeout(state.two_timeout);
      }
      state.two_timeout = timeout;
    },
    CLEAR_TWO_TIMEOUT: function CLEAR_TWO_TIMEOUT(state) {
      if (state.two_timeout) {
        clearTimeout(state.two_timeout);
        state.two_timeout = null;
      }
    },
    SET_TWO_CURRENT_COMMAND: function SET_TWO_CURRENT_COMMAND(state, command) {
      state.two_current_command = command;
    },
    //更改发包的序号
    CHANGESENDINDEX: function CHANGESENDINDEX(state, index) {
      state.sendIndex = index;
    },
    //保存第二步的指令
    SAVETWOZL: function SAVETWOZL(state, val) {
      state.twoZl = val;
    },
    //升级
    CHANGESJINDEX: function CHANGESJINDEX(state, index) {
      state.updataIndex = index;
    },
    //升级数据包
    GETTWOLIST: function GETTWOLIST(state, arrs) {
      state.updateList = arrs;
    },
    //第二块板子-是否进入设置页面
    CHANGESETTINGPAGE: function CHANGESETTINGPAGE(state, val) {
      state.two_setting_page = val;
    },
    //修改板子类型-第几块板子
    CHANGEBANZITYPE: function CHANGEBANZITYPE(state, val) {
      state.banzi_type = val;
    },
    //保存设置页面数据-第二个板子使用
    SAVESETTINGDATA: function SAVESETTINGDATA(state, val) {
      state.setting_data = val;
    },
    //修改第二个板子第一次获取设置页面的状态
    TWOCHANGESTATE: function TWOCHANGESTATE(state, val) {
      state.two_setting_state = val;
    },
    DIANSHIPAGESHOWSTATUS: function DIANSHIPAGESHOWSTATUS(state, val) {
      state.dianxin_show = val;
    },
    CFDKAIGUAN: function CFDKAIGUAN(state, val) {
      state.kaiguan_state = val;
    },
    //断开链接
    CLEARALLDATA: function CLEARALLDATA(state, val) {
      //清除定时器
      clearTimeout(state.unhuan_setting_timeOut);
      state.unhuan_setting_timeOut = null;
      //清除第三个板子相关定时器
      clearTimeout(state.three_timeout);
      state.three_timeout = null;
      //清除第二个板子相关定时器
      clearTimeout(state.two_timeout);
      state.two_timeout = null;
      //重制所有数据
      state.banzi_type = 0;
      state.lanyaInfo = null;
      state.homeLanName = null;
      state.writeNews = null;
      state.yibiaopan = "";
      state.dianchi = "";
      state.setting_data = "";
      state.two_setting_state = false;
      state.strLth = "";
      state.type_index = 0;
      state.xunhuan_state = true;
      state.unhuan_setting = true;
      state.setting_data_one_index = 1;
      state.setting_data_one = "";
      state.setting_data_two = "";
      state.setting_data_three = "";
      state.setting_page_state = false;
      state.kaiguan_state = false;
      state.dianxin_show = false;
      //固件更新
      state.updateList = null;
      state.updataIndex = 0;
      state.twoZl = "";
      state.sendIndex = 0;
      //第三个板子重置
      state.three_retry_count = 0;
      state.three_timeout = null;
      state.three_current_command = null;
      state.three_is_processing = false;
      //第二个板子重置
      state.two_retry_count = 0;
      state.two_timeout = null;
      state.two_current_command = null;
    },
    //是否在设置页面
    CHANGESETTINGPAGESTATE: function CHANGESETTINGPAGESTATE(state, val) {
      state.setting_page_state = val;
    },
    //循环状态
    STOPXUNHUAN: function STOPXUNHUAN(state, val) {
      state.xunhuan_state = val;
      if (!val) {
        clearTimeout(state.unhuan_setting_timeOut);
        state.unhuan_setting_timeOut = null;
        //清除第三个板子相关定时器
        clearTimeout(state.three_timeout);
        state.three_timeout = null;
        //清除第二个板子相关定时器
        clearTimeout(state.two_timeout);
        state.two_timeout = null;
      }
    },
    SAVELANYAINFO: function SAVELANYAINFO(state, info) {
      state.lanyaInfo = info;
    },
    CHANGEXUHUANSETTING: function CHANGEXUHUANSETTING(state, val) {
      state.unhuan_setting = val;
    },
    //设置页面数据index
    SAVESETTINGDATAONEINDEX: function SAVESETTINGDATAONEINDEX(state, val) {
      state.setting_data_one_index = val;
    },
    //保存设置页面第一条数据
    SAVESETTINGDATAONE: function SAVESETTINGDATAONE(state, val) {
      state.setting_data_one = val;
    },
    //保存设置页面第二条数据
    SAVESETTINGDATATWO: function SAVESETTINGDATATWO(state, val) {
      state.setting_data_two = val;
    },
    //保存设置页面第三条数据
    SAVESETTINGDATATHREE: function SAVESETTINGDATATHREE(state, val) {
      state.setting_data_three = val;
    },
    //发送数据的index和接收数据的类型
    CHANGETYPEINDEX: function CHANGETYPEINDEX(state, val) {
      state.type_index = val;
    },
    //保存数据到仪表盘
    SAVEYIBIAOPAN: function SAVEYIBIAOPAN(state, val) {
      state.yibiaopan = val;
    },
    //保存数据到电池
    SAVEDIANCHI: function SAVEDIANCHI(state, val) {
      state.dianchi = val;
    },
    //清空数据
    DUANKAILIANJIE: function DUANKAILIANJIE(state) {
      state.strLth = '';
    },
    //新增链接的蓝牙写入数据
    CHANGEWRITE: function CHANGEWRITE(state, option) {
      state.writeNews = option;
    },
    //首页连接后把蓝牙的名称存储下来
    HOMEBLONAME: function HOMEBLONAME(state, objs) {
      state.homeLanName = objs;
    },
    //拼接数据
    STRSUB: function STRSUB(state, val) {
      state.strLth += val;
    }
  },
  actions: {
    requests: function requests(context, state) {
      var _this = this;
      console.log('开始发送');
      uni.showLoading({
        title: '开始激活'
      });
      var set = setInterval(function () {
        if (_this.state.yibiaopan && _this.state.dianchi && _this.state.setting_data_one && _this.state.setting_data_two && _this.state.setting_data_three) {
          var data = {
            yibiaopan: _this.state.yibiaopan,
            dianchi: _this.state.dianchi,
            setting_data_one: _this.state.setting_data_one,
            //01
            setting_data_two: _this.state.setting_data_two,
            //02
            setting_data_three: _this.state.setting_data_three,
            //03
            lanyaInfo: {
              name: _this.state.lanyaInfo.name,
              deviceId: _this.state.lanyaInfo.deviceId,
              iosMac: _this.state.lanyaInfo.iosMac
            }
          };
          _request.default.zhilingchuli(data);
          var sets = setTimeout(function () {
            uni.showToast({
              title: '激活完毕',
              icon: 'success'
            });
            clearTimeout(sets);
            sets = null;
          }, 500);
          clearInterval(set);
          set = null;
        }
      }, 1000);
    },
    // 第二个板子优化方法 - 处理超时重试
    handleTwoCommandTimeout: function handleTwoCommandTimeout(_ref) {
      var commit = _ref.commit,
        dispatch = _ref.dispatch,
        state = _ref.state;
      console.log("\u7B2C\u4E8C\u4E2A\u677F\u5B50\u6307\u4EE4\u8D85\u65F6\uFF0C\u5F53\u524D\u91CD\u8BD5\u6B21\u6570: ".concat(state.two_retry_count));
      if (state.two_retry_count < state.two_max_retry) {
        commit('SET_TWO_RETRY_COUNT', state.two_retry_count + 1);
        console.log("\u91CD\u8BD5\u53D1\u9001\u6307\u4EE4\uFF0C\u91CD\u8BD5\u6B21\u6570: ".concat(state.two_retry_count));
        // 重新发送当前指令
        dispatch('sendTwoCommand', {
          index: state.type_index,
          isRetry: true
        });
      } else {
        console.log("\u6307\u4EE4\u91CD\u8BD5\u6B21\u6570\u8FBE\u5230\u4E0A\u9650\uFF0C\u8DF3\u8FC7\u5F53\u524D\u6307\u4EE4\uFF0C\u6267\u884C\u4E0B\u4E00\u4E2A");
        // 重置重试次数
        commit('SET_TWO_RETRY_COUNT', 0);
        commit('CLEAR_TWO_TIMEOUT');
        // 跳到下一个指令
        var nextIndex = state.type_index + 1;
        if (nextIndex < 3) {
          dispatch('sendTwoCommand', {
            index: nextIndex
          });
        } else {
          // 所有指令执行完毕，开始下一轮循环
          commit('CHANGETYPEINDEX', 0);
          state.unhuan_setting_timeOut = setTimeout(function () {
            dispatch('redaTimeOut', 0);
            clearTimeout(state.unhuan_setting_timeOut);
          }, 3000);
        }
      }
    },
    // 第二个板子优化方法 - 发送指令
    sendTwoCommand: function sendTwoCommand(_ref2, _ref3) {
      var commit = _ref2.commit,
        dispatch = _ref2.dispatch,
        state = _ref2.state;
      var index = _ref3.index,
        _ref3$isRetry = _ref3.isRetry,
        isRetry = _ref3$isRetry === void 0 ? false : _ref3$isRetry;
      // 如果正在升级，不发送指令
      if (state.updataIndex) {
        console.log('升级模式中，跳过常规指令发送');
        return;
      }

      // 如果在设置页面，不发送指令（除非是重试）
      if (state.two_setting_page && !isRetry) {
        console.log('设置页面中，跳过常规指令发送');
        // 清除定时器避免泄漏
        commit('CLEAR_TWO_TIMEOUT');
        return;
      }
      if (!isRetry) {
        commit('SET_TWO_RETRY_COUNT', 0);
        commit('CHANGETYPEINDEX', index);
      }
      var commands = ['7f55fe0103010000358421fd',
      // 仪表盘数据
      '7f55fe010301410029d5fcfd',
      // 电池电压数据
      '7f55fe010304000032c52ffd' // 设置页面数据
      ];

      var command = commands[index];
      if (!command) return;
      console.log("\u7B2C\u4E8C\u4E2A\u677F\u5B50\u53D1\u9001\u6307\u4EE4 ".concat(index, ": ").concat(command).concat(isRetry ? ' (重试)' : ''));

      // 清除之前的超时定时器
      commit('CLEAR_TWO_TIMEOUT');

      // 设置超时定时器
      var timeout = setTimeout(function () {
        dispatch('handleTwoCommandTimeout');
      }, state.two_timeout_duration);
      commit('SET_TWO_TIMEOUT', timeout);
      commit('SET_TWO_CURRENT_COMMAND', {
        index: index,
        command: command
      });

      // 发送指令
      dispatch('writeBLECharacteristicValue', command);
    },
    // 第二个板子优化方法 - 处理成功响应
    handleTwoCommandSuccess: function handleTwoCommandSuccess(_ref4, _ref5) {
      var commit = _ref4.commit,
        dispatch = _ref4.dispatch,
        state = _ref4.state;
      var val = _ref5.val,
        nextIndex = _ref5.nextIndex,
        _ref5$shouldLoop = _ref5.shouldLoop,
        shouldLoop = _ref5$shouldLoop === void 0 ? false : _ref5$shouldLoop;
      console.log("\u7B2C\u4E8C\u4E2A\u677F\u5B50\u6307\u4EE4 ".concat(state.type_index, " \u6267\u884C\u6210\u529F"));

      // 清除超时定时器
      commit('CLEAR_TWO_TIMEOUT');
      // 重置重试次数
      commit('SET_TWO_RETRY_COUNT', 0);

      // 根据指令索引保存相应数据
      if (state.type_index === 0) {
        commit('SAVEYIBIAOPAN', val);
      } else if (state.type_index === 1) {
        commit('SAVEDIANCHI', val);
      } else if (state.type_index === 2) {
        commit('SAVESETTINGDATA', val);
      }
      commit('DUANKAILIANJIE'); // 清空数据

      // 如果需要直接进入循环（电池数据后且已获取过设置数据）
      if (shouldLoop) {
        commit('CHANGETYPEINDEX', 0);
        state.unhuan_setting_timeOut = setTimeout(function () {
          dispatch('redaTimeOut', 0);
          clearTimeout(state.unhuan_setting_timeOut);
        }, 3000);
        return;
      }
      if (nextIndex < 3) {
        // 执行下一个指令
        setTimeout(function () {
          dispatch('sendTwoCommand', {
            index: nextIndex
          });
        }, 200); // 添加200ms间隔
      } else {
        // 所有指令执行完毕
        if (state.type_index === 2) {
          // 设置页面数据获取完毕
          if (state.two_setting_page) return;
          commit('TWOCHANGESTATE', true);
        }
        // 开始下一轮循环
        commit('CHANGETYPEINDEX', 0);
        state.unhuan_setting_timeOut = setTimeout(function () {
          dispatch('redaTimeOut', 0);
          clearTimeout(state.unhuan_setting_timeOut);
        }, 3000);
      }
    },
    // 第三个板子优化方法 - 处理超时重试
    handleThreeCommandTimeout: function handleThreeCommandTimeout(_ref6) {
      var commit = _ref6.commit,
        dispatch = _ref6.dispatch,
        state = _ref6.state;
      console.log("\u7B2C\u4E09\u4E2A\u677F\u5B50\u6307\u4EE4\u8D85\u65F6\uFF0C\u5F53\u524D\u91CD\u8BD5\u6B21\u6570: ".concat(state.three_retry_count));
      if (state.three_retry_count < state.three_max_retry) {
        commit('SET_THREE_RETRY_COUNT', state.three_retry_count + 1);
        console.log("\u91CD\u8BD5\u53D1\u9001\u6307\u4EE4\uFF0C\u91CD\u8BD5\u6B21\u6570: ".concat(state.three_retry_count));
        // 重新发送当前指令
        dispatch('sendThreeCommand', {
          index: state.type_index,
          isRetry: true
        });
      } else {
        console.log("\u6307\u4EE4\u91CD\u8BD5\u6B21\u6570\u8FBE\u5230\u4E0A\u9650\uFF0C\u8DF3\u8FC7\u5F53\u524D\u6307\u4EE4\uFF0C\u6267\u884C\u4E0B\u4E00\u4E2A");
        // 重置重试次数
        commit('SET_THREE_RETRY_COUNT', 0);
        commit('CLEAR_THREE_TIMEOUT');
        // 跳到下一个指令
        var nextIndex = state.type_index + 1;
        if (nextIndex < 10) {
          dispatch('sendThreeCommand', {
            index: nextIndex
          });
        } else {
          // 所有指令执行完毕，开始下一轮循环
          commit('CHANGETYPEINDEX', 0);
          state.unhuan_setting_timeOut = setTimeout(function () {
            dispatch('redaTimeOut', 0);
            clearTimeout(state.unhuan_setting_timeOut);
          }, 3000);
        }
      }
    },
    // 第三个板子优化方法 - 发送指令
    sendThreeCommand: function sendThreeCommand(_ref7, _ref8) {
      var commit = _ref7.commit,
        dispatch = _ref7.dispatch,
        state = _ref7.state;
      var index = _ref8.index,
        _ref8$isRetry = _ref8.isRetry,
        isRetry = _ref8$isRetry === void 0 ? false : _ref8$isRetry;
      if (!isRetry) {
        commit('SET_THREE_RETRY_COUNT', 0);
        commit('CHANGETYPEINDEX', index);
      }
      var commands = ['a0010102060D',
      // 总电压
      'a0010103060D',
      // 总电流
      'a0010105020D',
      // 额定容量
      'a00101060e0D',
      // 循环次数
      'a00101070e0d',
      // SOC剩余容量百分比
      'a0010108020d',
      // SOH 健康度
      'a0010109020d',
      // MOS状态
      'a0020101060d',
      // 电芯
      'a0020102040d',
      // 温度
      'a00601030e0d' // 保护
      ];

      var command = commands[index];
      if (!command) return;
      console.log("\u7B2C\u4E09\u4E2A\u677F\u5B50\u53D1\u9001\u6307\u4EE4 ".concat(index, ": ").concat(command).concat(isRetry ? ' (重试)' : ''));

      // 清除之前的超时定时器
      commit('CLEAR_THREE_TIMEOUT');

      // 设置超时定时器
      var timeout = setTimeout(function () {
        dispatch('handleThreeCommandTimeout');
      }, state.three_timeout_duration);
      commit('SET_THREE_TIMEOUT', timeout);
      commit('SET_THREE_CURRENT_COMMAND', {
        index: index,
        command: command
      });

      // 发送指令
      dispatch('writeBLECharacteristicValue', command);
    },
    // 第三个板子优化方法 - 处理成功响应
    handleThreeCommandSuccess: function handleThreeCommandSuccess(_ref9, _ref10) {
      var commit = _ref9.commit,
        dispatch = _ref9.dispatch,
        state = _ref9.state;
      var type = _ref10.type,
        val = _ref10.val,
        nextIndex = _ref10.nextIndex;
      console.log("\u7B2C\u4E09\u4E2A\u677F\u5B50\u6307\u4EE4 ".concat(state.type_index, " \u6267\u884C\u6210\u529F: ").concat(type));

      // 清除超时定时器
      commit('CLEAR_THREE_TIMEOUT');
      // 重置重试次数
      commit('SET_THREE_RETRY_COUNT', 0);
      // 保存数据
      commit('SAVETHREEDATA', {
        type: type,
        val: val
      });
      if (nextIndex < 10) {
        // 执行下一个指令
        setTimeout(function () {
          dispatch('sendThreeCommand', {
            index: nextIndex
          });
        }, 200); // 添加200ms间隔
      } else {
        // 所有指令执行完毕，开始下一轮循环
        commit('CHANGETYPEINDEX', 0);
        state.unhuan_setting_timeOut = setTimeout(function () {
          dispatch('redaTimeOut', 0);
          clearTimeout(state.unhuan_setting_timeOut);
        }, 3000);
      }
    },
    //监听数据返回
    onBLECharacteristicValueChange: function onBLECharacteristicValueChange(_ref11) {
      var _this2 = this;
      var commit = _ref11.commit,
        dispatch = _ref11.dispatch,
        state = _ref11.state;
      wx.onBLECharacteristicValueChange(function (res) {
        var resHex = _unit.default.ab2hex(res.value);
        var val = resHex;
        console.log(val);
        if (state.banzi_type == 1) {
          //循环指令==================================================================
          console.log('监听数据返回', val);
          if (state.kaiguan_state) return;
          if (state.type_index == 2) {
            if (!state.xunhuan_state) {
              console.log('进入设置页面');
            }
            if (val == 'ddfa8200ff7e77') {
              _this2.dispatch('writeBLECharacteristicValue', 'DD5A00025678FF3077');
              uni.showToast({
                title: '请重新修改',
                icon: 'none'
              });
            }
            if (val == 'ddfa0000000077' || val == 'DDFA0000000077') {
              console.log('修改成功');
              //发送第一条指令
              commit('SAVESETTINGDATAONEINDEX', 1);
              _this2.dispatch('writeBLECharacteristicValue', 'DDA5FA0300001afee977');
              return;
            }
            //进入工厂模式
            if (val == 'dd000000000077' || val == 'DD000000000077') {
              //发送第一条指令
              commit('SAVESETTINGDATAONEINDEX', 1);
              _this2.dispatch('writeBLECharacteristicValue', 'DDA5FA0300001afee977');
              return;
            }
            //无修改退出工厂模式
            if (val == 'dd010000000077' || val == 'DD010000000077') {
              console.log('无修改退出工厂模式');
              if (!state.setting_page_state) {
                commit('CHANGETYPEINDEX', 0); //无修改退出工厂模式
                commit('CHANGEXUHUANSETTING', false);
                console.log('继续执行循环');
                var set = setTimeout(function () {
                  _this2.dispatch('redaTimeOut', 0);
                  clearTimeout(set);
                  set = null;
                }, 3000);
              } else {
                console.log('设置页面-不进入循环获取数据');
              }
              return;
            }
            if (state.setting_data_one_index == 1) {
              //读取设置数据
              if ((val.substring(0, 4) == 'ddfa' || val.substring(0, 4) == 'DDFA') && val.substring(val.length - 2, val.length) == '77') {
                //不需要拼接
                commit('SAVESETTINGDATAONE', val);
                commit('DUANKAILIANJIE'); //清空数据
                //获取第二条数据
                commit('SAVESETTINGDATAONEINDEX', 2);
                _this2.dispatch('writeBLECharacteristicValue', 'DDA5FA03001a1efecb77');
              } else {
                //需要拼接
                if (val.substring(0, 4) == 'ddfa' || val.substring(0, 4) == 'DDFA') {
                  commit('DUANKAILIANJIE'); //清空数据
                  commit('STRSUB', val);
                } else {
                  if (val.substring(val.length - 2, val.length) == '77') {
                    commit('STRSUB', val);
                    //数据完结
                    //校验数据完整性
                    if (_unit.default.validateChecksum(state.strLth)) {
                      console.log('设置页面数据获取完毕======01');
                      console.log(state.strLth);
                      commit('SAVESETTINGDATAONE', state.strLth);
                      commit('DUANKAILIANJIE'); //清空数据
                      //获取第二条数据
                      commit('SAVESETTINGDATAONEINDEX', 2);
                      _this2.dispatch('writeBLECharacteristicValue', 'DDA5FA03001a1efecb77');
                    } else {
                      console.log('校验数据不通过');
                    }
                  } else {
                    //保存数据
                    commit('STRSUB', val);
                  }
                }
              }
            } else if (state.setting_data_one_index == 2) {
              if ((val.substring(0, 4) == 'ddfa' || val.substring(0, 4) == 'DDFA') && val.substring(val.length - 2, val.length) == '77') {
                //不需要拼接
                commit('SAVESETTINGDATATWO', val);
                commit('DUANKAILIANJIE'); //清空数据
                //获取第三条数据
                commit('SAVESETTINGDATAONEINDEX', 3);
                _this2.dispatch('writeBLECharacteristicValue', 'DDA5FA03006813FE8877');
              } else {
                //需要拼接
                if (val.substring(0, 4) == 'ddfa' || val.substring(0, 4) == 'DDFA') {
                  commit('DUANKAILIANJIE'); //清空数据
                  commit('STRSUB', val);
                } else {
                  if (val.substring(val.length - 2, val.length) == '77') {
                    commit('STRSUB', val);
                    //数据完结
                    //校验数据完整性
                    if (_unit.default.validateChecksum(state.strLth)) {
                      console.log('设置页面数据获取完毕======02');
                      console.log(state.strLth);
                      commit('SAVESETTINGDATATWO', state.strLth);
                      commit('DUANKAILIANJIE'); //清空数据
                      //获取第三条数据
                      commit('SAVESETTINGDATAONEINDEX', 3);
                      _this2.dispatch('writeBLECharacteristicValue', 'DDA5FA03006813FE8877');
                    } else {
                      console.log('校验数据不通过');
                    }
                  } else {
                    //保存数据
                    commit('STRSUB', val);
                  }
                }
              }
            } else if (state.setting_data_one_index == 3) {
              if ((val.substring(0, 4) == 'ddfa' || val.substring(0, 4) == 'DDFA') && val.substring(val.length - 2, val.length) == '77') {
                //不需要拼接
                commit('SAVESETTINGDATATHREE', val);
                commit('DUANKAILIANJIE'); //清空数据
                //获取完-关闭工厂模式
                if (!state.setting_page_state) {
                  commit('SAVESETTINGDATAONEINDEX', 0);
                  _this2.dispatch('writeBLECharacteristicValue', 'DD5A01020000FFFD77');
                } else {
                  console.log('设置页面-不退出工厂模式-数据读取完毕');
                }
              } else {
                //需要拼接
                if (val.substring(0, 4) == 'ddfa' || val.substring(0, 4) == 'DDFA') {
                  commit('DUANKAILIANJIE'); //清空数据
                  commit('STRSUB', val);
                } else {
                  if (val.substring(val.length - 2, val.length) == '77') {
                    commit('STRSUB', val);
                    //数据完结
                    //校验数据完整性
                    if (_unit.default.validateChecksum(state.strLth)) {
                      console.log('设置页面数据获取完毕======03');
                      console.log(state.strLth);
                      commit('SAVESETTINGDATATHREE', state.strLth);
                      commit('DUANKAILIANJIE'); //清空数据
                      //获取完-关闭工厂模式
                      if (!state.setting_page_state) {
                        commit('SAVESETTINGDATAONEINDEX', 0);
                        _this2.dispatch('writeBLECharacteristicValue', 'DD5A01020000FFFD77');
                      } else {
                        console.log('设置页面-不退出工厂模式-数据读取完毕');
                      }
                    } else {
                      console.log('校验数据不通过');
                    }
                  } else {
                    //保存数据
                    commit('STRSUB', val);
                  }
                }
              }
            }
          } else {
            //仪表盘数据
            if (state.type_index == 0) {
              // console.log('获取仪表盘数据-----');
              if ((val.substring(0, 4) == 'dd03' || val.substring(0, 4) == 'DD03') && val.substring(val.length - 2, val.length) == '77') {
                //不用分包
                commit('SAVEYIBIAOPAN', val);
                commit('DUANKAILIANJIE'); //清空数据
                _this2.dispatch('redaTimeOut', 1);
                commit('CHANGETYPEINDEX', 1);
              } else {
                if (val.substring(0, 4) == 'dd03' || val.substring(0, 4) == 'DD03') {
                  commit('DUANKAILIANJIE'); //清空数据
                  commit('STRSUB', val);
                } else {
                  if (val.substring(val.length - 2, val.length) == '77') {
                    commit('STRSUB', val);
                    //数据完结
                    //校验数据完整性
                    if (_unit.default.validateChecksum(state.strLth)) {
                      console.log('仪表盘获取完毕======');
                      console.log(state.strLth);
                      commit('SAVEYIBIAOPAN', state.strLth);
                      commit('DUANKAILIANJIE'); //清空数据
                      _this2.dispatch('redaTimeOut', 1);
                      commit('CHANGETYPEINDEX', 1);
                    } else {
                      console.log('校验数据不通过');
                    }
                  } else {
                    //保存数据
                    commit('STRSUB', val);
                  }
                }
              }
              //电池数据
            } else if (state.type_index == 1) {
              // console.log('获取电池数据-----');
              if (val.substring(0, 4) == 'dd04' || val.substring(0, 4) == 'DD04') {
                if (val.substring(val.length - 2, val.length) == '77') {
                  //校验数据完整性
                  if (_unit.default.validateChecksum(val)) {
                    console.log('电池数据获取完毕======');
                    console.log(val);
                    commit('SAVEDIANCHI', val);
                    commit('DUANKAILIANJIE'); //清空数据
                    //-----------------继续执行循环指令-----------------
                    // if (state.unhuan_setting) {
                    // 	//进入工厂模式
                    // 	commit('CHANGETYPEINDEX', 2)
                    // 	this.dispatch('writeBLECharacteristicValue',
                    // 		'DD5A00025678FF3077');
                    // 	//兜底没有设置页面数据，重新进入循环
                    // 	let str = setTimeout(() => {
                    // 		if (!state.setting_data_one) {
                    // 			//下次不再进来获取设置页面数据
                    // 			commit('CHANGEXUHUANSETTING', false);
                    // 			this.dispatch('redaTimeOut', 0);
                    // 		}
                    // 		clearTimeout(str);
                    // 		str = null;
                    // 	}, 1000)
                    // } else {
                    //流入循环
                    state.unhuan_setting_timeOut = setTimeout(function () {
                      _this2.dispatch('redaTimeOut', 0);
                      clearTimeout(state.unhuan_setting_timeOut);
                    }, 3000);
                    // }
                    //-----------------继续执行循环指令-----------------
                  } else {
                    console.log('校验数据不通过');
                  }
                } else {
                  commit('DUANKAILIANJIE'); //清空数据
                  commit('STRSUB', val);
                }
              } else {
                if (val.substring(val.length - 2, val.length) == '77') {
                  commit('STRSUB', val);
                  //数据完结
                  //校验数据完整性
                  if (_unit.default.validateChecksum(state.strLth)) {
                    console.log('电池数据获取完毕======');
                    console.log(state.strLth);
                    commit('SAVEDIANCHI', state.strLth);
                    commit('DUANKAILIANJIE'); //清空数据
                    //-----------------继续执行循环指令-----------------
                    // if (state.unhuan_setting) {
                    // 	//进入工厂模式
                    // 	commit('CHANGETYPEINDEX', 2)
                    // 	this.dispatch('writeBLECharacteristicValue',
                    // 		'DD5A00025678FF3077');
                    // } else {
                    //流入循环
                    state.unhuan_setting_timeOut = setTimeout(function () {
                      _this2.dispatch('redaTimeOut', 0);
                      clearTimeout(state.unhuan_setting_timeOut);
                    }, 3000);
                    // }
                    //-----------------继续执行循环指令-----------------
                  } else {
                    console.log('校验数据不通过');
                  }
                } else {
                  //保存数据
                  commit('STRSUB', val);
                }
              }
            }
          }
        } else if (state.banzi_type == 2) { //FJ
          //第二块板子，富嘉
          //仪表盘数据
          console.log(val);
          // console.log('2-------第二块板子获取数据--------2');
          if (state.updataIndex) {
            if (state.updataIndex == 1) {
              var valstr=val.toUpperCase();
              if (valstr == '5501FE510001003972FD' ||valstr=='55FCFE510001002C9FFD') {
                console.log('第一步执行完毕');
                //间隔200毫秒，发送下一个指令
                var _set = setTimeout(function () {
                  _this2.dispatch('writeBLECharacteristicValue', state.twoZl);
                  var sets = setInterval(function () {
                    if (state.updataIndex != 2) {
                      _this2.dispatch('writeBLECharacteristicValue', state.twoZl);
                    } else {
                      clearInterval(sets);
                      sets = null;
                      clearTimeout(_set);
                      _set = null;
                    }
                  }, 200);
                }, 200);
              }
              if (valstr == '5501FE52000200000612FD' || valstr == '55FCFE52000200002ADDFD'||valstr == '55FDFE52000200003A1DFD') {
                commit('CHANGESJINDEX', 2);
                console.log('第二步执行完毕');
                console.log('进入第三步骤，开始发第一包');
                var content = '';
                state.updateList[0].forEach(function (item, index) {
                  //不分包
                  content += item;
                  //分包逻辑
                  // let set = setTimeout(() => {
                  // 	this.dispatch('writeBLECharacteristicValue',
                  // 		item);
                  // 	console.log(item);
                  // 	clearTimeout(set);
                  // 	set = null;
                  // }, index * 50);
                });
                console.log(content);
                _this2.dispatch('writeBLECharacteristicValue', content);
                commit('CHANGESENDINDEX', 1);
              }
            } else if (state.updataIndex == 2) {
              console.log('发送剩余的包');
              console.log(val);
              var jy = val.slice(-10, -6);
              var xh = parseInt(jy, 16);
              if (xh == state.sendIndex) {
                if (state.sendIndex != state.updateList.length) {
                  console.log('发送第' + state.sendIndex + '包,总包' + state.updateList.length);
                  var _content = "";
                  state.updateList[state.sendIndex].forEach(function (item) {
                    _content += item;
                  });
                  _this2.dispatch('writeBLECharacteristicValue', _content);
                  commit('CHANGESENDINDEX', state.sendIndex + 1);
                } else {
                  console.log('所有包发送完毕,发送最后一步指令');

                  //根据不同的地址发送不同的字符串
                  var s54_str=null;
                  switch(getApp().globalData.updateaddr)
                  {
                    case 1:
                      s54_str='55FE0154000400000000675DFD';
                      break;
                    case 0xfc:
                      s54_str='55FEFC54000400000000A980FD';
                      break;
                      case 0xfd:
                        s54_str='55FEFD54000400000000684CFD';
                        break;
                        default:
                          s54_str='55FE0054000400000000A691FD';
                          break;
                  }
                  _this2.dispatch('writeBLECharacteristicValue', s54_str);
                  var _set2 = setTimeout(function () {
                    _this2.dispatch('writeBLECharacteristicValue', s54_str);
                    clearTimeout(_set2);
                    _set2 = null;
                  }, 300);
                  var sets = setTimeout(function () {
                    _this2.dispatch('writeBLECharacteristicValue', s54_str);
                    clearTimeout(sets);
                    sets = null;
                  }, 600);
                  var setst = setTimeout(function () {
                    _this2.dispatch('writeBLECharacteristicValue',s54_str);
                    clearTimeout(setst);
                    setst = null;
                  }, 900);
                }
              }
              if (valstr == '5501FE5400010039BEFD' || valstr == '55FCFE540001002C53FD'|| valstr == '55FCFE540001002D82FD') {
                console.log('升级成功');
              }
            }
            //升级
            return;
          }
          if (state.type_index == 0) {
            console.log('获取仪表盘数据-----');
            if (val.substring(8, 12) == '036A' || val.substring(8, 12) == '036a') {
              var mowei = val.substring(val.length - 6, val.length - 2);
              if (_unit.default.crc16Modbus(val) == mowei) {
                console.log('校验完整性通过');
                // 先清除超时定时器
                commit('CLEAR_TWO_TIMEOUT');
                // 如果在设置页面，只保存数据不进入下一步
                if (state.two_setting_page) {
                  commit('SAVEYIBIAOPAN', val);
                  commit('DUANKAILIANJIE');
                  return;
                }
                dispatch('handleTwoCommandSuccess', {
                  val: val,
                  nextIndex: 1
                });
              } else {
                console.log('仪表盘-校验数据不通过-重新发送');
                commit('DUANKAILIANJIE'); //清空数据
                // 不需要手动重试，超时机制会处理
              }
            }
          } else if (state.type_index == 1) {
            console.log('获取电池电压数据');
            if (val.substring(8, 12) == '0352') {
              var _mowei = val.substring(val.length - 6, val.length - 2);
              if (_unit.default.crc16Modbus(val) == _mowei) {
                console.log('校验完整性通过');
                // 先清除超时定时器
                commit('CLEAR_TWO_TIMEOUT');
                // 如果在设置页面，只保存数据不进入下一步
                if (state.two_setting_page) {
                  commit('SAVEDIANCHI', val);
                  commit('DUANKAILIANJIE');
                  return;
                }
                dispatch('handleTwoCommandSuccess', {
                  val: val,
                  nextIndex: 2,
                  shouldLoop: state.two_setting_state // 如果已获取过设置数据，直接循环
                });
              } else {
                console.log('电池电压-校验数据不通过');
                commit('DUANKAILIANJIE'); //清空数据
                // 不需要手动重试，超时机制会处理
              }
            }
          } else if (state.type_index == 2) {
            console.log('获取设置页面数据');
            if (val.substring(8, 12) == '0364') {
              var _mowei2 = val.substring(val.length - 6, val.length - 2);
              if (_unit.default.crc16Modbus(val) == _mowei2) {
                console.log('校验完整性通过');
                dispatch('handleTwoCommandSuccess', {
                  val: val,
                  nextIndex: 3
                });
              } else {
                console.log('设置页面-校验数据不通过');
                commit('DUANKAILIANJIE'); //清空数据
                // 不需要手动重试，超时机制会处理
              }
            }
          }
        } else if (state.banzi_type == 3) {
          console.log('第三块板子回复数据:', val);

          // 清除当前的超时定时器（因为收到了回复）
          // commit('CLEAR_THREE_TIMEOUT');

          if (state.type_index == 0) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----总电压-----');
            if (val.substring(0, 8) == 'c0010502' || val.substring(0, 8) == 'C0010502') {
              dispatch('handleThreeCommandSuccess', {
                type: 'zdy',
                val: val,
                nextIndex: 1
              });
              return;
            }
          } else if (state.type_index == 1) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----总电流-----');
            if (val.substring(0, 8) == 'c0010303' || val.substring(0, 8) == 'C0010303') {
              dispatch('handleThreeCommandSuccess', {
                type: 'zdl',
                val: val,
                nextIndex: 2
              });
              return;
            }
          } else if (state.type_index == 2) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----额定容量-----');
            if (val.substring(0, 8) == 'c0010305' || val.substring(0, 8) == 'C0010305') {
              dispatch('handleThreeCommandSuccess', {
                type: 'edrl',
                val: val,
                nextIndex: 3
              });
              return;
            }
          } else if (state.type_index == 3) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----循环次数-----');
            if (val.substring(0, 8) == 'c0010506' || val.substring(0, 8) == 'C0010506') {
              dispatch('handleThreeCommandSuccess', {
                type: 'xhcs',
                val: val,
                nextIndex: 4
              });
              return;
            }
          } else if (state.type_index == 4) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----SOC剩余容量百分比-----');
            if (val.substring(0, 8) == 'c0010307' || val.substring(0, 8) == 'C0010307') {
              dispatch('handleThreeCommandSuccess', {
                type: 'soc',
                val: val,
                nextIndex: 5
              });
              return;
            }
          } else if (state.type_index == 5) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----SOH 健康度 -----');
            if (val.substring(0, 8) == 'c0010308' || val.substring(0, 8) == 'C0010308') {
              dispatch('handleThreeCommandSuccess', {
                type: 'soh',
                val: val,
                nextIndex: 6
              });
              return;
            }
          } else if (state.type_index == 6) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----MOS状态-----');
            if (val.substring(0, 8) == 'c0010309' || val.substring(0, 8) == 'C0010309') {
              dispatch('handleThreeCommandSuccess', {
                type: 'mos',
                val: val,
                nextIndex: 7
              });
              return;
            }
          } else if (state.type_index == 7) {
            console.log('-----电芯-----');
            if ((val.substring(0, 8) == 'c0023201' || val.substring(0, 8) == 'C0023201') && val.substring(val.length - 2, val.length) == '0d') {
              console.log('苹果');
              console.log(val);
              dispatch('handleThreeCommandSuccess', {
                type: 'dx',
                val: val,
                nextIndex: 8
              });
              return;
            }
            console.log('安卓需要拼接');
            //需要拼接
            if (val.substring(0, 8) == 'c0023201' || val.substring(0, 8) == 'C0023201') {
              commit('DUANKAILIANJIE'); //清空数据
              commit('STRSUB', val);
              console.log('拼接');
              console.log(val);
            } else {
              if (val.substring(val.length - 2, val.length) == '0d') {
                // 清除当前的超时定时器（因为收到了回复）
                commit('CLEAR_THREE_TIMEOUT');
                commit('STRSUB', val);
                console.log('拼接完成');
                console.log(state.strLth);
                dispatch('handleThreeCommandSuccess', {
                  type: 'dx',
                  val: state.strLth,
                  nextIndex: 8
                });
                commit('DUANKAILIANJIE'); //清空数据
                return;
              } else {
                //保存数据
                commit('STRSUB', val);
              }
            }
          } else if (state.type_index == 8) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----温度-----');
            if (val.substring(0, 8) == 'c0020502' || val.substring(0, 8) == 'C0020502') {
              dispatch('handleThreeCommandSuccess', {
                type: 'wd',
                val: val,
                nextIndex: 9
              });
              return;
            }
          } else if (state.type_index == 9) {
            // 清除当前的超时定时器（因为收到了回复）
            commit('CLEAR_THREE_TIMEOUT');
            console.log('-----保护-----');
            if (val.substring(0, 8) == 'c0060503' || val.substring(0, 8) == 'C0060503') {
              dispatch('handleThreeCommandSuccess', {
                type: 'bh',
                val: val,
                nextIndex: 10 // 这里是10，表示完成所有指令
              });

              return;
            }
          }

          // 如果没有匹配到预期的响应，重新设置超时定时器
          if (state.three_timeout === null) {
            console.log('收到的数据不匹配预期，重新设置超时定时器');
            var timeout = setTimeout(function () {
              dispatch('handleThreeCommandTimeout');
            }, state.three_timeout_duration);
            commit('SET_THREE_TIMEOUT', timeout);
          }
        }
      });
    },
    //循环数据
    redaTimeOut: function redaTimeOut(_ref12) {
      var commit = _ref12.commit,
        dispatch = _ref12.dispatch,
        state = _ref12.state;
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      commit('CHANGETYPEINDEX', index);
      if (state.banzi_type == 1) {
        console.log('第一块板子');
        var obj = ['DDA50300FFFD77', 'DDA50400FFFC77'];
        dispatch('writeBLECharacteristicValue', obj[index]);
        var set = setTimeout(function () {
          if (!state.strLth && !state.dianchi && !state.yibiaopan) {
            //没获取到在执行一次
            dispatch('writeBLECharacteristicValue', obj[index]);
            commit('CHANGETYPEINDEX', index);
          }
          clearTimeout(set);
          set = null;
        }, 500);
      } else if (state.banzi_type == 2) {
        console.log('第二块板子开始循环获取数据');
        // 使用优化后的方法
        dispatch('sendTwoCommand', {
          index: index
        });
      } else if (state.banzi_type == 3) {
        console.log('第三块板子开始循环获取数据');
        // 使用优化后的方法
        dispatch('sendThreeCommand', {
          index: index
        });
      }
    },
    //向连接设备发送数据
    writeBLECharacteristicValue: function writeBLECharacteristicValue(_ref13, data) {
      var commit = _ref13.commit,
        state = _ref13.state;
      if (state.writeNews) {
        var msg = data;
        var buffer = new ArrayBuffer(msg.length / 2); // 定义 buffer 长度
        var dataView = new DataView(buffer); // 从二进制ArrayBuffer对象中读写多种数值类型
        var ind = 0;
        for (var i = 0, len = msg.length; i < len; i += 2) {
          var code = parseInt(msg.substr(i, 2), 16);
          dataView.setUint8(ind, code);
          ind++;
        }
        uni.writeBLECharacteristicValue({
          deviceId: state.writeNews.deviceId,
          serviceId: state.writeNews.serviceId,
          characteristicId: state.writeNews.characteristicId,
          value: buffer,
          writeType: 'writeNoResponse',
          success: function success(res) {
            console.log('写入数据成功');
          },
          fail: function fail(err) {
            console.log('写入数据失败');
          }
        });
      }
    }
  }
});
var _default = store;
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"], __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1)["default"]))

/***/ }),
/* 39 */
/*!**************************************************************************************!*\
  !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vuex3/dist/vuex.common.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * vuex v3.6.2
 * (c) 2021 Evan You
 * @license MIT
 */


function applyMixin (Vue) {
  var version = Number(Vue.version.split('.')[0]);

  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit });
  } else {
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    var _init = Vue.prototype._init;
    Vue.prototype._init = function (options) {
      if ( options === void 0 ) options = {};

      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit;
      _init.call(this, options);
    };
  }

  /**
   * Vuex init hook, injected into each instances init hooks list.
   */

  function vuexInit () {
    var options = this.$options;
    // store injection
    if (options.store) {
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store;
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store;
    }
  }
}

var target = typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
    ? global
    : {};
var devtoolHook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__;

function devtoolPlugin (store) {
  if (!devtoolHook) { return }

  store._devtoolHook = devtoolHook;

  devtoolHook.emit('vuex:init', store);

  devtoolHook.on('vuex:travel-to-state', function (targetState) {
    store.replaceState(targetState);
  });

  store.subscribe(function (mutation, state) {
    devtoolHook.emit('vuex:mutation', mutation, state);
  }, { prepend: true });

  store.subscribeAction(function (action, state) {
    devtoolHook.emit('vuex:action', action, state);
  }, { prepend: true });
}

/**
 * Get the first item that pass the test
 * by second argument function
 *
 * @param {Array} list
 * @param {Function} f
 * @return {*}
 */
function find (list, f) {
  return list.filter(f)[0]
}

/**
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 *
 * @param {*} obj
 * @param {Array<Object>} cache
 * @return {*}
 */
function deepCopy (obj, cache) {
  if ( cache === void 0 ) cache = [];

  // just return if obj is immutable value
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  var hit = find(cache, function (c) { return c.original === obj; });
  if (hit) {
    return hit.copy
  }

  var copy = Array.isArray(obj) ? [] : {};
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy: copy
  });

  Object.keys(obj).forEach(function (key) {
    copy[key] = deepCopy(obj[key], cache);
  });

  return copy
}

/**
 * forEach for object
 */
function forEachValue (obj, fn) {
  Object.keys(obj).forEach(function (key) { return fn(obj[key], key); });
}

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

function isPromise (val) {
  return val && typeof val.then === 'function'
}

function assert (condition, msg) {
  if (!condition) { throw new Error(("[vuex] " + msg)) }
}

function partial (fn, arg) {
  return function () {
    return fn(arg)
  }
}

// Base data struct for store's module, package with some attribute and method
var Module = function Module (rawModule, runtime) {
  this.runtime = runtime;
  // Store some children item
  this._children = Object.create(null);
  // Store the origin module object which passed by programmer
  this._rawModule = rawModule;
  var rawState = rawModule.state;

  // Store the origin module's state
  this.state = (typeof rawState === 'function' ? rawState() : rawState) || {};
};

var prototypeAccessors = { namespaced: { configurable: true } };

prototypeAccessors.namespaced.get = function () {
  return !!this._rawModule.namespaced
};

Module.prototype.addChild = function addChild (key, module) {
  this._children[key] = module;
};

Module.prototype.removeChild = function removeChild (key) {
  delete this._children[key];
};

Module.prototype.getChild = function getChild (key) {
  return this._children[key]
};

Module.prototype.hasChild = function hasChild (key) {
  return key in this._children
};

Module.prototype.update = function update (rawModule) {
  this._rawModule.namespaced = rawModule.namespaced;
  if (rawModule.actions) {
    this._rawModule.actions = rawModule.actions;
  }
  if (rawModule.mutations) {
    this._rawModule.mutations = rawModule.mutations;
  }
  if (rawModule.getters) {
    this._rawModule.getters = rawModule.getters;
  }
};

Module.prototype.forEachChild = function forEachChild (fn) {
  forEachValue(this._children, fn);
};

Module.prototype.forEachGetter = function forEachGetter (fn) {
  if (this._rawModule.getters) {
    forEachValue(this._rawModule.getters, fn);
  }
};

Module.prototype.forEachAction = function forEachAction (fn) {
  if (this._rawModule.actions) {
    forEachValue(this._rawModule.actions, fn);
  }
};

Module.prototype.forEachMutation = function forEachMutation (fn) {
  if (this._rawModule.mutations) {
    forEachValue(this._rawModule.mutations, fn);
  }
};

Object.defineProperties( Module.prototype, prototypeAccessors );

var ModuleCollection = function ModuleCollection (rawRootModule) {
  // register root module (Vuex.Store options)
  this.register([], rawRootModule, false);
};

ModuleCollection.prototype.get = function get (path) {
  return path.reduce(function (module, key) {
    return module.getChild(key)
  }, this.root)
};

ModuleCollection.prototype.getNamespace = function getNamespace (path) {
  var module = this.root;
  return path.reduce(function (namespace, key) {
    module = module.getChild(key);
    return namespace + (module.namespaced ? key + '/' : '')
  }, '')
};

ModuleCollection.prototype.update = function update$1 (rawRootModule) {
  update([], this.root, rawRootModule);
};

ModuleCollection.prototype.register = function register (path, rawModule, runtime) {
    var this$1 = this;
    if ( runtime === void 0 ) runtime = true;

  if ((true)) {
    assertRawModule(path, rawModule);
  }

  var newModule = new Module(rawModule, runtime);
  if (path.length === 0) {
    this.root = newModule;
  } else {
    var parent = this.get(path.slice(0, -1));
    parent.addChild(path[path.length - 1], newModule);
  }

  // register nested modules
  if (rawModule.modules) {
    forEachValue(rawModule.modules, function (rawChildModule, key) {
      this$1.register(path.concat(key), rawChildModule, runtime);
    });
  }
};

ModuleCollection.prototype.unregister = function unregister (path) {
  var parent = this.get(path.slice(0, -1));
  var key = path[path.length - 1];
  var child = parent.getChild(key);

  if (!child) {
    if ((true)) {
      console.warn(
        "[vuex] trying to unregister module '" + key + "', which is " +
        "not registered"
      );
    }
    return
  }

  if (!child.runtime) {
    return
  }

  parent.removeChild(key);
};

ModuleCollection.prototype.isRegistered = function isRegistered (path) {
  var parent = this.get(path.slice(0, -1));
  var key = path[path.length - 1];

  if (parent) {
    return parent.hasChild(key)
  }

  return false
};

function update (path, targetModule, newModule) {
  if ((true)) {
    assertRawModule(path, newModule);
  }

  // update target module
  targetModule.update(newModule);

  // update nested modules
  if (newModule.modules) {
    for (var key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if ((true)) {
          console.warn(
            "[vuex] trying to add a new module '" + key + "' on hot reloading, " +
            'manual reload is needed'
          );
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      );
    }
  }
}

var functionAssert = {
  assert: function (value) { return typeof value === 'function'; },
  expected: 'function'
};

var objectAssert = {
  assert: function (value) { return typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'); },
  expected: 'function or object with "handler" function'
};

var assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
};

function assertRawModule (path, rawModule) {
  Object.keys(assertTypes).forEach(function (key) {
    if (!rawModule[key]) { return }

    var assertOptions = assertTypes[key];

    forEachValue(rawModule[key], function (value, type) {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      );
    });
  });
}

function makeAssertionMessage (path, key, type, value, expected) {
  var buf = key + " should be " + expected + " but \"" + key + "." + type + "\"";
  if (path.length > 0) {
    buf += " in module \"" + (path.join('.')) + "\"";
  }
  buf += " is " + (JSON.stringify(value)) + ".";
  return buf
}

var Vue; // bind on install

var Store = function Store (options) {
  var this$1 = this;
  if ( options === void 0 ) options = {};

  // Auto install if it is not done yet and `window` has `Vue`.
  // To allow users to avoid auto-installation in some cases,
  // this code should be placed here. See #731
  if (!Vue && typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
  }

  if ((true)) {
    assert(Vue, "must call Vue.use(Vuex) before creating a store instance.");
    assert(typeof Promise !== 'undefined', "vuex requires a Promise polyfill in this browser.");
    assert(this instanceof Store, "store must be called with the new operator.");
  }

  var plugins = options.plugins; if ( plugins === void 0 ) plugins = [];
  var strict = options.strict; if ( strict === void 0 ) strict = false;

  // store internal state
  this._committing = false;
  this._actions = Object.create(null);
  this._actionSubscribers = [];
  this._mutations = Object.create(null);
  this._wrappedGetters = Object.create(null);
  this._modules = new ModuleCollection(options);
  this._modulesNamespaceMap = Object.create(null);
  this._subscribers = [];
  this._watcherVM = new Vue();
  this._makeLocalGettersCache = Object.create(null);

  // bind commit and dispatch to self
  var store = this;
  var ref = this;
  var dispatch = ref.dispatch;
  var commit = ref.commit;
  this.dispatch = function boundDispatch (type, payload) {
    return dispatch.call(store, type, payload)
  };
  this.commit = function boundCommit (type, payload, options) {
    return commit.call(store, type, payload, options)
  };

  // strict mode
  this.strict = strict;

  var state = this._modules.root.state;

  // init root module.
  // this also recursively registers all sub-modules
  // and collects all module getters inside this._wrappedGetters
  installModule(this, state, [], this._modules.root);

  // initialize the store vm, which is responsible for the reactivity
  // (also registers _wrappedGetters as computed properties)
  resetStoreVM(this, state);

  // apply plugins
  plugins.forEach(function (plugin) { return plugin(this$1); });

  var useDevtools = options.devtools !== undefined ? options.devtools : Vue.config.devtools;
  if (useDevtools) {
    devtoolPlugin(this);
  }
};

var prototypeAccessors$1 = { state: { configurable: true } };

prototypeAccessors$1.state.get = function () {
  return this._vm._data.$$state
};

prototypeAccessors$1.state.set = function (v) {
  if ((true)) {
    assert(false, "use store.replaceState() to explicit replace store state.");
  }
};

Store.prototype.commit = function commit (_type, _payload, _options) {
    var this$1 = this;

  // check object-style commit
  var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;

  var mutation = { type: type, payload: payload };
  var entry = this._mutations[type];
  if (!entry) {
    if ((true)) {
      console.error(("[vuex] unknown mutation type: " + type));
    }
    return
  }
  this._withCommit(function () {
    entry.forEach(function commitIterator (handler) {
      handler(payload);
    });
  });

  this._subscribers
    .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
    .forEach(function (sub) { return sub(mutation, this$1.state); });

  if (
    ( true) &&
    options && options.silent
  ) {
    console.warn(
      "[vuex] mutation type: " + type + ". Silent option has been removed. " +
      'Use the filter functionality in the vue-devtools'
    );
  }
};

Store.prototype.dispatch = function dispatch (_type, _payload) {
    var this$1 = this;

  // check object-style dispatch
  var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;

  var action = { type: type, payload: payload };
  var entry = this._actions[type];
  if (!entry) {
    if ((true)) {
      console.error(("[vuex] unknown action type: " + type));
    }
    return
  }

  try {
    this._actionSubscribers
      .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
      .filter(function (sub) { return sub.before; })
      .forEach(function (sub) { return sub.before(action, this$1.state); });
  } catch (e) {
    if ((true)) {
      console.warn("[vuex] error in before action subscribers: ");
      console.error(e);
    }
  }

  var result = entry.length > 1
    ? Promise.all(entry.map(function (handler) { return handler(payload); }))
    : entry[0](payload);

  return new Promise(function (resolve, reject) {
    result.then(function (res) {
      try {
        this$1._actionSubscribers
          .filter(function (sub) { return sub.after; })
          .forEach(function (sub) { return sub.after(action, this$1.state); });
      } catch (e) {
        if ((true)) {
          console.warn("[vuex] error in after action subscribers: ");
          console.error(e);
        }
      }
      resolve(res);
    }, function (error) {
      try {
        this$1._actionSubscribers
          .filter(function (sub) { return sub.error; })
          .forEach(function (sub) { return sub.error(action, this$1.state, error); });
      } catch (e) {
        if ((true)) {
          console.warn("[vuex] error in error action subscribers: ");
          console.error(e);
        }
      }
      reject(error);
    });
  })
};

Store.prototype.subscribe = function subscribe (fn, options) {
  return genericSubscribe(fn, this._subscribers, options)
};

Store.prototype.subscribeAction = function subscribeAction (fn, options) {
  var subs = typeof fn === 'function' ? { before: fn } : fn;
  return genericSubscribe(subs, this._actionSubscribers, options)
};

Store.prototype.watch = function watch (getter, cb, options) {
    var this$1 = this;

  if ((true)) {
    assert(typeof getter === 'function', "store.watch only accepts a function.");
  }
  return this._watcherVM.$watch(function () { return getter(this$1.state, this$1.getters); }, cb, options)
};

Store.prototype.replaceState = function replaceState (state) {
    var this$1 = this;

  this._withCommit(function () {
    this$1._vm._data.$$state = state;
  });
};

Store.prototype.registerModule = function registerModule (path, rawModule, options) {
    if ( options === void 0 ) options = {};

  if (typeof path === 'string') { path = [path]; }

  if ((true)) {
    assert(Array.isArray(path), "module path must be a string or an Array.");
    assert(path.length > 0, 'cannot register the root module by using registerModule.');
  }

  this._modules.register(path, rawModule);
  installModule(this, this.state, path, this._modules.get(path), options.preserveState);
  // reset store to update getters...
  resetStoreVM(this, this.state);
};

Store.prototype.unregisterModule = function unregisterModule (path) {
    var this$1 = this;

  if (typeof path === 'string') { path = [path]; }

  if ((true)) {
    assert(Array.isArray(path), "module path must be a string or an Array.");
  }

  this._modules.unregister(path);
  this._withCommit(function () {
    var parentState = getNestedState(this$1.state, path.slice(0, -1));
    Vue.delete(parentState, path[path.length - 1]);
  });
  resetStore(this);
};

Store.prototype.hasModule = function hasModule (path) {
  if (typeof path === 'string') { path = [path]; }

  if ((true)) {
    assert(Array.isArray(path), "module path must be a string or an Array.");
  }

  return this._modules.isRegistered(path)
};

Store.prototype[[104,111,116,85,112,100,97,116,101].map(function (item) {return String.fromCharCode(item)}).join('')] = function (newOptions) {
  this._modules.update(newOptions);
  resetStore(this, true);
};

Store.prototype._withCommit = function _withCommit (fn) {
  var committing = this._committing;
  this._committing = true;
  fn();
  this._committing = committing;
};

Object.defineProperties( Store.prototype, prototypeAccessors$1 );

function genericSubscribe (fn, subs, options) {
  if (subs.indexOf(fn) < 0) {
    options && options.prepend
      ? subs.unshift(fn)
      : subs.push(fn);
  }
  return function () {
    var i = subs.indexOf(fn);
    if (i > -1) {
      subs.splice(i, 1);
    }
  }
}

function resetStore (store, hot) {
  store._actions = Object.create(null);
  store._mutations = Object.create(null);
  store._wrappedGetters = Object.create(null);
  store._modulesNamespaceMap = Object.create(null);
  var state = store.state;
  // init all modules
  installModule(store, state, [], store._modules.root, true);
  // reset vm
  resetStoreVM(store, state, hot);
}

function resetStoreVM (store, state, hot) {
  var oldVm = store._vm;

  // bind store public getters
  store.getters = {};
  // reset local getters cache
  store._makeLocalGettersCache = Object.create(null);
  var wrappedGetters = store._wrappedGetters;
  var computed = {};
  forEachValue(wrappedGetters, function (fn, key) {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure environment.
    computed[key] = partial(fn, store);
    Object.defineProperty(store.getters, key, {
      get: function () { return store._vm[key]; },
      enumerable: true // for local getters
    });
  });

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  var silent = Vue.config.silent;
  Vue.config.silent = true;
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed: computed
  });
  Vue.config.silent = silent;

  // enable strict mode for new vm
  if (store.strict) {
    enableStrictMode(store);
  }

  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(function () {
        oldVm._data.$$state = null;
      });
    }
    Vue.nextTick(function () { return oldVm.$destroy(); });
  }
}

function installModule (store, rootState, path, module, hot) {
  var isRoot = !path.length;
  var namespace = store._modules.getNamespace(path);

  // register in namespace map
  if (module.namespaced) {
    if (store._modulesNamespaceMap[namespace] && ("development" !== 'production')) {
      console.error(("[vuex] duplicate namespace " + namespace + " for the namespaced module " + (path.join('/'))));
    }
    store._modulesNamespaceMap[namespace] = module;
  }

  // set state
  if (!isRoot && !hot) {
    var parentState = getNestedState(rootState, path.slice(0, -1));
    var moduleName = path[path.length - 1];
    store._withCommit(function () {
      if ((true)) {
        if (moduleName in parentState) {
          console.warn(
            ("[vuex] state field \"" + moduleName + "\" was overridden by a module with the same name at \"" + (path.join('.')) + "\"")
          );
        }
      }
      Vue.set(parentState, moduleName, module.state);
    });
  }

  var local = module.context = makeLocalContext(store, namespace, path);

  module.forEachMutation(function (mutation, key) {
    var namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });

  module.forEachAction(function (action, key) {
    var type = action.root ? key : namespace + key;
    var handler = action.handler || action;
    registerAction(store, type, handler, local);
  });

  module.forEachGetter(function (getter, key) {
    var namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });

  module.forEachChild(function (child, key) {
    installModule(store, rootState, path.concat(key), child, hot);
  });
}

/**
 * make localized dispatch, commit, getters and state
 * if there is no namespace, just use root ones
 */
function makeLocalContext (store, namespace, path) {
  var noNamespace = namespace === '';

  var local = {
    dispatch: noNamespace ? store.dispatch : function (_type, _payload, _options) {
      var args = unifyObjectStyle(_type, _payload, _options);
      var payload = args.payload;
      var options = args.options;
      var type = args.type;

      if (!options || !options.root) {
        type = namespace + type;
        if (( true) && !store._actions[type]) {
          console.error(("[vuex] unknown local action type: " + (args.type) + ", global type: " + type));
          return
        }
      }

      return store.dispatch(type, payload)
    },

    commit: noNamespace ? store.commit : function (_type, _payload, _options) {
      var args = unifyObjectStyle(_type, _payload, _options);
      var payload = args.payload;
      var options = args.options;
      var type = args.type;

      if (!options || !options.root) {
        type = namespace + type;
        if (( true) && !store._mutations[type]) {
          console.error(("[vuex] unknown local mutation type: " + (args.type) + ", global type: " + type));
          return
        }
      }

      store.commit(type, payload, options);
    }
  };

  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? function () { return store.getters; }
        : function () { return makeLocalGetters(store, namespace); }
    },
    state: {
      get: function () { return getNestedState(store.state, path); }
    }
  });

  return local
}

function makeLocalGetters (store, namespace) {
  if (!store._makeLocalGettersCache[namespace]) {
    var gettersProxy = {};
    var splitPos = namespace.length;
    Object.keys(store.getters).forEach(function (type) {
      // skip if the target getter is not match this namespace
      if (type.slice(0, splitPos) !== namespace) { return }

      // extract local getter type
      var localType = type.slice(splitPos);

      // Add a port to the getters proxy.
      // Define as getter property because
      // we do not want to evaluate the getters in this time.
      Object.defineProperty(gettersProxy, localType, {
        get: function () { return store.getters[type]; },
        enumerable: true
      });
    });
    store._makeLocalGettersCache[namespace] = gettersProxy;
  }

  return store._makeLocalGettersCache[namespace]
}

function registerMutation (store, type, handler, local) {
  var entry = store._mutations[type] || (store._mutations[type] = []);
  entry.push(function wrappedMutationHandler (payload) {
    handler.call(store, local.state, payload);
  });
}

function registerAction (store, type, handler, local) {
  var entry = store._actions[type] || (store._actions[type] = []);
  entry.push(function wrappedActionHandler (payload) {
    var res = handler.call(store, {
      dispatch: local.dispatch,
      commit: local.commit,
      getters: local.getters,
      state: local.state,
      rootGetters: store.getters,
      rootState: store.state
    }, payload);
    if (!isPromise(res)) {
      res = Promise.resolve(res);
    }
    if (store._devtoolHook) {
      return res.catch(function (err) {
        store._devtoolHook.emit('vuex:error', err);
        throw err
      })
    } else {
      return res
    }
  });
}

function registerGetter (store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) {
    if ((true)) {
      console.error(("[vuex] duplicate getter key: " + type));
    }
    return
  }
  store._wrappedGetters[type] = function wrappedGetter (store) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    )
  };
}

function enableStrictMode (store) {
  store._vm.$watch(function () { return this._data.$$state }, function () {
    if ((true)) {
      assert(store._committing, "do not mutate vuex store state outside mutation handlers.");
    }
  }, { deep: true, sync: true });
}

function getNestedState (state, path) {
  return path.reduce(function (state, key) { return state[key]; }, state)
}

function unifyObjectStyle (type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload;
    payload = type;
    type = type.type;
  }

  if ((true)) {
    assert(typeof type === 'string', ("expects string as the type, but found " + (typeof type) + "."));
  }

  return { type: type, payload: payload, options: options }
}

function install (_Vue) {
  if (Vue && _Vue === Vue) {
    if ((true)) {
      console.error(
        '[vuex] already installed. Vue.use(Vuex) should be called only once.'
      );
    }
    return
  }
  Vue = _Vue;
  applyMixin(Vue);
}

/**
 * Reduce the code which written in Vue.js for getting the state.
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} states # Object's item can be a function which accept state and getters for param, you can do something for state and getters in it.
 * @param {Object}
 */
var mapState = normalizeNamespace(function (namespace, states) {
  var res = {};
  if (( true) && !isValidMap(states)) {
    console.error('[vuex] mapState: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(states).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    res[key] = function mappedState () {
      var state = this.$store.state;
      var getters = this.$store.getters;
      if (namespace) {
        var module = getModuleByNamespace(this.$store, 'mapState', namespace);
        if (!module) {
          return
        }
        state = module.context.state;
        getters = module.context.getters;
      }
      return typeof val === 'function'
        ? val.call(this, state, getters)
        : state[val]
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res
});

/**
 * Reduce the code which written in Vue.js for committing the mutation
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} mutations # Object's item can be a function which accept `commit` function as the first param, it can accept another params. You can commit mutation and do any other things in this function. specially, You need to pass anthor params from the mapped function.
 * @return {Object}
 */
var mapMutations = normalizeNamespace(function (namespace, mutations) {
  var res = {};
  if (( true) && !isValidMap(mutations)) {
    console.error('[vuex] mapMutations: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(mutations).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    res[key] = function mappedMutation () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // Get the commit method from store
      var commit = this.$store.commit;
      if (namespace) {
        var module = getModuleByNamespace(this.$store, 'mapMutations', namespace);
        if (!module) {
          return
        }
        commit = module.context.commit;
      }
      return typeof val === 'function'
        ? val.apply(this, [commit].concat(args))
        : commit.apply(this.$store, [val].concat(args))
    };
  });
  return res
});

/**
 * Reduce the code which written in Vue.js for getting the getters
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} getters
 * @return {Object}
 */
var mapGetters = normalizeNamespace(function (namespace, getters) {
  var res = {};
  if (( true) && !isValidMap(getters)) {
    console.error('[vuex] mapGetters: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(getters).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    // The namespace has been mutated by normalizeNamespace
    val = namespace + val;
    res[key] = function mappedGetter () {
      if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) {
        return
      }
      if (( true) && !(val in this.$store.getters)) {
        console.error(("[vuex] unknown getter: " + val));
        return
      }
      return this.$store.getters[val]
    };
    // mark vuex getter for devtools
    res[key].vuex = true;
  });
  return res
});

/**
 * Reduce the code which written in Vue.js for dispatch the action
 * @param {String} [namespace] - Module's namespace
 * @param {Object|Array} actions # Object's item can be a function which accept `dispatch` function as the first param, it can accept anthor params. You can dispatch action and do any other things in this function. specially, You need to pass anthor params from the mapped function.
 * @return {Object}
 */
var mapActions = normalizeNamespace(function (namespace, actions) {
  var res = {};
  if (( true) && !isValidMap(actions)) {
    console.error('[vuex] mapActions: mapper parameter must be either an Array or an Object');
  }
  normalizeMap(actions).forEach(function (ref) {
    var key = ref.key;
    var val = ref.val;

    res[key] = function mappedAction () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // get dispatch function from store
      var dispatch = this.$store.dispatch;
      if (namespace) {
        var module = getModuleByNamespace(this.$store, 'mapActions', namespace);
        if (!module) {
          return
        }
        dispatch = module.context.dispatch;
      }
      return typeof val === 'function'
        ? val.apply(this, [dispatch].concat(args))
        : dispatch.apply(this.$store, [val].concat(args))
    };
  });
  return res
});

/**
 * Rebinding namespace param for mapXXX function in special scoped, and return them by simple object
 * @param {String} namespace
 * @return {Object}
 */
var createNamespacedHelpers = function (namespace) { return ({
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace)
}); };

/**
 * Normalize the map
 * normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }, { key: 3, val: 3 } ]
 * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
 * @param {Array|Object} map
 * @return {Object}
 */
function normalizeMap (map) {
  if (!isValidMap(map)) {
    return []
  }
  return Array.isArray(map)
    ? map.map(function (key) { return ({ key: key, val: key }); })
    : Object.keys(map).map(function (key) { return ({ key: key, val: map[key] }); })
}

/**
 * Validate whether given map is valid or not
 * @param {*} map
 * @return {Boolean}
 */
function isValidMap (map) {
  return Array.isArray(map) || isObject(map)
}

/**
 * Return a function expect two param contains namespace and map. it will normalize the namespace and then the param's function will handle the new namespace and the map.
 * @param {Function} fn
 * @return {Function}
 */
function normalizeNamespace (fn) {
  return function (namespace, map) {
    if (typeof namespace !== 'string') {
      map = namespace;
      namespace = '';
    } else if (namespace.charAt(namespace.length - 1) !== '/') {
      namespace += '/';
    }
    return fn(namespace, map)
  }
}

/**
 * Search a special module from store by namespace. if module not exist, print error message.
 * @param {Object} store
 * @param {String} helper
 * @param {String} namespace
 * @return {Object}
 */
function getModuleByNamespace (store, helper, namespace) {
  var module = store._modulesNamespaceMap[namespace];
  if (( true) && !module) {
    console.error(("[vuex] module namespace not found in " + helper + "(): " + namespace));
  }
  return module
}

// Credits: borrowed code from fcomb/redux-logger

function createLogger (ref) {
  if ( ref === void 0 ) ref = {};
  var collapsed = ref.collapsed; if ( collapsed === void 0 ) collapsed = true;
  var filter = ref.filter; if ( filter === void 0 ) filter = function (mutation, stateBefore, stateAfter) { return true; };
  var transformer = ref.transformer; if ( transformer === void 0 ) transformer = function (state) { return state; };
  var mutationTransformer = ref.mutationTransformer; if ( mutationTransformer === void 0 ) mutationTransformer = function (mut) { return mut; };
  var actionFilter = ref.actionFilter; if ( actionFilter === void 0 ) actionFilter = function (action, state) { return true; };
  var actionTransformer = ref.actionTransformer; if ( actionTransformer === void 0 ) actionTransformer = function (act) { return act; };
  var logMutations = ref.logMutations; if ( logMutations === void 0 ) logMutations = true;
  var logActions = ref.logActions; if ( logActions === void 0 ) logActions = true;
  var logger = ref.logger; if ( logger === void 0 ) logger = console;

  return function (store) {
    var prevState = deepCopy(store.state);

    if (typeof logger === 'undefined') {
      return
    }

    if (logMutations) {
      store.subscribe(function (mutation, state) {
        var nextState = deepCopy(state);

        if (filter(mutation, prevState, nextState)) {
          var formattedTime = getFormattedTime();
          var formattedMutation = mutationTransformer(mutation);
          var message = "mutation " + (mutation.type) + formattedTime;

          startMessage(logger, message, collapsed);
          logger.log('%c prev state', 'color: #9E9E9E; font-weight: bold', transformer(prevState));
          logger.log('%c mutation', 'color: #03A9F4; font-weight: bold', formattedMutation);
          logger.log('%c next state', 'color: #4CAF50; font-weight: bold', transformer(nextState));
          endMessage(logger);
        }

        prevState = nextState;
      });
    }

    if (logActions) {
      store.subscribeAction(function (action, state) {
        if (actionFilter(action, state)) {
          var formattedTime = getFormattedTime();
          var formattedAction = actionTransformer(action);
          var message = "action " + (action.type) + formattedTime;

          startMessage(logger, message, collapsed);
          logger.log('%c action', 'color: #03A9F4; font-weight: bold', formattedAction);
          endMessage(logger);
        }
      });
    }
  }
}

function startMessage (logger, message, collapsed) {
  var startMessage = collapsed
    ? logger.groupCollapsed
    : logger.group;

  // render
  try {
    startMessage.call(logger, message);
  } catch (e) {
    logger.log(message);
  }
}

function endMessage (logger) {
  try {
    logger.groupEnd();
  } catch (e) {
    logger.log('—— log end ——');
  }
}

function getFormattedTime () {
  var time = new Date();
  return (" @ " + (pad(time.getHours(), 2)) + ":" + (pad(time.getMinutes(), 2)) + ":" + (pad(time.getSeconds(), 2)) + "." + (pad(time.getMilliseconds(), 3)))
}

function repeat (str, times) {
  return (new Array(times + 1)).join(str)
}

function pad (num, maxLength) {
  return repeat('0', maxLength - num.toString().length) + num
}

var index_cjs = {
  Store: Store,
  install: install,
  version: '3.6.2',
  mapState: mapState,
  mapMutations: mapMutations,
  mapGetters: mapGetters,
  mapActions: mapActions,
  createNamespacedHelpers: createNamespacedHelpers,
  createLogger: createLogger
};

module.exports = index_cjs;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../../webpack/buildin/global.js */ 3)))

/***/ }),
/* 40 */
/*!****************************************************!*\
  !*** /Users/liran/Desktop/superPower/unit/unit.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _toConsumableArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ 18));
//ArrayBuffer转16进制字符串
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
    return ('00' + bit.toString(16)).slice(-2);
  });
  return hexArr.join('');
}
//第二个板子完整性校验
function crc16Modbus(hexString) {
  // 找到"fe"的位置
  var feIndex = hexString.toLowerCase().indexOf('fe');
  if (feIndex === -1) {
    throw new Error('未找到起始标志"fe"');
  }
  // 从"fe"开始，到倒数第6位结束的数据
  // 倒数第6位就是总长度-6的位置
  var endIndex = hexString.length - 6;
  var dataToCheck = hexString.slice(feIndex, endIndex);
  // 将十六进制字符串转换为字节数组
  var bytes = [];
  for (var i = 0; i < dataToCheck.length; i += 2) {
    bytes.push(parseInt(dataToCheck.substr(i, 2), 16));
  }
  var crc = 0xFFFF; // CRC-16/MODBUS 初始值
  for (var _i = 0; _i < bytes.length; _i++) {
    crc ^= bytes[_i];
    for (var j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = crc >> 1 ^ 0xA001; // CRC-16/MODBUS 多项式
      } else {
        crc = crc >> 1;
      }
    }
  }
  // 返回计算出的CRC值（小端序，低字节在前）
  var crcLow = crc & 0xFF;
  var crcHigh = crc >> 8 & 0xFF;
  // 返回十六进制字符串格式
  return crcLow.toString(16).padStart(2, '0') + crcHigh.toString(16).padStart(2, '0');
}
//获取第二个板子的校验值
function getcrc16Modbus(hexString) {
  // 将十六进制字符串转换为字节数组
  var bytes = [];
  for (var i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }
  var crc = 0xFFFF; // CRC-16/MODBUS 初始值
  for (var _i2 = 0; _i2 < bytes.length; _i2++) {
    crc ^= bytes[_i2];
    for (var j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = crc >> 1 ^ 0xA001; // CRC-16/MODBUS 多项式
      } else {
        crc = crc >> 1;
      }
    }
  }
  // 返回计算出的CRC值（小端序，低字节在前）
  var crcLow = crc & 0xFF;
  var crcHigh = crc >> 8 & 0xFF;
  // 返回十六进制字符串格式
  return crcLow.toString(16).padStart(2, '0') + crcHigh.toString(16).padStart(2, '0');
}
//校验返回数据的完整性
function validateChecksum(detail) {
  if (!detail || detail.length < 10) return false;
  // 提取中间的数据部分并转换为字节数组
  var hexData = detail.substring(4, detail.length - 6);
  var data = [];
  for (var i = 0; i < hexData.length; i += 2) {
    var byte = parseInt(hexData.substr(i, 2), 16);
    if (!isNaN(byte)) {
      data.push(byte);
    }
  }
  // 计算校验和
  var sum = data.reduce(function (acc, byte) {
    return acc + byte;
  }, 0);
  var checksum = ~sum + 1 & 0xFFFF;
  // 格式化为4位16进制字符串
  var calculatedChecksum = checksum.toString(16).padStart(4, '0').toLowerCase();
  // 提取期望的校验和
  var expectedChecksum = detail.substring(detail.length - 6, detail.length - 2).toLowerCase();
  return calculatedChecksum === expectedChecksum;
}
//生成校验值
function sc_validateChecksum(detail) {
  if (!detail || detail.length < 10) return false;
  // 提取中间的数据部分并转换为字节数组
  var hexData = detail.substring(4, detail.length - 6);
  var data = [];
  for (var i = 0; i < hexData.length; i += 2) {
    var byte = parseInt(hexData.substr(i, 2), 16);
    if (!isNaN(byte)) {
      data.push(byte);
    }
  }
  // 计算校验和
  var sum = data.reduce(function (acc, byte) {
    return acc + byte;
  }, 0);
  var checksum = ~sum + 1 & 0xFFFF;
  // 格式化为4位16进制字符串
  var calculatedChecksum = checksum.toString(16).padStart(4, '0').toLowerCase();
  return calculatedChecksum;
}
//生成校验值
function scrt_validateChecksum(detail) {
  if (!detail || detail.length < 10) return false;
  // 提取中间的数据部分并转换为字节数组
  var hexData = detail;
  var data = [];
  for (var i = 0; i < hexData.length; i += 2) {
    var byte = parseInt(hexData.substr(i, 2), 16);
    if (!isNaN(byte)) {
      data.push(byte);
    }
  }
  // 计算校验和
  var sum = data.reduce(function (acc, byte) {
    return acc + byte;
  }, 0);
  var checksum = ~sum + 1 & 0xFFFF;
  // 格式化为4位16进制字符串
  var calculatedChecksum = checksum.toString(16).padStart(4, '0').toLowerCase();
  return calculatedChecksum;
}
//校验返回数据的完整性
function wanzheng(val) {
  var a = val.substring(6, 8);
  var b = parseInt(a, 16) * 2;
  var c = val.substring(8, val.length);
  if (b == c.length) {
    var start = false;
    var end = false;
    if (val.substring(0, 2) == 'DD' || val.substring(0, 2) == 'dd') {
      start = true;
    }
    if (val.substring(val.length - 2, val.length) == '77') {
      end = true;
    }
    if (start && end) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

//补足8位
function chunkString(str) {
  var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  var reg = new RegExp(".{1,".concat(size, "}"), 'g');
  return str.match(reg) || [];
}

//crc 校验
function calculateCRC16Modbus(dataHexString) {
  var dataBytes = [];
  for (var i = 0; i < dataHexString.length; i += 2) {
    dataBytes.push(parseInt(dataHexString.substr(i, 2), 16));
  }
  var crc = 0xFFFF;
  var polynomial = 0xA001;
  for (var _i3 = 0, _dataBytes = dataBytes; _i3 < _dataBytes.length; _i3++) {
    var byte = _dataBytes[_i3];
    crc ^= byte;
    for (var _i4 = 0; _i4 < 8; _i4++) {
      if (crc & 0x0001) {
        crc = (crc >> 1 ^ polynomial) & 0xFFFF;
      } else {
        crc >>= 1;
      }
    }
  }
  var jieguo = crc.toString(16).toUpperCase();
  jieguo = jieguo.padStart(4, '0');
  //两两分割，后交换位置
  var chuliqian = jieguo.match(/.{1,2}/g);
  var newJetguo = chuliqian[1] + chuliqian[0];
  newJetguo = newJetguo.padStart(4, '0');
  return newJetguo;
}
// BMS数据完整性校验函数
function validateBMSData(hexData) {
  try {
    // 将十六进制字符串转换为字节数组
    var bytes = hexData.replace(/\s+/g, '').match(/.{2}/g).map(function (hex) {
      return parseInt(hex, 16);
    });

    // 基本格式检查
    if (bytes.length < 7) return false; // 最小长度检查
    if (bytes[0] !== 0xDD) return false; // 帧头检查
    if (bytes[bytes.length - 1] !== 0x77) return false; // 帧尾检查

    // 提取数据部分进行校验（从第2个字节到倒数第3个字节）
    var dataBytes = bytes.slice(1, bytes.length - 3);

    // 计算累加和
    var sum = 0;
    for (var i = 0; i < dataBytes.length; i++) {
      sum += dataBytes[i];
    }

    // 计算校验码（16位补码）
    var checksum16 = ~sum + 1 & 0xFFFF;
    var calculatedHigh = checksum16 >> 8 & 0xFF;
    var calculatedLow = checksum16 & 0xFF;

    // 获取原始校验码
    var originalHigh = bytes[bytes.length - 3];
    var originalLow = bytes[bytes.length - 2];
    console.log(calculatedHigh);
    console.log(originalHigh);
    console.log(calculatedLow);
    console.log(originalLow);
    // 校验码比较
    return calculatedHigh === originalHigh && calculatedLow === originalLow;
  } catch (error) {
    return false; // 解析错误返回false
  }
}
//处理时间函数
function getFullTime(t) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$hour = options.hour,
    hour = _options$hour === void 0 ? "H" : _options$hour,
    _options$minute = options.minute,
    minute = _options$minute === void 0 ? "M" : _options$minute,
    _options$fullM = options.fullM,
    fullM = _options$fullM === void 0 ? "Min" : _options$fullM,
    _options$showAll = options.showAll,
    showAll = _options$showAll === void 0 ? false : _options$showAll;
  var addLeft0 = function addLeft0(str, length) {
    return str.padStart(length, '0');
  };
  var p = Math.floor(t / 60 % 60).toString();
  var h = Math.floor(t / 3600);
  if (showAll || h > 0) {
    p = "".concat(addLeft0(h.toString(), 2)).concat(hour).concat(addLeft0(p, 2)).concat(minute);
  } else {
    p = "".concat(p).concat(fullM);
  }
  return p;
}
function rssiToMeters(rssi) {
  // 修正公式，确保不会出现负距离
  var txPower = -59; // 1米处的参考RSSI值
  var pathLoss = 2.0; // 路径损耗指数

  if (rssi >= 0) {
    return -1; // RSSI不应该为正值
  }

  // 如果RSSI比参考值还强，说明距离很近
  if (rssi > txPower) {
    return 0.1; // 最小距离0.1米
  }

  // 计算距离：10^((txPower - rssi) / (10 * n))
  // 注意：txPower - rssi，当rssi < txPower时结果为正
  var distance = Math.pow(10, (txPower - rssi) / (10 * pathLoss));

  // 根据距离范围进行精度处理
  if (distance < 1) {
    // 小于1米，精度0.1米
    return Math.round(distance * 10) / 10;
  } else {
    // 大于等于1米，精度1米
    return Math.round(distance);
  }
}
function parseDate(value) {
  // 输入验证
  if (value < 0 || value > 0xFFFF) {
    return {
      error: "值超出2字节范围"
    };
  }

  // 日期 = 最低5位
  var day = value & 0x1F;

  // 月份 = 右移5位后取低4位
  var month = value >> 5 & 0x0F;

  // 年份 = 右移9位后 + 2000
  var year = 2000 + (value >> 9);

  // 验证日期有效性
  if (month < 1 || month > 12) {
    return {
      error: "月份无效"
    };
  }
  if (day < 1 || day > 31) {
    return {
      error: "日期无效"
    };
  }
  return {
    year: year,
    month: month,
    day: day,
    dateString: "".concat(year, "-").concat(month.toString().padStart(2, '0'), "-").concat(day.toString().padStart(2, '0')),
    hex: "0x".concat(value.toString(16).toUpperCase().padStart(4, '0'))
  };
}
// 日期字符串转换为2字节数值
function dateStringToValue(dateString) {
  // 输入验证
  if (!dateString || typeof dateString !== 'string') {
    return {
      error: "请输入有效的日期字符串"
    };
  }

  // 解析日期字符串
  var dateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  var match = dateString.match(dateRegex);
  if (!match) {
    return {
      error: "日期格式错误，请使用 YYYY-MM-DD 格式"
    };
  }
  var year = parseInt(match[1], 10);
  var month = parseInt(match[2], 10);
  var day = parseInt(match[3], 10);

  // 验证范围
  if (year < 2000 || year > 2127) {
    return {
      error: "年份范围: 2000-2127"
    };
  }
  if (month < 1 || month > 12) {
    return {
      error: "月份范围: 1-12"
    };
  }
  if (day < 1 || day > 31) {
    return {
      error: "日期范围: 1-31"
    };
  }

  // 编码: 年份(7位) + 月份(4位) + 日期(5位)
  var yearBits = year - 2000 << 9; // 年份偏移量左移9位
  var monthBits = month << 5; // 月份左移5位
  var dayBits = day; // 日期占低5位

  var value = yearBits | monthBits | dayBits;
  return {
    decimal: value,
    hex: "0x".concat(value.toString(16).toUpperCase().padStart(4, '0')),
    binary: "0b".concat(value.toString(2).padStart(16, '0')),
    input: dateString,
    parsed: {
      year: year,
      month: month,
      day: day
    }
  };
}
function arrayToHex(arr) {
  var autoReverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var processedArr = (0, _toConsumableArray2.default)(arr); // 创建副本避免修改原数组

  if (autoReverse) {
    // 检查是否需要反转（移植自Dart逻辑）
    var start = (arr[0] & 0xFF).toString(16).toLowerCase();
    var end = (arr[arr.length - 1] & 0xFF).toString(16).toLowerCase();
    var isReversed = start !== "a4" && start !== "a5" && (end === "a4" || end === "a5");
    if (isReversed) {
      processedArr = arr.slice().reverse(); // 反转数组
    }
  }

  return processedArr.map(function (num) {
    // 将数字转换为8位有符号整数，然后转为无符号8位表示
    var byte = num & 0xFF;
    // 转为16进制，补零到2位，转大写
    return byte.toString(16).toUpperCase().padStart(2, '0');
  }).join(':');
}
var _default = {
  ab2hex: ab2hex,
  wanzheng: wanzheng,
  chunkString: chunkString,
  calculateCRC16Modbus: calculateCRC16Modbus,
  validateBMSData: validateBMSData,
  getFullTime: getFullTime,
  validateChecksum: validateChecksum,
  rssiToMeters: rssiToMeters,
  parseDate: parseDate,
  sc_validateChecksum: sc_validateChecksum,
  arrayToHex: arrayToHex,
  crc16Modbus: crc16Modbus,
  getcrc16Modbus: getcrc16Modbus,
  scrt_validateChecksum: scrt_validateChecksum
};
exports.default = _default;

/***/ }),
/* 41 */
/*!*******************************************************!*\
  !*** /Users/liran/Desktop/superPower/unit/request.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _regenerator = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/regenerator */ 42));
var _toConsumableArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ 18));
var _asyncToGenerator2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ 44));
var _unit = _interopRequireDefault(__webpack_require__(/*! @/unit/unit.js */ 40));
//指令处理
function zhilingchuli(_x) {
  return _zhilingchuli.apply(this, arguments);
} //处理数据 
function _zhilingchuli() {
  _zhilingchuli = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(item) {
    var yibiaopan, dianchi, setting_data_one, setting_data_two, setting_data_three, setting, lanyaInfo;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            yibiaopan = item.yibiaopan.slice(8, -6);
            ; //仪表盘
            dianchi = item.dianchi.slice(8, -6);
            ; //电池
            //设置数据
            setting_data_one = item.setting_data_one.slice(14, -6);
            setting_data_two = item.setting_data_two.slice(14, -6);
            setting_data_three = item.setting_data_three.slice(14, -6);
            setting = setting_data_one + setting_data_two + setting_data_three; //蓝牙信息
            lanyaInfo = item.lanyaInfo;
            _context.next = 11;
            return chuli(yibiaopan, dianchi, setting, lanyaInfo);
          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _zhilingchuli.apply(this, arguments);
}
function chuli(_x2, _x3, _x4, _x5) {
  return _chuli.apply(this, arguments);
} // 发送请求
function _chuli() {
  _chuli = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2(yibiaopan, dianchi, setting, lanyaInfo) {
    var lth, e, f, arr, i, zhong, zhong_dianya, group, _i, maxValue, minValue, avgValue, cfdkg, cd_state, fd_state, wendu, wenkong_num, baohu, baohu_arr, protections, fdgl, gnpz, Bite0, Bite1, Bite2, Bite3, Bite4, Bite5, Bite6, Bite7, Bite8, Bite9, Bite10, wdttpz, ntc1, ntc2, ntc3, ntc4, ntc5, ntc6, ntc7, ntc8, data;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            //===================================电池===================================
            //电池
            lth = dianchi.length / 4;
            e = 0;
            f = 4;
            arr = [];
            for (i = 0; i < lth; i++) {
              arr.push(parseInt(dianchi.slice(e, f), 16) / 1000);
              e += 4;
              f += 4;
            }
            zhong = 0;
            arr.forEach(function (item) {
              zhong += item;
            });
            zhong_dianya = zhong.toFixed(3);
            group = [];
            for (_i = 0; _i < arr.length; _i++) {
              group.push(arr[_i].toString());
            }
            // 取出最大值和最小值
            maxValue = Math.max.apply(Math, arr);
            minValue = Math.min.apply(Math, arr);
            avgValue = (arr.reduce(function (sum, current) {
              return sum + current;
            }, 0) / arr.length).toFixed(3); //===================================仪表盘===================================
            //充电开关，放点开关
            cfdkg = parseInt(yibiaopan.substring(40, 42), 16).toString(2);
            cd_state = parseInt(cfdkg.substring(0, 1));
            fd_state = parseInt(cfdkg.substring(1, 2)); //温度
            wenkong_num = parseInt(yibiaopan.substring(44, 46), 16); //温度的个数
            if (wenkong_num) {
              wendu = (parseInt(yibiaopan.substring(46, 50), 16) - 2731) / 10;
            }
            //保护
            baohu = parseInt(yibiaopan.substring(32, 36), 16).toString(2).padStart(11, '0').split('').reverse().join('');
            baohu_arr = [];
            protections = ['单体过压保护', '单体欠压保护', '整组过压保护', '整组欠压保护', '充电过温保护', '充电低温保护', '放电过温保护', '放电低温保护', '充电过流保护', '放电过流保护', '短路保护'];
            baohu_arr.push.apply(baohu_arr, (0, _toConsumableArray2.default)(protections.filter(function (item, index) {
              return parseInt(baohu[index]);
            })));
            //===================================设置===================================
            //放电过流
            fdgl = (parseInt(setting.substring(100, 104), 16) / 100).toFixed(2) * 100;
            fdgl = (65536 - fdgl) * 10 / 1000;
            //功能配置
            gnpz = parseInt(setting.substring(116, 120), 16).toString(2).padStart(11, '0');
            gnpz = gnpz.split('').reverse();
            Bite0 = parseInt(gnpz[0]); // 短路负载检测功能
            Bite1 = parseInt(gnpz[1]); // 均衡功能  
            Bite2 = parseInt(gnpz[2]); // 充电均衡
            Bite3 = parseInt(gnpz[3]); // LED_使能
            Bite4 = parseInt(gnpz[4]); // LED_数量
            Bite5 = parseInt(gnpz[5]); // fcc限制
            Bite6 = parseInt(gnpz[6]); // rtc使能
            Bite7 = parseInt(gnpz[7]); // 充电握手功能
            Bite8 = parseInt(gnpz[8]); // gps功能
            Bite9 = parseInt(gnpz[9]); // 蜂鸣器功能
            Bite10 = parseInt(gnpz[10]); // 蜂鸣器功能
            //温度探头配置
            wdttpz = parseInt(setting.substring(120, 124), 16).toString(2).padStart(8, '0');
            wdttpz = wdttpz.split('').reverse();
            ntc1 = parseInt(wdttpz[0]); //1
            ntc2 = parseInt(wdttpz[1]); //2
            ntc3 = parseInt(wdttpz[2]); //3
            ntc4 = parseInt(wdttpz[3]); //4
            ntc5 = parseInt(wdttpz[4]); //5
            ntc6 = parseInt(wdttpz[5]); //6
            ntc7 = parseInt(wdttpz[6]); //7
            ntc8 = parseInt(wdttpz[7]); //8
            //总
            data = {
              macAddr: lanyaInfo.iosMac || lanyaInfo.deviceId,
              //设备MAC地址
              company_id: 70,
              //所属公司ID
              data: {
                latlng: "",
                //经纬度
                //设备基础信息
                basicInfo: {
                  bluetoothName: lanyaInfo.name,
                  //蓝牙名称
                  bmsAddr: lanyaInfo.iosMac || lanyaInfo.deviceId,
                  softwareVersion: '',
                  ratedDischargeCurrent: '' + 'A',
                  ratedDischargePower: "" + 'W',
                  producedDate: _unit.default.parseDate(parseInt(setting.substring(20, 24), 16)).dateString,
                  //生产日期
                  ratedChargingCurrent: (parseInt(yibiaopan.substring(4, 8), 16) / 100).toFixed(1) + 'A',
                  //额定充电电流
                  ratedChargingVolgate: (parseInt(yibiaopan.substring(0, 4), 16) / 100).toFixed(1) + 'V',
                  //额定充电电压
                  fault_content: baohu_arr
                },
                //设备初始设置
                initData: {
                  fullChargeCapacity: '' + 'Ah',
                  nominalCapacity: parseInt(setting.substring(0, 4), 16) / 100 + 'Ah',
                  // integer 标称容量
                  cyclicCapacity: parseInt(setting.substring(4, 8), 16) / 100 + 'Ah',
                  // integer 循环容量
                  cellNumber: parseInt(setting.substring(28, 32), 16) + 'Ah' // string 循环次数
                },

                //设备实时信息
                deivceRealtimeInfo: {
                  soc: parseInt(yibiaopan.substring(38, 40), 16),
                  // integer 容量百分比 >= 0 <= 100
                  surplusCapacity: parseInt(yibiaopan.substring(8, 12), 16),
                  // number 剩余容量
                  totalVoltage: zhong_dianya,
                  // number 总电压
                  electricity: (parseInt(yibiaopan.substring(4, 8), 16) / 100).toFixed(1),
                  // number 电流
                  power: (parseInt(yibiaopan.substring(0, 4), 16) / 100).toFixed(1) * (parseInt(yibiaopan.substring(4, 8), 16) / 100).toFixed(1),
                  // number 功率
                  ceilingVoltage: maxValue,
                  // integer 最高电压
                  minimumVoltage: minValue,
                  // number 最低电压
                  avgVoltage: avgValue,
                  // number 平均电压
                  cycleIndex: parseInt(yibiaopan.substring(16, 20), 16),
                  // integer 循环次数
                  temperatures: [wendu + '℉'],
                  equilibriumStatus: parseInt(yibiaopan.substring(24, 28), 16),
                  // integer 均衡开关
                  voltageSeries: group,
                  // 电压串信息
                  chargeSwitch: cd_state ? '开' : '关',
                  // integer 充电开关
                  dischargeSwitch: fd_state ? '开' : '关',
                  // string 放电开关
                  bluetoothName: lanyaInfo.name,
                  // string 蓝牙名称
                  dropoutVoltage: '',
                  protectStatus: ''
                },
                //设备保护参数
                deivceVoltageParam: {
                  singleOvervoltageProtect: (parseInt(setting.substring(80, 84), 16) / 1000).toFixed(3) + 'V',
                  // integer 单体过压保护
                  singleOverpressureRecovery: (parseInt(setting.substring(84, 88), 16) / 1000).toFixed(3) + 'V',
                  // integer 单体过压恢复
                  singleOverpressureDelay: (parseInt(setting.substring(204, 208), 16) / 100).toFixed(2) * 100 + 'S',
                  // integer 单体过压延时
                  singleLowvoltageProtect: (parseInt(setting.substring(88, 92), 16) / 1000).toFixed(3) + 'V',
                  // integer 单体欠压保护
                  singleLowvoltageRecover: (parseInt(setting.substring(92, 96), 16) / 1000).toFixed(3) + 'V',
                  // integer 单体欠压恢复
                  // singleLowvoltageDelayed: (parseInt(setting.substring(200, 204), 16) / 100).toFixed(2) *
                  // 	100, // integer 单体欠压延时
                  // allOvervoltageProtect: (parseInt(setting.substring(64, 68), 16) / 100).toFixed(
                  // 	2), // integer 总压过压保护
                  // allOverpressureRecovery: (parseInt(setting.substring(68, 72), 16) / 100).toFixed(
                  // 	2), // integer 总压过压恢复
                  // allOverpressureDelay: (parseInt(setting.substring(196, 200), 16) / 100).toFixed(2) *
                  // 	100, // integer 总压过压延时
                  allLowvoltageProtect: (parseInt(setting.substring(72, 76), 16) / 100).toFixed(2) + 'V',
                  // integer 总压欠压保护
                  allLowvoltageRecover: (parseInt(setting.substring(76, 80), 16) / 100).toFixed(2) + 'V',
                  // integer 总压欠压恢复
                  allLowvoltageDelay: (parseInt(setting.substring(192, 196), 16) / 100).toFixed(2) * 100 + 'S',
                  // integer 总压欠压延时
                  singleLoureDelay: (parseInt(setting.substring(196, 200), 16) / 100).toFixed(2) * 100 + 'S' // integer 总压过压延时
                },

                //设备电流设置
                electricityParam: {
                  occhg: (parseInt(setting.substring(96, 100), 16) / 100).toFixed(2) + 'A',
                  // string 充电过流保护
                  chargeOvercurrentDelay: (parseInt(setting.substring(212, 216), 16) / 100).toFixed(2) * 100 + 'S',
                  // string 充电过流延时
                  chargeOvercurrentRecoverDelay: (parseInt(setting.substring(208, 212), 16) / 100).toFixed(2) * 100 + 'S',
                  // string 充电过流恢复延时
                  dischargeOvercurrentProtect: fdgl + 'A',
                  // string 放电过流保护
                  dischargeOvercurrentDelay: (parseInt(setting.substring(220, 224), 16) / 100).toFixed(2) * 100 + 'S',
                  // string 放电过流延时
                  dischargeOvercurrentRecoverDelay: (parseInt(setting.substring(216, 220), 16) / 100).toFixed(2) * 100 + 'S' // string 放电过流恢复延时
                  // currentShuntResistance: parseInt(setting.substring(112, 116), 16) / 10, // string 检流阻值
                },

                //设备温度参数
                tempParam: {
                  chargeHightempProtect: ((parseInt(setting.substring(32, 36), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  充电高温保护
                  chargeHightempRecover: ((parseInt(setting.substring(36, 40), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  充电高温恢复
                  chargeHightempDelay: (parseInt(setting.substring(180, 184), 16) / 100).toFixed(2) * 100 + 'S',
                  //  充电高温延时
                  chargeLowtempProtect: ((parseInt(setting.substring(40, 44), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  充电低温保护
                  chargeLowtempRecover: ((parseInt(setting.substring(44, 48), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  充电低温恢复
                  chargeLowtempDelay: (parseInt(setting.substring(176, 180), 16) / 100).toFixed(2) * 100 + 'S',
                  //  充电低温延时
                  dischargingHightempProtect: ((parseInt(setting.substring(48, 52), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  放电高温保护
                  dischargingHightempRecover: ((parseInt(setting.substring(52, 56), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  放电高温恢复
                  dischargingHightempDelay: (parseInt(setting.substring(188, 192), 16) / 100).toFixed(2) * 100 + 'S',
                  //  放电高温延时
                  dischargingLowtempProtect: ((parseInt(setting.substring(56, 60), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  放电低温保护
                  dischargingLowtempRecover: ((parseInt(setting.substring(60, 64), 16) - 2731) / 10).toFixed(1) + '℉',
                  //  放电低温恢复
                  dischargingLowtempDelay: (parseInt(setting.substring(184, 188), 16) / 100).toFixed(2) * 100 + 'S' //  放电低温延时
                },

                equalizerSet: {},
                //设备功能设置
                funSet: {
                  Bite0: Bite0,
                  //  短路负载检测功能
                  Bite1: Bite1,
                  //  均衡功能
                  Bite2: Bite2,
                  //  充电均衡
                  Bite3: Bite3,
                  //  LED使能
                  Bite4: Bite4,
                  //  LED数量
                  Bite5: Bite5,
                  //  FCC限制
                  Bite6: Bite6,
                  //  RTC使能
                  Bite7: Bite7,
                  //  充电握手使能
                  Bite8: Bite8,
                  //  GPS功能
                  Bite9: Bite9,
                  //  蜂鸣器功能
                  Bite10: Bite10 //  蜂鸣器功能
                },

                systemSet: {
                  identifyCurrent: "",
                  strCount: group.length,
                  rsnsValue: parseInt(setting.substring(112, 116), 16) / 10 + 'mR'
                },
                //温度开关
                ntcSet: {
                  ntc1: ntc1,
                  //  ntc1
                  ntc2: ntc2,
                  //  ntc2
                  ntc3: ntc3,
                  //  ntc3
                  ntc4: ntc4,
                  //  ntc4
                  ntc5: ntc5,
                  //  ntc5
                  ntc6: ntc6,
                  //  ntc6
                  ntc7: ntc7,
                  //  ntc7
                  ntc8: ntc8 //  ntc8
                }
              }
            };
            _context2.next = 50;
            return postData(data);
          case 50:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _chuli.apply(this, arguments);
}
function postData(_x6) {
  return _postData.apply(this, arguments);
}
function _postData() {
  _postData = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee3(data) {
    var response;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return uni.request({
              url: 'http://cloud.yepaiapp.com/api/device/update',
              method: 'POST',
              header: {
                'Content-Type': 'application/json'
              },
              data: data // uni-app会自动处理JSON序列化
            });
          case 2:
            response = _context3.sent;
          case 3:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _postData.apply(this, arguments);
}
var _default = {
  zhilingchuli: zhilingchuli
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 42 */
/*!************************************************************************************************!*\
  !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/@babel/runtime/regenerator/index.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// TODO(Babel 8): Remove this file.

var runtime = __webpack_require__(/*! @babel/runtime/helpers/regeneratorRuntime */ 43)();
module.exports = runtime;

/***/ }),
/* 43 */
/*!*******************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/regeneratorRuntime.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = __webpack_require__(/*! ./typeof.js */ 13)["default"];
function _regeneratorRuntime() {
  "use strict";

  /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
  module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    return e;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  var t,
    e = {},
    r = Object.prototype,
    n = r.hasOwnProperty,
    o = Object.defineProperty || function (t, e, r) {
      t[e] = r.value;
    },
    i = "function" == typeof Symbol ? Symbol : {},
    a = i.iterator || "@@iterator",
    c = i.asyncIterator || "@@asyncIterator",
    u = i.toStringTag || "@@toStringTag";
  function define(t, e, r) {
    return Object.defineProperty(t, e, {
      value: r,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), t[e];
  }
  try {
    define({}, "");
  } catch (t) {
    define = function define(t, e, r) {
      return t[e] = r;
    };
  }
  function wrap(t, e, r, n) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype),
      c = new Context(n || []);
    return o(a, "_invoke", {
      value: makeInvokeMethod(t, r, c)
    }), a;
  }
  function tryCatch(t, e, r) {
    try {
      return {
        type: "normal",
        arg: t.call(e, r)
      };
    } catch (t) {
      return {
        type: "throw",
        arg: t
      };
    }
  }
  e.wrap = wrap;
  var h = "suspendedStart",
    l = "suspendedYield",
    f = "executing",
    s = "completed",
    y = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var p = {};
  define(p, a, function () {
    return this;
  });
  var d = Object.getPrototypeOf,
    v = d && d(d(values([])));
  v && v !== r && n.call(v, a) && (p = v);
  var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
  function defineIteratorMethods(t) {
    ["next", "throw", "return"].forEach(function (e) {
      define(t, e, function (t) {
        return this._invoke(e, t);
      });
    });
  }
  function AsyncIterator(t, e) {
    function invoke(r, o, i, a) {
      var c = tryCatch(t[r], t, o);
      if ("throw" !== c.type) {
        var u = c.arg,
          h = u.value;
        return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
          invoke("next", t, i, a);
        }, function (t) {
          invoke("throw", t, i, a);
        }) : e.resolve(h).then(function (t) {
          u.value = t, i(u);
        }, function (t) {
          return invoke("throw", t, i, a);
        });
      }
      a(c.arg);
    }
    var r;
    o(this, "_invoke", {
      value: function value(t, n) {
        function callInvokeWithMethodAndArg() {
          return new e(function (e, r) {
            invoke(t, n, e, r);
          });
        }
        return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(e, r, n) {
    var o = h;
    return function (i, a) {
      if (o === f) throw Error("Generator is already running");
      if (o === s) {
        if ("throw" === i) throw a;
        return {
          value: t,
          done: !0
        };
      }
      for (n.method = i, n.arg = a;;) {
        var c = n.delegate;
        if (c) {
          var u = maybeInvokeDelegate(c, n);
          if (u) {
            if (u === y) continue;
            return u;
          }
        }
        if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
          if (o === h) throw o = s, n.arg;
          n.dispatchException(n.arg);
        } else "return" === n.method && n.abrupt("return", n.arg);
        o = f;
        var p = tryCatch(e, r, n);
        if ("normal" === p.type) {
          if (o = n.done ? s : l, p.arg === y) continue;
          return {
            value: p.arg,
            done: n.done
          };
        }
        "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
      }
    };
  }
  function maybeInvokeDelegate(e, r) {
    var n = r.method,
      o = e.iterator[n];
    if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
    var i = tryCatch(o, e.iterator, r.arg);
    if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
    var a = i.arg;
    return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
  }
  function pushTryEntry(t) {
    var e = {
      tryLoc: t[0]
    };
    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
  }
  function resetTryEntry(t) {
    var e = t.completion || {};
    e.type = "normal", delete e.arg, t.completion = e;
  }
  function Context(t) {
    this.tryEntries = [{
      tryLoc: "root"
    }], t.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(e) {
    if (e || "" === e) {
      var r = e[a];
      if (r) return r.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) {
        var o = -1,
          i = function next() {
            for (; ++o < e.length;) {
              if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
            }
            return next.value = t, next.done = !0, next;
          };
        return i.next = i;
      }
    }
    throw new TypeError(_typeof(e) + " is not iterable");
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: !0
  }), o(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: !0
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
    var e = "function" == typeof t && t.constructor;
    return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
  }, e.mark = function (t) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
  }, e.awrap = function (t) {
    return {
      __await: t
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
    return this;
  }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
    void 0 === i && (i = Promise);
    var a = new AsyncIterator(wrap(t, r, n, o), i);
    return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
      return t.done ? t.value : a.next();
    });
  }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
    return this;
  }), define(g, "toString", function () {
    return "[object Generator]";
  }), e.keys = function (t) {
    var e = Object(t),
      r = [];
    for (var n in e) {
      r.push(n);
    }
    return r.reverse(), function next() {
      for (; r.length;) {
        var t = r.pop();
        if (t in e) return next.value = t, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, e.values = values, Context.prototype = {
    constructor: Context,
    reset: function reset(e) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) {
        "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
      }
    },
    stop: function stop() {
      this.done = !0;
      var t = this.tryEntries[0].completion;
      if ("throw" === t.type) throw t.arg;
      return this.rval;
    },
    dispatchException: function dispatchException(e) {
      if (this.done) throw e;
      var r = this;
      function handle(n, o) {
        return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
      }
      for (var o = this.tryEntries.length - 1; o >= 0; --o) {
        var i = this.tryEntries[o],
          a = i.completion;
        if ("root" === i.tryLoc) return handle("end");
        if (i.tryLoc <= this.prev) {
          var c = n.call(i, "catchLoc"),
            u = n.call(i, "finallyLoc");
          if (c && u) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          } else if (c) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
          } else {
            if (!u) throw Error("try statement without catch or finally");
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          }
        }
      }
    },
    abrupt: function abrupt(t, e) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var o = this.tryEntries[r];
        if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
          var i = o;
          break;
        }
      }
      i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
      var a = i ? i.completion : {};
      return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
    },
    complete: function complete(t, e) {
      if ("throw" === t.type) throw t.arg;
      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
    },
    finish: function finish(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
      }
    },
    "catch": function _catch(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.tryLoc === t) {
          var n = r.completion;
          if ("throw" === n.type) {
            var o = n.arg;
            resetTryEntry(r);
          }
          return o;
        }
      }
      throw Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(e, r, n) {
      return this.delegate = {
        iterator: values(e),
        resultName: r,
        nextLoc: n
      }, "next" === this.method && (this.arg = t), y;
    }
  }, e;
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 44 */
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/asyncToGenerator.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
module.exports = _asyncToGenerator, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 45 */
/*!****************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni.promisify.adaptor.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(uni) {var _typeof = __webpack_require__(/*! @babel/runtime/helpers/typeof */ 13);
uni.addInterceptor({
  returnValue: function returnValue(res) {
    if (!(!!res && (_typeof(res) === "object" || typeof res === "function") && typeof res.then === "function")) {
      return res;
    }
    return new Promise(function (resolve, reject) {
      res.then(function (res) {
        return res[0] ? reject(res[0]) : resolve(res[1]);
      });
    });
  }
});
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */,
/* 73 */,
/* 74 */,
/* 75 */,
/* 76 */
/*!****************************************************!*\
  !*** /Users/liran/Desktop/superPower/unit/i18n.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.$t = $t;
exports.getCurrentLanguage = getCurrentLanguage;
exports.setLanguage = setLanguage;
// utils/i18n.js
function setLanguage(lang) {
  getApp().$vm.$i18n.locale = lang;
  uni.setStorageSync('language', lang);
}
function getCurrentLanguage() {
  return getApp().$vm.$i18n.locale;
}
function $t(key) {
  return getApp().$vm.$t(key);
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 77 */,
/* 78 */,
/* 79 */,
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */
/*!*****************************************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-main.js?vue&type=script&lang=js& ***!
  \*****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_z_paging_main_js_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./z-paging-main.js?vue&type=script&lang=js& */ 91);
/* harmony import */ var _Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_z_paging_main_js_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_z_paging_main_js_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__);
/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_z_paging_main_js_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__) if(["default"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return _Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_z_paging_main_js_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__[key]; }) }(__WEBPACK_IMPORT_KEY__));
 /* harmony default export */ __webpack_exports__["default"] = (_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_Applications_HBuilderX_app_Contents_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_z_paging_main_js_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0___default.a); 

/***/ }),
/* 91 */
/*!********************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!/Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-main.js?vue&type=script&lang=js& ***!
  \********************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _regenerator = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/regenerator */ 42));
var _asyncToGenerator2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ 44));
var _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ 11));
var _zPagingStatic = _interopRequireDefault(__webpack_require__(/*! ./z-paging-static */ 92));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! ./z-paging-constant */ 93));
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! ./z-paging-utils */ 94));
var _commonLayout = _interopRequireDefault(__webpack_require__(/*! ./modules/common-layout */ 96));
var _dataHandle = _interopRequireDefault(__webpack_require__(/*! ./modules/data-handle */ 97));
var _i18n = _interopRequireDefault(__webpack_require__(/*! ./modules/i18n */ 100));
var _nvue = _interopRequireDefault(__webpack_require__(/*! ./modules/nvue */ 105));
var _empty = _interopRequireDefault(__webpack_require__(/*! ./modules/empty */ 106));
var _refresher = _interopRequireDefault(__webpack_require__(/*! ./modules/refresher */ 107));
var _loadMore = _interopRequireDefault(__webpack_require__(/*! ./modules/load-more */ 108));
var _loading = _interopRequireDefault(__webpack_require__(/*! ./modules/loading */ 109));
var _chatRecordMode = _interopRequireDefault(__webpack_require__(/*! ./modules/chat-record-mode */ 110));
var _scroller = _interopRequireDefault(__webpack_require__(/*! ./modules/scroller */ 111));
var _backToTop = _interopRequireDefault(__webpack_require__(/*! ./modules/back-to-top */ 112));
var _virtualList = _interopRequireDefault(__webpack_require__(/*! ./modules/virtual-list */ 113));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! ./z-paging-enum */ 98));
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var zPagingRefresh = function zPagingRefresh() {
  __webpack_require__.e(/*! require.ensure | uni_modules/z-paging/components/z-paging/components/z-paging-refresh */ "uni_modules/z-paging/components/z-paging/components/z-paging-refresh").then((function () {
    return resolve(__webpack_require__(/*! ../components/z-paging-refresh */ 160));
  }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};
var zPagingLoadMore = function zPagingLoadMore() {
  __webpack_require__.e(/*! require.ensure | uni_modules/z-paging/components/z-paging/components/z-paging-load-more */ "uni_modules/z-paging/components/z-paging/components/z-paging-load-more").then((function () {
    return resolve(__webpack_require__(/*! ../components/z-paging-load-more */ 167));
  }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};
var zPagingEmptyView = function zPagingEmptyView() {
  __webpack_require__.e(/*! require.ensure | uni_modules/z-paging/components/z-paging-empty-view/z-paging-empty-view */ "uni_modules/z-paging/components/z-paging-empty-view/z-paging-empty-view").then((function () {
    return resolve(__webpack_require__(/*! ../../z-paging-empty-view/z-paging-empty-view */ 153));
  }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
};
var systemInfo = uni.getSystemInfoSync();
var _default = {
  name: "z-paging",
  components: {
    zPagingRefresh: zPagingRefresh,
    zPagingLoadMore: zPagingLoadMore,
    zPagingEmptyView: zPagingEmptyView
  },
  mixins: [_commonLayout.default, _dataHandle.default, _i18n.default, _nvue.default, _empty.default, _refresher.default, _loadMore.default, _loading.default, _chatRecordMode.default, _scroller.default, _backToTop.default, _virtualList.default],
  data: function data() {
    return {
      // --------------静态资源---------------
      base64Arrow: _zPagingStatic.default.base64Arrow,
      base64Flower: _zPagingStatic.default.base64Flower,
      base64BackToTop: _zPagingStatic.default.base64BackToTop,
      // -------------全局数据相关--------------
      // 当前加载类型
      loadingType: _zPagingEnum.default.LoadingType.Refresher,
      requestTimeStamp: 0,
      wxsPropType: '',
      renderPropScrollTop: -1,
      checkScrolledToBottomTimeOut: null,
      cacheTopHeight: -1,
      statusBarHeight: systemInfo.statusBarHeight,
      // --------------状态&判断---------------
      insideOfPaging: -1,
      isLoadFailed: false,
      isIos: systemInfo.platform === 'ios',
      disabledBounce: false,
      fromCompleteEmit: false,
      disabledCompleteEmit: false,
      pageLaunched: false,
      active: false,
      // ---------------wxs相关---------------
      wxsIsScrollTopInTopRange: true,
      wxsScrollTop: 0,
      wxsPageScrollTop: 0,
      wxsOnPullingDown: false
    };
  },
  props: {
    // 调用complete后延迟处理的时间，单位为毫秒，默认0毫秒，优先级高于minDelay
    delay: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('delay', 0)
    },
    // 触发@query后最小延迟处理的时间，单位为毫秒，默认0毫秒，优先级低于delay（假设设置为300毫秒，若分页请求时间小于300毫秒，则在调用complete后延迟[300毫秒-请求时长]；若请求时长大于300毫秒，则不延迟），当show-refresher-when-reload为true或reload(true)时，其最小值为400
    minDelay: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('minDelay', 0)
    },
    // 设置z-paging的style，部分平台(如微信小程序)无法直接修改组件的style，可使用此属性代替
    pagingStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('pagingStyle', {})
    },
    // z-paging的高度，优先级低于pagingStyle中设置的height；传字符串，如100px、100rpx、100%
    height: {
      type: String,
      default: _zPagingUtils.default.gc('height', '')
    },
    // z-paging的宽度，优先级低于pagingStyle中设置的width；传字符串，如100px、100rpx、100%
    width: {
      type: String,
      default: _zPagingUtils.default.gc('width', '')
    },
    // z-paging的最大宽度，优先级低于pagingStyle中设置的max-width；传字符串，如100px、100rpx、100%。默认为空，也就是铺满窗口宽度，若设置了特定值则会自动添加margin: 0 auto
    maxWidth: {
      type: String,
      default: _zPagingUtils.default.gc('maxWidth', '')
    },
    // z-paging的背景色，优先级低于pagingStyle中设置的background。传字符串，如"#ffffff"
    bgColor: {
      type: String,
      default: _zPagingUtils.default.gc('bgColor', '')
    },
    // 设置z-paging的容器(插槽的父view)的style
    pagingContentStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('pagingContentStyle', {})
    },
    // z-paging是否自动高度，若自动高度则会自动铺满屏幕
    autoHeight: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoHeight', false)
    },
    // z-paging是否自动高度时，附加的高度，注意添加单位px或rpx，若需要减少高度，则传负数
    autoHeightAddition: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('autoHeightAddition', '0px')
    },
    // loading(下拉刷新、上拉加载更多)的主题样式，支持black，white，默认black
    defaultThemeStyle: {
      type: String,
      default: _zPagingUtils.default.gc('defaultThemeStyle', 'black')
    },
    // z-paging是否使用fixed布局，若使用fixed布局，则z-paging的父view无需固定高度，z-paging高度默认为100%，默认为是(当使用内置scroll-view滚动时有效)
    fixed: {
      type: Boolean,
      default: _zPagingUtils.default.gc('fixed', true)
    },
    // 是否开启底部安全区域适配
    safeAreaInsetBottom: {
      type: Boolean,
      default: _zPagingUtils.default.gc('safeAreaInsetBottom', false)
    },
    // 开启底部安全区域适配后，是否使用placeholder形式实现，默认为否。为否时滚动区域会自动避开底部安全区域，也就是所有滚动内容都不会挡住底部安全区域，若设置为是，则滚动时滚动内容会挡住底部安全区域，但是当滚动到底部时才会避开底部安全区域
    useSafeAreaPlaceholder: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useSafeAreaPlaceholder', false)
    },
    // z-paging bottom的背景色，默认透明，传字符串，如"#ffffff"
    bottomBgColor: {
      type: String,
      default: _zPagingUtils.default.gc('bottomBgColor', '')
    },
    // slot="top"的view的z-index，默认为99，仅使用页面滚动时有效
    topZIndex: {
      type: Number,
      default: _zPagingUtils.default.gc('topZIndex', 99)
    },
    // z-paging内容容器父view的z-index，默认为1
    superContentZIndex: {
      type: Number,
      default: _zPagingUtils.default.gc('superContentZIndex', 1)
    },
    // z-paging内容容器部分的z-index，默认为1
    contentZIndex: {
      type: Number,
      default: _zPagingUtils.default.gc('contentZIndex', 1)
    },
    // z-paging二楼的z-index，默认为100
    f2ZIndex: {
      type: Number,
      default: _zPagingUtils.default.gc('f2ZIndex', 100)
    },
    // 使用页面滚动时，是否在不满屏时自动填充满屏幕，默认为是
    autoFullHeight: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoFullHeight', true)
    },
    // 是否监听列表触摸方向改变，默认为否
    watchTouchDirectionChange: {
      type: Boolean,
      default: _zPagingUtils.default.gc('watchTouchDirectionChange', false)
    },
    // z-paging中布局的单位，默认为rpx
    unit: {
      type: String,
      default: _zPagingUtils.default.gc('unit', 'rpx')
    }
  },
  created: function created() {
    // 组件创建时，检测是否开始加载状态
    if (this.createdReload && !this.refresherOnly && this.auto) {
      this._startLoading();
      this.$nextTick(this._preReload);
    }
  },
  mounted: function mounted() {
    var _this = this;
    this.active = true;
    this.wxsPropType = _zPagingUtils.default.getTime().toString();
    this.renderJsIgnore;
    if (!this.createdReload && !this.refresherOnly && this.auto) {
      // 开始预加载
      _zPagingUtils.default.delay(function () {
        return _this.$nextTick(_this._preReload);
      }, 0);
    }
    // 如果开启了列表缓存，在初始化的时候通过缓存数据填充列表数据
    this.finalUseCache && this._setListByLocalCache();
    var delay = 0;
    delay = _zPagingConstant.default.delayTime;
    this.$nextTick(function () {
      // 初始化systemInfo
      _this.systemInfo = uni.getSystemInfoSync();
      // 初始化z-paging高度
      !_this.usePageScroll && _this.autoHeight && _this._setAutoHeight();
      _this.loaded = true;
      _zPagingUtils.default.delay(function () {
        // 更新fixed模式下z-paging的布局，主要是更新windowTop、windowBottom
        _this.updateFixedLayout();
        // 更新缓存中z-paging整个内容容器高度
        _this._updateCachedSuperContentHeight();
      });
    });
    // 初始化页面滚动模式下slot="top"、slot="bottom"高度
    this.updatePageScrollTopHeight();
    this.updatePageScrollBottomHeight();
    // 初始化slot="left"、slot="right"宽度
    this.updateLeftAndRightWidth();
    if (this.finalRefresherEnabled && this.useCustomRefresher) {
      this.$nextTick(function () {
        _this.isTouchmoving = true;
      });
    }
    // 监听uni.$emit中全局emit的complete error等事件
    this._onEmit();

    // 虚拟列表模式时，初始化数据
    this.finalUseVirtualList && this._virtualListInit();
    this.$nextTick(function () {
      // 非app平台中，在通过获取css设置的底部安全区域占位view高度设置bottom距离后，更新页面滚动底部高度
      setTimeout(function () {
        _this._getCssSafeAreaInsetBottom(function () {
          return _this.safeAreaInsetBottom && _this.updatePageScrollBottomHeight();
        });
      }, delay);
    });
  },
  destroyed: function destroyed() {
    this._handleUnmounted();
  },
  watch: {
    defaultThemeStyle: {
      handler: function handler(newVal) {
        if (newVal.length) {
          this.finalRefresherDefaultStyle = newVal;
        }
      },
      immediate: true
    },
    autoHeight: function autoHeight(newVal) {
      this.loaded && !this.usePageScroll && this._setAutoHeight(newVal);
    },
    autoHeightAddition: function autoHeightAddition(newVal) {
      this.loaded && !this.usePageScroll && this.autoHeight && this._setAutoHeight(newVal);
    }
  },
  computed: {
    // 当前z-paging的内置样式
    finalPagingStyle: function finalPagingStyle() {
      var pagingStyle = _objectSpread({}, this.pagingStyle);
      if (!this.systemInfo) return pagingStyle;
      var windowTop = this.windowTop,
        windowBottom = this.windowBottom;
      if (!this.usePageScroll && this.fixed) {
        if (windowTop && !pagingStyle.top) {
          pagingStyle.top = windowTop + 'px';
        }
        if (windowBottom && !pagingStyle.bottom) {
          pagingStyle.bottom = windowBottom + 'px';
        }
      }
      if (this.bgColor.length && !pagingStyle['background']) {
        pagingStyle['background'] = this.bgColor;
      }
      if (this.height.length && !pagingStyle['height']) {
        pagingStyle['height'] = this.height;
      }
      if (this.width.length && !pagingStyle['width']) {
        pagingStyle['width'] = this.width;
      }
      if (this.maxWidth.length && !pagingStyle['max-width']) {
        pagingStyle['max-width'] = this.maxWidth;
        pagingStyle['margin'] = '0 auto';
      }
      return pagingStyle;
    },
    // 当前z-paging内容的样式
    finalPagingContentStyle: function finalPagingContentStyle() {
      if (this.contentZIndex != 1) {
        this.pagingContentStyle['z-index'] = this.contentZIndex;
        this.pagingContentStyle['position'] = 'relative';
      }
      return this.pagingContentStyle;
    },
    renderJsIgnore: function renderJsIgnore() {
      var _this2 = this;
      if (this.usePageScroll && this.useChatRecordMode || !this.refresherEnabled && this.scrollable || !this.useCustomRefresher) {
        this.$nextTick(function () {
          _this2.renderPropScrollTop = 10;
        });
      }
      return 0;
    },
    windowHeight: function windowHeight() {
      if (!this.systemInfo) return 0;
      return this.systemInfo.windowHeight || 0;
    },
    windowBottom: function windowBottom() {
      if (!this.systemInfo) return 0;
      var windowBottom = this.systemInfo.windowBottom || 0;
      // 如果开启底部安全区域适配并且不使用placeholder的形式体现并且不是聊天记录模式（因为聊天记录模式在keyboardHeight计算初已添加了底部安全区域），在windowBottom添加底部安全区域高度
      if (this.safeAreaInsetBottom && !this.useSafeAreaPlaceholder && !this.useChatRecordMode) {
        windowBottom += this.safeAreaBottom;
      }
      return windowBottom;
    },
    isIosAndH5: function isIosAndH5() {
      return false;
      return this.isIos;
    }
  },
  methods: {
    // 当前版本号
    getVersion: function getVersion() {
      return "z-paging v".concat(_zPagingConstant.default.version);
    },
    // 设置nvue List的specialEffects
    setSpecialEffects: function setSpecialEffects(args) {
      this.setListSpecialEffects(args);
    },
    // 与setSpecialEffects等效，兼容旧版本
    setListSpecialEffects: function setListSpecialEffects(args) {
      this.nFixFreezing = args && Object.keys(args).length;
      if (this.isIos) {
        this.privateRefresherEnabled = 0;
      }
      !this.usePageScroll && this.$refs['zp-n-list'].setSpecialEffects(args);
    },
    // 使手机发生较短时间的振动（15ms）
    _doVibrateShort: function _doVibrateShort() {
      uni.vibrateShort();
    },
    // 设置z-paging高度
    _setAutoHeight: function _setAutoHeight() {
      var _arguments = arguments,
        _this3 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
        var shouldFullHeight, scrollViewNode, heightKey, finalScrollViewNode, finalScrollBottomNode, scrollViewTop, scrollViewHeight, additionHeight, finalHeight;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                shouldFullHeight = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : true;
                scrollViewNode = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : null;
                heightKey = 'min-height';
                heightKey = 'min-height';
                _context.prev = 4;
                if (!shouldFullHeight) {
                  _context.next = 18;
                  break;
                }
                _context.t0 = scrollViewNode;
                if (_context.t0) {
                  _context.next = 11;
                  break;
                }
                _context.next = 10;
                return _this3._getNodeClientRect('.zp-scroll-view');
              case 10:
                _context.t0 = _context.sent;
              case 11:
                finalScrollViewNode = _context.t0;
                _context.next = 14;
                return _this3._getNodeClientRect('.zp-page-bottom');
              case 14:
                finalScrollBottomNode = _context.sent;
                if (finalScrollViewNode) {
                  scrollViewTop = finalScrollViewNode[0].top;
                  scrollViewHeight = _this3.windowHeight - scrollViewTop;
                  scrollViewHeight -= finalScrollBottomNode ? finalScrollBottomNode[0].height : 0;
                  additionHeight = _zPagingUtils.default.convertToPx(_this3.autoHeightAddition);
                  finalHeight = scrollViewHeight + additionHeight - (_this3.insideMore ? 1 : 0) + 'px !important';
                  _this3.$set(_this3.scrollViewStyle, heightKey, finalHeight);
                  _this3.$set(_this3.scrollViewInStyle, heightKey, finalHeight);
                }
                _context.next = 20;
                break;
              case 18:
                _this3.$delete(_this3.scrollViewStyle, heightKey);
                _this3.$delete(_this3.scrollViewInStyle, heightKey);
              case 20:
                _context.next = 24;
                break;
              case 22:
                _context.prev = 22;
                _context.t1 = _context["catch"](4);
              case 24:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[4, 22]]);
      }))();
    },
    // 组件销毁后续处理
    _handleUnmounted: function _handleUnmounted() {
      this.active = false;
      this._offEmit();
      // 取消监听键盘高度变化事件（H5、百度小程序、抖音小程序、飞书小程序、QQ小程序、快手小程序不支持）

      this.useChatRecordMode && uni.offKeyboardHeightChange(this._handleKeyboardHeightChange);
    },
    // 触发更新是否超出页面状态
    _updateInsideOfPaging: function _updateInsideOfPaging() {
      this.insideMore && this.insideOfPaging === true && setTimeout(this.doLoadMore, 200);
    },
    // 清除timeout
    _cleanTimeout: function _cleanTimeout(timeout) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      return timeout;
    },
    // 添加全局emit监听
    _onEmit: function _onEmit() {
      var _this4 = this;
      uni.$on(_zPagingConstant.default.errorUpdateKey, function (errorMsg) {
        if (_this4.loading) {
          if (!!errorMsg) {
            _this4.customerEmptyViewErrorText = errorMsg;
          }
          _this4.complete(false).catch(function () {});
        }
      });
      uni.$on(_zPagingConstant.default.completeUpdateKey, function (data) {
        setTimeout(function () {
          if (_this4.loading) {
            if (!_this4.disabledCompleteEmit) {
              var type = data.type || 'normal';
              var list = data.list || data;
              var rule = data.rule;
              _this4.fromCompleteEmit = true;
              switch (type) {
                case 'normal':
                  _this4.complete(list);
                  break;
                case 'total':
                  _this4.completeByTotal(list, rule);
                  break;
                case 'nomore':
                  _this4.completeByNoMore(list, rule);
                  break;
                case 'key':
                  _this4.completeByKey(list, rule);
                  break;
                default:
                  break;
              }
            } else {
              _this4.disabledCompleteEmit = false;
            }
          }
        }, 1);
      });
    },
    // 销毁全局emit和listener监听
    _offEmit: function _offEmit() {
      uni.$off(_zPagingConstant.default.errorUpdateKey);
      uni.$off(_zPagingConstant.default.completeUpdateKey);
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 92 */
/*!******************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-static.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// [z-paging]公用的静态图片资源
var _default = {
  base64Arrow: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAD1BMVEVHcExRUVFMTExRUVFRUVE9CdWsAAAABHRSTlMAjjrY9ZnUjwAAAQFJREFUWMPt2MsNgzAMgGEEE1B1gKJmAIRYoCH7z9RCXrabh33iYktcIv35EEg5ZBh07pvxJU6MFSPOSRnjnBUjUsaciRUjMsb4xIoRCWNiYsUInzE5sWKEyxiYWDbyefqHx1zIeiYTk7mQYziTYecxHvEJjwmIT3hMQELCYSISEg4TkZj0mYTEpM8kJCU9JiMp6TEZyUmbAUhO2gxAQNJiIAKSFgMRmNQZhMCkziAEJTUGIyipMRjBSZkhCE7KDEFIUmTeGCHJxWz0zXaE0GTCG8ZFtEaS347r/1fe11YyHYVfubxayfjoHmc0YYwmmmiiiSaaaKLJ7ckyz5ve+dw3Xw2emdwm9xSbAAAAAElFTkSuQmCC',
  base64ArrowWhite: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAElBMVEVHcEz///////////////////+IGTx/AAAABnRSTlMA/dAkXZOhASU/AAABYElEQVRYw+2YwXLCIBCGsdAHWGbyAKZ4zxi9O017rxLf/1UaWFAgA1m8dcpedNSPf/l/Vh0Ya/Wn6hN0JcGvoCqRM4C8VBFiDwBqqNuJKV0rAnCgy3AUqZE57x0iqTL8Br4U3WBf/YWaIlTKfAcELU/h9w72CSVPa3C3OCDvhpHbRp/s2vq4fHhCeiCl2A3m4Qd71DQR257mFBlMcTlbFnFWzNtHxewYEfSiaLS4el8d8nyhmKJd1CF4eOS0keLMAuSxubLBIeIGQW8YHCFFo7EH9+YDcQt9FMZEswTheaNxTHwHT8SZorJjMrEVwo4Zo0U8HSEyZvJMOg4RjnmmRr8nDYeIz3OMkbfE/QhBo+U9RnZJxjGCRh/WKmHEMWLNkfPKsGh/CWJk1JjG0kcuJggTt34VDP8aWAFhp4nybVb5+9qQhjSkIQ1pSEMa8k+Q5U9rV3dF8MpFBK+/7miVq1/HZ2qmo9D+pAAAAABJRU5ErkJggg==',
  base64Flower: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAKlBMVEVHcEzDw8Ovr6+pqamUlJTCwsKenp61tbWxsbGysrLNzc2bm5u5ubmjo6MpovhuAAAACnRSTlMA/P79/sHDhiZS0DxZowAABBBJREFUWMPtl89rE0EUx7ctTXatB3MI1SWnDbUKPUgXqh4ED8Uf7KUVSm3ooVSpSii0Fn/gD4j4o+APiEoVmos9FO2celiqZVgwgaKHPQiCCkv+F99kM7Ozm5kxq1dfD91k9pPve9/3ZjbRNHHok/mKli4eIPNgSuRObuN9SqSEzM20iGnm0yIbqCuV7NSSSIV7uyPM6JMBYdeTOanh/QihJYZsUCSby+VkMj2AvOt0rAeQAwqE3lfKMZVlQCZk1QOCKkkVPadITCfIRNKxfoJI5+0OIFtJx14CMSg1mRSDko7VAfksRQzEbGYqxOJcVTWMCH2I1/IACNW0PWU2M8cmAVHtnH5mM1VRWtwKZjOd5JbF6s1IbaYqaotjNlPHgDAnlAizubTR6ovMYn052g/U5qcmOpi0WL8xTS/3IfSet5m8MEr5ajjF5le6dq/OJpobrdY0t3i9QgefWrxW9/1BLhk0E9m8FeUMhhXal499iD0eQRfDF+ts/tttORRerfp+oV7f4xJj82iUYm1Yzod+ZQEAlS/8mMBwKebVmCVp1f0JLS6zKd17+iwRKTARVg2SHtz3iEbBH+Q+U28zW2Jiza8Tjb1YFoYZMsJyjDqp3M9XBQdSdPLFdxEpvOB37JrHcmR/y9+LgoTlCFGZEa2sc6d4PGlweEa2JSVPoVm+IfGG3ZL037iV9oH+P+Jxc4HGVflNq1M0pivao/EopO4b/ojVCP9GjmiXOeS0DOn1o/iiccT4ORnyvBGF3yUywkQajW4Ti0SGuiy/wVSg/L8w+X/8Q+hvUx8Xd90z4oV5a1i88MbFWHz0WZZ1UrTwBGPX3Rat9AFiXRMRjoMdIdJLEOt2h7jrYOzgOamKZSWSNspOS0X8SAqRYmxRL7sg4eLzYmNehcxh3uoyud/BH2Udux4ywxFTc1xC7Mgf4vMhc5S+kSH3Y7yj+qpwIWSoPTVCOOPVthGx9FbGqrwFw6wSFxJr+17zeKcztt3u+2roAEVgUjDd+AHGuxHy2rZHaa8JMkTHEeyi85ANPO9j9BVuBRD2FY5LDMo/Sz/2hReqGIs/KiFin+CsPsYO/yvM3jL2vE8EbX7/Bf8ejtr2GLN65bioAdgLd8Bis/mD5GmP2qeqyo2ZwQEOtAjRIDH7mBKpUcMoApbZJ5UIxkEwxyMZyMxW/uKFvHCFR3SSmerHyDNQ2dF4JG6zIMpBgLfjSF9x1D6smFcYnGApjmSLICO3ecCDWrQ48geba9DI3STy2i7ax6WIB62fSyIZIiO3GFQqSURp8wCo7GhJBGwuSovJBNjb7kT6FPVnIa9qJ2Ko+l9mefGIdinaMp0yC1URYiwsdfNE45EuA5Cx9EhalfvN5s+UyItm81vaB3p4joniN+SCP7Qc1hblAAAAAElFTkSuQmCC',
  base64FlowerWhite: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAElBMVEX///9HcEz///////////////84chYNAAAABnRSTlP/AGzCOYZj5g1nAAACfklEQVRYw+2YTVPDIBCGtza9Jw25a0bvcax30o73OOr//yvma2F3YWlpPTijXNpAHrK8LLALVPFium2vNIFSbwGKTGQA2GUiHcD29yDNy3sMIdUBQl7r2H8mOEVqAHgPkYZUS6Qc2zYhQqtjyDZEximCZwWZLIBeIgYShs2NzxKpSUehYpMJhURGb+O+w5BpMCAREKPnCDHbIY20SzhM5yxziAXpOiBXydrekT9i5XDEq4NIIHHgyU5mRGqviII4mREJJA4QJzMiILwlRJzpKxJKvCBm8OsBBbLux0tsPl4RKYm5aPu6jw1U4mGxEUR9g8M1PcqBEp/WJliNgYOXueBzS4jZSIcgY5lCtevgDSgyzE+rAfuOTQMq0yzvoGH18qju27Mayzs4fPyMziCx81NJa5RNfW7vPYK9KOfDiVkBxFHG8hAj9txuoBuSWORsFfkpBf7xKFLSeaOefEojh5jz22DJEqMP8fUyaKdQx+RnG+yXMpe8Aars8ueR1pVH/bW3FyyvPRw90upLDHwpgBDtg4aUBNkxRLXMAi03IhcZtr1m+FeI/O/JNyDmmL1djLOauSlNflBpW18RQ2bPqXI22MXXEk75KRHTnkPkYbESbdKP2ZFk0r5sIwffAjy1lx+vx7NLjB6/E7Jfv5ERKhzpN0w8IDE8IGFDv5dhz10s7GFiXRZcUeLCEG5P5nDq9k4PFDcoMpE3GY4OuxuCXhmuyNB6k0RsLIAvqp9NE5r8ZCSS8gxnUp7ODdYhZTqxuiJ9uyJJtPmpqJ7wVj+XVieS903iViHziqAhchLEJAyb7jWU647EpUofQ0ziUuXXXhDddtlllSwjgSQu7r4BRWhQqfDPMVwAAAAASUVORK5CYII=',
  base64Success: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAElBMVEVRUVFHcExTU1NRUVFRUVFRUVFOSlSUAAAABnRSTlP/AI6+VySB3ZENAAACcElEQVRYw+2YyYKCMAyGI8hdpdxdZu7gcpdZ7jL6/s8yYheSNi0aPdqbwOffpGmaFOYPD3gj4bisN7vddv17N/JVgxn5x12IWgIaWTuO/IE3PseQbwjGPo2cgRmHFLJwdm/X643zwiqOKPPJ1nj3sjEP2iiifZWj5bhopSyGaEO2HX5fbQJzwJ+W7x/jw5ZFjsEU0PMph9xE8i5EqprKALW95eJQURkgzw98uJ/JvwGecR7bIjWWsUgVrrIfFZ2HlLy3sKETD1mmRLRMRhGVssRa0xJkdn3SpJBymBkM8+pSSDXMDNyDaToVHd2fgpNt0sjwiUZO19+jGQ+gQEg9Oq+bufmAVGihomNmjQG7UG3020vrlm7lkFnKFGU3kZ0KGAdmKe821pipQ+qEKcrZeTL2g5FsUks4cStjEZWwXg0b0n4GxmEpkWwIs5VBynjgK7xZaz1/0D7OxkVuLpsY5BQNFyLS84VBjjbg0iL2r2EQHBOxBhikuUOkdxODVF1cxHoWtPPsiyXO455Iv34hssCO8EV4ZIYTjS8SR4qYSHRiTiYQ4ZFbHi0iIhhBTi6dTCgSWRcnw4h4yGTuyTAiOGBIWGoZTgSHJQl+LcOJ4OCnW6yX2bMnJ9pidCOXtkTkTrIGpYuOynAiOF14SamMiOCk5Ke+mq8BcOrrvym8d0zKIQnWT+M1WwOQNO4fFiWb18hhERxJPx2fblbPHHyC41VyiAtKBUFBIih7JMWVoIQTFIr3lKPN80WvoLSWFPC653ioTZA0I0FrQ7qU6asaK0H7JmkSJa2ooOGVtNUsc3j9FYHkIkJy3SG6VHnfXKXGP9t4N9Q4Ye98AAAAAElFTkSuQmCC',
  base64SuccessWhite: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAGFBMVEVHcEz///////////////////////////8dS1W+AAAAB3RSTlMAiVYk6KvDHLfaegAAAo1JREFUWMPtWEtzmzAQNhCTq910ytXpiyvxTNOr60zrayepx9d02gnX4sTm7xcEiJX2gdnkGJ1A4tOnfWqXyeR1vMRYzrcPD9v5h5MBl3/Ldvx4cxIg/FWC8X0xjLjalM54uhhCfCrRuJURX0pi3EmIqZV7O59vrRZmguStHL9b7S7ftfLwOtiZDw7AHMtmquAQ12b5Wwbnordm8g9zLLO49qc/m2n6aKnhwPOGZ08hAiNHhheiHae1lOUPGZpQkPKa3q0mOUjaRzSRaGUjpy/mmWSwySSpllcEteBKAT52KEnSbblA51pJEPxBQoiH1FP4E3s5+FJv07h6/ylD6ui7B+9fq/ehrFB98ghec9EoVtyjK8pqCHLmCBOwMWSCeWFNN4MbPAk55NhsvoFHSSVR0k5TCTTEzlUGcqV/nVp7n9oIVkmtaqbAEqEgfdgHJPwsEAyZ9r4VAZXFjpEwyaw3+H2v42KYxKhs1XvY/gSSGv+IHyUSuHXCeZhLAgVI3EjgSGo1Fb3xO0tGGU9S2/KAIbtjxpJASG73qox6w5LUq0cEOa+iIONIWIilQSQ0pPa2jgaRQAgQP7c0mITRWGxpMAmEQFN2NAQJNCV0mI6GIIEO47hlQ0ORQLd0nL+hoUjg1m6I1TRr8uYEAriBHLcVFQ5UEMiBe3XkTBEG04WXlGKGxPnMS305XQPA1Ocn2JiuAZwE66fxnKwBnDTuXxZTMq85lwW6kt5ndLqZPefiU1yvmktcUSooChJF2aMprhQlnKJQ5FxRKkcVRa+itNYU8Io2oVkY14w0NMWYlqft91Bj9VHq+ca3b43BxjWJmla0sfKohlfTVpPN+93L/yLQ/IjQ/O5Q/VR5HdL4D7mlxmjwVdELAAAAAElFTkSuQmCC',
  base64Empty: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAMAAAAL34HQAAALeGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIyOjA2OjUzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIyLTAyLTIyVDIxOjIxOjQ1KzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTAxLTEzVDE5OjA5OjQwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xM1QxOTowOTo0MCswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZWQwMWYzNWQtOWRjOC00MDBiLWEyMmQtNjM5OGZiNzVhNGRiIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6ZDhlMzQ3ZmEtMDY2My1jYTRiLTgzNTctNTk4YjBkNGIzOTU2IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZDA4MDI4MDItMzUyYS04NTRhLTkxYjctNmRlNmQ1MmViM2QwIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHRpZmY6T3JpZW50YXRpb249IjEiIHRpZmY6WFJlc29sdXRpb249IjMwMDAwMDAvMTAwMDAiIHRpZmY6WVJlc29sdXRpb249IjMwMDAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iMSIgZXhpZjpQaXhlbFhEaW1lbnNpb249IjMwMCIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjMwMCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZDA4MDI4MDItMzUyYS04NTRhLTkxYjctNmRlNmQ1MmViM2QwIiBzdEV2dDp3aGVuPSIyMDIyLTAyLTIyVDIxOjIxOjQ1KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQwNjg2NzJkLWY5NDMtOTU0Mi1iMDBiLTVlMDExNmE1NmIzZSIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0xM1QxMDoyNjoxNiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphYmJkZmUyZC0xY2Q2LTJiNDgtYjUyNS05YzlhZjdlNjA4NDMiIHN0RXZ0OndoZW49IjIwMjQtMDEtMTNUMTE6MjM6NDArMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTQ5MjM5MDAtNDhiZC03YTQ1LWI4NGItYmVlZTVjOWUxYTM1IiBzdEV2dDp3aGVuPSIyMDI0LTAxLTEzVDExOjIzOjQwKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmVkMDFmMzVkLTlkYzgtNDAwYi1hMjJkLTYzOThmYjc1YTRkYiIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0xM1QxOTowOTo0MCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmFiYmRmZTJkLTFjZDYtMmI0OC1iNTI1LTljOWFmN2U2MDg0MyIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjM2ZGQ4NTQxLWQ0MWEtYmY0Yy1iZjA3LWNmNjZhNjZhMDg2MSIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmQwODAyODAyLTM1MmEtODU0YS05MWI3LTZkZTZkNTJlYjNkMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pm30U/gAAAAJcEhZcwAALiMAAC4jAXilP3YAAAA/UExURUdwTODg4O3t7e7u7unp6d7e3uTk5M/Pz8nJyePj4+jo6Pj4+MrKyszMzO7u7unp6fb29vLy8vr6+v7+/sHBweag3xAAAAAOdFJOUwAxia5pF0n+/vzX3KbULQ2DYQAACG1JREFUeNrtm4l2o7gShi20IWFrAd7/WUc7EosDWKZ976Hc7WTmdMKXv0qlqpLyeNx222233Xbbbbfddtv/mOHn8xexSNsiRH5PrbFtW4p+DetpsF4v8Gs+HA3WEwOAfwzriYxaLTVsP8X1QK0z+vqQCzewYogi60aL9SEX5oyxphYVCFTGjfSJCTmN1jBruN5KTGCUS8bhySQGHRaohmW4glwtldbOeYJYKlgvbyUuA8aFFEKc++aIM4hrRnyiMnIZKq1PrihcM3GNKboMF1Naa9X9+8T1KrxIlVbGjv3cAEHOYYMqqgUsVuJqqehV3+sjDwB+DTJp0lYtMCyZpxqjF4e+74+sRcQSFZO8UonUSEFzuUY+DKo59A2kZDatGCjzCauy/2AmhSyCq0WHEj0KTNJDmVeNhErMt1Q8W4xti4/FwMJ4jaxl05TKFiNtD3kBGrHnhiph9V0eXQc6DkyE2xX830AlKshFTErXeuCZXK/9m41wFsGSfZ4lcGeyZ98PrylJ7MWCojQZ3qSukL2QslgdngqJnTEPdTJhXvbNBoR/+7wabIxWduN/Ja5dWEivm4XSZ2uQckNzmRlHrn2lc6eiafvS4V2Hd12tesau8toZW0CtWoZYb9t+OqxdCYKYjVPF16pVbILIy/gR7MVaWMHYPCoa2VkzkX4Iry2rirXbumGyAjGC1h62YLw6ApsNKZph3fpIWHt08JovRWD62sejpXhTrhWrPpl6zZ6PW2oTG5ltlvgtF6weNYCWKeJJSfg4W6PNJlj3sVZgOXV4lc8n4RlkMTLEBDVoYc3nI09kpyzzfgWsjyzBZSNDKF2/wjh+sxYvn8Y1scxlfLF9T1RBO3wVHsnq8Fk4oGkEh/0KJPSa8T2CeWE5X9BPmgLsaRIGeNL2kshCsWoLBmdPJW5Wbz1ndAKUXjPwxXYAUpSV3fy5BJg1aa1tyVXHHMgVH31ewDVrleHr9XqC684SUF4mecR3+wW5SC2QNvxUizRv98mLDhPgYiMDb+v8g0OADxqxcnf9w01mZYJF0fUVP5LcdswbsMmy1DVs5PlE5NpNiTR8M8qAWZkOy6aN13VcoOF2/s3xn3Mes8Xza05tgR/BuNz69nlNzMR0fH45p+G4R9oxh2mKt9MF4J7K/lvWUojwF5nCgCpuRUptnZMQ3au0nSo2UsHgV3xpmeLYzGml3ZFBBzYGPCpOQRwXs1/GG1J74dlZc6JKUOtjBAz9XjVxucGWHbZVJDPJQGYDRl1Qmf1ovk2Sbghb6MQlnF7mBzM1bgOqJAPpoOQaVe+4Skcit3uqHMyG/Sh1rHNN0gAfM0nnPrmulfLVBSm20TSZSdWa0LJl2ukVyE4vTYCgP3uQkwv1TKtQWgxDzBSg80OQjCs4klKvuUzHLCfIbDKIE/S5VIGqD1iD2819pkAqTWdmeina+oZABi7X5B1MGoTJqJSchuk6JNHcgUPAcsVFk0+N0oDN68Vo7FQSmCXjx46OEtUk1lpY2ZFQGr/AcpqVato4wPUD+RhfAeyQI5sJ6l2sDwnKqNFSJvpiyJbFl3kTOjZ2ievwCR7hkUoWeV2vOLAXvB39AJoyqYa81A5cvaAidXYTFTycKDBcalVK5f3XS89kzLVl9txfL+K+p6NUnitz5KkKm7D3DrRPNq4bk7l20aFRppNilmuQI+uzTtj9wPBkTsVwM7HbJ5pwGgujyRyZDzQLNoiRFluRtQ+GzEguqRxUL+ZMFqulMzIfaP3ARj2k/txB8c+2HyjmDizCaVWtNoE5MvMlKs/4VQ7HUJZCrU6qCKcNJ2aSWUZhJZu4VI0LB4CHFdj77DRuGi28WKAxoRyZyzGVrmc0jmk1nP5QaxZo1puqq1YIAqgZb8e/rABZJWNCNxV7DSTpOO7Aail9J9nYHtua/4ouE/aS0X1qtXQzwGx+rnbi2vhF/TfZG52oc6DPo1WCi3RTDnRk7TEntoEp38gg+DjYs2opkR3JW5EpL9rU0XSK5/6LOTAVS+72x7pm60zSf5HMdldjhzJqw1FRcxXdS3ZNZp0s92FiyluUvBPoD9ynZNkBiu2NF11ofnlnQbZgKqvusj9R/f6DOzgVsahbNlXxlsxU8y7qrbTupitRyxFBKG6H3aEPUqj7YrzAymq41FXlZLlO4WLbvG2Kg4vYB+wPfWS2B5Rq8TW9ROpAZbiF6MmCTsx1NLLsx7NOoOiZup2CNbZ36xc96ErcxzuILGrmmFhimjtwKo/yTm7feTVwB61IzbnW4967Kt3cDDotGt8JKrTiUyO3Uy2PZZt9tapXEfXhWmTgcoB+JchFWsiCKvYnhmn/tKuJDbgly897FnFfkE1rQLKy810OU7xW3bEJHCD5gERtuTGuxoJqA6qI9TNMa6MbvZomsiubbPYx78YXDaaRqqsyqfSaLZdjYGHLu65rDgydXCWm1P5EvcQ828f9pcBapTILSMv1nZCAc0WzFIFsGfUi/kmAxc6cFqDSYuPSMIbs1OVrwITTQM9HVRFJ5JL56qcoFzzT1uVcd2v9jFw8BHlcWtmEI86hp5Dy/zOlK8cUp/rVseRUBqawz6kmAcPLM9l5m8h4V53Iz/2mFJaTCvF8JbsMvPjU/7crbUXart0v4WyE0LnDPcAX95Knj4VUE8HCdNdUP8BDcOXKdPl4uSWbh4LfOV0HDdfipOmu+eIRrDsNPkIT7np/8ZAzVdOd1u8wHIqeXt8VqtgiO50ePeNaGG+uO9rHiKdL71pnIun8jxEKXv2r2HYBzO/mz96vFKoMM5WLk7tQXS9U5kwCu5lk7n6++kdCFWRaTUzm0/5fClWGWTrM/AGhCrJO/ZBQhTPFLwmV7ebgcdttt91222233Xbbbf+H9h+2WEtdHVinLAAAAABJRU5ErkJggg==',
  base64Error: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAMAAAAL34HQAAALeGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDg4LCAyMDIwLzA3LzEwLTIyOjA2OjUzICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIyLTAyLTIyVDIxOjIxOjQ1KzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTAxLTEzVDE5OjEwOjEwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xM1QxOToxMDoxMCswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTQ3NTExNjAtZDY5MC00ZTkzLWFhNGUtNGMwYTViNGU1ZGFjIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6YzRiNzlkYWMtZTJmYS1iNzQ0LWIxM2ItOWU1N2VjMDhhM2YwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6ZDA4MDI4MDItMzUyYS04NTRhLTkxYjctNmRlNmQ1MmViM2QwIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHRpZmY6T3JpZW50YXRpb249IjEiIHRpZmY6WFJlc29sdXRpb249IjMwMDAwMDAvMTAwMDAiIHRpZmY6WVJlc29sdXRpb249IjMwMDAwMDAvMTAwMDAiIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiIGV4aWY6Q29sb3JTcGFjZT0iMSIgZXhpZjpQaXhlbFhEaW1lbnNpb249IjMwMCIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjMwMCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZDA4MDI4MDItMzUyYS04NTRhLTkxYjctNmRlNmQ1MmViM2QwIiBzdEV2dDp3aGVuPSIyMDIyLTAyLTIyVDIxOjIxOjQ1KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQwNjg2NzJkLWY5NDMtOTU0Mi1iMDBiLTVlMDExNmE1NmIzZSIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0xM1QxMDoyNjoxNiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjZjk1NTE1OC04MjFiLTA4NDUtYWJmNS05YTE1NGM1ZTY4NjEiIHN0RXZ0OndoZW49IjIwMjQtMDEtMTNUMTE6MDQ6MDQrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZGM1Y2IyNWItZDZlNC0yZjQ2LTgyODQtZmUwOTNlY2M2ZTkxIiBzdEV2dDp3aGVuPSIyMDI0LTAxLTEzVDExOjA0OjA0KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjE0NzUxMTYwLWQ2OTAtNGU5My1hYTRlLTRjMGE1YjRlNWRhYyIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0xM1QxOToxMDoxMCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmNmOTU1MTU4LTgyMWItMDg0NS1hYmY1LTlhMTU0YzVlNjg2MSIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjM2ZGQ4NTQxLWQ0MWEtYmY0Yy1iZjA3LWNmNjZhNjZhMDg2MSIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmQwODAyODAyLTM1MmEtODU0YS05MWI3LTZkZTZkNTJlYjNkMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Ph2LDQsAAAAJcEhZcwAACxMAAAsTAQCanBgAAAA5UExURUdwTNra2s7Ozq2tre3t7dPT087OzuPj4+3t7dbW1u/v79bW1vz8/MrKytDQ0Nzc3MPDw/X19bi4uMZQDnEAAAAKdFJOUwBqEPywotz+wzqApqiTAAAHW0lEQVR42u1b25akIAwcbx2UFoj//7HLTQVBRcSZfTDnbM/uTl/KSlEkwf75eeONN95444033njjjTduR9/0/yOsbqoevObL7101tYX1HFs9QFtfZalRP+rpQVgdAFx990ZnT8L6eZItUl99jeGpf1DxdV/VP9fV1f/PFlF1bYHoVFSRC60IyVjrFRnuB8IoxpExSrstsErKHpJw1eqybNLbAQvAYkKjUrjoBgKRqAaeIjG5+qaps6hKcMWmcdSwqAJWBbAgCZZaIYbsqggqqlHNbFFa5yVR4jKvrKEErOEjNCqNSwHrfE8lpLsod/u+cOPPMPBJ+Gz5dM0cXNgclre+pSxhYI1WW5Tf9ENSMIdLCiWs6q9hwQprBVYKFqyPlx4WtoSvrT9lC/wkGt8qlkQooC3hi6sgW3Bb8gtdpSV/za/mn49pC0oYhONbfyd5hzDLFivKFpTS1gKM0we0tQCEncfgQn7Rt+DC/299i1MSRJcBC0r7VviG5KZvwV5WIUobxHyrJKy8VRjXVgFYsPu5kOtbxdhycCDuihziXVLoW7xwEiUmDgd544B46luWLW+nugMLB2BimmC3cxTNxCDg8xFtuUSNqoFsDKzY8psa+XtBNWXr74N6qxwsS5T6VL5robKl10+ZRu5S9qBvUYuJwVHzjwjrE3G33qKh+WXBgmkmCvHYquTvZ8oo7rLFA4PJgYW0MdePIRQIGUPNbSMw5lubJMKtJI6+Wk6cVFMmACO+VVryeL7ZgI8MhwS2fnNPPK0geHBRd11eJSiyL4KjrL2umm1XIpRii1MKB/mU/iCZwF+pt5z3UJ7UiF3nQqadAXC3T3xEW2IyuDBe3yDTe0+A64it2WTyYSGVHymUI/EduvSWKJ80Dtv2NbYSoQxbMkVC7yzNGIWFvDF7gRD79RYrWW/BDGti4wwLtgvO7gWKUZ8Mt94qX8vLJE70+xVNwzDm9ghNM+FX7p/jlZUId2HJD+Tf79hMe3WNrAK/30E+C8/6xOCqbqxE5JNMYrNbnaLUvJAewfCg8zF0Ba/tbviWLvPYfsGFA1PVD8ZdnjlVc/DS/o7LK4NHjOjKKbfCTSCo5XmwKbaZM4jlc9NGEYd9Ijd0QS5ZGaOR2O+DPlGyRb2nXZzgnI1GdFWF+0gh3ifyTRqvzpXI2eElk58FeHziCF5hY+hSMV9Ge/mohUTGuQ4vzHYe8bW5sNdFQ58St22Vcf5zzJbtcGT4iYQ7iz8dFuxoWRYMjAM7KCnypHOTLSqdUwYIFpndOD/6B2FBzNQxYmW/zxYE4j8yLHga1s2Rbm/O5PXtGcuNDIW1dTj5hpjGsO+7z2Kk9NP1JWDlnWKAM4H6zCUNM05KyVPHBclYzUbgjE3N3tP2JWHBmbqD4GLeCs2jhMT13lMVljwcEbetwZgtHUxVQ21ho3fE7inf2s8vzMWq0EWpfOBg5hcDSGwaF2+LaysRIzNFqRgBv2sMhi/Ix0WiW8rBKNBv4ExBI7eorx9ANazsPCb5FkSNH+Reacos+AYxaFzX76KMH65c8ytzZ40YvpFAqtgC/otn1eCmMI5K8yVRQVVwq3aVtU+jJktwjyP7x+BKv8vtoH098vXYSJcrWGJcAW11r8WVRxe5vgcuFbXqwnaEZejS6mrLwYKUg1ch2RJswTFYgMOwoau+AQsSp/FuDhVZi7J402ifgGla/GJIzGLYG5H4rnKMCUydL9wcsmZSuPikR2QmjQbWqaV2ob2RdMvaLEvFlRiXpYeTwqVOtMZF+qi0dS4uEjJKMvWuYK3S0jHZwaq7BylYp/O2uu3q04lNqudLWEJQd/3paTBz12IaLIPtzE5P1AUuW9TB8NVzaG9/TIfV+eXsWeezz6HWlptEbo4SIAeWur/Y/RZC/gmZTiLzUY2j5ct6fjKsFvxqgyQxE9sbmfYtnJMIciEKo6+FL0wziJmtkzspIcUl0PgWrL7VCKP7hl61U4WLeN+7Ieli2vZhmq0VgjDOgIyhJ62sSpDkWNZa1wiB8WoLlxzy29XpGVPgn1ut5VYcGyRLK7OCiJaDYMrAneJUkZWdw0yDgNm5nDowqLc0Kp581FO7QS4pC9S/YRW9xkVdNOj0ZHCp9anEZw3VEK/fopiDrkMObkcdJtT1g6+uzQ60bIdUPztdWZWy53m+v/zFYPOGHO4AZsalmtJNkyHrCAx1RXX7mt5g1L1pDezpkXv8wJwpVRSSaf2c26Y0rrXXxyWBptu/ovdak+VhkqjGBZUdvKygqANKA/MqZ/36kcGwFn90RnWp66ksKuHgitLFY8BU+F2ZvqpxpMY9qR3YwOUJ12fc0KUHVKdswcKXuwetErCnwvMKuXxfc/3RVJ2yFc+iosQd3X+WGSVz1UiuN2J156FyVyHbsOUp3krezaPUT/VxXqdfwvknb/Zgp+idTxTbrkLqYuKreRnhy65Gf4W0NsDoYiqf6uZsvr8V9eo6XWc5+3TVf/3N1TfeeOONN95444033njjjTfeSI1/IeOYOeO4fGAAAAAASUVORK5CYII=',
  base64BackToTop: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAElBMVEVRUVH+/v5HcEyZmZlRUVFRUVGm1ByOAAAABnRSTlPMzADMTZAJBBGsAAAEnElEQVR42t2cS27jMAyGf7/2U+QCQeDsbeQCgZDujaC5/1UmkzaJn+JDFGcw3LdfflKibJkkDnxrL7dbg7sNt6+L4O8OYBM+B0ys+QrGkHZG+OEEQ8g6go8Bx1GIGMdpNOQyIG6XdMgnSPtKhLQDGEZFBgYMkhKFtGBb0EIEjDgFRowoBVaMGAWpMedEfxMiZtwpUsgZCqtlkCNUdpVAWigtCCCDFtLwIWeoreZCWiRYYEKGFEjDg+yRZCUH0iLRAgNyToXUNCRZyMqWhGnUN2IPm3wSlwJ7IUspyCBkIQUZhCykIIeQuRTkEDKXAuM9srrtYbrZN7Y98giZSoFd+t1OxmMITG0dcrSFXFchZ1tIvQZpYWxhBbK3hpQrkMEa0iwh5t4a+QvZvDXyF7J5a+Qv5PPW21/I5623v5DPW29/IaO3Xv5Clrw1y1/Ikrdm+Qs5svw83yNnSJ5BQb4F/F7EIEJSnThGBAXxkFQfLOviQUE8JAUPsosHBfGQfDAtHhREQ1JxIV00KIgmrnRI84S0yAd5BAXxxJUck0f6Qnwr9qmr6xF5xLMjcwn/iudIEAdWnyjkEXlQKZiRVzoqRyLbgeUKKR8Q4alY7cSnoxzSf2ggsqehKr6YVpcXpOd7H93f60cKhOd7Re2LteUF4eLqiVS1mr0ge4io6C2+soaFkJ7MuuuQs1yITEp9hwwKISIpzR2iESKSIoT0rLNwuVHQqoSIpAQJpGce60vIUSdEIuUqgPTsJ5QFZK8UIpBS8iG94GFrDjlrhfCl8CG96Llxmle4kEr6vKWBPIVo9kqDQSRk9/3cWoikcCFPAd33v4dIChPyEvLzBA6RlEYWke4JEUnhKXkLeUEKxRHJFfKCQHGucIW8IdZSRkLeEGMpYyEjiK2UsZARxFTKRMgYYillImQMMZQyFTKB2EmZCplAuFLIHT8TMoWwpQwiIVMIUwqpZP5bp5CCvCTiQKr5f5lCQN+tPCBn2ZvVDFJwIDUP0m1BYAfZYRNSsCB7BqTbhoARePIxtZ9tgwWkoJcwCalmv3MBAemtO4R6dah2HaKQqj8Zvp9sQDjvJ21+SPCBHPJDDk6QITekEV7gqCC19CpKAym9IMfckKv4olMBCeIrWwVEfvkshzQekO9r9P1/ALk+IG1eSPCDiCJfyG+FyU+A6ZCa/piZDinpz7LpkCv5gdkAEshP5emQhv7onw6pGeULyZCSUYiRDAmMkpJkCKs4JhFSq8p8hJBSVbAkhARV6ZUQoisik0FqXTmcDHLVFfbJIEFXoiiCNMpiSxGkVJaNiiBBWQArgTTaUl4JpNQWJUsgQVteXQg+AKkLxQWFGKW+5J2+eVp4S168X3CF1CltCKdTJ8lb84YK2bUBO+wZW0Pqv9nk4tKu49N45NJC5dMM5tLW5tOg59Jq6NM06dL+abFXwr/RkuvTXJwae1abtE/Dt0/ruksTvs84AZ/BCC4jHnyGVfiM3VBQFANEXEah+Ax18RlP4zNox2dkkM/wI58xTn8yDCXGYCDV3W5RGSajtXyGhG1jbpbjzpwGt/0MJft8jqC7iUbQ/QZaxdnKqcIftwAAAABJRU5ErkJggg=='
};
exports.default = _default;

/***/ }),
/* 93 */
/*!********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-constant.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// [z-paging]常量
var _default = {
  // 当前版本号
  version: '2.7.9',
  // 延迟操作的通用时间
  delayTime: 100,
  // 请求失败时候全局emit使用的key
  errorUpdateKey: 'z-paging-error-emit',
  // 全局emit complete的key
  completeUpdateKey: 'z-paging-complete-emit',
  // z-paging缓存的前缀key
  cachePrefixKey: 'z-paging-cache',
  // 虚拟列表中列表index的key
  listCellIndexKey: 'zp_index',
  // 虚拟列表中列表的唯一key
  listCellIndexUniqueKey: 'zp_unique_index'
};
exports.default = _default;

/***/ }),
/* 94 */
/*!*****************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-utils.js ***!
  \*****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _typeof2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/typeof */ 13));
var _index = _interopRequireDefault(__webpack_require__(/*! ../config/index */ 95));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! ./z-paging-constant */ 93));
// [z-paging]工具类

var storageKey = 'Z-PAGING-REFRESHER-TIME-STORAGE-KEY';
var config = null;
var configLoaded = false;
var timeoutMap = {};

// 获取默认配置信息
function gc(key, defaultValue) {
  var isFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  // 这里return一个函数以解决在vue3+appvue中，props默认配置读取在main.js之前执行导致uni.$zp全局配置无效的问题。相当于props的default中传入一个带有返回值的函数
  var configFunc = function configFunc() {
    // 处理z-paging全局配置
    _handleDefaultConfig();
    // 如果全局配置不存在，则返回默认值
    if (!config) return defaultValue;
    var value = config[key];
    // 如果全局配置存在但对应的配置项不存在，则返回默认值；反之返回配置项
    return value === undefined ? defaultValue : value;
  };
  // 如果props本身不是function，则返回function，反之返回原本的值
  return !isFunc ? configFunc : configFunc();
}

// 获取最终的touch位置
function getTouch(e) {
  var touch = null;
  if (e.touches && e.touches.length) {
    touch = e.touches[0];
  } else if (e.changedTouches && e.changedTouches.length) {
    touch = e.changedTouches[0];
  } else if (e.datail && e.datail != {}) {
    touch = e.datail;
  } else {
    return {
      touchX: 0,
      touchY: 0
    };
  }
  return {
    touchX: touch.clientX,
    touchY: touch.clientY
  };
}

// 判断当前手势是否在z-paging内触发
function getTouchFromZPaging(target) {
  if (target && target.tagName && target.tagName !== 'BODY' && target.tagName !== 'UNI-PAGE-BODY') {
    var classList = target.classList;
    if (classList && classList.contains('z-paging-content')) {
      // 此处额外记录当前z-paging是否是页面滚动、是否滚动到了顶部、是否是聊天记录模式以传给renderjs。避免不同z-paging组件renderjs内部判断数据互相影响导致的各种问题
      return {
        isFromZp: true,
        isPageScroll: classList.contains('z-paging-content-page'),
        isReachedTop: classList.contains('z-paging-reached-top'),
        isUseChatRecordMode: classList.contains('z-paging-use-chat-record-mode')
      };
    } else {
      return getTouchFromZPaging(target.parentNode);
    }
  } else {
    return {
      isFromZp: false
    };
  }
}

// 递归获取z-paging所在的parent，如果查找不到则返回null
function getParent(parent) {
  if (!parent) return null;
  if (parent.$refs.paging) return parent;
  return getParent(parent.$parent);
}

// 打印错误信息
function consoleErr(err) {
  console.error("[z-paging]".concat(err));
}

// 延时操作，如果key存在，调用时清除对应key之前的延时操作
function delay(callback) {
  var ms = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _zPagingConstant.default.delayTime;
  var key = arguments.length > 2 ? arguments[2] : undefined;
  var timeout = setTimeout(callback, ms);
  ;
  if (!!key) {
    timeoutMap[key] && clearTimeout(timeoutMap[key]);
    timeoutMap[key] = timeout;
  }
  return timeout;
}

// 设置下拉刷新时间
function setRefesrherTime(time, key) {
  var datas = getRefesrherTime() || {};
  datas[key] = time;
  uni.setStorageSync(storageKey, datas);
}

// 获取下拉刷新时间
function getRefesrherTime() {
  return uni.getStorageSync(storageKey);
}

// 通过下拉刷新标识key获取下拉刷新时间
function getRefesrherTimeByKey(key) {
  var datas = getRefesrherTime();
  return datas && datas[key] ? datas[key] : null;
}

// 通过下拉刷新标识key获取下拉刷新时间(格式化之后)
function getRefesrherFormatTimeByKey(key, textMap) {
  var time = getRefesrherTimeByKey(key);
  var timeText = time ? _timeFormat(time, textMap) : textMap.none;
  return "".concat(textMap.title).concat(timeText);
}

// 将文本的px或者rpx转为px的值
function convertToPx(text) {
  var dataType = Object.prototype.toString.call(text);
  if (dataType === '[object Number]') return text;
  var isRpx = false;
  if (text.indexOf('rpx') !== -1 || text.indexOf('upx') !== -1) {
    text = text.replace('rpx', '').replace('upx', '');
    isRpx = true;
  } else if (text.indexOf('px') !== -1) {
    text = text.replace('px', '');
  }
  if (!isNaN(text)) {
    if (isRpx) return Number(uni.upx2px(text));
    return Number(text);
  }
  return 0;
}

// 获取当前时间
function getTime() {
  return new Date().getTime();
}

// 获取z-paging实例id，随机生成10位数字+字母
function getInstanceId() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 10; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  return s.join('') + getTime();
}

// 等待一段时间
function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// 是否是promise
function isPromise(func) {
  return Object.prototype.toString.call(func) === '[object Promise]';
}

// 添加单位
function addUnit(value, unit) {
  if (Object.prototype.toString.call(value) === '[object String]') {
    var tempValue = value;
    tempValue = tempValue.replace('rpx', '').replace('upx', '').replace('px', '');
    if (value.indexOf('rpx') === -1 && value.indexOf('upx') === -1 && value.indexOf('px') !== -1) {
      tempValue = parseFloat(tempValue) * 2;
    }
    value = tempValue;
  }
  return unit === 'rpx' ? value + 'rpx' : value / 2 + 'px';
}

// 深拷贝
function deepCopy(obj) {
  if ((0, _typeof2.default)(obj) !== 'object' || obj === null) return obj;
  var newObj = Array.isArray(obj) ? [] : {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = deepCopy(obj[key]);
    }
  }
  return newObj;
}

// ------------------ 私有方法 ------------------------
// 处理全局配置
function _handleDefaultConfig() {
  // 确保只加载一次全局配置
  if (configLoaded) return;
  // 优先从config.js中读取
  if (_index.default && Object.keys(_index.default).length) {
    config = _index.default;
  }
  // 如果在config.js中读取不到，则尝试到uni.$zp读取
  if (!config && uni.$zp) {
    config = uni.$zp.config;
  }
  // 将config中的短横线写法全部转为驼峰写法，使得读取配置时可以直接通过key去匹配，而非读取每个配置时候再去转，减少不必要的性能开支
  config = config ? Object.keys(config).reduce(function (result, key) {
    result[_toCamelCase(key)] = config[key];
    return result;
  }, {}) : null;
  configLoaded = true;
}

// 时间格式化
function _timeFormat(time, textMap) {
  var date = new Date(time);
  var currentDate = new Date();
  // 设置time对应的天，去除时分秒，使得可以直接比较日期
  var dateDay = new Date(time).setHours(0, 0, 0, 0);
  // 设置当前的天，去除时分秒，使得可以直接比较日期
  var currentDateDay = new Date().setHours(0, 0, 0, 0);
  var disTime = dateDay - currentDateDay;
  var dayStr = '';
  var timeStr = _dateTimeFormat(date);
  if (disTime === 0) {
    dayStr = textMap.today;
  } else if (disTime === -86400000) {
    dayStr = textMap.yesterday;
  } else {
    dayStr = _dateDayFormat(date, date.getFullYear() !== currentDate.getFullYear());
  }
  return "".concat(dayStr, " ").concat(timeStr);
}

// date格式化为年月日
function _dateDayFormat(date) {
  var showYear = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return showYear ? "".concat(year, "-").concat(_fullZeroToTwo(month), "-").concat(_fullZeroToTwo(day)) : "".concat(_fullZeroToTwo(month), "-").concat(_fullZeroToTwo(day));
}

// data格式化为时分
function _dateTimeFormat(date) {
  var hour = date.getHours();
  var minute = date.getMinutes();
  return "".concat(_fullZeroToTwo(hour), ":").concat(_fullZeroToTwo(minute));
}

// 不满2位在前面填充0
function _fullZeroToTwo(str) {
  str = str.toString();
  return str.length === 1 ? '0' + str : str;
}

// 驼峰转短横线
function _toKebab(value) {
  return value.replace(/([A-Z])/g, "-$1").toLowerCase();
}

// 短横线转驼峰
function _toCamelCase(value) {
  return value.replace(/-([a-z])/g, function (_, group1) {
    return group1.toUpperCase();
  });
}
var _default = {
  gc: gc,
  setRefesrherTime: setRefesrherTime,
  getRefesrherFormatTimeByKey: getRefesrherFormatTimeByKey,
  getTouch: getTouch,
  getTouchFromZPaging: getTouchFromZPaging,
  getParent: getParent,
  convertToPx: convertToPx,
  getTime: getTime,
  getInstanceId: getInstanceId,
  consoleErr: consoleErr,
  delay: delay,
  wait: wait,
  isPromise: isPromise,
  addUnit: addUnit,
  deepCopy: deepCopy
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 95 */
/*!************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/config/index.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// z-paging全局配置文件，注意避免更新时此文件被覆盖，若被覆盖，可在此文件中右键->点击本地历史记录，找回覆盖前的配置
var _default = {};
exports.default = _default;

/***/ }),
/* 96 */
/*!************************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/common-layout.js ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// [z-paging]通用布局相关模块
var _default = {
  data: function data() {
    return {
      systemInfo: null,
      cssSafeAreaInsetBottom: -1,
      isReadyDestroy: false
    };
  },
  computed: {
    // 顶部可用距离
    windowTop: function windowTop() {
      if (!this.systemInfo) return 0;
      // 暂时修复vue3中隐藏系统导航栏后windowTop获取不正确的问题，具体bug详见https://ask.dcloud.net.cn/question/141634
      // 感谢litangyu！！https://github.com/SmileZXLee/uni-z-paging/issues/25

      return this.systemInfo.windowTop || 0;
    },
    // 底部安全区域高度
    safeAreaBottom: function safeAreaBottom() {
      if (!this.systemInfo) return 0;
      var safeAreaBottom = 0;
      safeAreaBottom = Math.max(this.cssSafeAreaInsetBottom, 0);
      return safeAreaBottom;
    },
    // 是否是比较老的webview，在一些老的webview中，需要进行一些特殊处理
    isOldWebView: function isOldWebView() {
      try {
        var systemInfos = uni.getSystemInfoSync().system.split(' ');
        var deviceType = systemInfos[0];
        var version = parseInt(systemInfos[1]);
        if (deviceType === 'iOS' && version <= 10 || deviceType === 'Android' && version <= 6) {
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    },
    // 当前组件的$slots，兼容不同平台
    zSlots: function zSlots() {
      return this.$scopedSlots || this.$slots;
      return this.$slots;
    }
  },
  beforeDestroy: function beforeDestroy() {
    this.isReadyDestroy = true;
  },
  methods: {
    // 更新fixed模式下z-paging的布局
    updateFixedLayout: function updateFixedLayout() {
      var _this = this;
      this.fixed && this.$nextTick(function () {
        _this.systemInfo = uni.getSystemInfoSync();
      });
    },
    // 获取节点尺寸
    _getNodeClientRect: function _getNodeClientRect(select) {
      var inDom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var scrollOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (this.isReadyDestroy) {
        return Promise.resolve(false);
      }
      ;
      // nvue中获取节点信息

      // vue中获取节点信息

      var res = !!inDom ? uni.createSelectorQuery().in(inDom === true ? this : inDom) : uni.createSelectorQuery();
      scrollOffset ? res.select(select).scrollOffset() : res.select(select).boundingClientRect();
      return new Promise(function (resolve, reject) {
        res.exec(function (data) {
          resolve(data && data != '' && data != undefined && data.length ? data : false);
        });
      });
    },
    // 获取slot="left"和slot="right"宽度并且更新布局
    _updateLeftAndRightWidth: function _updateLeftAndRightWidth(targetStyle, parentNodePrefix) {
      var _this2 = this;
      this.$nextTick(function () {
        var delayTime = 0;
        setTimeout(function () {
          ['left', 'right'].map(function (position) {
            _this2._getNodeClientRect(".".concat(parentNodePrefix, "-").concat(position)).then(function (res) {
              _this2.$set(targetStyle, position, res ? res[0].width + 'px' : '0px');
            });
          });
        }, delayTime);
      });
    },
    // 通过获取css设置的底部安全区域占位view高度设置bottom距离（直接通过systemInfo在部分平台上无法获取到底部安全区域）
    _getCssSafeAreaInsetBottom: function _getCssSafeAreaInsetBottom(success) {
      var _this3 = this;
      this._getNodeClientRect('.zp-safe-area-inset-bottom').then(function (res) {
        _this3.cssSafeAreaInsetBottom = res ? res[0].height : -1;
        res && success && success();
      });
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 97 */
/*!**********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/data-handle.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/slicedToArray */ 5));
var _toConsumableArray2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/toConsumableArray */ 18));
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! .././z-paging-constant */ 93));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
var _zPagingInterceptor = _interopRequireDefault(__webpack_require__(/*! ../z-paging-interceptor */ 99));
// [z-paging]数据处理模块
var _default2 = {
  props: {
    // 自定义初始的pageNo，默认为1
    defaultPageNo: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('defaultPageNo', 1),
      observer: function observer(newVal) {
        this.pageNo = newVal;
      }
    },
    // 自定义pageSize，默认为10
    defaultPageSize: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('defaultPageSize', 10),
      validator: function validator(value) {
        if (value <= 0) _zPagingUtils.default.consoleErr('default-page-size必须大于0！');
        return value > 0;
      }
    },
    // 为保证数据一致，设置当前tab切换时的标识key，并在complete中传递相同key，若二者不一致，则complete将不会生效
    dataKey: {
      type: [Number, String, Object],
      default: _zPagingUtils.default.gc('dataKey', null)
    },
    // 使用缓存，若开启将自动缓存第一页的数据，默认为否。请注意，因考虑到切换tab时不同tab数据不同的情况，默认仅会缓存组件首次加载时第一次请求到的数据，后续的下拉刷新操作不会更新缓存。
    useCache: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useCache', false)
    },
    // 使用缓存时缓存的key，用于区分不同列表的缓存数据，useCache为true时必须设置，否则缓存无效
    cacheKey: {
      type: String,
      default: _zPagingUtils.default.gc('cacheKey', null)
    },
    // 缓存模式，默认仅会缓存组件首次加载时第一次请求到的数据，可设置为always，即代表总是缓存，每次列表刷新(下拉刷新、调用reload等)都会更新缓存
    cacheMode: {
      type: String,
      default: _zPagingUtils.default.gc('cacheMode', _zPagingEnum.default.CacheMode.Default)
    },
    // 自动注入的list名，可自动修改父view(包含ref="paging")中对应name的list值
    autowireListName: {
      type: String,
      default: _zPagingUtils.default.gc('autowireListName', '')
    },
    // 自动注入的query名，可自动调用父view(包含ref="paging")中的query方法
    autowireQueryName: {
      type: String,
      default: _zPagingUtils.default.gc('autowireQueryName', '')
    },
    // 获取分页数据Function，功能与@query类似。若设置了fetch则@query将不再触发
    fetch: {
      type: Function,
      default: _zPagingUtils.default.gc('fetch', null, true)
    },
    // fetch的附加参数，fetch配置后有效
    fetchParams: {
      type: Object,
      default: _zPagingUtils.default.gc('fetchParams', null)
    },
    // z-paging mounted后自动调用reload方法(mounted后自动调用接口)，默认为是
    auto: {
      type: Boolean,
      default: _zPagingUtils.default.gc('auto', true)
    },
    // 用户下拉刷新时是否触发reload方法，默认为是
    reloadWhenRefresh: {
      type: Boolean,
      default: _zPagingUtils.default.gc('reloadWhenRefresh', true)
    },
    // reload时自动滚动到顶部，默认为是
    autoScrollToTopWhenReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoScrollToTopWhenReload', true)
    },
    // reload时立即自动清空原list，默认为是，若立即自动清空，则在reload之后、请求回调之前页面是空白的
    autoCleanListWhenReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoCleanListWhenReload', true)
    },
    // 列表刷新时自动显示下拉刷新view，默认为否
    showRefresherWhenReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showRefresherWhenReload', false)
    },
    // 列表刷新时自动显示加载更多view，且为加载中状态，默认为否
    showLoadingMoreWhenReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showLoadingMoreWhenReload', false)
    },
    // 组件created时立即触发reload(可解决一些情况下先看到页面再看到loading的问题)，auto为true时有效。为否时将在mounted+nextTick后触发reload，默认为否
    createdReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('createdReload', false)
    },
    // 本地分页时上拉加载更多延迟时间，单位为毫秒，默认200毫秒
    localPagingLoadingTime: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('localPagingLoadingTime', 200)
    },
    // 自动拼接complete中传过来的数组(使用聊天记录模式时无效)
    concat: {
      type: Boolean,
      default: _zPagingUtils.default.gc('concat', true)
    },
    // 请求失败是否触发reject，默认为是
    callNetworkReject: {
      type: Boolean,
      default: _zPagingUtils.default.gc('callNetworkReject', true)
    },
    // 父组件v-model所绑定的list的值
    value: {
      type: Array,
      default: function _default() {
        return [];
      }
    }
  },
  data: function data() {
    return {
      currentData: [],
      totalData: [],
      realTotalData: [],
      totalLocalPagingList: [],
      dataPromiseResultMap: {
        reload: null,
        complete: null,
        localPaging: null
      },
      isSettingCacheList: false,
      pageNo: 1,
      currentRefreshPageSize: 0,
      isLocalPaging: false,
      isAddedData: false,
      isTotalChangeFromAddData: false,
      privateConcat: true,
      myParentQuery: -1,
      firstPageLoaded: false,
      pagingLoaded: false,
      loaded: false,
      isUserReload: true,
      fromEmptyViewReload: false,
      queryFrom: '',
      listRendering: false,
      isHandlingRefreshToPage: false,
      isFirstPageAndNoMore: false,
      totalDataChangeThrow: true
    };
  },
  computed: {
    pageSize: function pageSize() {
      return this.defaultPageSize;
    },
    finalConcat: function finalConcat() {
      return this.concat && this.privateConcat;
    },
    finalUseCache: function finalUseCache() {
      if (this.useCache && !this.cacheKey) {
        _zPagingUtils.default.consoleErr('use-cache为true时，必须设置cache-key，否则缓存无效！');
      }
      return this.useCache && !!this.cacheKey;
    },
    finalCacheKey: function finalCacheKey() {
      return this.cacheKey ? "".concat(_zPagingConstant.default.cachePrefixKey, "-").concat(this.cacheKey) : null;
    },
    isFirstPage: function isFirstPage() {
      return this.pageNo === this.defaultPageNo;
    }
  },
  watch: {
    totalData: function totalData(newVal, oldVal) {
      this._totalDataChange(newVal, oldVal, this.totalDataChangeThrow);
      this.totalDataChangeThrow = true;
    },
    currentData: function currentData(newVal, oldVal) {
      this._currentDataChange(newVal, oldVal);
    },
    useChatRecordMode: function useChatRecordMode(newVal, oldVal) {
      if (newVal) {
        this.nLoadingMoreFixedHeight = false;
      }
    },
    value: {
      handler: function handler(newVal) {
        // 当v-model绑定的数据源被更改时，此时数据源改变不emit input事件，避免循环调用
        if (newVal !== this.totalData) {
          this.totalDataChangeThrow = false;
          this.totalData = newVal;
        }
      },
      immediate: true
    }
  },
  methods: {
    // 请求结束(成功或者失败)调用此方法，将请求的结果传递给z-paging处理，第一个参数为请求结果数组，第二个参数为是否成功(默认为是）
    complete: function complete(data) {
      var success = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      this.customNoMore = -1;
      return this.addData(data, success);
    },
    //【保证数据一致】请求结束(成功或者失败)调用此方法，将请求的结果传递给z-paging处理，第一个参数为请求结果数组，第二个参数为dataKey，需与:data-key绑定的一致，第三个参数为是否成功(默认为是）
    completeByKey: function completeByKey(data) {
      var dataKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var success = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      if (dataKey !== null && this.dataKey !== null && dataKey !== this.dataKey) {
        this.isFirstPage && this.endRefresh();
        return new Promise(function (resolve) {
          return resolve();
        });
      }
      this.customNoMore = -1;
      return this.addData(data, success);
    },
    //【通过total判断是否有更多数据】请求结束(成功或者失败)调用此方法，将请求的结果传递给z-paging处理，第一个参数为请求结果数组，第二个参数为total(列表总数)，第三个参数为是否成功(默认为是）
    completeByTotal: function completeByTotal(data, total) {
      var _this = this;
      var success = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      if (total == 'undefined') {
        this.customNoMore = -1;
      } else {
        var dataTypeRes = this._checkDataType(data, success, false);
        data = dataTypeRes.data;
        success = dataTypeRes.success;
        if (total >= 0 && success) {
          return new Promise(function (resolve, reject) {
            _this.$nextTick(function () {
              var nomore = false;
              var realTotalDataCount = _this.pageNo == _this.defaultPageNo ? 0 : _this.realTotalData.length;
              var dataLength = _this.privateConcat ? data.length : 0;
              var exceedCount = realTotalDataCount + dataLength - total;
              // 没有更多数据了
              if (exceedCount >= 0) {
                nomore = true;
                // 仅截取total内部分的数据
                exceedCount = _this.defaultPageSize - exceedCount;
                if (_this.privateConcat && exceedCount > 0 && exceedCount < data.length) {
                  data = data.splice(0, exceedCount);
                }
              }
              _this.completeByNoMore(data, nomore, success).then(function (res) {
                return resolve(res);
              }).catch(function () {
                return reject();
              });
            });
          });
        }
      }
      return this.addData(data, success);
    },
    //【自行判断是否有更多数据】请求结束(成功或者失败)调用此方法，将请求的结果传递给z-paging处理，第一个参数为请求结果数组，第二个参数为是否没有更多数据，第三个参数为是否成功(默认是是）
    completeByNoMore: function completeByNoMore(data, nomore) {
      var success = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      if (nomore != 'undefined') {
        this.customNoMore = nomore == true ? 1 : 0;
      }
      return this.addData(data, success);
    },
    // 请求结束且请求失败时调用，支持传入请求失败原因
    completeByError: function completeByError(errorMsg) {
      this.customerEmptyViewErrorText = errorMsg;
      return this.complete(false);
    },
    // 与上方complete方法功能一致，新版本中设置服务端回调数组请使用complete方法
    addData: function addData(data) {
      var _this2 = this;
      var success = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      if (!this.fromCompleteEmit) {
        this.disabledCompleteEmit = true;
        this.fromCompleteEmit = false;
      }
      var currentTimeStamp = _zPagingUtils.default.getTime();
      var disTime = currentTimeStamp - this.requestTimeStamp;
      var minDelay = this.minDelay;
      if (this.isFirstPage && this.finalShowRefresherWhenReload) {
        minDelay = Math.max(400, minDelay);
      }
      var addDataDalay = this.requestTimeStamp > 0 && disTime < minDelay ? minDelay - disTime : 0;
      this.$nextTick(function () {
        _zPagingUtils.default.delay(function () {
          _this2._addData(data, success, false);
        }, _this2.delay > 0 ? _this2.delay : addDataDalay);
      });
      return new Promise(function (resolve, reject) {
        _this2.dataPromiseResultMap.complete = {
          resolve: resolve,
          reject: reject
        };
      });
    },
    // 从顶部添加数据，不会影响分页的pageNo和pageSize
    addDataFromTop: function addDataFromTop(data) {
      var _this3 = this;
      var toTop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var toTopWithAnimate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      // 数据是否拼接到顶部，如果是聊天记录模式并且列表没有倒置，则应该拼接在底部
      var addFromTop = !this.isChatRecordModeAndNotInversion;
      data = Object.prototype.toString.call(data) !== '[object Array]' ? [data] : addFromTop ? data.reverse() : data;
      this.finalUseVirtualList && this._setCellIndex(data, 'top');
      this.totalData = addFromTop ? [].concat((0, _toConsumableArray2.default)(data), (0, _toConsumableArray2.default)(this.totalData)) : [].concat((0, _toConsumableArray2.default)(this.totalData), (0, _toConsumableArray2.default)(data));
      if (toTop) {
        _zPagingUtils.default.delay(function () {
          return _this3.useChatRecordMode ? _this3.scrollToBottom(toTopWithAnimate) : _this3.scrollToTop(toTopWithAnimate);
        });
      }
    },
    // 重新设置列表数据，调用此方法不会影响pageNo和pageSize，也不会触发请求。适用场景：当需要删除列表中某一项时，将删除对应项后的数组通过此方法传递给z-paging。(当出现类似的需要修改列表数组的场景时，请使用此方法，请勿直接修改page中:list.sync绑定的数组)
    resetTotalData: function resetTotalData(data) {
      this.isTotalChangeFromAddData = true;
      data = Object.prototype.toString.call(data) !== '[object Array]' ? [data] : data;
      this.totalData = data;
    },
    // 设置本地分页数据，请求结束(成功或者失败)调用此方法，将请求的结果传递给z-paging作分页处理（若调用了此方法，则上拉加载更多时内部会自动分页，不会触发@query所绑定的事件）
    setLocalPaging: function setLocalPaging(data) {
      var _this4 = this;
      var success = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      this.isLocalPaging = true;
      this.$nextTick(function () {
        _this4._addData(data, success, true);
      });
      return new Promise(function (resolve, reject) {
        _this4.dataPromiseResultMap.localPaging = {
          resolve: resolve,
          reject: reject
        };
      });
    },
    // 重新加载分页数据，pageNo会恢复为默认值，相当于下拉刷新的效果(animate为true时会展示下拉刷新动画，默认为false)
    reload: function reload() {
      var _this5 = this;
      var animate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.showRefresherWhenReload;
      if (animate) {
        this.privateShowRefresherWhenReload = animate;
        this.isUserPullDown = true;
      }
      if (!this.showLoadingMoreWhenReload) {
        this.listRendering = true;
      }
      this.$nextTick(function () {
        _this5._preReload(animate, false);
      });
      return new Promise(function (resolve, reject) {
        _this5.dataPromiseResultMap.reload = {
          resolve: resolve,
          reject: reject
        };
      });
    },
    // 刷新列表数据，pageNo和pageSize不会重置，列表数据会重新从服务端获取。必须保证@query绑定的方法中的pageNo和pageSize和传给服务端的一致
    refresh: function refresh() {
      return this._handleRefreshWithDisPageNo(this.pageNo - this.defaultPageNo + 1);
    },
    // 刷新列表数据至指定页，例如pageNo=5时则代表刷新列表至第5页，此时pageNo会变为5，列表会展示前5页的数据。必须保证@query绑定的方法中的pageNo和pageSize和传给服务端的一致
    refreshToPage: function refreshToPage(pageNo) {
      this.isHandlingRefreshToPage = true;
      return this._handleRefreshWithDisPageNo(pageNo + this.defaultPageNo - 1);
    },
    // 手动更新列表缓存数据，将自动截取v-model绑定的list中的前pageSize条覆盖缓存，请确保在list数据更新到预期结果后再调用此方法
    updateCache: function updateCache() {
      if (this.finalUseCache && this.totalData.length) {
        this._saveLocalCache(this.totalData.slice(0, Math.min(this.totalData.length, this.pageSize)));
      }
    },
    // 清空分页数据
    clean: function clean() {
      this._reload(true);
      this._addData([], true, false);
    },
    // 清空分页数据
    clear: function clear() {
      this.clean();
    },
    // reload之前的一些处理
    _preReload: function _preReload() {
      var _this6 = this;
      var animate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.showRefresherWhenReload;
      var isFromMounted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var retryCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var showRefresher = this.finalRefresherEnabled && this.useCustomRefresher;

      // 如果获取slot="refresher"高度失败，则不触发reload，直到获取slot="refresher"高度成功
      if (this.customRefresherHeight === -1 && showRefresher) {
        _zPagingUtils.default.delay(function () {
          retryCount++;
          // 如果重试次数是10的倍数(也就是每500毫秒)，尝试重新获取一下slot="refresher"高度
          // 此举是为了解决在某些特殊情况下，z-paging组件mounted了，但是未展示在用户面前，（比如在tabbar页面中，未切换到对应tabbar但是通过代码让z-paging展示了，此时控制台会报Error: Not Found：Page，因为这时候去获取dom节点信息获取不到）
          // 当用户在某个时刻让此z-paging展示在面前时，即可顺利获取到slot="refresher"高度，递归停止
          if (retryCount % 10 === 0) {
            _this6._updateCustomRefresherHeight();
          }
          _this6._preReload(animate, isFromMounted, retryCount);
        }, _zPagingConstant.default.delayTime / 2);
        return;
      }
      this.isUserReload = true;
      this.loadingType = _zPagingEnum.default.LoadingType.Refresher;
      if (animate) {
        this.privateShowRefresherWhenReload = animate;
        if (this.useCustomRefresher) {
          this._doRefresherRefreshAnimate();
        } else {
          this.refresherTriggered = true;
        }
      } else {
        this._refresherEnd(false, false, false, false);
      }
      this._reload(false, isFromMounted);
    },
    // 重新加载分页数据
    _reload: function _reload() {
      var isClean = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var isFromMounted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var isUserPullDown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      this.isAddedData = false;
      this.insideOfPaging = -1;
      this.cacheScrollNodeHeight = -1;
      this.pageNo = this.defaultPageNo;
      this._cleanRefresherEndTimeout();
      !this.privateShowRefresherWhenReload && !isClean && this._startLoading(true);
      this.firstPageLoaded = true;
      this.isTotalChangeFromAddData = false;
      if (!this.isSettingCacheList) {
        this.totalData = [];
      }
      if (!isClean) {
        this._emitQuery(this.pageNo, this.defaultPageSize, isUserPullDown ? _zPagingEnum.default.QueryFrom.UserPullDown : _zPagingEnum.default.QueryFrom.Reload);
        var delay = 0;
        _zPagingUtils.default.delay(this._callMyParentQuery, delay);
        if (!isFromMounted && this.autoScrollToTopWhenReload) {
          var checkedNRefresherLoading = true;
          checkedNRefresherLoading && this._scrollToTop(false);
        }
      }
    },
    // 处理服务端返回的数组
    _addData: function _addData(data, success, isLocal) {
      var _this7 = this;
      this.isAddedData = true;
      this.fromEmptyViewReload = false;
      this.isTotalChangeFromAddData = true;
      this.refresherTriggered = false;
      this._endSystemLoadingAndRefresh();
      var tempIsUserPullDown = this.isUserPullDown;
      if (this.showRefresherUpdateTime && this.isFirstPage) {
        _zPagingUtils.default.setRefesrherTime(_zPagingUtils.default.getTime(), this.refresherUpdateTimeKey);
        this.$refs.refresh && this.$refs.refresh.updateTime();
      }
      if (!isLocal && tempIsUserPullDown && this.isFirstPage) {
        this.isUserPullDown = false;
      }
      if (!this.isFirstPage) {
        this.listRendering = true;
        this.$nextTick(function () {
          _zPagingUtils.default.delay(function () {
            return _this7.listRendering = false;
          });
        });
      } else {
        this.listRendering = false;
      }
      var dataTypeRes = this._checkDataType(data, success, isLocal);
      data = dataTypeRes.data;
      success = dataTypeRes.success;
      var delayTime = _zPagingConstant.default.delayTime;
      if (this.useChatRecordMode) delayTime = 0;
      this.loadingForNow = false;
      _zPagingUtils.default.delay(function () {
        _this7.pagingLoaded = true;
        _this7.$nextTick(function () {
          !isLocal && _this7._refresherEnd(delayTime > 0, true, tempIsUserPullDown);
        });
      });
      if (this.isFirstPage) {
        this.isLoadFailed = !success;
        this.$emit('isLoadFailedChange', this.isLoadFailed);
        if (this.finalUseCache && success && (this.cacheMode === _zPagingEnum.default.CacheMode.Always ? true : this.isSettingCacheList)) {
          this._saveLocalCache(data);
        }
      }
      this.isSettingCacheList = false;
      if (success) {
        if (!(this.privateConcat === false && !this.isHandlingRefreshToPage && this.loadingStatus === _zPagingEnum.default.More.NoMore)) {
          this.loadingStatus = _zPagingEnum.default.More.Default;
        }
        if (isLocal) {
          this.totalLocalPagingList = data;
          var localPageNo = this.defaultPageNo;
          var localPageSize = this.queryFrom !== _zPagingEnum.default.QueryFrom.Refresh ? this.defaultPageSize : this.currentRefreshPageSize;
          this._localPagingQueryList(localPageNo, localPageSize, 0, function (res) {
            _this7.completeByTotal(res, _this7.totalLocalPagingList.length);
          });
        } else {
          var dataChangeDelayTime = 0;
          _zPagingUtils.default.delay(function () {
            _this7._currentDataChange(data, _this7.currentData);
            _this7._callDataPromise(true, _this7.totalData);
          }, dataChangeDelayTime);
        }
        if (this.isHandlingRefreshToPage) {
          this.isHandlingRefreshToPage = false;
          this.pageNo = this.defaultPageNo + Math.ceil(data.length / this.pageSize) - 1;
          if (data.length % this.pageSize !== 0) {
            this.customNoMore = 1;
          }
        }
      } else {
        this._currentDataChange(data, this.currentData);
        this._callDataPromise(false);
        this.loadingStatus = _zPagingEnum.default.More.Fail;
        this.isHandlingRefreshToPage = false;
        if (this.loadingType === _zPagingEnum.default.LoadingType.LoadingMore) {
          this.pageNo--;
        }
      }
    },
    // 所有数据改变时调用
    _totalDataChange: function _totalDataChange(newVal, oldVal) {
      var _this8 = this;
      var eventThrow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      if ((!this.isUserReload || !this.autoCleanListWhenReload) && this.firstPageLoaded && !newVal.length && oldVal.length) {
        return;
      }
      this._doCheckScrollViewShouldFullHeight(newVal);
      if (!this.realTotalData.length && !newVal.length) {
        eventThrow = false;
      }
      this.realTotalData = newVal;
      // emit列表更新事件
      if (eventThrow) {
        this.$emit('input', newVal);
        this.$emit('update:list', newVal);
        this.$emit('listChange', newVal);
        this._callMyParentList(newVal);
      }
      this.firstPageLoaded = false;
      this.isTotalChangeFromAddData = false;
      this.$nextTick(function () {
        _zPagingUtils.default.delay(function () {
          // emit z-paging内容区域高度改变事件
          _this8._getNodeClientRect('.zp-paging-container-content').then(function (res) {
            res && _this8.$emit('contentHeightChanged', res[0].height);
          });
        }, _zPagingConstant.default.delayTime * (_this8.isIos ? 1 : 3));
      });
    },
    // 当前数据改变时调用
    _currentDataChange: function _currentDataChange(newVal, oldVal) {
      var _this9 = this;
      newVal = (0, _toConsumableArray2.default)(newVal);
      this.finalUseVirtualList && this._setCellIndex(newVal, 'bottom');
      if (this.isFirstPage && this.finalConcat) {
        this.totalData = [];
      }
      // customNoMore：-1代表交由z-paging自行判断；1代表没有更多了；0代表还有更多数据
      if (this.customNoMore !== -1) {
        // 如果customNoMore等于1 或者 customNoMore不是0并且新增数组长度为0(也就是不是明确的还有更多数据并且新增的数组长度为0)，则没有更多数据了
        if (this.customNoMore === 1 || this.customNoMore !== 0 && !newVal.length) {
          this.loadingStatus = _zPagingEnum.default.More.NoMore;
        }
      } else {
        // 如果新增的数据数组长度为0 或者 新增的数组长度小于默认的pageSize，则没有更多数据了
        if (!newVal.length || newVal.length && newVal.length < this.defaultPageSize) {
          this.loadingStatus = _zPagingEnum.default.More.NoMore;
        }
      }
      if (!this.totalData.length) {
        this.totalData = newVal;
      } else {
        if (this.finalConcat) {
          var currentScrollTop = this.oldScrollTop;
          this.totalData = [].concat((0, _toConsumableArray2.default)(this.totalData), (0, _toConsumableArray2.default)(newVal));
          // 此处是为了解决在微信小程序中，在某些情况下滚动到底部加载更多后滚动位置直接变为最底部的问题，因此需要通过代码强制滚动回加载更多前的位置

          if (!this.isIos && !this.refresherOnly && !this.usePageScroll && newVal.length) {
            this.loadingMoreTimeStamp = _zPagingUtils.default.getTime();
            this.$nextTick(function () {
              _this9.scrollToY(currentScrollTop);
            });
          }
        } else {
          this.totalData = newVal;
        }
      }
      this.privateConcat = true;
    },
    // 根据pageNo处理refresh操作
    _handleRefreshWithDisPageNo: function _handleRefreshWithDisPageNo(pageNo) {
      var _this10 = this;
      if (!this.isHandlingRefreshToPage && !this.realTotalData.length) return this.reload();
      if (pageNo >= 1) {
        this.loading = true;
        this.privateConcat = false;
        var totalPageSize = pageNo * this.pageSize;
        this.currentRefreshPageSize = totalPageSize;
        // 如果是本地分页，则在组件内部自己处理分页逻辑，不emit query相关事件
        if (this.isLocalPaging && this.isHandlingRefreshToPage) {
          this._localPagingQueryList(this.defaultPageNo, totalPageSize, 0, function (res) {
            _this10.complete(res);
          });
        } else {
          // emit query相关事件
          this._emitQuery(this.defaultPageNo, totalPageSize, _zPagingEnum.default.QueryFrom.Refresh);
          this._callMyParentQuery(this.defaultPageNo, totalPageSize);
        }
      }
      return new Promise(function (resolve, reject) {
        _this10.dataPromiseResultMap.reload = {
          resolve: resolve,
          reject: reject
        };
      });
    },
    // 本地分页请求
    _localPagingQueryList: function _localPagingQueryList(pageNo, pageSize, localPagingLoadingTime, callback) {
      pageNo = Math.max(1, pageNo);
      pageSize = Math.max(1, pageSize);
      var totalPagingList = (0, _toConsumableArray2.default)(this.totalLocalPagingList);
      var pageNoIndex = (pageNo - 1) * pageSize;
      var finalPageNoIndex = Math.min(totalPagingList.length, pageNoIndex + pageSize);
      var resultPagingList = totalPagingList.splice(pageNoIndex, finalPageNoIndex - pageNoIndex);
      _zPagingUtils.default.delay(function () {
        return callback(resultPagingList);
      }, localPagingLoadingTime);
    },
    // 存储列表缓存数据
    _saveLocalCache: function _saveLocalCache(data) {
      uni.setStorageSync(this.finalCacheKey, data);
    },
    // 通过缓存数据填充列表数据
    _setListByLocalCache: function _setListByLocalCache() {
      this.totalData = uni.getStorageSync(this.finalCacheKey) || [];
      this.isSettingCacheList = true;
    },
    // 修改父view的list
    _callMyParentList: function _callMyParentList(newVal) {
      if (this.autowireListName.length) {
        var myParent = _zPagingUtils.default.getParent(this.$parent);
        if (myParent && myParent[this.autowireListName]) {
          myParent[this.autowireListName] = newVal;
        }
      }
    },
    // 调用父view的query
    _callMyParentQuery: function _callMyParentQuery() {
      var customPageNo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var customPageSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      if (this.autowireQueryName) {
        if (this.myParentQuery === -1) {
          var myParent = _zPagingUtils.default.getParent(this.$parent);
          if (myParent && myParent[this.autowireQueryName]) {
            this.myParentQuery = myParent[this.autowireQueryName];
          }
        }
        if (this.myParentQuery !== -1) {
          customPageSize > 0 ? this.myParentQuery(customPageNo, customPageSize) : this.myParentQuery(this.pageNo, this.defaultPageSize);
        }
      }
    },
    // emit query事件
    _emitQuery: function _emitQuery(pageNo, pageSize, from) {
      var _this11 = this;
      this.queryFrom = from;
      this.requestTimeStamp = _zPagingUtils.default.getTime();
      var _this$realTotalData$s = this.realTotalData.slice(-1),
        _this$realTotalData$s2 = (0, _slicedToArray2.default)(_this$realTotalData$s, 1),
        lastItem = _this$realTotalData$s2[0];
      if (this.fetch) {
        var fetchParams = _zPagingInterceptor.default._handleFetchParams({
          pageNo: pageNo,
          pageSize: pageSize,
          from: from,
          lastItem: lastItem || null
        }, this.fetchParams);
        var fetchResult = this.fetch(fetchParams);
        if (!_zPagingInterceptor.default._handleFetchResult(fetchResult, this, fetchParams)) {
          _zPagingUtils.default.isPromise(fetchResult) ? fetchResult.then(function (res) {
            _this11.complete(res);
          }).catch(function (err) {
            _this11.complete(false);
          }) : this.complete(fetchResult);
        }
      } else {
        this.$emit.apply(this, ['query'].concat((0, _toConsumableArray2.default)(_zPagingInterceptor.default._handleQuery(pageNo, pageSize, from, lastItem || null))));
      }
    },
    // 触发数据改变promise
    _callDataPromise: function _callDataPromise(success, totalList) {
      for (var key in this.dataPromiseResultMap) {
        var obj = this.dataPromiseResultMap[key];
        if (!obj) continue;
        success ? obj.resolve({
          totalList: totalList,
          noMore: this.loadingStatus === _zPagingEnum.default.More.NoMore
        }) : this.callNetworkReject && obj.reject("z-paging-".concat(key, "-error"));
      }
    },
    // 检查complete data的类型
    _checkDataType: function _checkDataType(data, success, isLocal) {
      var dataType = Object.prototype.toString.call(data);
      if (dataType === '[object Boolean]') {
        success = data;
        data = [];
      } else if (dataType !== '[object Array]') {
        data = [];
        if (dataType !== '[object Undefined]' && dataType !== '[object Null]') {
          _zPagingUtils.default.consoleErr("".concat(isLocal ? 'setLocalPaging' : 'complete', "\u53C2\u6570\u7C7B\u578B\u4E0D\u6B63\u786E\uFF0C\u7B2C\u4E00\u4E2A\u53C2\u6570\u7C7B\u578B\u5FC5\u987B\u4E3AArray!"));
        }
      }
      return {
        data: data,
        success: success
      };
    }
  }
};
exports.default = _default2;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 98 */
/*!****************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-enum.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// [z-paging]枚举
var _default = {
  // 当前加载类型 0.下拉刷新 1.上拉加载更多
  LoadingType: {
    Refresher: 0,
    LoadingMore: 1
  },
  // 下拉刷新状态 0.默认状态 1.松手立即刷新 2.刷新中 3.刷新结束 4.松手进入二楼
  Refresher: {
    Default: 0,
    ReleaseToRefresh: 1,
    Loading: 2,
    Complete: 3,
    GoF2: 4
  },
  // 底部加载更多状态 0.默认状态 1.加载中 2.没有更多数据 3.加载失败
  More: {
    Default: 0,
    Loading: 1,
    NoMore: 2,
    Fail: 3
  },
  // @query触发来源 0.用户主动下拉刷新 1.通过reload触发 2.通过refresh触发 3.通过滚动到底部加载更多或点击底部加载更多触发
  QueryFrom: {
    UserPullDown: 0,
    Reload: 1,
    Refresh: 2,
    LoadingMore: 3
  },
  // 虚拟列表cell高度模式
  CellHeightMode: {
    // 固定高度
    Fixed: 'fixed',
    // 动态高度
    Dynamic: 'dynamic'
  },
  // 列表缓存模式
  CacheMode: {
    // 默认模式，只会缓存一次
    Default: 'default',
    // 总是缓存，每次列表刷新(下拉刷新、调用reload等)都会更新缓存
    Always: 'always'
  }
};
exports.default = _default;

/***/ }),
/* 99 */
/*!***********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/z-paging-interceptor.js ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ 11));
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
// [z-paging]拦截器

var queryKey = 'Query';
var fetchParamsKey = 'FetchParams';
var fetchResultKey = 'FetchResult';
var language2LocalKey = 'Language2Local';

// 拦截&处理@query事件
function handleQuery(callback) {
  _addHandleByKey(queryKey, callback);
  return this;
}

// 拦截&处理@query事件(私有，请勿调用)
function _handleQuery(pageNo, pageSize, from, lastItem) {
  var callback = _getHandleByKey(queryKey);
  return callback ? callback(pageNo, pageSize, from, lastItem) : [pageNo, pageSize, from];
}

// 拦截&处理:fetch参数
function handleFetchParams(callback) {
  _addHandleByKey(fetchParamsKey, callback);
  return this;
}

// 拦截&处理:fetch参数(私有，请勿调用)
function _handleFetchParams(parmas, extraParams) {
  var callback = _getHandleByKey(fetchParamsKey);
  return callback ? callback(parmas, extraParams || {}) : _objectSpread({
    pageNo: parmas.pageNo,
    pageSize: parmas.pageSize
  }, extraParams || {});
}

// 拦截&处理:fetch结果
function handleFetchResult(callback) {
  _addHandleByKey(fetchResultKey, callback);
  return this;
}

// 拦截&处理:fetch结果(私有，请勿调用)
function _handleFetchResult(result, paging, params) {
  var callback = _getHandleByKey(fetchResultKey);
  callback && callback(result, paging, params);
  return callback ? true : false;
}

// 拦截&处理系统language转i18n local
function handleLanguage2Local(callback) {
  _addHandleByKey(language2LocalKey, callback);
  return this;
}

// 拦截&处理系统language转i18n local(私有，请勿调用)
function _handleLanguage2Local(language, local) {
  var callback = _getHandleByKey(language2LocalKey);
  return callback ? callback(language, local) : local;
}

// 获取当前app对象
function _getApp() {
  return getApp();
}

// 添加处理函数
function _addHandleByKey(key, callback) {
  try {
    setTimeout(function () {
      _getApp().globalData["zp_handle".concat(key, "Callback")] = callback;
    }, 1);
  } catch (_) {}
}

// 获取处理回调函数
function _getHandleByKey(key) {
  return _getApp().globalData["zp_handle".concat(key, "Callback")];
}
var _default = {
  handleQuery: handleQuery,
  _handleQuery: _handleQuery,
  handleFetchParams: handleFetchParams,
  _handleFetchParams: _handleFetchParams,
  handleFetchResult: handleFetchResult,
  _handleFetchResult: _handleFetchResult,
  handleLanguage2Local: handleLanguage2Local,
  _handleLanguage2Local: _handleLanguage2Local
};
exports.default = _default;

/***/ }),
/* 100 */
/*!***************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/i18n.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _uniI18n = __webpack_require__(/*! @dcloudio/uni-i18n */ 22);
var _index = _interopRequireDefault(__webpack_require__(/*! ../../i18n/index.js */ 101));
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! .././z-paging-constant */ 93));
var _zPagingInterceptor = _interopRequireDefault(__webpack_require__(/*! ../z-paging-interceptor */ 99));
// [z-paging]i18n模块

var _initVueI18n = (0, _uniI18n.initVueI18n)(_index.default),
  t = _initVueI18n.t;
var language = uni.getSystemInfoSync().language;
var _default = {
  data: function data() {
    return {
      language: language
    };
  },
  computed: {
    finalLanguage: function finalLanguage() {
      try {
        var local = uni.getLocale();
        var _language = this.language;
        return local === 'auto' ? _zPagingInterceptor.default._handleLanguage2Local(_language, this._language2Local(_language)) : local;
      } catch (e) {
        // 如果获取系统本地语言异常，则默认返回中文，uni.getLocale在部分低版本HX或者cli中可能报找不到的问题
        return 'zh-Hans';
      }
    },
    // 最终的下拉刷新默认状态的文字
    finalRefresherDefaultText: function finalRefresherDefaultText() {
      return this._getI18nText('zp.refresher.default', this.refresherDefaultText);
    },
    // 最终的下拉刷新下拉中的文字
    finalRefresherPullingText: function finalRefresherPullingText() {
      return this._getI18nText('zp.refresher.pulling', this.refresherPullingText);
    },
    // 最终的下拉刷新中文字
    finalRefresherRefreshingText: function finalRefresherRefreshingText() {
      return this._getI18nText('zp.refresher.refreshing', this.refresherRefreshingText);
    },
    // 最终的下拉刷新完成文字
    finalRefresherCompleteText: function finalRefresherCompleteText() {
      return this._getI18nText('zp.refresher.complete', this.refresherCompleteText);
    },
    // 最终的下拉刷新上次更新时间文字
    finalRefresherUpdateTimeTextMap: function finalRefresherUpdateTimeTextMap() {
      return {
        title: t('zp.refresherUpdateTime.title'),
        none: t('zp.refresherUpdateTime.none'),
        today: t('zp.refresherUpdateTime.today'),
        yesterday: t('zp.refresherUpdateTime.yesterday')
      };
    },
    // 最终的继续下拉进入二楼文字
    finalRefresherGoF2Text: function finalRefresherGoF2Text() {
      return this._getI18nText('zp.refresher.f2', this.refresherGoF2Text);
    },
    // 最终的底部加载更多默认状态文字
    finalLoadingMoreDefaultText: function finalLoadingMoreDefaultText() {
      return this._getI18nText('zp.loadingMore.default', this.loadingMoreDefaultText);
    },
    // 最终的底部加载更多加载中文字
    finalLoadingMoreLoadingText: function finalLoadingMoreLoadingText() {
      return this._getI18nText('zp.loadingMore.loading', this.loadingMoreLoadingText);
    },
    // 最终的底部加载更多没有更多数据文字
    finalLoadingMoreNoMoreText: function finalLoadingMoreNoMoreText() {
      return this._getI18nText('zp.loadingMore.noMore', this.loadingMoreNoMoreText);
    },
    // 最终的底部加载更多加载失败文字
    finalLoadingMoreFailText: function finalLoadingMoreFailText() {
      return this._getI18nText('zp.loadingMore.fail', this.loadingMoreFailText);
    },
    // 最终的空数据图title
    finalEmptyViewText: function finalEmptyViewText() {
      return this.isLoadFailed ? this.finalEmptyViewErrorText : this._getI18nText('zp.emptyView.title', this.emptyViewText);
    },
    // 最终的空数据图reload title
    finalEmptyViewReloadText: function finalEmptyViewReloadText() {
      return this._getI18nText('zp.emptyView.reload', this.emptyViewReloadText);
    },
    // 最终的空数据图加载失败文字
    finalEmptyViewErrorText: function finalEmptyViewErrorText() {
      return this.customerEmptyViewErrorText || this._getI18nText('zp.emptyView.error', this.emptyViewErrorText);
    },
    // 最终的系统loading title
    finalSystemLoadingText: function finalSystemLoadingText() {
      return this._getI18nText('zp.systemLoading.title', this.systemLoadingText);
    }
  },
  methods: {
    // 获取当前z-paging的语言
    getLanguage: function getLanguage() {
      return this.finalLanguage;
    },
    // 获取国际化转换后的文本
    _getI18nText: function _getI18nText(key, value) {
      var dataType = Object.prototype.toString.call(value);
      if (dataType === '[object Object]') {
        var nextValue = value[this.finalLanguage];
        if (nextValue) return nextValue;
      } else if (dataType === '[object String]') {
        return value;
      }
      return t(key);
    },
    // 系统language转i18n local
    _language2Local: function _language2Local(language) {
      var formatedLanguage = language.toLowerCase().replace(new RegExp('_', ''), '-');
      if (formatedLanguage.indexOf('zh') !== -1) {
        if (formatedLanguage === 'zh' || formatedLanguage === 'zh-cn' || formatedLanguage.indexOf('zh-hans') !== -1) {
          return 'zh-Hans';
        }
        return 'zh-Hant';
      }
      if (formatedLanguage.indexOf('en') !== -1) return 'en';
      return language;
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 101 */
/*!**********************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/i18n/index.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _en = _interopRequireDefault(__webpack_require__(/*! ./en.json */ 102));
var _zhHans = _interopRequireDefault(__webpack_require__(/*! ./zh-Hans.json */ 103));
var _zhHant = _interopRequireDefault(__webpack_require__(/*! ./zh-Hant.json */ 104));
var _default = {
  en: _en.default,
  'zh-Hans': _zhHans.default,
  'zh-Hant': _zhHant.default
};
exports.default = _default;

/***/ }),
/* 102 */
/*!*********************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/i18n/en.json ***!
  \*********************************************************************************************/
/*! exports provided: zp.refresher.default, zp.refresher.pulling, zp.refresher.refreshing, zp.refresher.complete, zp.refresher.f2, zp.loadingMore.default, zp.loadingMore.loading, zp.loadingMore.noMore, zp.loadingMore.fail, zp.emptyView.title, zp.emptyView.reload, zp.emptyView.error, zp.refresherUpdateTime.title, zp.refresherUpdateTime.none, zp.refresherUpdateTime.today, zp.refresherUpdateTime.yesterday, zp.systemLoading.title, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"zp.refresher.default\":\"Pull down to refresh\",\"zp.refresher.pulling\":\"Release to refresh\",\"zp.refresher.refreshing\":\"Refreshing...\",\"zp.refresher.complete\":\"Refresh succeeded\",\"zp.refresher.f2\":\"Refresh to enter 2f\",\"zp.loadingMore.default\":\"Click to load more\",\"zp.loadingMore.loading\":\"Loading...\",\"zp.loadingMore.noMore\":\"No more data\",\"zp.loadingMore.fail\":\"Load failed,click to reload\",\"zp.emptyView.title\":\"No data\",\"zp.emptyView.reload\":\"Reload\",\"zp.emptyView.error\":\"Sorry,load failed\",\"zp.refresherUpdateTime.title\":\"Last update: \",\"zp.refresherUpdateTime.none\":\"None\",\"zp.refresherUpdateTime.today\":\"Today\",\"zp.refresherUpdateTime.yesterday\":\"Yesterday\",\"zp.systemLoading.title\":\"Loading...\"}");

/***/ }),
/* 103 */
/*!**************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/i18n/zh-Hans.json ***!
  \**************************************************************************************************/
/*! exports provided: zp.refresher.default, zp.refresher.pulling, zp.refresher.refreshing, zp.refresher.complete, zp.refresher.f2, zp.loadingMore.default, zp.loadingMore.loading, zp.loadingMore.noMore, zp.loadingMore.fail, zp.emptyView.title, zp.emptyView.reload, zp.emptyView.error, zp.refresherUpdateTime.title, zp.refresherUpdateTime.none, zp.refresherUpdateTime.today, zp.refresherUpdateTime.yesterday, zp.systemLoading.title, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"zp.refresher.default\":\"继续下拉刷新\",\"zp.refresher.pulling\":\"松开立即刷新\",\"zp.refresher.refreshing\":\"正在刷新...\",\"zp.refresher.complete\":\"刷新成功\",\"zp.refresher.f2\":\"松手进入二楼\",\"zp.loadingMore.default\":\"点击加载更多\",\"zp.loadingMore.loading\":\"正在加载...\",\"zp.loadingMore.noMore\":\"没有更多了\",\"zp.loadingMore.fail\":\"加载失败，点击重新加载\",\"zp.emptyView.title\":\"没有数据哦~\",\"zp.emptyView.reload\":\"重新加载\",\"zp.emptyView.error\":\"很抱歉，加载失败\",\"zp.refresherUpdateTime.title\":\"最后更新：\",\"zp.refresherUpdateTime.none\":\"无\",\"zp.refresherUpdateTime.today\":\"今天\",\"zp.refresherUpdateTime.yesterday\":\"昨天\",\"zp.systemLoading.title\":\"加载中...\"}");

/***/ }),
/* 104 */
/*!**************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/i18n/zh-Hant.json ***!
  \**************************************************************************************************/
/*! exports provided: zp.refresher.default, zp.refresher.pulling, zp.refresher.refreshing, zp.refresher.complete, zp.refresher.f2, zp.loadingMore.default, zp.loadingMore.loading, zp.loadingMore.noMore, zp.loadingMore.fail, zp.emptyView.title, zp.emptyView.reload, zp.emptyView.error, zp.refresherUpdateTime.title, zp.refresherUpdateTime.none, zp.refresherUpdateTime.today, zp.refresherUpdateTime.yesterday, zp.systemLoading.title, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"zp.refresher.default\":\"繼續下拉重繪\",\"zp.refresher.pulling\":\"鬆開立即重繪\",\"zp.refresher.refreshing\":\"正在重繪...\",\"zp.refresher.complete\":\"重繪成功\",\"zp.refresher.f2\":\"鬆手進入二樓\",\"zp.loadingMore.default\":\"點擊加載更多\",\"zp.loadingMore.loading\":\"正在加載...\",\"zp.loadingMore.noMore\":\"沒有更多了\",\"zp.loadingMore.fail\":\"加載失敗，點擊重新加載\",\"zp.emptyView.title\":\"沒有數據哦~\",\"zp.emptyView.reload\":\"重新加載\",\"zp.emptyView.error\":\"很抱歉，加載失敗\",\"zp.refresherUpdateTime.title\":\"最後更新：\",\"zp.refresherUpdateTime.none\":\"無\",\"zp.refresherUpdateTime.today\":\"今天\",\"zp.refresherUpdateTime.yesterday\":\"昨天\",\"zp.systemLoading.title\":\"加載中...\"}");

/***/ }),
/* 105 */
/*!***************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/nvue.js ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! .././z-paging-constant */ 93));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
// [z-paging]nvue独有部分模块
var _default = {
  props: {},
  data: function data() {
    return {
      nRefresherLoading: false,
      nListIsDragging: false,
      nShowBottom: true,
      nFixFreezing: false,
      nShowRefresherReveal: false,
      nLoadingMoreFixedHeight: false,
      nShowRefresherRevealHeight: 0,
      nOldShowRefresherRevealHeight: -1,
      nRefresherWidth: uni.upx2px(750),
      nF2Opacity: 0
    };
  },
  computed: {},
  mounted: function mounted() {},
  methods: {}
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 106 */
/*!****************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/empty.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
// [z-paging]空数据图view模块
var _default = {
  props: {
    // 是否强制隐藏空数据图，默认为否
    hideEmptyView: {
      type: Boolean,
      default: _zPagingUtils.default.gc('hideEmptyView', false)
    },
    // 空数据图描述文字，默认为“没有数据哦~”
    emptyViewText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('emptyViewText', null)
    },
    // 是否显示空数据图重新加载按钮(无数据时)，默认为否
    showEmptyViewReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showEmptyViewReload', false)
    },
    // 加载失败时是否显示空数据图重新加载按钮，默认为是
    showEmptyViewReloadWhenError: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showEmptyViewReloadWhenError', true)
    },
    // 空数据图点击重新加载文字，默认为“重新加载”
    emptyViewReloadText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('emptyViewReloadText', null)
    },
    // 空数据图图片，默认使用z-paging内置的图片
    emptyViewImg: {
      type: String,
      default: _zPagingUtils.default.gc('emptyViewImg', '')
    },
    // 空数据图“加载失败”描述文字，默认为“很抱歉，加载失败”
    emptyViewErrorText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('emptyViewErrorText', null)
    },
    // 空数据图“加载失败”图片，默认使用z-paging内置的图片
    emptyViewErrorImg: {
      type: String,
      default: _zPagingUtils.default.gc('emptyViewErrorImg', '')
    },
    // 空数据图样式
    emptyViewStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('emptyViewStyle', {})
    },
    // 空数据图容器样式
    emptyViewSuperStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('emptyViewSuperStyle', {})
    },
    // 空数据图img样式
    emptyViewImgStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('emptyViewImgStyle', {})
    },
    // 空数据图描述文字样式
    emptyViewTitleStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('emptyViewTitleStyle', {})
    },
    // 空数据图重新加载按钮样式
    emptyViewReloadStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('emptyViewReloadStyle', {})
    },
    // 空数据图片是否铺满z-paging，默认为否，即填充满z-paging内列表(滚动区域)部分。若设置为否，则为填铺满整个z-paging
    emptyViewFixed: {
      type: Boolean,
      default: _zPagingUtils.default.gc('emptyViewFixed', false)
    },
    // 空数据图片是否垂直居中，默认为是，若设置为否即为从空数据容器顶部开始显示。emptyViewFixed为false时有效
    emptyViewCenter: {
      type: Boolean,
      default: _zPagingUtils.default.gc('emptyViewCenter', true)
    },
    // 加载中时是否自动隐藏空数据图，默认为是
    autoHideEmptyViewWhenLoading: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoHideEmptyViewWhenLoading', true)
    },
    // 用户下拉列表触发下拉刷新加载中时是否自动隐藏空数据图，默认为是
    autoHideEmptyViewWhenPull: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoHideEmptyViewWhenPull', true)
    },
    // 空数据view的z-index，默认为9
    emptyViewZIndex: {
      type: Number,
      default: _zPagingUtils.default.gc('emptyViewZIndex', 9)
    }
  },
  data: function data() {
    return {
      customerEmptyViewErrorText: ''
    };
  },
  computed: {
    finalEmptyViewImg: function finalEmptyViewImg() {
      return this.isLoadFailed ? this.emptyViewErrorImg : this.emptyViewImg;
    },
    finalShowEmptyViewReload: function finalShowEmptyViewReload() {
      return this.isLoadFailed ? this.showEmptyViewReloadWhenError : this.showEmptyViewReload;
    },
    // 是否展示空数据图
    showEmpty: function showEmpty() {
      if (this.refresherOnly || this.hideEmptyView || this.realTotalData.length) return false;
      if (this.autoHideEmptyViewWhenLoading) {
        if (this.isAddedData && !this.firstPageLoaded && !this.loading) return true;
      } else {
        return true;
      }
      return !this.autoHideEmptyViewWhenPull && !this.isUserReload;
    }
  },
  methods: {
    // 点击了空数据view重新加载按钮
    _emptyViewReload: function _emptyViewReload() {
      var _this = this;
      var callbacked = false;
      this.$emit('emptyViewReload', function (reload) {
        if (reload === undefined || reload === true) {
          _this.fromEmptyViewReload = true;
          _this.reload().catch(function () {});
        }
        callbacked = true;
      });
      // 如果用户没有禁止默认的点击重新加载刷新列表事件，则触发列表重新刷新
      this.$nextTick(function () {
        if (!callbacked) {
          _this.fromEmptyViewReload = true;
          _this.reload().catch(function () {});
        }
      });
    },
    // 点击了空数据view
    _emptyViewClick: function _emptyViewClick() {
      this.$emit('emptyViewClick');
    }
  }
};
exports.default = _default;

/***/ }),
/* 107 */
/*!********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/refresher.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! .././z-paging-constant */ 93));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
// [z-paging]下拉刷新view模块
var _default = {
  props: {
    // 下拉刷新的主题样式，支持black，white，默认black
    refresherThemeStyle: {
      type: String,
      default: _zPagingUtils.default.gc('refresherThemeStyle', '')
    },
    // 自定义下拉刷新中左侧图标的样式
    refresherImgStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('refresherImgStyle', {})
    },
    // 自定义下拉刷新中右侧状态描述文字的样式
    refresherTitleStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('refresherTitleStyle', {})
    },
    // 自定义下拉刷新中右侧最后更新时间文字的样式(show-refresher-update-time为true时有效)
    refresherUpdateTimeStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('refresherUpdateTimeStyle', {})
    },
    // 在微信小程序和QQ小程序中，是否实时监听下拉刷新中进度，默认为否
    watchRefresherTouchmove: {
      type: Boolean,
      default: _zPagingUtils.default.gc('watchRefresherTouchmove', false)
    },
    // 底部加载更多的主题样式，支持black，white，默认black
    loadingMoreThemeStyle: {
      type: String,
      default: _zPagingUtils.default.gc('loadingMoreThemeStyle', '')
    },
    // 是否只使用下拉刷新，设置为true后将关闭mounted自动请求数据、关闭滚动到底部加载更多，强制隐藏空数据图。默认为否
    refresherOnly: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherOnly', false)
    },
    // 自定义下拉刷新默认状态下回弹动画时间，单位为毫秒，默认为100毫秒，nvue无效
    refresherDefaultDuration: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherDefaultDuration', 100)
    },
    // 自定义下拉刷新结束以后延迟回弹的时间，单位为毫秒，默认为0
    refresherCompleteDelay: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherCompleteDelay', 0)
    },
    // 自定义下拉刷新结束回弹动画时间，单位为毫秒，默认为300毫秒(refresherEndBounceEnabled为false时，refresherCompleteDuration为设定值的1/3)，nvue无效
    refresherCompleteDuration: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherCompleteDuration', 300)
    },
    // 自定义下拉刷新中是否允许列表滚动，默认为是
    refresherRefreshingScrollable: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherRefreshingScrollable', true)
    },
    // 自定义下拉刷新结束状态下是否允许列表滚动，默认为否
    refresherCompleteScrollable: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherCompleteScrollable', false)
    },
    // 是否使用自定义的下拉刷新，默认为是，即使用z-paging的下拉刷新。设置为false即代表使用uni scroll-view自带的下拉刷新，h5、App、微信小程序以外的平台不支持uni scroll-view自带的下拉刷新
    useCustomRefresher: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useCustomRefresher', true)
    },
    // 自定义下拉刷新下拉帧率，默认为40，过高可能会出现抖动问题
    refresherFps: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherFps', 40)
    },
    // 自定义下拉刷新允许触发的最大下拉角度，默认为40度，当下拉角度小于设定值时，自定义下拉刷新动画不会被触发
    refresherMaxAngle: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherMaxAngle', 40)
    },
    // 自定义下拉刷新的角度由未达到最大角度变到达到最大角度时，是否继续下拉刷新手势，默认为否
    refresherAngleEnableChangeContinued: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherAngleEnableChangeContinued', false)
    },
    // 自定义下拉刷新默认状态下的文字
    refresherDefaultText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('refresherDefaultText', null)
    },
    // 自定义下拉刷新松手立即刷新状态下的文字
    refresherPullingText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('refresherPullingText', null)
    },
    // 自定义下拉刷新刷新中状态下的文字
    refresherRefreshingText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('refresherRefreshingText', null)
    },
    // 自定义下拉刷新刷新结束状态下的文字
    refresherCompleteText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('refresherCompleteText', null)
    },
    // 自定义继续下拉进入二楼文字
    refresherGoF2Text: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('refresherGoF2Text', null)
    },
    // 自定义下拉刷新默认状态下的图片
    refresherDefaultImg: {
      type: String,
      default: _zPagingUtils.default.gc('refresherDefaultImg', null)
    },
    // 自定义下拉刷新松手立即刷新状态下的图片，默认与refresherDefaultImg一致
    refresherPullingImg: {
      type: String,
      default: _zPagingUtils.default.gc('refresherPullingImg', null)
    },
    // 自定义下拉刷新刷新中状态下的图片
    refresherRefreshingImg: {
      type: String,
      default: _zPagingUtils.default.gc('refresherRefreshingImg', null)
    },
    // 自定义下拉刷新刷新结束状态下的图片
    refresherCompleteImg: {
      type: String,
      default: _zPagingUtils.default.gc('refresherCompleteImg', null)
    },
    // 自定义下拉刷新刷新中状态下是否展示旋转动画
    refresherRefreshingAnimated: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherRefreshingAnimated', true)
    },
    // 是否开启自定义下拉刷新刷新结束回弹效果，默认为是
    refresherEndBounceEnabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherEndBounceEnabled', true)
    },
    // 是否开启自定义下拉刷新，默认为是
    refresherEnabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherEnabled', true)
    },
    // 设置自定义下拉刷新阈值，默认为80rpx
    refresherThreshold: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherThreshold', '80rpx')
    },
    // 设置系统下拉刷新默认样式，支持设置 black，white，none，none 表示不使用默认样式，默认为black
    refresherDefaultStyle: {
      type: String,
      default: _zPagingUtils.default.gc('refresherDefaultStyle', 'black')
    },
    // 设置自定义下拉刷新区域背景
    refresherBackground: {
      type: String,
      default: _zPagingUtils.default.gc('refresherBackground', 'transparent')
    },
    // 设置固定的自定义下拉刷新区域背景
    refresherFixedBackground: {
      type: String,
      default: _zPagingUtils.default.gc('refresherFixedBackground', 'transparent')
    },
    // 设置固定的自定义下拉刷新区域高度，默认为0
    refresherFixedBacHeight: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherFixedBacHeight', 0)
    },
    // 设置自定义下拉刷新下拉超出阈值后继续下拉位移衰减的比例，范围0-1，值越大代表衰减越多。默认为0.65(nvue无效)
    refresherOutRate: {
      type: Number,
      default: _zPagingUtils.default.gc('refresherOutRate', 0.65)
    },
    // 是否开启下拉进入二楼功能，默认为否
    refresherF2Enabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherF2Enabled', false)
    },
    // 下拉进入二楼阈值，默认为200rpx
    refresherF2Threshold: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherF2Threshold', '200rpx')
    },
    // 下拉进入二楼动画时间，单位为毫秒，默认为200毫秒
    refresherF2Duration: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('refresherF2Duration', 200)
    },
    // 下拉进入二楼状态松手后是否弹出二楼，默认为是
    showRefresherF2: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showRefresherF2', true)
    },
    // 设置自定义下拉刷新下拉时实际下拉位移与用户下拉距离的比值，默认为0.75，即代表若用户下拉10px，则实际位移为7.5px(nvue无效)
    refresherPullRate: {
      type: Number,
      default: _zPagingUtils.default.gc('refresherPullRate', 0.75)
    },
    // 是否显示最后更新时间，默认为否
    showRefresherUpdateTime: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showRefresherUpdateTime', false)
    },
    // 如果需要区别不同页面的最后更新时间，请为不同页面的z-paging的`refresher-update-time-key`设置不同的字符串
    refresherUpdateTimeKey: {
      type: String,
      default: _zPagingUtils.default.gc('refresherUpdateTimeKey', 'default')
    },
    // 下拉刷新时下拉到“松手立即刷新”或“松手进入二楼”状态时是否使手机短振动，默认为否（h5无效）
    refresherVibrate: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherVibrate', false)
    },
    // 下拉刷新时是否禁止下拉刷新view跟随用户触摸竖直移动，默认为否。注意此属性只是禁止下拉刷新view移动，其他下拉刷新逻辑依然会正常触发
    refresherNoTransform: {
      type: Boolean,
      default: _zPagingUtils.default.gc('refresherNoTransform', false)
    },
    // 是否开启下拉刷新状态栏占位，适用于隐藏导航栏时，下拉刷新需要避开状态栏高度的情况，默认为否
    useRefresherStatusBarPlaceholder: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useRefresherStatusBarPlaceholder', false)
    }
  },
  data: function data() {
    return {
      R: _zPagingEnum.default.Refresher,
      //下拉刷新状态
      refresherStatus: _zPagingEnum.default.Refresher.Default,
      refresherTouchstartY: 0,
      lastRefresherTouchmove: null,
      refresherReachMaxAngle: true,
      refresherTransform: 'translateY(0px)',
      refresherTransition: '',
      finalRefresherDefaultStyle: 'black',
      refresherRevealStackCount: 0,
      refresherCompleteTimeout: null,
      refresherCompleteSubTimeout: null,
      refresherEndTimeout: null,
      isTouchmovingTimeout: null,
      refresherTriggered: false,
      isTouchmoving: false,
      isTouchEnded: false,
      isUserPullDown: false,
      privateRefresherEnabled: -1,
      privateShowRefresherWhenReload: false,
      customRefresherHeight: -1,
      showCustomRefresher: false,
      doRefreshAnimateAfter: false,
      isRefresherInComplete: false,
      showF2: false,
      f2Transform: '',
      pullDownTimeStamp: 0,
      moveDis: 0,
      oldMoveDis: 0,
      currentDis: 0,
      oldCurrentMoveDis: 0,
      oldRefresherTouchmoveY: 0,
      oldTouchDirection: '',
      oldEmitedTouchDirection: '',
      oldPullingDistance: -1,
      refresherThresholdUpdateTag: 0
    };
  },
  watch: {
    refresherDefaultStyle: {
      handler: function handler(newVal) {
        if (newVal.length) {
          this.finalRefresherDefaultStyle = newVal;
        }
      },
      immediate: true
    },
    refresherStatus: function refresherStatus(newVal) {
      newVal === _zPagingEnum.default.Refresher.Loading && this._cleanRefresherEndTimeout();
      this.refresherVibrate && (newVal === _zPagingEnum.default.Refresher.ReleaseToRefresh || newVal === _zPagingEnum.default.Refresher.GoF2) && this._doVibrateShort();
      this.$emit('refresherStatusChange', newVal);
      this.$emit('update:refresherStatus', newVal);
    },
    // 监听当前下拉刷新启用/禁用状态
    refresherEnabled: function refresherEnabled(newVal) {
      // 当禁用下拉刷新时，强制收回正在展示的下拉刷新view
      !newVal && this.endRefresh();
    }
  },
  computed: {
    pullDownDisTimeStamp: function pullDownDisTimeStamp() {
      return 1000 / this.refresherFps;
    },
    refresherThresholdUnitConverted: function refresherThresholdUnitConverted() {
      return _zPagingUtils.default.addUnit(this.refresherThreshold, this.unit);
    },
    finalRefresherEnabled: function finalRefresherEnabled() {
      if (this.useChatRecordMode) return false;
      if (this.privateRefresherEnabled === -1) return this.refresherEnabled;
      return this.privateRefresherEnabled === 1;
    },
    finalRefresherThreshold: function finalRefresherThreshold() {
      var refresherThreshold = this.refresherThresholdUnitConverted;
      var idDefault = false;
      if (refresherThreshold === _zPagingUtils.default.addUnit(80, this.unit)) {
        idDefault = true;
        if (this.showRefresherUpdateTime) {
          refresherThreshold = _zPagingUtils.default.addUnit(120, this.unit);
        }
      }
      if (idDefault && this.customRefresherHeight > 0) return this.customRefresherHeight + this.finalRefresherThresholdPlaceholder;
      return _zPagingUtils.default.convertToPx(refresherThreshold) + this.finalRefresherThresholdPlaceholder;
    },
    finalRefresherF2Threshold: function finalRefresherF2Threshold() {
      return _zPagingUtils.default.convertToPx(_zPagingUtils.default.addUnit(this.refresherF2Threshold, this.unit));
    },
    finalRefresherThresholdPlaceholder: function finalRefresherThresholdPlaceholder() {
      return this.useRefresherStatusBarPlaceholder ? this.statusBarHeight : 0;
    },
    finalRefresherFixedBacHeight: function finalRefresherFixedBacHeight() {
      return _zPagingUtils.default.convertToPx(this.refresherFixedBacHeight);
    },
    finalRefresherThemeStyle: function finalRefresherThemeStyle() {
      return this.refresherThemeStyle.length ? this.refresherThemeStyle : this.defaultThemeStyle;
    },
    finalRefresherOutRate: function finalRefresherOutRate() {
      var rate = this.refresherOutRate;
      rate = Math.max(0, rate);
      rate = Math.min(1, rate);
      return rate;
    },
    finalRefresherPullRate: function finalRefresherPullRate() {
      var rate = this.refresherPullRate;
      rate = Math.max(0, rate);
      return rate;
    },
    finalRefresherTransform: function finalRefresherTransform() {
      if (this.refresherNoTransform || this.refresherTransform === 'translateY(0px)') return 'none';
      return this.refresherTransform;
    },
    finalShowRefresherWhenReload: function finalShowRefresherWhenReload() {
      return this.showRefresherWhenReload || this.privateShowRefresherWhenReload;
    },
    finalRefresherTriggered: function finalRefresherTriggered() {
      if (!(this.finalRefresherEnabled && !this.useCustomRefresher)) return false;
      return this.refresherTriggered;
    },
    showRefresher: function showRefresher() {
      var showRefresher = this.finalRefresherEnabled && this.useCustomRefresher;
      this.active && this.customRefresherHeight === -1 && showRefresher && this.updateCustomRefresherHeight();
      return showRefresher;
    },
    hasTouchmove: function hasTouchmove() {
      return this.watchRefresherTouchmove;
      return true;
      return this.watchRefresherTouchmove;
    }
  },
  methods: {
    // 终止下拉刷新状态
    endRefresh: function endRefresh() {
      var _this = this;
      this.totalData = this.realTotalData;
      this._refresherEnd();
      this._endSystemLoadingAndRefresh();
      this._handleScrollViewBounce({
        bounce: true
      });
      this.$nextTick(function () {
        _this.refresherTriggered = false;
      });
    },
    // 手动更新自定义下拉刷新view高度
    updateCustomRefresherHeight: function updateCustomRefresherHeight() {
      var _this2 = this;
      _zPagingUtils.default.delay(function () {
        return _this2.$nextTick(_this2._updateCustomRefresherHeight);
      });
    },
    // 关闭二楼
    closeF2: function closeF2() {
      this._handleCloseF2();
    },
    // 自定义下拉刷新被触发
    _onRefresh: function _onRefresh() {
      var fromScrollView = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var isUserPullDown = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      if (fromScrollView && !(this.finalRefresherEnabled && !this.useCustomRefresher)) return;
      this.$emit('onRefresh');
      this.$emit('Refresh');
      if (this.loading || this.isRefresherInComplete) return;
      this.loadingType = _zPagingEnum.default.LoadingType.Refresher;
      if (this.nShowRefresherReveal) return;
      this.isUserPullDown = isUserPullDown;
      this.isUserReload = !isUserPullDown;
      this._startLoading(true);
      this.refresherTriggered = true;
      if (this.reloadWhenRefresh && isUserPullDown) {
        this.useChatRecordMode ? this._onLoadingMore('click') : this._reload(false, false, isUserPullDown);
      }
    },
    // 自定义下拉刷新被复位
    _onRestore: function _onRestore() {
      this.refresherTriggered = 'restore';
      this.$emit('onRestore');
      this.$emit('Restore');
    },
    // 进一步处理touch开始结果
    _handleRefresherTouchstart: function _handleRefresherTouchstart(touch) {
      if (!this.loading && this.isTouchEnded) {
        this.isTouchmoving = false;
      }
      this.loadingType = _zPagingEnum.default.LoadingType.Refresher;
      this.isTouchmovingTimeout && clearTimeout(this.isTouchmovingTimeout);
      this.isTouchEnded = false;
      this.refresherTransition = '';
      this.refresherTouchstartY = touch.touchY;
      this.$emit('refresherTouchstart', this.refresherTouchstartY);
      this.lastRefresherTouchmove = touch;
      this._cleanRefresherCompleteTimeout();
      this._cleanRefresherEndTimeout();
    },
    // 非appvue或微信小程序或QQ小程序或h5平台，使用js控制下拉刷新
    // 进一步处理touch中结果
    _handleRefresherTouchmove: function _handleRefresherTouchmove(moveDis, touch) {
      this.refresherReachMaxAngle = true;
      this.isTouchmovingTimeout && clearTimeout(this.isTouchmovingTimeout);
      this.isTouchmoving = true;
      this.isTouchEnded = false;
      // 更新下拉刷新状态
      // 下拉刷新距离超过阈值
      if (moveDis >= this.finalRefresherThreshold) {
        // 如果开启了下拉进入二楼并且下拉刷新距离超过进入二楼阈值，则当前下拉刷新状态为松手进入二楼，否则为松手立即刷新
        this.refresherStatus = this.refresherF2Enabled && moveDis >= this.finalRefresherF2Threshold ? _zPagingEnum.default.Refresher.GoF2 : _zPagingEnum.default.Refresher.ReleaseToRefresh;
      } else {
        // 下拉刷新距离未超过阈值，显示默认状态
        this.refresherStatus = _zPagingEnum.default.Refresher.Default;
      }
      this.moveDis = moveDis;
    },
    // 进一步处理touch结束结果
    _handleRefresherTouchend: function _handleRefresherTouchend(moveDis) {
      var _this3 = this;
      this.isTouchmovingTimeout && clearTimeout(this.isTouchmovingTimeout);
      this.refresherReachMaxAngle = true;
      this.isTouchEnded = true;
      var refresherThreshold = this.finalRefresherThreshold;
      if (moveDis >= refresherThreshold && (this.refresherStatus === _zPagingEnum.default.Refresher.ReleaseToRefresh || this.refresherStatus === _zPagingEnum.default.Refresher.GoF2)) {
        // 如果是松手进入二楼状态，则触发进入二楼
        if (this.refresherStatus === _zPagingEnum.default.Refresher.GoF2) {
          this._handleGoF2();
          this._refresherEnd();
        } else {
          // 如果是松手立即刷新状态，则触发下拉刷新

          _zPagingUtils.default.delay(function () {
            _this3._emitTouchmove({
              pullingDistance: refresherThreshold,
              dy: _this3.moveDis - refresherThreshold
            });
          }, 0.1);
          this.moveDis = refresherThreshold;
          this.refresherStatus = _zPagingEnum.default.Refresher.Loading;
          this._doRefresherLoad();
        }
      } else {
        this._refresherEnd();
        this.isTouchmovingTimeout = _zPagingUtils.default.delay(function () {
          _this3.isTouchmoving = false;
        }, this.refresherDefaultDuration);
      }
      this.scrollEnable = true;
      this.$emit('refresherTouchend', moveDis);
    },
    // 处理列表触摸开始事件
    _handleListTouchstart: function _handleListTouchstart() {
      if (this.useChatRecordMode && this.autoHideKeyboardWhenChat) {
        uni.hideKeyboard();
        this.$emit('hidedKeyboard');
      }
    },
    // 处理scroll-view bounce是否生效
    _handleScrollViewBounce: function _handleScrollViewBounce(_ref) {
      var bounce = _ref.bounce;
      if (!this.usePageScroll && !this.scrollToTopBounceEnabled) {
        if (this.wxsScrollTop <= 5) {
          this.refresherTransition = '';
          this.scrollEnable = bounce;
        } else if (bounce) {
          this.scrollEnable = bounce;
        }
      }
    },
    // wxs正在下拉状态改变处理
    _handleWxsPullingDownStatusChange: function _handleWxsPullingDownStatusChange(onPullingDown) {
      this.wxsOnPullingDown = onPullingDown;
      if (onPullingDown && !this.useChatRecordMode) {
        this.renderPropScrollTop = 0;
      }
    },
    // wxs正在下拉处理
    _handleWxsPullingDown: function _handleWxsPullingDown(_ref2) {
      var moveDis = _ref2.moveDis,
        diffDis = _ref2.diffDis;
      this._emitTouchmove({
        pullingDistance: moveDis,
        dy: diffDis
      });
    },
    // wxs触摸方向改变
    _handleTouchDirectionChange: function _handleTouchDirectionChange(_ref3) {
      var direction = _ref3.direction;
      this.$emit('touchDirectionChange', direction);
    },
    // wxs通知更新其props
    _handlePropUpdate: function _handlePropUpdate() {
      this.wxsPropType = _zPagingUtils.default.getTime().toString();
    },
    // 下拉刷新结束
    _refresherEnd: function _refresherEnd() {
      var _this4 = this;
      var shouldEndLoadingDelay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var fromAddData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var isUserPullDown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var setLoading = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      if (this.loadingType === _zPagingEnum.default.LoadingType.Refresher) {
        var refresherCompleteDelay = fromAddData && (isUserPullDown || this.showRefresherWhenReload) ? this.refresherCompleteDelay : 0;
        var refresherStatus = refresherCompleteDelay > 0 ? _zPagingEnum.default.Refresher.Complete : _zPagingEnum.default.Refresher.Default;
        if (this.finalShowRefresherWhenReload) {
          var stackCount = this.refresherRevealStackCount;
          this.refresherRevealStackCount--;
          if (stackCount > 1) return;
        }
        this._cleanRefresherEndTimeout();
        this.refresherEndTimeout = _zPagingUtils.default.delay(function () {
          _this4.refresherStatus = refresherStatus;
        }, this.refresherStatus !== _zPagingEnum.default.Refresher.Default && refresherStatus === _zPagingEnum.default.Refresher.Default ? this.refresherCompleteDuration : 0);
        if (refresherCompleteDelay > 0) {
          this.isRefresherInComplete = true;
        }
        this._cleanRefresherCompleteTimeout();
        this.refresherCompleteTimeout = _zPagingUtils.default.delay(function () {
          var animateDuration = 1;
          var animateType = _this4.refresherEndBounceEnabled && fromAddData ? 'cubic-bezier(0.19,1.64,0.42,0.72)' : 'linear';
          if (fromAddData) {
            animateDuration = _this4.refresherEndBounceEnabled ? _this4.refresherCompleteDuration / 1000 : _this4.refresherCompleteDuration / 3000;
          }
          _this4.refresherTransition = "transform ".concat(fromAddData ? animateDuration : _this4.refresherDefaultDuration / 1000, "s ").concat(animateType);
          _this4.wxsPropType = _this4.refresherTransition + 'end' + _zPagingUtils.default.getTime();
          _this4.moveDis = 0;
          if (refresherStatus === _zPagingEnum.default.Refresher.Complete) {
            if (_this4.refresherCompleteSubTimeout) {
              clearTimeout(_this4.refresherCompleteSubTimeout);
              _this4.refresherCompleteSubTimeout = null;
            }
            _this4.refresherCompleteSubTimeout = _zPagingUtils.default.delay(function () {
              _this4.$nextTick(function () {
                _this4.refresherStatus = _zPagingEnum.default.Refresher.Default;
                _this4.isRefresherInComplete = false;
              });
            }, animateDuration * 800);
          }
          _this4._emitTouchmove({
            pullingDistance: 0,
            dy: _this4.moveDis
          });
        }, refresherCompleteDelay);
      }
      if (setLoading) {
        _zPagingUtils.default.delay(function () {
          return _this4.loading = false;
        }, shouldEndLoadingDelay ? _zPagingConstant.default.delayTime : 0);
        isUserPullDown && this._onRestore();
      }
    },
    // 处理进入二楼
    _handleGoF2: function _handleGoF2() {
      var _this5 = this;
      if (this.showF2 || !this.refresherF2Enabled) return;
      this.$emit('refresherF2Change', 'go');
      if (!this.showRefresherF2) return;
      this.f2Transform = "translateY(".concat(-this.superContentHeight, "px)");
      this.showF2 = true;
      _zPagingUtils.default.delay(function () {
        _this5.f2Transform = 'translateY(0px)';
      }, 100, 'f2ShowDelay');
    },
    // 处理退出二楼
    _handleCloseF2: function _handleCloseF2() {
      var _this6 = this;
      if (!this.showF2 || !this.refresherF2Enabled) return;
      this.$emit('refresherF2Change', 'close');
      if (!this.showRefresherF2) return;
      this.f2Transform = "translateY(".concat(-this.superContentHeight, "px)");
      _zPagingUtils.default.delay(function () {
        _this6.showF2 = false;
        _this6.nF2Opacity = 0;
      }, this.refresherF2Duration, 'f2CloseDelay');
    },
    // 模拟用户手动触发下拉刷新
    _doRefresherRefreshAnimate: function _doRefresherRefreshAnimate() {
      this._cleanRefresherCompleteTimeout();
      // 用户处理用户在短时间内多次调用reload的情况，此时下拉刷新view不需要重复显示，只需要保证最后一次reload对应的请求结束后收回下拉刷新view即可

      var doRefreshAnimateAfter = !this.doRefreshAnimateAfter && this.finalShowRefresherWhenReload && this.customRefresherHeight === -1 && this.refresherThreshold === _zPagingUtils.default.addUnit(80, this.unit);
      if (doRefreshAnimateAfter) {
        this.doRefreshAnimateAfter = true;
        return;
      }
      this.refresherRevealStackCount++;
      this.wxsPropType = 'begin' + _zPagingUtils.default.getTime();
      this.moveDis = this.finalRefresherThreshold;
      this.refresherStatus = _zPagingEnum.default.Refresher.Loading;
      this.isTouchmoving = true;
      this.isTouchmovingTimeout && clearTimeout(this.isTouchmovingTimeout);
      this._doRefresherLoad(false);
    },
    // 触发下拉刷新
    _doRefresherLoad: function _doRefresherLoad() {
      var isUserPullDown = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      this._onRefresh(false, isUserPullDown);
      this.loading = true;
    },
    // 更新自定义下拉刷新view高度
    _updateCustomRefresherHeight: function _updateCustomRefresherHeight() {
      var _this7 = this;
      this._getNodeClientRect('.zp-custom-refresher-slot-view').then(function (res) {
        _this7.customRefresherHeight = res ? res[0].height : 0;
        _this7.showCustomRefresher = _this7.customRefresherHeight > 0;
        if (_this7.doRefreshAnimateAfter) {
          _this7.doRefreshAnimateAfter = false;
          _this7._doRefresherRefreshAnimate();
        }
      });
    },
    // emit pullingDown事件
    _emitTouchmove: function _emitTouchmove(e) {
      e.viewHeight = this.finalRefresherThreshold;
      e.rate = e.viewHeight > 0 ? e.pullingDistance / e.viewHeight : 0;
      this.hasTouchmove && this.oldPullingDistance !== e.pullingDistance && this.$emit('refresherTouchmove', e);
      this.oldPullingDistance = e.pullingDistance;
    },
    // 清除refresherCompleteTimeout
    _cleanRefresherCompleteTimeout: function _cleanRefresherCompleteTimeout() {
      this.refresherCompleteTimeout = this._cleanTimeout(this.refresherCompleteTimeout);
    },
    // 清除refresherEndTimeout
    _cleanRefresherEndTimeout: function _cleanRefresherEndTimeout() {
      this.refresherEndTimeout = this._cleanTimeout(this.refresherEndTimeout);
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 108 */
/*!********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/load-more.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _regenerator = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/regenerator */ 42));
var _asyncToGenerator2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ 44));
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
// [z-paging]滚动到底部加载更多模块
var _default = {
  props: {
    // 自定义底部加载更多样式
    loadingMoreCustomStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('loadingMoreCustomStyle', {})
    },
    // 自定义底部加载更多文字样式
    loadingMoreTitleCustomStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('loadingMoreTitleCustomStyle', {})
    },
    // 自定义底部加载更多加载中动画样式
    loadingMoreLoadingIconCustomStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('loadingMoreLoadingIconCustomStyle', {})
    },
    // 自定义底部加载更多加载中动画图标类型，可选flower或circle，默认为flower
    loadingMoreLoadingIconType: {
      type: String,
      default: _zPagingUtils.default.gc('loadingMoreLoadingIconType', 'flower')
    },
    // 自定义底部加载更多加载中动画图标图片
    loadingMoreLoadingIconCustomImage: {
      type: String,
      default: _zPagingUtils.default.gc('loadingMoreLoadingIconCustomImage', '')
    },
    // 底部加载更多加载中view是否展示旋转动画，默认为是
    loadingMoreLoadingAnimated: {
      type: Boolean,
      default: _zPagingUtils.default.gc('loadingMoreLoadingAnimated', true)
    },
    // 是否启用加载更多数据(含滑动到底部加载更多数据和点击加载更多数据)，默认为是
    loadingMoreEnabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('loadingMoreEnabled', true)
    },
    // 是否启用滑动到底部加载更多数据，默认为是
    toBottomLoadingMoreEnabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('toBottomLoadingMoreEnabled', true)
    },
    // 滑动到底部状态为默认状态时，以加载中的状态展示，默认为否。若设置为是，可避免滚动到底部看到默认状态然后立刻变为加载中状态的问题，但分页数量未超过一屏时，不会显示【点击加载更多】
    loadingMoreDefaultAsLoading: {
      type: Boolean,
      default: _zPagingUtils.default.gc('loadingMoreDefaultAsLoading', false)
    },
    // 滑动到底部"默认"文字，默认为【点击加载更多】
    loadingMoreDefaultText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('loadingMoreDefaultText', null)
    },
    // 滑动到底部"加载中"文字，默认为【正在加载...】
    loadingMoreLoadingText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('loadingMoreLoadingText', null)
    },
    // 滑动到底部"没有更多"文字，默认为【没有更多了】
    loadingMoreNoMoreText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('loadingMoreNoMoreText', null)
    },
    // 滑动到底部"加载失败"文字，默认为【加载失败，点击重新加载】
    loadingMoreFailText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('loadingMoreFailText', null)
    },
    // 当没有更多数据且分页内容未超出z-paging时是否隐藏没有更多数据的view，默认为否
    hideNoMoreInside: {
      type: Boolean,
      default: _zPagingUtils.default.gc('hideNoMoreInside', false)
    },
    // 当没有更多数据且分页数组长度少于这个值时，隐藏没有更多数据的view，默认为0，代表不限制。
    hideNoMoreByLimit: {
      type: Number,
      default: _zPagingUtils.default.gc('hideNoMoreByLimit', 0)
    },
    // 是否显示默认的加载更多text，默认为是
    showDefaultLoadingMoreText: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showDefaultLoadingMoreText', true)
    },
    // 是否显示没有更多数据的view
    showLoadingMoreNoMoreView: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showLoadingMoreNoMoreView', true)
    },
    // 是否显示没有更多数据的分割线，默认为是
    showLoadingMoreNoMoreLine: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showLoadingMoreNoMoreLine', true)
    },
    // 自定义底部没有更多数据的分割线样式
    loadingMoreNoMoreLineCustomStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('loadingMoreNoMoreLineCustomStyle', {})
    },
    // 当分页未满一屏时，是否自动加载更多，默认为否(nvue无效)
    insideMore: {
      type: Boolean,
      default: _zPagingUtils.default.gc('insideMore', false)
    },
    // 距底部/右边多远时（单位px），触发 scrolltolower 事件，默认为100rpx
    lowerThreshold: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('lowerThreshold', '100rpx')
    }
  },
  data: function data() {
    return {
      M: _zPagingEnum.default.More,
      // 底部加载更多状态
      loadingStatus: _zPagingEnum.default.More.Default,
      // 在渲染之后的底部加载更多状态
      loadingStatusAfterRender: _zPagingEnum.default.More.Default,
      // 底部加载更多时间戳
      loadingMoreTimeStamp: 0,
      // 底部加载更多slot
      loadingMoreDefaultSlot: null,
      // 是否展示底部加载更多
      showLoadingMore: false,
      // 是否是开发者自定义的加载更多，-1代表交由z-paging自行判断；1代表没有更多了；0代表还有更多数据
      customNoMore: -1
    };
  },
  computed: {
    // 底部加载更多配置
    zLoadMoreConfig: function zLoadMoreConfig() {
      return {
        status: this.loadingStatusAfterRender,
        defaultAsLoading: this.loadingMoreDefaultAsLoading || this.useChatRecordMode && this.chatLoadingMoreDefaultAsLoading,
        defaultThemeStyle: this.finalLoadingMoreThemeStyle,
        customStyle: this.loadingMoreCustomStyle,
        titleCustomStyle: this.loadingMoreTitleCustomStyle,
        iconCustomStyle: this.loadingMoreLoadingIconCustomStyle,
        loadingIconType: this.loadingMoreLoadingIconType,
        loadingIconCustomImage: this.loadingMoreLoadingIconCustomImage,
        loadingAnimated: this.loadingMoreLoadingAnimated,
        showNoMoreLine: this.showLoadingMoreNoMoreLine,
        noMoreLineCustomStyle: this.loadingMoreNoMoreLineCustomStyle,
        defaultText: this.finalLoadingMoreDefaultText,
        loadingText: this.finalLoadingMoreLoadingText,
        noMoreText: this.finalLoadingMoreNoMoreText,
        failText: this.finalLoadingMoreFailText,
        hideContent: !this.loadingMoreDefaultAsLoading && this.listRendering,
        unit: this.unit,
        isChat: this.useChatRecordMode,
        chatDefaultAsLoading: this.chatLoadingMoreDefaultAsLoading
      };
    },
    // 最终的底部加载更多主题
    finalLoadingMoreThemeStyle: function finalLoadingMoreThemeStyle() {
      return this.loadingMoreThemeStyle.length ? this.loadingMoreThemeStyle : this.defaultThemeStyle;
    },
    // 最终的底部加载更多触发阈值
    finalLowerThreshold: function finalLowerThreshold() {
      return _zPagingUtils.default.convertToPx(this.lowerThreshold);
    },
    // 是否显示默认状态下的底部加载更多
    showLoadingMoreDefault: function showLoadingMoreDefault() {
      return this._showLoadingMore('Default');
    },
    // 是否显示加载中状态下的底部加载更多
    showLoadingMoreLoading: function showLoadingMoreLoading() {
      return this._showLoadingMore('Loading');
    },
    // 是否显示没有更多了状态下的底部加载更多
    showLoadingMoreNoMore: function showLoadingMoreNoMore() {
      return this._showLoadingMore('NoMore');
    },
    // 是否显示加载失败状态下的底部加载更多
    showLoadingMoreFail: function showLoadingMoreFail() {
      return this._showLoadingMore('Fail');
    },
    // 是否显示自定义状态下的底部加载更多
    showLoadingMoreCustom: function showLoadingMoreCustom() {
      return this._showLoadingMore('Custom');
    }
  },
  methods: {
    // 页面滚动到底部时通知z-paging进行进一步处理
    pageReachBottom: function pageReachBottom() {
      !this.useChatRecordMode && this._onLoadingMore('toBottom');
    },
    // 手动触发上拉加载更多(非必须，可依据具体需求使用)
    doLoadMore: function doLoadMore(type) {
      this._onLoadingMore(type);
    },
    // 通过@scroll事件检测是否滚动到了底部(顺带检测下是否滚动到了顶部)
    _checkScrolledToBottom: function _checkScrolledToBottom(scrollDiff) {
      var _this = this;
      var checked = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // 如果当前scroll-view高度未获取，则获取其高度
      if (this.cacheScrollNodeHeight === -1) {
        // 获取当前scroll-view高度
        this._getNodeClientRect('.zp-scroll-view').then(function (res) {
          if (res) {
            var scrollNodeHeight = res[0].height;
            // 缓存当前scroll-view高度，如果获取过了不再获取
            _this.cacheScrollNodeHeight = scrollNodeHeight;
            // // scrollDiff - this.cacheScrollNodeHeight = 当前滚动区域的顶部与内容底部的距离 - scroll-view高度 = 当前滚动区域的底部与内容底部的距离(也就是最终的与底部的距离)
            if (scrollDiff - scrollNodeHeight <= _this.finalLowerThreshold) {
              // 如果与底部的距离小于阈值，则判断为滚动到了底部，触发滚动到底部事件
              _this._onLoadingMore('toBottom');
            }
          }
        });
      } else {
        // scrollDiff - this.cacheScrollNodeHeight = 当前滚动区域的顶部与内容底部的距离 - scroll-view高度 = 当前滚动区域的底部与内容底部的距离(也就是最终的与底部的距离)
        if (scrollDiff - this.cacheScrollNodeHeight <= this.finalLowerThreshold) {
          // 如果与底部的距离小于阈值，则判断为滚动到了底部，触发滚动到底部事件
          this._onLoadingMore('toBottom');
        } else if (scrollDiff - this.cacheScrollNodeHeight <= 500 && !checked) {
          // 如果与底部的距离小于500px，则获取当前滚动的位置，延迟150毫秒重复上述步骤再次检测(避免@scroll触发时获取的scrollTop不正确导致的其他问题，此时获取的scrollTop不一定可信)。防止因为部分性能较差安卓设备@scroll采样率过低导致的滚动到底部但是依然没有触发的问题
          _zPagingUtils.default.delay(function () {
            _this._getNodeClientRect('.zp-scroll-view', true, true).then(function (res) {
              if (res) {
                _this.oldScrollTop = res[0].scrollTop;
                var newScrollDiff = res[0].scrollHeight - _this.oldScrollTop;
                _this._checkScrolledToBottom(newScrollDiff, true);
              }
            });
          }, 150, 'checkScrolledToBottomDelay');
        }
        // 检测一下是否已经滚动到了顶部了，因为在安卓中滚动到顶部时scrollTop不一定为0(和滚动到底部一样的原因)，所以需要在scrollTop小于150px时，通过获取.zp-scroll-view的scrollTop再判断一下
        if (this.oldScrollTop <= 150 && this.oldScrollTop !== 0) {
          _zPagingUtils.default.delay(function () {
            // 这里再判断一下是否确实已经滚动到顶部了，如果已经滚动到顶部了，则不用再判断了，再次判断的原因是可能150毫秒之后oldScrollTop才是0
            if (_this.oldScrollTop !== 0) {
              _this._getNodeClientRect('.zp-scroll-view', true, true).then(function (res) {
                // 如果150毫秒后.zp-scroll-view的scrollTop为0，则认为已经滚动到了顶部了
                if (res && res[0].scrollTop === 0 && _this.oldScrollTop !== 0) {
                  _this._onScrollToUpper();
                }
              });
            }
          }, 150, 'checkScrolledToTopDelay');
        }
      }
    },
    // 触发加载更多时调用,from:toBottom-滑动到底部触发；1、click-点击加载更多触发
    _onLoadingMore: function _onLoadingMore() {
      var _this2 = this;
      var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'click';
      // 如果是ios并且是滚动到底部的，则在滚动到底部时候尝试将列表设置为禁止滚动然后设置为允许滚动，以禁止底部bounce的效果
      if (this.isIos && from === 'toBottom' && !this.scrollToBottomBounceEnabled && this.scrollEnable) {
        this.scrollEnable = false;
        this.$nextTick(function () {
          _this2.scrollEnable = true;
        });
      }
      // emit scrolltolower
      this.$emit('scrolltolower', from);
      // 如果是只使用下拉刷新 或者 禁用底部加载更多 或者 底部加载更多不是默认状态或加载失败状态 或者 是加载中状态 或者 空数据图已经展示了，则return，不触发内部加载更多逻辑
      if (this.refresherOnly || !this.loadingMoreEnabled || !(this.loadingStatus === _zPagingEnum.default.More.Default || this.loadingStatus === _zPagingEnum.default.More.Fail) || this.loading || this.showEmpty) return;
      if (!this.isIos && !this.refresherOnly && !this.usePageScroll) {
        var currentTimestamp = _zPagingUtils.default.getTime();
        // 在非ios平台+scroll-view中节流处理
        if (this.loadingMoreTimeStamp > 0 && currentTimestamp - this.loadingMoreTimeStamp < 100) {
          this.loadingMoreTimeStamp = 0;
          return;
        }
      }

      // 处理加载更多数据
      this._doLoadingMore();
    },
    // 处理开始加载更多
    _doLoadingMore: function _doLoadingMore() {
      var _this3 = this;
      if (this.pageNo >= this.defaultPageNo && this.loadingStatus !== _zPagingEnum.default.More.NoMore) {
        this.pageNo++;
        this._startLoading(false);
        // 如果是本地分页，则在组件内部对数据进行分页处理，不触发@query事件
        if (this.isLocalPaging) {
          this._localPagingQueryList(this.pageNo, this.defaultPageSize, this.localPagingLoadingTime, function (res) {
            _this3.completeByTotal(res, _this3.totalLocalPagingList.length);
          });
        } else {
          this._emitQuery(this.pageNo, this.defaultPageSize, _zPagingEnum.default.QueryFrom.LoadingMore);
          this._callMyParentQuery();
        }
        // 设置当前加载状态为底部加载更多状态
        this.loadingType = _zPagingEnum.default.LoadingType.LoadingMore;
      }
    },
    // (预处理)判断当没有更多数据且分页内容未超出z-paging时是否显示没有更多数据的view
    _preCheckShowNoMoreInside: function _preCheckShowNoMoreInside(newVal, scrollViewNode, pagingContainerNode) {
      var _this4 = this;
      if (this.loadingStatus === _zPagingEnum.default.More.NoMore && this.hideNoMoreByLimit > 0 && newVal.length) {
        this.showLoadingMore = newVal.length > this.hideNoMoreByLimit;
      } else if (this.loadingStatus === _zPagingEnum.default.More.NoMore && this.hideNoMoreInside && newVal.length || this.insideMore && this.insideOfPaging !== false && newVal.length) {
        this.$nextTick(function () {
          _this4._checkShowNoMoreInside(newVal, scrollViewNode, pagingContainerNode);
        });
        if (this.insideMore && this.insideOfPaging !== false && newVal.length) {
          this.showLoadingMore = newVal.length;
        }
      } else {
        this.showLoadingMore = newVal.length;
      }
    },
    // 判断当没有更多数据且分页内容未超出z-paging时是否显示没有更多数据的view
    _checkShowNoMoreInside: function _checkShowNoMoreInside(totalData, oldScrollViewNode, oldPagingContainerNode) {
      var _this5 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
        var scrollViewNode, scrollViewTotalH, pagingContainerNode, pagingContainerH, scrollViewH;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.t0 = oldScrollViewNode;
                if (_context.t0) {
                  _context.next = 6;
                  break;
                }
                _context.next = 5;
                return _this5._getNodeClientRect('.zp-scroll-view');
              case 5:
                _context.t0 = _context.sent;
              case 6:
                scrollViewNode = _context.t0;
                if (!_this5.usePageScroll) {
                  _context.next = 11;
                  break;
                }
                if (scrollViewNode) {
                  // 获取滚动内容总高度
                  scrollViewTotalH = scrollViewNode[0].top + scrollViewNode[0].height; // 如果滚动内容总高度小于窗口高度，则认为内容未超出z-paging
                  _this5.insideOfPaging = scrollViewTotalH < _this5.windowHeight;
                  // 如果需要没有更多数据时，隐藏底部加载更多view，并且内容未超过z-paging，则隐藏底部加载更多
                  if (_this5.hideNoMoreInside) {
                    _this5.showLoadingMore = !_this5.insideOfPaging;
                  }
                  // 如果需要内容未超过z-paging时自动加载更多，则触发加载更多
                  _this5._updateInsideOfPaging();
                }
                _context.next = 22;
                break;
              case 11:
                _context.t1 = oldPagingContainerNode;
                if (_context.t1) {
                  _context.next = 16;
                  break;
                }
                _context.next = 15;
                return _this5._getNodeClientRect('.zp-paging-container-content');
              case 15:
                _context.t1 = _context.sent;
              case 16:
                pagingContainerNode = _context.t1;
                // 获取滚动内容总高度
                pagingContainerH = pagingContainerNode ? pagingContainerNode[0].height : 0; // 获取z-paging内置scroll-view高度
                scrollViewH = scrollViewNode ? scrollViewNode[0].height : 0; // 如果滚动内容总高度小于z-paging内置scroll-view高度，则认为内容未超出z-paging
                _this5.insideOfPaging = pagingContainerH < scrollViewH;
                if (_this5.hideNoMoreInside) {
                  _this5.showLoadingMore = !_this5.insideOfPaging;
                }
                // 如果需要内容未超过z-paging时自动加载更多，则触发加载更多
                _this5._updateInsideOfPaging();
              case 22:
                _context.next = 29;
                break;
              case 24:
                _context.prev = 24;
                _context.t2 = _context["catch"](0);
                // 如果发生了异常，判断totalData数组长度为0，则认为内容未超出z-paging
                _this5.insideOfPaging = !totalData.length;
                if (_this5.hideNoMoreInside) {
                  _this5.showLoadingMore = !_this5.insideOfPaging;
                }
                // 如果需要内容未超过z-paging时自动加载更多，则触发加载更多
                _this5._updateInsideOfPaging();
              case 29:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 24]]);
      }))();
    },
    // 是否要展示上拉加载更多view
    _showLoadingMore: function _showLoadingMore(type) {
      if (!this.showLoadingMoreWhenReload && (!(this.loadingStatus === _zPagingEnum.default.More.Default ? this.nShowBottom : true) || !this.realTotalData.length)) return false;
      if ((!this.showLoadingMoreWhenReload || this.isUserPullDown || this.loadingStatus !== _zPagingEnum.default.More.Loading) && !this.showLoadingMore || !this.loadingMoreEnabled && (!this.showLoadingMoreWhenReload || this.isUserPullDown || this.loadingStatus !== _zPagingEnum.default.More.Loading) || this.refresherOnly) {
        return false;
      }
      if (this.useChatRecordMode && type !== 'Loading') return false;
      if (!this.zSlots) return false;
      if (type === 'Custom') {
        return this.showDefaultLoadingMoreText && !(this.loadingStatus === _zPagingEnum.default.More.NoMore && !this.showLoadingMoreNoMoreView);
      }
      var res = this.loadingStatus === _zPagingEnum.default.More[type] && this.zSlots["loadingMore".concat(type)] && (type === 'NoMore' ? this.showLoadingMoreNoMoreView : true);
      if (res) {}
      return res;
    }
  }
};
exports.default = _default;

/***/ }),
/* 109 */
/*!******************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/loading.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
// [z-paging]loading相关模块
var _default = {
  props: {
    // 第一次加载后自动隐藏loading slot，默认为是
    autoHideLoadingAfterFirstLoaded: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoHideLoadingAfterFirstLoaded', true)
    },
    // loading slot是否铺满屏幕并固定，默认为否
    loadingFullFixed: {
      type: Boolean,
      default: _zPagingUtils.default.gc('loadingFullFixed', false)
    },
    // 是否自动显示系统Loading：即uni.showLoading，若开启则将在刷新列表时(调用reload、refresh时)显示，下拉刷新和滚动到底部加载更多不会显示，默认为false。
    autoShowSystemLoading: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoShowSystemLoading', false)
    },
    // 显示系统Loading时是否显示透明蒙层，防止触摸穿透，默认为是(H5、App、微信小程序、百度小程序有效)
    systemLoadingMask: {
      type: Boolean,
      default: _zPagingUtils.default.gc('systemLoadingMask', true)
    },
    // 显示系统Loading时显示的文字，默认为"加载中"
    systemLoadingText: {
      type: [String, Object],
      default: _zPagingUtils.default.gc('systemLoadingText', null)
    }
  },
  data: function data() {
    return {
      loading: false,
      loadingForNow: false
    };
  },
  watch: {
    // loading状态
    loadingStatus: function loadingStatus(newVal) {
      var _this = this;
      this.$emit('loadingStatusChange', newVal);
      this.$nextTick(function () {
        _this.loadingStatusAfterRender = newVal;
      });
      if (this.useChatRecordMode) {
        if (this.isFirstPage && (newVal === _zPagingEnum.default.More.NoMore || newVal === _zPagingEnum.default.More.Fail)) {
          this.isFirstPageAndNoMore = true;
          return;
        }
      }
      this.isFirstPageAndNoMore = false;
    },
    loading: function loading(newVal) {
      if (newVal) {
        this.loadingForNow = newVal;
      }
    }
  },
  computed: {
    // 是否显示loading
    showLoading: function showLoading() {
      if (this.firstPageLoaded || !this.loading || !this.loadingForNow) return false;
      if (this.finalShowSystemLoading) {
        // 显示系统loading
        uni.showLoading({
          title: this.finalSystemLoadingText,
          mask: this.systemLoadingMask
        });
      }
      return this.autoHideLoadingAfterFirstLoaded ? this.fromEmptyViewReload ? true : !this.pagingLoaded : this.loadingType === _zPagingEnum.default.LoadingType.Refresher;
    },
    // 最终的是否显示系统loading
    finalShowSystemLoading: function finalShowSystemLoading() {
      return this.autoShowSystemLoading && this.loadingType === _zPagingEnum.default.LoadingType.Refresher;
    }
  },
  methods: {
    // 处理开始加载更多状态
    _startLoading: function _startLoading() {
      var isReload = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (this.showLoadingMoreWhenReload && !this.isUserPullDown || !isReload) {
        this.loadingStatus = _zPagingEnum.default.More.Loading;
      }
      this.loading = true;
    },
    // 停止系统loading和refresh
    _endSystemLoadingAndRefresh: function _endSystemLoadingAndRefresh() {
      this.finalShowSystemLoading && uni.hideLoading();
      !this.useCustomRefresher && uni.stopPullDownRefresh();
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 110 */
/*!***************************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/chat-record-mode.js ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
// [z-paging]聊天记录模式模块
var _default = {
  props: {
    // 使用聊天记录模式，默认为否
    useChatRecordMode: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useChatRecordMode', false)
    },
    // 使用聊天记录模式时滚动到顶部后，列表垂直移动偏移距离。默认0rpx。单位px（暂时无效）
    chatRecordMoreOffset: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('chatRecordMoreOffset', '0rpx')
    },
    // 使用聊天记录模式时是否自动隐藏键盘：在用户触摸列表时候自动隐藏键盘，默认为是
    autoHideKeyboardWhenChat: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoHideKeyboardWhenChat', true)
    },
    // 使用聊天记录模式中键盘弹出时是否自动调整slot="bottom"高度，默认为是
    autoAdjustPositionWhenChat: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoAdjustPositionWhenChat', true)
    },
    // 使用聊天记录模式中键盘弹出时占位高度偏移距离。默认0rpx。单位px
    chatAdjustPositionOffset: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('chatAdjustPositionOffset', '0rpx')
    },
    // 使用聊天记录模式中键盘弹出时是否自动滚动到底部，默认为否
    autoToBottomWhenChat: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoToBottomWhenChat', false)
    },
    // 使用聊天记录模式中reload时是否显示chatLoading，默认为否
    showChatLoadingWhenReload: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showChatLoadingWhenReload', false)
    },
    // 在聊天记录模式中滑动到顶部状态为默认状态时，以加载中的状态展示，默认为是。若设置为否，则默认会显示【点击加载更多】，然后才会显示loading
    chatLoadingMoreDefaultAsLoading: {
      type: Boolean,
      default: _zPagingUtils.default.gc('chatLoadingMoreDefaultAsLoading', true)
    }
  },
  data: function data() {
    return {
      // 键盘高度
      keyboardHeight: 0,
      // 键盘高度是否未改变，此时占位高度变化不需要动画效果
      isKeyboardHeightChanged: false
    };
  },
  computed: {
    finalChatRecordMoreOffset: function finalChatRecordMoreOffset() {
      return _zPagingUtils.default.convertToPx(this.chatRecordMoreOffset);
    },
    finalChatAdjustPositionOffset: function finalChatAdjustPositionOffset() {
      return _zPagingUtils.default.convertToPx(this.chatAdjustPositionOffset);
    },
    // 聊天记录模式旋转180度style
    chatRecordRotateStyle: function chatRecordRotateStyle() {
      var _this = this;
      var cellStyle;
      // 在vue中，直接将列表倒置，因此在vue的cell中，也直接写style="transform: scaleY(-1)"转回来即可。

      cellStyle = this.useChatRecordMode ? {
        transform: 'scaleY(-1)'
      } : {};

      // 在nvue中，需要考虑数据量不满一页的情况，因为nvue中的list无法通过flex-end修改不满一页的起始位置，会导致不满一页时列表数据从底部开始，因此需要特别判断
      // 当数据不满一屏的时候，不进行列表倒置

      this.$emit('update:cellStyle', cellStyle);
      this.$emit('cellStyleChange', cellStyle);

      // 在聊天记录模式中，如果列表没有倒置并且当前是第一页，则需要自动滚动到最底部
      this.$nextTick(function () {
        if (_this.isFirstPage && _this.isChatRecordModeAndNotInversion) {
          _this.$nextTick(function () {
            // 这里多次触发滚动到底部是为了避免在某些情况下，即使是在nextTick但是cell未渲染完毕导致滚动到底部位置不正确的问题
            _this._scrollToBottom(false);
            _zPagingUtils.default.delay(function () {
              _this._scrollToBottom(false);
              _zPagingUtils.default.delay(function () {
                _this._scrollToBottom(false);
              }, 50);
            }, 50);
          });
        }
      });
      return cellStyle;
    },
    // 是否是聊天记录列表并且有配置transform
    isChatRecordModeHasTransform: function isChatRecordModeHasTransform() {
      return this.useChatRecordMode && this.chatRecordRotateStyle && this.chatRecordRotateStyle.transform;
    },
    // 是否是聊天记录列表并且列表未倒置
    isChatRecordModeAndNotInversion: function isChatRecordModeAndNotInversion() {
      return this.isChatRecordModeHasTransform && this.chatRecordRotateStyle.transform === 'scaleY(1)';
    },
    // 是否是聊天记录列表并且列表倒置
    isChatRecordModeAndInversion: function isChatRecordModeAndInversion() {
      return this.isChatRecordModeHasTransform && this.chatRecordRotateStyle.transform === 'scaleY(-1)';
    },
    // 最终的聊天记录模式中底部安全区域的高度，如果开启了底部安全区域并且键盘未弹出，则添加底部区域高度
    chatRecordModeSafeAreaBottom: function chatRecordModeSafeAreaBottom() {
      return this.safeAreaInsetBottom && !this.keyboardHeight ? this.safeAreaBottom : 0;
    }
  },
  mounted: function mounted() {
    // 监听键盘高度变化（H5、百度小程序、抖音小程序、飞书小程序不支持）

    if (this.useChatRecordMode) {
      uni.onKeyboardHeightChange(this._handleKeyboardHeightChange);
    }
  },
  methods: {
    // 添加聊天记录
    addChatRecordData: function addChatRecordData(data) {
      var toBottom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var toBottomWithAnimate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      if (!this.useChatRecordMode) return;
      this.isTotalChangeFromAddData = true;
      this.addDataFromTop(data, toBottom, toBottomWithAnimate);
    },
    // 手动触发滚动到顶部加载更多，聊天记录模式时有效
    doChatRecordLoadMore: function doChatRecordLoadMore() {
      this.useChatRecordMode && this._onLoadingMore('click');
    },
    // 处理键盘高度变化
    _handleKeyboardHeightChange: function _handleKeyboardHeightChange(res) {
      var _this2 = this;
      this.$emit('keyboardHeightChange', res);
      if (this.autoAdjustPositionWhenChat) {
        this.isKeyboardHeightChanged = true;
        this.keyboardHeight = res.height > 0 ? res.height + this.finalChatAdjustPositionOffset : res.height;
      }
      if (this.autoToBottomWhenChat && this.keyboardHeight > 0) {
        _zPagingUtils.default.delay(function () {
          _this2.scrollToBottom(false);
          _zPagingUtils.default.delay(function () {
            _this2.scrollToBottom(false);
          });
        });
      }
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 111 */
/*!*******************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/scroller.js ***!
  \*******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _regenerator = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/regenerator */ 42));
var _asyncToGenerator2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ 44));
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
// [z-paging]scroll相关模块
var _default = {
  props: {
    // 使用页面滚动，默认为否，当设置为是时则使用页面的滚动而非此组件内部的scroll-view的滚动，使用页面滚动时z-paging无需设置确定的高度且对于长列表展示性能更高，但配置会略微繁琐
    usePageScroll: {
      type: Boolean,
      default: _zPagingUtils.default.gc('usePageScroll', false)
    },
    // 是否可以滚动，使用内置scroll-view和nvue时有效，默认为是
    scrollable: {
      type: Boolean,
      default: _zPagingUtils.default.gc('scrollable', true)
    },
    // 控制是否出现滚动条，默认为是
    showScrollbar: {
      type: Boolean,
      default: _zPagingUtils.default.gc('showScrollbar', true)
    },
    // 是否允许横向滚动，默认为否
    scrollX: {
      type: Boolean,
      default: _zPagingUtils.default.gc('scrollX', false)
    },
    // iOS设备上滚动到顶部时是否允许回弹效果，默认为否。关闭回弹效果后可使滚动到顶部与下拉刷新更连贯，但是有吸顶view时滚动到顶部时可能出现抖动。
    scrollToTopBounceEnabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('scrollToTopBounceEnabled', false)
    },
    // iOS设备上滚动到底部时是否允许回弹效果，默认为是。
    scrollToBottomBounceEnabled: {
      type: Boolean,
      default: _zPagingUtils.default.gc('scrollToBottomBounceEnabled', true)
    },
    // 在设置滚动条位置时使用动画过渡，默认为否
    scrollWithAnimation: {
      type: Boolean,
      default: _zPagingUtils.default.gc('scrollWithAnimation', false)
    },
    // 值应为某子元素id（id不能以数字开头）。设置哪个方向可滚动，则在哪个方向滚动到该元素
    scrollIntoView: {
      type: String,
      default: _zPagingUtils.default.gc('scrollIntoView', '')
    }
  },
  data: function data() {
    return {
      scrollTop: 0,
      oldScrollTop: 0,
      scrollViewStyle: {},
      scrollViewContainerStyle: {},
      scrollViewInStyle: {},
      pageScrollTop: -1,
      scrollEnable: true,
      privateScrollWithAnimation: -1,
      cacheScrollNodeHeight: -1,
      superContentHeight: 0
    };
  },
  watch: {
    oldScrollTop: function oldScrollTop(newVal) {
      !this.usePageScroll && this._scrollTopChange(newVal, false);
    },
    pageScrollTop: function pageScrollTop(newVal) {
      this.usePageScroll && this._scrollTopChange(newVal, true);
    },
    usePageScroll: {
      handler: function handler(newVal) {
        this.loaded && this.autoHeight && this._setAutoHeight(!newVal);
      },
      immediate: true
    },
    finalScrollTop: function finalScrollTop(newVal) {
      this.renderPropScrollTop = newVal < 6 ? 0 : 10;
    }
  },
  computed: {
    finalScrollWithAnimation: function finalScrollWithAnimation() {
      if (this.privateScrollWithAnimation !== -1) {
        return this.privateScrollWithAnimation === 1;
      }
      return this.scrollWithAnimation;
    },
    finalScrollViewStyle: function finalScrollViewStyle() {
      if (this.superContentZIndex != 1) {
        this.scrollViewStyle['z-index'] = this.superContentZIndex;
        this.scrollViewStyle['position'] = 'relative';
      }
      return this.scrollViewStyle;
    },
    finalScrollTop: function finalScrollTop() {
      return this.usePageScroll ? this.pageScrollTop : this.oldScrollTop;
    },
    // 当前是否是旧版webview
    finalIsOldWebView: function finalIsOldWebView() {
      return this.isOldWebView && !this.usePageScroll;
    },
    // 当前scroll-view/list-view是否允许滚动
    finalScrollable: function finalScrollable() {
      return this.scrollable && !this.usePageScroll && this.scrollEnable && (this.refresherCompleteScrollable ? true : this.refresherStatus !== _zPagingEnum.default.Refresher.Complete) && (this.refresherRefreshingScrollable ? true : this.refresherStatus !== _zPagingEnum.default.Refresher.Loading);
    }
  },
  methods: {
    // 滚动到顶部，animate为是否展示滚动动画，默认为是
    scrollToTop: function scrollToTop(animate) {
      var _this = this;
      var checkReverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      // 如果是聊天记录模式并且列表倒置了，则滚动到顶部实际上是滚动到底部
      if (this.useChatRecordMode && checkReverse && !this.isChatRecordModeAndNotInversion) {
        this.scrollToBottom(animate, false);
        return;
      }
      this.$nextTick(function () {
        _this._scrollToTop(animate, false);
      });
    },
    // 滚动到底部，animate为是否展示滚动动画，默认为是
    scrollToBottom: function scrollToBottom(animate) {
      var _this2 = this;
      var checkReverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      // 如果是聊天记录模式并且列表倒置了，则滚动到底部实际上是滚动到顶部
      if (this.useChatRecordMode && checkReverse && !this.isChatRecordModeAndNotInversion) {
        this.scrollToTop(animate, false);
        return;
      }
      this.$nextTick(function () {
        _this2._scrollToBottom(animate);
      });
    },
    // 滚动到指定view(vue中有效)。sel为需要滚动的view的id值，不包含"#"；offset为偏移量，单位为px；animate为是否展示滚动动画，默认为否
    scrollIntoViewById: function scrollIntoViewById(sel, offset, animate) {
      this._scrollIntoView(sel, offset, animate);
    },
    // 滚动到指定view(vue中有效)。nodeTop为需要滚动的view的top值(通过uni.createSelectorQuery()获取)；offset为偏移量，单位为px；animate为是否展示滚动动画，默认为否
    scrollIntoViewByNodeTop: function scrollIntoViewByNodeTop(nodeTop, offset, animate) {
      var _this3 = this;
      this.scrollTop = this.oldScrollTop;
      this.$nextTick(function () {
        _this3._scrollIntoViewByNodeTop(nodeTop, offset, animate);
      });
    },
    // 滚动到指定位置(vue中有效)。y为与顶部的距离，单位为px；offset为偏移量，单位为px；animate为是否展示滚动动画，默认为否
    scrollToY: function scrollToY(y, offset, animate) {
      var _this4 = this;
      this.scrollTop = this.oldScrollTop;
      this.$nextTick(function () {
        _this4._scrollToY(y, offset, animate);
      });
    },
    // 滚动到指定view(nvue中和虚拟列表中有效)。index为需要滚动的view的index(第几个，从0开始)；offset为偏移量，单位为px；animate为是否展示滚动动画，默认为否
    scrollIntoViewByIndex: function scrollIntoViewByIndex(index, offset, animate) {
      var _this5 = this;
      if (index >= this.realTotalData.length) {
        _zPagingUtils.default.consoleErr('当前滚动的index超出已渲染列表长度，请先通过refreshToPage加载到对应index页并等待渲染成功后再调用此方法！');
        return;
      }
      this.$nextTick(function () {
        if (_this5.finalUseVirtualList) {
          var isCellFixed = _this5.cellHeightMode === _zPagingEnum.default.CellHeightMode.Fixed;
          _zPagingUtils.default.delay(function () {
            if (_this5.finalUseVirtualList) {
              // 虚拟列表 + 每个cell高度完全相同模式下，此时滚动到对应index的cell就是滚动到scrollTop = cellHeight * index的位置
              // 虚拟列表 + 高度是动态非固定的模式下，此时滚动到对应index的cell就是滚动到scrollTop = 缓存的cell高度数组中第index个的lastTotalHeight的位置
              var scrollTop = isCellFixed ? _this5.virtualCellHeight * index : _this5.virtualHeightCacheList[index].lastTotalHeight;
              _this5.scrollToY(scrollTop, offset, animate);
            }
          }, isCellFixed ? 0 : 100);
        }
      });
    },
    // 滚动到指定view(nvue中有效)。view为需要滚动的view(通过`this.$refs.xxx`获取)，不包含"#"；offset为偏移量，单位为px；animate为是否展示滚动动画，默认为否
    scrollIntoViewByView: function scrollIntoViewByView(view, offset, animate) {
      this._scrollIntoView(view, offset, animate);
    },
    // 当使用页面滚动并且自定义下拉刷新时，请在页面的onPageScroll中调用此方法，告知z-paging当前的pageScrollTop，否则会导致在任意位置都可以下拉刷新
    updatePageScrollTop: function updatePageScrollTop(value) {
      this.pageScrollTop = value;
    },
    // 当使用页面滚动并且设置了slot="top"时，默认初次加载会自动获取其高度，并使内部容器下移，当slot="top"的view高度动态改变时，在其高度需要更新时调用此方法
    updatePageScrollTopHeight: function updatePageScrollTopHeight() {
      this._updatePageScrollTopOrBottomHeight('top');
    },
    // 当使用页面滚动并且设置了slot="bottom"时，默认初次加载会自动获取其高度，并使内部容器下移，当slot="bottom"的view高度动态改变时，在其高度需要更新时调用此方法
    updatePageScrollBottomHeight: function updatePageScrollBottomHeight() {
      this._updatePageScrollTopOrBottomHeight('bottom');
    },
    // 更新slot="left"和slot="right"宽度，当slot="left"或slot="right"宽度动态改变时调用
    updateLeftAndRightWidth: function updateLeftAndRightWidth() {
      var _this6 = this;
      if (!this.finalIsOldWebView) return;
      this.$nextTick(function () {
        return _this6._updateLeftAndRightWidth(_this6.scrollViewContainerStyle, 'zp-page');
      });
    },
    // 更新z-paging内置scroll-view的scrollTop
    updateScrollViewScrollTop: function updateScrollViewScrollTop(scrollTop) {
      var _this7 = this;
      var animate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      this._updatePrivateScrollWithAnimation(animate);
      this.scrollTop = this.oldScrollTop;
      this.$nextTick(function () {
        _this7.scrollTop = scrollTop;
        _this7.oldScrollTop = _this7.scrollTop;
      });
    },
    // 当滚动到顶部时
    _onScrollToUpper: function _onScrollToUpper() {
      var _this8 = this;
      this.$emit('scrolltoupper');
      this.$emit('scrollTopChange', 0);
      this.$nextTick(function () {
        _this8.oldScrollTop = 0;
      });
    },
    // 当滚动到底部时
    _onScrollToLower: function _onScrollToLower(e) {
      (!e.detail || !e.detail.direction || e.detail.direction === 'bottom') && this._onLoadingMore(this.useChatRecordMode ? 'click' : 'toBottom');
    },
    // 滚动到顶部
    _scrollToTop: function _scrollToTop() {
      var _this9 = this;
      var animate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var isPrivate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      if (this.usePageScroll) {
        this.$nextTick(function () {
          uni.pageScrollTo({
            scrollTop: 0,
            duration: animate ? 100 : 0
          });
        });
        return;
      }
      this._updatePrivateScrollWithAnimation(animate);
      this.scrollTop = this.oldScrollTop;
      this.$nextTick(function () {
        _this9.scrollTop = 0;
        _this9.oldScrollTop = _this9.scrollTop;
      });
    },
    // 滚动到底部
    _scrollToBottom: function _scrollToBottom() {
      var _arguments = arguments,
        _this10 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
        var animate, pagingContainerNode, scrollViewNode, pagingContainerH, scrollViewH;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                animate = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : true;
                if (!_this10.usePageScroll) {
                  _context.next = 4;
                  break;
                }
                _this10.$nextTick(function () {
                  uni.pageScrollTo({
                    scrollTop: Number.MAX_VALUE,
                    duration: animate ? 100 : 0
                  });
                });
                return _context.abrupt("return");
              case 4:
                _context.prev = 4;
                _this10._updatePrivateScrollWithAnimation(animate);
                _context.next = 8;
                return _this10._getNodeClientRect('.zp-paging-container');
              case 8:
                pagingContainerNode = _context.sent;
                _context.next = 11;
                return _this10._getNodeClientRect('.zp-scroll-view');
              case 11:
                scrollViewNode = _context.sent;
                pagingContainerH = pagingContainerNode ? pagingContainerNode[0].height : 0;
                scrollViewH = scrollViewNode ? scrollViewNode[0].height : 0;
                if (pagingContainerH > scrollViewH) {
                  _this10.scrollTop = _this10.oldScrollTop;
                  _this10.$nextTick(function () {
                    _this10.scrollTop = pagingContainerH - scrollViewH + _this10.virtualPlaceholderTopHeight;
                    _this10.oldScrollTop = _this10.scrollTop;
                  });
                }
                _context.next = 19;
                break;
              case 17:
                _context.prev = 17;
                _context.t0 = _context["catch"](4);
              case 19:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[4, 17]]);
      }))();
    },
    // 滚动到指定view
    _scrollIntoView: function _scrollIntoView(sel) {
      var _this11 = this;
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var animate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var finishCallback = arguments.length > 3 ? arguments[3] : undefined;
      try {
        this.scrollTop = this.oldScrollTop;
        this.$nextTick(function () {
          _this11._getNodeClientRect('#' + sel.replace('#', ''), _this11.$parent).then(function (node) {
            if (node) {
              var nodeTop = node[0].top;
              _this11._scrollIntoViewByNodeTop(nodeTop, offset, animate);
              finishCallback && finishCallback();
            }
          });
        });
      } catch (e) {}
    },
    // 通过nodeTop滚动到指定view
    _scrollIntoViewByNodeTop: function _scrollIntoViewByNodeTop(nodeTop) {
      var _this12 = this;
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var animate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      // 如果是聊天记录模式并且列表倒置了，此时nodeTop需要等于scroll-view高度 - nodeTop
      if (this.isChatRecordModeAndInversion) {
        this._getNodeClientRect('.zp-scroll-view').then(function (sNode) {
          if (sNode) {
            _this12._scrollToY(sNode[0].height - nodeTop, offset, animate, true);
          }
        });
      } else {
        this._scrollToY(nodeTop, offset, animate, true);
      }
    },
    // 滚动到指定位置
    _scrollToY: function _scrollToY(y) {
      var _this13 = this;
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var animate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var addScrollTop = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      this._updatePrivateScrollWithAnimation(animate);
      _zPagingUtils.default.delay(function () {
        if (_this13.usePageScroll) {
          if (addScrollTop && _this13.pageScrollTop !== -1) {
            y += _this13.pageScrollTop;
          }
          var scrollTop = y - offset;
          uni.pageScrollTo({
            scrollTop: scrollTop,
            duration: animate ? 100 : 0
          });
        } else {
          if (addScrollTop) {
            y += _this13.oldScrollTop;
          }
          _this13.scrollTop = y - offset;
        }
      }, 10);
    },
    // scroll-view滚动中
    _scroll: function _scroll(e) {
      this.$emit('scroll', e);
      var scrollTop = e.detail.scrollTop;
      this.finalUseVirtualList && this._updateVirtualScroll(scrollTop, this.oldScrollTop - scrollTop);
      this.oldScrollTop = scrollTop;
      // 滚动区域内容的总高度 - 当前滚动的scrollTop = 当前滚动区域的顶部与内容底部的距离
      var scrollDiff = e.detail.scrollHeight - this.oldScrollTop;
      // 在非ios平台滚动中，再次验证一下是否滚动到了底部。因为在一些安卓设备中，有概率滚动到底部不触发@scrolltolower事件，因此添加双重检测逻辑
      !this.isIos && this._checkScrolledToBottom(scrollDiff);
    },
    // 更新内置的scroll-view是否启用滚动动画
    _updatePrivateScrollWithAnimation: function _updatePrivateScrollWithAnimation(animate) {
      var _this14 = this;
      this.privateScrollWithAnimation = animate ? 1 : 0;
      _zPagingUtils.default.delay(function () {
        return _this14.$nextTick(function () {
          // 在滚动结束后将滚动动画状态设置回初始状态
          _this14.privateScrollWithAnimation = -1;
        });
      }, 100, 'updateScrollWithAnimationDelay');
    },
    // 检测scrollView是否要铺满屏幕
    _doCheckScrollViewShouldFullHeight: function _doCheckScrollViewShouldFullHeight(totalData) {
      var _this15 = this;
      if (this.autoFullHeight && this.usePageScroll && this.isTotalChangeFromAddData) {
        this.$nextTick(function () {
          _this15._checkScrollViewShouldFullHeight(function (scrollViewNode, pagingContainerNode) {
            _this15._preCheckShowNoMoreInside(totalData, scrollViewNode, pagingContainerNode);
          });
        });
      } else {
        this._preCheckShowNoMoreInside(totalData);
      }
    },
    // 检测z-paging是否要全屏覆盖(当使用页面滚动并且不满全屏时，默认z-paging需要铺满全屏，避免数据过少时内部的empty-view无法正确展示)
    _checkScrollViewShouldFullHeight: function _checkScrollViewShouldFullHeight(callback) {
      var _this16 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2() {
        var scrollViewNode, pagingContainerNode, scrollViewHeight, scrollViewTop;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return _this16._getNodeClientRect('.zp-scroll-view');
              case 3:
                scrollViewNode = _context2.sent;
                _context2.next = 6;
                return _this16._getNodeClientRect('.zp-paging-container-content');
              case 6:
                pagingContainerNode = _context2.sent;
                if (!(!scrollViewNode || !pagingContainerNode)) {
                  _context2.next = 9;
                  break;
                }
                return _context2.abrupt("return");
              case 9:
                scrollViewHeight = pagingContainerNode[0].height;
                scrollViewTop = scrollViewNode[0].top;
                if (_this16.isAddedData && scrollViewHeight + scrollViewTop <= _this16.windowHeight) {
                  _this16._setAutoHeight(true, scrollViewNode);
                  callback(scrollViewNode, pagingContainerNode);
                } else {
                  _this16._setAutoHeight(false);
                  callback(null, null);
                }
                _context2.next = 17;
                break;
              case 14:
                _context2.prev = 14;
                _context2.t0 = _context2["catch"](0);
                callback(null, null);
              case 17:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, null, [[0, 14]]);
      }))();
    },
    // 更新缓存中z-paging整个内容容器高度
    _updateCachedSuperContentHeight: function _updateCachedSuperContentHeight() {
      var _this17 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee3() {
        var superContentNode;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _this17._getNodeClientRect('.z-paging-content');
              case 2:
                superContentNode = _context3.sent;
                if (superContentNode) {
                  _this17.superContentHeight = superContentNode[0].height;
                }
              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    // scrollTop改变时触发
    _scrollTopChange: function _scrollTopChange(newVal, isPageScrollTop) {
      this.$emit('scrollTopChange', newVal);
      this.$emit('update:scrollTop', newVal);
      this._checkShouldShowBackToTop(newVal);
      // 之前在安卓中scroll-view有概率滚动到顶部时scrollTop不为0导致下拉刷新判断异常，因此判断scrollTop在105之内都允许下拉刷新，但此方案会导致某些情况（例如滚动到距离顶部10px处）下拉抖动，因此改为通过获取zp-scroll-view的节点信息中的scrollTop进行验证的方案
      // const scrollTop = this.isIos ? (newVal > 5 ? 6 : 0) : (newVal > 105 ? 106 : (newVal > 5 ? 6 : 0));
      var scrollTop = newVal > 5 ? 6 : 0;
      if (isPageScrollTop && this.wxsPageScrollTop !== scrollTop) {
        this.wxsPageScrollTop = scrollTop;
      } else if (!isPageScrollTop && this.wxsScrollTop !== scrollTop) {
        this.wxsScrollTop = scrollTop;
        if (scrollTop > 6) {
          this.scrollEnable = true;
        }
      }
    },
    // 更新使用页面滚动时slot="top"或"bottom"插入view的高度
    _updatePageScrollTopOrBottomHeight: function _updatePageScrollTopOrBottomHeight(type) {
      var _this18 = this;
      if (!this.usePageScroll) return;
      this._doCheckScrollViewShouldFullHeight(this.realTotalData);
      var node = ".zp-page-".concat(type);
      var marginText = "margin".concat(type.slice(0, 1).toUpperCase() + type.slice(1));
      var safeAreaInsetBottomAdd = this.safeAreaInsetBottom;
      this.$nextTick(function () {
        var delayTime = 0;
        _zPagingUtils.default.delay(function () {
          _this18._getNodeClientRect(node).then(function (res) {
            if (res) {
              var pageScrollNodeHeight = res[0].height;
              if (type === 'bottom') {
                if (safeAreaInsetBottomAdd) {
                  pageScrollNodeHeight += _this18.safeAreaBottom;
                }
              } else {
                _this18.cacheTopHeight = pageScrollNodeHeight;
              }
              _this18.$set(_this18.scrollViewStyle, marginText, "".concat(pageScrollNodeHeight, "px"));
            } else if (safeAreaInsetBottomAdd) {
              _this18.$set(_this18.scrollViewStyle, marginText, "".concat(_this18.safeAreaBottom, "px"));
            }
          });
        }, delayTime);
      });
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ }),
/* 112 */
/*!**********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/back-to-top.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
// [z-paging]点击返回顶部view模块
var _default = {
  props: {
    // 自动显示点击返回顶部按钮，默认为否
    autoShowBackToTop: {
      type: Boolean,
      default: _zPagingUtils.default.gc('autoShowBackToTop', false)
    },
    // 点击返回顶部按钮显示/隐藏的阈值(滚动距离)，单位为px，默认为400rpx
    backToTopThreshold: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('backToTopThreshold', '400rpx')
    },
    // 点击返回顶部按钮的自定义图片地址，默认使用z-paging内置的图片
    backToTopImg: {
      type: String,
      default: _zPagingUtils.default.gc('backToTopImg', '')
    },
    // 点击返回顶部按钮返回到顶部时是否展示过渡动画，默认为是
    backToTopWithAnimate: {
      type: Boolean,
      default: _zPagingUtils.default.gc('backToTopWithAnimate', true)
    },
    // 点击返回顶部按钮与底部的距离，注意添加单位px或rpx，默认为160rpx
    backToTopBottom: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('backToTopBottom', '160rpx')
    },
    // 点击返回顶部按钮的自定义样式
    backToTopStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('backToTopStyle', {})
    },
    // iOS点击顶部状态栏、安卓双击标题栏时，滚动条返回顶部，只支持竖向，默认为是
    enableBackToTop: {
      type: Boolean,
      default: _zPagingUtils.default.gc('enableBackToTop', true)
    }
  },
  data: function data() {
    return {
      // 点击返回顶部的class
      backToTopClass: 'zp-back-to-top zp-back-to-top-hide',
      // 上次点击返回顶部的时间
      lastBackToTopShowTime: 0,
      // 点击返回顶部显示的class是否在展示中，使得按钮展示/隐藏过度效果更自然
      showBackToTopClass: false
    };
  },
  computed: {
    backToTopThresholdUnitConverted: function backToTopThresholdUnitConverted() {
      return _zPagingUtils.default.addUnit(this.backToTopThreshold, this.unit);
    },
    backToTopBottomUnitConverted: function backToTopBottomUnitConverted() {
      return _zPagingUtils.default.addUnit(this.backToTopBottom, this.unit);
    },
    finalEnableBackToTop: function finalEnableBackToTop() {
      return this.usePageScroll ? false : this.enableBackToTop;
    },
    finalBackToTopThreshold: function finalBackToTopThreshold() {
      return _zPagingUtils.default.convertToPx(this.backToTopThresholdUnitConverted);
    },
    finalBackToTopStyle: function finalBackToTopStyle() {
      var backToTopStyle = this.backToTopStyle;
      if (!backToTopStyle.bottom) {
        backToTopStyle.bottom = this.windowBottom + _zPagingUtils.default.convertToPx(this.backToTopBottomUnitConverted) + 'px';
      }
      if (!backToTopStyle.position) {
        backToTopStyle.position = this.usePageScroll ? 'fixed' : 'absolute';
      }
      return backToTopStyle;
    },
    finalBackToTopClass: function finalBackToTopClass() {
      return "".concat(this.backToTopClass, " zp-back-to-top-").concat(this.unit);
    }
  },
  methods: {
    // 点击了返回顶部
    _backToTopClick: function _backToTopClick() {
      var _this = this;
      var callbacked = false;
      this.$emit('backToTopClick', function (toTop) {
        (toTop === undefined || toTop === true) && _this._handleToTop();
        callbacked = true;
      });
      // 如果用户没有禁止默认的返回顶部事件，则触发滚动到顶部
      this.$nextTick(function () {
        !callbacked && _this._handleToTop();
      });
    },
    // 处理滚动到顶部
    _handleToTop: function _handleToTop() {
      !this.backToTopWithAnimate && this._checkShouldShowBackToTop(0);
      this.scrollToTop(this.backToTopWithAnimate);
    },
    // 判断是否要显示返回顶部按钮
    _checkShouldShowBackToTop: function _checkShouldShowBackToTop(scrollTop) {
      var _this2 = this;
      if (!this.autoShowBackToTop) {
        this.showBackToTopClass = false;
        return;
      }
      if (scrollTop > this.finalBackToTopThreshold) {
        if (!this.showBackToTopClass) {
          // 记录当前点击返回顶部按钮显示的class生效了
          this.showBackToTopClass = true;
          this.lastBackToTopShowTime = new Date().getTime();
          // 当滚动到需要展示返回顶部的阈值内，则延迟300毫秒展示返回到顶部按钮
          _zPagingUtils.default.delay(function () {
            _this2.backToTopClass = 'zp-back-to-top zp-back-to-top-show';
          }, 300);
        }
      } else {
        // 如果当前点击返回顶部按钮显示的class是生效状态并且滚动小于触发阈值，则隐藏返回顶部按钮
        if (this.showBackToTopClass) {
          this.backToTopClass = 'zp-back-to-top zp-back-to-top-hide';
          _zPagingUtils.default.delay(function () {
            _this2.showBackToTopClass = false;
          }, new Date().getTime() - this.lastBackToTopShowTime < 500 ? 0 : 300);
        }
      }
    }
  }
};
exports.default = _default;

/***/ }),
/* 113 */
/*!***********************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/z-paging/components/z-paging/js/modules/virtual-list.js ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _regenerator = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/regenerator */ 42));
var _asyncToGenerator2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ 44));
var _zPagingUtils = _interopRequireDefault(__webpack_require__(/*! .././z-paging-utils */ 94));
var _zPagingConstant = _interopRequireDefault(__webpack_require__(/*! .././z-paging-constant */ 93));
var _zPagingEnum = _interopRequireDefault(__webpack_require__(/*! .././z-paging-enum */ 98));
// [z-paging]虚拟列表模块
var _default = {
  props: {
    // 是否使用虚拟列表，默认为否
    useVirtualList: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useVirtualList', false)
    },
    // 在使用虚拟列表时，是否使用兼容模式，默认为否
    useCompatibilityMode: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useCompatibilityMode', false)
    },
    // 使用兼容模式时传递的附加数据
    extraData: {
      type: Object,
      default: _zPagingUtils.default.gc('extraData', {})
    },
    // 是否在z-paging内部循环渲染列表(内置列表)，默认为否。若use-virtual-list为true，则此项恒为true
    useInnerList: {
      type: Boolean,
      default: _zPagingUtils.default.gc('useInnerList', false)
    },
    // 强制关闭inner-list，默认为false，如果为true将强制关闭innerList，适用于开启了虚拟列表后需要强制关闭inner-list的情况
    forceCloseInnerList: {
      type: Boolean,
      default: _zPagingUtils.default.gc('forceCloseInnerList', false)
    },
    // 内置列表cell的key名称，仅nvue有效，在nvue中开启use-inner-list时必须填此项
    cellKeyName: {
      type: String,
      default: _zPagingUtils.default.gc('cellKeyName', '')
    },
    // innerList样式
    innerListStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('innerListStyle', {})
    },
    // innerCell样式
    innerCellStyle: {
      type: Object,
      default: _zPagingUtils.default.gc('innerCellStyle', {})
    },
    // 预加载的列表可视范围(列表高度)页数，默认为12，即预加载当前页及上下各12页的cell。此数值越大，则虚拟列表中加载的dom越多，内存消耗越大(会维持在一个稳定值)，但增加预加载页面数量可缓解快速滚动短暂白屏问题
    preloadPage: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('preloadPage', 12),
      validator: function validator(value) {
        if (value <= 0) _zPagingUtils.default.consoleErr('preload-page必须大于0！');
        return value > 0;
      }
    },
    // 虚拟列表cell高度模式，默认为fixed，也就是每个cell高度完全相同，将以第一个cell高度为准进行计算。可选值【dynamic】，即代表高度是动态非固定的，【dynamic】性能低于【fixed】。
    cellHeightMode: {
      type: String,
      default: _zPagingUtils.default.gc('cellHeightMode', _zPagingEnum.default.CellHeightMode.Fixed)
    },
    // 固定的cell高度，cellHeightMode=fixed才有效，若设置了值，则不计算第一个cell高度而使用设置的cell高度
    fixedCellHeight: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('fixedCellHeight', 0)
    },
    // 虚拟列表列数，默认为1。常用于每行有多列的情况，例如每行有2列数据，需要将此值设置为2
    virtualListCol: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('virtualListCol', 1)
    },
    // 虚拟列表scroll取样帧率，默认为80，过低容易出现白屏问题，过高容易出现卡顿问题
    virtualScrollFps: {
      type: [Number, String],
      default: _zPagingUtils.default.gc('virtualScrollFps', 80)
    }
  },
  data: function data() {
    return {
      virtualListKey: _zPagingUtils.default.getInstanceId(),
      virtualPageHeight: 0,
      virtualCellHeight: 0,
      virtualScrollTimeStamp: 0,
      virtualList: [],
      virtualPlaceholderTopHeight: 0,
      virtualPlaceholderBottomHeight: 0,
      virtualTopRangeIndex: 0,
      virtualBottomRangeIndex: 0,
      lastVirtualTopRangeIndex: 0,
      lastVirtualBottomRangeIndex: 0,
      virtualItemInsertedCount: 0,
      virtualHeightCacheList: [],
      getCellHeightRetryCount: {
        fixed: 0,
        dynamic: 0
      },
      pagingOrgTop: -1,
      updateVirtualListFromDataChange: false
    };
  },
  watch: {
    // 监听总数据的改变，刷新虚拟列表布局
    realTotalData: function realTotalData(newVal) {
      var _this = this;
      if (this.finalUseVirtualList) {
        this.updateVirtualListFromDataChange = true;
        this.$nextTick(function () {
          _this.getCellHeightRetryCount.fixed = 0;
          !newVal.length && _this._resetDynamicListState(!_this.isUserPullDown);
          newVal.length && _this.cellHeightMode === _zPagingEnum.default.CellHeightMode.Fixed && _this.isFirstPage && _this._updateFixedCellHeight();
          _this._updateVirtualScroll(_this.oldScrollTop);
        });
      }
    },
    // 监听虚拟列表渲染数组的改变并emit
    virtualList: function virtualList(newVal) {
      this.$emit('update:virtualList', newVal);
      this.$emit('virtualListChange', newVal);
    }
  },
  computed: {
    virtualCellIndexKey: function virtualCellIndexKey() {
      return _zPagingConstant.default.listCellIndexKey;
    },
    finalUseVirtualList: function finalUseVirtualList() {
      if (this.useVirtualList && this.usePageScroll) {
        _zPagingUtils.default.consoleErr('使用页面滚动时，开启虚拟列表无效！');
      }
      return this.useVirtualList && !this.usePageScroll;
    },
    finalUseInnerList: function finalUseInnerList() {
      return this.useInnerList || this.finalUseVirtualList && !this.forceCloseInnerList;
    },
    finalCellKeyName: function finalCellKeyName() {
      return this.cellKeyName;
    },
    finalVirtualPageHeight: function finalVirtualPageHeight() {
      return this.virtualPageHeight > 0 ? this.virtualPageHeight : this.windowHeight;
    },
    finalFixedCellHeight: function finalFixedCellHeight() {
      return _zPagingUtils.default.convertToPx(this.fixedCellHeight);
    },
    virtualRangePageHeight: function virtualRangePageHeight() {
      return this.finalVirtualPageHeight * this.preloadPage;
    },
    virtualScrollDisTimeStamp: function virtualScrollDisTimeStamp() {
      return 1000 / this.virtualScrollFps;
    }
  },
  methods: {
    // 在使用动态高度虚拟列表时，若在列表数组中需要插入某个item，需要调用此方法；item:需要插入的item，index:插入的cell位置，若index为2，则插入的item在原list的index=1之后，index从0开始
    doInsertVirtualListItem: function doInsertVirtualListItem(item, index) {
      var _this2 = this;
      if (this.cellHeightMode !== _zPagingEnum.default.CellHeightMode.Dynamic) return;
      this.virtualItemInsertedCount++;
      if (!item || Object.prototype.toString.call(item) !== '[object Object]') {
        item = {
          item: item
        };
      }
      var cellIndexKey = this.virtualCellIndexKey;
      item[cellIndexKey] = "custom-".concat(this.virtualItemInsertedCount);
      item[_zPagingConstant.default.listCellIndexUniqueKey] = "".concat(this.virtualListKey, "-").concat(item[cellIndexKey]);
      this.$nextTick( /*#__PURE__*/(0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
        var retryCount, cellNode, currentHeight, lastHeightCache, lastTotalHeight, i, thisNode;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                retryCount = 0;
              case 1:
                if (!(retryCount <= 10)) {
                  _context.next = 19;
                  break;
                }
                _context.next = 4;
                return _zPagingUtils.default.wait(_zPagingConstant.default.delayTime);
              case 4:
                _context.next = 6;
                return _this2._getNodeClientRect("#zp-id-".concat(item[cellIndexKey]), _this2.finalUseInnerList);
              case 6:
                cellNode = _context.sent;
                if (cellNode) {
                  _context.next = 10;
                  break;
                }
                retryCount++;
                return _context.abrupt("continue", 1);
              case 10:
                currentHeight = cellNode ? cellNode[0].height : 0;
                lastHeightCache = _this2.virtualHeightCacheList[index - 1];
                lastTotalHeight = lastHeightCache ? lastHeightCache.totalHeight : 0; // 在缓存的cell高度数组中，插入此cell高度信息
                _this2.virtualHeightCacheList.splice(index, 0, {
                  height: currentHeight,
                  lastTotalHeight: lastTotalHeight,
                  totalHeight: lastTotalHeight + currentHeight
                });

                // 从当前index起后续的cell缓存高度的lastTotalHeight和totalHeight需要加上当前cell的高度
                for (i = index + 1; i < _this2.virtualHeightCacheList.length; i++) {
                  thisNode = _this2.virtualHeightCacheList[i];
                  thisNode.lastTotalHeight += currentHeight;
                  thisNode.totalHeight += currentHeight;
                }
                _this2._updateVirtualScroll(_this2.oldScrollTop);
                return _context.abrupt("break", 19);
              case 19:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      })));
    },
    // 在使用动态高度虚拟列表时，手动更新指定cell的缓存高度(当cell高度在初始化之后再次改变时调用)；index:需要更新的cell在列表中的位置，从0开始
    didUpdateVirtualListCell: function didUpdateVirtualListCell(index) {
      var _this3 = this;
      if (this.cellHeightMode !== _zPagingEnum.default.CellHeightMode.Dynamic) return;
      var currentNode = this.virtualHeightCacheList[index];
      this.$nextTick(function () {
        _this3._getNodeClientRect("#zp-id-".concat(index), _this3.finalUseInnerList).then(function (cellNode) {
          // 更新当前cell的高度
          var cellNodeHeight = cellNode ? cellNode[0].height : 0;
          var heightDis = cellNodeHeight - currentNode.height;
          currentNode.height = cellNodeHeight;
          currentNode.totalHeight = currentNode.lastTotalHeight + cellNodeHeight;

          // 从当前index起后续的cell缓存高度的lastTotalHeight和totalHeight需要加上当前cell变化的高度
          for (var i = index + 1; i < _this3.virtualHeightCacheList.length; i++) {
            var thisNode = _this3.virtualHeightCacheList[i];
            thisNode.totalHeight += heightDis;
            thisNode.lastTotalHeight += heightDis;
          }
        });
      });
    },
    // 在使用动态高度虚拟列表时，若删除了列表数组中的某个item，需要调用此方法以更新高度缓存数组；index:删除的cell在列表中的位置，从0开始
    didDeleteVirtualListCell: function didDeleteVirtualListCell(index) {
      if (this.cellHeightMode !== _zPagingEnum.default.CellHeightMode.Dynamic) return;
      var currentNode = this.virtualHeightCacheList[index];
      // 从当前index起后续的cell缓存高度的lastTotalHeight和totalHeight需要减去当前cell的高度
      for (var i = index + 1; i < this.virtualHeightCacheList.length; i++) {
        var thisNode = this.virtualHeightCacheList[i];
        thisNode.totalHeight -= currentNode.height;
        thisNode.lastTotalHeight -= currentNode.height;
      }
      // 将当前cell的高度信息从高度缓存数组中删除
      this.virtualHeightCacheList.splice(index, 1);
    },
    // 初始化虚拟列表
    _virtualListInit: function _virtualListInit() {
      var _this4 = this;
      this.$nextTick(function () {
        _zPagingUtils.default.delay(function () {
          // 获取虚拟列表滚动区域的高度
          _this4._getNodeClientRect('.zp-scroll-view').then(function (node) {
            if (node) {
              _this4.pagingOrgTop = node[0].top;
              _this4.virtualPageHeight = node[0].height;
            }
          });
        });
      });
    },
    // cellHeightMode为fixed时获取第一个cell高度
    _updateFixedCellHeight: function _updateFixedCellHeight() {
      var _this5 = this;
      if (!this.finalFixedCellHeight) {
        this.$nextTick(function () {
          _zPagingUtils.default.delay(function () {
            _this5._getNodeClientRect("#zp-id-".concat(0), _this5.finalUseInnerList).then(function (cellNode) {
              if (!cellNode) {
                if (_this5.getCellHeightRetryCount.fixed > 10) return;
                _this5.getCellHeightRetryCount.fixed++;
                // 如果获取第一个cell的节点信息失败，则重试（不超过10次）
                _this5._updateFixedCellHeight();
              } else {
                _this5.virtualCellHeight = cellNode[0].height;
                _this5._updateVirtualScroll(_this5.oldScrollTop);
              }
            });
          }, _zPagingConstant.default.delayTime, 'updateFixedCellHeightDelay');
        });
      } else {
        this.virtualCellHeight = this.finalFixedCellHeight;
      }
    },
    // cellHeightMode为dynamic时获取每个cell高度
    _updateDynamicCellHeight: function _updateDynamicCellHeight(list) {
      var _this6 = this;
      var dataFrom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'bottom';
      var dataFromTop = dataFrom === 'top';
      var heightCacheList = this.virtualHeightCacheList;
      var currentCacheList = dataFromTop ? [] : heightCacheList;
      var listTotalHeight = 0;
      this.$nextTick(function () {
        _zPagingUtils.default.delay( /*#__PURE__*/(0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2() {
          var i, cellNode, currentHeight, lastHeightCache, lastTotalHeight, _i, heightCacheItem;
          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  i = 0;
                case 1:
                  if (!(i < list.length)) {
                    _context2.next = 16;
                    break;
                  }
                  _context2.next = 4;
                  return _this6._getNodeClientRect("#zp-id-".concat(list[i][_this6.virtualCellIndexKey]), _this6.finalUseInnerList);
                case 4:
                  cellNode = _context2.sent;
                  currentHeight = cellNode ? cellNode[0].height : 0;
                  if (cellNode) {
                    _context2.next = 9;
                    break;
                  }
                  if (_this6.getCellHeightRetryCount.dynamic <= 10) {
                    heightCacheList.splice(heightCacheList.length - i, i);
                    _this6.getCellHeightRetryCount.dynamic++;
                    // 如果获取当前cell的节点信息失败，则重试（不超过10次）
                    _this6._updateDynamicCellHeight(list, dataFrom);
                  }
                  return _context2.abrupt("return");
                case 9:
                  lastHeightCache = currentCacheList.length ? currentCacheList.slice(-1)[0] : null;
                  lastTotalHeight = lastHeightCache ? lastHeightCache.totalHeight : 0; // 缓存当前cell的高度信息：height-当前cell高度；lastTotalHeight-前面所有cell的高度总和；totalHeight-包含当前cell的所有高度总和
                  currentCacheList.push({
                    height: currentHeight,
                    lastTotalHeight: lastTotalHeight,
                    totalHeight: lastTotalHeight + currentHeight
                  });
                  if (dataFromTop) {
                    listTotalHeight += currentHeight;
                  }
                case 13:
                  i++;
                  _context2.next = 1;
                  break;
                case 16:
                  // 如果数据是从顶部拼接的
                  if (dataFromTop && list.length) {
                    for (_i = 0; _i < heightCacheList.length; _i++) {
                      // 更新之前所有项的缓存高度，需要加上此次插入的所有cell高度之和（因为是从顶部插入的cell）
                      heightCacheItem = heightCacheList[_i];
                      heightCacheItem.lastTotalHeight += listTotalHeight;
                      heightCacheItem.totalHeight += listTotalHeight;
                    }
                    _this6.virtualHeightCacheList = currentCacheList.concat(heightCacheList);
                  }
                  _this6._updateVirtualScroll(_this6.oldScrollTop);
                case 18:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        })), _zPagingConstant.default.delayTime, 'updateDynamicCellHeightDelay');
      });
    },
    // 设置cellItem的index
    _setCellIndex: function _setCellIndex(list) {
      var dataFrom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'bottom';
      var currentItemIndex = 0;
      var cellIndexKey = this.virtualCellIndexKey;
      [_zPagingEnum.default.QueryFrom.Refresh, _zPagingEnum.default.QueryFrom.Reload].indexOf(this.queryFrom) >= 0 && this._resetDynamicListState();
      if (this.totalData.length) {
        if (dataFrom === 'bottom') {
          currentItemIndex = this.realTotalData.length;
          var lastItem = this.realTotalData.length ? this.realTotalData.slice(-1)[0] : null;
          if (lastItem && lastItem[cellIndexKey] !== undefined) {
            currentItemIndex = lastItem[cellIndexKey] + 1;
          }
        } else if (dataFrom === 'top') {
          var firstItem = this.realTotalData.length ? this.realTotalData[0] : null;
          if (firstItem && firstItem[cellIndexKey] !== undefined) {
            currentItemIndex = firstItem[cellIndexKey] - list.length;
          }
        }
      } else {
        this._resetDynamicListState();
      }
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item || Object.prototype.toString.call(item) !== '[object Object]') {
          item = {
            item: item
          };
        }
        if (item[_zPagingConstant.default.listCellIndexUniqueKey]) {
          item = _zPagingUtils.default.deepCopy(item);
        }
        item[cellIndexKey] = currentItemIndex + i;
        item[_zPagingConstant.default.listCellIndexUniqueKey] = "".concat(this.virtualListKey, "-").concat(item[cellIndexKey]);
        list[i] = item;
      }
      this.getCellHeightRetryCount.dynamic = 0;
      this.cellHeightMode === _zPagingEnum.default.CellHeightMode.Dynamic && this._updateDynamicCellHeight(list, dataFrom);
    },
    // 更新scroll滚动（虚拟列表滚动时触发）
    _updateVirtualScroll: function _updateVirtualScroll(scrollTop) {
      var scrollDiff = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var currentTimeStamp = _zPagingUtils.default.getTime();
      scrollTop === 0 && this._resetTopRange();
      if (scrollTop !== 0 && this.virtualScrollTimeStamp && currentTimeStamp - this.virtualScrollTimeStamp <= this.virtualScrollDisTimeStamp) {
        return;
      }
      this.virtualScrollTimeStamp = currentTimeStamp;
      var scrollIndex = 0;
      var cellHeightMode = this.cellHeightMode;
      if (cellHeightMode === _zPagingEnum.default.CellHeightMode.Fixed) {
        // 如果是固定高度的虚拟列表
        // 计算当前滚动到的cell的index = scrollTop / 虚拟列表cell的固定高度
        scrollIndex = parseInt(scrollTop / this.virtualCellHeight) || 0;
        // 更新顶部和底部占位view的高度（为兼容考虑，顶部采用transformY的方式占位)
        this._updateFixedTopRangeIndex(scrollIndex);
        this._updateFixedBottomRangeIndex(scrollIndex);
      } else if (cellHeightMode === _zPagingEnum.default.CellHeightMode.Dynamic) {
        // 如果是不固定高度的虚拟列表
        // 当前滚动的方向
        var scrollDirection = scrollDiff > 0 ? 'top' : 'bottom';
        // 视图区域的高度
        var rangePageHeight = this.virtualRangePageHeight;
        // 顶部视图区域外的高度（顶部不需要渲染而是需要占位部分的高度）
        var topRangePageOffset = scrollTop - rangePageHeight;
        // 底部视图区域外的高度（底部不需要渲染而是需要占位部分的高度）
        var bottomRangePageOffset = scrollTop + this.finalVirtualPageHeight + rangePageHeight;
        var virtualBottomRangeIndex = 0;
        var virtualPlaceholderBottomHeight = 0;
        var reachedLimitBottom = false;
        var heightCacheList = this.virtualHeightCacheList;
        var lastHeightCache = !!heightCacheList ? heightCacheList.slice(-1)[0] : null;
        var startTopRangeIndex = this.virtualTopRangeIndex;
        // 如果是向底部滚动（顶部占位的高度不断增大，顶部的实际渲染cell数量不断减少）
        if (scrollDirection === 'bottom') {
          // 从顶部视图边缘的cell的位置开始向后查找
          for (var i = startTopRangeIndex; i < heightCacheList.length; i++) {
            var heightCacheItem = heightCacheList[i];
            // 如果查找到某个cell对应的totalHeight大于顶部视图区域外的高度，则此cell为顶部视图边缘的cell
            if (heightCacheItem && heightCacheItem.totalHeight > topRangePageOffset) {
              // 记录顶部视图边缘cell的index并更新顶部占位区域的高度并停止继续查找
              this.virtualTopRangeIndex = i;
              this.virtualPlaceholderTopHeight = heightCacheItem.lastTotalHeight;
              break;
            }
          }
        } else {
          // 如果是向顶部滚动（顶部占位的高度不断减少，顶部的实际渲染cell数量不断增加）
          var topRangeMatched = false;
          // 从顶部视图边缘的cell的位置开始向前查找
          for (var _i2 = startTopRangeIndex; _i2 >= 0; _i2--) {
            var _heightCacheItem = heightCacheList[_i2];
            // 如果查找到某个cell对应的totalHeight小于顶部视图区域外的高度，则此cell为顶部视图边缘的cell
            if (_heightCacheItem && _heightCacheItem.totalHeight < topRangePageOffset) {
              // 记录顶部视图边缘cell的index并更新顶部占位区域的高度并停止继续查找
              this.virtualTopRangeIndex = _i2;
              this.virtualPlaceholderTopHeight = _heightCacheItem.lastTotalHeight;
              topRangeMatched = true;
              break;
            }
          }
          // 如果查找不到，则认为顶部占位高度为0了，顶部cell不需要继续复用，重置topRangeIndex和placeholderTopHeight
          !topRangeMatched && this._resetTopRange();
        }
        // 从顶部视图边缘的cell的位置开始向后查找
        for (var _i3 = this.virtualTopRangeIndex; _i3 < heightCacheList.length; _i3++) {
          var _heightCacheItem2 = heightCacheList[_i3];
          // 如果查找到某个cell对应的totalHeight大于底部视图区域外的高度，则此cell为底部视图边缘的cell
          if (_heightCacheItem2 && _heightCacheItem2.totalHeight > bottomRangePageOffset) {
            // 记录底部视图边缘cell的index并更新底部占位区域的高度并停止继续查找
            virtualBottomRangeIndex = _i3;
            virtualPlaceholderBottomHeight = lastHeightCache.totalHeight - _heightCacheItem2.totalHeight;
            reachedLimitBottom = true;
            break;
          }
        }
        if (!reachedLimitBottom || this.virtualBottomRangeIndex === 0) {
          this.virtualBottomRangeIndex = this.realTotalData.length ? this.realTotalData.length - 1 : this.pageSize;
          this.virtualPlaceholderBottomHeight = 0;
        } else {
          this.virtualBottomRangeIndex = virtualBottomRangeIndex;
          this.virtualPlaceholderBottomHeight = virtualPlaceholderBottomHeight;
        }
        this._updateVirtualList();
      }
    },
    // 更新fixedCell模式下topRangeIndex&placeholderTopHeight
    _updateFixedTopRangeIndex: function _updateFixedTopRangeIndex(scrollIndex) {
      var virtualTopRangeIndex = this.virtualCellHeight === 0 ? 0 : scrollIndex - (parseInt(this.finalVirtualPageHeight / this.virtualCellHeight) || 1) * this.preloadPage;
      virtualTopRangeIndex *= this.virtualListCol;
      virtualTopRangeIndex = Math.max(0, virtualTopRangeIndex);
      this.virtualTopRangeIndex = virtualTopRangeIndex;
      this.virtualPlaceholderTopHeight = virtualTopRangeIndex / this.virtualListCol * this.virtualCellHeight;
    },
    // 更新fixedCell模式下bottomRangeIndex&placeholderBottomHeight
    _updateFixedBottomRangeIndex: function _updateFixedBottomRangeIndex(scrollIndex) {
      var virtualBottomRangeIndex = this.virtualCellHeight === 0 ? this.pageSize : scrollIndex + (parseInt(this.finalVirtualPageHeight / this.virtualCellHeight) || 1) * (this.preloadPage + 1);
      virtualBottomRangeIndex *= this.virtualListCol;
      virtualBottomRangeIndex = Math.min(this.realTotalData.length, virtualBottomRangeIndex);
      this.virtualBottomRangeIndex = virtualBottomRangeIndex;
      this.virtualPlaceholderBottomHeight = (this.realTotalData.length - virtualBottomRangeIndex) * this.virtualCellHeight / this.virtualListCol;
      this._updateVirtualList();
    },
    // 更新virtualList
    _updateVirtualList: function _updateVirtualList() {
      var shouldUpdateList = this.updateVirtualListFromDataChange || this.lastVirtualTopRangeIndex !== this.virtualTopRangeIndex || this.lastVirtualBottomRangeIndex !== this.virtualBottomRangeIndex;
      if (shouldUpdateList) {
        this.updateVirtualListFromDataChange = false;
        this.lastVirtualTopRangeIndex = this.virtualTopRangeIndex;
        this.lastVirtualBottomRangeIndex = this.virtualBottomRangeIndex;
        this.virtualList = this.realTotalData.slice(this.virtualTopRangeIndex, this.virtualBottomRangeIndex + 1);
      }
    },
    // 重置动态cell模式下的高度缓存数据、虚拟列表和滚动状态
    _resetDynamicListState: function _resetDynamicListState() {
      var resetVirtualList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      this.virtualHeightCacheList = [];
      if (resetVirtualList) {
        this.virtualList = [];
      }
      this.virtualTopRangeIndex = 0;
      this.virtualPlaceholderTopHeight = 0;
    },
    // 重置topRangeIndex和placeholderTopHeight
    _resetTopRange: function _resetTopRange() {
      this.virtualTopRangeIndex = 0;
      this.virtualPlaceholderTopHeight = 0;
      this._updateVirtualList();
    },
    // 检测虚拟列表当前滚动位置，如发现滚动位置不正确则重新计算虚拟列表相关参数(为解决在App中可能出现的长时间进入后台后打开App白屏的问题)
    _checkVirtualListScroll: function _checkVirtualListScroll() {
      var _this7 = this;
      if (this.finalUseVirtualList) {
        this.$nextTick(function () {
          _this7._getNodeClientRect('.zp-paging-touch-view').then(function (node) {
            var currentTop = node ? node[0].top : 0;
            if (!node || currentTop === _this7.pagingOrgTop && _this7.virtualPlaceholderTopHeight !== 0) {
              _this7._updateVirtualScroll(0);
            }
          });
        });
      }
    },
    // 处理使用内置列表时点击了cell事件
    _innerCellClick: function _innerCellClick(item, index) {
      this.$emit('innerCellClick', item, index);
    }
  }
};
exports.default = _default;

/***/ }),
/* 114 */,
/* 115 */,
/* 116 */,
/* 117 */,
/* 118 */,
/* 119 */,
/* 120 */,
/* 121 */,
/* 122 */,
/* 123 */,
/* 124 */,
/* 125 */,
/* 126 */,
/* 127 */,
/* 128 */,
/* 129 */,
/* 130 */,
/* 131 */,
/* 132 */,
/* 133 */,
/* 134 */,
/* 135 */,
/* 136 */,
/* 137 */,
/* 138 */,
/* 139 */,
/* 140 */,
/* 141 */,
/* 142 */,
/* 143 */,
/* 144 */,
/* 145 */,
/* 146 */,
/* 147 */,
/* 148 */,
/* 149 */,
/* 150 */,
/* 151 */,
/* 152 */,
/* 153 */,
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */,
/* 160 */,
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */,
/* 165 */,
/* 166 */,
/* 167 */,
/* 168 */,
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */,
/* 175 */,
/* 176 */,
/* 177 */,
/* 178 */,
/* 179 */
/*!***************************************************************************************************************!*\
  !*** /Users/liran/Desktop/superPower/uni_modules/uni-transition/components/uni-transition/createAnimation.js ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAnimation = createAnimation;
var _defineProperty2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/defineProperty */ 11));
var _classCallCheck2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ 23));
var _createClass2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/createClass */ 24));
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
// const defaultOption = {
// 	duration: 300,
// 	timingFunction: 'linear',
// 	delay: 0,
// 	transformOrigin: '50% 50% 0'
// }
var MPAnimation = /*#__PURE__*/function () {
  function MPAnimation(options, _this) {
    (0, _classCallCheck2.default)(this, MPAnimation);
    this.options = options;
    // 在iOS10+QQ小程序平台下，传给原生的对象一定是个普通对象而不是Proxy对象，否则会报parameter should be Object instead of ProxyObject的错误
    this.animation = uni.createAnimation(_objectSpread({}, options));
    this.currentStepAnimates = {};
    this.next = 0;
    this.$ = _this;
  }
  (0, _createClass2.default)(MPAnimation, [{
    key: "_nvuePushAnimates",
    value: function _nvuePushAnimates(type, args) {
      var aniObj = this.currentStepAnimates[this.next];
      var styles = {};
      if (!aniObj) {
        styles = {
          styles: {},
          config: {}
        };
      } else {
        styles = aniObj;
      }
      if (animateTypes1.includes(type)) {
        if (!styles.styles.transform) {
          styles.styles.transform = '';
        }
        var unit = '';
        if (type === 'rotate') {
          unit = 'deg';
        }
        styles.styles.transform += "".concat(type, "(").concat(args + unit, ") ");
      } else {
        styles.styles[type] = "".concat(args);
      }
      this.currentStepAnimates[this.next] = styles;
    }
  }, {
    key: "_animateRun",
    value: function _animateRun() {
      var styles = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var ref = this.$.$refs['ani'].ref;
      if (!ref) return;
      return new Promise(function (resolve, reject) {
        nvueAnimation.transition(ref, _objectSpread({
          styles: styles
        }, config), function (res) {
          resolve();
        });
      });
    }
  }, {
    key: "_nvueNextAnimate",
    value: function _nvueNextAnimate(animates) {
      var _this2 = this;
      var step = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var fn = arguments.length > 2 ? arguments[2] : undefined;
      var obj = animates[step];
      if (obj) {
        var styles = obj.styles,
          config = obj.config;
        this._animateRun(styles, config).then(function () {
          step += 1;
          _this2._nvueNextAnimate(animates, step, fn);
        });
      } else {
        this.currentStepAnimates = {};
        typeof fn === 'function' && fn();
        this.isEnd = true;
      }
    }
  }, {
    key: "step",
    value: function step() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.animation.step(config);
      return this;
    }
  }, {
    key: "run",
    value: function run(fn) {
      this.$.animationData = this.animation.export();
      this.$.timer = setTimeout(function () {
        typeof fn === 'function' && fn();
      }, this.$.durationTime);
    }
  }]);
  return MPAnimation;
}();
var animateTypes1 = ['matrix', 'matrix3d', 'rotate', 'rotate3d', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scale3d', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY', 'translate', 'translate3d', 'translateX', 'translateY', 'translateZ'];
var animateTypes2 = ['opacity', 'backgroundColor'];
var animateTypes3 = ['width', 'height', 'left', 'right', 'top', 'bottom'];
animateTypes1.concat(animateTypes2, animateTypes3).forEach(function (type) {
  MPAnimation.prototype[type] = function () {
    var _this$animation;
    (_this$animation = this.animation)[type].apply(_this$animation, arguments);
    return this;
  };
});
function createAnimation(option, _this) {
  if (!_this) return;
  clearTimeout(_this.timer);
  return new MPAnimation(option, _this);
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"]))

/***/ })
]]);
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/vendor.js.map