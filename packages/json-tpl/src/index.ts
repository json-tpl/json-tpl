import type { Scope } from './util/scope.js'
import type { Json } from './util/json.js'
import { thrower, type ErrorHandler } from './util/function.js'

import { ComplexEvaluator } from './core/complex-evaluator.js'
import { Standardizer } from './core/standardizer.js'
import { Program } from './util/context.js'
import { StandardEvaluator } from './core/standard-evaluator.js'

import methods from './methods/index.js'

export { createObjectScope } from './util/scope.js'

export type EvaluateOptions = {
  executionLimit?: number
  argvPrefix?: string
  argsPrefix?: string
  onError?: false | ErrorHandler
}

export function evaluate(code: Json, scope: Scope, opts?: EvaluateOptions) {
  return new ComplexEvaluator(
    opts?.argvPrefix ?? '@',
    opts?.argsPrefix ?? '',
    methods,
    opts?.executionLimit ?? 1e8, // TODO: check what makes sence here,
    opts?.onError === false ? undefined : opts?.onError
  ).evaluate({ code, context: { type: 'root' } }, scope)
}

export function compile(code: Json, opts?: EvaluateOptions) {
  const argvPrefix = opts?.argvPrefix ?? '@'
  const argsPrefix = opts?.argsPrefix ?? ''
  const executionLimit = opts?.executionLimit ?? 1e8
  const onError = opts?.onError === false ? undefined : opts?.onError ?? thrower

  const standardizer = new Standardizer(argvPrefix, argsPrefix, methods, onError)
  const stdCode = standardizer.standardize({ code, context: { type: 'root' } })

  // Standardizer error handler will be called if the template is invalid
  if (stdCode === undefined) return () => undefined
  const stdProgram: Program = { code: stdCode, context: { type: 'root' } }

  return (scope: Scope) => {
    const evaluator = new StandardEvaluator(methods, executionLimit, onError)
    return evaluator.evaluate(stdProgram, scope)
  }
}
