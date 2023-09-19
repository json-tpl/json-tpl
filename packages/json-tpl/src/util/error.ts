import type { CompilationContext, ExecutionContext } from './context'
import type { Json } from './json'
import type { Path } from './path'

import { computeContextPath } from './context'
import { stringifyPath } from './path'

export class TemplateError extends Error {
  constructor(
    message: string,
    public readonly compilationContext?: Readonly<CompilationContext>
  ) {
    super(message)
  }

  get path(): Readonly<Path> | undefined {
    const { compilationContext } = this
    if (!compilationContext) return undefined
    return computeContextPath(compilationContext)
  }

  get template(): Json | undefined {
    return this.compilationContext?.template
  }

  toString() {
    const location = this.path ? ` at ${stringifyPath(this.path)}` : ''
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `${super.toString()}${location}`
  }
}

export class ExecutionError extends TemplateError {
  constructor(
    message: string,
    compilationContext: undefined | Readonly<CompilationContext>,
    public readonly executionContext: Readonly<ExecutionContext>
  ) {
    super(message, compilationContext)
  }
}

export class ExecutionLimitError extends ExecutionError {
  get limit() {
    return this.executionContext.executionLimit
  }

  toString() {
    return `${super.toString()} (limit: ${this.limit})`
  }
}
