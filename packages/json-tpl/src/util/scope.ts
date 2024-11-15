import type { Json, JsonObject } from './json.js'

import { toJson } from './json.js'
import { isPlainObject } from './object.js'

export type Variable = Json | ((argv: Variable, args: JsonObject) => Json | undefined)
export type Scope = (name: string) => undefined | Variable

export function createObjectScope(obj: Record<string, Variable>, clone: false): Scope
export function createObjectScope(
  obj: Record<string, Variable | { toJSON(): Json }>,
  clone?: true
): Scope
export function createObjectScope(
  obj: Record<string, Variable | { toJSON(): Json }>,
  clone = false
): Scope {
  return (name) => {
    if (name === '__proto__') return undefined
    if (!Object.hasOwn(obj, name)) return undefined

    const value = obj[name]
    if (value == null) return value
    if (typeof value === 'function') return value as Variable

    return clone || (typeof value === 'object' && !isPlainObject(value))
      ? toJson(value)
      : (value as Json)
  }
}
