import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (argv, args, scope) {
  const condition = this.evaluateArgv(argv, scope)
  return condition ? this.evaluateArgs(args, 'then', scope) : this.evaluateArgs(args, 'else', scope)
}
