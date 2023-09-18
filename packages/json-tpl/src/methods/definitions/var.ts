import { isString } from '../../util/string.js'
import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function () {
  const name = this.evaluate(isString)
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

  return this.getVariable(name)
}
