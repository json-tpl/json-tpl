import { compile, createObjectScope, evaluate } from '../index'
import { thrower } from '../util/function'
import { Json } from '../util/json'
import { Scope } from '../util/scope'

const evalLimit = (template: Json, scope: Scope) => evaluate(template, scope, { limit: 1e6 })

const evalStrict = (template: Json, scope: Scope) =>
  evaluate(template, scope, { onError: thrower, limit: 1e6 })

describe('var', () => {
  const scope = createObjectScope({
    foo: 'foo',
  })

  it('should validate the "do" property', () => {
    expect(() => compile({ '@for': 3 })).toThrowError('Missing argument "do" in @for')
  })

  it('should allow generating custom arrays', () => {
    expect(evaluate({ '@for': 4 }, scope)).toStrictEqual([null, null, null, null])
    expect(evalStrict({ '@for': 4, do: 0 }, scope)).toStrictEqual([0, 0, 0, 0])
  })

  it('should expose an $index variable', () => {
    expect(
      evalStrict({ '@for': 4, do: { '@concat': ['index:', { '@var': '$index' }] } }, scope)
    ).toStrictEqual([`index:0`, `index:1`, `index:2`, `index:3`])
  })

  it('should expose a $position variable', () => {
    expect(
      evalStrict({ '@for': 4, do: { '@concat': ['position:', { '@var': '$position' }] } }, scope)
    ).toStrictEqual([`position:1`, `position:2`, `position:3`, `position:4`])
  })

  it('should allow renaming default variables', () => {
    expect(
      evalStrict(
        {
          '@for': 4,
          as: { '@var': 'foo' },
          do: { '@concat': ['foo_position:', { '@var': 'foo$position' }] },
        },
        scope
      )
    ).toStrictEqual([`foo_position:1`, `foo_position:2`, `foo_position:3`, `foo_position:4`])

    expect(
      evalStrict(
        {
          '@for': 2,
          as: 'a',
          do: {
            '@for': 2,
            as: 'b',
            do: { '@concat': ['a:', { '@var': 'a$position' }, 'b:', { '@var': 'b$position' }] },
          },
        },
        scope
      )
    ).toStrictEqual([
      [`a:1b:1`, `a:1b:2`],
      [`a:2b:1`, `a:2b:2`],
    ])
  })

  it('should trigger execution limit', () => {
    expect(() => evalStrict({ '@for': 1e6, do: 1 }, scope)).toThrowError(`Execution limit exceeded`)
    expect(() => evalLimit({ '@for': 1e6 }, scope)).toThrowError(`Execution limit exceeded`)
    expect(() => evalLimit({ '@for': 1e6 - 1 }, scope)).not.toThrowError()
  })

  // TODO : add tests with arrays and objects
})
