import type { MethodDefinition } from './dynamic/types'

import * as coalesceMethod from './methods/coalesce'
import * as concatMethod from './methods/concat'
import * as definedMethod from './methods/defined'
import * as forMethod from './methods/for'
import * as getMethod from './methods/get'
import * as ifMethod from './methods/if'
import * as notMethod from './methods/not'
import * as nullishMethod from './methods/nullish'
import * as objectMethod from './methods/object'
import * as varMethod from './methods/var'
import * as undefinedMethod from './methods/undefined'

export { MethodDefinition }

export default new Map<string, MethodDefinition>([
  ['coalesce', coalesceMethod],
  ['concat', concatMethod],
  ['defined', definedMethod],
  ['for', forMethod],
  ['get', getMethod],
  ['if', ifMethod],
  ['not', notMethod],
  ['nullish', nullishMethod],
  ['object', objectMethod],
  ['var', varMethod],
  ['undefined', undefinedMethod],
]) as ReadonlyMap<string, MethodDefinition>
