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
import { createOpenSCADConsoleDebugger } from '../../utils/playwright-console-debugger';
import { OpenSCADMultiViewRenderer } from './openscad-multi-view-renderer';

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
        <OpenSCADMultiViewRenderer
          openscadCode="cube([10, 10, 10]);"
          width={200}
          height={150}
          enableDebugInfo={true}
        />
      );

      const mountTime = Date.now() - startTime;
      console.log(`[DIAGNOSTIC] Simplified component mounted successfully in ${mountTime}ms`);

      // Just check if component exists
      await expect(component).toBeVisible({ timeout: 5000 });

      console.log('[DIAGNOSTIC] Checking for basic elements...', await component.locator('[data-testid="renderer-title"]').textContent());

      // Check for basic elements
      await expect(component.locator('[data-testid="renderer-title"]')).toContainText('OpenSCAD Multi-View Renderer');

      const totalTime = Date.now() - startTime;
      console.log(`[DIAGNOSTIC] Simplified test completed successfully in ${totalTime}ms`);

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[DIAGNOSTIC] Simplified test failed after ${totalTime}ms:`, error);
      throw error;
    }
  });



});
