import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (methodCall, scope) {
  const condition = this.evaluateKey(methodCall, '$if', scope)
  return condition
    ? this.evaluateKey(methodCall, '$then', scope)
    : this.evaluateKey(methodCall, '$else', scope)
}
