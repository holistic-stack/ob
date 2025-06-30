// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// ESLint 9 flat config for openscad-babylon package
// Aligned with TypeScript 5.8 guidelines, React 19, and bulletproof-react architecture
// Enforces strict type safety, Result<T,E> patterns, and TDD methodology
// Follows docs/typescript-guidelines.md specifications
//
// Configuration Philosophy:
// 1. Strict type safety - no 'any' types except for Three.js WebGL mocking
// 2. TDD methodology - real implementations preferred over mocks
// 3. Bulletproof-react architecture - functional programming patterns
// 4. Performance targets - <16ms render times, 300ms debouncing
// 5. Error handling - Result<T,E> patterns for robust error management
// 6. Logging patterns - [INIT]/[DEBUG]/[ERROR]/[WARN]/[END] conventions
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
      // TypeScript 5.8 specific parser options
      warnOnUnsupportedTypeScriptVersion: false, // Allow newer TS versions
      createDefaultProgram: false, // Performance optimization
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
    // TypeScript ESLint recommended rules with strict type safety
    ...tseslint.configs.recommended.rules,

    // TypeScript 5.8 strict rules aligned with docs/typescript-guidelines.md
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error', // Critical for type safety
    '@typescript-eslint/explicit-function-return-type': 'off', // Allow inference for simple cases
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow inference for exports
    '@typescript-eslint/prefer-nullish-coalescing': 'error', // Enforce ?? over ||
    '@typescript-eslint/prefer-optional-chain': 'error', // Enforce ?. over && chains
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error', // Strict - use proper type guards
    '@typescript-eslint/no-unsafe-assignment': 'error', // Essential for type safety
    '@typescript-eslint/no-unsafe-member-access': 'error', // Essential for type safety
    '@typescript-eslint/no-unsafe-call': 'error', // Essential for type safety
    '@typescript-eslint/no-unsafe-return': 'error', // Essential for type safety
    '@typescript-eslint/no-unsafe-argument': 'error', // Essential for type safety
    '@typescript-eslint/require-await': 'error', // Prevent unnecessary async
    '@typescript-eslint/no-floating-promises': 'error', // Critical for async safety
    '@typescript-eslint/no-misused-promises': 'error', // Critical for async safety
    '@typescript-eslint/no-base-to-string': 'error', // Prevent [object Object] bugs

    // Additional strict rules for bulletproof-react architecture
    '@typescript-eslint/no-unnecessary-condition': 'warn', // Detect unreachable conditions
    '@typescript-eslint/prefer-readonly': 'warn', // Encourage immutability
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for React props
    '@typescript-eslint/switch-exhaustiveness-check': 'error', // Ensure exhaustive switches
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // Prefer interfaces
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }], // Separate type imports

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
    'react/no-unknown-property': [
      'error',
      {
        ignore: [
          // Three.js / React Three Fiber properties
          'intensity', 'position', 'rotation', 'scale', 'args', 'attach',
          'castShadow', 'receiveShadow', 'transparent', 'wireframe',
          // Shadow properties
          'shadow-mapSize-width', 'shadow-mapSize-height',
          'shadow-camera-far', 'shadow-camera-left', 'shadow-camera-right',
          'shadow-camera-top', 'shadow-camera-bottom', 'shadow-camera-near',
          // Material properties
          'color', 'emissive', 'specular', 'shininess', 'opacity',
          'alphaTest', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
          'envMap', 'lightMap', 'normalMap', 'roughnessMap', 'metalnessMap',
          // Geometry properties
          'vertices', 'faces', 'morphTargets', 'morphNormals',
          // Animation properties
          'mixer', 'action', 'clip', 'loop', 'clampWhenFinished',
          // Other common R3F properties
          'object', 'primitive', 'dispose', 'raycast', 'onClick',
          'onPointerOver', 'onPointerOut', 'onPointerDown', 'onPointerUp'
        ]
      }
    ],

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

    // General JavaScript/TypeScript rules aligned with bulletproof-react architecture
    'no-console': 'off', // Allow console for logging patterns [INIT]/[DEBUG]/[ERROR]/[WARN]/[END]
    'no-debugger': 'warn', // Allow debugger in development
    'no-var': 'error', // Enforce const/let
    'prefer-const': 'error', // Enforce immutability where possible
    'eqeqeq': ['error', 'always'], // Strict equality
    'curly': ['error', 'all'], // Always use braces
    'no-duplicate-imports': 'error', // Clean imports
    'no-unused-expressions': 'error', // Prevent dead code
    'prefer-template': 'warn', // Encourage template literals
    'object-shorthand': 'warn', // Encourage modern syntax

    // Project-specific patterns for OpenSCAD-Babylon
    'no-throw-literal': 'error', // Use proper Error objects
    'prefer-promise-reject-errors': 'error', // Proper promise rejection
    'no-return-await': 'error', // Unnecessary await in return
    'require-atomic-updates': 'error', // Prevent race conditions
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

    // Selective rule relaxation - only for Three.js WebGL mocking
    // Following project guideline: "DO NOT USE MOCK, AVOID MOCKS, MOCK ONLY three.js webgl"
    '@typescript-eslint/no-explicit-any': 'warn', // Allow for Three.js WebGL mocking only
    '@typescript-eslint/no-non-null-assertion': 'warn', // Allow for test assertions
    '@typescript-eslint/no-unsafe-assignment': 'warn', // Allow for Three.js WebGL mocking only
    '@typescript-eslint/no-unsafe-member-access': 'warn', // Allow for Three.js WebGL mocking only
    '@typescript-eslint/no-unsafe-call': 'warn', // Allow for Three.js WebGL mocking only
    '@typescript-eslint/no-unsafe-return': 'warn', // Allow for Three.js WebGL mocking only

    // Maintain strict rules for non-WebGL test code
    '@typescript-eslint/prefer-nullish-coalescing': 'error', // Keep strict in tests
    '@typescript-eslint/prefer-optional-chain': 'error', // Keep strict in tests
    '@typescript-eslint/no-floating-promises': 'error', // Critical in async tests
    '@typescript-eslint/no-misused-promises': 'error', // Critical in async tests

    // Development convenience in tests
    'no-console': 'off', // Allow console for test debugging
    'import/no-unused-modules': 'off', // Test files might not export anything

    // React testing rules
    'react/display-name': 'off', // Not needed in tests
  },
}, // Three.js WebGL specific test files - relaxed rules for mocking
{
  files: [
    '**/*three*.test.ts',
    '**/*three*.test.tsx',
    '**/*webgl*.test.ts',
    '**/*webgl*.test.tsx',
    '**/*babylon*.test.ts',
    '**/*babylon*.test.tsx',
    '**/*r3f*.test.ts',
    '**/*r3f*.test.tsx',
    '**/3d-renderer/**/*.test.ts',
    '**/3d-renderer/**/*.test.tsx'
  ],
  languageOptions: {
    parser: tsparser,
    globals: {
      ...globals.browser,
      ...globals.es2022,
      ...globals.vitest,
      vi: 'readonly',
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    vitest,
  },
  rules: {
    // Relaxed rules specifically for Three.js WebGL mocking
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for WebGL mocking
    '@typescript-eslint/no-unsafe-assignment': 'off', // Allow for WebGL mocking
    '@typescript-eslint/no-unsafe-member-access': 'off', // Allow for WebGL mocking
    '@typescript-eslint/no-unsafe-call': 'off', // Allow for WebGL mocking
    '@typescript-eslint/no-unsafe-return': 'off', // Allow for WebGL mocking
    '@typescript-eslint/no-non-null-assertion': 'off', // Allow for WebGL mocking
    'no-console': 'off', // Allow console for debugging WebGL tests
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
