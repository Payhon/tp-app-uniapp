export class BmsTransportError extends Error {
	constructor(message, extra) {
		super(message);
		this.name = 'BmsTransportError';
		this.extra = extra;
	}
}

// Minimal request/response transport adapter:
// - request(frameBytes, options?) => Promise<Uint8Array>
export function createRequestTransport(request) {
	if (typeof request !== 'function') throw new BmsTransportError('request must be a function');
	return { request };
}

