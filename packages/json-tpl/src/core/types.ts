import type { TemplateContext } from '../util/context.js'
import type { Json } from '../util/json.js'
import type { Scope, Variable } from '../util/scope.js'

import { ExecutionLimitError } from '../util/error.js'
import { ErrorHandler } from '../util/function.js'
import { toJson } from '../util/json.js'

export type Result = undefined | Variable

export type DynamicCompiledTemplate<T extends Result = Json | undefined> = {
  (this: ExecutionContext, scope: Scope): T | undefined
  readonly source?: TemplateContext
  readonly static?: false
}

export type StaticCompiledTemplate<T extends Result = Json | undefined> = {
  (this: ExecutionContext, scope: Scope): T | undefined
  readonly source?: TemplateContext
  readonly static: true
  readonly staticValue: T | undefined
}

export type CompiledTemplateIterator<T extends Result = Json | undefined> = {
  (this: ExecutionContext, scope: Scope): Iterator<T | undefined>
}

export type CompiledTemplate<T extends Result = Json | undefined> =
  | DynamicCompiledTemplate<T>
  | StaticCompiledTemplate<T>

export function isStaticCompiledTemplate<T extends Result>(
  value: CompiledTemplate<T>
): value is StaticCompiledTemplate<T> {
  return value.static === true
}

export class ExecutionContext {
  protected executionCount = 0
  constructor(
    public readonly onError?: ErrorHandler,
    public readonly executionLimit: number = 1e7
  ) {}

  exec<T extends Result = undefined | Json>(
    compiled: CompiledTemplate<T>,
    scope: Scope
  ): T | undefined {
    if (this.executionCount++ > this.executionLimit) {
      throw new ExecutionLimitError('Execution limit exceeded', compiled.source, this)
    }

    return this.exec(compiled, scope)
  }
}

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
