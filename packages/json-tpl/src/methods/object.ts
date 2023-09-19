import type { MethodCompile } from '../dynamic/types'
import type { Json, JsonObject } from '../util/json'

export const compile: MethodCompile = function objectCompiler(context) {
  const argvCompiled = this.compileArgvIterator(context, isTuple)

  return (scope, execCtx) => {
    const output: JsonObject = {}

    const it = argvCompiled(scope, execCtx)
    for (let result = it.next(); !result.done; result = it.next()) {
      const item = result.value
      if (item) output[item[0]] = item[1]
    }

    return output
  }
}

function isTuple(v: Json | undefined): v is [string | number, Json] {
  return Array.isArray(v) && v.length >= 2 && (typeof v[0] === 'string' || typeof v[0] === 'number')
}
