import type { Json, JsonObject } from '../../util/json.js'
import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (argv, args, scope) {
  const output: JsonObject = {}

  const it = this.iteratorArgv(argv, scope, isTuple)
  for (let result = it.next(); !result.done; result = it.next()) {
    const item = result.value
    if (item) output[item[0]] = item[1]
  }

  return output
}

function isTuple(v: Json | undefined): v is [string | number, Json] {
  return Array.isArray(v) && v.length >= 2 && (typeof v[0] === 'string' || typeof v[0] === 'number')
}
