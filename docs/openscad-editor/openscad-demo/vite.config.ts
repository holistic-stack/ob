/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/openscad-demo',

  plugins: [
    react(),
    nxViteTsPaths(),
    // Monaco Editor plugin with explicit worker configuration
    (monacoEditorPlugin as any).default({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'],
      publicPath: 'assets',
      customWorkers: [
        {
          label: 'editorWorkerService',
          entry: 'monaco-editor/esm/vs/editor/editor.worker.js',
        },
      ],
    }),
  ],

  // Build configuration for React web application
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  // Configure WASM file serving for Vite 6.x
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public',

  // Development server configuration
  server: {
    port: 4200,
    host: 'localhost',
    fs: {
      allow: ['..', '../..'], // Allow access to parent directories for monorepo
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  // Preview server configuration
  preview: {
    port: 4300,
    host: 'localhost',
  },

  // Global definitions for Vite 6.x
  define: {
    global: 'globalThis',
  },

  // Dependency optimization
  optimizeDeps: {
    exclude: [
      '@openscad/parser',
      '@openscad/editor',
      '@openscad/tree-sitter-openscad',
    ],
    include: [
      'react',
      'react-dom',
      'monaco-editor',
      '@monaco-editor/react',
    ],
  },

  // Vitest configuration
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest/packages/openscad-demo',
    },
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/openscad-demo',
      provider: 'v8' as const,
    },
    watch: false,
    // Handle Monaco Editor and WASM files in test environment
    server: {
      deps: {
        inline: ['monaco-editor', '@monaco-editor/react', '@openscad/editor'],
      },
    },
    // Mock problematic modules in test environment
    alias: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js',
    },
  },
}));
