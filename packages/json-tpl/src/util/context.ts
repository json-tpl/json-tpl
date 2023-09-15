import type { ErrorHandler } from './function.js'
import type { Json, JsonObject } from './json.js'
import type { Path } from './path.js'

export type TemplateContextLocation =
  | { type: 'root' }
  | { type: 'object'; key: string; context: TemplateContext<JsonObject> }
  | { type: 'array'; index: number; context: TemplateContext<Json[]> }

export type TemplateContext<T extends Json = Json> = {
  json: T
  location: TemplateContextLocation
}

export type ExecutionContext = {
  executionCount: number
  executionLimit: number
  onError: ErrorHandler | null
}

export function computeContextPath(context: TemplateContext): Path {
  const path: Path = []
  for (
    let it: TemplateContext | undefined = context;
    it.location.type !== 'root';
    it = it.location.context
  ) {
    if (it.location.type === 'object') path.push(it.location.key)
    if (it.location.type === 'array') path.push(it.location.index)
  }
  return path.reverse()
}

export function isContext<T extends Json>(
  context: TemplateContext,
  templatePredicate: (c: Json) => c is T
): context is TemplateContext<T> {
  return templatePredicate(context.json)
}
