import type { MethodCompile } from '../dynamic/types.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.iterator(argv)

  return function (scope) {
    const it = this.exec($$argv, scope)

    for (let result = it.next(); !result.done; result = it.next()) {
      if (result.value != null) return result.value
    }

    return null
  }
}
