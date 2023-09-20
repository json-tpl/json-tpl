import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (methodCall, scope): boolean {
  const value = this.evaluateKey(methodCall, '$not', scope)
  return !value
}
