import type { MethodCompile } from '../dynamic/types'

export const compile: MethodCompile = function concatCompiler(context) {
  const separatorCompiled = this.compileArgs(context, 'separator', false, isSeparator)
  const compiled = this.compileArgvIterator(context, isStringifiable)

  return (scope, execCtx) => {
    const it = compiled(scope, execCtx)

    const output: string[] = []
    for (let result = it.next(); !result.done; result = it.next()) {
      if (result.value != null) output.push(String(result.value))
    }

    const separator = separatorCompiled?.(scope, execCtx)
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
