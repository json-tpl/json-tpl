import type { MethodCompile } from '../dynamic/types.js'

export const compile: MethodCompile = function (argv, args) {
  const $$argv = this.iterator(argv)

  return (scope, execCtx) => {
    const it = $$argv(scope, execCtx)

    for (let result = it.next(); !result.done; result = it.next()) {
      if (result.value != null) return result.value
    }

    return null
  }
}
