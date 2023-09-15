import { toJson, type Json } from './json'
import type { PlainObject } from './object'

export type Scope = (name: string) => undefined | Json

export function createObjectScope(obj: PlainObject): Scope {
  return (name) =>
    name !== '__proto__' && Object.prototype.hasOwnProperty.call(obj, name)
      ? toJson(obj[name])
      : undefined
}
