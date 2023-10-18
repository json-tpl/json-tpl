import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (argv, args, scope) {
  const value = this.evaluateArgv(argv, scope)
  return value != null
}
