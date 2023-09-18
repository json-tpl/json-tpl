import { createObjectScope, evaluate } from 'json-tpl'

const scope = createObjectScope({
  name: 'World',
})

console.log(evaluate({ '@concat': ['Hello, ', { '@var': 'name' }, '!'] }, scope))
