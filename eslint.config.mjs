import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintPluginJest from 'eslint-plugin-jest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        beforeEach: 'readonly',
        afterEach: 'readonly',
        test: 'readonly',
        expect: 'readonly',
      },
    },
  },
  pluginJs.configs.recommended,
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
