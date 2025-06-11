/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/vitest-setup.ts'],
    testTimeout: 1000, // Longer timeout for CSG2 operations
    hookTimeout: 1000, // Longer timeout for setup hooks
    reporters: 'verbose',
  },
});
