import * as coalesceMethod from './definitions/coalesce.js'
import * as concatMethod from './definitions/concat.js'
import * as definedMethod from './definitions/defined.js'
import * as forMethod from './definitions/for.js'
import * as getMethod from './definitions/get.js'
import * as ifMethod from './definitions/if.js'
import * as notMethod from './definitions/not.js'
import * as objectMethod from './definitions/object.js'
import * as varMethod from './definitions/var.js'

import type { MethodDefinition } from './definitions.js'

export default new Map<string, MethodDefinition>([
  ['coalesce', coalesceMethod],
  ['concat', concatMethod],
  ['defined', definedMethod],
  ['for', forMethod],
  ['get', getMethod],
  ['if', ifMethod],
  ['not', notMethod],
  ['object', objectMethod],
  ['var', varMethod],
])
