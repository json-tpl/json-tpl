import type { TemplateContext, ExecutionContext } from './context.js'
import type { Json } from './json.js'
import type { Path } from './path.js'

import { computeContextPath } from './context.js'
import { stringifyPath } from './path.js'

export class TemplateError extends Error {
  constructor(
    message: string,
    public readonly compilationContext?: Readonly<TemplateContext>
  ) {
    super(message)
  }

  get path(): Readonly<Path> | undefined {
    const { compilationContext } = this
    if (!compilationContext) return undefined
    return computeContextPath(compilationContext)
  }

  get template(): Json | undefined {
    return this.compilationContext?.json
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
    compilationContext: undefined | Readonly<TemplateContext>,
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
