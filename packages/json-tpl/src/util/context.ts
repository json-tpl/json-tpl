import type { ErrorHandler } from './function'
import type { Json, JsonObject } from './json'
import type { Path, PathFragment } from './path'

export type CompilationContextParent =
  | { type: 'object'; key: string; context: CompilationContext<JsonObject> }
  | { type: 'array'; index: number; context: CompilationContext<Json[]> }

export type CompilationContext<T extends Json | undefined = Json | undefined> = {
  template: T
  parent?: CompilationContextParent
}

export type ExecutionContext = {
  executionCount: number
  executionLimit: number
  onError: ErrorHandler | null
}

export function computeContextPath(context: CompilationContext): Path {
  const path: Path = []
  for (let it: CompilationContext | undefined = context; it.parent; it = it.parent.context) {
    const fragment: PathFragment = it.parent.type === 'object' ? it.parent.key : it.parent.index
    path.push(fragment)
  }
  return path.reverse()
}

export function isContext<T extends Json | undefined>(
  context: CompilationContext,
  templatePredicate: (c: Json | undefined) => c is T
): context is CompilationContext<T> {
  return context.template !== undefined && templatePredicate(context.template)
}
