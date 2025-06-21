import { test, expect } from '../fixtures/debug.fixture';
import { MonacoEditorHelper } from '../utils/monaco-helpers';

/**
 * @file E2E tests for Monaco Editor code input and editing operations
 * Tests fundamental text editing capabilities and user interactions
 * 
 * Following project standards:
 * - No mocks for Monaco Editor (uses real editor interactions)
 * - Real user interaction patterns (typing, selection, copy/paste)
 * - Performance monitoring for editing operations
 * - Accessibility compliance for editing features
 * 
 * Based on research findings:
 * - Real user interactions via ARIA roles (role="code")
 * - Proper keyboard event handling
 * - Selection and clipboard operations
 * - Cursor positioning and movement
 */

test.describe('Monaco Editor - Code Input and Editing Tests', () => {
  let monacoHelper: MonacoEditorHelper;

  test.beforeEach(async ({ page, debugLogs }) => {
    monacoHelper = new MonacoEditorHelper(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await monacoHelper.waitForEditorReady();
    
    // Start with clean editor
    await monacoHelper.clearEditor();
    
    console.log(`🔧 [EDIT SETUP] Ready for code input tests, initial logs: ${debugLogs.consoleLogs.length}`);
  });

  test('should handle basic text input correctly', async () => {
    const testText = 'cube([10, 10, 10]);';
    
    // Type text character by character (simulates real user typing)
    await monacoHelper.typeInEditor(testText);
    
    // Verify content was entered correctly
    const content = await monacoHelper.getEditorContent();
    expect(content.trim()).toBe(testText);
    
    // Check cursor position after typing
    const cursorPosition = await monacoHelper.getCursorPosition();
    expect(cursorPosition.column).toBe(testText.length + 1);
    
    console.log(`✅ [INPUT] Basic text input working correctly, cursor at line ${cursorPosition.line}, column ${cursorPosition.column}`);
  });

  test('should handle multi-line input and line breaks', async () => {
    const multiLineText = `// Multi-line OpenSCAD code
module test_shape() {
    cube([5, 5, 5]);
    translate([10, 0, 0]) {
        sphere(r = 3);
    }
}

test_shape();`;

    await monacoHelper.setEditorContent(multiLineText);
    
    // Verify all lines are present
    const content = await monacoHelper.getEditorContent();
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    expect(lines.length).toBeGreaterThanOrEqual(7); // Should have multiple lines
    expect(content).toContain('module test_shape()');
    expect(content).toContain('cube([5, 5, 5])');
    expect(content).toContain('sphere(r = 3)');
    
    console.log(`📝 [MULTILINE] Multi-line input working correctly with ${lines.length} non-empty lines`);
  });

  test('should support cursor positioning and movement', async () => {
    const testCode = `cube([10, 10, 10]);
sphere(r = 5);
cylinder(h = 20, r = 3);`;

    await monacoHelper.setEditorContent(testCode);
    
    // Test arrow key navigation
    const codeElement = monacoHelper.page.locator('[role="code"]').first();
    await codeElement.click();
    
    // Move to beginning of document
    await monacoHelper.page.keyboard.press('Control+Home');
    let position = await monacoHelper.getCursorPosition();
    expect(position.line).toBe(1);
    expect(position.column).toBe(1);
    
    // Move down one line
    await monacoHelper.page.keyboard.press('ArrowDown');
    position = await monacoHelper.getCursorPosition();
    expect(position.line).toBe(2);
    
    // Move to end of line
    await monacoHelper.page.keyboard.press('End');
    position = await monacoHelper.getCursorPosition();
    expect(position.column).toBeGreaterThan(10); // Should be at end of "sphere(r = 5);"
    
    console.log(`🎯 [CURSOR] Cursor movement working correctly, final position: line ${position.line}, column ${position.column}`);
  });

  test('should handle text selection operations', async () => {
    const testCode = `cube([10, 10, 10]);
sphere(r = 5);`;

    await monacoHelper.setEditorContent(testCode);
    
    // Focus editor and select all text
    const codeElement = monacoHelper.page.locator('[role="code"]').first();
    await codeElement.click();
    await monacoHelper.page.keyboard.press('Control+a');
    
    // Verify selection by checking if typing replaces all content
    await monacoHelper.page.keyboard.type('cylinder(h = 10, r = 2);');
    
    const content = await monacoHelper.getEditorContent();
    expect(content.trim()).toBe('cylinder(h = 10, r = 2);');
    expect(content).not.toContain('cube');
    expect(content).not.toContain('sphere');
    
    console.log(`✂️ [SELECTION] Text selection and replacement working correctly`);
  });

  test('should support copy and paste operations', async () => {
    const originalText = 'cube([5, 5, 5]);';
    
    await monacoHelper.setEditorContent(originalText);
    
    // Select all and copy
    const codeElement = monacoHelper.page.locator('[role="code"]').first();
    await codeElement.click();
    await monacoHelper.page.keyboard.press('Control+a');
    await monacoHelper.page.keyboard.press('Control+c');
    
    // Move to end and paste
    await monacoHelper.page.keyboard.press('End');
    await monacoHelper.page.keyboard.press('Enter');
    await monacoHelper.page.keyboard.press('Control+v');
    
    const content = await monacoHelper.getEditorContent();
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Should have the original line plus the pasted copy
    expect(lines.length).toBe(2);
    expect(lines[0].trim()).toBe(originalText);
    expect(lines[1].trim()).toBe(originalText);
    
    console.log(`📋 [CLIPBOARD] Copy and paste operations working correctly`);
  });

  test('should handle undo and redo operations', async () => {
    // Type initial content
    await monacoHelper.typeInEditor('cube([10, 10, 10]);');
    const afterFirstType = await monacoHelper.getEditorContent();
    
    // Type additional content
    await monacoHelper.page.keyboard.press('Enter');
    await monacoHelper.typeInEditor('sphere(r = 5);');
    const afterSecondType = await monacoHelper.getEditorContent();
    
    // Undo last action
    await monacoHelper.page.keyboard.press('Control+z');
    const afterUndo = await monacoHelper.getEditorContent();
    
    // Should not contain the sphere line
    expect(afterUndo).toContain('cube([10, 10, 10])');
    expect(afterUndo).not.toContain('sphere(r = 5)');
    
    // Redo the action
    await monacoHelper.page.keyboard.press('Control+y');
    const afterRedo = await monacoHelper.getEditorContent();
    
    // Should contain both lines again
    expect(afterRedo).toContain('cube([10, 10, 10])');
    expect(afterRedo).toContain('sphere(r = 5)');
    
    console.log(`↩️ [UNDO/REDO] Undo and redo operations working correctly`);
  });

  test('should handle special characters and symbols', async () => {
    const specialCharsCode = `// Special characters test
module special_chars() {
    // Mathematical symbols: π, ∞, ≤, ≥
    angle = 45; // degrees
    radius = 10.5;
    
    // Brackets and parentheses: [], (), {}
    cube([10, 20, 30]);
    translate([0, 0, 0]) {
        sphere(r = radius);
    }
    
    // String with quotes
    echo("Hello, OpenSCAD!");
}`;

    await monacoHelper.setEditorContent(specialCharsCode);
    
    const content = await monacoHelper.getEditorContent();
    
    // Verify special characters are preserved
    expect(content).toContain('π, ∞, ≤, ≥');
    expect(content).toContain('[10, 20, 30]');
    expect(content).toContain('"Hello, OpenSCAD!"');
    expect(content).toContain('radius = 10.5');
    
    console.log(`🔣 [SPECIAL CHARS] Special characters handled correctly`);
  });

  test('should maintain performance during intensive editing', async () => {
    monacoHelper.clearPerformanceMetrics();
    
    // Perform multiple editing operations
    const operations = [
      'cube([1, 1, 1]);',
      'sphere(r = 2);',
      'cylinder(h = 5, r = 1);',
      'translate([10, 0, 0]) { cube([2, 2, 2]); }',
      'rotate([0, 0, 45]) { sphere(r = 3); }'
    ];
    
    for (const operation of operations) {
      await monacoHelper.page.keyboard.press('Enter');
      await monacoHelper.typeInEditor(operation);
      await monacoHelper.page.waitForTimeout(100); // Small delay between operations
    }
    
    const content = await monacoHelper.getEditorContent();
    
    // Verify all operations were applied
    operations.forEach(operation => {
      expect(content).toContain(operation);
    });
    
    // Check performance metrics
    const metrics = monacoHelper.getPerformanceMetrics();
    console.log(`📊 [PERFORMANCE] Recorded ${metrics.length} operations during intensive editing`);
    
    // All operations should complete reasonably quickly
    metrics.forEach(metric => {
      expect(metric.duration).toBeLessThan(2000); // 2 seconds max per operation
    });
    
    console.log(`⚡ [PERFORMANCE] Intensive editing performance is acceptable`);
  });

  test('should handle large text input efficiently', async () => {
    // Generate a large OpenSCAD code block
    const largeCode = Array.from({ length: 50 }, (_, i) => 
      `// Line ${i + 1}
translate([${i * 2}, 0, 0]) {
    cube([1, 1, 1]);
    sphere(r = 0.5);
}`
    ).join('\n\n');
    
    const startTime = Date.now();
    await monacoHelper.setEditorContent(largeCode);
    const endTime = Date.now();
    
    const processingTime = endTime - startTime;
    console.log(`⏱️  [LARGE INPUT] Large text processing time: ${processingTime}ms`);
    
    // Verify content was set correctly
    const content = await monacoHelper.getEditorContent();
    expect(content).toContain('// Line 1');
    expect(content).toContain('// Line 50');
    expect(content.split('\n').length).toBeGreaterThan(100); // Should have many lines
    
    // Should process large content reasonably quickly
    expect(processingTime).toBeLessThan(5000); // 5 seconds max
    
    console.log(`📄 [LARGE INPUT] Large text input handled efficiently`);
  });
});
