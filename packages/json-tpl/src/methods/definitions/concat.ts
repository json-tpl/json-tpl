import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (): string {
  const separator = this.arg('separator')?.evaluate(isSeparator)

  const output: string[] = []

  const it = this.iterator()
  for (let result = it.next(); !result.done; result = it.next()) {
    switch (typeof result.value) {
      case 'string':
      case 'number':
      case 'boolean':
        output.push(String(result.value))
        break
      default:
        this.emitError?.(`$concat items must be of type string, number or boolean`)
        break
    }
  }

  return output.join(separator || '')
}

function isSeparator(v: unknown): v is string | undefined {
  return typeof v === 'string' || v === undefined
}
