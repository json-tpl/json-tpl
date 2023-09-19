import type { CompiledTemplate, CompiledTemplateIterator, ResultValidator } from '../core/types'
import type { CompilationContext } from '../util/context'
import type { ErrorHandler } from '../util/function'
import type { Json, JsonObject } from '../util/json'

import { CoreCompiler } from '../core/compiler'
import { TemplateError } from '../util/error'
import { createNoopIterator } from '../util/iterator'

import type { MehodCompilationContext, MethodCompileContext, MethodDefinition } from './types'

export class DynamicCompiler extends CoreCompiler implements MethodCompileContext {
  constructor(
    protected readonly methods: ReadonlyMap<string, MethodDefinition>,
    callPrefix: string,
    onError?: ErrorHandler,
    lazy?: boolean,
    debug?: boolean
  ) {
    super(callPrefix, onError, lazy, debug)
  }

  protected compileString(context: CompilationContext<string>): CompiledTemplate {
    const { template } = context
    if (!template.includes('${')) return () => template
    if (!template.includes('}')) {
      this.onError?.(new TemplateError(`Missing "}"`, context))
      return () => undefined
    }

    // TODO: Compile template
    this.onError?.(new TemplateError(`Template expression are not implemented yet.`, context))
    return () => template
  }

  protected compileObject(context: CompilationContext<JsonObject>): CompiledTemplate {
    const keys = Object.keys(context.template)
    const callKeys = keys.filter(startsWithThis, this.callPrefix)
    if (callKeys.length > 1) {
      this.onError?.(
        new TemplateError(`No more than one key can start with "${this.callPrefix}"`, context)
      )
      return () => undefined
    } else if (callKeys.length === 1) {
      const key = callKeys[0]
      return this.compileCall({ ...context, key })
    }

    return this.compilePlainObject(context, keys)
  }

  protected compileCall(context: MehodCompilationContext): CompiledTemplate {
    const definition = this.methods.get(context.key.slice(this.callPrefix.length))
    if (definition) return definition.compile.call(this, context)

    this.onError?.(new TemplateError(`Unknown method "${context.key}"`, context))
    return () => undefined
  }

  // MethodCompileContext methods

  public compileArgv<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T> {
    return this.compileArgs(context, context.key, true, validator)
  }

  public compileArgvIterator<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T> {
    return this.compileArgsIterator(context, context.key, true, validator)
  }

  compileArgs<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    key: string,
    required: true,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T>
  compileArgs<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    key: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplate<T>
  public compileArgs<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    key: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplate<T> {
    const childContext = getKeyContext(context, key)
    if (childContext) return this.compile(childContext, validator)

    if (required) {
      this.onError?.(new TemplateError(`Missing argument "${key}" in ${context.key}`, context))
      return this.withRuntimeChecks(context, () => undefined)
    }

    return undefined
  }

  compileArgsIterator<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    key: string,
    required: true,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T>
  compileArgsIterator<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    key: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplateIterator<T>
  public compileArgsIterator<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    key: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplateIterator<T> {
    const childContext = getKeyContext(context, key)
    if (childContext) return this.compileIterator(childContext, validator)

    if (required) {
      this.onError?.(new TemplateError(`Missing argument "${key}" in ${context.key}`, context))
      return createNoopIterator
    }

    return undefined
  }
}

function getKeyContext(
  context: CompilationContext<JsonObject>,
  key: string
): CompilationContext | undefined {
  const template = context.template[key]
  if (template === undefined) return undefined
  return { template, parent: { type: 'object', key, context } }
}

function startsWithThis(this: string, key: string): boolean {
  return key.startsWith(this)
}
