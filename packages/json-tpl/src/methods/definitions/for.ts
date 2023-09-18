import type { Json } from '../../util/json.js'
import type { PlainObject } from '../../util/object.js'

import type { MethodContext, MethodImplementation } from '../definitions.js'

function isValidAlias(name: unknown): name is string | undefined {
  if (name === undefined) return true
  return typeof name === 'string' && name !== ''
}

export const implementation: MethodImplementation = function (): undefined | Json[] {
  const alias = this.arg('as')?.evaluate(isValidAlias)

  const input = this.evaluate()
  switch (typeof input) {
    case 'number': {
      const getValue = (index: number): Json => index + 1
      return buildArray.call(this, input, alias, getValue)
    }
    case 'object':
      if (Array.isArray(input)) {
        const getValue = (index: number): Json => input[index] ?? null
        return buildArray.call(this, input.length, alias, getValue)
      } else if (input !== null) {
        const keys = Object.keys(input).filter(isJsonKey, input)
        const getValue = (index: number): Json => input[keys[index]] as Json
        const getKey = (index: number): string => keys[index]

        return buildArray.call(this, keys.length, alias, getValue, getKey)
      }
    // falls through
    default:
      this.emitError?.(`$for input must be an array, object or number`, input)
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
  length: number,
  alias: undefined | string,
  getValue: (index: number) => Json,
  getKey?: (index: number) => string
): Json[] {
  let index = 0

  const loopBody = this.arg('do', (varName) => {
    if (varName === prefixed(`$value`, alias)) return getValue(index)
    if (varName === prefixed(`$index`, alias)) return index
    if (varName === prefixed(`$position`, alias)) return index + 1
    if (varName === prefixed(`$key`, alias)) return getKey?.(index)
    if (varName === prefixed(`$first`, alias)) return index === 0
    if (varName === prefixed(`$last`, alias)) return index === length - 1

    return this.getVariable(varName)
  })

  const result = Array(length) as Json[]
  if (loopBody) {
    for (index = 0; index < length; index++) {
      const resultItem = loopBody.evaluate()
      result[index] = resultItem === undefined ? null : resultItem
    }
  } else {
    for (index = 0; index < length; index++) {
      this.evaluator.increaseCount()
      result[index] = getValue(index)
    }
  }
  return result
}
