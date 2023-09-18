import { MethodContext, MethodEvaluator } from '../methods/definitions.js'
import { EvaluationContext } from '../util/context.js'
import { EvaluationError } from '../util/error.js'
import type { Json, JsonObject } from '../util/json.js'
import { Scope } from '../util/scope.js'

import { EvaluatorOptions, StandardEvaluator } from './standard-evaluator.js'
import { Standardizer, StandardizerOptions } from './standardizer.js'

export type CompileOptions = StandardizerOptions & EvaluatorOptions

export class ComplexEvaluator extends StandardEvaluator {
  public static compile(
    template: Json,
    options?: CompileOptions
  ): (scope: Scope, opts?: EvaluatorOptions) => undefined | Json {
    const standardizer = new Standardizer(options)
    const stdTemplate = standardizer.standardize({ template })

    // Standardizer error handler will be called if the template is invalid
    if (stdTemplate === undefined) return () => undefined

    return (scope: Scope, opts?: EvaluatorOptions) => {
      const evaluator = new StandardEvaluator(opts)
      return evaluator.evaluate({ template: stdTemplate, scope })
    }
  }

  protected readonly standardizer: Standardizer

  constructor(
    evaluatorOptions?: EvaluatorOptions,
    standardizerOptions?: Omit<StandardizerOptions, 'callPrefix'>
  ) {
    super(evaluatorOptions)

    this.standardizer = new Standardizer({
      ...standardizerOptions,
      callPrefix: this.callPrefix,
      onError: (standardizerOptions?.onError ?? this.onError) || false,
    })
  }

  evaluateString(context: EvaluationContext<string>): Json | undefined {
    const standadized = this.standardizer.standardizeString(context)
    if (standadized === undefined) {
      this.onError?.(new EvaluationError('Invalid template', context))
      return undefined
    } else if (typeof standadized === 'string') {
      return standadized
    } else {
      return this.evaluate({
        parent: context,
        template: standadized,
        scope: context.scope,
      })
    }
  }

  protected evaluateObject(context: EvaluationContext<JsonObject>): Json | undefined {
    const callKey = getComplexCallKey(context.template, this.callPrefix)
    if (callKey === this.callKey) {
      // Optimization: since we scanned for the call key, we can skip the "scan"
      // in super by directly calling evaluateStandardCall().
      return this.evaluateStandardCall(context)
    } else if (callKey === false) {
      this.onError?.(new EvaluationError(`Only one ${this.callPrefix} key is allowed`, context))
      return undefined
    } else if (callKey) {
      const methodName = callKey.slice(this.callPrefix.length)
      const method = this.findMethod(context, methodName)
      return method?.call(new ComplexMethodContext(this, callKey, context))
    }

    // Optimization: normally we should call super here, but since we already
    // did that trough the first optimization above, we can directly call
    // evaluatePlainObject().
    return this.evaluatePlainObject(context)
  }
}

function getComplexCallKey(template: JsonObject, prefix: string): string | null | false {
  let name: string | null = null
  for (const key in template) {
    if (key.startsWith(prefix)) {
      // Only one "@prefix@key" is allowed
      if (name !== null) return false

      name = key
    }
  }
  return name
}

export class ComplexMethodContext extends MethodContext {
  constructor(
    evaluator: MethodEvaluator,
    argvKey: string,
    context: Readonly<EvaluationContext<JsonObject>>
  ) {
    super(
      evaluator,
      {
        template: context.template[argvKey]!,
        scope: context.scope,
        parent: context,
        pathFragment: argvKey,
      },
      // Make a copy because we don't own the original context, and the owner may mutate it
      {
        template: context.template,
        scope: context.scope,
        parent: context.parent,
        pathFragment: context.pathFragment,
      }
    )
  }
}
