import i18n from '@/lang/index'
import { useWarrantyReminderStore } from '@/store/warranty-reminder'

export async function shouldGuideWarrantyProfileAfterNewBinding(newlyBound: boolean): Promise<boolean> {
	if (!newlyBound) return false

	const profile = await useWarrantyReminderStore().refresh()
	if (!profile?.warranty_profile_reminder_needed) return false

	return new Promise((resolve) => {
		uni.showModal({
			title: i18n.global.t('pages.warranty.reminderDialogTitle') as string,
			content: i18n.global.t('pages.warranty.reminderDialogContent') as string,
			cancelText: i18n.global.t('pages.warranty.reminderLater') as string,
			confirmText: i18n.global.t('pages.warranty.reminderNow') as string,
			confirmColor: '#0B3BFF',
			success: (res: { confirm?: boolean }) => resolve(Boolean(res.confirm)),
			fail: () => resolve(false),
		})
	})
}

export function navigateToWarrantyProfileForCompletion() {
	uni.redirectTo({ url: '/pages/my/warranty/index?edit=1' })
}
