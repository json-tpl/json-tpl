import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function definedCompiler(context) {
  const compiled = this.compileArgv(context)

  return (scope, execCtx) => {
    const value = compiled(scope, execCtx)
    return value !== undefined
  }
}
