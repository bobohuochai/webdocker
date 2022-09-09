module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/prefer-interface': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    'no-return-assign': 0,
    semi: ['error', 'always'],
    'no-confusing-arrow': 0,
    'no-console': 0,
    'max-len': ['error', { code: 120, ignoreComments: true, ignoreStrings: true }],
    // https://github.com/prettier/prettier/issues/3847
    'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'no-prototype-builtins': 0,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'no-eval': 0,
    'import/prefer-default-export': 0,
    // https://github.com/eslint/eslint/issues/13956
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
