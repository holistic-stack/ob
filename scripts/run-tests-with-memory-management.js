#!/usr/bin/env node

/**
 * Test runner with aggressive memory management
 *
 * This script runs tests in smaller batches to prevent memory accumulation
 * and forces garbage collection between test suites.
 */

import { spawn } from 'child_process';
import { glob } from 'glob';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Test patterns to run in batches
const testPatterns = [
  'src/features/openscad-parser/**/*.test.ts',
  'src/features/3d-renderer/**/*.test.ts',
  'src/shared/**/*.test.ts',
  'src/features/ui-components/**/*.test.ts',
];

async function runTestBatch(testFiles, batchName) {
  console.log(`\n🧪 Running ${batchName} (${testFiles.length} files)...`);

  return new Promise((resolve, reject) => {
    const args = [
      '--expose-gc', // Enable garbage collection
      './node_modules/.bin/vitest',
      'run',
      '--pool=forks',
      '--poolOptions.forks.singleFork=true',
      '--poolOptions.forks.isolate=false',
      '--reporter=basic',
      '--testTimeout=5000',
      ...testFiles,
    ];

    const child = spawn('node', args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--expose-gc',
      },
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${batchName} completed successfully`);

        // Force garbage collection between batches
        if (global.gc) {
          console.log('🗑️  Forcing garbage collection...');
          global.gc();
        }

        resolve();
      } else {
        console.error(`❌ ${batchName} failed with code ${code}`);
        reject(new Error(`Test batch failed: ${batchName}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${batchName}:`, error);
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Starting tests with memory management...');

  try {
    // Run each test pattern as a separate batch
    for (const pattern of testPatterns) {
      const testFiles = await glob(pattern, { cwd: projectRoot });

      if (testFiles.length === 0) {
        console.log(`⏭️  No tests found for pattern: ${pattern}`);
        continue;
      }

      // Split large batches into smaller chunks
      const chunkSize = 5; // Max 5 test files per batch
      for (let i = 0; i < testFiles.length; i += chunkSize) {
        const chunk = testFiles.slice(i, i + chunkSize);
        const batchName = `${pattern.split('/')[1]} batch ${Math.floor(i / chunkSize) + 1}`;

        await runTestBatch(chunk, batchName);

        // Small delay between batches to allow memory cleanup
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

main();
