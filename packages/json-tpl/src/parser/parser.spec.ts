import type { Json } from '../util/json.js'
import { parse as parseInternal } from './parser.js'

const parse = (input: string) =>
  parseInternal<Json>(input, {
    compileVariable: (name) => ({ '@var': name }),
    compileObjectGet: (object, path) => ({ '@get': object, path }),
    compileNegation: (value) => ({ '@not': value }),
    compileConcatenation: (values) => ({ '@concat': values }),
    compileValue: (value) => value,
    compileMethodCall: (id, argv, args) => ({ [`@${id}`]: argv, ...args }),
  })

const t = (input: string, output: unknown) =>
  test(JSON.stringify(input), () => {
    expect(parse(input)).toStrictEqual(output)
  })

const te = (input: string) =>
  test(JSON.stringify(input), () => {
    expect(() => parse(input)).toThrow()
  })

describe('valid expressions', () => {
  t('', '')
  t('1', '1')
  t('lorem ipsum', 'lorem ipsum')
  t('lorem $4 ipsum', 'lorem $4 ipsum')

  t("lorem ${ '${ foo }' } ipsum", { '@concat': ['lorem ', '${ foo }', ' ipsum'] })
  t('Hello, ${ foo }!', { '@concat': ['Hello, ', { '@var': 'foo' }, '!'] })
  t('${ foo } ${ bar }', { '@concat': [{ '@var': 'foo' }, ' ', { '@var': 'bar' }] })

  t('${ undefined }', undefined)
  t('${ null }', null)
  t('${ false }', false)
  t('${ true }', true)

  t('${ 3 }', 3)
  t('${ 3.4 }', 3.4)
  t('${ -3 }', -3)
  t('${ -3.4 }', -3.4)
  t('${ 0 }', 0)
  t('${ 0.0 }', 0)

  t("${ 'foo' }", 'foo')

  t('${ foo }', { '@var': 'foo' })
  t('${ $foo }', { '@var': '$foo' })
  t('${ $f$oo }', { '@var': '$f$oo' })
  t('${ $f$oo }', { '@var': '$f$oo' })
  t('${ __oo__ }', { '@var': '__oo__' })
  t('${ undefine }', { '@var': 'undefine' })

  t('${ foo.bar }', { '@get': { '@var': 'foo' }, path: ['bar'] })
  t('${ foo.true }', { '@get': { '@var': 'foo' }, path: ['true'] })
  t('${ foo.null }', { '@get': { '@var': 'foo' }, path: ['null'] })
  t('${ foo.undefined }', { '@get': { '@var': 'foo' }, path: ['undefined'] })
  t('${ foo.undefined }', { '@get': { '@var': 'foo' }, path: ['undefined'] })
  t('${ foo[bar] }', { '@get': { '@var': 'foo' }, path: [{ '@var': 'bar' }] })
  t('${ foo[0] }', { '@get': { '@var': 'foo' }, path: [0] })
  t('${ foo.bar.baz }', { '@get': { '@var': 'foo' }, path: ['bar', 'baz'] })
  t("${ foo[ 'bar'  ][ baz[1]  ][0] }", {
    '@get': { '@var': 'foo' },
    path: ['bar', { '@get': { '@var': 'baz' }, path: [1] }, 0],
  })

  t('${ ! foo }', { '@not': { '@var': 'foo' } })
  t('${ ! (foo) }', { '@not': { '@var': 'foo' } })
  t('${ !! (foo) }', { '@not': { '@not': { '@var': 'foo' } } })
  t('${ !! ((( ! (foo) ))) }', { '@not': { '@not': { '@not': { '@var': 'foo' } } } })

  t("${{ @var: 'foo' }}", {
    '@var': 'foo',
  })

  t("${{ @if: foo, then: bar, else: 'baz' }}", {
    '@if': { '@var': 'foo' },
    then: { '@var': 'bar' },
    else: 'baz',
  })

  t("${ foo ? bar : 'baz' }", {
    '@if': { '@var': 'foo' },
    then: { '@var': 'bar' },
    else: 'baz',
  })

  t("${ 'a' ? 'b' ? 'c' : 'd' : 'e' ? 'f' : 'g' }", {
    '@if': 'a',
    then: { '@if': 'b', then: 'c', else: 'd' },
    else: { '@if': 'e', then: 'f', else: 'g' },
  })

  t("${ 'a' ? ('b' ? 'c' : 'd') : ( 'e' ? 'f' : 'g') }", {
    '@if': 'a',
    then: { '@if': 'b', then: 'c', else: 'd' },
    else: { '@if': 'e', then: 'f', else: 'g' },
  })

  t("${ ! foo ? bar : 'baz' }", {
    '@if': { '@not': { '@var': 'foo' } },
    then: { '@var': 'bar' },
    else: 'baz',
  })

  t("${ !! foo[ ! 'bar'  ][ baz[1]  ][0] }", {
    '@not': {
      '@not': {
        '@get': { '@var': 'foo' },
        path: [
          {
            '@not': 'bar',
          },
          { '@get': { '@var': 'baz' }, path: [1] },
          0,
        ],
      },
    },
  })
})

describe('invalid expressions', () => {
  te('${ try }')
  te('${ eval }')
  te('${ await }')
  te('${ 1.2 ')
  te("${ ' }")
  te("${ '' ")
  te('${ aze }${')
  te('${ 9aze }')
  te('${ # }')
})
