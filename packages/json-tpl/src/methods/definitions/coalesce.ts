import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function () {
  const it = this.iterator()

  for (let result = it.next(); !result.done; result = it.next()) {
    if (result.value != null) return result.value
  }

  return null
}
