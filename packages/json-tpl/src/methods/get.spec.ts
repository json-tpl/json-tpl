import { createObjectScope, evaluate } from '../index'

describe('get', () => {
  const scope = createObjectScope({
    foo: 'bar',
    bar: 'baz',
    date: new Date('2021-11-21T01:32:21.543Z'),
    basicObject: {
      a: 1,
      foo: { bar: 'baz' },
    },
    someObject: {
      a: 1,
      foo: { bar: 'baz' },
      arr: [1, { g: 5 }],
      date: new Date('2021-11-21T01:32:21.543Z'),
    },
  })

  it('should behave as an identity function when the path is empty', () => {
    // Using plain Json input
    expect(evaluate({ '@get': 'foo', path: [] }, scope)).toBe('foo')
    expect(evaluate({ '@get': 12, path: [] }, scope)).toBe(12)
    expect(evaluate({ '@get': true, path: [] }, scope)).toBe(true)
    expect(evaluate({ '@get': null, path: [] }, scope)).toBe(null)
    expect(evaluate({ '@get': [1, 2], path: [] }, scope)).toStrictEqual([1, 2])
    expect(evaluate({ '@get': { a: 1 }, path: [] }, scope)).toStrictEqual({ a: 1 })

    expect(evaluate({ '@get': { '@var': 'baz' }, path: [] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { '@var': 'true' }, path: [] }, scope)).toBe(true)
    expect(evaluate({ '@get': { '@var': 'false' }, path: [] }, scope)).toBe(false)
    expect(evaluate({ '@get': { '@var': 'null' }, path: [] }, scope)).toBe(null)
    expect(evaluate({ '@get': { '@var': 'undefined' }, path: [] }, scope)).toBe(undefined)

    // Using scope variables
    expect(evaluate({ '@get': { '@var': 'foo' }, path: [] }, scope)).toBe('bar')
    expect(evaluate({ '@get': { '@var': 'date' }, path: [] }, scope)).toBe(
      '2021-11-21T01:32:21.543Z'
    )
    expect(evaluate({ '@get': { '@var': 'basicObject' }, path: [] }, scope)).toStrictEqual({
      a: 1,
      foo: { bar: 'baz' },
    })
  })

  it('should return undefined when extracting from invalid values', () => {
    expect(evaluate({ '@get': 'foo', path: ['a'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': 12, path: ['a'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': true, path: ['a'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': null, path: ['a'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': NaN, path: ['a'] }, scope)).toBe(undefined)

    expect(evaluate({ '@get': { '@var': 'baz' }, path: [1] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { '@var': 'true' }, path: [1] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { '@var': 'false' }, path: [1] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { '@var': 'null' }, path: [1] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { '@var': 'undefined' }, path: [1] }, scope)).toBe(undefined)
  })

  it('should read simple array items', () => {
    expect(evaluate({ '@get': ['foo', 'bar'], path: [0] }, scope)).toBe('foo')
    expect(evaluate({ '@get': ['foo', 'bar'], path: [1] }, scope)).toBe('bar')
    expect(evaluate({ '@get': ['foo', 'bar'], path: [2] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: [Number.MAX_VALUE] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: [Infinity] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: [NaN] }, scope)).toBe(undefined)

    expect(evaluate({ '@get': [{ a: ['foo'] }, 'bar'], path: [0] }, scope)).toStrictEqual({
      a: ['foo'],
    })
  })

  it('should read negative array indexes from the end', () => {
    expect(evaluate({ '@get': ['foo', 'bar'], path: [-1] }, scope)).toBe('bar')
    expect(evaluate({ '@get': ['foo', 'bar'], path: [-2] }, scope)).toBe('foo')
    expect(evaluate({ '@get': ['foo', 'bar'], path: [-3] }, scope)).toBe(undefined)
  })

  it('should be able to access array length', () => {
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['length'] }, scope)).toBe(2)
    expect(evaluate({ '@get': [1, ['foo', 'bar', 2, 3]], path: [1, 'length'] }, scope)).toBe(4)
    expect(
      evaluate({ '@get': { a: 1, b: ['foo', 'bar', 2, 3] }, path: ['b', 'length'] }, scope)
    ).toBe(4)
  })

  it('should be able to access string length', () => {
    expect(evaluate({ '@get': 'foo', path: ['length'] }, scope)).toBe(3)
    expect(evaluate({ '@get': [['bar']], path: [0, 0, 'length'] }, scope)).toBe(3)
    expect(evaluate({ '@get': [['bar']], path: [0, 0, 'length', 2] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { a: 1, b: [['bar']] }, path: ['b', 0, 0, 'length'] }, scope)).toBe(3)
  })

  it('should read nested array items', () => {
    expect(evaluate({ '@get': [['foo', 'bar']], path: [0, 0] }, scope)).toBe('foo')
    expect(evaluate({ '@get': [['foo', 'bar']], path: [0, 1] }, scope)).toBe('bar')
    expect(evaluate({ '@get': [['foo', 'bar']], path: [0, 2] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': [['foo', 'bar']], path: [0, Number.MAX_VALUE] }, scope)).toBe(
      undefined
    )
    expect(evaluate({ '@get': [['foo', 'bar']], path: [0, Infinity] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': [['foo', 'bar']], path: [0, NaN] }, scope)).toBe(undefined)
  })

  it('should read path from objects', () => {
    expect(evaluate({ '@get': { foo: 'bar' }, path: ['foo'] }, scope)).toBe('bar')
    expect(
      evaluate(
        { '@get': { foo: { bar: [{ baz: 'qux' }] } }, path: ['foo', 'bar', 0, 'baz'] },
        scope
      )
    ).toBe('qux')

    expect(evaluate({ '@get': { '@var': 'someObject' }, path: ['arr', 1, 'g'] }, scope)).toBe(5)
  })

  it('should cast numbers to strings when reading from objects', () => {
    expect(evaluate({ '@get': { '0': 'bar' }, path: ['0'] }, scope)).toBe('bar')
    expect(evaluate({ '@get': { '0': 'bar' }, path: [0] }, scope)).toBe('bar')
    expect(evaluate({ '@get': { '0.1': 'bar' }, path: [0.1] }, scope)).toBe('bar')
    expect(evaluate({ '@get': { '0': 'bar' }, path: [1] }, scope)).toBe(undefined)
  })

  it('should cast strings to numbers when reading from arrays', () => {
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['0'] }, scope)).toBe('foo')
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['-1'] }, scope)).toBe('bar')
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['0.0'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['0.1'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['1'] }, scope)).toBe('bar')
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['2'] }, scope)).toBe(undefined)
  })

  it('should ignore __proto__ path', () => {
    expect(evaluate({ '@get': { __proto__: 'bar' }, path: ['__proto__'] }, scope)).toBe(undefined)
    expect(
      evaluate({ '@get': { foo: { __proto__: 'bar' } }, path: ['foo', '__proto__'] }, scope)
    ).toBe(undefined)
    expect(evaluate({ '@get': { foo: { __proto__: 'bar' } }, path: ['foo', 'bar'] }, scope)).toBe(
      undefined
    )
  })

  it('should return undefined for invalid paths', () => {
    expect(evaluate({ '@get': { foo: 'bar' }, path: [0] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { foo: 'bar' }, path: [1] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { null: 'bar' }, path: [null] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { null: 'bar' }, path: [NaN] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { undefined: 'bar' }, path: [{ '@var': 'undefined' }] }, scope)).toBe(
      undefined
    )
    expect(evaluate({ '@get': { foo: 'bar' }, path: [Infinity] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { foo: 'bar' }, path: [Number.MAX_VALUE] }, scope)).toBe(undefined)

    expect(evaluate({ '@get': { foo: 'bar' }, path: ['bar'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { foo: 'bar' }, path: ['bar', 'baz'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { foo: 'bar' }, path: ['foo', 'baz'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { foo: { bar: 'baz' } }, path: ['foo', 'bar'] }, scope)).toBe('baz')
    expect(evaluate({ '@get': { foo: { bar: 'baz' } }, path: ['foo', 'baz'] }, scope)).toBe(
      undefined
    )
    expect(evaluate({ '@get': { foo: { bar: 'baz' } }, path: ['foo', 'bar', 'baz'] }, scope)).toBe(
      undefined
    )

    expect(evaluate({ '@get': ['foo', 'bar'], path: [0, 0] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: [0, 'bar'] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': ['foo', 'bar'], path: ['bar', 0] }, scope)).toBe(undefined)
    expect(evaluate({ '@get': { foo: 'bar' }, path: ['foo', 'bar'] }, scope)).toBe(undefined)
  })
})
