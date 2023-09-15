import type { Json, JsonObject } from '../util/json.js'

import { TemplateError } from '../util/error.js'
import { ErrorHandler } from '../util/function.js'
import { Program } from '../util/context.js'
import { MethodDefinition } from '../methods/definitions.js'

type CallProgram<K extends string> = Program<JsonObject & { [_ in K]: Json }>

export class Standardizer {
  constructor(
    protected readonly argvPrefix: string,
    protected readonly argsPrefix: string,
    protected readonly methods: ReadonlyMap<string, MethodDefinition>,
    protected readonly onError?: ErrorHandler
  ) {}

  standardize(program: Program): Json | undefined {
    const result = this.standardizeContext(program)
    if (result === undefined) this.onError?.(new TemplateError('Invalid template', program))
    return result
  }

  protected standardizeContext(program: Program): Json | undefined {
    const { code } = program
    switch (typeof code) {
      case 'boolean':
        return this.standardizeBoolean(program as Program<boolean>)
      case 'number':
        return this.standardizeNumber(program as Program<number>)
      case 'string':
        return this.standardizeString(program as Program<string>)
      case 'object':
        if (code === null) {
          return this.standardizeNull(program as Program<null>)
        } else if (Array.isArray(code)) {
          return this.standardizeArray(program as Program<Json[]>)
        } else {
          return this.standardizeObject(program as Program<JsonObject>)
        }
      default:
        return undefined
    }
  }

  standardizeBoolean(program: Program<boolean>): Json | undefined {
    return program.code
  }

  standardizeNumber(program: Program<number>): Json | undefined {
    return Number.isFinite(program.code) ? program.code : undefined
  }

  standardizeString(program: Program<string>): Json | undefined {
    const { code } = program

    // Not a complex string template
    if (!code.includes('${')) return code

    // TODO
    this.onError?.(new TemplateError('${ x } substitution not implemented', program))
    return code
  }

  standardizeNull(program: Program<null>): Json | undefined {
    return null
  }

  standardizeArray(program: Program<Json[]>): Json | undefined {
    const { code } = program
    const result = Array(code.length) as Json[]

    for (let i = 0; i < code.length; i++) {
      const item = this.standardize({
        code: code[i],
        context: { type: 'array', index: i, program: program },
      })

      if (item === undefined) result[i] = null
      else result[i] = item
    }

    return result
  }

  standardizeObject(program: Program<JsonObject>): Json | undefined {
    const keys = Object.keys(program.code)
    const callKeys = keys.filter(startsWithThis, this.argvPrefix)

    if (callKeys.length > 1) {
      // argsPrefix === argvPrefix is slower, hence the warning in the constructor
      if (this.argsPrefix === this.argvPrefix) {
        for (let i = 0; i < callKeys.length; i++) {
          const key = callKeys[i]
          if (this.methods.has(key.slice(this.argvPrefix.length))) {
            return this.standardizeCall(program as CallProgram<string>, key)
          }
        }
      }

      this.onError?.(
        new TemplateError(`No more than one key can start with "${this.argvPrefix}"`, program)
      )
      return undefined
    } else if (callKeys.length === 1) {
      return this.standardizeCall(program as CallProgram<string>, callKeys[0])
    }

    return this.standardizePlainObject(program)
  }

  standardizeCall<K extends string>(program: CallProgram<K>, key: K): Json | undefined {
    const { code } = program

    return {
      '@@call': {
        name: key.slice(this.argvPrefix.length),
        argv: {
          code: code[key],
          context: { type: 'transform', program },
        },
        args: Object.fromEntries(
          Object.entries(code)
            .filter(
              (e): e is [string, Json] =>
                e[0] !== key && e[0].startsWith(this.argsPrefix) && e[1] !== undefined
            )
            .map(([k, c]) => [
              k.slice(this.argsPrefix.length),
              this.standardize({
                code: c,
                context: {
                  type: 'transform',
                  program: { code, context: { type: 'object', key, program } },
                },
              }),
            ])
        ),
      },
    }
  }

  standardizePlainObject(program: Program<JsonObject>): Json | undefined {
    const { code } = program
    const result: JsonObject = {}
    for (const key in code) {
      const value = code[key]
      if (value === undefined) continue

      const item = this.standardize({
        code: value,
        context: { type: 'object', key, program: program },
      })

      if (item !== undefined) result[key] = item
    }
    return result
  }
}

function startsWithThis(this: string, key: string): boolean {
  return key.startsWith(this)
}
