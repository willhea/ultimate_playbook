import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'dist-single', 'test-results', 'playwright-report', 'node_modules', '.stryker-tmp', 'reports', 'screenshots'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.mjs', '*.config.{ts,js}', 'src/test/**/*.ts', 'src/**/*.test.ts'],
    languageOptions: { globals: globals.node },
  },
);
