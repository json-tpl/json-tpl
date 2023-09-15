import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (methodCall, scope) {
  const name = this.evaluateKey(methodCall, '$var', scope)

  if (typeof name !== 'string') {
    this.emitError?.(`Variable name must be a string (got: ${String(name)})`, ['$var'])
    return undefined
  }

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
