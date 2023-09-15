import type { Json } from './util/json.js'
import { createObjectScope, evaluate, compile } from './index.js'

describe('compare', () => {
  const scope = createObjectScope({})

  const compare = (template: Json) => {
    expect(compile(template, { onError: false })(scope)).toStrictEqual(evaluate(template, scope))
  }

  it('should compile and evaluate "null" templates identically', () => {
    compare(null)
  })

  it('should compile and evaluate "boolean" templates identically', () => {
    compare(true)
    compare(false)
  })

  it('should compile and evaluate "number" templates identically', () => {
    compare(1)
    compare(0)
    compare(NaN)
  })

  it('should compile and evaluate "string" templates identically', () => {
    compare('')
    compare('foo')
    compare('foo.bar')
    compare('foo.bar.baz')
    compare('foo.bar.baz.qux')
    compare('foo[0]')
    compare('foo[0][1]')
  })

  it('should compile and evaluate "array" templates identically', () => {
    compare([])
    compare([1, 2, 3])
    compare([1, 2, NaN])
    compare([1, NaN, 3])
    compare(Array(3))
    compare([1, 2, [3, 4]])
  })

  it('should compile and evaluate "object" templates identically', () => {
    compare({})
    compare({ foo: 'bar' })
    compare({ foo: { bar: 'baz', a: { A: 3 } } })
    compare({ foo: 'bar', nuu: null })
    compare({ foo: 'bar', und: undefined })
    compare({ foo: 'bar', nan: NaN })
  })

  it('should compile and evaluate "$call" templates identically', () => {
    compare({ '@call': 'if', argv: true, args: { then: 'foo', else: 'bar' } })
  })
})
