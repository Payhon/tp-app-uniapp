export function formatUniError(err: unknown): string {
	if (!err) return ''
	if (typeof err === 'string') return err
	if (err instanceof Error) {
		const anyErr = err as any
		const code = anyErr?.errCode ?? anyErr?.code
		const errMsg = anyErr?.errMsg
		const msg = err.message || String(err)
		const extras: string[] = []
		if (code != null) extras.push(`code=${code}`)
		if (errMsg && errMsg !== msg) extras.push(String(errMsg))
		return extras.length ? `${msg} (${extras.join(', ')})` : msg
	}
	const anyErr = err as any
	const code = anyErr?.errCode ?? anyErr?.code
	const errMsg = anyErr?.errMsg ?? anyErr?.message
	if (errMsg || code != null) {
		return `${errMsg ? String(errMsg) : ''}${code != null ? ` (code=${code})` : ''}`.trim()
	}
	try {
		return JSON.stringify(err)
	} catch (e) {
		return String(err)
	}
}

