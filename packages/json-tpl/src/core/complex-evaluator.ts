import type { ErrorEmitter } from '../methods/definitions'
import type { StandardizationError } from '../util/error'
import type { ErrorHandler } from '../util/function'
import type { Json } from '../util/json'
import type { Scope } from '../util/scope'

import { EvaluatorOptions, StandardEvaluator } from './standard-evaluator'
import { Standardizer, StandardizerOptions } from './standardizer'

export class ComplexEvaluator extends StandardEvaluator {
  protected readonly standardizer: Standardizer

  constructor(evaluatorOptions?: EvaluatorOptions, standardizerOptions?: StandardizerOptions) {
    super(evaluatorOptions)

    this.standardizer = new Standardizer({
      ...standardizerOptions,
      // Use the same error handler as the evaluator if not Standardizer error handler was provided
      onError: standardizerOptions?.onError ?? asStdErrorHandler(this.emitError?.bind(this)),
    })
  }

  evaluateString(template: string, scope: Scope): Json | undefined {
    const standadized = this.standardizer.standardizeString(template)
    if (typeof standadized === 'string') return standadized

    // Note that standardizeString will typically return a $concat method call

    return this.evaluate(standadized, scope)
  }
}

function asStdErrorHandler(emitError?: ErrorEmitter): false | ErrorHandler<StandardizationError> {
  return emitError
    ? (error: StandardizationError) => {
        emitError(`Invalid template: ${error.message}`, error.path)
        return undefined
      }
    : false
}
