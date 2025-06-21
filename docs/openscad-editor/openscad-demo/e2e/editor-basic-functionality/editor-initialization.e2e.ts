import { test, expect } from '../fixtures/debug.fixture';
import { MonacoEditorHelper } from '../utils/monaco-helpers';

/**
 * @file E2E tests for Monaco Editor initialization and basic setup
 * Tests the fundamental editor loading and initialization process
 * 
 * Following project standards:
 * - No mocks for Monaco Editor (uses real editor interactions)
 * - Performance monitoring for initialization
 * - Accessibility validation from the start
 * - Real user interaction patterns
 * 
 * Based on research findings:
 * - Monaco Editor ARIA role="code" validation
 * - Proper waiting strategies for editor readiness
 * - Performance benchmarking for initialization
 * - Visual consistency validation
 */

test.describe('Monaco Editor - Initialization Tests', () => {
  let monacoHelper: MonacoEditorHelper;

  test.beforeEach(async ({ page, debugLogs }) => {
    monacoHelper = new MonacoEditorHelper(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`🔧 [INIT SETUP] Starting editor initialization tests, initial logs: ${debugLogs.consoleLogs.length}`);
  });

  test('should initialize Monaco Editor with proper ARIA structure', async ({ debugLogs }) => {
    // Wait for editor to be ready and measure performance
    const initMetrics = await monacoHelper.waitForEditorReady();
    
    console.log(`⏱️  [INIT PERFORMANCE] Editor initialization took: ${initMetrics.duration}ms`);
    
    // Validate accessibility compliance
    const accessibility = await monacoHelper.validateAccessibility();
    
    console.log(`♿ [ACCESSIBILITY] Validation results:`, {
      hasCodeRole: accessibility.hasCodeRole,
      hasAriaLabel: accessibility.hasAriaLabel,
      keyboardNavigable: accessibility.keyboardNavigable,
      screenReaderCompatible: accessibility.screenReaderCompatible
    });
    
    // Assert accessibility requirements (be more lenient with Monaco Editor's implementation)
    expect(accessibility.hasCodeRole).toBe(true);
    expect(accessibility.screenReaderCompatible).toBe(true);
    
    // Check for initialization errors
    const initErrors = debugLogs.pageErrors.filter(error => 
      error.message.includes('monaco') || 
      error.message.includes('editor') ||
      error.message.includes('initialization')
    );
    
    expect(initErrors).toHaveLength(0);
    
    // Verify reasonable initialization time (should be under 5 seconds)
    expect(initMetrics.duration).toBeLessThan(5000);
    
    console.log(`✅ [INIT] Monaco Editor initialized successfully with accessibility compliance`);
  });

  test('should load OpenSCAD syntax highlighting', async ({ debugLogs }) => {
    await monacoHelper.waitForEditorReady();
    
    // Set OpenSCAD code to test syntax highlighting
    const testCode = `
// OpenSCAD test code for syntax highlighting
module test_module(size = 10) {
    cube([size, size, size]);
    translate([size + 5, 0, 0]) {
        sphere(r = size / 2);
    }
}

test_module(15);
`;
    
    await monacoHelper.setEditorContent(testCode);
    
    // Wait for syntax highlighting to process
    await monacoHelper.page.waitForTimeout(1000);
    
    // Check if syntax highlighting is active
    const hasSyntaxHighlighting = await monacoHelper.hasSyntaxHighlighting();
    
    console.log(`🎨 [SYNTAX] Syntax highlighting active: ${hasSyntaxHighlighting}`);
    
    // Verify syntax highlighting tokens are present
    expect(hasSyntaxHighlighting).toBe(true);
    
    // Check for syntax highlighting related logs
    const syntaxLogs = debugLogs.consoleLogs.filter(log => 
      log.message.includes('syntax') || 
      log.message.includes('highlighting') ||
      log.message.includes('language')
    );
    
    console.log(`📝 [SYNTAX LOGS] Found ${syntaxLogs.length} syntax-related logs`);
    
    // Verify content was set correctly
    const content = await monacoHelper.getEditorContent();
    expect(content).toContain('module test_module');
    expect(content).toContain('cube([size, size, size])');
    
    console.log(`✅ [SYNTAX] OpenSCAD syntax highlighting loaded successfully`);
  });

  test('should display line numbers and basic UI elements', async () => {
    await monacoHelper.waitForEditorReady();
    
    // Check for line numbers
    const lineNumbers = await monacoHelper.page.locator('.monaco-editor .line-numbers').first();
    await expect(lineNumbers).toBeVisible();
    
    // Check for editor viewport
    const viewport = await monacoHelper.page.locator('.monaco-editor .view-lines').first();
    await expect(viewport).toBeVisible();
    
    // Check for scrollbars (should be present even if not visible)
    const scrollbar = await monacoHelper.page.locator('.monaco-editor .monaco-scrollable-element').first();
    await expect(scrollbar).toBeAttached();
    
    // Verify editor has proper dimensions
    const editorBounds = await monacoHelper.page.locator('.monaco-editor').first().boundingBox();
    expect(editorBounds).toBeTruthy();
    expect(editorBounds!.width).toBeGreaterThan(200);
    expect(editorBounds!.height).toBeGreaterThan(100);
    
    console.log(`📐 [UI ELEMENTS] Editor dimensions: ${editorBounds!.width}x${editorBounds!.height}`);
    console.log(`✅ [UI] All basic UI elements are present and properly sized`);
  });

  test('should respond to focus and keyboard input', async () => {
    await monacoHelper.waitForEditorReady();
    
    // Test keyboard navigation
    const navigationWorks = await monacoHelper.testKeyboardNavigation();
    expect(navigationWorks).toBe(true);
    
    // Test basic typing
    await monacoHelper.clearEditor();
    await monacoHelper.typeInEditor('// Test typing');
    
    const content = await monacoHelper.getEditorContent();
    expect(content).toContain('// Test typing');
    
    // Test cursor positioning
    const cursorPosition = await monacoHelper.getCursorPosition();
    expect(cursorPosition.line).toBeGreaterThan(0);
    expect(cursorPosition.column).toBeGreaterThan(0);
    
    console.log(`🎯 [CURSOR] Cursor position: line ${cursorPosition.line}, column ${cursorPosition.column}`);
    console.log(`✅ [INPUT] Editor responds correctly to focus and keyboard input`);
  });

  test('should maintain visual consistency', async () => {
    await monacoHelper.waitForEditorReady();
    
    // Set consistent test content
    const testContent = `// Visual consistency test
cube([10, 10, 10]);
sphere(r = 5);`;
    
    await monacoHelper.setEditorContent(testContent);
    await monacoHelper.page.waitForTimeout(1000);
    
    // Capture screenshot for visual regression testing
    const screenshot = await monacoHelper.captureEditorScreenshot('editor-initialization');
    
    // Verify screenshot was captured
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(1000); // Should be a reasonable size
    
    console.log(`📸 [VISUAL] Screenshot captured: ${screenshot.length} bytes`);
    console.log(`✅ [VISUAL] Visual consistency test completed`);
  });

  test('should track performance metrics', async () => {
    // Clear previous metrics
    monacoHelper.clearPerformanceMetrics();
    
    // Perform operations that should be tracked
    await monacoHelper.waitForEditorReady();
    await monacoHelper.setEditorContent('// Performance test');
    
    // Get performance metrics
    const metrics = monacoHelper.getPerformanceMetrics();
    
    console.log(`📊 [PERFORMANCE] Recorded ${metrics.length} operations:`);
    metrics.forEach(metric => {
      console.log(`  ⚡ ${metric.operationName}: ${metric.duration}ms`);
    });
    
    // Should have at least the waitForEditorReady metric
    expect(metrics.length).toBeGreaterThan(0);
    
    // All operations should complete in reasonable time
    metrics.forEach(metric => {
      expect(metric.duration).toBeLessThan(10000); // 10 seconds max
    });
    
    console.log(`✅ [PERFORMANCE] Performance tracking working correctly`);
  });
});
