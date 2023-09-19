import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function coaloesceCompiler(context) {
  const argv = this.compileArgvIterator(context)

  return (scope, execCtx) => {
    const it = argv(scope, execCtx)

    for (let result = it.next(); !result.done; result = it.next()) {
      if (result.value != null) return result.value
    }

    return null
  }
}
