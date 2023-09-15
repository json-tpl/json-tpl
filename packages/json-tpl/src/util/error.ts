import { Path, stringifyPath } from './path'

export class JsonTplError extends Error {}

export class EvaluationLimitError extends JsonTplError {
  constructor(count: number) {
    super(`Execution limit exceeded (${count})`)
  }
}

export class ExpressionError extends JsonTplError {
  public readonly path: Readonly<Path>
  constructor(message: string, path: Readonly<Path>) {
    super(message)
    this.path = [...path]
  }

  toString() {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `${super.toString()} at ${stringifyPath(this.path)}}`
  }
}

export class EvaluationError extends ExpressionError {}
export class StandardizationError extends ExpressionError {}
