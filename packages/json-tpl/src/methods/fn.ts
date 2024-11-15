import type { MethodCompile } from '../dynamic/types.js'
import { Scope } from '../util/scope.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.compile(argv)

  return (scope, execCtx) => {
    return (argv, args) => {
      const childScope: Scope = (name) => {
        if (name === '$argv') return argv
        if (name === '$args') return args
        return scope(name)
      }
      return $$argv(childScope, execCtx)
    }
  }
}
