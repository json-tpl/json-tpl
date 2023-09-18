import type { EvaluationContext, JsonContext } from './context.js'
import type { Json } from './json.js'
import type { Path } from './path.js'

import { computeContextPath } from './context.js'
import { stringifyPath } from './path.js'

export class JsonTplError extends Error {}

export class EvaluationLimitError extends JsonTplError {
  constructor(count: number) {
    super(`Execution limit exceeded (${count})`)
  }
}

export class TemplateError extends JsonTplError {
  public readonly path?: Readonly<Path>
  public readonly template: Json

  constructor(message: string, context: Readonly<JsonContext>) {
    super(message)
    this.path = computeContextPath(context)
    this.template = context.template
  }

  toString() {
    const location = this.path ? ` at ${stringifyPath(this.path)}` : ''
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `${super.toString()}${location}`
  }
}

export class EvaluationError extends TemplateError {
  constructor(
    message: string,
    context: Readonly<EvaluationContext>,
    public readonly result?: Json
  ) {
    super(message, context)
  }

  toString() {
    const got = this.result === undefined ? '' : ` (got: ${typeof this.result})`
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `${super.toString()}${got}`
  }
}
