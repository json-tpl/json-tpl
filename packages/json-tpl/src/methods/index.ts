import * as coalesceMethod from './definitions/coalesce'
import * as concatMethod from './definitions/concat'
import * as definedMethod from './definitions/defined'
import * as forMethod from './definitions/for'
import * as getMethod from './definitions/get'
import * as ifMethod from './definitions/if'
import * as notMethod from './definitions/not'
import * as objectMethod from './definitions/object'
import * as varMethod from './definitions/var'

import type { MethodDefinition, MethodName } from './definitions'

export default new Map<MethodName, MethodDefinition>([
  ['$coalesce', coalesceMethod],
  ['$concat', concatMethod],
  ['$defined', definedMethod],
  ['$for', forMethod],
  ['$get', getMethod],
  ['$if', ifMethod],
  ['$not', notMethod],
  ['$object', objectMethod],
  ['$var', varMethod],
])
