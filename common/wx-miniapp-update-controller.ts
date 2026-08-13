export type WxMiniappUpdateManager = {
	onCheckForUpdate: (callback: (result: { hasUpdate?: boolean }) => void) => void
	onUpdateReady: (callback: () => void) => void
	onUpdateFailed: (callback: () => void) => void
	applyUpdate: () => void
}

type UpdateModalOptions = {
	title: string
	content: string
	showCancel: false
	confirmText: string
	success?: (result: { confirm?: boolean; cancel?: boolean }) => void
	fail?: (error: unknown) => void
}

export type WxMiniappUpdateController = {
	start: () => void
	onAppShow: () => void
	onAppHide: () => void
}

type CreateWxMiniappUpdateControllerOptions = {
	getUpdateManager: () => WxMiniappUpdateManager | null
	showModal: (options: UpdateModalOptions) => void
	translate: (key: string) => string
	logger?: Pick<Console, 'info' | 'warn'>
}

export function createWxMiniappUpdateController({
	getUpdateManager,
	showModal,
	translate,
	logger = console,
}: CreateWxMiniappUpdateControllerOptions): WxMiniappUpdateController {
	let manager: WxMiniappUpdateManager | null = null
	let started = false
	let appVisible = false
	let updateReady = false
	let updateFailed = false
	let promptVisible = false
	let failurePromptVisible = false
	let applying = false

	const showUpdatePromptIfNeeded = () => {
		if (!appVisible || !manager || !updateReady || promptVisible || applying) return
		promptVisible = true
		showModal({
			title: translate('common.update.newVersionTitle'),
			content: translate('common.update.miniProgramReady'),
			showCancel: false,
			confirmText: translate('common.confirm'),
			success: (result) => {
				promptVisible = false
				if (!result.confirm || !manager || applying || !updateReady) {
					showFailurePromptIfNeeded()
					return
				}
				applying = true
				manager.applyUpdate()
			},
			fail: (error) => {
				promptVisible = false
				logger.warn('[wx-miniapp-update] failed to show update prompt', error)
			},
		})
	}

	const showFailurePromptIfNeeded = () => {
		if (!appVisible || !updateFailed || failurePromptVisible || promptVisible || applying) return
		failurePromptVisible = true
		showModal({
			title: translate('common.update.miniProgramFailedTitle'),
			content: translate('common.update.miniProgramFailedContent'),
			showCancel: false,
			confirmText: translate('common.confirm'),
			success: () => {
				failurePromptVisible = false
				updateFailed = false
			},
			fail: (error) => {
				failurePromptVisible = false
				logger.warn('[wx-miniapp-update] failed to show download failure prompt', error)
			},
		})
	}

	const start = () => {
		if (started) return
		started = true
		try {
			manager = getUpdateManager()
		} catch (error) {
			logger.warn('[wx-miniapp-update] getUpdateManager failed', error)
			return
		}
		if (!manager) return

		manager.onCheckForUpdate((result) => {
			logger.info('[wx-miniapp-update] update check completed', {
				hasUpdate: Boolean(result?.hasUpdate),
			})
		})
		manager.onUpdateReady(() => {
			updateReady = true
			updateFailed = false
			showUpdatePromptIfNeeded()
		})
		manager.onUpdateFailed(() => {
			updateReady = false
			updateFailed = true
			logger.warn('[wx-miniapp-update] new version download failed')
			showFailurePromptIfNeeded()
		})
	}

	return {
		start,
		onAppShow: () => {
			appVisible = true
			showUpdatePromptIfNeeded()
			showFailurePromptIfNeeded()
		},
		onAppHide: () => {
			appVisible = false
		},
	}
}
