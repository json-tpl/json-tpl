import type { Json, JsonObject } from './json.js'
import type { Path } from './path.js'

export type ProgramContext =
  | { type: 'root' }
  | { type: 'transform'; program: Program }
  | { type: 'object'; key: string; program: Program<JsonObject> }
  | { type: 'array'; index: number; program: Program<Json[]> }

export type Program<T extends Json = Json> = {
  readonly code: T
  readonly context: ProgramContext
}

export function computeContextPath(program: Program): Path {
  const path: Path = []
  for (
    let it: ProgramContext | undefined = program.context;
    it.type !== 'root';
    it = it.program.context
  ) {
    // if (it.type === 'transform') path.push('<transform>')
    if (it.type === 'object') path.push(it.key)
    if (it.type === 'array') path.push(it.index)
  }
  return path.reverse()
}

export type ResultValidator<T extends undefined | Json> = (value: undefined | Json) => value is T
