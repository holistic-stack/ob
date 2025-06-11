/**
 * Simple test script to verify the OpenSCAD to Babylon.js pipeline is working
 */

import { runE2ETest } from './src/babylon-csg2/e2e-tests/e2e-pipeline.test.js';

console.log('[INIT] Testing OpenSCAD to Babylon.js Pipeline...');

runE2ETest()
  .then(success => {
    if (success) {
      console.log('🎉 PIPELINE TEST SUCCESSFUL!');
      process.exit(0);
    } else {
      console.log('❌ PIPELINE TEST FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ PIPELINE TEST ERROR:', error);
    process.exit(1);
  });
