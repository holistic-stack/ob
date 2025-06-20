// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// ESLint 9 flat config for openscad-babylon package
// Optimized for TypeScript 5.8, React 19, and modern development practices
// Focused on essential rules for development productivity
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import playwright from 'eslint-plugin-playwright';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';

export default [// Base JavaScript configuration
js.configs.recommended, // Ignore patterns - comprehensive and specific
{
  ignores: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '*.config.{js,ts,mjs}',
    'public/**',
    '.vite/**',
  ],
}, // Playwright configuration - only for E2E test files
{
  ...playwright.configs['flat/recommended'],
  files: ['e2e/**/*.ts', 'e2e/**/*.js', '**/*.e2e.ts', '**/*.e2e.js'],
}, // TypeScript and React configuration
{
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.lib.json', // Use lib config that includes src files
      tsconfigRootDir: import.meta.dirname,
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.es2022,
      ...globals.node, // Keep node globals for Vite config etc.
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'react-refresh': reactRefreshPlugin,
    'jsx-a11y': jsxA11yPlugin,
    import: importPlugin,
  },
  settings: {
    react: {
      version: '19.0', // Explicitly set React 19
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.lib.json', './tsconfig.spec.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // TypeScript ESLint v8 recommended rules (relaxed for development)
    ...tseslint.configs.recommended.rules,

    // TypeScript specific rules for v5.8 (development-friendly)
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Relaxed to warn
    '@typescript-eslint/prefer-optional-chain': 'warn', // Relaxed to warn
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'off', // Too strict for development
    '@typescript-eslint/no-unsafe-member-access': 'off', // Too strict for development
    '@typescript-eslint/no-unsafe-call': 'off', // Too strict for development
    '@typescript-eslint/no-unsafe-return': 'off', // Too strict for development
    '@typescript-eslint/no-unsafe-argument': 'off', // Too strict for development
    '@typescript-eslint/require-await': 'off', // Too strict for development
    '@typescript-eslint/no-floating-promises': 'warn', // Important but not blocking
    '@typescript-eslint/no-misused-promises': 'warn', // Important but not blocking
    '@typescript-eslint/no-base-to-string': 'warn', // Important but not blocking

    // React 19 specific rules
    ...reactPlugin.configs.recommended.rules,
    ...reactPlugin.configs['jsx-runtime'].rules,
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react/prop-types': 'off', // Using TypeScript for prop types
    'react/jsx-uses-react': 'off', // Not needed with new JSX transform
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react/jsx-no-useless-fragment': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],

    // React Hooks rules (temporarily disabled due to ESLint 9 compatibility)
    // Note: react-hooks plugin has compatibility issues with ESLint 9
    // 'react-hooks/rules-of-hooks': 'error',
    // 'react-hooks/exhaustive-deps': 'warn',

    // React Refresh rules for development
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Accessibility rules
    ...jsxA11yPlugin.configs.recommended.rules,

    // Import/Export rules (simplified for development)
    'import/order': 'off', // Disabled - too strict for development
    'import/no-duplicates': 'off', // Disabled - causes resolver issues
    'import/no-unused-modules': 'off', // Disabled for development
    'import/no-cycle': 'off', // Disabled - causes resolver issues

    // General JavaScript/TypeScript rules (development-friendly)
    'no-console': 'off', // Allow console for development/debugging
    'no-debugger': 'warn', // Allow debugger in development
    'no-var': 'error',
    'prefer-const': 'warn',
    'eqeqeq': ['warn', 'always'],
    'curly': ['warn', 'all'],
    'no-duplicate-imports': 'warn',
    'no-unused-expressions': 'warn',
    'prefer-template': 'off', // Disabled for development flexibility
    'object-shorthand': 'off', // Disabled for development flexibility
  },
}, // Test files configuration (Vitest)
{
  files: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.spec.json', // Use spec config for test files
      tsconfigRootDir: import.meta.dirname,
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.es2022,
      ...globals.vitest,
      vi: 'readonly', // Add vi global for vitest
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    vitest,
    react: reactPlugin,
  },
  rules: {
    // Vitest specific rules
    ...vitest.configs.recommended.rules,
    'vitest/expect-expect': 'error',
    'vitest/no-disabled-tests': 'warn',
    'vitest/no-focused-tests': 'error',
    'vitest/prefer-to-be': 'warn',
    'vitest/prefer-to-have-length': 'warn',

    // Relaxed rules for tests
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    'no-console': 'off', // Allow console in tests
    'import/no-unused-modules': 'off', // Test files might not export anything

    // React testing rules
    'react/display-name': 'off', // Not needed in tests
  },
}, // Configuration files and build scripts
{
  files: [
    '*.config.{js,ts,mjs}',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'playwright-ct.config.ts',
    '**/test-setup.ts',
    '**/vitest-setup.ts',
    'scripts/**/*.ts',
  ],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.vitest, // Add vitest globals for setup files
      vi: 'readonly', // Add vi global for vitest
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    'no-console': 'off',
    'import/no-unused-modules': 'off',
  },
}, // Prettier integration - must be last to override conflicting rules
prettierConfig, ...storybook.configs["flat/recommended"]];
