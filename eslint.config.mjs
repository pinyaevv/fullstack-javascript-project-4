import pluginJs from '@eslint/js';
import eslintPluginJest from 'eslint-plugin-jest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  pluginJs.configs.recommended,
  {
    overrides: [
      {
        files: ['**/__tests__/**/*.js'],
        languageOptions: {
          env: {
            jest: true,
            node: true,
          },
        },
      },
    ],
  },
  {
    plugins: {
      jest: eslintPluginJest,
    },
    rules: {
      'jest/consistent-test-it': 'warn',
      'jest/no-disabled-tests': 'warn',
    },
  },
];
