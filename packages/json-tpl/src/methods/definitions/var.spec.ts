import { createObjectScope, evaluate } from '../../index'

describe('var', () => {
  const scope = createObjectScope({
    true: 'not true',
    false: 'not false',
    null: 'not null',
    undefined: 'not undefined',
    foo: 'bar',
    bar: 'baz',
    date: new Date('2021-11-21T01:32:21.543Z'),
    someObject: { a: 1, foo: { bar: 'baz' } },
  })

  it('should return the value of the variable', () => {
    expect(evaluate({ $var: 'foo' }, scope)).toBe('bar')
  })

  it('should return undefined if the variable is not defined', () => {
    expect(evaluate({ $var: 'baz' }, scope)).toBe(undefined)
  })

  it('should evaluate the variable name', () => {
    expect(evaluate({ $var: { $var: 'foo' } }, scope)).toBe('baz')
  })

  it('should return date as strings', () => {
    expect(evaluate({ $var: 'date' }, scope)).toBe('2021-11-21T01:32:21.543Z')
  })

  it('should read nested variable value', () => {
    expect(evaluate({ $var: 'someObject' }, scope)).toStrictEqual({ a: 1, foo: { bar: 'baz' } })
  })

  it('should ignore reserved variables', () => {
    expect(evaluate({ $var: 'true' }, scope)).toBe(true)
    expect(evaluate({ $var: 'false' }, scope)).toBe(false)
    expect(evaluate({ $var: 'null' }, scope)).toBe(null)
    expect(evaluate({ $var: 'undefined' }, scope)).toBe(undefined)
  })
})
