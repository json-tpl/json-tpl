import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function ifCompiler(context) {
  const ifCompiled = this.compileArgv(context)
  const thenCompiled = this.compileArgs(context, 'then')
  const elseCompiled = this.compileArgs(context, 'else')

  return (scope, execCtx) =>
    ifCompiled(scope, execCtx) ? thenCompiled?.(scope, execCtx) : elseCompiled?.(scope, execCtx)
}
