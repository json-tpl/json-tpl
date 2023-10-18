import type { MethodCompile } from '../dynamic/types.js'

import { isString } from '../util/string.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.compile(argv, isString)

  return (scope, execCtx) => {
    const name = $$argv(scope, execCtx)

    switch (name) {
      // Invalid input
      case undefined:
        return undefined
      // "reserved" variables
      case 'null':
        return null
      case 'undefined':
        return undefined
      case 'true':
        return true
      case 'false':
        return false
    }

    return scope(name)
  }
}
