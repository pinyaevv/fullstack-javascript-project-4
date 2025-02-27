import globals from 'globals';
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
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
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
  {
    env: {
      jest: true,
    },
  },
];
