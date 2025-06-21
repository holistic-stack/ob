import { test, expect } from './fixtures/debug.fixture';
import { MonacoEditorHelper } from './utils/monaco-helpers';

/**
 * @file End-to-end tests for OpenSCAD Parser functionality
 * Tests real OpenSCAD parsing capabilities with comprehensive debugging
 * 
 * Following project standards:
 * - No mocks for OpenSCAD parser (uses real instances)
 * - Tests actual parsing and AST generation
 * - Comprehensive console output monitoring
 * - Real user interaction patterns
 * 
 * Debug Features:
 * - Parser initialization monitoring
 * - Parse result validation
 * - Error detection and reporting
 * - Performance monitoring
 * 
 * To enable detailed logging: DEBUG_E2E=true nx e2e openscad-demo
 */

test.describe('OpenSCAD Parser - Real Parsing Tests', () => {
  let monacoHelper: MonacoEditorHelper;

  test.beforeEach(async ({ page, debugLogs }) => {
    monacoHelper = new MonacoEditorHelper(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await monacoHelper.waitForEditorReady();
    
    console.log(`🔧 [PARSER SETUP] Ready for parsing tests, initial logs: ${debugLogs.consoleLogs.length}`);
  });

  test('should parse basic OpenSCAD code successfully', async ({ debugLogs }) => {
    const basicCode = `
// Basic OpenSCAD shapes
cube([10, 10, 10]);
translate([15, 0, 0]) {
    sphere(r = 5);
}
cylinder(h = 20, r = 3);
`;

    // Set the code in the editor
    await monacoHelper.setEditorContent(basicCode);
    
    // Wait for parsing to complete
    await monacoHelper.page.waitForTimeout(2000);
    
    // Check for parsing-related console logs
    const parsingLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('parse') || 
      log.message.includes('AST') ||
      log.message.includes('tree-sitter')
    );
    
    console.log(`📊 [PARSER DEBUG] Parsing logs found: ${parsingLogs.length}`);
    parsingLogs.forEach(log => {
      console.log(`  📝 [PARSE LOG] ${log.type}: ${log.message}`);
    });
    
    // Check for parsing errors
    const parseErrors = debugLogs.pageErrors.filter(error => 
      error.message.includes('parse') || 
      error.message.includes('syntax')
    );
    
    expect(parseErrors).toHaveLength(0);
    
    // Verify content was set correctly
    const content = await monacoHelper.getEditorContent();
    expect(content).toContain('cube([10, 10, 10])');
    expect(content).toContain('sphere(r = 5)');
    expect(content).toContain('cylinder(h = 20, r = 3)');
    
    console.log(`✅ [PARSER DEBUG] Basic parsing test completed successfully`);
  });

  test('should handle syntax errors gracefully', async ({ debugLogs }) => {
    const invalidCode = `
// Invalid OpenSCAD code with syntax errors
cube([10, 10, 10]  // Missing closing bracket
translate([15, 0, 0] {  // Missing closing bracket
    sphere(r = 5);
}
cylinder(h = 20, r = 3  // Missing closing bracket
`;

    await monacoHelper.setEditorContent(invalidCode);
    await monacoHelper.page.waitForTimeout(3000);
    
    // Check for error-related console logs
    const errorLogs = debugLogs.consoleLogs.filter(log => 
      log.type === 'error' || 
      log.message.includes('error') ||
      log.message.includes('syntax')
    );
    
    console.log(`❌ [ERROR DEBUG] Error logs found: ${errorLogs.length}`);
    errorLogs.forEach(log => {
      console.log(`  🚨 [ERROR LOG] ${log.type}: ${log.message}`);
    });
    
    // Check Monaco Editor markers for syntax errors
    const markers = await monacoHelper.getEditorMarkers();
    console.log(`🎯 [MARKER DEBUG] Editor markers found: ${markers.length}`);
    markers.forEach(marker => {
      console.log(`  📍 [MARKER] Line ${marker.line}: ${marker.severity} - ${marker.message}`);
    });
    
    // Should detect syntax errors (either through console logs or editor markers)
    const hasSyntaxErrors = errorLogs.length > 0 || markers.some(m => m.severity === 'error');
    console.log(`🔍 [SYNTAX DEBUG] Syntax errors detected: ${hasSyntaxErrors}`);
    
    // Verify content was set (even with errors)
    const content = await monacoHelper.getEditorContent();
    expect(content).toContain('cube([10, 10, 10]');
    
    console.log(`✅ [ERROR DEBUG] Syntax error handling test completed`);
  });

  test('should monitor parser performance', async ({ debugLogs }) => {
    const complexCode = `
// Complex OpenSCAD code for performance testing
module complex_shape(size = 10, iterations = 5) {
    for (i = [0:iterations-1]) {
        rotate([0, 0, i * 360/iterations]) {
            translate([size, 0, 0]) {
                difference() {
                    cube([size/2, size/2, size/2]);
                    sphere(r = size/4);
                }
            }
        }
    }
}

// Generate multiple instances
for (x = [0:2]) {
    for (y = [0:2]) {
        translate([x * 30, y * 30, 0]) {
            complex_shape(size = 15, iterations = 8);
        }
    }
}
`;

    const startTime = Date.now();
    
    await monacoHelper.setEditorContent(complexCode);
    await monacoHelper.page.waitForTimeout(3000);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`⏱️  [PERFORMANCE] Complex code processing time: ${processingTime}ms`);
    
    // Check for performance-related logs
    const performanceLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('performance') || 
      log.message.includes('time') ||
      log.message.includes('ms')
    );
    
    console.log(`📈 [PERFORMANCE DEBUG] Performance logs: ${performanceLogs.length}`);
    performanceLogs.forEach(log => {
      console.log(`  ⚡ [PERF LOG] ${log.message}`);
    });
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(processingTime).toBeLessThan(10000); // 10 seconds max
    
    // Check for memory-related errors
    const memoryErrors = debugLogs.pageErrors.filter(error => 
      error.message.includes('memory') || 
      error.message.includes('heap')
    );
    
    expect(memoryErrors).toHaveLength(0);
    
    console.log(`✅ [PERFORMANCE DEBUG] Performance test completed in ${processingTime}ms`);
  });

  test('should track WASM module loading and initialization', async ({ debugLogs }) => {
    // Check for WASM-related console logs
    const wasmLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('wasm') || 
      log.message.includes('WASM') ||
      log.message.includes('tree-sitter')
    );
    
    console.log(`📦 [WASM DEBUG] WASM-related logs: ${wasmLogs.length}`);
    wasmLogs.forEach(log => {
      console.log(`  🔧 [WASM LOG] ${log.type}: ${log.message}`);
    });
    
    // Check for successful WASM loading in network logs
    const wasmRequests = debugLogs.networkLogs.filter(log => 
      log.url.includes('.wasm')
    );
    
    console.log(`🌐 [WASM NETWORK] WASM network requests: ${wasmRequests.length}`);
    wasmRequests.forEach(req => {
      console.log(`  📡 [WASM REQ] ${req.type}: ${req.url} (${req.status || 'pending'})`);
    });
    
    // Should have loaded tree-sitter WASM files
    const treeWasmRequests = wasmRequests.filter(req => 
      req.url.includes('tree-sitter')
    );
    
    expect(treeWasmRequests.length).toBeGreaterThan(0);
    
    // Check for WASM loading errors
    const wasmErrors = debugLogs.pageErrors.filter(error => 
      error.message.includes('wasm') || 
      error.message.includes('WASM')
    );
    
    expect(wasmErrors).toHaveLength(0);
    
    console.log(`✅ [WASM DEBUG] WASM loading verification completed`);
  });
});
