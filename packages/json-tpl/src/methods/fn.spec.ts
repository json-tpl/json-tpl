import { createObjectScope, evaluate } from '../index.js'
import { Variable } from '../util/scope.js'

describe('defined', () => {
  const myFunc: Variable = jest.fn((argv, args) => {
    return `${String(argv)}->${Object.entries(args).join('|')}`
  })

  const scope = createObjectScope({
    myVar: 'beeer',
    myFunc,
  })

  it('Should allow to call a scope function', () => {
    expect(evaluate({ $myFunc: 'foo' }, scope)).toBe('foo->')
    expect(myFunc).toBeCalledWith('foo', {})

    expect(evaluate({ $myFunc: { $var: 'myVar' } }, scope)).toBe('beeer->')
    expect(myFunc).toBeCalledWith('beeer', {})

    expect(myFunc).toBeCalledTimes(2)
  })

  it('Should allow to call a scope function with arguments', () => {
    expect(evaluate({ $myFunc: ['foo', 'bar'], goo: 4 }, scope)).toBe('foo,bar->goo,4')
  })

  it('should not leak function as evaluation', () => {
    expect(evaluate({ $fn: { $var: '$argv' } }, scope)).toBe(undefined)
  })

  it('should allow to define a function', () => {
    expect(
      evaluate(
        {
          '@define': {
            wrapInSquareBrackets: {
              // (argv) => `[${argv}]`
              '@fn': { '@concat': ['[', { '@var': '$argv' }, ']'] },
            },
          },
          in: {
            '@concat': [
              { '@wrapInSquareBrackets': 'bar' },
              '--',
              { '@wrapInSquareBrackets': 'baz' },
            ],
          },
        },
        scope
      )
    ).toBe('[bar]--[baz]')

    expect(
      evaluate(
        {
          '@define': {
            returnArgs: { '@fn': { argv: { '@var': '$argv' }, args: { '@var': '$args' } } },
          },
          in: [
            //
            { '@concat': [{ '@myFunc': { '@var': 'myVar' } }, { '@returnArgs': 'baz' }] },
          ],
        },
        scope
      )
    ).toBe('beeer->baz')
  })

  it('should be able to call itself', () => {
    expect(
      evaluate(
        {
          '@define': {
            foo: {
              '@fn': {
                '@if': { '@var': '$argv' },
                then: [1, { '@foo': false }, 3],
                else: 2,
              },
            },
          },
          in: { '@foo': true },
        },
        scope
      )
    ).toStrictEqual([1, 2, 3])
  })

  it('should trigger an error on infinite recursion', () => {
    expect(() =>
      evaluate(
        {
          '@define': {
            foo: { '@fn': { '@foo': true } },
          },
          in: { '@foo': true },
        },
        scope
      )
    ).toThrowError('Maximum call stack size exceeded')
  })
})
