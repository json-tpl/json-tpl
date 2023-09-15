import { Program } from '../../util/context.js'
import { ExecutionError } from '../../util/error.js'
import type { Json, JsonObject } from '../../util/json.js'
import type { PlainObject } from '../../util/object.js'
import { Scope } from '../../util/scope.js'

import type { MethodEvaluator, MethodImplementation } from '../definitions.js'

function isValidAlias(name: unknown): name is string | undefined {
  if (name === undefined) return true
  return typeof name === 'string' && name !== ''
}

export const implementation: MethodImplementation = function (argv, args, scope) {
  const alias = this.evaluateArgs(args, 'as', scope, isValidAlias)

  const input = this.evaluateArgv(argv, scope)
  switch (typeof input) {
    case 'number': {
      const getValue = (index: number): Json => index + 1
      return buildArray.call(this, args, scope, input, alias, getValue)
    }
    case 'object':
      if (Array.isArray(input)) {
        const getValue = (index: number): Json => input[index] ?? null
        return buildArray.call(this, args, scope, input.length, alias, getValue)
      } else if (input !== null) {
        const keys = Object.keys(input).filter(isJsonKey, input)
        const getValue = (index: number): Json => input[keys[index]] as Json
        const getKey = (index: number): string => keys[index]

        return buildArray.call(this, args, scope, keys.length, alias, getValue, getKey)
      }
    // falls through
    default:
      this.onError?.(new ExecutionError(`$for input must be an array, object or number`, argv))
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

function buildArray(
  this: MethodEvaluator,
  args: Program<JsonObject>,
  scope: Scope,
  length: number,
  alias: string = '',
  getValue: (index: number) => Json,
  getKey?: (index: number) => string
): Json[] {
  let index = 0

  const childScope: Scope = (varName) => {
    if (varName === `${alias}$value`) return getValue(index)
    if (varName === `${alias}$index`) return index
    if (varName === `${alias}$position`) return index + 1
    if (varName === `${alias}$key`) return getKey?.(index)
    if (varName === `${alias}$first`) return index === 0
    if (varName === `${alias}$last`) return index === length - 1

    return scope(varName)
  }

  const result = Array(length) as Json[]
  for (index = 0; index < length; index++) {
    const resultItem = this.evaluateArgs(args, 'do', childScope, isDefined)
    result[index] = resultItem === undefined ? null : resultItem
  }
  return result
}

// eslint-disable-next-line
function isDefined(value: unknown): value is {} | null {
  return value !== undefined
}
