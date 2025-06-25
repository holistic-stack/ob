/**
 * @file Grid Layout E2E Tests
 * 
 * End-to-end tests for the 12-column grid layout implementation following TDD principles.
 * Tests the complete user experience with Monaco editor (5 cols) and Three.js viewer (7 cols).
 * 
 * Following project standards:
 * - No mocks for components (uses real browser interactions)
 * - Tests actual grid layout functionality
 * - Covers responsive design and accessibility
 * - Comprehensive logging with checkpoints
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Test Configuration and Setup
// ============================================================================

test.describe('[INIT] Grid Layout E2E Tests - 12-Column Implementation', () => {
  console.log('[INIT] Starting Grid Layout E2E test suite');

  test.beforeEach(async ({ page }) => {
    console.log('[DEBUG] Setting up Grid Layout E2E test');
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    console.log('[DEBUG] Application loaded successfully');
  });

  // ============================================================================
  // Basic Grid Layout Rendering Tests
  // ============================================================================

  test.describe('Basic Grid Layout Rendering', () => {
    test('should render 12-column grid container', async ({ page }) => {
      console.log('[DEBUG] Testing 12-column grid container rendering');
      
      // Wait for the grid layout container to be visible
      const gridContainer = page.getByTestId('grid-layout-container');
      await expect(gridContainer).toBeVisible({ timeout: 10000 });
      
      // Verify grid classes are applied
      await expect(gridContainer).toHaveClass(/grid/);
      await expect(gridContainer).toHaveClass(/grid-cols-12/);
      await expect(gridContainer).toHaveClass(/w-full/);
      await expect(gridContainer).toHaveClass(/h-full/);
      
      console.log('[DEBUG] 12-column grid container rendered successfully');
    });

    test('should render Monaco editor section with 5 columns', async ({ page }) => {
      console.log('[DEBUG] Testing Monaco editor section rendering');
      
      // Wait for Monaco editor section
      const monacoSection = page.getByTestId('monaco-editor-section');
      await expect(monacoSection).toBeVisible({ timeout: 10000 });
      
      // Verify column span
      await expect(monacoSection).toHaveClass(/col-span-5/);
      await expect(monacoSection).toHaveClass(/h-full/);
      
      // Verify placeholder content
      const monacoPlaceholder = page.getByTestId('monaco-code-editor-placeholder');
      await expect(monacoPlaceholder).toBeVisible();
      await expect(monacoPlaceholder).toContainText('Monaco Editor Integration (5 columns)');
      
      console.log('[DEBUG] Monaco editor section rendered successfully');
    });

    test('should render Three.js viewer section with 7 columns', async ({ page }) => {
      console.log('[DEBUG] Testing Three.js viewer section rendering');
      
      // Wait for Three.js viewer section
      const viewerSection = page.getByTestId('threejs-viewer-section');
      await expect(viewerSection).toBeVisible({ timeout: 10000 });
      
      // Verify column span
      await expect(viewerSection).toHaveClass(/col-span-7/);
      await expect(viewerSection).toHaveClass(/h-full/);
      
      // Verify VisualizationPanel is rendered
      const visualizationPanel = page.getByTestId('visualization-panel');
      await expect(visualizationPanel).toBeVisible();
      
      console.log('[DEBUG] Three.js viewer section rendered successfully');
    });
  });

  // ============================================================================
  // Layout Structure and Proportions Tests
  // ============================================================================

  test.describe('Layout Structure and Proportions', () => {
    test('should maintain correct column proportions', async ({ page }) => {
      console.log('[DEBUG] Testing column proportions');
      
      const gridContainer = page.getByTestId('grid-layout-container');
      const monacoSection = page.getByTestId('monaco-editor-section');
      const viewerSection = page.getByTestId('threejs-viewer-section');
      
      // Wait for all elements to be visible
      await expect(gridContainer).toBeVisible();
      await expect(monacoSection).toBeVisible();
      await expect(viewerSection).toBeVisible();
      
      // Get bounding boxes to verify proportions
      const containerBox = await gridContainer.boundingBox();
      const monacoBox = await monacoSection.boundingBox();
      const viewerBox = await viewerSection.boundingBox();
      
      expect(containerBox).toBeTruthy();
      expect(monacoBox).toBeTruthy();
      expect(viewerBox).toBeTruthy();
      
      if (containerBox && monacoBox && viewerBox) {
        // Monaco should be approximately 5/12 of container width
        const monacoRatio = monacoBox.width / containerBox.width;
        expect(monacoRatio).toBeCloseTo(5/12, 1); // Allow 10% tolerance
        
        // Viewer should be approximately 7/12 of container width
        const viewerRatio = viewerBox.width / containerBox.width;
        expect(viewerRatio).toBeCloseTo(7/12, 1); // Allow 10% tolerance
        
        console.log(`[DEBUG] Monaco ratio: ${monacoRatio.toFixed(3)}, Viewer ratio: ${viewerRatio.toFixed(3)}`);
      }
      
      console.log('[DEBUG] Column proportions verified successfully');
    });

    test('should fill full viewport height', async ({ page }) => {
      console.log('[DEBUG] Testing full viewport height');
      
      const gridContainer = page.getByTestId('grid-layout-container');
      await expect(gridContainer).toBeVisible();
      
      // Get viewport and container dimensions
      const viewportSize = page.viewportSize();
      const containerBox = await gridContainer.boundingBox();
      
      expect(viewportSize).toBeTruthy();
      expect(containerBox).toBeTruthy();
      
      if (viewportSize && containerBox) {
        // Container should fill most of the viewport height (allowing for small margins)
        const heightRatio = containerBox.height / viewportSize.height;
        expect(heightRatio).toBeGreaterThan(0.9); // At least 90% of viewport height
        
        console.log(`[DEBUG] Height ratio: ${heightRatio.toFixed(3)}`);
      }
      
      console.log('[DEBUG] Full viewport height verified successfully');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test.describe('Accessibility Compliance', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      console.log('[DEBUG] Testing ARIA attributes');
      
      const gridContainer = page.getByTestId('grid-layout-container');
      await expect(gridContainer).toBeVisible();
      
      // Verify ARIA attributes
      await expect(gridContainer).toHaveAttribute('role', 'main');
      await expect(gridContainer).toHaveAttribute('aria-label', '12-Column Grid Layout');
      
      console.log('[DEBUG] ARIA attributes verified successfully');
    });

    test('should be keyboard accessible', async ({ page }) => {
      console.log('[DEBUG] Testing keyboard accessibility');
      
      // Tab through the interface
      await page.keyboard.press('Tab');
      
      // Check if focus is visible (basic test)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      console.log('[DEBUG] Keyboard accessibility verified successfully');
    });
  });

  // ============================================================================
  // Responsive Design Tests
  // ============================================================================

  test.describe('Responsive Design', () => {
    test('should maintain grid layout on different viewport sizes', async ({ page }) => {
      console.log('[DEBUG] Testing responsive grid layout');
      
      // Test desktop size (default)
      await page.setViewportSize({ width: 1280, height: 720 });
      
      const gridContainer = page.getByTestId('grid-layout-container');
      await expect(gridContainer).toBeVisible();
      await expect(gridContainer).toHaveClass(/grid-cols-12/);
      
      // Test larger desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(gridContainer).toHaveClass(/grid-cols-12/);
      
      // Test smaller desktop
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(gridContainer).toHaveClass(/grid-cols-12/);
      
      console.log('[DEBUG] Responsive grid layout verified successfully');
    });
  });

  // ============================================================================
  // Visual Regression Tests
  // ============================================================================

  test.describe('Visual Regression', () => {
    test('should match visual snapshot', async ({ page }) => {
      console.log('[DEBUG] Testing visual regression');
      
      // Wait for layout to stabilize
      const gridContainer = page.getByTestId('grid-layout-container');
      await expect(gridContainer).toBeVisible();
      await page.waitForTimeout(1000); // Allow for any animations
      
      // Take screenshot for visual regression
      await expect(page).toHaveScreenshot('grid-layout-12-column.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      console.log('[DEBUG] Visual regression test completed successfully');
    });
  });

  console.log('[END] Grid Layout E2E test suite completed');
});
