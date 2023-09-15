import type { Scope } from './util/scope'
import type { Json } from './util/json'

import { ComplexEvaluator } from './core/complex-evaluator'
import { EvaluatorOptions, StandardEvaluator } from './core/standard-evaluator'
import { Standardizer, StandardizerOptions } from './core/standardizer'

export { createObjectScope } from './util/scope'

export function evaluate(template: Json, scope: Scope, opts?: EvaluatorOptions) {
  return new ComplexEvaluator(opts).evaluate(template, scope)
}

export function compile(
  template: Json,
  standardizerOptions?: StandardizerOptions,
  evaluatorOptions?: EvaluatorOptions | false
) {
  return Standardizer.compile(template, standardizerOptions, evaluatorOptions)
}

export function standardize(template: Json, opts?: StandardizerOptions) {
  return new Standardizer(opts).standardize(template)
}

export function evaluateStandardized(template: Json, scope: Scope, opts?: EvaluatorOptions) {
  return new StandardEvaluator(opts).evaluate(template, scope)
}
