/// <reference types='vitest' />
import { defineConfig, type LibraryFormats } from 'vite';
import dts from 'vite-plugin-dts';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
// Monaco Editor plugin and copy assets plugin removed for library build - handled by consuming application

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/openscad-editor',

  plugins: [
    react(),
    nxViteTsPaths(),
    // Monaco Editor plugin removed - handled by consuming application
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
      outDir: resolve(__dirname, 'dist'),
      copyDtsFiles: true,
    }),
    // nxCopyAssetsPlugin removed - assets handled by consuming application
  ],

  // Library mode configuration for React component library
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    reportCompressedSize: true,

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpenSCADEditor',
      formats: ['es', 'cjs'] as LibraryFormats[],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },

    rollupOptions: {
      // External packages that should not be bundled into the library
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'monaco-editor',
        '@monaco-editor/react',
        '@holistic-stack/openscad-parser',
        '@holistic-stack/tree-sitter-openscad',
        'web-tree-sitter',
        'vite-plugin-monaco-editor',
      ],

      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'monaco-editor': 'monaco',
          '@monaco-editor/react': 'MonacoReact',
          '@holistic-stack/openscad-parser': 'OpenSCADParser',
          '@holistic-stack/tree-sitter-openscad': 'TreeSitterOpenSCAD',
          'web-tree-sitter': 'TreeSitter',
        },

        // Vite 6.x best practices for React library output
        exports: 'named',
        interop: 'auto',
        assetFileNames: '[name][extname]',
        generatedCode: {
          constBindings: true,
          objectShorthand: true,
        },
      },
    },
  },

  // Vitest configuration
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest/packages/openscad-editor',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/openscad-editor',
      provider: 'v8',
    },
    setupFiles: './src/test-utils/setupTest.ts',
    // Fix Monaco Editor resolution in test environment
    alias: [
      {
        find: /^monaco-editor$/,
        replacement: resolve(__dirname, 'node_modules/monaco-editor/esm/vs/editor/editor.api'),
      },
    ],
    // Mock Node.js modules for browser environment
    server: {
      deps: {
        inline: ['web-tree-sitter'],
      },
    },
  },
}));
