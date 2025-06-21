/**
 * @file Feature Comparison Panel E2E Tests
 * 
 * Comprehensive E2E tests for the Feature Comparison Panel component that demonstrates
 * the unified editor's feature toggle capabilities through side-by-side comparisons.
 * 
 * Tests cover:
 * - Panel visibility and interaction
 * - Configuration selection and limits
 * - Performance metrics functionality
 * - Side-by-side editor comparison
 * - Accessibility compliance
 * - Real Monaco Editor integration
 * 
 * Following project standards:
 * - No mocks for OpenSCAD Editor (uses real editor instances)
 * - Real user interactions via proper test IDs
 * - Performance monitoring and accessibility testing
 * - Comprehensive error handling and edge cases
 */

import { test, expect, Page } from '@playwright/test';
import { MonacoEditorHelper, setupDemoPage } from '../utils/monaco-helpers';

/**
 * Test configuration for Feature Comparison Panel
 */
interface FeatureComparisonTestConfig {
  maxConfigurations: number;
  availableConfigurations: string[];
  defaultSelections: string[];
}

const TEST_CONFIG: FeatureComparisonTestConfig = {
  maxConfigurations: 3,
  availableConfigurations: ['BASIC', 'PARSER', 'IDE', 'FULL'],
  defaultSelections: ['BASIC', 'IDE']
};

/**
 * Helper class for Feature Comparison Panel E2E testing
 */
class FeatureComparisonHelper {
  constructor(private page: Page) {}

  /**
   * [INIT] Open the Feature Comparison Panel
   */
  async openFeatureComparisonPanel(): Promise<void> {
    console.log('[INIT] Opening Feature Comparison Panel...');
    
    // Click the "🔄 Compare Features" button
    const compareButton = this.page.locator('[data-testid="feature-comparison-button"]');
    await expect(compareButton).toBeVisible();
    await compareButton.click();
    
    // Wait for panel to be visible
    await expect(this.page.locator('.feature-comparison-panel')).toBeVisible();
    
    console.log('[DEBUG] Feature Comparison Panel opened successfully');
  }

  /**
   * [DEBUG] Check if Feature Comparison Panel is visible
   */
  async isFeatureComparisonPanelVisible(): Promise<boolean> {
    const panel = this.page.locator('.feature-comparison-panel');
    return await panel.isVisible();
  }

  /**
   * [DEBUG] Get selected configurations
   */
  async getSelectedConfigurations(): Promise<string[]> {
    const selectedConfigs: string[] = [];
    
    for (const config of TEST_CONFIG.availableConfigurations) {
      const checkbox = this.page.locator(`#config-${config}`);
      if (await checkbox.isChecked()) {
        selectedConfigs.push(config);
      }
    }
    
    console.log('[DEBUG] Selected configurations:', selectedConfigs);
    return selectedConfigs;
  }

  /**
   * [DEBUG] Select a configuration
   */
  async selectConfiguration(config: string): Promise<void> {
    console.log(`[DEBUG] Selecting configuration: ${config}`);

    const checkbox = this.page.locator(`#config-${config}`);
    await expect(checkbox).toBeVisible();

    // Use force click to avoid interception issues
    await checkbox.check({ force: true });

    // Wait for UI to update
    await this.page.waitForTimeout(500);
  }

  /**
   * [DEBUG] Deselect a configuration
   */
  async deselectConfiguration(config: string): Promise<void> {
    console.log(`[DEBUG] Deselecting configuration: ${config}`);

    const checkbox = this.page.locator(`#config-${config}`);
    await expect(checkbox).toBeVisible();

    // Use force click to avoid interception issues
    await checkbox.uncheck({ force: true });

    // Wait for UI to update
    await this.page.waitForTimeout(500);
  }

  /**
   * [DEBUG] Check if configuration is disabled
   */
  async isConfigurationDisabled(config: string): Promise<boolean> {
    const checkbox = this.page.locator(`#config-${config}`);
    return await checkbox.isDisabled();
  }

  /**
   * [DEBUG] Run performance comparison
   */
  async runPerformanceComparison(): Promise<void> {
    console.log('[DEBUG] Running performance comparison...');

    const compareButton = this.page.locator('button:has-text("🚀 Run Comparison")');
    await expect(compareButton).toBeVisible();
    await expect(compareButton).not.toBeDisabled();

    // Use force click to avoid interception issues
    await compareButton.click({ force: true });

    // Wait for comparison to complete
    await expect(this.page.locator('button:has-text("⏳ Measuring...")')).toBeVisible();
    await expect(this.page.locator('button:has-text("🚀 Run Comparison")')).toBeVisible({ timeout: 5000 });

    console.log('[DEBUG] Performance comparison completed');
  }

  /**
   * [DEBUG] Get performance metrics from table
   */
  async getPerformanceMetrics(): Promise<Record<string, any>[]> {
    const metrics: Record<string, any>[] = [];
    
    // Get table rows (skip header)
    const rows = this.page.locator('.metrics-table tbody tr');
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      
      const metric = {
        configuration: await cells.nth(0).textContent(),
        initTime: await cells.nth(1).textContent(),
        parseTime: await cells.nth(2).textContent(),
        memory: await cells.nth(3).textContent(),
        features: await cells.nth(4).textContent(),
        bundleSize: await cells.nth(5).textContent()
      };
      
      metrics.push(metric);
    }
    
    console.log('[DEBUG] Performance metrics:', metrics);
    return metrics;
  }

  /**
   * [DEBUG] Get number of visible editor panels
   */
  async getVisibleEditorPanelCount(): Promise<number> {
    const panels = this.page.locator('.editor-panel');
    const count = await panels.count();
    console.log('[DEBUG] Visible editor panels:', count);
    return count;
  }

  /**
   * [DEBUG] Get editor panel configurations
   */
  async getEditorPanelConfigurations(): Promise<string[]> {
    const configs: string[] = [];
    const panels = this.page.locator('.editor-panel');
    const count = await panels.count();
    
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      const header = panel.locator('.panel-header h5');
      const configText = await header.textContent();
      if (configText) {
        // Extract configuration name (e.g., "BASIC Configuration" -> "BASIC")
        const config = configText.replace(' Configuration', '');
        configs.push(config);
      }
    }
    
    console.log('[DEBUG] Editor panel configurations:', configs);
    return configs;
  }

  /**
   * [DEBUG] Check if Monaco editors are loaded in panels
   */
  async areMonacoEditorsLoaded(): Promise<boolean> {
    // Check for Monaco editor containers within editor panels
    const monacoEditors = this.page.locator('.editor-panel .monaco-editor');
    const count = await monacoEditors.count();
    const expectedCount = await this.getVisibleEditorPanelCount();
    
    console.log(`[DEBUG] Monaco editors loaded: ${count}/${expectedCount}`);
    return count === expectedCount && count > 0;
  }

  /**
   * [DEBUG] Validate accessibility compliance
   */
  async validateAccessibility(): Promise<{
    hasProperLabels: boolean;
    keyboardNavigable: boolean;
    semanticStructure: boolean;
  }> {
    console.log('[DEBUG] Validating accessibility compliance...');
    
    // Check for proper ARIA labels
    const labeledCheckboxes = this.page.locator('input[type="checkbox"][id^="config-"]');
    const labeledCount = await labeledCheckboxes.count();
    const hasProperLabels = labeledCount === TEST_CONFIG.availableConfigurations.length;
    
    // Check keyboard navigation
    const firstCheckbox = this.page.locator('#config-BASIC');
    await firstCheckbox.focus();
    const keyboardNavigable = await firstCheckbox.evaluate(el => document.activeElement === el);
    
    // Check semantic structure
    const hasHeadings = await this.page.locator('h3, h4, h5').count() > 0;
    const hasProperTable = await this.page.locator('table thead th').count() > 0;
    const semanticStructure = hasHeadings && hasProperTable;
    
    const result = {
      hasProperLabels,
      keyboardNavigable,
      semanticStructure
    };
    
    console.log('[DEBUG] Accessibility validation result:', result);
    return result;
  }
}

test.describe('Feature Comparison Panel E2E Tests', () => {
  let helper: FeatureComparisonHelper;
  let monacoHelper: MonacoEditorHelper;

  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up Feature Comparison Panel E2E test...');
    
    // Setup demo page
    await setupDemoPage(page);
    
    // Initialize helpers
    helper = new FeatureComparisonHelper(page);
    monacoHelper = new MonacoEditorHelper(page);
    
    // Wait for main editor to be ready
    await monacoHelper.waitForEditorReady();
    
    console.log('[DEBUG] Test setup completed');
  });

  test.describe('Panel Visibility and Interaction', () => {
    test('should open and close Feature Comparison Panel', async () => {
      console.log('[INIT] Testing panel visibility and interaction...');
      
      // Initially panel should not be visible
      expect(await helper.isFeatureComparisonPanelVisible()).toBe(false);
      
      // Open the panel
      await helper.openFeatureComparisonPanel();
      expect(await helper.isFeatureComparisonPanelVisible()).toBe(true);
      
      // Close the panel
      const compareButton = helper.page.locator('[data-testid="feature-comparison-button"]');
      await compareButton.click();
      expect(await helper.isFeatureComparisonPanelVisible()).toBe(false);
      
      console.log('[END] Panel visibility test completed successfully');
    });

    test('should display all required UI elements', async () => {
      console.log('[INIT] Testing UI elements presence...');
      
      await helper.openFeatureComparisonPanel();
      
      // Check main sections
      await expect(helper.page.locator('h3:has-text("🔄 Feature Configuration Comparison")')).toBeVisible();
      await expect(helper.page.locator('h4:has-text("Select Configurations to Compare")')).toBeVisible();
      await expect(helper.page.locator('h4:has-text("📊 Performance Comparison")')).toBeVisible();
      await expect(helper.page.locator('h4:has-text("🎯 Live Editor Comparison")')).toBeVisible();
      
      // Check configuration checkboxes
      for (const config of TEST_CONFIG.availableConfigurations) {
        await expect(helper.page.locator(`#config-${config}`)).toBeVisible();
      }
      
      // Check performance comparison button
      await expect(helper.page.locator('button:has-text("🚀 Run Comparison")')).toBeVisible();
      
      console.log('[END] UI elements test completed successfully');
    });
  });

  test.describe('Configuration Selection', () => {
    test('should have default configurations selected', async () => {
      console.log('[INIT] Testing default configuration selection...');
      
      await helper.openFeatureComparisonPanel();
      
      const selectedConfigs = await helper.getSelectedConfigurations();
      expect(selectedConfigs).toEqual(expect.arrayContaining(TEST_CONFIG.defaultSelections));
      expect(selectedConfigs.length).toBe(TEST_CONFIG.defaultSelections.length);
      
      console.log('[END] Default configuration test completed successfully');
    });

    test('should allow selecting and deselecting configurations', async () => {
      console.log('[INIT] Testing configuration selection/deselection...');
      
      await helper.openFeatureComparisonPanel();
      
      // Deselect a default configuration
      await helper.deselectConfiguration('BASIC');
      let selectedConfigs = await helper.getSelectedConfigurations();
      expect(selectedConfigs).not.toContain('BASIC');
      
      // Select a new configuration
      await helper.selectConfiguration('PARSER');
      selectedConfigs = await helper.getSelectedConfigurations();
      expect(selectedConfigs).toContain('PARSER');
      
      console.log('[END] Configuration selection test completed successfully');
    });

    test('should enforce maximum configuration limit', async () => {
      console.log('[INIT] Testing maximum configuration limit...');
      
      await helper.openFeatureComparisonPanel();
      
      // Select maximum number of configurations
      await helper.selectConfiguration('PARSER');
      await helper.selectConfiguration('FULL');
      
      // Check that we have 3 configurations selected (BASIC, IDE from default + PARSER)
      const selectedConfigs = await helper.getSelectedConfigurations();
      expect(selectedConfigs.length).toBe(TEST_CONFIG.maxConfigurations);
      
      // Check that FULL is disabled (4th configuration)
      const isFullDisabled = await helper.isConfigurationDisabled('FULL');
      expect(isFullDisabled).toBe(true);
      
      console.log('[END] Maximum configuration limit test completed successfully');
    });
  });

  test.describe('Performance Metrics', () => {
    test('should run performance comparison and display metrics', async () => {
      console.log('[INIT] Testing performance metrics functionality...');

      await helper.openFeatureComparisonPanel();

      // Run performance comparison
      await helper.runPerformanceComparison();

      // Check that metrics table is populated
      const metrics = await helper.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      // Verify metrics structure
      for (const metric of metrics) {
        expect(metric.configuration).toBeTruthy();
        expect(metric.initTime).toBeTruthy();
        expect(metric.parseTime).toBeTruthy();
        expect(metric.memory).toBeTruthy();
        expect(metric.features).toBeTruthy();
        expect(metric.bundleSize).toBeTruthy();
      }

      console.log('[END] Performance metrics test completed successfully');
    });

    test('should disable comparison button when no configurations selected', async () => {
      console.log('[INIT] Testing comparison button state...');

      await helper.openFeatureComparisonPanel();

      // Deselect all configurations
      for (const config of TEST_CONFIG.defaultSelections) {
        await helper.deselectConfiguration(config);
      }

      // Check that comparison button is disabled
      const compareButton = helper.page.locator('button:has-text("🚀 Run Comparison")');
      await expect(compareButton).toBeDisabled();

      console.log('[END] Comparison button state test completed successfully');
    });
  });

  test.describe('Side-by-Side Editor Comparison', () => {
    test('should display correct number of editor panels', async () => {
      console.log('[INIT] Testing editor panel display...');

      await helper.openFeatureComparisonPanel();

      // Check default number of panels
      const defaultPanelCount = await helper.getVisibleEditorPanelCount();
      expect(defaultPanelCount).toBe(TEST_CONFIG.defaultSelections.length);

      // Add another configuration
      await helper.selectConfiguration('PARSER');
      const updatedPanelCount = await helper.getVisibleEditorPanelCount();
      expect(updatedPanelCount).toBe(TEST_CONFIG.defaultSelections.length + 1);

      console.log('[END] Editor panel display test completed successfully');
    });

    test('should load Monaco editors in each panel', async () => {
      console.log('[INIT] Testing Monaco editor loading...');

      await helper.openFeatureComparisonPanel();

      // Wait for editors to load
      await helper.page.waitForTimeout(2000);

      // Check that Monaco editors are loaded
      const editorsLoaded = await helper.areMonacoEditorsLoaded();
      expect(editorsLoaded).toBe(true);

      console.log('[END] Monaco editor loading test completed successfully');
    });

    test('should display correct configuration names in panels', async () => {
      console.log('[INIT] Testing configuration names in panels...');

      await helper.openFeatureComparisonPanel();

      const panelConfigs = await helper.getEditorPanelConfigurations();
      const selectedConfigs = await helper.getSelectedConfigurations();

      expect(panelConfigs.sort()).toEqual(selectedConfigs.sort());

      console.log('[END] Configuration names test completed successfully');
    });

    test('should show feature badges for each configuration', async () => {
      console.log('[INIT] Testing feature badges display...');

      await helper.openFeatureComparisonPanel();

      // Check for feature badges in panels
      const parserBadges = helper.page.locator('.parser-badge');
      const ideBadges = helper.page.locator('.ide-badge');
      const advancedBadges = helper.page.locator('.advanced-badge');

      // Should have at least some badges visible
      const totalBadges = await parserBadges.count() + await ideBadges.count() + await advancedBadges.count();
      expect(totalBadges).toBeGreaterThan(0);

      console.log('[END] Feature badges test completed successfully');
    });
  });

  test.describe('Accessibility and User Experience', () => {
    test('should meet accessibility requirements', async () => {
      console.log('[INIT] Testing accessibility compliance...');

      await helper.openFeatureComparisonPanel();

      const accessibility = await helper.validateAccessibility();

      expect(accessibility.hasProperLabels).toBe(true);
      expect(accessibility.keyboardNavigable).toBe(true);
      expect(accessibility.semanticStructure).toBe(true);

      console.log('[END] Accessibility compliance test completed successfully');
    });

    test('should support keyboard navigation', async ({ page }) => {
      console.log('[INIT] Testing keyboard navigation...');

      await helper.openFeatureComparisonPanel();

      // Test Tab navigation through checkboxes
      const firstCheckbox = page.locator('#config-BASIC');
      await firstCheckbox.focus();

      // Navigate with Tab key
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that focus moved
      const activeElement = await page.evaluate(() => document.activeElement?.id);
      expect(activeElement).toBeTruthy();

      console.log('[END] Keyboard navigation test completed successfully');
    });

    test('should handle responsive design', async ({ page }) => {
      console.log('[INIT] Testing responsive design...');

      await helper.openFeatureComparisonPanel();

      // Test different viewport sizes
      await page.setViewportSize({ width: 1200, height: 800 });
      expect(await helper.isFeatureComparisonPanelVisible()).toBe(true);

      await page.setViewportSize({ width: 800, height: 600 });
      expect(await helper.isFeatureComparisonPanelVisible()).toBe(true);

      console.log('[END] Responsive design test completed successfully');
    });
  });

  test.describe('Integration with Main Demo', () => {
    test('should not interfere with main editor functionality', async () => {
      console.log('[INIT] Testing main editor integration...');

      // Test main editor before opening comparison panel
      await monacoHelper.setEditorContent('cube([10, 10, 10]);');
      const initialContent = await monacoHelper.getEditorContent();
      expect(initialContent).toContain('cube([10, 10, 10]);');

      // Open comparison panel
      await helper.openFeatureComparisonPanel();

      // Test main editor after opening comparison panel
      const contentAfterPanel = await monacoHelper.getEditorContent();
      expect(contentAfterPanel).toBe(initialContent);

      // Test typing in main editor
      await monacoHelper.typeInEditor('\nsphere(r=5);');
      const finalContent = await monacoHelper.getEditorContent();
      expect(finalContent).toContain('sphere(r=5);');

      console.log('[END] Main editor integration test completed successfully');
    });

    test('should preserve demo state when toggling panel', async () => {
      console.log('[INIT] Testing demo state preservation...');

      // Set some content in main editor
      await monacoHelper.setEditorContent('// Test content\ncube([5, 5, 5]);');

      // Open and close comparison panel multiple times
      await helper.openFeatureComparisonPanel();
      await helper.page.locator('[data-testid="feature-comparison-button"]').click();
      await helper.openFeatureComparisonPanel();
      await helper.page.locator('[data-testid="feature-comparison-button"]').click();

      // Check that main editor content is preserved
      const preservedContent = await monacoHelper.getEditorContent();
      expect(preservedContent).toContain('// Test content');
      expect(preservedContent).toContain('cube([5, 5, 5]);');

      console.log('[END] Demo state preservation test completed successfully');
    });
  });
});
