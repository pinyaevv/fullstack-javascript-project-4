import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';

const compat = new FlatCompat({
  recommendedConfig: pluginJs.configs.recommended,
});

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest, // Добавляем Jest-глобалы корректно
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      import: importPlugin,
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules, // Подключаем правила Jest
      'max-len': ['error', { code: 120 }],
    },
  },
  ...compat.extends('airbnb-base'),
  {
    rules: {
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__filename', '__dirname'],
        },
      ],
      'import/extensions': [
        'error',
        {
          js: 'always',
        },
      ],
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'no-console': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
