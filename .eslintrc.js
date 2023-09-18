module.exports = {
  root: true,

  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaFeatures: {
      globalReturn: false,
      impliedStrict: true,
    },
  },

  extends: [
    './lib/eslint-rules/recommended',
    './lib/eslint-rules/import',
    './lib/eslint-rules/regexp',
    './lib/eslint-rules/typescript',
  ],

  env: {
    es2021: true,
    'shared-node-browser': true,
  },

  ignorePatterns: ['node_modules/**/*', '**/dist/**/*'],
  overrides: [
    {
      files: ['./**/*.js'],
      env: { node: true },
    },
    {
      files: ['./**/*.mjs'],
      env: { node: true },
    },
    {
      files: ['./**/*.cjs'],
      env: { node: true, commonjs: true },
    },
    {
      files: './**/*.spec.ts',
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
  ],
}
