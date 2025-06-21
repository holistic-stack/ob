/**
 * BabylonRenderer Visual Regression Tests
 * 
 * Comprehensive visual regression tests for the Babylon.js 3D rendering pipeline
 * using Playwright Component Tests with synchronized camera views and screenshot comparison.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { test, expect } from '@playwright/experimental-ct-react';
import React from 'react';
import { BabylonRenderer } from './babylon-renderer';
import type { ASTNode } from '@holistic-stack/openscad-parser';

// Test data for different OpenSCAD geometries
const testGeometries = {
  simpleCube: [
    { type: 'cube', size: [10, 10, 10], position: [0, 0, 0] }
  ] as ASTNode[],
  
  multiplePrimitives: [
    { type: 'cube', size: [10, 10, 10], position: [0, 0, 0] },
    { type: 'sphere', radius: 5, position: [15, 0, 0] },
    { type: 'cylinder', radius: 3, height: 8, position: [-15, 0, 0] }
  ] as ASTNode[],
  
  complexScene: [
    { type: 'cube', size: [20, 20, 20], position: [0, 0, 0] },
    { type: 'sphere', radius: 8, position: [0, 0, 0] },
    { type: 'cylinder', radius: 5, height: 30, position: [0, 0, 0], rotation: [90, 0, 0] }
  ] as ASTNode[],
  
  transformedObjects: [
    { type: 'cube', size: [5, 5, 5], position: [10, 10, 10], rotation: [45, 45, 0] },
    { type: 'cube', size: [5, 5, 5], position: [-10, -10, -10], rotation: [0, 45, 45] },
    { type: 'sphere', radius: 3, position: [0, 15, 0], scale: [1.5, 1, 1.5] }
  ] as ASTNode[]
};

// Test wrapper component with error boundary
const TestBabylonRenderer: React.FC<{
  astData?: ASTNode[];
  width?: number;
  height?: number;
  showControls?: boolean;
}> = ({ 
  astData = [], 
  width = 800, 
  height = 600,
  showControls = false 
}) => {
  const [meshes, setMeshes] = React.useState<any[]>([]);
  const [processingError, setProcessingError] = React.useState<string | null>(null);

  return (
    <div 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        backgroundColor: '#000000',
        position: 'relative'
      }}
      data-testid="babylon-container"
    >
      <BabylonRenderer
        layout="flex"
        responsive={false}
        showSceneControls={showControls}
        showMeshDisplay={false}
        showDebugPanel={false}
        astData={astData}
        onASTProcessingStart={() => {
          console.log('[Visual Test] AST processing started');
        }}
        onASTProcessingComplete={(newMeshes) => {
          setMeshes(newMeshes);
          console.log('[Visual Test] AST processing completed with', newMeshes.length, 'meshes');
        }}
        onASTProcessingError={(error) => {
          setProcessingError(error);
          console.error('[Visual Test] AST processing error:', error);
        }}
        engineConfig={{
          antialias: true,
          adaptToDeviceRatio: false,
          powerPreference: 'high-performance'
        }}
        sceneConfig={{
          clearColor: [0, 0, 0, 1],
          ambientColor: [0.2, 0.2, 0.2]
        }}
        aria-label="3D Visualization Test"
      />
      
      {/* Status overlay for debugging */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          fontSize: '12px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '5px',
          borderRadius: '3px',
          fontFamily: 'monospace'
        }}
        data-testid="status-overlay"
      >
        AST: {astData.length} nodes | Meshes: {meshes.length}
        {processingError && <div style={{ color: 'red' }}>Error: {processingError}</div>}
      </div>
    </div>
  );
};

test.describe('BabylonRenderer Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Wait for fonts and resources to load
    await page.waitForLoadState('networkidle');
  });

  test('should render empty scene with black background', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={[]} />);
    
    // Wait for Babylon.js to initialize
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await expect(component).toHaveScreenshot('empty-scene.png');
  });

  test('should render simple cube geometry', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.simpleCube} />);
    
    // Wait for AST processing and mesh creation
    await page.waitForTimeout(3000);
    
    // Verify mesh was created
    const statusOverlay = component.getByTestId('status-overlay');
    await expect(statusOverlay).toContainText('Meshes: 1');
    
    // Take screenshot
    await expect(component).toHaveScreenshot('simple-cube.png');
  });

  test('should render multiple primitive geometries', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.multiplePrimitives} />);
    
    // Wait for AST processing
    await page.waitForTimeout(4000);
    
    // Verify all meshes were created
    const statusOverlay = component.getByTestId('status-overlay');
    await expect(statusOverlay).toContainText('Meshes: 3');
    
    // Take screenshot
    await expect(component).toHaveScreenshot('multiple-primitives.png');
  });

  test('should render complex scene with boolean operations', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.complexScene} />);
    
    // Wait for complex CSG operations
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await expect(component).toHaveScreenshot('complex-scene.png');
  });

  test('should render transformed objects correctly', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.transformedObjects} />);
    
    // Wait for transformations to apply
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await expect(component).toHaveScreenshot('transformed-objects.png');
  });

  test('should handle different viewport sizes', async ({ mount, page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const component = await mount(
      <TestBabylonRenderer 
        astData={testGeometries.simpleCube} 
        width={375} 
        height={400} 
      />
    );
    
    await page.waitForTimeout(3000);
    await expect(component).toHaveScreenshot('mobile-viewport.png');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await component.update(
      <TestBabylonRenderer 
        astData={testGeometries.simpleCube} 
        width={768} 
        height={500} 
      />
    );
    
    await page.waitForTimeout(2000);
    await expect(component).toHaveScreenshot('tablet-viewport.png');
  });

  test('should show scene controls when enabled', async ({ mount, page }) => {
    const component = await mount(
      <TestBabylonRenderer 
        astData={testGeometries.simpleCube} 
        showControls={true}
      />
    );
    
    await page.waitForTimeout(3000);
    await expect(component).toHaveScreenshot('with-scene-controls.png');
  });

  test('should handle performance stress test', async ({ mount, page }) => {
    // Create many objects for performance testing
    const manyObjects: ASTNode[] = [];
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 5; j++) {
        manyObjects.push({
          type: 'cube',
          size: [2, 2, 2],
          position: [i * 3 - 30, j * 3 - 6, 0]
        } as ASTNode);
      }
    }
    
    const component = await mount(<TestBabylonRenderer astData={manyObjects} />);
    
    // Wait longer for many objects to process
    await page.waitForTimeout(8000);
    
    // Verify performance
    const statusOverlay = component.getByTestId('status-overlay');
    await expect(statusOverlay).toContainText('Meshes: 100');
    
    await expect(component).toHaveScreenshot('performance-stress-test.png');
  });

  test('should handle error states gracefully', async ({ mount, page }) => {
    // Test with invalid AST data
    const invalidAST = [
      { type: 'invalid_geometry', invalidProp: 'test' }
    ] as any[];
    
    const component = await mount(<TestBabylonRenderer astData={invalidAST} />);
    
    await page.waitForTimeout(3000);
    
    // Should show error in status overlay
    const statusOverlay = component.getByTestId('status-overlay');
    await expect(statusOverlay).toContainText('Error:');
    
    await expect(component).toHaveScreenshot('error-state.png');
  });

  test('should maintain camera position during updates', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.simpleCube} />);
    
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await expect(component).toHaveScreenshot('before-update.png');
    
    // Update with different geometry
    await component.update(<TestBabylonRenderer astData={testGeometries.multiplePrimitives} />);
    
    await page.waitForTimeout(3000);
    
    // Camera should maintain similar position
    await expect(component).toHaveScreenshot('after-update.png');
  });

  test('should render with different lighting conditions', async ({ mount, page }) => {
    const component = await mount(
      <TestBabylonRenderer 
        astData={testGeometries.complexScene}
      />
    );
    
    await page.waitForTimeout(4000);
    
    // Test default lighting
    await expect(component).toHaveScreenshot('default-lighting.png');
    
    // Note: In a real implementation, you would add props to control lighting
    // and test different lighting scenarios
  });
});

test.describe('BabylonRenderer Performance Tests', () => {
  test('should meet rendering performance targets', async ({ mount, page }) => {
    const startTime = Date.now();
    
    const component = await mount(<TestBabylonRenderer astData={testGeometries.multiplePrimitives} />);
    
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    const renderTime = Date.now() - startTime;
    
    // Should render within performance target
    expect(renderTime).toBeLessThan(5000); // 5 second max for initial render
    
    // Verify meshes were created
    const statusOverlay = component.getByTestId('status-overlay');
    await expect(statusOverlay).toContainText('Meshes: 3');
  });

  test('should handle rapid AST updates efficiently', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.simpleCube} />);
    
    await page.waitForTimeout(2000);
    
    const updateStartTime = Date.now();
    
    // Rapid updates
    await component.update(<TestBabylonRenderer astData={testGeometries.multiplePrimitives} />);
    await page.waitForTimeout(500);
    
    await component.update(<TestBabylonRenderer astData={testGeometries.transformedObjects} />);
    await page.waitForTimeout(500);
    
    await component.update(<TestBabylonRenderer astData={testGeometries.simpleCube} />);
    await page.waitForTimeout(1000);
    
    const updateTime = Date.now() - updateStartTime;
    
    // Updates should be efficient
    expect(updateTime).toBeLessThan(3000);
    
    // Final state should be correct
    const statusOverlay = component.getByTestId('status-overlay');
    await expect(statusOverlay).toContainText('Meshes: 1');
  });
});

test.describe('BabylonRenderer Accessibility Tests', () => {
  test('should have proper ARIA attributes', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.simpleCube} />);
    
    // Check for accessibility attributes
    const babylonContainer = component.getByTestId('babylon-container');
    await expect(babylonContainer).toBeVisible();
    
    // Canvas should have proper ARIA label
    const canvas = page.locator('canvas').first();
    await expect(canvas).toHaveAttribute('aria-label', '3D Visualization Test');
  });

  test('should support keyboard navigation', async ({ mount, page }) => {
    const component = await mount(<TestBabylonRenderer astData={testGeometries.simpleCube} />);
    
    await page.waitForTimeout(2000);
    
    // Focus the canvas
    const canvas = page.locator('canvas').first();
    await canvas.focus();
    
    // Test keyboard interactions (camera controls)
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    
    // Should maintain focus and respond to keyboard
    await expect(canvas).toBeFocused();
  });
});
