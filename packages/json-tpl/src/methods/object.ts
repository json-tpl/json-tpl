import type { Result } from '../core/types.js'
import type { MethodCompile } from '../dynamic/types.js'
import type { Json, JsonObject } from '../util/json.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.iterator(argv, isTuple)

  return (scope, execCtx) => {
    const output: JsonObject = {}

    const it = $$argv(scope, execCtx)
    for (let result = it.next(); !result.done; result = it.next()) {
      const item = result.value
      if (item) output[item[0]] = item[1]
    }

    return output
  }
}

function isTuple(v: Result): v is [string | number, Json] {
  return Array.isArray(v) && v.length >= 2 && (typeof v[0] === 'string' || typeof v[0] === 'number')
}
