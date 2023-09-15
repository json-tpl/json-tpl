module.exports = {
  root: true,
  extends: ['./lib/eslint-config'],
  ignorePatterns: ['node_modules/**/*', '**/dist/**/*'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ['./**/*.js'],
      env: { node: true },
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
