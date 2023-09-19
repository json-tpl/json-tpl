import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function notCompiler(context) {
  const argvCompiled = this.compileArgv(context)
  return (scope, execCtx) => {
    const value = argvCompiled(scope, execCtx)
    return !value
  }
}
