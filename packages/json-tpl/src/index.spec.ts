import type { Json } from './util/json'
import { createObjectScope, evaluate, compile, standardize, evaluateStandardized } from './index'

describe('evaluate', () => {
  const scope = createObjectScope({})

  const compareEvaluate = (template: Json, expected: undefined | Json) => {
    expect(evaluate(template, scope)).toEqual(expected)
  }

  const compateCompile = (template: Json, expected: undefined | Json) => {
    const compiled = compile(template)
    expect(compiled(scope)).toEqual(expected)
  }

  const compateStandardize = (template: Json, expected: undefined | Json) => {
    const standardized = standardize(template)
    expect(standardized).not.toBe(undefined)
    expect(evaluateStandardized(standardized as Json, scope)).toEqual(expected)
  }

  const compare = (template: Json, expected: undefined | Json) => {
    compareEvaluate(template, expected)
    compateCompile(template, expected)
    compateStandardize(template, expected)
  }

  it('should evaluate "null" template', () => {
    compare(null, null)
  })

  it('should evaluate "boolean" template', () => {
    compare(true, true)
    compare(false, false)
  })

  it('should evaluate "number" template', () => {
    compare(1, 1)
    compare(0, 0)
    compare(NaN, undefined)
  })

  it('should evaluate "string" template', () => {
    compare('', '')
    compare('foo', 'foo')
    compare('foo.bar', 'foo.bar')
    compare('foo.bar.baz', 'foo.bar.baz')
    compare('foo.bar.baz.qux', 'foo.bar.baz.qux')
    compare('foo[0]', 'foo[0]')
    compare('foo[0][1]', 'foo[0][1]')
  })

  it('should evaluate "array" template', () => {
    compare([], [])
    compare([1, 2, 3], [1, 2, 3])
    compare([1, 2, NaN], [1, 2, null])
    compare([1, NaN, 3], [1, null, 3])
    compare(Array(3), [null, null, null])
    compare([1, 2, [3, 4]], [1, 2, [3, 4]])
  })

  it('should evaluate "object" template', () => {
    compare({}, {})
    compare({ foo: 'bar' }, { foo: 'bar' })
    compare({ foo: { bar: 'baz', a: { A: 3 } } }, { foo: { bar: 'baz', a: { A: 3 } } })
    compare({ foo: 'bar', nuu: null }, { foo: 'bar', nuu: null })
    compare({ foo: 'bar', und: undefined }, { foo: 'bar' })
    compare({ foo: 'bar', nan: NaN }, { foo: 'bar' })
  })
})
