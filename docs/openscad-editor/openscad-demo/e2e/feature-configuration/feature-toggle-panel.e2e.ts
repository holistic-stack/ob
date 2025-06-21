/**
 * @file E2E tests for the Feature Configuration Panel
 * 
 * Tests the interactive feature toggle panel that demonstrates the unified editor's
 * feature-toggle architecture. Validates preset switching, individual feature toggles,
 * and real-time configuration updates.
 */

import { test, expect } from '@playwright/test';
import { OpenSCADComponentHelper } from '../utils/openscad-component-helpers';

test.describe('Feature Configuration Panel Tests', () => {
  let componentHelper: OpenSCADComponentHelper;

  test.beforeEach(async ({ page }) => {
    componentHelper = new OpenSCADComponentHelper(page);
    await page.goto('http://localhost:4300');
    await componentHelper.waitForComponentReady();
  });

  test('should open and close feature configuration panel', async ({ page }) => {
    console.log('🎛️ [FEATURE PANEL] Testing panel open/close functionality');

    // Monitor for JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`🚨 [ERROR] ${msg.text()}`);
      }
    });

    // Find and click the feature configuration button
    const featureButton = page.getByTestId('feature-toggle-button');
    await expect(featureButton).toBeVisible();

    // Panel should not exist initially (conditionally rendered)
    // Check for preset buttons instead of panel container
    const presetButton = page.getByTestId('feature-preset-basic');
    await expect(presetButton).toHaveCount(0);

    // Click to open panel
    console.log('🔍 [DEBUG] Clicking feature button...');
    await featureButton.click();
    console.log('🔍 [DEBUG] Button clicked');

    // Wait for panel to appear by checking for preset buttons
    try {
      await page.waitForSelector('[data-testid="feature-preset-basic"]', { timeout: 5000 });
      console.log('✅ [DEBUG] Panel content appeared');
    } catch (error) {
      console.log('❌ [DEBUG] Panel content did not appear within 5 seconds');

      // Check if any preset buttons are visible
      const presetCount = await presetButton.count();
      console.log(`🔍 [DEBUG] Preset button count: ${presetCount}`);
    }

    await expect(presetButton).toBeVisible();

    console.log('✅ [FEATURE PANEL] Panel opened successfully');

    // Click close button to close panel
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Wait for panel to disappear
    await page.waitForTimeout(500);
    await expect(presetButton).toHaveCount(0);

    console.log('✅ [FEATURE PANEL] Panel closed successfully');
  });

  test('should display all feature presets', async ({ page }) => {
    console.log('🎛️ [PRESETS] Testing feature preset display');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Check that all presets are displayed in the feature config panel
    const presets = ['basic', 'parser', 'ide', 'full'];
    for (const preset of presets) {
      const presetButton = page.getByTestId(`feature-preset-${preset}`);
      await expect(presetButton).toBeVisible();
      console.log(`✅ [PRESETS] ${preset.toUpperCase()} preset button found`);
    }

    console.log('✅ [PRESETS] All feature presets displayed correctly');
  });

  test('should switch between feature presets', async ({ page }) => {
    console.log('🎛️ [PRESET SWITCH] Testing preset switching functionality');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Test switching to BASIC preset
    const basicButton = page.getByTestId('feature-preset-basic');
    await basicButton.click();

    // Verify the button text updates to show BASIC
    await expect(featureButton).toContainText('BASIC');
    console.log('✅ [PRESET SWITCH] Switched to BASIC preset');

    // Test switching to FULL preset
    const fullButton = page.getByTestId('feature-preset-full');
    await fullButton.click();

    // Verify the button text updates to show FULL
    await expect(featureButton).toContainText('FULL');
    console.log('✅ [PRESET SWITCH] Switched to FULL preset');

    console.log('✅ [PRESET SWITCH] Preset switching working correctly');
  });

  test('should display individual feature toggles', async ({ page }) => {
    console.log('🎛️ [FEATURE TOGGLES] Testing individual feature toggle display');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Check that feature categories are displayed in the feature config panel
    const categories = ['core', 'parser', 'ide', 'advanced'];
    for (const category of categories) {
      const categoryHeader = page.getByTestId(`feature-category-header-${category}`);
      await expect(categoryHeader).toBeVisible();
      console.log(`✅ [FEATURE TOGGLES] ${category} category found`);
    }

    // Check that individual feature checkboxes are present in the feature config panel
    const checkboxes = page.getByTestId('individual-features-container').locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);
    console.log(`✅ [FEATURE TOGGLES] Found ${checkboxCount} feature checkboxes`);

    console.log('✅ [FEATURE TOGGLES] Individual feature toggles displayed correctly');
  });

  test('should toggle individual features and switch to custom mode', async ({ page }) => {
    console.log('🎛️ [CUSTOM MODE] Testing custom feature configuration');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Start with IDE preset
    const ideButton = page.getByTestId('feature-preset-ide');
    await ideButton.click();
    await expect(featureButton).toContainText('IDE');

    // Toggle a feature checkbox
    const firstCheckbox = page.getByTestId('individual-features-container').locator('input[type="checkbox"]').first();
    await firstCheckbox.click();

    // Verify it switches to custom mode
    await expect(featureButton).toContainText('CUSTOM');
    console.log('✅ [CUSTOM MODE] Switched to custom mode after feature toggle');

    console.log('✅ [CUSTOM MODE] Custom feature configuration working correctly');
  });

  test('should display feature analysis information', async ({ page }) => {
    console.log('🎛️ [ANALYSIS] Testing feature analysis display');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Check that feature analysis section is displayed
    const analysisSection = page.getByTestId('feature-analysis-section');
    await expect(analysisSection).toBeVisible();

    // Check for analysis information
    const parserRequired = page.getByTestId('parser-required-indicator');
    const ideFeatures = page.getByTestId('ide-features-indicator');
    const advancedFeatures = page.getByTestId('advanced-features-indicator');

    await expect(parserRequired).toBeVisible();
    await expect(ideFeatures).toBeVisible();
    await expect(advancedFeatures).toBeVisible();

    console.log('✅ [ANALYSIS] Feature analysis information displayed correctly');
  });

  test('should maintain feature configuration across panel open/close', async ({ page }) => {
    console.log('🎛️ [PERSISTENCE] Testing feature configuration persistence');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Switch to BASIC preset
    const basicButton = page.getByTestId('feature-preset-basic');
    await basicButton.click();
    await expect(featureButton).toContainText('BASIC');

    // Close panel
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Reopen panel
    await featureButton.click();

    // Verify BASIC preset is still selected by checking the main button text
    await expect(featureButton).toContainText('BASIC');
    console.log('✅ [PERSISTENCE] Feature configuration persisted across panel close/open');

    console.log('✅ [PERSISTENCE] Feature configuration persistence working correctly');
  });
});
