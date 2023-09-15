import { MethodDefinition } from '../methods/definitions.js'
import { Program } from '../util/context.js'
import { ExecutionError, TemplateError } from '../util/error.js'
import { ErrorHandler } from '../util/function.js'
import type { Json, JsonObject } from '../util/json.js'
import { Scope } from '../util/scope.js'

import { StandardEvaluator } from './standard-evaluator.js'
import { Standardizer } from './standardizer.js'

export class ComplexEvaluator extends StandardEvaluator {
  protected readonly standardizer: Standardizer

  constructor(
    public readonly argvPrefix: string,
    public readonly argsPrefix: string,
    methods: ReadonlyMap<string, MethodDefinition>,
    executionLimit: number,
    onError?: ErrorHandler
  ) {
    super(methods, executionLimit, onError)

    this.standardizer = new Standardizer(
      this.argvPrefix,
      this.argsPrefix,
      this.methods,
      this.onError
    )
  }

  protected evaluateString(program: Program<string>, scope: Scope): Json | undefined {
    const code = this.standardizer.standardizeString(program)
    if (code === undefined) {
      this.onError?.(new ExecutionError('Invalid template', program))
      return undefined
    } else if (typeof code === 'string') {
      return code
    } else {
      return this.evaluate({ code, context: { type: 'transform', program } }, scope)
    }
  }

  protected evaluateObject(program: Program<JsonObject>, scope: Scope): Json | undefined {
    const { code } = program
    const keys = Object.keys(code)
    const callKeys = keys.filter(startsWithThis, this.argvPrefix)
    if (callKeys.length >= 1) {
      if (callKeys.length === 1) {
        const key = callKeys[0]
        const methodName = key.slice(this.argvPrefix.length)
        const method = this.findMethod(program, methodName, scope)
        if (method) {
          const argvProgram: Program = {
            code: code[key]!,
            context: { type: 'object', key, program },
          }

          return method.call(this, argvProgram, program, scope)
        }

        this.onError?.(new ExecutionError(`Unknown method "${methodName}"`, program))
      } else if (this.argsPrefix === this.argvPrefix) {
        for (let i = 0; i < callKeys.length; i++) {
          const key = callKeys[i]
          const methodName = key.slice(this.argvPrefix.length)
          const method = this.findMethod(program, methodName, scope)
          if (method) {
            const argvProgram: Program = {
              code: code[key]!,
              context: { type: 'object', key, program },
            }

            return method.call(this, argvProgram, program, scope)
          }
        }

        this.onError?.(
          new TemplateError(`No more than one key can start with "${this.argvPrefix}"`, program)
        )
      }

      return undefined
    }

    return super.evaluateObject(program, scope)
  }
}

function startsWithThis(this: string, key: string): boolean {
  return key.startsWith(this)
}
