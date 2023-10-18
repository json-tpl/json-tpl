import type { CompiledTemplate, Result } from '../core/types.js'
import type { MethodCompile } from '../dynamic/types.js'
import type { JsonObject } from '../util/json.js'
import type { Scope } from '../util/scope.js'

import { asStaticValue } from '../core/types.js'
import { TemplateContext } from '../util/context.js'
import { TemplateError } from '../util/error.js'
import { isDefined } from '../util/function.js'

type DefinitionObject = JsonObject

export const compile: MethodCompile = function (argv, args) {
  if (!isDefinitionObjectContext(argv)) {
    this.onError?.(new TemplateError('method argument must be an object', argv))
    return asStaticValue(undefined)
  }

  // There is no way (in the compiler) to build an object of functions so
  // we will have to unwrap the argv here.

  const $$in = this.compileArg(args, 'in', true)

  const variablesCompiled = Object.create(null) as Record<string, CompiledTemplate<Result>>
  for (const [key, json] of Object.entries(argv.json)) {
    if (json === undefined) continue

    variablesCompiled[key] = this.compile(
      { json, location: { type: 'object', key, context: argv } },
      isDefined
    )
  }

  return (scope, execCtx) => {
    const variables = Object.create(null) as Record<string, Result>
    const childScope: Scope = (name) => {
      if (name in variables) return variables[name]
      if (name in variablesCompiled) {
        // We want to allow functions to reference themselves (in order to be
        // able to perform recursion). this is why we use a scope that will
        // return the the value itself, buf only after it was initialized.
        const scopeWithSelf: Scope = (n) => {
          // make sure that the variable was initialized before we shadow
          // any variable from the parent scope with the same name. This
          // basically restrict the use of recursion to functions only.

          // As a side effect, functions cannot reference a variable with the
          // same name as themselves. This is a limitation that we are willing
          // to accept as you only need to use a different name to work around.
          if (n === name && name in variables) {
            return variables[name]
          }

          return scope(n)
        }

        const $$variable = variablesCompiled[name]

        // Prevent any potential future infinite instantiation loop (though
        // there shouldn't be any). This would allow to pass `childScope` to
        // $$variable(childScope) without having to worry about infinite
        // recursion. This would allow to reference other variables from the
        // same definition block but we **DO NOT** want to allow users to
        // actually do this. The reason for this restriction is that there is no
        // guarantee on the order of the key:value pairs in a JSON object, and,
        // hence the order in which define blocks are executed (eg. Postgres's
        // jsonb type will often cause object entries to move).

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete variablesCompiled[name]

        return (variables[name] = $$variable(scopeWithSelf, execCtx))
      }
      return scope(name)
    }

    return $$in(childScope, execCtx)
  }
}

function isDefinitionObjectContext(
  value: TemplateContext
): value is TemplateContext<DefinitionObject> {
  return isDefinitionObject(value.json)
}
function isDefinitionObject(value: unknown): value is DefinitionObject {
  return typeof value === 'object' && value !== null
}
