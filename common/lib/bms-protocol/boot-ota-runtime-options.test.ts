import { getMqttBmsBootOtaRuntimeOptions } from './boot-ota-runtime-options'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

const options = getMqttBmsBootOtaRuntimeOptions()

assert(options.bootPacketTimeoutMs === 3000, '4G BMS OTA packet ACK timeout must be 3000ms')
assert(options.enterBootTimeoutMs === 20000, 'enter boot timeout should remain unchanged')
assert(options.prepareTimeoutMs === 20000, 'prepare timeout should remain unchanged')
assert(options.finalizeTimeoutMs === 20000, 'finalize timeout should remain unchanged')
