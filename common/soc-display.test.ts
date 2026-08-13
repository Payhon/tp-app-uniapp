import { toSocDisplayInteger } from './soc-display'

const assertEqual = (actual: number, expected: number, message: string) => {
	if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`)
}

assertEqual(toSocDisplayInteger(77.5), 77, 'half-percent SOC must be truncated')
assertEqual(toSocDisplayInteger(99.9), 99, 'fractional SOC must not be rounded up')
assertEqual(toSocDisplayInteger(80), 80, 'integer SOC must remain unchanged')
assertEqual(toSocDisplayInteger(-0.5), 0, 'SOC must be clamped to the lower bound')
assertEqual(toSocDisplayInteger(100.5), 100, 'SOC must be clamped to the upper bound')
assertEqual(toSocDisplayInteger(Number.NaN), 0, 'invalid SOC must fall back to zero')
