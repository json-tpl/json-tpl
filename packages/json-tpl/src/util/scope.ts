import { toJson, type Json } from './json.js'
import type { PlainObject } from './object.js'

export type Scope = (name: string) => undefined | Json

export function createObjectScope(obj: PlainObject): Scope {
  return (name) =>
    name !== '__proto__' && Object.prototype.hasOwnProperty.call(obj, name)
      ? toJson(obj[name])
      : undefined
}
