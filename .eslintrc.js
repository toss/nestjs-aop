module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint', 'unused-imports'],
  rules: {
    // applied rules
    '@typescript-eslint/no-unused-vars': ['error'],
    'unused-imports/no-unused-imports-ts': 'error',
    'prefer-const': 'error',
    curly: ['error', 'all'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-warning-comments': [
      'warn',
      { terms: ['TODO', 'FIXME', 'XXX', 'BUG', 'NOTE'], location: 'anywhere' },
    ],

    // ignore belows
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // 모노래포 내에서 subpathing 하기 위해서 필요함
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    // 데코레이터, 외부 소스등 각종 네이밍컨벤션을 강제하지 못할 때가 있음
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // 네임스페이스 활용하기로 결정
    '@typescript-eslint/no-namespace': 'off',
  },
};
