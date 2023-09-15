import type { Json } from '../../util/json'
import type { Path } from '../../util/path'

import { isPlainObject } from '../../util/object'
import { isPath } from '../../util/path'

import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (methodCall, scope) {
  const variable = this.evaluateKey(methodCall, '$get', scope)
  const path = this.evaluateKey(methodCall, '$path', scope)

  if (!isPath(path)) {
    this.emitError?.(`Value must be a path`, ['$var'])
    return undefined
  }

  return getPath(variable, path)
}

export function getPath(value: Json | undefined, path: Readonly<Path>): Json | undefined {
  let current: Json | undefined = value

  for (let i = 0; i < path.length; i++) {
    const fragment = path[i]
    if (fragment === '__proto__') return undefined

    switch (typeof current) {
      case 'string':
        // Allow reading the length of strings
        if (fragment === 'length') {
          current = current.length
        } else {
          return undefined
        }
        break
      case 'object':
        if (current === null) {
          return undefined
        } else if (isPlainObject(current)) {
          if (Object.prototype.hasOwnProperty.call(current, fragment)) {
            current = current[fragment]
          } else {
            return undefined
          }
        } else if (Array.isArray(current)) {
          // Allow reading the length of arrays
          if (fragment === 'length') {
            current = current.length
          } else {
            const index = parseIndex(fragment)
            if (index === undefined) return undefined
            const normalizedIndex = index < 0 ? current.length + index : index
            if (!(normalizedIndex in current)) return undefined
            current = current[normalizedIndex]
          }
        } else {
          return undefined
        }
        break
      default:
        return undefined
    }
  }

  return current
}

function parseIndex(value: number | string): number | undefined {
  if (typeof value === 'string') {
    // Number.MAX_SAFE_INTEGER is 16 digits long. No need to parse so many.
    if (/^-?\d{1,15}$/.test(value)) return Number(value)
    return undefined
  }
  if (value !== (value | 0)) return undefined
  return value
}
