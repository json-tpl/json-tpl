/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '\\.ts$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    './parser.js': '../../dist/cjs/parser/parser.js',
    '(.+)\\.js': '$1',
  },
}
