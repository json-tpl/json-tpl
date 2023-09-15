import type { ExecutionContext, TemplateContext } from '../util/context.js'
import type { ErrorHandler } from '../util/function.js'
import { isJsonSerializable, type Json, type JsonObject } from '../util/json.js'
import type { Scope } from '../util/scope.js'

import { isArray } from '../util/array.js'
import { ExecutionError, ExecutionLimitError, TemplateError } from '../util/error.js'
import { isNonNullable, isNotFunction } from '../util/function.js'

import type { CompiledTemplate, Result, ResultValidator, StaticCompiledTemplate } from './types.js'

import { asStaticValue, isStaticCompiledTemplate } from './types.js'

export class CoreCompiler {
  constructor(
    public readonly onError?: ErrorHandler,
    protected readonly debug = onError != null,
    public readonly optimizeCompiled = debug || !onError,
    protected readonly lazyCompilation = !debug && !onError && !optimizeCompiled
  ) {}

  public compile<T extends Result = undefined | Json>(
    context: TemplateContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T> {
    if (this.lazyCompilation && !this.optimizeCompiled) {
      let compiled: undefined | CompiledTemplate<T>
      let compile: undefined | (() => CompiledTemplate<T>) = () =>
        this.compileInternal(context, validator)

      return (scope, execCtx) => {
        if (compile) {
          compiled = compile()
          compile = undefined
        }
        return compiled!(scope, execCtx)
      }
    } else {
      return this.compileInternal<T>(context, validator)
    }
  }

  protected compileInternal<T extends Result = undefined | Json>(
    context: TemplateContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T> {
    const compiled = this.compileJson(context)
    return this.withChecks<T>(context, compiled, validator)
  }

  protected withChecks<T extends Result = undefined | Json>(
    context: TemplateContext,
    compiled: CompiledTemplate<Result>,
    validator: ResultValidator<T> = isNotFunction as ResultValidator<T>
  ): CompiledTemplate<T> {
    if (this.optimizeCompiled && compiled.static) {
      const { staticValue } = compiled

      const value = validator(staticValue) ? staticValue : undefined
      return asStaticValue(value)
    }

    // When debug is not enabled, avoid keeping a reference to the original template input
    const contextRef = this.debug ? context : undefined

    return (scope: Scope, execCtx: ExecutionContext): T | undefined => {
      if (execCtx.executionCount++ > execCtx.executionLimit) {
        throw new ExecutionLimitError('Execution limit exceeded', contextRef, execCtx)
      }

      const result = compiled(scope, execCtx)

      if (!validator(result)) {
        execCtx.onError?.(
          new ExecutionError(`Result is not valid for "${validator.name}"`, contextRef, execCtx)
        )

        return undefined
      }

      return result
    }
  }

  protected compileJson(context: TemplateContext): CompiledTemplate<Result> {
    const { json } = context
    switch (typeof json) {
      case 'boolean':
        return this.compileBoolean(context as TemplateContext<boolean>)
      case 'number':
        return this.compileNumber(context as TemplateContext<number>)
      case 'string':
        return this.compileString(context as TemplateContext<string>)
      case 'object':
        if (json === null) {
          return this.compileNull(context as TemplateContext<null>)
        } else if (isArray(json)) {
          return this.compileArray(context as TemplateContext<Json[]>)
        } else {
          if (isJsonSerializable(json)) return asStaticValue(json)
          return this.compileObject(context as TemplateContext<JsonObject>)
        }
      default:
        this.onError?.(new TemplateError(`Only JSON values are allowed`, context))
        return asStaticValue(undefined)
    }
  }

  protected compileNull(context: TemplateContext<null>): CompiledTemplate<null> {
    return asStaticValue(null)
  }

  protected compileBoolean(context: TemplateContext<boolean>): CompiledTemplate<boolean> {
    return asStaticValue(context.json)
  }

  protected compileNumber(context: TemplateContext<number>): CompiledTemplate<number> {
    const { json: template } = context

    if (!Number.isFinite(template)) {
      this.onError?.(new TemplateError(`Only finite numbers are allowed`, context))
      return asStaticValue(undefined)
    }

    return asStaticValue(context.json)
  }

  protected compileString(context: TemplateContext<string>): CompiledTemplate<Result> {
    return asStaticValue(context.json)
  }

  protected compileArray(context: TemplateContext<Json[]>): CompiledTemplate<Result> {
    const compiledItems = Array(context.json.length) as CompiledTemplate[]

    const templateArray = context.json
    for (let i = 0; i < templateArray.length; i++) {
      compiledItems[i] = this.compileInternal({
        json: templateArray[i] ?? null,
        location: { type: 'array', index: i, context },
      })
    }

    if (this.optimizeCompiled && compiledItems.every(isStaticCompiledTemplate)) {
      const staticValue = compiledItems.map((item) => item.staticValue ?? null)
      return asStaticValue(staticValue)
    }

    const { length } = compiledItems
    return (scope, options): Json[] => {
      const result = Array(length) as Json[]
      for (let i = 0; i < length; i++) {
        const compiledItem = compiledItems[i]
        const value = compiledItem(scope, options)
        result[i] = value === undefined ? null : value
      }
      return result
    }
  }

  protected compileObject(context: TemplateContext<JsonObject>): CompiledTemplate<Result> {
    return this.compilePlainObject(context)
  }

  protected compilePlainObject(
    context: TemplateContext<JsonObject>,
    keys = Object.keys(context.json)
  ): CompiledTemplate<JsonObject> {
    const compiledEntries = keys
      .map((key) => {
        const template = context.json[key]
        if (template === undefined) return null

        const value = this.compileInternal({
          json: template,
          location: { type: 'object', key, context },
        })
        return [key, value] as const
      })
      .filter(isNonNullable)

    if (this.optimizeCompiled && compiledEntries.every(isStaticCompiledTemplateEntry)) {
      const object: JsonObject = {}
      for (const [key, { staticValue }] of compiledEntries) {
        if (staticValue !== undefined) object[key] = staticValue
      }
      return asStaticValue(object)
    }

    const { length } = compiledEntries
    return (scope, execCtx): JsonObject => {
      const result: JsonObject = {}

      for (let i = 0; i < length; i++) {
        const entry = compiledEntries[i]
        const compiledValue = entry[1]
        const value = compiledValue(scope, execCtx)
        if (value !== undefined) {
          const key = entry[0]
          result[key] = value
        }
      }

      return result
    }
  }
}

function isStaticCompiledTemplateEntry<T extends Json | undefined>(
  entry: readonly [string, CompiledTemplate<T>]
): entry is readonly [string, StaticCompiledTemplate<T>] {
  return isStaticCompiledTemplate(entry[1])
}
