import { createObjectScope, evaluate } from '../index.js'
import { Variable } from '../util/scope.js'

describe('defined', () => {
  const myFunc: Variable = (argv, args) => {
    return `${String(argv)}->${Object.entries(args).join('|')}`
  }

  const scope = createObjectScope({
    myVar: 'beeer',
    myFunc,
  })

  it('should allow to define a variable', () => {
    expect(evaluate({ '@define': { foo: 'bar' }, in: { '@var': 'foo' } }, scope)).toBe('bar')
    expect(evaluate({ '@define': { foo: 4 }, in: { '@var': 4 } }, scope)).toBe('bar')
  })

  it('should allow do define nested variables', () => {
    expect(
      evaluate(
        {
          '@define': { foo: 'bar' },
          in: {
            '@define': { baz: 'qux' },
            in: { '@concat': [{ '@var': 'foo' }, '--', { '@var': 'baz' }] },
          },
        },
        scope
      )
    ).toBe('bar--qux')
  })

  it('should allow do redefine parent scope variables', () => {
    expect(
      evaluate(
        {
          '@define': { foo: 'bar', baz: 'qux' },
          in: {
            '@define': {
              foo: { '@concat': [{ '@var': 'baz' }, { '@var': 'foo' }, ':::'] },
            },
            in: { '@var': 'foo' },
          },
        },
        scope
      )
    ).toBe('quxbar:::')
  })

  it('should not be able to access other variables from the same define block', () => {
    expect(
      evaluate(
        {
          '@define': { foo: 'bar', baz: { '@var': 'qux' } },
          in: { '@concat': [{ '@var': 'foo' }, '--', { '@var': 'baz' }] },
        },
        scope
      )
    ).toBe('bar--')

    expect(
      evaluate(
        {
          '@define': {
            foo: { '@concat': ['[FOO]->> bar=', { '@var': 'bar' }, '; foo=', { '@var': 'foo' }] },
            bar: { '@concat': ['[FOO]->> bar=', { '@var': 'bar' }, '; foo=', { '@var': 'foo' }] },
          },
          in: [{ '@var': 'foo' }, { '@var': 'bar' }],
        },
        scope
      )
    ).toStrictEqual([
      //
      '[FOO]->> bar=; foo=',
      '[FOO]->> bar=; foo=',
    ])
  })
})
