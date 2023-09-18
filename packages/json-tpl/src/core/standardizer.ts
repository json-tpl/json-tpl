import type { Json, JsonObject } from '../util/json.js'

import { TemplateError } from '../util/error.js'
import { ErrorHandler, thrower } from '../util/function.js'
import { JsonContext } from '../util/context.js'

export type StandardizerOptions = {
  callPrefix?: string
  onError?: false | ErrorHandler
}

export class Standardizer {
  public readonly callPrefix: string
  public readonly onError?: ErrorHandler

  constructor(options?: StandardizerOptions) {
    this.callPrefix = options?.callPrefix || '@'
    this.onError = (options?.onError ?? thrower) || undefined
  }

  standardize(context: JsonContext): Json | undefined {
    const result = this.standardizeContext(context)
    if (result === undefined) this.onError?.(new TemplateError('Invalid template', context))
    return result
  }

  protected standardizeContext(context: JsonContext): Json | undefined {
    switch (typeof context.template) {
      case 'boolean':
        return this.standardizeBoolean(context as JsonContext<boolean>)
      case 'number':
        return this.standardizeNumber(context as JsonContext<number>)
      case 'string':
        return this.standardizeString(context as JsonContext<string>)
      case 'object':
        if (context.template === null) {
          return this.standardizeNull(context as JsonContext<null>)
        } else if (Array.isArray(context.template)) {
          return this.standardizeArray(context as JsonContext<Json[]>)
        } else {
          return this.standardizeObject(context as JsonContext<JsonObject>)
        }
      default:
        return undefined
    }
  }

  standardizeBoolean(context: JsonContext<boolean>): Json | undefined {
    return context.template
  }

  standardizeNumber(context: JsonContext<number>): Json | undefined {
    return Number.isFinite(context.template) ? context.template : undefined
  }

  standardizeString(context: JsonContext<string>): Json | undefined {
    const { template } = context

    // Not a complex string template
    if (!template.includes('${')) return template

    // TODO
    this.onError?.(new TemplateError('${ x } substitution not implemented', context))
    return template
  }

  standardizeNull(context: JsonContext<null>): Json | undefined {
    return null
  }

  standardizeArray(context: JsonContext<Json[]>): Json | undefined {
    const result = Array(context.template.length) as Json[]

    for (let i = 0; i < context.template.length; i++) {
      const item = this.standardize({
        parent: context,
        template: context.template[i],
        pathFragment: i,
      })

      if (item === undefined) result[i] = null
      else result[i] = item
    }

    return result
  }

  standardizeObject(context: JsonContext<JsonObject>): Json | undefined {
    // TODO
    return context.template
  }
}
