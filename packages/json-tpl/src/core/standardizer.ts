import type { Json } from '../util/json'
import { combinePaths, type Path } from '../util/path'

import { StandardizationError } from '../util/error'
import { ErrorHandler, thrower } from '../util/function'
import { Scope } from '../util/scope'
import { EvaluatorOptions, StandardEvaluator } from './standard-evaluator'

export type StandardizerOptions = {
  path?: Readonly<Path>
  onError?: false | ErrorHandler<StandardizationError>
}

export class Standardizer {
  public readonly currentPath: Path
  public readonly emitError?: (message: string, path?: Readonly<Path>) => never | undefined

  constructor(options?: StandardizerOptions) {
    this.currentPath = options?.path?.length ? [...options.path] : []

    const onError = (options?.onError ?? thrower) || undefined
    this.emitError = onError
      ? (message, path) => {
          const fullPath = combinePaths(this.currentPath, path)
          onError(new StandardizationError(message, fullPath))
          return undefined
        }
      : undefined
  }

  standardizeString(template: string): Json | undefined {
    // Not a complex string template
    if (!template.includes('${')) return template

    // Basic heuristic
    if (!template.includes('}')) {
      this.emitError?.('Missing closing brace')
      return undefined
    }

    // TODO
    return template
  }

  standardize(template: Json): Json | undefined {
    if (typeof template === 'string') return this.standardizeString(template)

    // TODO
    return template
  }

  public static compile(
    template: Json,
    standardizerOptions: undefined | StandardizerOptions,
    evaluatorOptions: false
  ): (scope: Scope, opts?: EvaluatorOptions) => Json | undefined
  public static compile(
    template: Json,
    standardizerOptions?: StandardizerOptions,
    evaluatorOptions?: EvaluatorOptions | false
  ): (scope: Scope) => Json | undefined

  public static compile(
    template: Json,
    standardizerOptions?: StandardizerOptions,
    evaluatorOptions?: EvaluatorOptions | false
  ) {
    const standardizer = new Standardizer(standardizerOptions)
    const standadized = standardizer.standardize(template)

    if (evaluatorOptions === false) {
      return (scope: Scope, opts?: EvaluatorOptions) => {
        return new StandardEvaluator(opts).evaluate(standadized, scope)
      }
    } else {
      const reUsableEvaluator = new StandardEvaluator(evaluatorOptions)
      return (scope: Scope) => {
        reUsableEvaluator.reset()
        return reUsableEvaluator.evaluate(standadized, scope)
      }
    }
  }
}
