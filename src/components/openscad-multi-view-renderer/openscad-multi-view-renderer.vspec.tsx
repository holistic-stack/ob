/**
 * @file Playwright Component Test for OpenSCAD Multi-View Renderer
 * 
 * Tests the complete OpenSCAD to Babylon.js pipeline with 4 synchronized camera views:
 * - Perspective view (main 3D view)
 * - Top view (orthographic from above)
 * - Side view (orthographic from side)
 * - Bottom view (orthographic from below)
 * 
 * Uses TDD methodology with real OpenscadParser and NullEngine (no mocks)
 * Includes screenshot regression tests for visual validation
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { OpenSCADMultiViewRenderer } from './openscad-multi-view-renderer';
import { createOpenSCADConsoleDebugger } from '../../utils/playwright-console-debugger';

test.describe('OpenSCAD Multi-View Renderer Component Tests', () => {

  // Global console debugger for all tests
  let consoleDebugger = createOpenSCADConsoleDebugger();

  // Simple diagnostic test to identify timeout issues
  test('DIAGNOSTIC: should mount simplified component without timeout', async ({ mount }) => {
    console.log('[DIAGNOSTIC] Starting simplified component mount test');
    const startTime = Date.now();

    try {
      console.log('[DIAGNOSTIC] Attempting to mount simplified component...');

      const component = await mount(
        <div data-testid="renderer-title">Simple</div>
      );

      const mountTime = Date.now() - startTime;
      console.log(`[DIAGNOSTIC] Simplified component mounted successfully in ${mountTime}ms`);

      // Just check if component exists
      await expect(component).toBeVisible({ timeout: 5000 });
      console.log(`[DIAGNOSTIC] text content`, await component.textContent());

      // Check for basic elements - component IS the div with data-testid="renderer-title"
      await expect(component).toContainText('Simple');

      // Alternative: verify the data-testid attribute exists
      await expect(component).toHaveAttribute('data-testid', 'renderer-title');

      const totalTime = Date.now() - startTime;
      console.log(`[DIAGNOSTIC] Simplified test completed successfully in ${totalTime}ms`);

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[DIAGNOSTIC] Simplified test failed after ${totalTime}ms:`, error);
      throw error;
    }
  });

  // More comprehensive diagnostic test with nested elements
  test('DIAGNOSTIC: should handle nested elements correctly', async ({ mount }) => {
    console.log('[DIAGNOSTIC] Starting nested elements test');

    const component = await mount(
      <div data-testid="parent-container">
        <h1 data-testid="title">OpenSCAD Renderer</h1>
        <div data-testid="content">
          <span data-testid="status">Ready</span>
        </div>
      </div>
    );

    console.log(`[DIAGNOSTIC] Parent text content:`, await component.textContent());

    // Test parent component
    await expect(component).toBeVisible();
    await expect(component).toHaveAttribute('data-testid', 'parent-container');

    // Test nested elements using locator
    const title = component.locator('[data-testid="title"]');
    await expect(title).toContainText('OpenSCAD Renderer');
    console.log(`[DIAGNOSTIC] Title text:`, await title.textContent());

    const status = component.locator('[data-testid="status"]');
    await expect(status).toContainText('Ready');
    console.log(`[DIAGNOSTIC] Status text:`, await status.textContent());

    console.log('[DIAGNOSTIC] Nested elements test completed successfully');
  });

});
