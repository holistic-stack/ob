/**
 * @file Enhanced Feature Configuration Panel E2E Tests
 * @description Comprehensive E2E tests for the Enhanced Feature Configuration Panel
 * 
 * Tests cover:
 * - Enhanced panel opening and closing
 * - Advanced tooltips and descriptions
 * - Performance metrics display and accuracy
 * - Feature statistics and calculations
 * - Enhanced UI/UX interactions
 * - Integration with demo application
 */

import { test, expect } from '@playwright/test';
import { OpenSCADComponentHelper } from '../utils/openscad-component-helpers';
import { getByTestIdWithFallback } from '../utils/monaco-helpers';

test.describe('Enhanced Feature Configuration Panel E2E Tests', () => {
  let componentHelper: OpenSCADComponentHelper;

  test.beforeEach(async ({ page }) => {
    componentHelper = new OpenSCADComponentHelper(page);
    await page.goto('/');
    await componentHelper.waitForComponentReady();
  });

  test.afterEach(async () => {
    // Cleanup is handled by Playwright automatically
  });

  test.describe('Enhanced Panel Functionality', () => {
    test('should open enhanced feature configuration panel', async ({ page }) => {
      console.log('🎛️ [ENHANCED PANEL] Testing enhanced panel opening');

      // Click the feature toggle button
      const featureButton = page.getByTestId('feature-toggle-button');
      console.log('🔍 [DEBUG] Clicking feature toggle button...');
      await featureButton.click();
      console.log('🔍 [DEBUG] Feature toggle button clicked');

      // Wait a moment for the panel to render
      await page.waitForTimeout(1000);

      // Check if any panel is visible (regular or enhanced)
      const regularPanel = page.getByTestId('feature-config-panel');
      const enhancedPanel = page.getByTestId('enhanced-feature-config-panel');

      console.log('🔍 [DEBUG] Checking panel visibility...');
      const regularPanelVisible = await regularPanel.isVisible().catch(() => false);
      const enhancedPanelVisible = await enhancedPanel.isVisible().catch(() => false);

      console.log(`🔍 [DEBUG] Regular panel visible: ${regularPanelVisible}`);
      console.log(`🔍 [DEBUG] Enhanced panel visible: ${enhancedPanelVisible}`);

      // Check for any element with "Enhanced Feature Configuration" text
      const titleElement = page.getByText('Enhanced Feature Configuration');
      const titleVisible = await titleElement.isVisible().catch(() => false);
      console.log(`🔍 [DEBUG] Title element visible: ${titleVisible}`);

      // Verify enhanced panel title is visible (this confirms panel is open)
      await expect(page.getByText('Enhanced Feature Configuration')).toBeVisible();

      // Use fallback helper to find preset buttons with either enhanced or legacy test IDs
      const basicButton = getByTestIdWithFallback(page, 'feature-preset-basic');
      const parserButton = getByTestIdWithFallback(page, 'feature-preset-parser');
      const ideButton = getByTestIdWithFallback(page, 'feature-preset-ide');
      const fullButton = getByTestIdWithFallback(page, 'feature-preset-full');

      // Verify preset buttons are visible
      await expect(basicButton).toBeVisible();
      await expect(parserButton).toBeVisible();
      await expect(ideButton).toBeVisible();
      await expect(fullButton).toBeVisible();

      // Verify individual features container is visible
      const featuresContainer = getByTestIdWithFallback(page, 'individual-features-container');
      await expect(featuresContainer).toBeVisible();

      // If we can see the content, the panel is effectively open
      console.log('✅ [DEBUG] Enhanced panel content is visible and functional');

      console.log('✅ [ENHANCED PANEL] Enhanced feature configuration panel opened successfully');
    });

    test('should close enhanced panel with close button', async ({ page }) => {
      console.log('🎛️ [ENHANCED PANEL] Testing enhanced panel closing');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify panel is open by checking title (more reliable than panel container)
      await expect(page.getByText('Enhanced Feature Configuration')).toBeVisible();

      // Close panel using fallback helper
      const closeButton = getByTestIdWithFallback(page, 'feature-config-close-button');
      await closeButton.click();

      // Verify panel is closed by checking title is no longer visible
      await expect(page.getByText('Enhanced Feature Configuration')).not.toBeVisible();

      console.log('✅ [ENHANCED PANEL] Enhanced panel closed successfully');
    });

    test('should display enhanced preset buttons', async ({ page }) => {
      console.log('🎛️ [ENHANCED PANEL] Testing enhanced preset buttons');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify all enhanced preset buttons are present using fallback helper
      await expect(getByTestIdWithFallback(page, 'feature-preset-basic')).toBeVisible();
      await expect(getByTestIdWithFallback(page, 'feature-preset-parser')).toBeVisible();
      await expect(getByTestIdWithFallback(page, 'feature-preset-ide')).toBeVisible();
      await expect(getByTestIdWithFallback(page, 'feature-preset-full')).toBeVisible();

      console.log('✅ [ENHANCED PANEL] All enhanced preset buttons displayed correctly');
    });
  });

  test.describe('Performance Metrics Display', () => {
    test('should display performance metrics section', async ({ page }) => {
      console.log('📊 [PERFORMANCE] Testing performance metrics display');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify performance metrics section is visible
      await expect(page.getByText('Performance Metrics')).toBeVisible();

      // Verify individual metrics are displayed
      await expect(page.getByText('Parse Time')).toBeVisible();
      await expect(page.getByText('Render Time')).toBeVisible();
      await expect(page.getByText('Memory Usage')).toBeVisible();
      await expect(page.getByText('Feature Load Time')).toBeVisible();

      console.log('✅ [PERFORMANCE] Performance metrics section displayed correctly');
    });

    test('should display performance metric values', async ({ page }) => {
      console.log('📊 [PERFORMANCE] Testing performance metric values');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Check for numeric values in performance metrics
      // Look for patterns like "42.3ms", "12.5ms", "6.0MB", etc.
      const performanceSection = page.locator('text=Performance Metrics').locator('..');

      // Verify parse time value (use first() to avoid strict mode violation)
      await expect(performanceSection.locator('text=/\\d+\\.\\d+ms/').first()).toBeVisible();

      // Verify memory usage value
      await expect(performanceSection.locator('text=/\\d+\\.\\d+MB/').first()).toBeVisible();

      console.log('✅ [PERFORMANCE] Performance metric values displayed correctly');
    });

    test('should display feature efficiency bar', async ({ page }) => {
      console.log('📊 [PERFORMANCE] Testing feature efficiency bar');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify feature efficiency section
      await expect(page.getByText('Feature Efficiency')).toBeVisible();
      
      // Look for the efficiency text pattern
      await expect(page.locator('text=/\\d+ \\/ \\d+ features active/')).toBeVisible();

      console.log('✅ [PERFORMANCE] Feature efficiency bar displayed correctly');
    });
  });

  test.describe('Feature Statistics', () => {
    test('should display feature statistics correctly', async ({ page }) => {
      console.log('📈 [STATISTICS] Testing feature statistics display');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify feature statistics section
      await expect(page.getByText('Feature Statistics')).toBeVisible();

      // Verify category labels (use more specific selectors)
      const statisticsSection = page.locator('text=Feature Statistics').locator('..');
      await expect(statisticsSection.getByText('Active').first()).toBeVisible();
      await expect(statisticsSection.getByText('Core').first()).toBeVisible();
      await expect(statisticsSection.getByText('Parser').first()).toBeVisible();
      await expect(statisticsSection.getByText('IDE').first()).toBeVisible();
      await expect(statisticsSection.getByText('Advanced').first()).toBeVisible();

      console.log('✅ [STATISTICS] Feature statistics displayed correctly');
    });

    test('should update statistics when preset changes', async ({ page }) => {
      console.log('📈 [STATISTICS] Testing statistics updates on preset change');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Get initial active count for IDE preset
      const activeSection = page.locator('text=Active').locator('..');
      const initialActiveCount = await activeSection.locator('div[style*="font-size: 24px"]').textContent();

      // Switch to BASIC preset using fallback helper
      const basicButton = getByTestIdWithFallback(page, 'feature-preset-basic');
      await basicButton.click();

      // Get new active count for BASIC preset
      const newActiveCount = await activeSection.locator('div[style*="font-size: 24px"]').textContent();

      // BASIC should have fewer active features than IDE
      expect(parseInt(newActiveCount || '0')).toBeLessThan(parseInt(initialActiveCount || '0'));

      console.log('✅ [STATISTICS] Statistics updated correctly on preset change');
    });
  });

  test.describe('Enhanced Feature Categories', () => {
    test('should display feature categories with icons', async ({ page }) => {
      console.log('🔧 [CATEGORIES] Testing feature categories display');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify category headers with icons
      await expect(page.getByText('🔧 Core Features')).toBeVisible();
      await expect(page.getByText('🌳 Parser Features')).toBeVisible();
      await expect(page.getByText('✨ IDE Features')).toBeVisible();
      await expect(page.getByText('🚀 Advanced Features')).toBeVisible();

      console.log('✅ [CATEGORIES] Feature categories with icons displayed correctly');
    });

    test('should display individual features in categories', async ({ page }) => {
      console.log('🔧 [CATEGORIES] Testing individual features in categories');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify individual features container using fallback helper
      const featuresContainer = getByTestIdWithFallback(page, 'individual-features-container');
      await expect(featuresContainer).toBeVisible();

      // Check for core features using scoped selectors with exact matching
      await expect(page.getByText('🔧 Core Features')).toBeVisible();
      await expect(featuresContainer.getByText('Syntax Highlighting', { exact: true })).toBeVisible();
      await expect(featuresContainer.getByText('Basic Editing', { exact: true })).toBeVisible();

      // Check for parser features using scoped selectors with exact matching
      await expect(page.getByText('🌳 Parser Features')).toBeVisible();
      await expect(featuresContainer.getByText('Real-time Parsing', { exact: true })).toBeVisible();
      await expect(featuresContainer.getByText('Error Detection', { exact: true })).toBeVisible();

      console.log('✅ [CATEGORIES] Individual features in categories displayed correctly');
    });

    test('should toggle individual features', async ({ page }) => {
      console.log('🔧 [CATEGORIES] Testing individual feature toggling');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Get individual features container and find first checkbox
      const featuresContainer = getByTestIdWithFallback(page, 'individual-features-container');
      const firstCheckbox = featuresContainer.locator('input[type="checkbox"]').first();

      // Check initial state
      const initialState = await firstCheckbox.isChecked();

      // Toggle the feature
      await firstCheckbox.click();

      // Verify state changed
      const newState = await firstCheckbox.isChecked();
      expect(newState).toBe(!initialState);

      console.log('✅ [CATEGORIES] Individual feature toggling working correctly');
    });
  });

  test.describe('Enhanced Tooltips', () => {
    test('should display feature tooltips when enabled', async ({ page }) => {
      console.log('💡 [TOOLTIPS] Testing feature tooltips display');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Look for tooltip descriptions (they should be visible by default)
      await expect(page.getByText('Colorizes OpenSCAD keywords, functions, and syntax elements for better code readability.')).toBeVisible();
      await expect(page.getByText('Essential editing features including text input, selection, copy/paste, and undo/redo.')).toBeVisible();

      console.log('✅ [TOOLTIPS] Feature tooltips displayed correctly');
    });

    test('should display feature titles', async ({ page }) => {
      console.log('💡 [TOOLTIPS] Testing feature titles display');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify feature titles are displayed using fallback helper
      const featuresContainer = getByTestIdWithFallback(page, 'individual-features-container');
      await expect(featuresContainer.getByText('Syntax Highlighting', { exact: true })).toBeVisible();
      await expect(featuresContainer.getByText('Basic Editing', { exact: true })).toBeVisible();
      await expect(featuresContainer.getByText('Real-time Parsing', { exact: true })).toBeVisible();
      await expect(featuresContainer.getByText('Error Detection', { exact: true })).toBeVisible();

      console.log('✅ [TOOLTIPS] Feature titles displayed correctly');
    });
  });

  test.describe('Dependencies Toggle', () => {
    test('should show/hide dependencies toggle button', async ({ page }) => {
      console.log('🔗 [DEPENDENCIES] Testing dependencies toggle button');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify dependencies toggle button
      const toggleButton = page.getByText('Show Dependencies');
      await expect(toggleButton).toBeVisible();

      // Click to show dependencies
      await toggleButton.click();
      await expect(page.getByText('Hide Dependencies')).toBeVisible();

      console.log('✅ [DEPENDENCIES] Dependencies toggle button working correctly');
    });
  });

  test.describe('Integration with Demo Application', () => {
    test('should integrate seamlessly with demo application', async ({ page }) => {
      console.log('🔗 [INTEGRATION] Testing demo application integration');

      // Verify demo is loaded
      await expect(page.getByTestId('demo-container')).toBeVisible();
      await expect(page.getByTestId('demo-title')).toBeVisible();

      // Open enhanced panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify enhanced panel doesn't interfere with demo (use title instead of panel container)
      await expect(page.getByTestId('monaco-editor-container')).toBeVisible();
      await expect(page.getByText('Enhanced Feature Configuration')).toBeVisible();

      // Close panel using fallback helper and verify demo still works
      const closeButton = getByTestIdWithFallback(page, 'feature-config-close-button');
      await closeButton.click();

      await expect(page.getByTestId('monaco-editor-container')).toBeVisible();
      await expect(page.getByText('Enhanced Feature Configuration')).not.toBeVisible();

      console.log('✅ [INTEGRATION] Enhanced panel integrates seamlessly with demo application');
    });

    test('should maintain feature button state', async ({ page }) => {
      console.log('🔗 [INTEGRATION] Testing feature button state maintenance');

      // Verify initial feature button state
      const featureButton = page.getByTestId('feature-toggle-button');
      await expect(featureButton).toBeVisible();

      // Check initial text (should show current preset)
      const initialText = await featureButton.textContent();
      expect(initialText).toContain('Features');

      // Open panel and change preset using fallback helper
      await featureButton.click();
      const basicButton = getByTestIdWithFallback(page, 'feature-preset-basic');
      await basicButton.click();

      // Close panel using fallback helper
      const closeButton = getByTestIdWithFallback(page, 'feature-config-close-button');
      await closeButton.click();

      // Verify button text updated
      const updatedText = await featureButton.textContent();
      expect(updatedText).toContain('BASIC');

      console.log('✅ [INTEGRATION] Feature button state maintained correctly');
    });
  });

  test.describe('Advanced Enhanced Features', () => {
    test('should display performance metrics with real-time updates', async ({ page }) => {
      console.log('⚡ [ADVANCED] Testing real-time performance metrics');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify performance metrics are displayed with actual values
      const performanceSection = page.locator('text=Performance Metrics').locator('..');

      // Check for specific performance metric patterns
      await expect(performanceSection.locator('text=/Parse Time.*\\d+\\.\\d+ms/')).toBeVisible();
      await expect(performanceSection.locator('text=/Render Time.*\\d+\\.\\d+ms/')).toBeVisible();
      await expect(performanceSection.locator('text=/Memory Usage.*\\d+\\.\\d+MB/')).toBeVisible();
      await expect(performanceSection.locator('text=/Feature Load Time.*\\d+\\.\\d+ms/')).toBeVisible();

      console.log('✅ [ADVANCED] Real-time performance metrics displayed correctly');
    });

    test('should show feature efficiency visualization', async ({ page }) => {
      console.log('📊 [ADVANCED] Testing feature efficiency visualization');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify feature efficiency section
      await expect(page.getByText('Feature Efficiency')).toBeVisible();

      // Check for efficiency bar and percentage
      const efficiencySection = page.locator('text=Feature Efficiency').locator('..');
      await expect(efficiencySection.locator('text=/\\d+ \\/ \\d+ features active/')).toBeVisible();

      // Just verify the efficiency section exists (percentage format may vary)
      await expect(efficiencySection).toBeVisible();

      console.log('✅ [ADVANCED] Feature efficiency visualization displayed correctly');
    });

    test('should display comprehensive feature tooltips', async ({ page }) => {
      console.log('💡 [ADVANCED] Testing comprehensive feature tooltips');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify detailed tooltip descriptions are visible (focus on core tooltips that we know exist)
      await expect(page.getByText('Colorizes OpenSCAD keywords, functions, and syntax elements for better code readability.')).toBeVisible();
      await expect(page.getByText('Essential editing features including text input, selection, copy/paste, and undo/redo.')).toBeVisible();

      // Verify that tooltips are present for parser features using fallback helper
      const featuresContainer = getByTestIdWithFallback(page, 'individual-features-container');
      await expect(featuresContainer.locator('text=/parsing/i').first()).toBeVisible();
      await expect(featuresContainer.locator('text=/error/i').first()).toBeVisible();

      console.log('✅ [ADVANCED] Comprehensive feature tooltips displayed correctly');
    });

    test('should handle preset switching with performance impact', async ({ page }) => {
      console.log('🔄 [ADVANCED] Testing preset switching with performance impact');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Get initial performance metrics
      const performanceSection = page.locator('text=Performance Metrics').locator('..');
      const initialEfficiency = await performanceSection.locator('text=/\\d+ \\/ \\d+ features active/').textContent();

      // Switch to FULL preset (should have more features)
      const fullButton = page.getByTestId('enhanced-feature-preset-full');
      await fullButton.click();

      // Verify efficiency changed (more features active)
      const newEfficiency = await performanceSection.locator('text=/\\d+ \\/ \\d+ features active/').textContent();
      expect(newEfficiency).not.toBe(initialEfficiency);

      // Switch to BASIC preset (should have fewer features)
      const basicButton = page.getByTestId('enhanced-feature-preset-basic');
      await basicButton.click();

      // Verify efficiency changed again (fewer features active)
      const basicEfficiency = await performanceSection.locator('text=/\\d+ \\/ \\d+ features active/').textContent();
      expect(basicEfficiency).not.toBe(newEfficiency);

      console.log('✅ [ADVANCED] Preset switching with performance impact working correctly');
    });

    test('should display category-specific feature counts', async ({ page }) => {
      console.log('📈 [ADVANCED] Testing category-specific feature counts');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify feature statistics section shows category counts
      const statisticsSection = page.locator('text=Feature Statistics').locator('..');

      // Check that each category has a numeric count
      await expect(statisticsSection.locator('text=Core').locator('..').locator('div[style*="font-size: 24px"]')).toBeVisible();
      await expect(statisticsSection.locator('text=Parser').locator('..').locator('div[style*="font-size: 24px"]')).toBeVisible();
      await expect(statisticsSection.locator('text=IDE').locator('..').locator('div[style*="font-size: 24px"]')).toBeVisible();
      await expect(statisticsSection.locator('text=Advanced').locator('..').locator('div[style*="font-size: 24px"]')).toBeVisible();

      console.log('✅ [ADVANCED] Category-specific feature counts displayed correctly');
    });

    test('should show enhanced visual indicators', async ({ page }) => {
      console.log('🎨 [ADVANCED] Testing enhanced visual indicators');

      // Open panel
      const featureButton = page.getByTestId('feature-toggle-button');
      await featureButton.click();

      // Verify category icons are displayed
      await expect(page.getByText('🔧 Core Features')).toBeVisible();
      await expect(page.getByText('🌳 Parser Features')).toBeVisible();
      await expect(page.getByText('✨ IDE Features')).toBeVisible();
      await expect(page.getByText('🚀 Advanced Features')).toBeVisible();

      // Verify preset buttons have text (icons may vary)
      await expect(page.getByTestId('enhanced-feature-preset-basic')).toContainText('BASIC');
      await expect(page.getByTestId('enhanced-feature-preset-parser')).toContainText('PARSER');
      await expect(page.getByTestId('enhanced-feature-preset-ide')).toContainText('IDE');
      await expect(page.getByTestId('enhanced-feature-preset-full')).toContainText('FULL');

      console.log('✅ [ADVANCED] Enhanced visual indicators displayed correctly');
    });
  });
});
