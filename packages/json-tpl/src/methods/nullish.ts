import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function nullishCompiler(context) {
  const compiled = this.compileArgv(context)

  return (scope, execCtx) => {
    const argv = compiled(scope, execCtx)
    return argv != null
  }
}
