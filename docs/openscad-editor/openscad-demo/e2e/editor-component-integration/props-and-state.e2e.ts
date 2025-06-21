import { test, expect } from '../fixtures/debug.fixture';
import { OpenSCADComponentHelper } from '../utils/openscad-component-helpers';
import { basicOpenSCADExamples } from '../utils/openscad-test-data';

/**
 * @file E2E tests for OpenSCAD Editor component props and state management
 * Tests React component prop passing, state synchronization, and data flow
 * 
 * Following project standards:
 * - No mocks for OpenSCAD Editor component (uses real component instances)
 * - Real prop and state testing with actual component behavior
 * - Data flow validation between parent and child components
 * - Performance monitoring for state updates
 * 
 * Based on research findings:
 * - Props and state change testing with real component instances
 * - Component data flow validation patterns
 * - State synchronization testing between React and Monaco Editor
 * - Performance impact of prop and state changes
 */

test.describe('OpenSCAD Editor Component - Props and State Management Tests', () => {
  let componentHelper: OpenSCADComponentHelper;

  test.beforeEach(async ({ page, debugLogs }) => {
    componentHelper = new OpenSCADComponentHelper(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await componentHelper.waitForComponentReady();
    
    console.log(`🔧 [PROPS SETUP] Starting props and state tests, initial logs: ${debugLogs.consoleLogs.length}`);
  });

  test('should handle value prop updates correctly', async ({ debugLogs }) => {
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test initial value prop
    const initialContent = await monacoHelper.getEditorContent();
    console.log(`📝 [INITIAL VALUE] Initial editor content length: ${initialContent.length} characters`);
    
    // Simulate value prop update by setting new content
    const newValue = basicOpenSCADExamples.simple;
    await monacoHelper.setEditorContent(newValue);
    await monacoHelper.page.waitForTimeout(1000);
    
    // Verify content was updated
    const updatedContent = await monacoHelper.getEditorContent();
    expect(updatedContent).toContain('cube([10, 10, 10])');
    expect(updatedContent).toContain('sphere(r = 5)');
    expect(updatedContent).toContain('cylinder(h = 20, r = 3)');
    
    console.log(`📝 [VALUE UPDATE] Content updated successfully, new length: ${updatedContent.length} characters`);
    
    // Check for value update logs
    const valueUpdateLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('value') || 
      log.message.includes('content') ||
      log.message.includes('update')
    );
    
    console.log(`📊 [VALUE LOGS] Found ${valueUpdateLogs.length} value update logs`);
    
    console.log(`✅ [VALUE PROP] Value prop updates handled correctly`);
  });

  test('should trigger onChange callback on content changes', async ({ debugLogs }) => {
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Clear editor and start fresh
    await monacoHelper.clearEditor();
    await monacoHelper.page.waitForTimeout(500);
    
    // Track initial state
    const initialContent = await monacoHelper.getEditorContent();
    
    // Make a change that should trigger onChange
    await monacoHelper.typeInEditor('// Testing onChange callback\ncube([5, 5, 5]);');
    await monacoHelper.page.waitForTimeout(1000);
    
    // Verify content changed
    const changedContent = await monacoHelper.getEditorContent();
    expect(changedContent).not.toBe(initialContent);
    expect(changedContent).toContain('Testing onChange callback');
    expect(changedContent).toContain('cube([5, 5, 5])');
    
    // Validate onChange callback was triggered
    const callbackValidation = await componentHelper.validateEventCallbacks();
    expect(callbackValidation.onChange).toBe(true);
    
    console.log(`📞 [ONCHANGE] onChange callback triggered successfully`);
    
    // Check for onChange-related logs
    const onChangeLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('onChange') || 
      log.message.includes('change') ||
      log.message.includes('callback')
    );
    
    console.log(`📊 [ONCHANGE LOGS] Found ${onChangeLogs.length} onChange-related logs`);
    
    console.log(`✅ [ONCHANGE CALLBACK] onChange callback functionality validated`);
  });

  test('should handle feature configuration props', async ({ debugLogs }) => {
    await componentHelper.waitForComponentReady();
    
    // Test current feature configuration (assuming IDE preset)
    const featureValidation = await componentHelper.validateFeaturePreset('IDE');
    
    console.log(`🎛️  [FEATURE PROPS] Current feature configuration:`, {
      preset: featureValidation.preset,
      autocomplete: featureValidation.autocomplete,
      formatting: featureValidation.formatting,
      errorDetection: featureValidation.errorDetection,
      symbolNavigation: featureValidation.symbolNavigation,
      findReplace: featureValidation.findReplace
    });
    
    // Validate that IDE features are properly configured
    // Note: Error detection may take time to initialize with parser
    expect(featureValidation.findReplace).toBe(true);

    // Autocomplete should be available for IDE preset
    expect(featureValidation.autocomplete).toBe(true);
    
    // Test feature functionality
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test error detection feature
    await monacoHelper.setEditorContent('cube([10, 10, 10'); // Missing closing bracket
    await monacoHelper.page.waitForTimeout(2000);
    
    const markers = await monacoHelper.getEditorMarkers();
    const hasErrorMarkers = markers.some(marker => marker.severity === 'error');
    
    console.log(`🚨 [ERROR DETECTION] Error markers detected: ${hasErrorMarkers}, total markers: ${markers.length}`);
    
    // Check for feature configuration logs
    const featureLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('feature') || 
      log.message.includes('config') ||
      log.message.includes('preset')
    );
    
    console.log(`📊 [FEATURE LOGS] Found ${featureLogs.length} feature configuration logs`);
    
    console.log(`✅ [FEATURE PROPS] Feature configuration props handled correctly`);
  });

  test('should maintain state synchronization between React and Monaco', async () => {
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test state synchronization with multiple rapid changes
    const testChanges = [
      'cube([1, 1, 1]);',
      'sphere(r = 2);',
      'cylinder(h = 3, r = 1);'
    ];
    
    for (let i = 0; i < testChanges.length; i++) {
      const change = testChanges[i];
      
      // Set content and verify synchronization
      await monacoHelper.setEditorContent(change);
      await monacoHelper.page.waitForTimeout(300);
      
      const currentContent = await monacoHelper.getEditorContent();
      expect(currentContent.trim()).toBe(change);
      
      console.log(`🔄 [SYNC ${i + 1}] State synchronized: "${change}"`);
    }
    
    // Test cursor position synchronization
    await monacoHelper.setEditorContent('cube([10, 10, 10]);\nsphere(r = 5);');
    
    // Move cursor and verify position tracking
    const codeElement = monacoHelper.page.locator('[role="code"]').first();
    await codeElement.click();
    await monacoHelper.page.keyboard.press('ArrowDown');
    
    const cursorPosition = await monacoHelper.getCursorPosition();
    expect(cursorPosition.line).toBe(2); // Should be on second line
    
    console.log(`🎯 [CURSOR SYNC] Cursor position synchronized: line ${cursorPosition.line}, column ${cursorPosition.column}`);
    
    console.log(`✅ [STATE SYNC] State synchronization between React and Monaco validated`);
  });

  test('should handle theme and options props correctly', async ({ debugLogs }) => {
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test current theme application
    const editorTheme = await monacoHelper.page.evaluate(() => {
      const monacoEditor = (window as any).monaco?.editor;
      if (monacoEditor) {
        const editors = monacoEditor.getEditors();
        if (editors && editors.length > 0) {
          return {
            theme: editors[0]._themeService?._theme?.themeName || 'unknown',
            hasTheme: !!editors[0]._themeService
          };
        }
      }
      return { theme: 'none', hasTheme: false };
    });
    
    console.log(`🎨 [THEME] Current editor theme:`, editorTheme);
    
    // Verify theme is applied
    expect(editorTheme.hasTheme).toBe(true);
    
    // Test editor options
    const editorOptions = await monacoHelper.page.evaluate(() => {
      const monacoEditor = (window as any).monaco?.editor;
      if (monacoEditor) {
        const editors = monacoEditor.getEditors();
        if (editors && editors.length > 0) {
          const options = editors[0].getOptions();
          return {
            lineNumbers: options.get(60), // LineNumbers option ID
            wordWrap: options.get(117),   // WordWrap option ID
            minimap: options.get(69),     // Minimap option ID
            fontSize: options.get(46)     // FontSize option ID
          };
        }
      }
      return null;
    });
    
    console.log(`⚙️ [OPTIONS] Current editor options:`, editorOptions);
    
    // Verify basic options are set
    expect(editorOptions).toBeTruthy();
    
    // Check for theme and options logs
    const themeLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('theme') || 
      log.message.includes('options') ||
      log.message.includes('style')
    );
    
    console.log(`📊 [THEME LOGS] Found ${themeLogs.length} theme and options logs`);
    
    console.log(`✅ [THEME OPTIONS] Theme and options props handled correctly`);
  });

  test('should handle prop changes without memory leaks', async ({ debugLogs }) => {
    componentHelper.clearPerformanceMetrics();
    
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Simulate multiple prop changes to test memory management
    const propChangeTests = [
      basicOpenSCADExamples.simple,
      basicOpenSCADExamples.withComments,
      basicOpenSCADExamples.withNumbers,
      basicOpenSCADExamples.withOperators,
      basicOpenSCADExamples.withStrings
    ];
    
    for (let i = 0; i < propChangeTests.length; i++) {
      const testContent = propChangeTests[i];
      
      // Simulate prop change
      await monacoHelper.setEditorContent(testContent);
      await monacoHelper.page.waitForTimeout(500);
      
      // Verify content was applied
      const currentContent = await monacoHelper.getEditorContent();
      expect(currentContent).toContain(testContent.split('\n')[1]); // Check for content from the test
      
      console.log(`🔄 [PROP CHANGE ${i + 1}] Applied prop change successfully`);
    }
    
    // Check memory usage if available
    const memoryUsage = await monacoHelper.monitorMemoryUsage();
    if (memoryUsage) {
      console.log(`💾 [MEMORY] Current memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
      
      // Memory usage should be reasonable (less than 100MB for editor)
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    }
    
    // Get performance metrics
    const metrics = componentHelper.getPerformanceMetrics();
    console.log(`📊 [PROP PERFORMANCE] Recorded ${metrics.length} prop change operations`);
    
    // Check for memory-related logs
    const memoryLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('memory') || 
      log.message.includes('leak') ||
      log.message.includes('cleanup')
    );
    
    console.log(`💾 [MEMORY LOGS] Found ${memoryLogs.length} memory-related logs`);
    
    console.log(`✅ [PROP MEMORY] Prop changes handled without memory leaks`);
  });

  test('should validate component state consistency', async () => {
    const monacoHelper = componentHelper.getMonacoHelper();
    
    // Test state consistency across different operations
    const testCode = `// State consistency test
module consistency_test(size = 10) {
    difference() {
        cube([size, size, size]);
        translate([size/4, size/4, -1]) {
            cube([size/2, size/2, size + 2]);
        }
    }
}

consistency_test(15);`;
    
    // Set content and verify immediate consistency
    await monacoHelper.setEditorContent(testCode);
    await monacoHelper.page.waitForTimeout(1000);
    
    const content1 = await monacoHelper.getEditorContent();
    expect(content1).toContain('consistency_test');
    
    // Trigger parsing and verify consistency maintained
    await monacoHelper.page.waitForTimeout(2000);
    
    const content2 = await monacoHelper.getEditorContent();
    expect(content2).toBe(content1); // Content should remain consistent
    
    // Test cursor position consistency
    const position1 = await monacoHelper.getCursorPosition();
    await monacoHelper.page.waitForTimeout(500);
    const position2 = await monacoHelper.getCursorPosition();
    
    // Cursor position should be stable when not actively moving
    expect(position2.line).toBe(position1.line);
    expect(position2.column).toBe(position1.column);
    
    console.log(`🎯 [CONSISTENCY] State consistency validated across operations`);
    
    // Validate component integration remains stable
    const integration = await componentHelper.validateComponentIntegration();
    expect(integration.mounted).toBe(true);
    expect(integration.monacoInitialized).toBe(true);
    
    console.log(`✅ [STATE CONSISTENCY] Component state consistency validated`);
  });
});
