import type { MethodDefinition } from './dynamic/types.js'

import * as coalesceMethod from './methods/coalesce.js'
import * as concatMethod from './methods/concat.js'
import * as defineMethod from './methods/define.js'
import * as definedMethod from './methods/defined.js'
import * as fnMethod from './methods/fn.js'
import * as forMethod from './methods/for.js'
import * as getMethod from './methods/get.js'
import * as ifMethod from './methods/if.js'
import * as notMethod from './methods/not.js'
import * as nullishMethod from './methods/nullish.js'
import * as objectMethod from './methods/object.js'
import * as undefinedMethod from './methods/undefined.js'
import * as varMethod from './methods/var.js'

export { MethodDefinition }

export default new Map<string, MethodDefinition>([
  ['coalesce', coalesceMethod],
  ['concat', concatMethod],
  ['define', defineMethod],
  ['defined', definedMethod],
  ['fn', fnMethod],
  ['for', forMethod],
  ['get', getMethod],
  ['if', ifMethod],
  ['not', notMethod],
  ['nullish', nullishMethod],
  ['object', objectMethod],
  ['undefined', undefinedMethod],
  ['var', varMethod],
]) as ReadonlyMap<string, MethodDefinition>
