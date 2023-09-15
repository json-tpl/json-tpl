import { indexedIterator } from '../../util/iterator'
import type { MethodImplementation } from '../definitions'

export const implementation: MethodImplementation = function (methodCall, scope): string {
  const separatorRaw = this.evaluateKey(methodCall, '$separator', scope)
  const separator = typeof separatorRaw === 'string' ? separatorRaw : ''
  if (separatorRaw !== undefined && separator !== separatorRaw) {
    this.emitError?.(`Separator must be a string`, ['$separator'])
  }

  const output: string[] = []

  const it = indexedIterator(this.iterateKey(methodCall, '$concat', scope))
  for (let result = it.next(); !result.done; result = it.next()) {
    switch (typeof result.value) {
      case 'string':
      case 'number':
      case 'boolean':
        output.push(String(result.value))
        break
      default:
        this.emitError?.('Non string value in $concat', [result.index])
        break
    }
  }

  return output.join(separator)
}
