export function extractApiErrorMessage(response: unknown, fallback = ''): string {
	const dataMessage = String((response as any)?.data?.message || '').trim()
	const dataError = String((response as any)?.data?.error || '').trim()
	const message = String((response as any)?.message || '').trim()
	const sqlError = String((response as any)?.data?.sql_error || '').trim()
	const text = dataMessage || dataError || message || fallback
	return sqlError && text ? `${text} (${sqlError})` : text
}
