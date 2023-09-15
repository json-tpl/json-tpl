import type { Scope } from '../../util/scope'
import type { Json } from '../../util/json'
import type { PlainObject } from '../../util/object'

import type { MethodCall, MethodContext, MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (
  methodCall,
  scope
): undefined | Json[] {
  const as = this.evaluateKey(methodCall, '$as', scope)
  const alias = typeof as === 'string' && as ? as : undefined
  if (as !== undefined && alias === undefined) {
    this.emitError?.(`$as must be a non-empty string`, ['$as'])
    return undefined
  }

  const input = this.evaluateKey(methodCall, '$for', scope)
  switch (typeof input) {
    case 'number':
      return buildArray.call(this, methodCall, scope, input, alias, (index) => index + 1)
    case 'object':
      if (Array.isArray(input)) {
        return buildArray.call(
          this,
          methodCall,
          scope,
          input.length,
          alias,
          (index) => input[index]
        )
      } else if (input !== null) {
        const keys = Object.keys(input).filter(isJsonKey, input)
        return buildArray.call(
          this,
          methodCall,
          scope,
          keys.length,
          alias,
          (index) => input[keys[index]] as Json,
          (index) => keys[index]
        )
      }
    // falls through
    default:
      this.emitError?.(`$for input must be an array, object or number`, ['$for'])
      return undefined
  }
}

function isJsonKey<T extends PlainObject>(this: T, key: string): key is Extract<keyof T, string> {
  const value = this[key]
  switch (typeof value) {
    case 'boolean':
    case 'object':
    case 'string':
    case 'number':
      return true
    default:
      return false
  }
}

const prefixed = (name: string, prefix?: string) => (prefix ? prefix + name : name)

function buildArray(
  this: MethodContext,
  methodCall: MethodCall,
  scope: Scope,
  length: number,
  alias: undefined | string,
  getValue: (index: number) => Json,
  getKey?: (index: number) => string
): Json[] {
  let index = 0

  const childScope: Scope = (name) => {
    if (name === prefixed(`$value`, alias)) return getValue(index)
    if (name === prefixed(`$index`, alias)) return index
    if (name === prefixed(`$position`, alias)) return index + 1
    if (name === prefixed(`$key`, alias)) return getKey?.(index)
    if (name === prefixed(`$first`, alias)) return index === 0
    if (name === prefixed(`$last`, alias)) return index === length - 1
    return scope(name)
  }

  const result = Array(length) as Json[]
  for (index = 0; index < length; index++) {
    const resultItem = this.evaluateKey(methodCall, '$do', childScope)
    result[index] = resultItem === undefined ? null : resultItem
  }
  return result
}
