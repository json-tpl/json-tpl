import type { MethodCompile } from '../dynamic/types.js'

import { asStaticValue } from '../core/types.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.compile(argv)

  if (this.optimizeCompiled && $$argv.static === true) {
    return asStaticValue($$argv.staticValue === undefined)
  }

  return (scope, execCtx) => {
    const value = $$argv(scope, execCtx)
    return value === undefined
  }
}
