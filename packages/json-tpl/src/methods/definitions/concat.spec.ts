import { createObjectScope, evaluate } from '../../index'

describe('var', () => {
  const scope = createObjectScope({})

  it('should concatenate strings', () => {
    expect(evaluate({ $concat: [] }, scope)).toBe('')
    expect(evaluate({ $concat: ['foo'] }, scope)).toBe('foo')
    expect(evaluate({ $concat: ['foo', 'bar'] }, scope)).toBe('foobar')
    expect(evaluate({ $concat: ['foo', 'bar', 'baz'] }, scope)).toBe('foobarbaz')
  })

  it('should concatenate numbers', () => {
    expect(evaluate({ $concat: [1] }, scope)).toBe('1')
    expect(evaluate({ $concat: [1, 2] }, scope)).toBe('12')
    expect(evaluate({ $concat: [1, 2, 3] }, scope)).toBe('123')
  })

  it('should concatenate booleans', () => {
    expect(evaluate({ $concat: [true] }, scope)).toBe('true')
    expect(evaluate({ $concat: [false] }, scope)).toBe('false')
    expect(evaluate({ $concat: [true, false] }, scope)).toBe('truefalse')
  })

  it('should ignore nulls', () => {
    expect(evaluate({ $concat: [null] }, scope)).toBe('')
    expect(evaluate({ $concat: [null, null] }, scope)).toBe('')
    expect(evaluate({ $concat: [null, null, null] }, scope)).toBe('')
    expect(evaluate({ $concat: [null, 'foo'] }, scope)).toBe('foo')
    expect(evaluate({ $concat: ['foo', null] }, scope)).toBe('foo')
    expect(evaluate({ $concat: [null, 'foo', null] }, scope)).toBe('foo')
  })

  it('should ignore NaN', () => {
    expect(evaluate({ $concat: [NaN] }, scope)).toBe('')
    expect(evaluate({ $concat: [NaN, NaN] }, scope)).toBe('')
    expect(evaluate({ $concat: [NaN, NaN, NaN] }, scope)).toBe('')
    expect(evaluate({ $concat: [NaN, 'foo'] }, scope)).toBe('foo')
    expect(evaluate({ $concat: ['foo', NaN] }, scope)).toBe('foo')
    expect(evaluate({ $concat: [NaN, 'foo', NaN] }, scope)).toBe('foo')
  })

  it('should ignore arrays', () => {
    expect(evaluate({ $concat: [[1]] }, scope)).toBe('')
    expect(evaluate({ $concat: [[1], [1]] }, scope)).toBe('')
    expect(evaluate({ $concat: [[1], [1], [1]] }, scope)).toBe('')
    expect(evaluate({ $concat: [[1], 'foo'] }, scope)).toBe('foo')
    expect(evaluate({ $concat: ['foo', [1]] }, scope)).toBe('foo')
    expect(evaluate({ $concat: [[1], 'foo', [1]] }, scope)).toBe('foo')
  })

  it('should ignore objects', () => {
    expect(evaluate({ $concat: [{ foo: 'bar' }] }, scope)).toBe('')
    expect(evaluate({ $concat: [{ foo: 'bar' }, { foo: 'bar' }] }, scope)).toBe('')
    expect(evaluate({ $concat: [{ foo: 'bar' }, { foo: 'bar' }, { foo: 'bar' }] }, scope)).toBe('')
    expect(evaluate({ $concat: [{ foo: 'bar' }, 'foo'] }, scope)).toBe('foo')
    expect(evaluate({ $concat: ['foo', { foo: 'bar' }] }, scope)).toBe('foo')
    expect(evaluate({ $concat: [{ foo: 'bar' }, 'foo', { foo: 'bar' }] }, scope)).toBe('foo')
  })

  it('should ignore empty array slots', () => {
    expect(evaluate({ $concat: Array(0) }, scope)).toBe('')
    expect(evaluate({ $concat: Array(2) }, scope)).toBe('')
    expect(evaluate({ $concat: Array(123) }, scope)).toBe('')
    expect(evaluate({ $concat: Object.assign(Array(3), { 2: 'foo' }) }, scope)).toBe('foo')
  })

  it('should concatenate mixed values', () => {
    expect(evaluate({ $concat: [1, 'foo', true, null, NaN, [1], { foo: 'bar' }] }, scope)).toBe(
      '1footrue'
    )
  })
})
