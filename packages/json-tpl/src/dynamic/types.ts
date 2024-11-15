import type {
  CompiledTemplate,
  CompiledTemplateIterator,
  Result,
  ResultValidator,
} from '../core/types.js'
import type { TemplateContext } from '../util/context.js'
import type { Json, JsonObject } from '../util/json.js'

export interface MethodCompile<T extends Result = Result> {
  (
    this: MethodCompiler,
    argv: TemplateContext,
    args: TemplateContext<JsonObject>
  ): CompiledTemplate<T>
}

export interface MethodDefinition {
  compile: MethodCompile
}

export interface MethodCompiler {
  optimizeCompiled: boolean
  onError?: (error: Error) => void

  // compile<T extends Result = Result>(
  //   context: TemplateContext,
  //   validator: ResultValidator<T>
  // ): CompiledTemplate<T>
  // compile<T extends undefined | Json = undefined | Json>(
  //   context: TemplateContext,
  //   validator?: undefined
  // ): CompiledTemplate<T>
  compile<T extends Result = undefined | Json>(
    context: TemplateContext,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T>

  iterator<T extends Result = undefined | Json>(
    context: TemplateContext,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T>

  compileArg<T extends Result = undefined | Json>(
    argsContext: TemplateContext<JsonObject>,
    name: string,
    required: true,
    validator?: ResultValidator<T>
  ): CompiledTemplate<T>
  compileArg<T extends Result = undefined | Json>(
    argsContext: TemplateContext<JsonObject>,
    name: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplate<T>

  iteratorArg<T extends Result = undefined | Json>(
    argsContext: TemplateContext<JsonObject>,
    name: string,
    required: true,
    validator?: ResultValidator<T>
  ): CompiledTemplateIterator<T>
  iteratorArg<T extends Result = undefined | Json>(
    argsContext: TemplateContext<JsonObject>,
    name: string,
    required?: boolean,
    validator?: ResultValidator<T>
  ): undefined | CompiledTemplateIterator<T>
}
