import type { BmsRequestTransport, BmsRequestTransport as BmsTransport } from './types'

export class BmsTransportError extends Error {
	extra: unknown

	constructor(message: string, extra?: unknown) {
		super(message);
		this.name = 'BmsTransportError';
		this.extra = extra;
	}
}

export function createRequestTransport(request: BmsRequestTransport): BmsTransport {
	if (typeof request !== 'function') throw new BmsTransportError('request must be a function');
	return { request };
}
