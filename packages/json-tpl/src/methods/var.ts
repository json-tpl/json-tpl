import { isString } from '../util/string'
import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function varCompiler(context) {
  const nameCompiled = this.compileArgv(context, isString)
  return (scope, execCtx) => {
    const name = nameCompiled(scope, execCtx)
    if (name === undefined) return undefined

    // "reserved" variables
    switch (name) {
      case 'null':
        return null
      case 'undefined':
        return undefined
      case 'true':
        return true
      case 'false':
        return false
    }

    return scope(name)
  }
}
