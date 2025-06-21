import { test, expect } from '../fixtures/debug.fixture';
import { OpenSCADComponentHelper } from '../utils/openscad-component-helpers';

/**
 * @file E2E tests for OpenSCAD Editor component mounting and initialization
 * Tests the React component lifecycle and integration with Monaco Editor
 * 
 * Following project standards:
 * - No mocks for OpenSCAD Editor component (uses real component instances)
 * - Real Monaco Editor integration testing
 * - Component lifecycle validation
 * - Performance monitoring for component operations
 * 
 * Based on research findings:
 * - React component lifecycle testing patterns
 * - Component mounting and unmounting validation
 * - Integration testing between React components and Monaco Editor
 * - Performance benchmarking for component interactions
 */

test.describe('OpenSCAD Editor Component - Mounting and Initialization Tests', () => {
  let componentHelper: OpenSCADComponentHelper;

  test.beforeEach(async ({ page, debugLogs }) => {
    componentHelper = new OpenSCADComponentHelper(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`🔧 [COMPONENT SETUP] Starting component mounting tests, initial logs: ${debugLogs.consoleLogs.length}`);
  });

  test('should mount OpenSCAD Editor component successfully', async ({ debugLogs }) => {
    // Wait for component to be ready and measure performance
    const lifecycle = await componentHelper.waitForComponentReady();
    
    console.log(`⏱️  [COMPONENT MOUNT] Component lifecycle timing:`, {
      mountTime: lifecycle.mountTime,
      initializationTime: lifecycle.initializationTime,
      firstRenderTime: lifecycle.firstRenderTime,
      parserLoadTime: lifecycle.parserLoadTime,
      totalReadyTime: lifecycle.totalReadyTime
    });
    
    // Validate component integration
    const integration = await componentHelper.validateComponentIntegration();
    
    console.log(`🔗 [COMPONENT INTEGRATION] Integration status:`, {
      mounted: integration.mounted,
      monacoInitialized: integration.monacoInitialized,
      parserInitialized: integration.parserInitialized,
      featuresLoaded: integration.featuresLoaded,
      callbacksRegistered: integration.callbacksRegistered
    });
    
    // Assert component mounting requirements
    expect(integration.mounted).toBe(true);
    expect(integration.monacoInitialized).toBe(true);
    
    // Check for component mounting errors
    const mountingErrors = debugLogs.pageErrors.filter(error => 
      error.message.includes('component') || 
      error.message.includes('mount') ||
      error.message.includes('React')
    );
    
    expect(mountingErrors).toHaveLength(0);
    
    // Verify reasonable mounting time (should be under 10 seconds)
    expect(lifecycle.totalReadyTime).toBeLessThan(10000);
    
    console.log(`✅ [COMPONENT MOUNT] OpenSCAD Editor component mounted successfully`);
  });

  test('should initialize Monaco Editor within React component', async ({ debugLogs }) => {
    await componentHelper.waitForComponentReady();
    
    // Get Monaco helper for detailed validation
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Validate Monaco Editor accessibility within component
    const accessibility = await monacoHelper.validateAccessibility();
    
    console.log(`♿ [COMPONENT ACCESSIBILITY] Monaco Editor accessibility within component:`, {
      hasCodeRole: accessibility.hasCodeRole,
      hasAriaLabel: accessibility.hasAriaLabel,
      keyboardNavigable: accessibility.keyboardNavigable,
      screenReaderCompatible: accessibility.screenReaderCompatible
    });
    
    // Test basic Monaco Editor functionality within component
    await monacoHelper.setEditorContent('// Component integration test\ncube([10, 10, 10]);');
    const content = await monacoHelper.getEditorContent();
    
    expect(content).toContain('Component integration test');
    expect(content).toContain('cube([10, 10, 10])');
    
    // Verify syntax highlighting is active
    const hasSyntaxHighlighting = await monacoHelper.hasSyntaxHighlighting();
    expect(hasSyntaxHighlighting).toBe(true);
    
    // Check for Monaco Editor integration logs
    const monacoLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('monaco') || 
      log.message.includes('editor') ||
      log.message.includes('syntax')
    );
    
    console.log(`📊 [MONACO INTEGRATION] Found ${monacoLogs.length} Monaco Editor integration logs`);
    
    console.log(`✅ [MONACO INTEGRATION] Monaco Editor initialized successfully within React component`);
  });

  test('should handle component feature configuration', async ({ debugLogs }) => {
    await componentHelper.waitForComponentReady();
    
    // Test feature preset validation (assuming IDE preset for demo)
    const featureValidation = await componentHelper.validateFeaturePreset('IDE');
    
    console.log(`🎛️  [FEATURE CONFIG] Feature validation results:`, {
      preset: featureValidation.preset,
      autocomplete: featureValidation.autocomplete,
      formatting: featureValidation.formatting,
      errorDetection: featureValidation.errorDetection,
      symbolNavigation: featureValidation.symbolNavigation,
      findReplace: featureValidation.findReplace
    });
    
    // For IDE preset, we expect basic features to be available
    // Note: Error detection may take time to initialize with parser
    expect(featureValidation.findReplace).toBe(true);

    // Autocomplete should be available for IDE preset
    expect(featureValidation.autocomplete).toBe(true);
    
    // Check for feature configuration logs
    const featureLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('feature') || 
      log.message.includes('preset') ||
      log.message.includes('config')
    );
    
    console.log(`📋 [FEATURE CONFIG] Found ${featureLogs.length} feature configuration logs`);
    
    console.log(`✅ [FEATURE CONFIG] Component feature configuration validated successfully`);
  });

  test('should register and validate event callbacks', async ({ debugLogs }) => {
    await componentHelper.waitForComponentReady();
    
    // Test event callback validation
    const callbackValidation = await componentHelper.validateEventCallbacks();
    
    console.log(`📞 [EVENT CALLBACKS] Callback validation results:`, {
      onChange: callbackValidation.onChange,
      onReady: callbackValidation.onReady,
      onError: callbackValidation.onError,
      onParseComplete: callbackValidation.onParseComplete
    });
    
    // Essential callbacks should be working
    expect(callbackValidation.onChange).toBe(true);
    expect(callbackValidation.onReady).toBe(true);
    
    // Check for callback-related logs
    const callbackLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('callback') || 
      log.message.includes('event') ||
      log.message.includes('onChange') ||
      log.message.includes('onReady')
    );
    
    console.log(`📞 [CALLBACK LOGS] Found ${callbackLogs.length} callback-related logs`);
    
    console.log(`✅ [EVENT CALLBACKS] Event callbacks registered and validated successfully`);
  });

  test('should handle component state changes correctly', async () => {
    await componentHelper.waitForComponentReady();
    
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test state change through content updates
    const initialContent = await monacoHelper.getEditorContent();
    
    // Update content and verify state change
    const newContent = `// State change test
module state_test() {
    cube([5, 5, 5]);
    translate([10, 0, 0]) {
        sphere(r = 3);
    }
}

state_test();`;
    
    await monacoHelper.setEditorContent(newContent);
    await monacoHelper.page.waitForTimeout(1000);
    
    const updatedContent = await monacoHelper.getEditorContent();
    expect(updatedContent).toContain('state_test');
    expect(updatedContent).toContain('State change test');
    
    // Verify parsing triggered after state change
    await monacoHelper.page.waitForTimeout(2000);
    const markers = await monacoHelper.getEditorMarkers();
    const errors = markers.filter(marker => marker.severity === 'error');
    
    // Should have no errors for valid OpenSCAD code
    expect(errors).toHaveLength(0);
    
    console.log(`🔄 [STATE CHANGE] Component state changes handled correctly`);
  });

  test('should maintain performance during component operations', async ({ debugLogs }) => {
    componentHelper.clearPerformanceMetrics();
    
    // Perform multiple component operations
    await componentHelper.waitForComponentReady();
    
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test multiple content updates
    const testOperations = [
      'cube([1, 1, 1]);',
      'sphere(r = 2);',
      'cylinder(h = 5, r = 1);',
      'translate([10, 0, 0]) { cube([2, 2, 2]); }',
      'rotate([0, 0, 45]) { sphere(r = 3); }'
    ];
    
    for (const operation of testOperations) {
      await monacoHelper.setEditorContent(operation);
      await monacoHelper.page.waitForTimeout(500);
    }
    
    // Get performance metrics
    const metrics = componentHelper.getPerformanceMetrics();
    
    console.log(`📊 [COMPONENT PERFORMANCE] Recorded ${metrics.length} component operations:`);
    metrics.forEach(metric => {
      console.log(`  ⚡ ${metric.operationName}: ${metric.duration}ms`);
    });
    
    // All component operations should complete reasonably quickly
    metrics.forEach(metric => {
      expect(metric.duration).toBeLessThan(15000); // 15 seconds max for component operations
    });
    
    // Check for performance-related logs
    const performanceLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('performance') || 
      log.message.includes('timing') ||
      log.message.includes('slow')
    );
    
    console.log(`⚡ [PERFORMANCE LOGS] Found ${performanceLogs.length} performance-related logs`);
    
    console.log(`✅ [COMPONENT PERFORMANCE] Component performance is acceptable`);
  });

  test('should handle component cleanup properly', async () => {
    await componentHelper.waitForComponentReady();
    
    // Test component cleanup validation
    const cleanupStatus = await componentHelper.testComponentCleanup();
    
    console.log(`🧹 [COMPONENT CLEANUP] Cleanup status: ${cleanupStatus}`);
    
    // Component should be properly managing resources
    expect(cleanupStatus).toBe(true);
    
    // Verify Monaco Editor instances are properly managed
    const editorInstances = await componentHelper.page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (monaco && monaco.editor) {
        return monaco.editor.getEditors().length;
      }
      return 0;
    });
    
    console.log(`📊 [EDITOR INSTANCES] Active Monaco Editor instances: ${editorInstances}`);
    
    // Should have at least one active editor instance
    expect(editorInstances).toBeGreaterThan(0);
    
    console.log(`✅ [COMPONENT CLEANUP] Component cleanup validation completed`);
  });
});
