import type {
  CompiledTemplate,
  CompiledTemplateIterator,
  Result,
  ResultValidator,
} from '../core/types.js'
import type { TemplateContext } from '../util/context.js'
import type { ErrorHandler } from '../util/function.js'
import type { Json, JsonObject } from '../util/json.js'

import { CoreCompiler } from '../core/compiler.js'
import { asStaticValue } from '../core/types.js'
import { getPath } from '../methods/get.js'
import { parse } from '../parser/parser.js'
import { isArray } from '../util/array.js'
import { isContext } from '../util/context.js'
import { ExecutionError, TemplateError } from '../util/error.js'
import { isDefined } from '../util/function.js'
import { createNoopIterator } from '../util/iterator.js'
import { isPathFragment } from '../util/path.js'

import type { MethodCompiler, MethodDefinition } from './types.js'

const PREFIX_REGEXP = /^[$a-zA-Z0-9_@^%:;.,?!&]+$/

export class DynamicCompiler extends CoreCompiler implements MethodCompiler {
  constructor(
    protected readonly methods: ReadonlyMap<string, MethodDefinition>,
    protected readonly argvPrefix: string,
    protected readonly argsPrefix: string,
    onError?: ErrorHandler,
    debug?: boolean,
    optimizeCompiled?: boolean,
    lazyCompilation?: boolean
  ) {
    if (argvPrefix === '') {
      throw new TypeError('argvPrefix is required')
    }
    if (!PREFIX_REGEXP.test(argvPrefix)) {
      throw new TypeError(`${argvPrefix} is not a valid argvPrefix`)
    }

    super(onError, debug, optimizeCompiled, lazyCompilation)
  }

  protected compileString(context: TemplateContext<string>): CompiledTemplate<Result> {
    const { json } = context

    if (!json) return asStaticValue(json)
    if (!json.includes('${')) return asStaticValue(json)

    // TODO: use a cache to avoid parsing the same expressions (typically varaible access)
    try {
      return parse<CompiledTemplate<Result>>(json, {
        compileVariable,
        compileValue,
        compileObjectGet,
        compileNegation,
        compileConcatenation,
        compileMethodCall: compileMethodCall.bind(this),
      })
    } catch (e) {
      this.onError?.(new TemplateError(`Invalid template`, context))
      return asStaticValue(undefined)
    }
  }

  protected compileObject(context: TemplateContext<JsonObject>): CompiledTemplate<Result> {
    const keys = Object.keys(context.json)
    const callKeys = keys.filter(startsWithThis, this.argvPrefix)
    if (callKeys.length > 1) {
      // argsPrefix === argvPrefix is slower, hence the warning in the constructor
      if (this.argsPrefix === this.argvPrefix) {
        for (let i = 0; i < callKeys.length; i++) {
          const key = callKeys[i]
          if (this.methods.has(key.slice(this.argvPrefix.length))) {
            return this.compileCall(key, context)
          }
        }
      }

      this.onError?.(
        new TemplateError(`No more than one key can start with "${this.argvPrefix}"`, context)
      )
      return asStaticValue(undefined)
    } else if (callKeys.length === 1) {
      return this.compileCall(callKeys[0], context)
    }

    return this.compilePlainObject(context, keys)
  }

  protected compileCall(
    key: string,
    context: TemplateContext<JsonObject>
  ): CompiledTemplate<Result> {
    const name = key.slice(this.argvPrefix.length)

    const argvContext: TemplateContext = {
      json: context.json[key]!,
      location: { type: 'object', key, context: context },
    }

    // Official method
    const definition = this.methods.get(name)
    if (definition) return definition.compile.call(this, argvContext, context)

    const $$argv = this.compile(argvContext, isDefined)
    const $$args = Object.entries(context.json)
      .filter((e) => e[0] !== key && e[0].startsWith(this.argsPrefix) && e[1] !== undefined)
      .map(
        (e) =>
          [
            e[0].slice(this.argsPrefix.length),
            this.compile({
              json: e[1]!,
              location: { type: 'object', key: e[0], context: context },
            }),
          ] as const
      )

    return (scope, execCtx) => {
      const value = scope(name)

      if (typeof value !== 'function') {
        execCtx.onError?.(new TemplateError(`Method not found ${key}`, context))
        return undefined
      }

      const argv = $$argv(scope, execCtx)
      if (argv === undefined) {
        execCtx.onError?.(new TemplateError(`Invalid argument for ${key}`, argvContext))
        return undefined
      }

      const args = Object.create(null) as JsonObject
      for (let i = 0; i < $$args.length; i++) {
        const [key, compiled] = $$args[i]
        Object.defineProperty(args, key, {
          // Lazy (+once) acessor
          enumerable: true,
          configurable: true,
          get: () => (args[key] = compiled(scope, execCtx)),
          set: (v: Json | undefined) =>
            Object.defineProperty(args, key, { value: v, writable: false }),
        })
      }

      return value(argv, args)
    }
  }

  // MethodCompiler methods

  compileArg<T extends Result = undefined | Json>(
    context: TemplateContext<JsonObject>,
    name: string,
    required: true,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T>
  compileArg<T extends Result = undefined | Json>(
    context: TemplateContext<JsonObject>,
    name: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplate<T>
  public compileArg<T extends Result = undefined | Json>(
    context: TemplateContext<JsonObject>,
    name: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplate<T> {
    const key = `${this.argsPrefix}${name}`
    const childContext = getKeyContext(context, key)
    if (childContext) return this.compile(childContext, validator)

    if (required) {
      this.onError?.(new TemplateError(`Missing argument "${key}"`, context))
      return this.withChecks(context, asStaticValue(undefined), validator)
    }

    return undefined
  }

  iteratorArg<T extends Result = undefined | Json>(
    context: TemplateContext<JsonObject>,
    name: string,
    required: true,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T>
  iteratorArg<T extends Result = undefined | Json>(
    context: TemplateContext<JsonObject>,
    name: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplateIterator<T>
  public iteratorArg<T extends Result = undefined | Json>(
    context: TemplateContext<JsonObject>,
    name: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplateIterator<T> {
    const key = `${this.argsPrefix}${name}`
    const childContext = getKeyContext(context, key)
    if (childContext) return this.iterator(childContext, validator)

    if (required) {
      this.onError?.(new TemplateError(`Missing argument "${key}"`, context))
      return createNoopIterator
    }

    return undefined
  }

  public iterator<T extends Result = undefined | Json>(
    context: TemplateContext,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T> {
    if (isContext(context, isArray)) {
      // If the input is an array, we can lazily compute items

      const compiledItems = context.json.map((template, index) =>
        // Will use lazy compilation if enabled
        this.compile(
          { json: template, location: { type: 'array', index, context: context } },
          validator
        )
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

function getKeyContext(
  context: TemplateContext<JsonObject>,
  key: string
): TemplateContext | undefined {
  const template = context.json[key]
  if (template === undefined) return undefined
  return { json: template, location: { type: 'object', key, context: context } }
}

function startsWithThis(this: string, key: string): boolean {
  return key.startsWith(this)
}

function compileVariable(identifier: string): CompiledTemplate<Result> {
  return (scope, execCtx) => scope(identifier)
}

function compileValue(value: string | number | boolean | null): CompiledTemplate<Result> {
  return asStaticValue(value)
}

function compileObjectGet(
  $$argv: CompiledTemplate<Result>,
  $$path: CompiledTemplate<Result>[]
): CompiledTemplate<Result> {
  // TODO: optimize (e.g. if $$argv & $$path are static, return a static value)

  return (scope, execCtx) => {
    const objectValue = $$argv(scope, execCtx)
    if (objectValue === undefined) return undefined
    if (typeof objectValue === 'function') return undefined

    let index = 0

    return getPath(objectValue, {
      next: () => {
        while (index < $$path.length) {
          const fn = $$path[index++]
          const value = fn(scope, execCtx)

          if (isPathFragment(value)) {
            return { done: false, value }
          } else {
            execCtx.onError?.(
              new Error(`Cannot use ${typeof value} as path fragment at index ${index}`)
            )
            return { done: false, value: undefined }
          }
        }
        return { done: true, value: undefined }
      },
    })
  }
}

function compileNegation($$argv: CompiledTemplate<Result>): CompiledTemplate<Result> {
  return (scope, execCtx) => {
    const result = $$argv(scope, execCtx)
    return !result
  }
}

function compileConcatenation($$argv: CompiledTemplate<Result>[]): CompiledTemplate<Result> {
  const { length } = $$argv
  return (scope, execCtx) => {
    const parts: string[] = []
    for (let i = 0; i < length; i++) {
      const $$fragment = $$argv[i]
      const result = $$fragment(scope, execCtx)
      switch (typeof result) {
        case 'string':
          parts.push(result)
          break
        case 'number':
        case 'boolean':
          parts.push(String(result))
          break
        default:
          execCtx.onError?.(new Error(`Cannot concat type ${typeof result} at index ${i}`))
          break
      }
    }
    return parts.join('')
  }
}

function compileMethodCall(
  this: DynamicCompiler,
  name: string,
  $$argv: CompiledTemplate<Result>,
  $$args: Record<string, CompiledTemplate<Result>>
): CompiledTemplate<Result> {
  const definition = this.methods.get(name)
  if (definition) {
    // return definition.compile.call(this, $$argv, $$args)
    throw new Error('Not supported yet')
  }

  return (scope, execCtx) => {
    const value = scope(name)
    if (typeof value !== 'function') {
      execCtx.onError?.(new Error(`Method not found ${name}`))
      return undefined
    }

    const argv = $$argv(scope, execCtx)
    if (argv === undefined) {
      execCtx.onError?.(new Error(`Invalid argument for ${name}`))
      return undefined
    }

    const args: JsonObject = {}
    for (const [key, $$arg] of Object.entries($$args)) {
      const arg = $$arg(scope, execCtx)
      if (arg === undefined) continue
      if (typeof arg === 'function') continue

      args[key] = arg
    }

    return value(argv, args)
  }
}
