import type { ErrorHandler } from '../util/function.js'
import type { Json, JsonObject } from '../util/json.js'

import { Program, ResultValidator } from '../util/context.js'
import { Scope } from '../util/scope.js'

export type ErrorEmitter = (message: string, result?: Json) => undefined

export type MethodDefinition = {
  readonly implementation: MethodImplementation
}

export type MethodImplementation = (
  this: MethodEvaluator,
  argvProgram: Program,
  argsProgram: Program<JsonObject>,
  scope: Scope
) => Json | undefined

export interface MethodEvaluator {
  readonly onError?: ErrorHandler

  findMethod(program: Program, name: string, scope: Scope): undefined | MethodImplementation

  evaluateArgv<T extends undefined | Json = undefined | Json>(
    program: Program,
    scope: Scope,
    validator?: ResultValidator<T>
  ): T | undefined

  iteratorArgv<T extends undefined | Json = undefined | Json>(
    program: Program,
    scope: Scope,
    validator?: ResultValidator<T>
  ): Iterator<T | undefined>

  evaluateArgs<T extends undefined | Json = undefined | Json>(
    program: Program<JsonObject>,
    name: string,
    scope: Scope,
    validator?: ResultValidator<T>
  ): T | undefined

  iteratorArgs<T extends undefined | Json = undefined | Json>(
    program: Program<JsonObject>,
    name: string,
    scope: Scope,
    validator?: ResultValidator<T>
  ): undefined | Iterator<T | undefined>
}
