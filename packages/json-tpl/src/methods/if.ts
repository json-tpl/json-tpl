import { asStaticValue } from '../core/types.js'
import type { MethodCompile } from '../dynamic/types.js'

export const compile: MethodCompile = function ifCompiler(argv, args) {
  const ifCompiled = this.compile(argv)
  const thenCompiled = this.compileArg(args, 'then')
  const elseCompiled = this.compileArg(args, 'else')

  if (this.optimizeCompiled && ifCompiled.static === true) {
    const compiled = ifCompiled.staticValue ? thenCompiled : elseCompiled
    return compiled || asStaticValue(undefined)
  }

  return (scope, execCtx) =>
    ifCompiled(scope, execCtx) ? thenCompiled?.(scope, execCtx) : elseCompiled?.(scope, execCtx)
}
