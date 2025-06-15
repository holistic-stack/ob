/**
 * @file Mesh Display Playwright Component Tests
 * 
 * Playwright component tests for MeshDisplay component
 * Tests mesh interaction, search functionality, and virtualization
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import * as BABYLON from '@babylonjs/core';
import { MeshDisplay } from './mesh-display';

test.describe('MeshDisplay Playwright Component Tests', () => {
  
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;
  let testMeshes: BABYLON.AbstractMesh[];

  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up MeshDisplay Playwright test environment');
    
    // Create mock engine and scene for testing
    mockEngine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    mockScene = new BABYLON.Scene(mockEngine);
    
    // Create test meshes
    testMeshes = [
      BABYLON.MeshBuilder.CreateBox('TestBox1', { size: 2 }, mockScene),
      BABYLON.MeshBuilder.CreateSphere('TestSphere1', { diameter: 2 }, mockScene),
      BABYLON.MeshBuilder.CreateCylinder('TestCylinder1', { height: 3, diameter: 1 }, mockScene),
      BABYLON.MeshBuilder.CreatePlane('TestPlane1', { size: 2 }, mockScene),
      BABYLON.MeshBuilder.CreateGround('TestGround1', { width: 6, height: 6 }, mockScene)
    ];
    
    // Position meshes
    testMeshes[1].position.x = 3;
    testMeshes[2].position.x = -3;
    testMeshes[3].position.y = 2;
    testMeshes[4].position.y = -1;
    
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
    console.log('[END] Cleaning up MeshDisplay Playwright test environment');
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  test.describe('Visual Rendering and Layout', () => {
    
    test('should render mesh display with meshes', async ({ mount }) => {
      console.log('[DEBUG] Testing mesh display rendering with meshes');
      
      const component = await mount(
        <MeshDisplay scene={mockScene} />
      );
      
      // Verify main container
      await expect(component.getByTestId('mesh-display-container')).toBeVisible();
      
      // Verify title
      await expect(component.getByText('Mesh Display')).toBeVisible();
      
      // Verify mesh items are displayed
      await expect(component.getByText('TestBox1')).toBeVisible();
      await expect(component.getByText('TestSphere1')).toBeVisible();
      await expect(component.getByText('TestCylinder1')).toBeVisible();
      await expect(component.getByText('TestPlane1')).toBeVisible();
      await expect(component.getByText('TestGround1')).toBeVisible();
      
      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('mesh-display-with-meshes.png');
    });

    test('should render empty state when no meshes', async ({ mount }) => {
      console.log('[DEBUG] Testing empty state rendering');
      
      // Create empty scene
      const emptyEngine = new BABYLON.NullEngine({
        renderWidth: 800,
        renderHeight: 600,
        textureSize: 512,
        deterministicLockstep: false,
        lockstepMaxSteps: 1
      });
      const emptyScene = new BABYLON.Scene(emptyEngine);
      
      const component = await mount(
        <MeshDisplay scene={emptyScene} />
      );
      
      // Verify empty state
      await expect(component.getByText('No meshes available')).toBeVisible();
      
      // Take screenshot of empty state
      await expect(component).toHaveScreenshot('mesh-display-empty.png');
      
      // Cleanup
      emptyScene.dispose();
      emptyEngine.dispose();
    });

    test('should render with search functionality', async ({ mount }) => {
      console.log('[DEBUG] Testing search functionality rendering');
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          searchable={true}
        />
      );
      
      // Verify search input is present
      await expect(component.locator('input[placeholder*="Search"]')).toBeVisible();
      
      // Take screenshot with search
      await expect(component).toHaveScreenshot('mesh-display-with-search.png');
    });

    test('should render with statistics', async ({ mount }) => {
      console.log('[DEBUG] Testing statistics rendering');
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          showStatistics={true}
        />
      );
      
      // Verify statistics are displayed
      await expect(component.getByText(/Total meshes:/)).toBeVisible();
      await expect(component.getByText('5')).toBeVisible(); // 5 test meshes
      
      // Take screenshot with statistics
      await expect(component).toHaveScreenshot('mesh-display-with-statistics.png');
    });
  });

  test.describe('Mesh Interactions', () => {
    
    test('should handle mesh selection', async ({ mount }) => {
      console.log('[DEBUG] Testing mesh selection');
      
      let selectedMesh: BABYLON.AbstractMesh | null = null;
      const handleMeshSelect = (mesh: BABYLON.AbstractMesh) => {
        selectedMesh = mesh;
      };
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          onMeshSelect={handleMeshSelect}
        />
      );
      
      // Click on first mesh
      const meshItem = component.getByText('TestBox1');
      await meshItem.click();
      
      // Take screenshot after selection
      await expect(component).toHaveScreenshot('mesh-display-mesh-selected.png');
    });

    test('should handle mesh visibility toggle', async ({ mount }) => {
      console.log('[DEBUG] Testing mesh visibility toggle');
      
      let visibilityToggled = false;
      const handleMeshToggleVisibility = (mesh: BABYLON.AbstractMesh) => {
        visibilityToggled = true;
        mesh.isVisible = !mesh.isVisible;
      };
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          onMeshToggleVisibility={handleMeshToggleVisibility}
        />
      );
      
      // Find and click visibility toggle button
      const visibilityButton = component.getByRole('button', { name: /toggle visibility/i }).first();
      await visibilityButton.click();
      
      // Take screenshot after visibility toggle
      await expect(component).toHaveScreenshot('mesh-display-visibility-toggled.png');
    });

    test('should handle mesh deletion', async ({ mount }) => {
      console.log('[DEBUG] Testing mesh deletion');
      
      let deletedMesh: BABYLON.AbstractMesh | null = null;
      const handleMeshDelete = (mesh: BABYLON.AbstractMesh) => {
        deletedMesh = mesh;
        mesh.dispose();
      };
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          onMeshDelete={handleMeshDelete}
        />
      );
      
      // Find and click delete button
      const deleteButton = component.getByRole('button', { name: /delete/i }).first();
      await deleteButton.click();
      
      // Take screenshot after deletion
      await expect(component).toHaveScreenshot('mesh-display-mesh-deleted.png');
    });

    test('should expand mesh properties', async ({ mount }) => {
      console.log('[DEBUG] Testing mesh properties expansion');
      
      const component = await mount(
        <MeshDisplay scene={mockScene} />
      );
      
      // Find and click expand button for first mesh
      const expandButton = component.getByRole('button', { name: /expand|show details/i }).first();
      await expandButton.click();
      
      // Verify properties are shown
      await expect(component.getByText(/Position:/)).toBeVisible();
      await expect(component.getByText(/Rotation:/)).toBeVisible();
      await expect(component.getByText(/Scaling:/)).toBeVisible();
      
      // Take screenshot with expanded properties
      await expect(component).toHaveScreenshot('mesh-display-properties-expanded.png');
    });
  });

  test.describe('Search and Filtering', () => {
    
    test('should filter meshes based on search term', async ({ mount }) => {
      console.log('[DEBUG] Testing mesh filtering');
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          searchable={true}
        />
      );
      
      const searchInput = component.locator('input[placeholder*="Search"]');
      
      // Search for "Box"
      await searchInput.fill('Box');
      
      // Should only show TestBox1
      await expect(component.getByText('TestBox1')).toBeVisible();
      await expect(component.getByText('TestSphere1')).not.toBeVisible();
      await expect(component.getByText('TestCylinder1')).not.toBeVisible();
      
      // Take screenshot of filtered results
      await expect(component).toHaveScreenshot('mesh-display-filtered-box.png');
      
      // Clear search
      await searchInput.clear();
      await searchInput.fill('Sphere');
      
      // Should only show TestSphere1
      await expect(component.getByText('TestSphere1')).toBeVisible();
      await expect(component.getByText('TestBox1')).not.toBeVisible();
      
      // Take screenshot of different filter
      await expect(component).toHaveScreenshot('mesh-display-filtered-sphere.png');
    });

    test('should show no results message when search yields no matches', async ({ mount }) => {
      console.log('[DEBUG] Testing no search results');
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          searchable={true}
        />
      );
      
      const searchInput = component.locator('input[placeholder*="Search"]');
      
      // Search for non-existent mesh
      await searchInput.fill('NonExistentMesh');
      
      // Should show no results message
      await expect(component.getByText(/No meshes found/)).toBeVisible();
      
      // Take screenshot of no results
      await expect(component).toHaveScreenshot('mesh-display-no-results.png');
    });

    test('should clear search when clear button is clicked', async ({ mount }) => {
      console.log('[DEBUG] Testing search clear functionality');
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          searchable={true}
        />
      );
      
      const searchInput = component.locator('input[placeholder*="Search"]');
      
      // Enter search term
      await searchInput.fill('Box');
      
      // Click clear button
      const clearButton = component.getByRole('button', { name: /clear/i });
      await clearButton.click();
      
      // Search input should be empty and all meshes visible
      await expect(searchInput).toHaveValue('');
      await expect(component.getByText('TestBox1')).toBeVisible();
      await expect(component.getByText('TestSphere1')).toBeVisible();
      
      // Take screenshot after clear
      await expect(component).toHaveScreenshot('mesh-display-search-cleared.png');
    });
  });

  test.describe('Virtualization and Performance', () => {
    
    test('should handle large numbers of meshes with virtualization', async ({ mount }) => {
      console.log('[DEBUG] Testing virtualization with many meshes');
      
      // Create many meshes
      for (let i = 0; i < 50; i++) {
        BABYLON.MeshBuilder.CreateBox(`Box${i}`, { size: 0.5 }, mockScene);
      }
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          virtualizeList={true}
          maxVisibleItems={10}
        />
      );
      
      // Should show virtualized list
      await expect(component.getByTestId('mesh-display-container')).toBeVisible();
      
      // Take screenshot of virtualized list
      await expect(component).toHaveScreenshot('mesh-display-virtualized.png');
    });
  });

  test.describe('Accessibility', () => {
    
    test('should support keyboard navigation', async ({ mount, page }) => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      const component = await mount(
        <MeshDisplay scene={mockScene} />
      );
      
      // Tab through mesh items
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Use arrow keys to navigate
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Take screenshot showing focus states
      await expect(component).toHaveScreenshot('mesh-display-keyboard-navigation.png');
    });

    test('should have proper ARIA attributes', async ({ mount }) => {
      console.log('[DEBUG] Testing ARIA attributes');
      
      const component = await mount(
        <MeshDisplay 
          scene={mockScene}
          aria-label="Custom Mesh Display"
        />
      );
      
      // Verify ARIA attributes
      await expect(component.getByTestId('mesh-display-container')).toHaveAttribute('aria-label', 'Custom Mesh Display');
      
      // Take screenshot for accessibility review
      await expect(component).toHaveScreenshot('mesh-display-accessibility.png');
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should adapt to different viewport sizes', async ({ mount, page }) => {
      console.log('[DEBUG] Testing responsive design');
      
      const component = await mount(
        <MeshDisplay scene={mockScene} />
      );
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(component).toHaveScreenshot('mesh-display-desktop.png');
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(component).toHaveScreenshot('mesh-display-tablet.png');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(component).toHaveScreenshot('mesh-display-mobile.png');
    });
  });
});
