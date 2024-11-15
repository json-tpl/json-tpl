{{
  const { RESERVED_WORDS } = require('peggy')
  // This block is executed when the parser is initialized
}}

{
  // This block is executed on every run
}

start
  = parts:part* {
    if (parts.length === 0) return options.compileValue('')
    if (parts.length === 1) return parts[0]
    return options.compileConcatenation(parts)
  }

part
  = stringPlain
  / stringExpression

stringPlain
  = string:$( ( [^$] / "$" !"{" )+ ) { return options.compileValue(string) }

stringExpression
  = "${" _ body:expression _ "}" { return body }

expression
  = expressionTernary

expressionTernary
  = expression:expressionSafe ternary:(_ "?" _ trueValue:expression _ ":" _ falseValue:expression { return { then: trueValue, else: falseValue } } )? {
    return ternary ? options.compileMethodCall("if", expression, ternary) : expression
  }

expressionSafe
  = "(" _ expression:expression _ ")" { return expression }
  / "!" _ expression:expressionSafe { return options.compileNegation(expression) }
  / expressionCall
  / number:literalNumber { return options.compileValue(number) }
  / string:literalString { return options.compileValue(string) }
  / varName:expressionVariable path:expressionVariableGet* {
    return path.length ? options.compileObjectGet(varName, path) : varName
  }

expressionVariable "variable name"
  = id:literalIdentifier {
    switch (id) {
      case 'undefined':
        return options.compileValue(undefined)
      case 'null':
        return options.compileValue(null)
      case 'true':
        return options.compileValue(true)
      case 'false':
        return options.compileValue(false)
      default:
        if (RESERVED_WORDS.includes(id)) {
          throw new peg$SyntaxError(`Unexpected reserved word: ${id}`, null, id, location())
        }
        return options.compileVariable(id)
    }
  }

expressionCall "call expression"
  = "{" _
      "@" id:literalIdentifier
      _ ":" _
      argv:expression
      args:(
        _ "," _

        entries:(
          key:literalIdentifier _ ":" _  value:expression { return [key, value] }
        )|.., _ "," _|

        { return entries }
      )?
    _ "}" {
      return options.compileMethodCall(id, argv, args ? Object.fromEntries(args) : {})
    }

expressionVariableGet
  = "." subPath:literalIdentifier { return options.compileValue(subPath) }
  / "[" _ subPath:expression _ "]" { return subPath }

literalNumber "number"
  = number:$( "-"? [0-9]+ ("." [0-9]+)? ) { return parseFloat(number) }

literalString "string"
  = "'" string:$( [^']+ ) "'" { return string }

literalIdentifier "identifier"
  = $( [$a-z_]i [$a-z0-9_]i* )

_
  = [ \t\n\r]*
