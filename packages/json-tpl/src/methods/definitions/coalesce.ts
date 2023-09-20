import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (methodCall, scope) {
  const it = this.iterateKey(methodCall, '$coalesce', scope)

  for (let result = it.next(); !result.done; result = it.next()) {
    if (result.value != null) return result.value
  }

  return null
}
