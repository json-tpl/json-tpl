import type { ErrorHandler } from '../util/function.js'
import type { Json, JsonObject } from '../util/json.js'

import { isArray } from '../util/array.js'
import { EvaluationContext, ResultValidator } from '../util/context.js'
import { EvaluationError } from '../util/error.js'
import { Scope } from '../util/scope.js'

export type ErrorEmitter = (message: string, result?: Json) => undefined
function createErrorEmitter(
  context: EvaluationContext,
  onError?: ErrorHandler
): undefined | ErrorEmitter {
  return onError
    ? (message: string, result?: Json) => {
        onError(new EvaluationError(message, context, result))
      }
    : undefined
}

export type MethodImplementation = (this: MethodContext) => Json | undefined

export type MethodDefinition = {
  readonly implementation: MethodImplementation
}

export interface MethodEvaluator {
  readonly onError?: ErrorHandler
  evaluate<T extends undefined | Json = undefined | Json>(
    context: EvaluationContext,
    validator?: ResultValidator<T>
  ): T | undefined
  increaseCount(): void
}

export class ContextWrapper {
  public readonly emitError?: ErrorEmitter

  constructor(
    public readonly evaluator: MethodEvaluator,
    protected readonly context: EvaluationContext
  ) {
    this.emitError = createErrorEmitter(context, evaluator.onError)
  }

  getVariable(name: string): undefined | Json {
    return this.context.scope(name)
  }

  evaluate<T extends undefined | Json = undefined | Json>(
    validator?: ResultValidator<T>
  ): T | undefined {
    return this.evaluator.evaluate(this.context, validator)
  }

  *iterator<T extends Json | undefined = Json | undefined>(
    itemValidator?: ResultValidator<T> | undefined
  ): Iterator<T | undefined> {
    const { template } = this.context

    if (Array.isArray(template)) {
      const loopContext: EvaluationContext = {
        template: this.context.template,
        scope: this.context.scope,
        parent: this.context,
        pathFragment: this.context.pathFragment,
      }

      for (let i = 0; i < template.length; i++) {
        loopContext.template = template[i]
        loopContext.pathFragment = i

        yield this.evaluator.evaluate(loopContext, itemValidator)
      }
    } else {
      // TODO: Optimize this ? (e.g. avoid evaluating plain objects / number / boolean)
      const result = this.evaluate(isArray)
      if (result) {
        for (let i = 0; i < result.length; i++) {
          const value = result[i]
          if (itemValidator) {
            if (itemValidator(value)) {
              yield value
            } else {
              this.evaluator.onError?.(
                new EvaluationError(`Invalid result item (${i})`, this.context)
              )
              yield undefined
            }
          } else {
            yield value as T | undefined
          }
        }
      }
    }
  }
}

export class MethodContext extends ContextWrapper {
  constructor(
    evaluator: MethodEvaluator,
    argvContext: Readonly<EvaluationContext>,
    protected argsContext: null | Readonly<EvaluationContext<JsonObject>>
  ) {
    super(evaluator, argvContext)
  }

  arg(name: string, scope?: Scope): undefined | ContextWrapper {
    if (!this.argsContext) return undefined

    const argTemplate = this.argsContext.template[name]
    if (argTemplate === undefined) return undefined

    return new ContextWrapper(this.evaluator, {
      template: argTemplate,
      scope: scope || this.argsContext.scope,
      parent: this.argsContext,
      pathFragment: name,
    })
  }
}
