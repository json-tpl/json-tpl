import { asStaticValue } from '../core/types.js'
import type { MethodCompile } from '../dynamic/types.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.compile(argv)

  if (this.optimizeCompiled && $$argv.static === true) {
    return asStaticValue(!$$argv.staticValue)
  }

  return (scope, execCtx) => !$$argv(scope, execCtx)
}
