import type { Scope } from '../util/scope'
import type { ErrorHandler } from '../util/function'
import type { Json, JsonObject } from '../util/json'
import type { Path } from '../util/path'

import {
  ErrorEmitter,
  MethodCall,
  MethodContext,
  MethodDefinition,
  MethodName,
  isMethodCall,
} from '../methods/definitions'
import internalMethods from '../methods/index'
import { EvaluationError, EvaluationLimitError } from '../util/error'
import { combinePaths } from '../util/path'

export type EvaluatorOptions = {
  limit?: number
  path?: Readonly<Path>
  onError?: false | ErrorHandler<EvaluationError>
  methods?: Iterable<[MethodName, MethodDefinition]>
}

export class StandardEvaluator implements MethodContext {
  protected readonly customMethods?: Map<MethodName, MethodDefinition>
  public readonly currentPath: Path
  public executionCount: number
  public readonly executionLimit: number
  public readonly emitError?: ErrorEmitter

  constructor(options?: EvaluatorOptions) {
    this.currentPath = options?.path?.length ? [...options.path] : []
    this.executionCount = 0
    this.executionLimit = options?.limit || Number.MAX_SAFE_INTEGER

    const onError = options?.onError
    this.emitError = onError
      ? (message, path): never | undefined => {
          const fullPath = combinePaths(this.currentPath, path)
          onError(new EvaluationError(message, fullPath))
          return undefined
        }
      : undefined
  }

  public reset() {
    this.executionCount = 0
  }

  public evaluate(template: undefined | Json, scope: Scope): Json | undefined {
    if (++this.executionCount > this.executionLimit) {
      // Because we could be generating a (very) large array, we need a hard
      // throw here. Otherwise, the executionLimit would be useless.
      throw new EvaluationLimitError(this.executionCount)
    }

    // We allow evaluation "undefined" templates so that those are take into
    // account in the execution count.
    if (template === undefined) {
      return undefined
    }

    const result = this.evaluateJson(template, scope)
    if (result === undefined) {
      this.emitError?.('Invalid template')
    }

    return result
  }

  protected evaluateJson(template: Json, scope: Scope): Json | undefined {
    switch (typeof template) {
      case 'boolean':
        return template
      case 'number':
        return this.evaluateNumber(template, scope)
      case 'string':
        return this.evaluateString(template, scope)
      case 'object':
        if (template === null) {
          return template
        }
        if (Array.isArray(template)) {
          return this.evaluateArray(template, scope)
        }
        if (isMethodCall(template)) {
          return this.evaluateMethod(template, scope)
        }
        return this.evaluateObject(template, scope)
      default:
        return undefined
    }
  }

  protected evaluateNumber(template: number, scope: Scope): Json | undefined {
    // Although Json should not contain NaN, we still need to handle it because
    // the typing system does not allow us to prevent it from being used.
    return Number.isFinite(template) ? template : undefined
  }

  protected evaluateString(template: string, scope: Scope): Json | undefined {
    return template
  }

  protected evaluateArray(template: Json[], scope: Scope): Json[] {
    const result = Array(template.length) as Json[]

    for (let i = 0; i < template.length; i++) {
      const value = this.evaluateIndex(template, i, scope)
      if (value === undefined) {
        result[i] = null
        this.emitError?.('Undefined array entry', [i])
      } else {
        result[i] = value
      }
    }

    return result
  }

  protected evaluateObject(template: JsonObject, scope: Scope): JsonObject {
    // This method does not make use of evaluateKey for two reasons:
    // 1) It is called very often, so we want to avoid the try/catch overhead for every iteration
    // 2) evaluateKey will not account for "undefined" in the executionCount
    const pathIndex = this.currentPath.length
    try {
      const result: JsonObject = {}
      for (const key in template) {
        this.currentPath[pathIndex] = key
        const value = this.evaluate(template[key], scope)
        if (value !== undefined) result[key] = value
      }
      return result
    } finally {
      this.currentPath.length = pathIndex // Restore path
    }
  }

  protected evaluateMethod(template: MethodCall, scope: Scope): undefined | Json {
    for (const name in template) {
      const method = internalMethods.get(name as MethodName)
      if (method) return method.implementation.call(this, template, scope)
    }

    if (this.customMethods) {
      for (const name in template) {
        const method = this.customMethods.get(name as MethodName)
        if (method) return method.implementation.call(this, template, scope)
      }
    }

    this.emitError?.(`Unknown method "${Object.keys(template).join('')}"`)

    return undefined
  }

  public evaluateIndex(template: Json[], index: number, scope: Scope) {
    const pathIndex = this.currentPath.length
    try {
      this.currentPath[pathIndex] = index
      return this.evaluate(template[index], scope)
    } finally {
      this.currentPath.length = pathIndex // Restore path
    }
  }

  // Method utilities

  public evaluateKey(template: JsonObject, name: string, scope: Scope) {
    const value = Object.prototype.hasOwnProperty.call(template, name) ? template[name] : undefined

    // Since these helpers are only used when evaluating methods, there is no
    // need to "count" as an execution when the argument is null (because the
    // method call itself was already accounted for). This allows to increase
    // performances while not giving a penality to optional method arguments.
    if (value === undefined) return undefined

    const pathIndex = this.currentPath.length
    try {
      this.currentPath[pathIndex] = name
      return this.evaluate(value, scope)
    } finally {
      this.currentPath.length = pathIndex // Restore path
    }
  }

  public *iterateKey(template: JsonObject, name: string, scope: Scope): Iterator<Json> {
    const value = template[name]

    // Since these helpers are only used when evaluating methods, there is no
    // need to "count" as an execution when the argument is null (because the
    // method call itself was already accounted for). This allows to increase
    // performances while not giving a penality to optional method arguments.
    if (value === undefined) return

    const pathIndex = this.currentPath.length
    try {
      this.currentPath[pathIndex] = name

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const item = this.evaluateIndex(value, i, scope)
          yield item === undefined ? null : item
        }
      } else {
        // TODO: Optimize this ? (e.g. avoid evaluating plain objects / number / boolean)
        const result = this.evaluate(value, scope)
        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i++) {
            yield result[i]
          }
        } else {
          this.emitError?.('Expected an array')
        }
      }
    } finally {
      this.currentPath.length = pathIndex // Restore path
    }
  }
}
