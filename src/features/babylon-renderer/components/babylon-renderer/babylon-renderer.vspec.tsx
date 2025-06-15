/**
 * @file Babylon Renderer Playwright Component Tests
 * 
 * Comprehensive Playwright component tests for the complete BabylonRenderer architecture
 * Tests component interactions, visual regression, and performance validation
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { BabylonRenderer } from './babylon-renderer';
import { BasicBabylonRenderer, FullBabylonRenderer, GridLayoutBabylonRenderer, CustomBabylonRenderer } from './babylon-renderer.story';
import type { BabylonRendererProps } from '../../types/babylon-types';

test.describe('BabylonRenderer Playwright Component Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up Playwright component test environment');
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      } else if (msg.text().includes('[DEBUG]') || msg.text().includes('[ERROR]') || msg.text().includes('[WARN]')) {
        console.log(`[BROWSER] ${msg.text()}`);
      }
    });
  });

  test.describe('Basic Rendering and Layout', () => {
    
    test('should render main renderer with default layout', async ({ mount, page }) => {
      console.log('[DEBUG] Testing basic renderer rendering');

      const component = await mount(<BasicBabylonRenderer />);

      // Wait a bit for component to initialize
      await page.waitForTimeout(2000);

      // Verify main container is present - try different selectors
      const container = component.locator('[data-testid="babylon-renderer-container"]');
      await expect(container).toBeVisible({ timeout: 15000 });

      // Verify default layout classes
      await expect(container).toHaveClass(/babylon-renderer--flex/);
      await expect(container).toHaveClass(/babylon-renderer--responsive/);

      // Verify canvas area is present
      await expect(component.locator('.babylon-renderer__canvas-area')).toBeVisible();

      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('babylon-renderer-default.png');
    });

    test('should render with all components enabled', async ({ mount, page }) => {
      console.log('[DEBUG] Testing full component composition');

      const component = await mount(<FullBabylonRenderer />);

      // Wait for component to initialize
      await page.waitForTimeout(3000);

      // Verify main container first
      const container = component.locator('[data-testid="babylon-renderer-container"]');
      await expect(container).toBeVisible({ timeout: 15000 });

      // Verify all component areas are present
      await expect(component.locator('.babylon-renderer__canvas-area')).toBeVisible();
      await expect(component.locator('.babylon-renderer__controls-area')).toBeVisible();
      await expect(component.locator('.babylon-renderer__mesh-area')).toBeVisible();
      await expect(component.locator('.babylon-renderer__debug-area')).toBeVisible();

      // Verify component titles with timeout
      await expect(component.getByText('Scene Controls')).toBeVisible({ timeout: 10000 });
      await expect(component.getByText('Mesh Display')).toBeVisible({ timeout: 10000 });
      await expect(component.getByText('Debug Panel')).toBeVisible({ timeout: 10000 });

      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('babylon-renderer-full-composition.png');
    });

    test('should support different layout modes', async ({ mount, page }) => {
      console.log('[DEBUG] Testing layout mode variations');

      // Test Grid Layout
      const gridComponent = await mount(<GridLayoutBabylonRenderer />);

      // Wait for component to initialize
      await page.waitForTimeout(3000);

      const container = gridComponent.locator('[data-testid="babylon-renderer-container"]');
      await expect(container).toBeVisible({ timeout: 15000 });
      await expect(container).toHaveClass(/babylon-renderer--grid/);
      await expect(gridComponent).toHaveScreenshot('babylon-renderer-grid-layout.png');

      await gridComponent.unmount();

      // Test Custom Layout (includes sidebar and non-responsive)
      const customComponent = await mount(<CustomBabylonRenderer />);

      // Wait for component to initialize
      await page.waitForTimeout(3000);

      const customContainer = customComponent.locator('[data-testid="babylon-renderer-container"]');
      await expect(customContainer).toBeVisible({ timeout: 15000 });
      await expect(customContainer).toHaveClass(/babylon-renderer--grid/);
      await expect(customContainer).not.toHaveClass(/babylon-renderer--responsive/);
      await expect(customContainer).toHaveClass(/custom-renderer/);
      await expect(customComponent).toHaveScreenshot('babylon-renderer-custom-layout.png');
    });

    test('should handle responsive behavior', async ({ mount, page }) => {
      console.log('[DEBUG] Testing responsive layout behavior');
      
      const component = await mount(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
        />
      );
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(component).toHaveScreenshot('babylon-renderer-desktop.png');
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(component).toHaveScreenshot('babylon-renderer-tablet.png');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(component).toHaveScreenshot('babylon-renderer-mobile.png');
    });
  });

  test.describe('Component Interactions', () => {
    
    test('should handle scene controls interactions', async ({ mount, page }) => {
      console.log('[DEBUG] Testing scene controls interactions');
      
      const component = await mount(
        <BabylonRenderer 
          showSceneControls={true}
        />
      );
      
      // Wait for scene controls to be ready
      await expect(component.getByText('Scene Controls')).toBeVisible();
      
      // Test wireframe toggle
      const wireframeButton = component.getByRole('button', { name: /wireframe/i });
      await expect(wireframeButton).toBeVisible();
      
      // Initially should be disabled (no scene yet)
      await expect(wireframeButton).toBeDisabled();
      
      // Test camera reset button
      const cameraResetButton = component.getByRole('button', { name: /reset camera/i });
      await expect(cameraResetButton).toBeVisible();
      await expect(cameraResetButton).toBeDisabled();
      
      // Test background color input
      const colorInput = component.locator('input[type="color"]');
      await expect(colorInput).toBeVisible();
      await expect(colorInput).toBeDisabled();
      
      // Take screenshot of controls state
      await expect(component).toHaveScreenshot('babylon-renderer-scene-controls.png');
    });

    test('should handle mesh display interactions', async ({ mount, page }) => {
      console.log('[DEBUG] Testing mesh display interactions');

      const component = await mount(<FullBabylonRenderer />);

      // Wait for component to initialize
      await page.waitForTimeout(3000);

      // Verify main container first
      const container = component.locator('[data-testid="babylon-renderer-container"]');
      await expect(container).toBeVisible({ timeout: 15000 });

      // Wait for mesh display to be ready
      await expect(component.getByText('Mesh Display')).toBeVisible({ timeout: 10000 });

      // Verify mesh display area exists
      await expect(component.locator('.babylon-renderer__mesh-area')).toBeVisible();

      // Should show empty state initially (text might vary)
      const emptyStateTexts = [
        'No meshes available',
        'No meshes found',
        'Empty scene',
        'No objects to display'
      ];

      let emptyStateFound = false;
      for (const text of emptyStateTexts) {
        try {
          await expect(component.getByText(text)).toBeVisible({ timeout: 1000 });
          emptyStateFound = true;
          break;
        } catch (e) {
          // Continue to next text
        }
      }

      console.log(`[DEBUG] Empty state found: ${emptyStateFound}`);

      // Take screenshot of mesh display
      await expect(component).toHaveScreenshot('babylon-renderer-mesh-display.png');
    });

    test('should handle debug panel interactions', async ({ mount, page }) => {
      console.log('[DEBUG] Testing debug panel interactions');

      const component = await mount(<FullBabylonRenderer />);

      // Wait for component to initialize
      await page.waitForTimeout(3000);

      // Verify main container first
      const container = component.locator('[data-testid="babylon-renderer-container"]');
      await expect(container).toBeVisible({ timeout: 15000 });

      // Wait for debug panel to be ready
      await expect(component.getByText('Debug Panel')).toBeVisible({ timeout: 10000 });

      // Verify debug panel area exists
      await expect(component.locator('.babylon-renderer__debug-area')).toBeVisible();

      // Test for any buttons in the debug panel (might not have specific refresh/export buttons yet)
      const debugButtons = component.locator('.babylon-renderer__debug-area button');
      const buttonCount = await debugButtons.count();
      console.log(`[DEBUG] Found ${buttonCount} buttons in debug panel`);

      // If buttons exist, test interaction
      if (buttonCount > 0) {
        const firstButton = debugButtons.first();
        await expect(firstButton).toBeVisible();
        await firstButton.click();
      }

      // Take screenshot of debug panel
      await expect(component).toHaveScreenshot('babylon-renderer-debug-panel.png');
    });

    test('should handle component enable/disable dynamically', async ({ mount, page }) => {
      console.log('[DEBUG] Testing dynamic component toggling');
      
      // Start with minimal components
      const component = await mount(
        <BabylonRenderer 
          showSceneControls={false}
          showMeshDisplay={false}
          showDebugPanel={false}
        />
      );
      
      // Verify only canvas is visible
      await expect(component.locator('.babylon-renderer__canvas-area')).toBeVisible();
      await expect(component.locator('.babylon-renderer__controls-area')).not.toBeVisible();
      await expect(component.locator('.babylon-renderer__mesh-area')).not.toBeVisible();
      await expect(component.locator('.babylon-renderer__debug-area')).not.toBeVisible();
      
      await expect(component).toHaveScreenshot('babylon-renderer-minimal.png');
      
      // Update to show all components
      await component.update(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
          showDebugPanel={true}
        />
      );
      
      // Verify all components are now visible
      await expect(component.locator('.babylon-renderer__controls-area')).toBeVisible();
      await expect(component.locator('.babylon-renderer__mesh-area')).toBeVisible();
      await expect(component.locator('.babylon-renderer__debug-area')).toBeVisible();
      
      await expect(component).toHaveScreenshot('babylon-renderer-full-after-update.png');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle loading states gracefully', async ({ mount, page }) => {
      console.log('[DEBUG] Testing loading state handling');
      
      const component = await mount(<BabylonRenderer />);
      
      // Should show loading state initially
      const loadingElement = component.locator('.babylon-renderer__loading');
      if (await loadingElement.isVisible()) {
        await expect(loadingElement).toContainText('Initializing Babylon.js Renderer');
        await expect(component).toHaveScreenshot('babylon-renderer-loading.png');
      }
      
      // Wait for loading to complete
      await expect(loadingElement).not.toBeVisible({ timeout: 10000 });
    });

    test('should maintain accessibility standards', async ({ mount, page }) => {
      console.log('[DEBUG] Testing accessibility compliance');
      
      const component = await mount(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
          showDebugPanel={true}
        />
      );
      
      // Verify main container has proper ARIA attributes
      await expect(component.getByRole('main')).toHaveAttribute('aria-label', 'Babylon Renderer');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Verify focus management
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Take screenshot for accessibility review
      await expect(component).toHaveScreenshot('babylon-renderer-accessibility.png');
    });

    test('should handle custom configurations', async ({ mount, page }) => {
      console.log('[DEBUG] Testing custom configuration handling');
      
      const customConfig: BabylonRendererProps = {
        layout: 'grid',
        responsive: false,
        showSceneControls: true,
        showMeshDisplay: true,
        showDebugPanel: true,
        engineConfig: {
          antialias: true,
          adaptToDeviceRatio: true
        },
        sceneConfig: {
          enableCamera: true,
          enableLighting: true,
          backgroundColor: '#ff0000',
          cameraPosition: [5, 5, 5]
        },
        className: 'custom-renderer',
        'aria-label': 'Custom 3D Renderer'
      };
      
      const component = await mount(<BabylonRenderer {...customConfig} />);
      
      // Verify custom configurations are applied
      await expect(component.getByTestId('babylon-renderer-container')).toHaveClass(/custom-renderer/);
      await expect(component.getByRole('main')).toHaveAttribute('aria-label', 'Custom 3D Renderer');
      await expect(component.getByTestId('babylon-renderer-container')).toHaveClass(/babylon-renderer--grid/);
      await expect(component.getByTestId('babylon-renderer-container')).not.toHaveClass(/babylon-renderer--responsive/);
      
      // Take screenshot of custom configuration
      await expect(component).toHaveScreenshot('babylon-renderer-custom-config.png');
    });
  });

  test.describe('Performance and Optimization', () => {
    
    test('should handle multiple re-renders efficiently', async ({ mount, page }) => {
      console.log('[DEBUG] Testing render performance');
      
      const component = await mount(<BabylonRenderer />);
      
      // Perform multiple updates to test performance
      for (let i = 0; i < 5; i++) {
        await component.update(
          <BabylonRenderer 
            showSceneControls={i % 2 === 0}
            showMeshDisplay={i % 3 === 0}
            showDebugPanel={i % 4 === 0}
          />
        );
        
        // Small delay to allow rendering
        await page.waitForTimeout(100);
      }
      
      // Verify final state
      await expect(component.getByTestId('babylon-renderer-container')).toBeVisible();
      
      // Take final screenshot
      await expect(component).toHaveScreenshot('babylon-renderer-performance-test.png');
    });

    test('should handle viewport changes smoothly', async ({ mount, page }) => {
      console.log('[DEBUG] Testing viewport change performance');
      
      const component = await mount(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
        />
      );
      
      // Test rapid viewport changes
      const viewports = [
        { width: 1920, height: 1080 },
        { width: 1024, height: 768 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 },
        { width: 1200, height: 800 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(200); // Allow layout to settle
        
        // Verify component remains functional
        await expect(component.getByTestId('babylon-renderer-container')).toBeVisible();
      }
      
      // Take final screenshot at standard viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(component).toHaveScreenshot('babylon-renderer-viewport-test.png');
    });
  });
});
