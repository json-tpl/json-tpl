import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (argv, args, scope) {
  const separator = this.evaluateArgs(args, 'separator', scope, isSeparator)

  const output: string[] = []

  const it = this.iteratorArgv(argv, scope, isStringifiable)
  for (let result = it.next(); !result.done; result = it.next()) {
    if (result.value !== undefined) output.push(String(result.value))
  }

  return output.join(separator || '')
}

function isSeparator(v: unknown): v is string | undefined {
  return typeof v === 'string' || v === undefined
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
