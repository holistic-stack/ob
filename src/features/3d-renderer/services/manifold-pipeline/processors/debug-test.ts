/**
 * Debug test to check processor initialization
 */

import { ManifoldPrimitiveProcessor } from './manifold-primitive-processor';

async function debugTest() {
  console.log('Creating processor...');
  const processor = new ManifoldPrimitiveProcessor();
  
  console.log('Processor name:', processor.name);
  console.log('Processor version:', processor.version);
  
  console.log('Initializing processor...');
  const initResult = await processor.initialize();
  
  console.log('Init result:', initResult);
  
  if (initResult.success) {
    console.log('Processor initialized successfully');
    
    const cubeNode = { 
      type: 'cube' as const, 
      size: [1, 1, 1] as const,
      center: false
    };
    
    console.log('Processing cube node...');
    const result = await processor.processNode(cubeNode);
    console.log('Process result:', result);
  } else {
    console.log('Initialization failed:', initResult.error);
  }
  
  processor.dispose();
}

debugTest().catch(console.error);
