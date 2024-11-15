import type { MethodCompile } from '../dynamic/types.js'

export const compile: MethodCompile = function (argv, args) {
  const $$separator = this.compileArg(args, 'separator', false, isSeparator)
  const $$argv = this.iterator(argv, isStringifiable)

  return (scope, execCtx) => {
    const it = $$argv(scope, execCtx)

    const output: string[] = []
    for (let result = it.next(); !result.done; result = it.next()) {
      if (result.value != null) output.push(String(result.value))
    }

    const separator = $$separator?.(scope, execCtx)
    return output.join(separator || '')
  }
}

function isStringifiable(v: unknown): v is string | number | boolean {
  switch (typeof v) {
    case 'string':
    case 'number':
    case 'boolean':
      return true
    default:
      return false
  }
}

function isSeparator(v: unknown): v is string | undefined {
  return typeof v === 'string' || v === undefined
}
