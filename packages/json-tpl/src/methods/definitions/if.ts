import type { MethodImplementation } from '../definitions.js'

export const implementation: MethodImplementation = function () {
  const condition = this.evaluate()
  return condition ? this.arg('then')?.evaluate() : this.arg('else')?.evaluate()
}
