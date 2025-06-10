/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/vitest-setup.ts'],
    testTimeout: 30000, // Longer timeout for CSG2 operations
    hookTimeout: 30000, // Longer timeout for setup hooks
  },
});
