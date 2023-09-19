import type { CompiledTemplate, CompiledTemplateIterator, ResultValidator } from '../core/types'
import type { CompilationContext } from '../util/context'
import type { Json, JsonObject } from '../util/json'

export type MehodCompilationContext = CompilationContext<JsonObject> & {
  key: string
}

export interface MethodCompile<T extends Json = Json> {
  (this: MethodCompileContext, context: MehodCompilationContext): CompiledTemplate<T>
}

export interface MethodDefinition {
  compile: MethodCompile
}

export interface MethodCompileContext {
  onError?: (error: Error) => void

  compileArgv<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T>

  compileArgvIterator<T extends undefined | Json = undefined | Json>(
    context: MehodCompilationContext,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T>

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
}
