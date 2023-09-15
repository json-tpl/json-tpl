import type { Json, JsonObject } from '../../util/json'
import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (
  methodCall,
  scope
): undefined | JsonObject {
  const it = this.iterateKey(methodCall, '$object', scope)

  const output: JsonObject = {}

  let index = -1
  let item: Json
  for (let result = it.next(); !result.done; result = it.next()) {
    item = result.value
    index++

    if (!isTuple(item)) {
      this.emitError?.(`$object entries must be [key, value] tupples.`, ['$object', index])
      continue
    }

    const key = item[0]

    if (typeof key !== 'string' && typeof key !== 'number') {
      this.emitError?.(`$object entry key must be of type string or number`, ['$object', index, 0])
      continue
    }

    output[key] = item[1]
  }

  return output
}

function isTuple(v: Json): v is [Json, Json] {
  return Array.isArray(v) && v.length === 2
}
