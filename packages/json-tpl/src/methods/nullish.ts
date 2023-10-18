import type { MethodCompile } from '../dynamic/types.js'

import { asStaticValue } from '../core/types.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.compile(argv)

  if (this.optimizeCompiled && $$argv.static === true) {
    return asStaticValue($$argv.staticValue == null)
  }

  return (scope, execCtx) => {
    const argv = $$argv(scope, execCtx)
    return argv == null
  }
}
