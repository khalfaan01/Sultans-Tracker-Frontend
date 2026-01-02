// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    // Ignore patterns
    ignores: ['dist', 'node_modules', '*.config.js'],
  },
  {
    // Apply to all JS/JSX files
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Setup plugins
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    // Apply rules
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // We're using TypeScript or not enforcing prop-types
      
      // Custom rules
      'no-unused-vars': [
        'warn',
        { 
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_'
        }
      ],
      
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
    // React settings
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]