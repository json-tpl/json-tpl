import type { Scope } from '../util/scope'
import type { Json } from '../util/json'
import type { PlainObject } from '../util/object'
import type { Path } from '../util/path'

export type ErrorEmitter = (message: string, path?: Readonly<Path>) => undefined | never

export type MethodName = `$${string}`
export type MethodCall = { [_ in MethodName]?: Json }
export type MethodContext = {
  emitError?: ErrorEmitter
  evaluateKey: (methodCall: MethodCall, name: string, scope: Scope) => Json | undefined
  iterateKey: (methodCall: MethodCall, name: string, scope: Scope) => Iterator<Json>
}

export type MethodImplementation = (
  this: MethodContext,
  methodCall: MethodCall,
  scope: Scope
) => Json | undefined

export type MethodDefinition = {
  readonly implementation: MethodImplementation
}

export function isMethodCall(template: PlainObject): template is MethodCall {
  let gotOne = false
  for (const key in template) {
    if (key.charCodeAt(0) === 36 /* $ */) {
      gotOne = true
    } else {
      return false
    }
  }
  return gotOne
}
