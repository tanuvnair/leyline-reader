import {plugin as shadcn} from '@shadcn/lint';
import tsParser from '@typescript-eslint/parser';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      '**/dist/**',
      '**/dist-electron/**',
      '**/release/**',
      '**/node_modules/**',
      '**/build/**',
      '**/.agents/**',
      '**/.cursor/skills/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {jsx: true},
        sourceType: 'module',
      },
    },
    plugins: {shadcn},
    rules: {
      'shadcn/no-restyle': 'error',
      'shadcn/no-raw-colors': 'error',
      'shadcn/no-arbitrary-values': 'error',
      'shadcn/no-inline-styles': 'error',
      'shadcn/no-unknown-classes': 'error',
      'shadcn/require-static-classes': 'error',
    },
  },
  {
    // Generated shadcn primitives own their tokens/classes (official CLI output).
    files: ['src/components/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'shadcn/no-restyle': 'off',
      'shadcn/no-arbitrary-values': 'off',
      'shadcn/no-unknown-classes': 'off',
      'shadcn/no-inline-styles': 'off',
      // Official CLI output uses cva wrappers that fail this rule.
      'shadcn/require-static-classes': 'off',
    },
  },
]);
