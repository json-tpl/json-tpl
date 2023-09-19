import { createObjectScope, evaluate } from '../index'

describe('coalesce', () => {
  const scope = createObjectScope({})

  it('should return the first defined value', () => {
    expect(evaluate({ '@coalesce': [] }, scope)).toBe(null)
    expect(evaluate({ '@coalesce': [1] }, scope)).toBe(1)
    expect(evaluate({ '@coalesce': [1, 2] }, scope)).toBe(1)
    expect(evaluate({ '@coalesce': [1, 2, 3] }, scope)).toBe(1)
    expect(evaluate({ '@coalesce': [null, 2] }, scope)).toBe(2)
    expect(evaluate({ '@coalesce': [null, null] }, scope)).toBe(null)
    expect(evaluate({ '@coalesce': [null, null, null] }, scope)).toBe(null)
    expect(evaluate({ '@coalesce': [null, 'foo'] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': ['foo', null] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': [null, 'foo', null] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': [NaN] }, scope)).toBe(null)
    expect(evaluate({ '@coalesce': [null, NaN] }, scope)).toBe(null)
    expect(evaluate({ '@coalesce': [NaN, null] }, scope)).toBe(null)
    expect(evaluate({ '@coalesce': [NaN, 'foo'] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': ['foo', NaN] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': [NaN, 'foo', NaN] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': [[1], 'foo'] }, scope)).toStrictEqual([1])
    expect(evaluate({ '@coalesce': ['foo', [1]] }, scope)).toBe('foo')
    expect(evaluate({ '@coalesce': [[1], 'foo', [1]] }, scope)).toStrictEqual([1])
    expect(evaluate({ '@coalesce': [{ foo: 'bar' }, 'foo'] }, scope)).toStrictEqual({ foo: 'bar' })
    expect(evaluate({ '@coalesce': ['foo', { foo: 'bar' }] }, scope)).toBe('foo')
  })
})
