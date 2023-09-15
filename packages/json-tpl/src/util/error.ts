import type { Program } from './context.js'
import type { Path } from './path.js'

import { computeContextPath } from './context.js'
import { stringifyPath } from './path.js'

export class TemplateError extends Error {
  constructor(
    message: string,
    public readonly program: Program
  ) {
    super(message)
  }

  get path(): Readonly<Path> | undefined {
    return computeContextPath(this.program)
  }

  get template() {
    return this.program.code
  }

  toString() {
    const location = this.path ? ` at ${stringifyPath(this.path)}` : ''
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `${super.toString()}${location}`
  }
}

export class ExecutionError extends TemplateError {}

export class ExecutionLimitError extends ExecutionError {
  constructor(program: Program) {
    super('Execution limit reached', program)
  }
}
