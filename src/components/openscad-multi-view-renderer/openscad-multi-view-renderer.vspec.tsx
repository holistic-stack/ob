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
import { OpenSCADMultiViewRendererSimple as OpenSCADMultiViewRenderer } from './openscad-multi-view-renderer-simple';

test.describe('OpenSCAD Multi-View Renderer Component Tests', () => {
  
  test('should render component with 4 camera views', async ({ mount }) => {
    console.log('[INIT] Testing OpenSCAD Multi-View Renderer component rendering');
    
    const component = await mount(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        width={800}
        height={600}
      />
    );

    // Verify component is mounted
    await expect(component).toBeVisible();
    
    // Verify all 4 canvas elements are present (one for each view)
    const canvases = component.locator('canvas');
    await expect(canvases).toHaveCount(4);
    
    // Verify view labels are present
    await expect(component.locator('[data-testid="perspective-view"]')).toBeVisible();
    await expect(component.locator('[data-testid="top-view"]')).toBeVisible();
    await expect(component.locator('[data-testid="side-view"]')).toBeVisible();
    await expect(component.locator('[data-testid="bottom-view"]')).toBeVisible();
    
    console.log('[END] Component rendering test completed successfully');
  });

  test('should process cube OpenSCAD code through complete pipeline', async ({ mount }) => {
    console.log('[INIT] Testing cube OpenSCAD code processing through pipeline');
    
    const component = await mount(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        width={800}
        height={600}
      />
    );

    // Wait for pipeline processing to complete
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });
    
    // Verify mesh information is displayed
    await expect(component.locator('[data-testid="mesh-info"]')).toBeVisible();
    await expect(component.locator('[data-testid="mesh-info"]')).toContainText('cube_');
    
    // Verify mesh has geometry
    await expect(component.locator('[data-testid="vertex-count"]')).toContainText(/\d+/);
    await expect(component.locator('[data-testid="index-count"]')).toContainText(/\d+/);
    
    console.log('[END] Cube processing test completed successfully');
  });

  test('should render cube in all 4 views with proper camera positioning', async ({ mount }) => {
    console.log('[INIT] Testing cube rendering in all 4 camera views');
    
    const component = await mount(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        width={800}
        height={600}
      />
    );

    // Wait for processing to complete
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });
    
    // Verify each view has proper camera setup
    await expect(component.locator('[data-testid="perspective-camera-info"]')).toContainText('ArcRotateCamera');
    await expect(component.locator('[data-testid="top-camera-info"]')).toContainText('UniversalCamera');
    await expect(component.locator('[data-testid="side-camera-info"]')).toContainText('UniversalCamera');
    await expect(component.locator('[data-testid="bottom-camera-info"]')).toContainText('UniversalCamera');
    
    // Verify mesh is visible in all views
    await expect(component.locator('[data-testid="perspective-mesh-visible"]')).toContainText('true');
    await expect(component.locator('[data-testid="top-mesh-visible"]')).toContainText('true');
    await expect(component.locator('[data-testid="side-mesh-visible"]')).toContainText('true');
    await expect(component.locator('[data-testid="bottom-mesh-visible"]')).toContainText('true');
    
    console.log('[END] Multi-view rendering test completed successfully');
  });

  test('should take screenshot for visual regression testing', async ({ mount }) => {
    console.log('[INIT] Taking screenshot for visual regression testing');
    
    const component = await mount(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        width={800}
        height={600}
      />
    );

    // Verify component is mounted and visible
    await expect(component.getByTestId('openscad-multi-view-renderer')).toBeVisible();
    await expect(component.getByTestId('renderer-title')).toBeVisible();
    await expect(component.getByTestId('processing-status')).toContainText('Success');

    // Verify all 4 views are visible
    await expect(component.getByTestId('perspective-view')).toBeVisible();
    await expect(component.getByTestId('top-view')).toBeVisible();
    await expect(component.getByTestId('side-view')).toBeVisible();
    await expect(component.getByTestId('bottom-view')).toBeVisible();
    
    // Take screenshot for visual regression testing with proper options
    await expect(component).toHaveScreenshot('openscad-multi-view-cube.png', {
      animations: 'disabled',
      threshold: 0.2
    });
    
    console.log('[END] Screenshot test completed successfully');
  });

  test('should handle different OpenSCAD primitives', async ({ mount }) => {
    console.log('[INIT] Testing different OpenSCAD primitives');
    
    const testCases = [
      { code: 'sphere(5);', name: 'sphere' },
      { code: 'cylinder(h=10, r=3);', name: 'cylinder' },
      { code: 'union() { cube([5, 5, 5]); translate([3, 3, 3]) sphere(2); }', name: 'union' }
    ];

    for (const testCase of testCases) {
      console.log(`[DEBUG] Testing ${testCase.name}: ${testCase.code}`);
      
      const component = await mount(
        <OpenSCADMultiViewRenderer 
          openscadCode={testCase.code}
          width={800}
          height={600}
        />
      );

      // Wait for processing
      await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });
      
      // Verify mesh is created
      await expect(component.locator('[data-testid="mesh-info"]')).toBeVisible();
      
      // Wait for rendering to stabilize before screenshot
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Take screenshot for each primitive with proper naming
      await expect(component).toHaveScreenshot(`openscad-multi-view-${testCase.name}.png`, {
        animations: 'disabled',
        threshold: 0.2
      });
      
      console.log(`[DEBUG] ${testCase.name} test completed successfully`);
    }
    
    console.log('[END] Different primitives test completed successfully');
  });

  test('should handle pipeline errors gracefully', async ({ mount }) => {
    console.log('[INIT] Testing error handling for invalid OpenSCAD code');
    
    const component = await mount(
      <OpenSCADMultiViewRenderer 
        openscadCode="invalid_function();"
        width={800}
        height={600}
      />
    );

    // Wait for processing to complete (should fail)
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Error', { timeout: 30000 });
    
    // Verify error message is displayed
    await expect(component.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(component.locator('[data-testid="error-message"]')).toContainText(/error|failed|invalid/i);
    
    // Verify views still render (empty scenes)
    const canvases = component.locator('canvas');
    await expect(canvases).toHaveCount(4);
    
    console.log('[END] Error handling test completed successfully');
  });

  test('should synchronize camera movements across views', async ({ mount }) => {
    console.log('[INIT] Testing camera synchronization across views');
    
    const component = await mount(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        width={800}
        height={600}
        enableCameraSynchronization={true}
      />
    );

    // Wait for processing
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });
    
    // Verify synchronization controls are present
    await expect(component.locator('[data-testid="sync-cameras-toggle"]')).toBeVisible();
    await expect(component.locator('[data-testid="reset-cameras-button"]')).toBeVisible();
    
    // Test camera reset functionality
    await component.locator('[data-testid="reset-cameras-button"]').click();
    
    // Verify cameras are reset (check camera positions)
    await expect(component.locator('[data-testid="perspective-camera-position"]')).toContainText(/\d+/);
    
    console.log('[END] Camera synchronization test completed successfully');
  });

  // Visual Regression Tests with Screenshots
  test('should take screenshot for sphere rendering', async ({ mount }) => {
    console.log('[INIT] Taking screenshot for sphere visual regression testing');

    const component = await mount(
      <OpenSCADMultiViewRenderer
        openscadCode="sphere(5);"
        width={800}
        height={600}
        enableDebugInfo={true}
      />
    );

    // Wait for processing and rendering to complete
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });

    // Wait for rendering to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot for visual regression testing
    await expect(component).toHaveScreenshot('openscad-multi-view-sphere.png', {
      animations: 'disabled',
      threshold: 0.2
    });

    console.log('[END] Sphere visual regression test completed successfully');
  });

  test('should take screenshot for union operation', async ({ mount }) => {
    console.log('[INIT] Taking screenshot for union operation visual regression testing');

    const component = await mount(
      <OpenSCADMultiViewRenderer
        openscadCode="union() { cube([5, 5, 5]); sphere(3); }"
        width={800}
        height={600}
        enableCameraSynchronization={true}
        enableDebugInfo={true}
      />
    );

    // Wait for processing and rendering to complete
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });

    // Wait for rendering to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot for visual regression testing
    await expect(component).toHaveScreenshot('openscad-multi-view-union.png', {
      animations: 'disabled',
      threshold: 0.2
    });

    console.log('[END] Union operation visual regression test completed successfully');
  });

  test('should take screenshot for difference operation', async ({ mount }) => {
    console.log('[INIT] Taking screenshot for difference operation visual regression testing');

    const component = await mount(
      <OpenSCADMultiViewRenderer
        openscadCode="difference() { cube([10, 10, 10]); sphere(6); }"
        width={800}
        height={600}
        enableCameraSynchronization={false}
        enableDebugInfo={false}
      />
    );

    // Wait for processing and rendering to complete
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });

    // Wait for rendering to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot for visual regression testing
    await expect(component).toHaveScreenshot('openscad-multi-view-difference.png', {
      animations: 'disabled',
      threshold: 0.2
    });

    console.log('[END] Difference operation visual regression test completed successfully');
  });

  test('should take comprehensive screenshots for all view configurations', async ({ mount }) => {
    console.log('[INIT] Taking comprehensive screenshots for all view configurations');

    const configurations = [
      {
        name: 'debug-enabled',
        props: {
          openscadCode: 'cube([8, 8, 8]);',
          width: 800,
          height: 600,
          enableDebugInfo: true,
          enableCameraSynchronization: false
        }
      },
      {
        name: 'sync-enabled',
        props: {
          openscadCode: 'cylinder(h=12, r=4);',
          width: 800,
          height: 600,
          enableDebugInfo: false,
          enableCameraSynchronization: true
        }
      },
      {
        name: 'both-enabled',
        props: {
          openscadCode: 'intersection() { cube([10, 10, 10]); sphere(7); }',
          width: 800,
          height: 600,
          enableDebugInfo: true,
          enableCameraSynchronization: true
        }
      }
    ];

    for (const config of configurations) {
      console.log(`[DEBUG] Testing configuration: ${config.name}`);

      const component = await mount(
        <OpenSCADMultiViewRenderer {...config.props} />
      );

      // Wait for processing and rendering to complete
      await expect(component.locator('[data-testid="processing-status"]')).toContainText('Success', { timeout: 30000 });

      // Wait for rendering to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take screenshot for this configuration
      await expect(component).toHaveScreenshot(`openscad-multi-view-${config.name}.png`, {
        animations: 'disabled',
        threshold: 0.2
      });

      console.log(`[DEBUG] Screenshot taken for ${config.name} configuration`);
    }

    console.log('[END] Comprehensive screenshot test completed successfully');
  });

  test('should take error state screenshots', async ({ mount }) => {
    console.log('[INIT] Taking screenshots for error states');

    const component = await mount(
      <OpenSCADMultiViewRenderer
        openscadCode="invalid_syntax_here();"
        width={800}
        height={600}
        enableDebugInfo={true}
      />
    );

    // Wait for error processing to complete
    await expect(component.locator('[data-testid="processing-status"]')).toContainText('Error', { timeout: 30000 });

    // Wait for error state to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot of error state
    await expect(component).toHaveScreenshot('openscad-multi-view-error-state.png', {
      animations: 'disabled',
      threshold: 0.2
    });

    console.log('[END] Error state screenshot test completed successfully');
  });

});
