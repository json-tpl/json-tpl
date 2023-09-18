import type { Scope } from './util/scope.js'
import type { Json } from './util/json.js'

import { ComplexEvaluator, CompileOptions } from './core/complex-evaluator.js'
import { EvaluatorOptions as EvaluateOptions } from './core/standard-evaluator.js'

export { createObjectScope } from './util/scope.js'

export { EvaluateOptions }
export function evaluate(template: Json, scope: Scope, opts?: EvaluateOptions) {
  return new ComplexEvaluator(opts).evaluate({ template, scope })
}

export { CompileOptions }
export function compile(template: Json, opts?: CompileOptions) {
  return ComplexEvaluator.compile(template, opts)
}
