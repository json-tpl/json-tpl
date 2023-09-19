import type { ErrorHandler } from './util/function'
import type { Json } from './util/json'
import type { Scope } from './util/scope'

import { DynamicCompiler } from './dynamic/compiler'
import { thrower } from './util/function'

import methods, { type MethodDefinition } from './methods'

export { createObjectScope } from './util/scope'

export { DynamicCompiler as Compiler }

export type CompileOptions = {
  callPrefix?: string
  onError?: ErrorHandler | false | typeof thrower
  lazy?: boolean
  debug?: boolean
  methods?: Iterable<readonly [string, MethodDefinition]>
  executeDefaults?: Partial<ExecuteOptions>
}

export type ExecuteOptions = {
  executionLimit?: number
  onError?: ErrorHandler
}

export function compile(template: Json, opts?: CompileOptions) {
  const compiler = new DynamicCompiler(
    opts?.methods ? new Map([...methods, ...opts.methods]) : methods,
    opts?.callPrefix || '@',
    (opts?.onError ?? thrower) || undefined,
    opts?.lazy,
    opts?.debug
  )

  const compiled = compiler.compile({ template })

  const executeDefaults = {
    executionLimit: opts?.executeDefaults?.executionLimit ?? 1e7,
    onError: opts?.executeDefaults?.onError || null,
  }

  return (scope: Scope, options?: ExecuteOptions): Json | undefined => {
    return compiled(scope, {
      executionCount: 0,
      executionLimit: options?.executionLimit ?? executeDefaults.executionLimit,
      onError: options?.onError ?? executeDefaults.onError,
    })
  }
}

export type EvaluateOptions = {
  callPrefix?: string
  limit?: number
  onError?: ErrorHandler | false
}

export function evaluate(template: Json, scope: Scope, opts?: EvaluateOptions): Json | undefined {
  const onError = opts?.onError ?? false
  const callPrefix = opts?.callPrefix
  return compile(template, { onError, callPrefix })(scope, {
    onError: onError || undefined,
    executionLimit: opts?.limit,
  })
}
