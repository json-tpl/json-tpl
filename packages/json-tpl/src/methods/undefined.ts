import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function undefinedCompiler(context) {
  const compiled = this.compileArgv(context)

  return (scope, execCtx) => {
    const value = compiled(scope, execCtx)
    return value === undefined
  }
}
