import { isPlainObject } from './object'

export type JsonScalar = string | number | boolean | null
export type JsonObject = { [_ in string]?: Json }
export type Json = JsonScalar | Json[] | { [_ in string]?: Json }

export function isJson(input: unknown): input is Json {
  switch (typeof input) {
    case 'string':
    case 'boolean':
    case 'number':
      return true
    case 'object':
      if (input === null) return true
      if (Array.isArray(input)) return input.every(isJson)
      if (isPlainObject(input)) return Object.values(input).every(isJson)
      return false
    default:
      return false
  }
}

export function toJson(input: unknown): Json | undefined {
  switch (typeof input) {
    case 'undefined': {
      return undefined
    }
    case 'string':
    case 'boolean': {
      return input
    }
    case 'bigint': {
      const n = Number(input)
      return BigInt(n) === input ? n : undefined
    }
    case 'number': {
      return Number.isFinite(input) ? input : undefined
    }
    case 'object': {
      if (input === null) return null
      // return JSON.parse(JSON.stringify(input))
      if (isJsonSerializable(input)) return input.toJSON()
      if (Array.isArray(input)) return input.map(toJsonStrict)
      if (isPlainObject(input)) {
        const copy: JsonObject = {}
        for (const key in input) {
          const item = toJson(input[key])
          if (item !== undefined) copy[key] = item
        }
        return copy
      }
      return undefined
    }
    default: {
      return undefined
    }
  }
}

function isJsonSerializable(v: object): v is { toJSON(): Json } {
  return typeof (v as Record<string, unknown>).toJSON === 'function'
}

function toJsonStrict(input: Json | undefined): Json {
  const output = toJson(input)
  return output === undefined ? null : output
}
