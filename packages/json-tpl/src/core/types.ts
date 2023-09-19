import type { ExecutionContext } from '../util/context'
import type { Json } from '../util/json'
import type { Scope } from '../util/scope'

export type CompiledTemplate<T extends Json | undefined = Json | undefined> = (
  scope: Scope,
  context: ExecutionContext
) => T | undefined

export type CompiledTemplateIterator<T extends Json | undefined = Json | undefined> = (
  scope: Scope,
  context: ExecutionContext
) => Iterator<T | undefined>

export type ResultValidator<T extends undefined | Json> = (value: undefined | Json) => value is T
