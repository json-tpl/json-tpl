import { CompiledTemplate, Result } from '../core/types.js'
import type { MethodCompile } from '../dynamic/types.js'
import { isArray } from '../util/array.js'
import { ExecutionContext } from '../util/context.js'
import { ExecutionError } from '../util/error.js'
import { isDefined } from '../util/function.js'

import type { Json, JsonObject } from '../util/json.js'
import { Scope } from '../util/scope.js'

function isValidAlias(name: unknown): name is string | undefined {
  if (name === undefined) return true
  return typeof name === 'string' && name !== ''
}

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.compile(argv)
  const $$do = this.compileArg(args, 'do', true, isDefined)
  const $$alias = this.compileArg(args, 'as', false, isValidAlias)

  return (scope, execCtx) => {
    const alias = $$alias?.(scope, execCtx)
    const input = $$argv(scope, execCtx)

    switch (typeof input) {
      case 'number': {
        const getValue = (index: number): Json => index + 1
        return buildArray($$do, scope, execCtx, input, alias, getValue)
      }
      case 'object':
        if (isArray(input)) {
          const getValue = (index: number): Json => input[index] ?? null
          return buildArray($$do, scope, execCtx, input.length, alias, getValue)
        } else if (input !== null) {
          const keys = Object.keys(input).filter(isJsonKey, input)
          const getValue = (index: number): Json => input[keys[index]] as Json
          const getKey = (index: number): string => keys[index]

          return buildArray($$do, scope, execCtx, keys.length, alias, getValue, getKey)
        }
      // falls through
      default:
        execCtx.onError?.(
          new ExecutionError(
            `method argument must be of type array, object or number (got: ${typeof input})`,
            argv,
            execCtx
          )
        )
        return undefined
    }
  }
}

function isJsonKey<T extends JsonObject>(this: T, key: string): key is Extract<keyof T, string> {
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
  $$do: CompiledTemplate<Result>,
  scope: Scope,
  execCtx: ExecutionContext,
  length: number,
  alias: string = '',
  getValue: (index: number) => Json,
  getKey?: (index: number) => string
): Json[] {
  let index = 0

  const stripAlias = alias
    ? (n: string) => (n.startsWith(alias) ? n.slice(alias.length) : undefined)
    : (n: string) => n

  const childScope: Scope = (varName) => {
    const name = stripAlias(varName)
    if (name) {
      if (name === '$value') return getValue(index)
      if (name === '$index') return index
      if (name === '$position') return index + 1
      if (name === '$key') return getKey?.(index)
      if (name === '$first') return index === 0
      if (name === '$last') return index === length - 1
    }

    return scope(varName)
  }

  const result = Array(length) as Json[]
  for (index = 0; index < length; index++) {
    const itemResult = $$do(childScope, execCtx)
    const item =
      typeof itemResult === 'function'
        ? // TODO (?) expose other "$<var>" in $args ?
          itemResult(getValue(index), {})
        : itemResult
    result[index] = item === undefined ? null : item
  }
  return result
}
