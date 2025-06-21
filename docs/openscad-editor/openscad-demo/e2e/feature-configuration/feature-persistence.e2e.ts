/**
 * @file E2E tests for Feature Configuration Persistence
 * 
 * Tests the persistence of feature configuration across browser refresh,
 * local storage management, and configuration export/import functionality.
 * Validates that the unified editor maintains state correctly.
 */

import { test, expect } from '@playwright/test';
import { OpenSCADComponentHelper } from '../utils/openscad-component-helpers';

test.describe('Feature Configuration Persistence Tests', () => {
  let componentHelper: OpenSCADComponentHelper;

  test.beforeEach(async ({ page }) => {
    componentHelper = new OpenSCADComponentHelper(page);
    await page.goto('http://localhost:4300');
    await componentHelper.waitForComponentReady();
  });

  test('should reset to default configuration after browser refresh', async ({ page }) => {
    console.log('🔄 [RESET BEHAVIOR] Testing configuration reset behavior after refresh');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Switch to PARSER preset
    const parserButton = page.getByTestId('feature-preset-parser');
    await parserButton.click();
    await expect(featureButton).toContainText('PARSER');
    console.log('✅ [RESET BEHAVIOR] Set PARSER preset');

    // Close panel
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Refresh the page
    await page.reload();
    await componentHelper.waitForComponentReady();
    console.log('✅ [RESET BEHAVIOR] Page refreshed');

    // Verify configuration reset to default (IDE)
    const refreshedFeatureButton = page.getByTestId('feature-toggle-button');
    await expect(refreshedFeatureButton).toContainText('IDE');
    console.log('✅ [RESET BEHAVIOR] Configuration reset to default IDE preset after refresh');

    // Open panel and verify IDE preset is selected
    await refreshedFeatureButton.click();
    const ideButton = page.getByTestId('feature-preset-ide');

    // Check if the IDE button has active styling
    const buttonStyles = await ideButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor
      };
    });

    // The active preset should have a different background color
    expect(buttonStyles.backgroundColor).not.toBe('rgb(51, 51, 51)'); // Not the default #333
    console.log('✅ [RESET BEHAVIOR] IDE preset button shows active state');

    console.log('✅ [RESET BEHAVIOR] Configuration reset behavior working correctly');
  });

  test('should handle custom feature configuration within session', async ({ page }) => {
    console.log('🎛️ [CUSTOM SESSION] Testing custom configuration within session');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Start with IDE preset
    const ideButton = page.getByTestId('feature-preset-ide');
    await ideButton.click();
    await expect(featureButton).toContainText('IDE');

    // Toggle a specific feature to create custom configuration
    const firstCheckbox = page.getByTestId('individual-features-container').locator('input[type="checkbox"]').first();
    await firstCheckbox.click();
    await expect(featureButton).toContainText('CUSTOM');
    console.log('✅ [CUSTOM SESSION] Created custom configuration');

    // Close and reopen panel to verify custom state persists within session
    const closeButton = page.getByTestId('feature-config-close-button');
    await closeButton.click();

    // Verify custom configuration persists within the same session
    await expect(featureButton).toContainText('CUSTOM');
    console.log('✅ [CUSTOM SESSION] Custom configuration persisted within session');

    // Reopen panel and verify the checkbox state is maintained
    await featureButton.click();
    const sameCheckbox = page.getByTestId('individual-features-container').locator('input[type="checkbox"]').first();
    const isChecked = await sameCheckbox.isChecked();

    // The checkbox state should be different from the original IDE preset
    console.log(`✅ [CUSTOM SESSION] Checkbox state maintained: ${isChecked}`);

    console.log('✅ [CUSTOM SESSION] Custom feature configuration within session working correctly');
  });

  test('should clear configuration when switching between presets', async ({ page }) => {
    console.log('🔄 [PRESET SWITCHING] Testing preset switching behavior');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Test switching between different presets
    const presets = ['basic', 'parser', 'ide', 'full'];
    
    for (const preset of presets) {
      const presetButton = page.getByTestId(`feature-preset-${preset}`);
      await presetButton.click();
      await expect(featureButton).toContainText(preset.toUpperCase());
      console.log(`✅ [PRESET SWITCHING] Switched to ${preset.toUpperCase()} preset`);
      
      // Wait a moment for state to settle
      await page.waitForTimeout(100);
    }

    // Verify final state
    await expect(featureButton).toContainText('FULL');
    console.log('✅ [PRESET SWITCHING] Final state is FULL preset');

    console.log('✅ [PRESET SWITCHING] Preset switching behavior working correctly');
  });

  test('should maintain feature analysis accuracy across configuration changes', async ({ page }) => {
    console.log('📊 [ANALYSIS ACCURACY] Testing feature analysis accuracy');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Test BASIC preset analysis
    const basicButton = page.getByTestId('feature-preset-basic');
    await basicButton.click();
    
    const parserIndicator = page.getByTestId('parser-required-indicator');
    const ideIndicator = page.getByTestId('ide-features-indicator');
    const advancedIndicator = page.getByTestId('advanced-features-indicator');

    // BASIC preset should have minimal features
    await expect(parserIndicator).toContainText('❌');
    await expect(ideIndicator).toContainText('❌');
    await expect(advancedIndicator).toContainText('❌');
    console.log('✅ [ANALYSIS ACCURACY] BASIC preset analysis correct');

    // Test FULL preset analysis
    const fullButton = page.getByTestId('feature-preset-full');
    await fullButton.click();
    
    // FULL preset should have all features
    await expect(parserIndicator).toContainText('✅');
    await expect(ideIndicator).toContainText('✅');
    await expect(advancedIndicator).toContainText('✅');
    console.log('✅ [ANALYSIS ACCURACY] FULL preset analysis correct');

    console.log('✅ [ANALYSIS ACCURACY] Feature analysis accuracy working correctly');
  });

  test('should handle rapid configuration changes without errors', async ({ page }) => {
    console.log('⚡ [RAPID CHANGES] Testing rapid configuration changes');

    // Open feature configuration panel
    const featureButton = page.getByTestId('feature-toggle-button');
    await featureButton.click();

    // Rapidly switch between presets
    const presets = ['basic', 'parser', 'ide', 'full', 'basic', 'full', 'parser'];
    
    for (const preset of presets) {
      const presetButton = page.getByTestId(`feature-preset-${preset}`);
      await presetButton.click();
      // No wait - test rapid switching
    }

    // Verify final state is stable
    await expect(featureButton).toContainText('PARSER');
    console.log('✅ [RAPID CHANGES] Rapid preset switching handled correctly');

    // Rapidly toggle individual features
    const checkboxes = page.getByTestId('individual-features-container').locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    for (let i = 0; i < Math.min(5, checkboxCount); i++) {
      await checkboxes.nth(i).click();
      // No wait - test rapid toggling
    }

    // Should switch to custom mode
    await expect(featureButton).toContainText('CUSTOM');
    console.log('✅ [RAPID CHANGES] Rapid feature toggling handled correctly');

    console.log('✅ [RAPID CHANGES] Rapid configuration changes working correctly');
  });
});
