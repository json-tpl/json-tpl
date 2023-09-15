import { toJson } from './json.js'

describe('toJson', () => {
  test('undefined', () => {
    expect(toJson(undefined)).toBe(undefined)
  })

  test('null', () => {
    expect(toJson(null)).toBe(null)
  })

  test('boolean', () => {
    expect(toJson(true)).toBe(true)
    expect(toJson(false)).toBe(false)
  })

  test('number', () => {
    expect(toJson(1)).toBe(1)
    expect(toJson(0)).toBe(0)
    expect(toJson(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER)
    expect(toJson(NaN)).toBe(undefined)
    expect(toJson(Infinity)).toBe(undefined)
    expect(toJson(-Infinity)).toBe(undefined)
  })

  test('bigint', () => {
    expect(toJson(BigInt(1))).toBe(Number(1))
    expect(toJson(BigInt(0))).toBe(Number(0))
    expect(toJson(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER)
    expect(toJson(BigInt(Number.MAX_SAFE_INTEGER) * 2000n)).toBe(undefined)
  })

  test('string', () => {
    expect(toJson('')).toBe('')
    expect(toJson('foo')).toBe('foo')
    expect(toJson('foo.bar')).toBe('foo.bar')
    expect(toJson('foo.bar.baz')).toBe('foo.bar.baz')
    expect(toJson('foo.bar.baz.qux')).toBe('foo.bar.baz.qux')
    expect(toJson('foo[0]')).toBe('foo[0]')
  })

  test('array', () => {
    expect(toJson([])).toStrictEqual([])
    expect(toJson([1, 2, 3])).toStrictEqual([1, 2, 3])
    expect(toJson([1, undefined, 3])).toStrictEqual([1, null, 3])
    expect(toJson([1, 'foo', true, undefined])).toStrictEqual([1, 'foo', true, null])
    expect(toJson([1, 'foo', NaN, undefined])).toStrictEqual([1, 'foo', null, null])
    expect(toJson([1, 'foo', true, null])).toStrictEqual([1, 'foo', true, null])
    expect(toJson([1, [2, [3]]])).toStrictEqual([1, [2, [3]]])
  })

  test('object', () => {
    expect(toJson({})).toStrictEqual({})
    expect(toJson({ foo: 'bar' })).toStrictEqual({ foo: 'bar' })
    expect(toJson({ foo: 'bar', baz: undefined })).toStrictEqual({ foo: 'bar' })
    expect(toJson({ foo: 'bar', baz: NaN })).toStrictEqual({ foo: 'bar' })
    expect(toJson({ foo: 'bar', baz: null })).toStrictEqual({ foo: 'bar', baz: null })
    expect(toJson({ foo: 'bar', baz: { qux: 'quux' } })).toStrictEqual({
      foo: 'bar',
      baz: { qux: 'quux' },
    })
  })

  test('function', () => {
    expect(toJson(() => 1)).toBe(undefined)
    expect(toJson({ foo: () => 'foo' })).toStrictEqual({})
  })

  test('jsonifiable (custom)', () => {
    expect(toJson({ toJSON: () => 'foo' })).toBe('foo')
    expect(toJson({ foo: { toJSON: () => 'bar' } })).toStrictEqual({ foo: 'bar' })
    expect(toJson({ foo: { toJSON: () => [1, 2] } })).toStrictEqual({ foo: [1, 2] })
  })

  test('Buffer', () => {
    expect(toJson(Buffer.from('foo'))).toMatchObject({ type: 'Buffer', data: [102, 111, 111] })
  })

  test('Date', () => {
    expect(toJson(new Date(123432423e3))).toStrictEqual('1973-11-29T14:47:03.000Z')
    expect(toJson({ date: new Date(123432423e3) })).toStrictEqual({
      date: '1973-11-29T14:47:03.000Z',
    })
  })

  test('mixed', () => {
    expect(toJson([1, 'foo', { bar: 'baz' }, [2, 3]])).toStrictEqual([
      1,
      'foo',
      { bar: 'baz' },
      [2, 3],
    ])
    expect(toJson({ foo: 'bar', baz: [1, 2, 3], qux: { quux: 'quuz' } })).toStrictEqual({
      foo: 'bar',
      baz: [1, 2, 3],
      qux: { quux: 'quuz' },
    })
  })
})
