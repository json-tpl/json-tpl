import type { Json, JsonObject } from '../../util/json.js'
import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (): undefined | JsonObject {
  const output: JsonObject = {}

  const it = this.iterator(isTuple)
  for (let result = it.next(); !result.done; result = it.next()) {
    const item = result.value
    if (item === undefined) continue

    const key = item[0]
    if (typeof key === 'string' || typeof key === 'number') {
      output[key] = item[1]
    } else {
      this.emitError?.(`$object entry key must be of type string or number`, key)
    }
  }

  return output
}

function isTuple(v: Json | undefined): v is [Json, Json] {
  return Array.isArray(v) && v.length === 2
}
