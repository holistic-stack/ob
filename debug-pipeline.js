// Simple debug script to test the pipeline in browser console
// Copy and paste this into the browser console at http://localhost:5173

console.log('[DEBUG] Starting pipeline debug test...');

// Test if the pipeline is working by manually creating and processing
async function testPipeline() {
  try {
    // Import the required modules (assuming they're available globally)
    const { OpenScadPipeline } = await import('./src/babylon-csg2/openscad-pipeline/openscad-pipeline.js');
    const BABYLON = window.BABYLON;
    
    if (!BABYLON) {
      console.error('[ERROR] BABYLON.js not available');
      return;
    }
    
    console.log('[DEBUG] Creating test scene...');
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    
    console.log('[DEBUG] Creating pipeline...');
    const pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 5000
    });
    
    console.log('[DEBUG] Initializing pipeline...');
    const initResult = await pipeline.initialize();
    
    if (!initResult.success) {
      console.error('[ERROR] Pipeline initialization failed:', initResult.error);
      return;
    }
    
    console.log('[DEBUG] Pipeline initialized successfully');
    
    console.log('[DEBUG] Processing cube code...');
    const result = await pipeline.processOpenScadCode('cube([10, 10, 10]);', scene);
    
    console.log('[DEBUG] Pipeline result:', result);
    
    if (result.success) {
      console.log('[DEBUG] ✅ Success! Generated mesh:', result.value);
      console.log('[DEBUG] Mesh details:', {
        name: result.value?.name,
        vertices: result.value?.getTotalVertices(),
        indices: result.value?.getTotalIndices(),
        isVisible: result.value?.isVisible,
        isEnabled: result.value?.isEnabled()
      });
    } else {
      console.error('[ERROR] ❌ Pipeline failed:', result.error);
    }
    
    // Clean up
    scene.dispose();
    engine.dispose();
    
  } catch (error) {
    console.error('[ERROR] Test failed:', error);
  }
}

// Run the test
testPipeline();
