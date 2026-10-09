// Run: node pages/device-battery/protection-status-permission.test.js
// Execute both pages' real permission loaders and render their real card templates.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const ts = require('typescript')
const vue = require('vue')
const { parse, compileTemplate } = require('@vue/compiler-sfc')
const { renderToString } = require('vue/server-renderer')

const detail = fs.readFileSync(path.join(__dirname, 'detail.vue'), 'utf8')
const dashboard = fs.readFileSync(path.join(__dirname, 'components/dashboard-tab.vue'), 'utf8')
const webRoot = path.resolve(__dirname, '../../../frontend')
const webPanel = fs.readFileSync(path.join(webRoot, 'src/views/device/details/modules/bms-panel/index.vue'), 'utf8')
const protectionCode = 'app_device_detail_protection_status'
const historyCode = 'app_device_detail_history'

function section(source, start, end) {
  const from = source.indexOf(start)
  const to = source.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `missing actual handler: ${start}`)
  return source.slice(from, to)
}

function execute(source, context) {
  vm.runInContext(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText, context)
}

function page(platform, request) {
  let current = true
  let calls = 0
  const context = vm.createContext({
    ref: vue.ref,
    capturePageLifecycle: () => 1,
    isPageLifecycleCurrent: () => current,
    fetchCurrentMobileUIPermissions: () => { calls++; return request() },
    console: { warn() {} },
  })
  execute(platform === 'mobile'
    ? section(detail, 'const DEVICE_HISTORY_PERMISSION =', 'const otaRunning =') +
      section(detail, 'const loadDetailUIPermissions =', 'const goBack =') +
      '\nglobalThis.load = loadDetailUIPermissions; globalThis.history = canShowHistoryTab'
    : section(webPanel, 'const DEVICE_PROTECTION_STATUS_PERMISSION =', 'const connType =') +
      section(webPanel, 'async function loadProtectionStatusPermission()', 'async function loadDeviceParamPermissions()') +
      '\nglobalThis.load = loadProtectionStatusPermission', context)
  execute('globalThis.visible = canShowProtectionStatus', context)
  return { context, calls: () => calls, unload: () => { current = false } }
}

function findNode(node, predicate) {
  if (predicate(node)) return node
  for (const child of node.children || []) {
    const match = findNode(child, predicate)
    if (match) return match
  }
}

function cardRender(source, platform) {
  const template = parse(source).descriptor.template
  const card = findNode(template.ast, node => platform === 'mobile'
    ? node.tag === 'view' && node.props.some(prop => prop.name === 'class' && prop.value?.content === 'protect-card')
    : node.tag === 'NGridItem' && node.children.some(child =>
      child.tag === 'NCard' && child.props.some(prop => prop.exp?.content.includes('dashboard.protectStatus'))))
  assert.ok(card, `missing ${platform} card container`)
  const result = compileTemplate({ source: card.loc.source,
    filename: `${platform}-card.vue`, id: platform,
    compilerOptions: { isCustomElement: tag => platform === 'mobile' && ['view', 'text'].includes(tag) } })
  assert.deepEqual(result.errors, [])
  const context = vm.createContext({ exports: {}, require: createRequire(platform === 'web'
    ? path.join(webRoot, 'package.json') : path.resolve(__dirname, '../../package.json')) })
  execute(result.code, context)
  return context.exports.render
}

async function renderCard(render, platform, visible, expanded) {
  const webVue = createRequire(path.join(webRoot, 'package.json'))('vue')
  const runtime = platform === 'web' ? webVue : vue
  const renderer = platform === 'web'
    ? createRequire(path.join(webRoot, 'package.json'))('vue/server-renderer').renderToString : renderToString
  const wrapper = { render() { return runtime.h('div', null, [this.$slots['header-extra']?.(), this.$slots.default?.()]) } }
  const app = runtime.createSSRApp({
    components: { NGridItem: wrapper, NCard: wrapper, NButton: wrapper },
    data: () => ({ showProtectionStatus: visible, canShowProtectionStatus: visible,
      protectExpanded: expanded, protectPanelExpanded: expanded, protectSummaryText: 'SUMMARY',
      protectStatusList: [{ key: 'on', label: 'ROW ON', enabled: true }, { key: 'off', label: 'ROW OFF', enabled: false }],
      protectStatusRows: [{ key: 'on', label: 'ROW ON', enabled: true }, { key: 'off', label: 'ROW OFF', enabled: false }],
      toggleProtectCard() {}, toggleProtectPanel() {} }),
    render,
  })
  app.config.globalProperties.$t = key => key
  return renderer(app)
}

async function main() {
  assert.match(detail, /:show-protection-status="canShowProtectionStatus"/)
  assert.match(detail, /void loadDetailUIPermissions\(\)/)
  assert.match(webPanel, /onMounted\(\(\) => \{[\s\S]*?loadProtectionStatusPermission\(\)/)
  const renders = { mobile: cardRender(dashboard, 'mobile'), web: cardRender(webPanel, 'web') }
  for (const platform of ['mobile', 'web']) {
    for (const [data, visible, history] of [
      [{ ui_codes: [protectionCode, historyCode] }, true, true],
      [{ ui_codes: [historyCode] }, false, true],
      [{ ui_codes: [protectionCode] }, true, false],
      [{ ui_codes: [] }, false, false],
      [{ allow_all: true }, false, false],
      [{ ui_codes: protectionCode }, false, false],
      [null, false, false],
    ]) {
      let resolve
      const pending = new Promise(done => { resolve = done })
      const screen = page(platform, () => pending)
      assert.equal(screen.context.visible.value, false)
      const loading = screen.context.load()
      assert.equal(screen.context.visible.value, false, 'permission loading must not flash the card')
      assert.doesNotMatch(await renderCard(renders[platform], platform, false, true), /SUMMARY|ROW|protect-card|<div/)
      resolve({ data })
      await loading
      assert.equal(screen.calls(), 1, 'one detail UI permission request')
      assert.equal(screen.context.visible.value, visible)
      if (platform === 'mobile') assert.equal(screen.context.history.value, history)
      const html = await renderCard(renders[platform], platform, visible, true)
      assert.equal(html.includes('SUMMARY'), visible)
      assert.equal(html.includes('ROW'), visible)
      if (visible) {
        assert.match(html, /status.on|protectStatusOn/)
        assert.match(html, /status.off|protectStatusOff/)
        assert.doesNotMatch(await renderCard(renders[platform], platform, true, false), /ROW/)
      }
    }
    const failed = page(platform, () => Promise.reject(new Error('offline')))
    await failed.context.load()
    assert.equal(failed.context.visible.value, false)
    if (platform === 'mobile') assert.equal(failed.context.history.value, false)

    let codes = [protectionCode, historyCode]
    const refreshed = page(platform, () => Promise.resolve({ data: { ui_codes: codes } }))
    await refreshed.context.load()
    assert.equal(refreshed.context.visible.value, true)
    codes = [historyCode]
    const reloading = refreshed.context.load()
    assert.equal(refreshed.context.visible.value, false, 'reload must hide the previous authorized card immediately')
    await reloading
    assert.equal(refreshed.context.visible.value, false, 'removed authorization must take effect on reloading')
    if (platform === 'mobile') assert.equal(refreshed.context.history.value, true)
  }
  let resolve
  const stale = page('mobile', () => new Promise(done => { resolve = done }))
  const loading = stale.context.load()
  stale.unload()
  resolve({ data: { ui_codes: [protectionCode, historyCode] } })
  await loading
  assert.equal(stale.context.visible.value, false, 'late permission response after unloading must be ignored')
  assert.equal(stale.context.history.value, false)
  console.log('protection status permissions: mobile/Web grant, deny, empty, failure, delay, whole-card render and history regression passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
