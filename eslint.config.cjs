const globals = require('globals');
const jestPlugin = require('eslint-plugin-jest');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      jest: jestPlugin,
      import: importPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__filename', '__dirname'],
        },
      ],
      'object-curly-newline': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
        },
      ],
      'no-console': 'off',
    },
  },
];
