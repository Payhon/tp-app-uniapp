import {
	createWxMiniappUpdateController,
	type WxMiniappUpdateManager,
} from './wx-miniapp-update-controller'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

type ModalOptions = Parameters<Parameters<typeof createWxMiniappUpdateController>[0]['showModal']>[0]

function createHarness() {
	let checkCallback: ((result: { hasUpdate?: boolean }) => void) | null = null
	let readyCallback: (() => void) | null = null
	let failedCallback: (() => void) | null = null
	let applyCount = 0
	let getManagerCount = 0
	const modals: ModalOptions[] = []

	const manager: WxMiniappUpdateManager = {
		onCheckForUpdate: (callback) => {
			checkCallback = callback
		},
		onUpdateReady: (callback) => {
			readyCallback = callback
		},
		onUpdateFailed: (callback) => {
			failedCallback = callback
		},
		applyUpdate: () => {
			applyCount += 1
		},
	}
	const controller = createWxMiniappUpdateController({
		getUpdateManager: () => {
			getManagerCount += 1
			return manager
		},
		showModal: (options) => modals.push(options),
		translate: (key) => key,
		logger: { info: () => undefined, warn: () => undefined },
	})

	return {
		controller,
		modals,
		getModalCount: () => modals.length,
		getApplyCount: () => applyCount,
		getManagerCount: () => getManagerCount,
		check: (hasUpdate: boolean) => checkCallback?.({ hasUpdate }),
		ready: () => readyCallback?.(),
		failed: () => failedCallback?.(),
	}
}

const foreground = createHarness()
foreground.controller.start()
foreground.controller.start()
assert(foreground.getManagerCount() === 1, 'start should register UpdateManager only once')
foreground.controller.onAppShow()
foreground.check(false)
assert(foreground.getModalCount() === 0, 'no update should not show a modal')
foreground.ready()
assert(foreground.getModalCount() === 1, 'ready update should prompt in foreground')
assert(foreground.modals[0].showCancel === false, 'update prompt must not provide a cancel button')
foreground.ready()
assert(foreground.getModalCount() === 1, 'repeated ready callbacks must not duplicate the prompt')
foreground.modals[0].success?.({ confirm: true })
foreground.modals[0].success?.({ confirm: true })
assert(foreground.getApplyCount() === 1, 'confirmed update should be applied exactly once')

const background = createHarness()
background.controller.start()
background.controller.onAppHide()
background.ready()
assert(background.getModalCount() === 0, 'background update should wait until the app is visible')
background.controller.onAppShow()
assert(background.getModalCount() === 1, 'ready update should prompt on the next app show')

const failed = createHarness()
failed.controller.start()
failed.controller.onAppHide()
failed.failed()
assert(failed.getModalCount() === 0, 'background download failure should not show a modal')
failed.controller.onAppShow()
assert(failed.getModalCount() === 1, 'download failure should be reported on the next app show')
assert(
	failed.modals[0].title === 'common.update.miniProgramFailedTitle',
	'download failure should use the dedicated message'
)
assert(failed.getApplyCount() === 0, 'failed update must never be applied')

const readyThenFailed = createHarness()
readyThenFailed.controller.start()
readyThenFailed.controller.onAppShow()
readyThenFailed.ready()
readyThenFailed.failed()
readyThenFailed.modals[0].success?.({ confirm: true })
assert(readyThenFailed.getApplyCount() === 0, 'a failed download must invalidate an already visible ready prompt')
assert(readyThenFailed.getModalCount() === 2, 'download failure should replace the stale ready state with an error prompt')

console.log('WeChat Mini Program update controller tests passed')
