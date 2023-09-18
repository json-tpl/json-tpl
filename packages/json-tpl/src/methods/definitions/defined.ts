import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function (): boolean {
  const value = this.evaluate()
  return value != null
}
