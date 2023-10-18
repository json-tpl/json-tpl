import type { ErrorHandler } from './util/function.js'
import type { Json } from './util/json.js'
import type { Scope } from './util/scope.js'

import { DynamicCompiler } from './dynamic/compiler.js'
import { thrower } from './util/function.js'

import methods, { type MethodDefinition } from './methods.js'

export { createObjectScope } from './util/scope.js'

export { DynamicCompiler as Compiler }

export type CompileOptions = {
  argvPrefix?: string
  argsPrefix?: string
  onError?: ErrorHandler | false | typeof thrower
  debug?: boolean
  optimizeCompiled?: boolean
  lazyCompilation?: boolean
  methods?: Iterable<readonly [string, MethodDefinition]>
  executeDefaults?: Partial<ExecuteOptions>
}

export type ExecuteOptions = {
  executionLimit?: number
  onError?: ErrorHandler
}

export type CompiledExpression = (scope: Scope, options?: ExecuteOptions) => Json | undefined

export function compile(template: Json, opts?: CompileOptions): CompiledExpression {
  const compiler = new DynamicCompiler(
    opts?.methods ? new Map([...methods, ...opts.methods]) : methods,
    opts?.argvPrefix ?? '@',
    opts?.argsPrefix ?? '',
    (opts?.onError ?? thrower) || undefined,
    opts?.debug,
    opts?.optimizeCompiled ?? true,
    opts?.lazyCompilation
  )

  const compiled = compiler.compile({ json: template, location: { type: 'root' } })

  if (compiled.static) return () => compiled.staticValue

  const executeDefaults = {
    executionLimit: opts?.executeDefaults?.executionLimit ?? 1e7,
    onError: opts?.executeDefaults?.onError || null,
  }

  return (scope, options) => {
    return compiled(scope, {
      executionCount: 0,
      executionLimit: options?.executionLimit ?? executeDefaults.executionLimit,
      onError: options?.onError ?? executeDefaults.onError,
    })
  }
}

export type EvaluateOptions = {
  argvPrefix?: string
  argsPrefix?: string
  limit?: number
  onError?: ErrorHandler | false
}

export function evaluate(template: Json, scope: Scope, opts?: EvaluateOptions): Json | undefined {
  const onError = opts?.onError ?? false
  const argvPrefix = opts?.argvPrefix
  const argsPrefix = opts?.argsPrefix
  return compile(template, {
    onError,
    argvPrefix,
    argsPrefix,
    optimizeCompiled: false,
    lazyCompilation: true,
  })(scope, {
    onError: onError || undefined,
    executionLimit: opts?.limit,
  })
}
