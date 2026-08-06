import { applyValidParamValues, hasAnyValidParamValue, shouldUseParamSectionCache } from './param-refresh-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

assert(hasAnyValidParamValue({ A: 0 }, ['A']), 'zero is a valid parameter value')
assert(hasAnyValidParamValue({ A: false }, ['A']), 'false is a valid parameter value')
assert(!hasAnyValidParamValue({ A: null }, ['A']), 'null is not a valid parameter value')
assert(!hasAnyValidParamValue({}, ['A']), 'missing fields are not valid parameter values')

const oldValues: Record<string, unknown> = { A: 12, B: 34 }
assert(!applyValidParamValues(oldValues, {}, ['A', 'B']), 'empty response should be rejected')
assert(Number(oldValues.A) === 12 && Number(oldValues.B) === 34, 'rejected response should preserve old values')
assert(applyValidParamValues(oldValues, { A: 56 }, ['A', 'B']), 'partial response with a valid field should be accepted')
assert(Number(oldValues.A) === 56 && oldValues.B === null, 'accepted response should apply returned values in place')

assert(shouldUseParamSectionCache(true, false), 'loaded section should use cache by default')
assert(!shouldUseParamSectionCache(true, true), 'force refresh should bypass loaded cache')

console.log('parameter refresh policy tests passed')
