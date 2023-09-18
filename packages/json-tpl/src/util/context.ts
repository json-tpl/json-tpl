import type { Json } from './json.js'
import type { Path, PathFragment } from './path.js'
import type { Scope } from './scope.js'

export type JsonContext<T extends Json = Json, P extends Json | undefined = Json | undefined> = {
  template: T

  parent?: P extends undefined ? undefined : JsonContext<Exclude<P, undefined>>
  pathFragment?: P extends undefined ? undefined : PathFragment
}

export interface EvaluationContext<
  T extends Json = Json,
  P extends Json | undefined = Json | undefined,
> extends JsonContext<T, P> {
  scope: Scope
}

export function computeContextPath(context: JsonContext): Path {
  const path: Path = []
  for (let it: JsonContext | undefined = context; it; it = it.parent) {
    if (it.pathFragment != null) path.push(it.pathFragment)
  }
  return path.reverse()
}

export type ResultValidator<T extends undefined | Json> = (value: undefined | Json) => value is T
