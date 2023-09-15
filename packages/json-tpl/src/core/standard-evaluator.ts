import type { Json, JsonObject } from '../util/json.js'

import { MethodDefinition, MethodEvaluator, MethodImplementation } from '../methods/definitions.js'

import { ExecutionError, ExecutionLimitError } from '../util/error.js'
import { Program, ResultValidator } from '../util/context.js'
import { ErrorHandler } from '../util/function.js'
import { Scope } from '../util/scope.js'
import { isArray } from '../util/array.js'

const CALL_KEY = '@@call'

export class StandardEvaluator implements MethodEvaluator {
  public executionCount = 0

  constructor(
    protected readonly methods: ReadonlyMap<string, MethodDefinition>,
    public readonly executionLimit: number,
    public readonly onError?: ErrorHandler
  ) {}

  public resetCount() {
    this.executionCount = 0
  }

  protected increaseCount(program: Program) {
    if (this.executionCount >= this.executionLimit) {
      // Because we could be generating a (very) large array, we need a hard
      // throw here. Otherwise, the executionLimit would be useless.
      throw new ExecutionLimitError(program)
    }
    this.executionCount += 1
  }

  public evaluate<T extends undefined | Json = undefined | Json>(
    program: Program,
    scope: Scope,
    validator?: ResultValidator<T>
  ): T | undefined {
    this.increaseCount(program)

    const result = this.evaluateProgram(program, scope)

    if (validator) {
      if (validator(result)) {
        return result
      } else {
        this.onError?.(new ExecutionError('Invalid result', program))
        return undefined
      }
    } else if (result === undefined) {
      this.onError?.(new ExecutionError('Invalid template', program))
      return undefined
    } else {
      return result as T | undefined
    }
  }

  protected evaluateProgram(context: Program, scope: Scope): Json | undefined {
    switch (typeof context.code) {
      case 'boolean':
        return context.code
      case 'number':
        return this.evaluateNumber(context as Program<number>, scope)
      case 'string':
        return this.evaluateString(context as Program<string>, scope)
      case 'object':
        if (context.code === null) {
          return this.evaluateNull(context as Program<null>, scope)
        } else if (Array.isArray(context.code)) {
          return this.evaluateArray(context as Program<Json[]>, scope)
        } else {
          return this.evaluateObject(context as Program<JsonObject>, scope)
        }
      default:
        return undefined
    }
  }

  protected evaluateNull(context: Program<null>, scope: Scope): Json | undefined {
    return null
  }

  protected evaluateNumber(context: Program<number>, scope: Scope): Json | undefined {
    // Although Json should not contain NaN, we still need to handle it because
    // the typing system does not allow us to prevent it from being used.
    return Number.isFinite(context.code) ? context.code : undefined
  }

  protected evaluateString(context: Program<string>, scope: Scope): Json | undefined {
    return context.code
  }

  protected evaluateArray(context: Program<Json[]>, scope: Scope): Json[] {
    const { code } = context
    const result = Array(code.length) as Json[]

    for (let i = 0; i < code.length; i++) {
      const item = this.evaluate(
        {
          code: code[i],
          context: { type: 'array', index: i, program: context },
        },
        scope
      )

      if (item === undefined) result[i] = null
      else result[i] = item
    }

    return result
  }

  protected evaluateObject(context: Program<JsonObject>, scope: Scope): Json | undefined {
    if (context.code[CALL_KEY] !== undefined) {
      return this.evaluateStandardCall(context, scope)
    }

    return this.evaluatePlainObject(context, scope)
  }

  protected evaluatePlainObject(program: Program<JsonObject>, scope: Scope): Json | undefined {
    const { code } = program
    const result: JsonObject = {}
    for (const key in code) {
      const value = code[key]
      if (value === undefined) continue

      const item = this.evaluate(
        {
          code: value,
          context: { type: 'object', key, program },
        },
        scope
      )

      if (item !== undefined) result[key] = item
    }
    return result
  }

  protected evaluateStandardCall(program: Program<JsonObject>, scope: Scope) {
    const { code } = program

    // TODO: actually validate
    const { name, argv, args } = code[CALL_KEY] as { name: string; argv: Json; args: JsonObject }

    const argvProgram: Program = {
      code: argv,
      context: { type: 'object', key: 'argv', program },
    }

    const argsProgram: Program<JsonObject> = {
      code: args,
      context: { type: 'object', key: 'args', program },
    }

    return this.evaluateCall(name, argvProgram, argsProgram, scope)
  }

  protected evaluateCall(
    name: string,
    argvProgram: Program,
    argsProgram: Program<JsonObject>,
    scope: Scope
  ) {
    const method = this.findMethod(argvProgram, name, scope)
    return method?.call(this, argvProgram, argsProgram, scope)
  }

  public findMethod(
    program: Program,
    name: string,
    scope: Scope
  ): undefined | MethodImplementation {
    const definition = this.methods.get(name)
    if (definition) return definition.implementation

    // TODO: find in scope

    this.onError?.(new ExecutionError(`Unknown method "${name}"`, program))
    return undefined
  }

  evaluateIterator<T extends Json | undefined = Json | undefined>(
    program: Program,
    scope: Scope,
    itemValidator?: ResultValidator<T>
  ): Iterator<T | undefined> {
    const { code } = program

    if (Array.isArray(code)) {
      const { length } = code
      let i = 0
      return {
        next: () => {
          while (i < length) {
            const value = this.evaluate(
              {
                code: code[i],
                context: { type: 'array', index: i, program: program as Program<Json[]> },
              },
              scope,
              itemValidator
            )
            i += 1
            return { done: false, value }
          }
          return { done: true, value: undefined }
        },
      }
    } else {
      // TODO: Optimize this ? (e.g. avoid evaluating plain objects / number / boolean)
      const result = this.evaluate(program, scope, isArray)
      if (result) {
        const { length } = result
        let i = 0
        return {
          next: () => {
            while (i++ < length) {
              const value = result[i]
              if (itemValidator) {
                if (itemValidator(value)) {
                  return { done: false, value: value }
                } else {
                  this.onError?.(new ExecutionError(`Invalid result item (${i})`, program))
                  return { done: false, value: undefined }
                }
              } else {
                return { done: false, value: value as T | undefined }
              }
            }
            return { done: true, value: undefined }
          },
        }
      }
    }

    // TODO: re-usable iterator ?
    return {
      next: () => {
        return { done: true, value: undefined }
      },
    }
  }

  evaluateArgv<T extends undefined | Json = undefined | Json>(
    program: Program,
    scope: Scope,
    validator?: ResultValidator<T>
  ): T | undefined {
    return this.evaluate(program, scope, validator)
  }

  iteratorArgv<T extends undefined | Json = undefined | Json>(
    program: Program,
    scope: Scope,
    validator?: ResultValidator<T>
  ): Iterator<T | undefined> {
    return this.evaluateIterator(program, scope, validator)
  }

  evaluateArgs<T extends undefined | Json = undefined | Json>(
    program: Program<JsonObject>,
    key: string,
    scope: Scope,
    validator?: ResultValidator<T>
  ): T | undefined {
    const code = program.code[key]
    if (code === undefined) {
      this.increaseCount(program)
      return undefined
    }

    return this.evaluate({ code, context: { type: 'object', key, program } }, scope, validator)
  }

  iteratorArgs<T extends undefined | Json = undefined | Json>(
    program: Program<JsonObject>,
    key: string,
    scope: Scope,
    validator?: ResultValidator<T>
  ): undefined | Iterator<T | undefined> {
    const code = program.code[key]
    if (code === undefined) {
      this.increaseCount(program)
      return undefined
    }

    return this.evaluateIterator(
      { code, context: { type: 'object', key, program } },
      scope,
      validator
    )
  }
}
