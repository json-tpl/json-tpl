import type { Json } from '../../util/json.js'
import type { PathFragment } from '../../util/path.js'

import { isPlainObject } from '../../util/object.js'
import { isPathFragment } from '../../util/path.js'

import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (argv, args, scope) {
  const path = this.iteratorArgs(args, 'path', scope, isPathFragment)
  if (path === undefined) return undefined

  const variable = this.evaluateArgv(argv, scope)
  if (variable === undefined) return undefined

  return getPath(variable, path)
}

export function getPath(
  value: Json | undefined,
  it: Iterator<PathFragment | undefined>
): Json | undefined {
  let current: Json | undefined = value

  for (let result = it.next(); !result.done; result = it.next()) {
    const fragment = result.value
    if (fragment === undefined) return undefined
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
