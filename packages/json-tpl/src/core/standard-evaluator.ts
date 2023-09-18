import type { Json, JsonObject } from '../util/json.js'

import { MethodContext, MethodEvaluator, MethodImplementation } from '../methods/definitions.js'
import internalMethods from '../methods/index.js'
import { EvaluationError, EvaluationLimitError } from '../util/error.js'
import { EvaluationContext, ResultValidator } from '../util/context.js'
import { ErrorHandler } from '../util/function.js'

export type EvaluatorOptions = {
  limit?: number
  callPrefix?: string
  onError?: false | ErrorHandler
}

export class StandardEvaluator {
  public executionCount: number
  public readonly executionLimit: number
  public readonly callPrefix: string
  protected readonly callKey: string // cached
  public readonly onError?: ErrorHandler

  constructor(options?: EvaluatorOptions) {
    this.executionCount = 0
    this.executionLimit = options?.limit || 1e8 // TODO: check what makes sence here
    this.callPrefix = options?.callPrefix || '@'
    this.callKey = `${this.callPrefix}call`
    this.onError = options?.onError || undefined
  }

  public resetCount() {
    this.executionCount = 0
  }

  public increaseCount() {
    if (this.executionCount >= this.executionLimit) {
      // Because we could be generating a (very) large array, we need a hard
      // throw here. Otherwise, the executionLimit would be useless.
      throw new EvaluationLimitError(this.executionCount)
    }
    this.executionCount += 1
  }

  public evaluate<T extends undefined | Json = undefined | Json>(
    context: EvaluationContext,
    validator?: ResultValidator<T>
  ): T | undefined {
    this.increaseCount()

    const result = this.evaluateJson(context)

    if (validator) {
      if (validator(result)) {
        return result
      } else {
        this.onError?.(new EvaluationError('Invalid result', context))
        return undefined
      }
    } else if (result === undefined) {
      this.onError?.(new EvaluationError('Invalid template', context))
      return undefined
    } else {
      return result as T | undefined
    }
  }

  protected evaluateJson(context: EvaluationContext): Json | undefined {
    switch (typeof context.template) {
      case 'boolean':
        return context.template
      case 'number':
        return this.evaluateNumber(context as EvaluationContext<number>)
      case 'string':
        return this.evaluateString(context as EvaluationContext<string>)
      case 'object':
        if (context.template === null) {
          return this.evaluateNull(context as EvaluationContext<null>)
        } else if (Array.isArray(context.template)) {
          return this.evaluateArray(context as EvaluationContext<Json[]>)
        } else {
          return this.evaluateObject(context as EvaluationContext<JsonObject>)
        }
      default:
        return undefined
    }
  }

  protected evaluateNull(context: EvaluationContext<null>): Json | undefined {
    return null
  }

  protected evaluateNumber(context: EvaluationContext<number>): Json | undefined {
    // Although Json should not contain NaN, we still need to handle it because
    // the typing system does not allow us to prevent it from being used.
    return Number.isFinite(context.template) ? context.template : undefined
  }

  protected evaluateString(context: EvaluationContext<string>): Json | undefined {
    return context.template
  }

  protected evaluateArray(context: EvaluationContext<Json[]>): Json[] {
    const result = Array(context.template.length) as Json[]

    // Optimization: avoid creating a new context for each iteration
    const loopContext: EvaluationContext<Json, Json[]> = {
      parent: context,
      template: context.template[-1],
      pathFragment: -1,
      scope: context.scope,
    }

    for (let i = 0; i < context.template.length; i++) {
      loopContext.template = context.template[i]
      loopContext.pathFragment = i

      const item = this.evaluate(loopContext)

      if (item === undefined) result[i] = null
      else result[i] = item
    }

    return result
  }

  protected evaluateObject(context: EvaluationContext<JsonObject>): Json | undefined {
    if (context.template[this.callKey] !== undefined) {
      return this.evaluateStandardCall(context)
    }

    return this.evaluatePlainObject(context)
  }

  protected evaluatePlainObject(context: EvaluationContext<JsonObject>): Json | undefined {
    // Optimization: avoid creating a new context for each iteration
    const loopContext: EvaluationContext<Json, JsonObject> = {
      parent: context,
      template: null,
      pathFragment: '',
      scope: context.scope,
    }

    const result: JsonObject = {}
    for (const key in context.template) {
      const value = context.template[key]
      if (value === undefined) continue

      loopContext.template = value
      loopContext.pathFragment = key

      const item = this.evaluate(loopContext)

      if (item !== undefined) result[key] = item
    }
    return result
  }

  protected evaluateStandardCall(context: EvaluationContext<JsonObject>) {
    const { template } = context
    if (template['argv'] === undefined) {
      this.onError?.(
        new EvaluationError(`${this.callKey} method required an "argv" argument`, context)
      )
      return undefined
    }

    if (template['args'] !== undefined) {
      if (template['args'] === null || typeof template['args'] !== 'object') {
        this.onError?.(
          new EvaluationError(`${this.callKey} method "args" argument must be an object`, context)
        )
        return undefined
      }
    }

    const callContext = {
      parent: context,
      template: template[this.callKey] as Json,
      pathFragment: this.callKey,
      scope: context.scope,
    }
    const callResult = this.evaluate(callContext, isMethodName)
    if (callResult === undefined) return undefined

    const method = this.findMethod(context, callResult)
    return method?.call(
      new StandardMethodContext(this, context as EvaluationContext<StandardCallObject>)
    )
  }

  protected findMethod(context: EvaluationContext, name: string): undefined | MethodImplementation {
    const definition = internalMethods.get(name)
    if (definition) return definition.implementation

    // TODO: find in scope

    this.onError?.(new EvaluationError(`Unknown method "${name}"`, context))
    return undefined
  }
}

function isMethodName(value: undefined | Json): value is string {
  return typeof value === 'string'
}

type StandardCallObject = {
  argv: Json
  args?: JsonObject
}

class StandardMethodContext extends MethodContext {
  constructor(
    evaluator: MethodEvaluator,
    context: Readonly<EvaluationContext<StandardCallObject>>
  ) {
    super(
      evaluator,
      {
        parent: context,
        template: context.template['argv'],
        pathFragment: 'argv',
        scope: context.scope,
      },
      context.template['args']
        ? {
            parent: context,
            template: context.template['args'],
            pathFragment: 'args',
            scope: context.scope,
          }
        : null
    )
  }
}
