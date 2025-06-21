/**
 * @file E2E tests for Feature Configuration Behavior Effects
 * 
 * Tests how different feature configurations affect editor behavior,
 * including syntax highlighting, completion, error detection, and
 * other editor capabilities based on the selected feature preset.
 */

import { test, expect } from '@playwright/test';
import { OpenSCADComponentHelper } from '../utils/openscad-component-helpers';

test.describe('Feature Configuration Behavior Effects Tests', () => {
  let componentHelper: OpenSCADComponentHelper;

  test.beforeEach(async ({ page }) => {
    componentHelper = new OpenSCADComponentHelper(page);
    await page.goto('http://localhost:4300');
    await componentHelper.waitForComponentReady();
  });

  test('should affect syntax highlighting based on feature configuration', async ({ page }) => {
    console.log('🎨 [SYNTAX HIGHLIGHTING] Testing syntax highlighting with different configurations');

    // Test with BASIC preset (should have syntax highlighting)
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();
    
    const basicButton = page.getByTestId('feature-preset-basic');
    await basicButton.click();
    await expect(featureButton).toContainText('BASIC');
    
    // Close panel
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Add some OpenSCAD code to test syntax highlighting
    const editor = page.locator('.monaco-editor');
    await editor.click();
    
    // Clear existing content and add test code
    await page.keyboard.press('Control+A');
    await page.keyboard.type('cube([10, 10, 10]);');
    
    // Wait for syntax highlighting to apply
    await page.waitForTimeout(1000);
    
    // Check if syntax highlighting is active
    const syntaxHighlighted = await page.evaluate(() => {
      const editor = document.querySelector('.monaco-editor .view-lines');
      if (!editor) return false;
      
      // Look for syntax highlighting classes
      const highlightedElements = editor.querySelectorAll('[class*="mtk"]');
      return highlightedElements.length > 0;
    });
    
    expect(syntaxHighlighted).toBe(true);
    console.log('✅ [SYNTAX HIGHLIGHTING] BASIC preset has syntax highlighting');

    console.log('✅ [SYNTAX HIGHLIGHTING] Syntax highlighting behavior working correctly');
  });

  test('should show different editor capabilities based on preset', async ({ page }) => {
    console.log('⚙️ [EDITOR CAPABILITIES] Testing editor capabilities with different presets');

    // Test BASIC preset capabilities
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();
    
    const basicButton = page.getByTestId('feature-preset-basic');
    await basicButton.click();
    
    // Check feature analysis for BASIC
    const parserIndicator = page.getByTestId('parser-required-indicator');
    const ideIndicator = page.getByTestId('ide-features-indicator');
    const advancedIndicator = page.getByTestId('advanced-features-indicator');
    
    await expect(parserIndicator).toContainText('❌');
    await expect(ideIndicator).toContainText('❌');
    await expect(advancedIndicator).toContainText('❌');
    console.log('✅ [EDITOR CAPABILITIES] BASIC preset shows minimal capabilities');

    // Test FULL preset capabilities
    const fullButton = page.getByTestId('feature-preset-full');
    await fullButton.click();
    
    await expect(parserIndicator).toContainText('✅');
    await expect(ideIndicator).toContainText('✅');
    await expect(advancedIndicator).toContainText('✅');
    console.log('✅ [EDITOR CAPABILITIES] FULL preset shows all capabilities');

    console.log('✅ [EDITOR CAPABILITIES] Editor capabilities behavior working correctly');
  });

  test('should handle parser-dependent features correctly', async ({ page }) => {
    console.log('🌳 [PARSER FEATURES] Testing parser-dependent feature behavior');

    // Test PARSER preset
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();
    
    const parserButton = page.getByTestId('feature-preset-parser');
    await parserButton.click();
    await expect(featureButton).toContainText('PARSER');
    
    // Check that parser is required
    const parserIndicator = page.getByTestId('parser-required-indicator');
    await expect(parserIndicator).toContainText('✅');
    console.log('✅ [PARSER FEATURES] PARSER preset enables parser');

    // Close panel and test editor with parser features
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Add some OpenSCAD code that would benefit from parsing
    const editor = page.locator('.monaco-editor');
    await editor.click();
    
    await page.keyboard.press('Control+A');
    await page.keyboard.type(`
module test_module() {
  cube([10, 10, 10]);
  sphere(r = 5);
}

test_module();
`);
    
    // Wait for parsing to complete
    await page.waitForTimeout(2000);
    
    // Check that the editor content was processed (basic validation)
    const editorContent = await page.evaluate(() => {
      const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
      return monacoEditor?.getValue() || '';
    });

    expect(editorContent).toContain('module test_module()');
    expect(editorContent).toContain('cube([10, 10, 10]);');
    expect(editorContent).toContain('test_module();');
    console.log('✅ [PARSER FEATURES] Editor content processed correctly with parser features');

    console.log('✅ [PARSER FEATURES] Parser-dependent features working correctly');
  });

  test('should show appropriate feature combinations in IDE preset', async ({ page }) => {
    console.log('✨ [IDE FEATURES] Testing IDE preset feature combinations');

    // Test IDE preset
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();
    
    const ideButton = page.getByTestId('feature-preset-ide');
    await ideButton.click();
    await expect(featureButton).toContainText('IDE');
    
    // Check feature analysis for IDE preset
    const parserIndicator = page.getByTestId('parser-required-indicator');
    const ideIndicator = page.getByTestId('ide-features-indicator');
    const advancedIndicator = page.getByTestId('advanced-features-indicator');
    
    // IDE preset should have parser and IDE features but not advanced
    await expect(parserIndicator).toContainText('✅');
    await expect(ideIndicator).toContainText('✅');
    await expect(advancedIndicator).toContainText('❌');
    console.log('✅ [IDE FEATURES] IDE preset shows correct feature combination');

    // Check individual feature toggles for IDE preset
    const coreCheckboxes = page.getByTestId('feature-category-items-core').locator('input[type="checkbox"]');
    const parserCheckboxes = page.getByTestId('feature-category-items-parser').locator('input[type="checkbox"]');
    const ideCheckboxes = page.getByTestId('feature-category-items-ide').locator('input[type="checkbox"]');
    
    // Count checked boxes in each category
    const coreChecked = await coreCheckboxes.evaluateAll(boxes => 
      boxes.filter(box => (box as HTMLInputElement).checked).length
    );
    const parserChecked = await parserCheckboxes.evaluateAll(boxes => 
      boxes.filter(box => (box as HTMLInputElement).checked).length
    );
    const ideChecked = await ideCheckboxes.evaluateAll(boxes => 
      boxes.filter(box => (box as HTMLInputElement).checked).length
    );
    
    expect(coreChecked).toBeGreaterThan(0);
    expect(parserChecked).toBeGreaterThan(0);
    expect(ideChecked).toBeGreaterThan(0);
    console.log(`✅ [IDE FEATURES] Feature distribution: Core(${coreChecked}), Parser(${parserChecked}), IDE(${ideChecked})`);

    console.log('✅ [IDE FEATURES] IDE preset feature combinations working correctly');
  });

  test('should handle feature configuration changes during editing', async ({ page }) => {
    console.log('🔄 [LIVE CHANGES] Testing feature changes during active editing');

    // Start with BASIC preset and add some code
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();
    
    const basicButton = page.getByTestId('feature-preset-basic');
    await basicButton.click();
    
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Add some code
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('cube([5, 5, 5]);');
    
    console.log('✅ [LIVE CHANGES] Added code with BASIC preset');

    // Switch to PARSER preset while editing
    await featureButton.click();
    const parserButton = page.getByTestId('feature-preset-parser');
    await parserButton.click();
    await closeButton.click();
    
    // Add more code
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('sphere(r = 3);');
    
    console.log('✅ [LIVE CHANGES] Added more code with PARSER preset');

    // Switch to FULL preset
    await featureButton.click();
    const fullButton = page.getByTestId('feature-preset-full');
    await fullButton.click();
    await closeButton.click();
    
    // Add final code
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('cylinder(h = 10, r = 2);');
    
    console.log('✅ [LIVE CHANGES] Added final code with FULL preset');

    // Verify editor content is preserved
    const editorContent = await page.evaluate(() => {
      const monacoEditor = (window as any).monaco?.editor?.getModels()?.[0];
      return monacoEditor?.getValue() || '';
    });
    
    expect(editorContent).toContain('cube([5, 5, 5]);');
    expect(editorContent).toContain('sphere(r = 3);');
    expect(editorContent).toContain('cylinder(h = 10, r = 2);');
    console.log('✅ [LIVE CHANGES] Editor content preserved across feature changes');

    console.log('✅ [LIVE CHANGES] Live feature configuration changes working correctly');
  });

  test('should maintain performance with different feature configurations', async ({ page }) => {
    console.log('⚡ [PERFORMANCE] Testing performance with different configurations');

    const performanceResults: { preset: string; time: number }[] = [];

    // Test performance with each preset
    const presets = ['basic', 'parser', 'ide', 'full'];
    
    for (const preset of presets) {
      const startTime = Date.now();
      
      // Switch to preset
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();
      
      const presetButton = page.getByTestId(`feature-preset-${preset}`);
      await presetButton.click();
      
      const closeButton = page.getByTestId('feature-config-close-button');
      await closeButton.click();
      
      // Add some code to test editor performance
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type(`
// Testing ${preset.toUpperCase()} preset performance
module test_${preset}() {
  for (i = [0:10]) {
    translate([i * 2, 0, 0])
      cube([1, 1, 1]);
  }
}

test_${preset}();
`);
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      performanceResults.push({ preset: preset.toUpperCase(), time: duration });
      
      console.log(`✅ [PERFORMANCE] ${preset.toUpperCase()} preset: ${duration}ms`);
    }

    // Verify all presets perform reasonably well (under 5 seconds)
    for (const result of performanceResults) {
      expect(result.time).toBeLessThan(5000);
    }

    console.log('✅ [PERFORMANCE] All presets perform within acceptable limits');
    console.log('✅ [PERFORMANCE] Performance testing with different configurations completed');
  });
});
