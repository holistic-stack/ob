import { test, expect } from './fixtures/debug.fixture';
import { MonacoEditorHelper } from './utils/monaco-helpers';

/**
 * @file End-to-end tests for OpenSCAD Demo application
 * Tests fundamental application loading and core UI elements using real browser interactions
 *
 * Following project standards:
 * - No mocks for OpenSCAD parser (uses real instances)
 * - Tests actual Monaco Editor functionality
 * - Covers core user workflows
 * - Comprehensive console output interception for debugging
 *
 * Debug Features:
 * - Console message interception (all levels)
 * - Page error monitoring for uncaught exceptions
 * - Network request/response logging
 * - Monaco Editor interaction helpers
 *
 * To enable detailed logging: DEBUG_E2E=true nx e2e openscad-demo
 */

test.describe('OpenSCAD Demo - Basic Functionality', () => {
  let monacoHelper: MonacoEditorHelper;

  test.beforeEach(async ({ page, debugLogs }) => {
    monacoHelper = new MonacoEditorHelper(page);

    // Navigate to the demo application
    await page.goto('/');

    // Wait for the application to fully load
    await page.waitForLoadState('networkidle');

    // Wait for Monaco Editor to initialize properly
    await monacoHelper.waitForEditorReady();

    console.log(`🚀 [TEST SETUP] Application loaded, console logs: ${debugLogs.consoleLogs.length}, page errors: ${debugLogs.pageErrors.length}`);
  });

  test('should load the application successfully', async ({ page, debugLogs }) => {
    // Verify the page title contains OpenSCAD
    await expect(page).toHaveTitle(/OpenSCAD/);

    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000);

    // Check for critical JavaScript errors (excluding known test environment issues)
    const criticalErrors = debugLogs.pageErrors.filter(error =>
      !error.message.includes('webkit2.dll') &&
      !error.message.includes('ResizeObserver loop limit exceeded') &&
      !error.message.includes('Could not create web worker') &&
      !error.message.includes('WebSocket connection') &&
      !error.message.includes('server connection lost')
    );

    // Log debug information
    console.log(`📊 [DEBUG] Console logs captured: ${debugLogs.consoleLogs.length}`);
    console.log(`❌ [DEBUG] Page errors captured: ${debugLogs.pageErrors.length}`);
    console.log(`🌐 [DEBUG] Network requests: ${debugLogs.networkLogs.filter(log => log.type === 'request').length}`);

    // Should have no critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);

    // Verify essential console logs are present (OpenSCAD parser initialization)
    const parserInitLogs = debugLogs.consoleLogs.filter(log =>
      log.message.includes('Initializing OpenSCAD parser') ||
      log.message.includes('OpenSCAD parser initialized successfully') ||
      log.message.includes('Diagnostics service registered for language: openscad')
    );

    console.log(`✅ [DEBUG] OpenSCAD parser initialization logs: ${parserInitLogs.length}`);
    parserInitLogs.forEach(log => {
      console.log(`  📝 [PARSER INIT] ${log.message}`);
    });

    // Should have successful parser initialization
    const hasSuccessfulInit = parserInitLogs.some(log =>
      log.message.includes('initialized successfully')
    );

    expect(hasSuccessfulInit).toBe(true);
  });

  test('should display the main demo interface', async ({ page }) => {
    // Check for main demo container
    const demoContainer = page.locator('[data-testid="demo-container"]');
    await expect(demoContainer).toBeVisible({ timeout: 15000 });

    // Check for demo title
    const demoTitle = page.locator('[data-testid="demo-title"]');
    await expect(demoTitle).toBeVisible();
    await expect(demoTitle).toContainText('OpenSCAD Professional IDE');
  });

  test('should display Monaco Editor container', async ({ page }) => {
    // Check for Monaco Editor container
    const editorContainer = page.locator('[data-testid="monaco-editor-container"]');
    await expect(editorContainer).toBeVisible({ timeout: 15000 });

    // Monaco Editor should be present in the DOM
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 10000 });

    // Verify Monaco Editor is functional
    const hasContent = await monacoHelper.getEditorContent();
    expect(hasContent).toBeDefined();

    console.log(`📝 [DEBUG] Monaco Editor content length: ${hasContent.length} characters`);
  });

  test('should handle Monaco Editor interactions', async ({ debugLogs }) => {
    // Test basic editor functionality
    await monacoHelper.clearEditor();
    await monacoHelper.setEditorContent('// Test OpenSCAD code\ncube([10, 10, 10]);');

    // Verify content was set
    const content = await monacoHelper.getEditorContent();
    expect(content).toContain('cube([10, 10, 10])');

    // Check for syntax highlighting
    const hasSyntax = await monacoHelper.hasSyntaxHighlighting();
    console.log(`🎨 [DEBUG] Monaco Editor has syntax highlighting: ${hasSyntax}`);

    // Check for any editor-related errors
    const editorErrors = debugLogs.pageErrors.filter(error =>
      error.message.includes('monaco') || error.message.includes('editor')
    );

    expect(editorErrors).toHaveLength(0);

    console.log(`✅ [DEBUG] Monaco Editor interaction test completed successfully`);
  });

  test('should provide comprehensive application health report', async ({ debugLogs }) => {
    // Generate comprehensive health report
    const healthReport = {
      totalConsoleLogs: debugLogs.consoleLogs.length,
      totalPageErrors: debugLogs.pageErrors.length,
      totalNetworkRequests: debugLogs.networkLogs.filter(log => log.type === 'request').length,

      // OpenSCAD Parser Health
      parserInitialized: debugLogs.consoleLogs.some(log =>
        log.message.includes('OpenSCAD parser initialized successfully')
      ),
      diagnosticsRegistered: debugLogs.consoleLogs.some(log =>
        log.message.includes('Diagnostics service registered')
      ),

      // Monaco Editor Health
      monacoLoaded: debugLogs.consoleLogs.some(log =>
        log.message.includes('Monaco') || log.message.includes('editor')
      ),

      // WASM Loading Health
      wasmRequests: debugLogs.networkLogs.filter(log =>
        log.url.includes('.wasm') && log.type === 'request'
      ).length,

      // Critical Errors (excluding known harmless ones)
      criticalErrors: debugLogs.pageErrors.filter(error =>
        !error.message.includes('webkit2.dll') &&
        !error.message.includes('ResizeObserver loop limit exceeded') &&
        !error.message.includes('Could not create web worker') &&
        !error.message.includes('WebSocket connection') &&
        !error.message.includes('server connection lost')
      ).length
    };

    // Log comprehensive health report
    console.log(`📊 [HEALTH REPORT] Application Health Summary:`);
    console.log(`  📝 Console Logs: ${healthReport.totalConsoleLogs}`);
    console.log(`  ❌ Page Errors: ${healthReport.totalPageErrors}`);
    console.log(`  🌐 Network Requests: ${healthReport.totalNetworkRequests}`);
    console.log(`  🔧 Parser Initialized: ${healthReport.parserInitialized ? '✅' : '❌'}`);
    console.log(`  🩺 Diagnostics Registered: ${healthReport.diagnosticsRegistered ? '✅' : '❌'}`);
    console.log(`  📝 Monaco Loaded: ${healthReport.monacoLoaded ? '✅' : '❌'}`);
    console.log(`  📦 WASM Requests: ${healthReport.wasmRequests}`);
    console.log(`  🚨 Critical Errors: ${healthReport.criticalErrors}`);

    // Assertions for application health
    expect(healthReport.parserInitialized).toBe(true);
    expect(healthReport.diagnosticsRegistered).toBe(true);
    expect(healthReport.wasmRequests).toBeGreaterThan(0);
    expect(healthReport.criticalErrors).toBe(0);

    console.log(`✅ [HEALTH REPORT] Application is healthy and functioning correctly`);
  });

  test('should monitor network requests for WASM loading', async ({ debugLogs }) => {
    // Check for WASM file requests
    const wasmRequests = debugLogs.networkLogs.filter(log =>
      log.url.includes('.wasm') && log.type === 'request'
    );

    const wasmResponses = debugLogs.networkLogs.filter(log =>
      log.url.includes('.wasm') && log.type === 'response'
    );

    console.log(`📦 [DEBUG] WASM requests: ${wasmRequests.length}, responses: ${wasmResponses.length}`);

    // Should have at least one WASM file loaded (tree-sitter-openscad.wasm)
    expect(wasmRequests.length).toBeGreaterThan(0);

    // Check for failed WASM requests
    const failedWasmRequests = debugLogs.networkLogs.filter(log =>
      log.url.includes('.wasm') && log.type === 'failed'
    );

    expect(failedWasmRequests).toHaveLength(0);

    // Log all WASM-related requests for debugging
    wasmRequests.forEach(req => {
      console.log(`📦 [WASM REQUEST] ${req.url}`);
    });
  });
});
