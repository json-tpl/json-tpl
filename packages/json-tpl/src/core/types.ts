import type { ExecutionContext } from '../util/context.js'
import type { Json } from '../util/json.js'
import type { Scope, Variable } from '../util/scope.js'

import { toJson } from '../util/json.js'

export type Result = undefined | Variable

export type DynamicCompiledTemplate<T extends Result = Json | undefined> = {
  (scope: Scope, context: ExecutionContext): T | undefined
  readonly static?: false
}

export type StaticCompiledTemplate<T extends Result = Json | undefined> = {
  (scope: Scope, context: ExecutionContext): T | undefined
  readonly static: true
  readonly staticValue: T | undefined
}

export type CompiledTemplate<T extends Result = Json | undefined> =
  | DynamicCompiledTemplate<T>
  | StaticCompiledTemplate<T>

export function isStaticCompiledTemplate<T extends Result>(
  value: CompiledTemplate<T>
): value is StaticCompiledTemplate<T> {
  return value.static === true
}

export type CompiledTemplateIterator<T extends Result = Json | undefined> = (
  scope: Scope,
  context: ExecutionContext
) => Iterator<T | undefined>

export type ResultValidator<T extends Result> = (value: Result) => value is T

export function asStaticGetter<T extends Result>(
  get: () => T | undefined
): StaticCompiledTemplate<T> {
  return Object.defineProperties(get, {
    static: { value: true },
    staticValue: { get },
  }) as unknown as StaticCompiledTemplate<T>
}

export function asStaticValue<T extends Result>(value: T | undefined): StaticCompiledTemplate<T> {
  switch (typeof value) {
    case 'object':
      if (value !== null) {
        return asStaticGetter(() => toJson(value) as T)
      }
    // falls through (null)
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
    case 'function':
      return Object.defineProperties(() => value, {
        static: { value: true },
        staticValue: { value },
      }) as unknown as StaticCompiledTemplate<T>
    default:
      throw new TypeError(`Invalid static value: ${typeof value}`)
  }
}
