import { parser, ParserOptions } from 'peggy'

export type SyntaxError = parser.SyntaxErrorConstructor
export type ParseOptions<O> = Pick<ParserOptions, 'grammarSource' | 'startRule' | 'tracer'> & {
  compileVariable: (identifier: string) => O
  compileObjectGet: (object: O, path: O[]) => O
  compileNegation: (value: O) => O
  compileConcatenation: (values: O[]) => O
  compileValue: (value: string | number | boolean | null) => O
  compileMethodCall: (id: string, argv: O, args: Record<string, O>) => O
}

declare const parse: <O>(input: string, options: ParseOptions<O>) => O

export { parse }
