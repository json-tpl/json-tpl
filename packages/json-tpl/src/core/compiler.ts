import { isContext, type CompilationContext, type ExecutionContext } from '../util/context'
import { isNonNullable, type ErrorHandler } from '../util/function'
import type { Json, JsonObject } from '../util/json'
import type { Scope } from '../util/scope'

import { ExecutionError, ExecutionLimitError, TemplateError } from '../util/error'
import { isArray } from '../util/array'
import { createNoopIterator } from '../util/iterator'

import type { CompiledTemplate, CompiledTemplateIterator, ResultValidator } from './types'

export class CoreCompiler {
  constructor(
    public readonly callPrefix: string,
    public readonly onError?: ErrorHandler,
    protected readonly lazy = !onError,
    protected readonly debug = !onError
  ) {}

  public compile<T extends undefined | Json = undefined | Json>(
    context: CompilationContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T> {
    if (this.lazy) {
      let compiled: undefined | CompiledTemplate<T>
      let compile: undefined | (() => CompiledTemplate<T>) = () =>
        this.compileInternal(context, validator)

      return (scope, options) => {
        if (compile) {
          compiled = compile()
          compile = undefined
        }
        return compiled!(scope, options)
      }
    } else {
      return this.compileInternal(context, validator)
    }
  }

  protected compileInternal<T extends undefined | Json = undefined | Json>(
    context: CompilationContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T> {
    const compiled = this.compileJson(context)
    return this.withRuntimeChecks<T>(context, compiled, validator)
  }

  protected withRuntimeChecks<T extends undefined | Json = undefined | Json>(
    context: CompilationContext,
    compiled: CompiledTemplate = () => undefined,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T> {
    // When debug is not enabled, avoid keeping a reference to the original compilation context
    const contextRef = this.debug ? context : undefined

    return (scope: Scope, execCtx: ExecutionContext): T | undefined => {
      if (execCtx.executionCount++ > execCtx.executionLimit) {
        throw new ExecutionLimitError('Execution limit exceeded', contextRef, execCtx)
      }

      const result = compiled(scope, execCtx)

      if (validator) {
        if (validator(result)) return result

        execCtx.onError?.(
          new ExecutionError(`Result is not valid for "${validator.name}"`, contextRef, execCtx)
        )
        return undefined
      }

      if (result === undefined) {
        execCtx.onError?.(
          new ExecutionError(`Unexpected ${typeof result} result`, contextRef, execCtx)
        )
      }

      return result as T
    }
  }

  protected compileJson(context: CompilationContext): CompiledTemplate {
    const { template } = context
    switch (typeof template) {
      case 'boolean':
        return this.compileBoolean(context as CompilationContext<boolean>)
      case 'number':
        return this.compileNumber(context as CompilationContext<number>)
      case 'string':
        return this.compileString(context as CompilationContext<string>)
      case 'object':
        if (template === null) {
          return () => null
        } else if (Array.isArray(template)) {
          return this.compileArray(context as CompilationContext<Json[]>)
        } else {
          return this.compileObject(context as CompilationContext<JsonObject>)
        }
      default:
        this.onError?.(new TemplateError(`Only JSON values are allowed`, context))
        return () => undefined
    }
  }

  protected compileBoolean(context: CompilationContext<boolean>): CompiledTemplate {
    const { template } = context
    return () => template
  }

  protected compileNumber(context: CompilationContext<number>): CompiledTemplate {
    const { template } = context
    if (!Number.isFinite(template)) {
      this.onError?.(new TemplateError(`Only finite numbers are allowed`, context))
      return () => undefined
    }

    return () => template
  }

  protected compileString(context: CompilationContext<string>): CompiledTemplate {
    const { template } = context
    return () => template
  }

  protected compileArray(context: CompilationContext<Json[]>): CompiledTemplate {
    const compiledItems = context.template.map((template, index) =>
      this.compileInternal({ template, parent: { type: 'array', index, context } })
    )
    return (scope, options): Json[] => compiledItems.map((item) => item(scope, options) ?? null)
  }

  protected compileObject(context: CompilationContext<JsonObject>): CompiledTemplate {
    return this.compilePlainObject(context)
  }

  protected compilePlainObject(
    context: CompilationContext<JsonObject>,
    keys = Object.keys(context.template)
  ): CompiledTemplate {
    const compiledEntries = keys
      .map((key) => {
        const template = context.template[key]
        if (template === undefined) return null

        const value = this.compileInternal({ template, parent: { type: 'object', key, context } })
        return [key, value] as const
      })
      .filter(isNonNullable)

    const { length } = compiledEntries
    if (length === 0) return () => ({})

    return (scope, context): Json | undefined => {
      const result: JsonObject = {}
      let key: string
      let compiledValue: CompiledTemplate
      let value: Json | undefined
      for (let i = 0; i < length; i++) {
        key = compiledEntries[i][0]
        compiledValue = compiledEntries[i][1]
        value = compiledValue(scope, context)
        if (value !== undefined) result[key] = value
      }
      return result
    }
  }

  protected compileIterator<T extends undefined | Json = undefined | Json>(
    context: CompilationContext,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplateIterator<T> {
    if (isContext(context, isArray)) {
      // If the input is an array, we can lazily compute items

      const compiledItems = context.template.map((template, index) =>
        this.compile({ template, parent: { type: 'array', index, context } }, validator)
      )

      return (scope, execCtx) => {
        let index = 0
        const { length } = compiledItems
        return {
          next: () => {
            while (index < length) {
              // Array.map will not call the callback for <empty> values
              const compiledValue = compiledItems[index++] as undefined | CompiledTemplate<T>
              const value = compiledValue?.(scope, execCtx)
              return { done: false, value }
            }
            return { done: true, value: undefined }
          },
        }
      }
    } else {
      const compiled = this.compile(context, isArray)
      return (scope, execCtx) => {
        const result = compiled(scope, execCtx)
        if (!result) return createNoopIterator()

        let index = 0
        const { length } = result
        return {
          next: () => {
            while (index < length) {
              const value = result[index++]

              if (validator) {
                if (validator(value)) {
                  return { done: false, value }
                } else {
                  execCtx.onError?.(
                    new ExecutionError(
                      `Result is not valid for "${validator.name}"`,
                      context,
                      execCtx
                    )
                  )
                  return { done: true, value: undefined }
                }
              }

              return { done: false, value } as IteratorResult<T | undefined>
            }

            return { done: true, value: undefined }
          },
        }
      }
    }
  }
}
