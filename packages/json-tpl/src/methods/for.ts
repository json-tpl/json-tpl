import { CompiledTemplate } from '../core/types'
import type { MethodCompile } from '../dynamic/types'
import { CompilationContext, ExecutionContext } from '../util/context'
import { ExecutionError } from '../util/error'

import type { Json } from '../util/json'
import type { PlainObject } from '../util/object'
import { Scope } from '../util/scope'

function isValidAlias(name: unknown): name is string | undefined {
  if (name === undefined) return true
  return typeof name === 'string' && name !== ''
}

export const compile: MethodCompile = function getCompiler(context) {
  const doCompiled = this.compileArgs(context, 'do', true)
  const argvCompiled = this.compileArgv(context)
  const aliasCompiled = this.compileArgs(context, 'as', false, isValidAlias)

  return (scope, execCtx) => {
    const alias = aliasCompiled?.(scope, execCtx)
    const input = argvCompiled(scope, execCtx)

    switch (typeof input) {
      case 'number': {
        const getValue = (index: number): Json => index + 1
        return buildArray(context, scope, execCtx, doCompiled, input, alias, getValue)
      }
      case 'object':
        if (Array.isArray(input)) {
          const getValue = (index: number): Json => input[index] ?? null
          return buildArray(context, scope, execCtx, doCompiled, input.length, alias, getValue)
        } else if (input !== null) {
          const keys = Object.keys(input).filter(isJsonKey, input)
          const getValue = (index: number): Json => input[keys[index]] as Json
          const getKey = (index: number): string => keys[index]

          return buildArray(
            context,
            scope,
            execCtx,
            doCompiled,
            keys.length,
            alias,
            getValue,
            getKey
          )
        }
      // falls through
      default:
        execCtx.onError?.(
          new ExecutionError(
            `${context.key} input must be of type array, object or number (got: ${typeof input})`,
            context,
            execCtx
          )
        )
        return undefined
    }
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
  context: CompilationContext,
  scope: Scope,
  execCtx: ExecutionContext,
  doCompiled: CompiledTemplate,
  length: number,
  alias: undefined | string,
  getValue: (index: number) => Json,
  getKey?: (index: number) => string
): Json[] {
  let index = 0

  const childScope: Scope = (varName) => {
    if (varName === prefixed(`$value`, alias)) return getValue(index)
    if (varName === prefixed(`$index`, alias)) return index
    if (varName === prefixed(`$position`, alias)) return index + 1
    if (varName === prefixed(`$key`, alias)) return getKey?.(index)
    if (varName === prefixed(`$first`, alias)) return index === 0
    if (varName === prefixed(`$last`, alias)) return index === length - 1

    return scope(varName)
  }

  const result = Array(length) as Json[]
  for (index = 0; index < length; index++) {
    const resultItem = doCompiled(childScope, execCtx)
    result[index] = resultItem === undefined ? null : resultItem
  }
  return result
}
