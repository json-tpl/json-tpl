import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (argv, args, scope) {
  const it = this.iteratorArgv(argv, scope)

  for (let result = it.next(); !result.done; result = it.next()) {
    if (result.value != null) return result.value
  }

  return null
}
