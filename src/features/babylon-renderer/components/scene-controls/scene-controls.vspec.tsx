/**
 * @file Scene Controls Playwright Component Tests
 * 
 * Playwright component tests for SceneControls component
 * Tests user interactions, visual states, and accessibility
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import * as BABYLON from '@babylonjs/core';
import { SceneControls } from './scene-controls';

test.describe('SceneControls Playwright Component Tests', () => {
  
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;

  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up SceneControls Playwright test environment');
    
    // Create mock engine and scene for testing
    mockEngine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    mockScene = new BABYLON.Scene(mockEngine);
    
    // Add some test content
    BABYLON.MeshBuilder.CreateBox('testBox', { size: 2 }, mockScene);
    new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), mockScene);
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      } else if (msg.text().includes('[DEBUG]') || msg.text().includes('[ERROR]') || msg.text().includes('[WARN]')) {
        console.log(`[BROWSER] ${msg.text()}`);
      }
    });
  });

  test.afterEach(async () => {
    console.log('[END] Cleaning up SceneControls Playwright test environment');
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  test.describe('Visual Rendering and Layout', () => {
    
    test('should render scene controls with default state', async ({ mount }) => {
      console.log('[DEBUG] Testing default scene controls rendering');
      
      const component = await mount(
        <SceneControls scene={mockScene} />
      );
      
      // Verify main container
      await expect(component.getByTestId('scene-controls-container')).toBeVisible();
      
      // Verify title
      await expect(component.getByText('Scene Controls')).toBeVisible();
      
      // Verify control buttons are present
      await expect(component.getByRole('button', { name: /wireframe/i })).toBeVisible();
      await expect(component.getByRole('button', { name: /reset camera/i })).toBeVisible();
      await expect(component.getByRole('button', { name: /lighting/i })).toBeVisible();
      
      // Verify background color input
      await expect(component.locator('input[type="color"]')).toBeVisible();
      
      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('scene-controls-default.png');
    });

    test('should render with custom title and collapsed state', async ({ mount }) => {
      console.log('[DEBUG] Testing custom title and collapsed state');
      
      const component = await mount(
        <SceneControls 
          scene={mockScene}
          title="Custom Scene Controls"
          defaultCollapsed={true}
        />
      );
      
      // Verify custom title
      await expect(component.getByText('Custom Scene Controls')).toBeVisible();
      
      // Verify collapsed state
      await expect(component.locator('.scene-controls__content')).not.toBeVisible();
      
      // Verify collapse button
      const collapseButton = component.getByRole('button', { name: /expand/i });
      await expect(collapseButton).toBeVisible();
      
      // Take screenshot of collapsed state
      await expect(component).toHaveScreenshot('scene-controls-collapsed.png');
    });

    test('should handle null scene gracefully', async ({ mount }) => {
      console.log('[DEBUG] Testing null scene handling');
      
      const component = await mount(
        <SceneControls scene={null} />
      );
      
      // Verify component renders
      await expect(component.getByTestId('scene-controls-container')).toBeVisible();
      
      // Verify controls are disabled
      await expect(component.getByRole('button', { name: /wireframe/i })).toBeDisabled();
      await expect(component.getByRole('button', { name: /reset camera/i })).toBeDisabled();
      await expect(component.getByRole('button', { name: /lighting/i })).toBeDisabled();
      await expect(component.locator('input[type="color"]')).toBeDisabled();
      
      // Take screenshot of disabled state
      await expect(component).toHaveScreenshot('scene-controls-disabled.png');
    });
  });

  test.describe('User Interactions', () => {
    
    test('should handle wireframe toggle interaction', async ({ mount }) => {
      console.log('[DEBUG] Testing wireframe toggle interaction');
      
      let wireframeToggled = false;
      const handleWireframeToggle = () => {
        wireframeToggled = true;
      };
      
      const component = await mount(
        <SceneControls 
          scene={mockScene}
          onWireframeToggle={handleWireframeToggle}
        />
      );
      
      const wireframeButton = component.getByRole('button', { name: /wireframe/i });
      
      // Initial state should show "Enable Wireframe"
      await expect(wireframeButton).toContainText('Enable Wireframe');
      
      // Click wireframe button
      await wireframeButton.click();
      
      // Take screenshot after interaction
      await expect(component).toHaveScreenshot('scene-controls-wireframe-clicked.png');
    });

    test('should handle camera reset interaction', async ({ mount }) => {
      console.log('[DEBUG] Testing camera reset interaction');
      
      let cameraReset = false;
      const handleCameraReset = () => {
        cameraReset = true;
      };
      
      const component = await mount(
        <SceneControls 
          scene={mockScene}
          onCameraReset={handleCameraReset}
        />
      );
      
      const resetButton = component.getByRole('button', { name: /reset camera/i });
      
      // Click reset button
      await resetButton.click();
      
      // Take screenshot after interaction
      await expect(component).toHaveScreenshot('scene-controls-camera-reset.png');
    });

    test('should handle lighting toggle interaction', async ({ mount }) => {
      console.log('[DEBUG] Testing lighting toggle interaction');
      
      let lightingToggled = false;
      const handleLightingToggle = () => {
        lightingToggled = true;
      };
      
      const component = await mount(
        <SceneControls 
          scene={mockScene}
          onLightingToggle={handleLightingToggle}
        />
      );
      
      const lightingButton = component.getByRole('button', { name: /lighting/i });
      
      // Click lighting button
      await lightingButton.click();
      
      // Take screenshot after interaction
      await expect(component).toHaveScreenshot('scene-controls-lighting-clicked.png');
    });

    test('should handle background color change', async ({ mount }) => {
      console.log('[DEBUG] Testing background color change');
      
      let colorChanged = false;
      let newColor = '';
      const handleBackgroundColorChange = (color: string) => {
        colorChanged = true;
        newColor = color;
      };
      
      const component = await mount(
        <SceneControls 
          scene={mockScene}
          onBackgroundColorChange={handleBackgroundColorChange}
        />
      );
      
      const colorInput = component.locator('input[type="color"]');
      
      // Change color value
      await colorInput.fill('#ff0000');
      
      // Take screenshot after color change
      await expect(component).toHaveScreenshot('scene-controls-color-changed.png');
    });

    test('should handle collapse/expand functionality', async ({ mount }) => {
      console.log('[DEBUG] Testing collapse/expand functionality');
      
      const component = await mount(
        <SceneControls scene={mockScene} />
      );
      
      // Initially expanded
      await expect(component.locator('.scene-controls__content')).toBeVisible();
      
      // Find and click collapse button
      const collapseButton = component.getByRole('button', { name: /collapse/i });
      await collapseButton.click();
      
      // Should be collapsed now
      await expect(component.locator('.scene-controls__content')).not.toBeVisible();
      await expect(component).toHaveScreenshot('scene-controls-after-collapse.png');
      
      // Click expand button
      const expandButton = component.getByRole('button', { name: /expand/i });
      await expandButton.click();
      
      // Should be expanded again
      await expect(component.locator('.scene-controls__content')).toBeVisible();
      await expect(component).toHaveScreenshot('scene-controls-after-expand.png');
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    
    test('should support keyboard navigation', async ({ mount, page }) => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      const component = await mount(
        <SceneControls scene={mockScene} />
      );
      
      // Tab through controls
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Take screenshot showing focus states
      await expect(component).toHaveScreenshot('scene-controls-keyboard-navigation.png');
    });

    test('should have proper ARIA attributes', async ({ mount }) => {
      console.log('[DEBUG] Testing ARIA attributes');
      
      const component = await mount(
        <SceneControls 
          scene={mockScene}
          aria-label="Custom Scene Controls"
        />
      );
      
      // Verify ARIA attributes
      await expect(component.getByTestId('scene-controls-container')).toHaveAttribute('aria-label', 'Custom Scene Controls');
      
      // Verify button accessibility
      const buttons = component.getByRole('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await expect(button).toHaveAttribute('type', 'button');
      }
      
      // Take screenshot for accessibility review
      await expect(component).toHaveScreenshot('scene-controls-accessibility.png');
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should adapt to different viewport sizes', async ({ mount, page }) => {
      console.log('[DEBUG] Testing responsive design');
      
      const component = await mount(
        <SceneControls scene={mockScene} />
      );
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(component).toHaveScreenshot('scene-controls-desktop.png');
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(component).toHaveScreenshot('scene-controls-tablet.png');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(component).toHaveScreenshot('scene-controls-mobile.png');
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle disposed scene gracefully', async ({ mount }) => {
      console.log('[DEBUG] Testing disposed scene handling');
      
      // Dispose the scene
      mockScene.dispose();
      
      const component = await mount(
        <SceneControls scene={mockScene} />
      );
      
      // Component should still render but controls should be disabled
      await expect(component.getByTestId('scene-controls-container')).toBeVisible();
      await expect(component.getByRole('button', { name: /wireframe/i })).toBeDisabled();
      
      // Take screenshot of error state
      await expect(component).toHaveScreenshot('scene-controls-disposed-scene.png');
    });
  });
});
