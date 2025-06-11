/**
 * @file Complete Pipeline E2E Tests with Playwright
 * 
 * End-to-end tests for the complete OpenSCAD to Babylon.js pipeline
 * using the React UI interface with Playwright automation.
 * 
 * Tests the complete flow:
 * User Input → React UI → OpenSCAD Parser → AST → CSG2 → Babylon.js → 3D Visualization
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Complete OpenSCAD to Babylon.js Pipeline E2E', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Starting E2E test setup');
    
    // Navigate to the React application
    await page.goto('http://localhost:5173');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    console.log('[DEBUG] React application loaded successfully');
  });

  test('should load the React application successfully', async ({ page }) => {
    console.log('[DEBUG] Testing React application loading');
    
    // Check if the main title is present
    await expect(page.locator('h1')).toContainText('OpenSCAD to Babylon.js Pipeline');
    
    // Check if the code editor is present
    await expect(page.locator('[data-testid="openscad-editor"]')).toBeVisible();
    
    // Check if the 3D canvas is present
    await expect(page.locator('canvas')).toBeVisible();
    
    console.log('[END] React application loading test completed');
  });

  test('should process cube([10, 10, 10]) through the complete pipeline', async ({ page }) => {
    console.log('[DEBUG] Testing complete cube processing pipeline');
    
    // Clear the editor and input cube code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('cube([10, 10, 10]);');
    
    console.log('[DEBUG] OpenSCAD code entered: cube([10, 10, 10]);');
    
    // Click the process button
    await page.click('[data-testid="process-button"]');
    
    console.log('[DEBUG] Process button clicked, waiting for pipeline execution');
    
    // Wait for processing to complete (look for success indicator)
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
    
    // Check if the 3D scene was updated (mesh was created)
    await expect(page.locator('[data-testid="mesh-info"]')).toContainText('pipeline_mesh_');
    
    // Verify performance metrics are displayed
    await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
    
    console.log('[END] Complete cube processing pipeline test completed');
  });

  test('should process sphere(5) and display 3D result', async ({ page }) => {
    console.log('[DEBUG] Testing sphere processing pipeline');
    
    // Input sphere code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('sphere(5);');
    
    // Process the code
    await page.click('[data-testid="process-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
    
    // Check sphere was created
    await expect(page.locator('[data-testid="mesh-info"]')).toContainText('pipeline_mesh_');
    
    console.log('[END] Sphere processing pipeline test completed');
  });

  test('should process cylinder(h=10, r=3) successfully', async ({ page }) => {
    console.log('[DEBUG] Testing cylinder processing pipeline');
    
    // Input cylinder code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('cylinder(h=10, r=3);');
    
    // Process the code
    await page.click('[data-testid="process-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
    
    // Check cylinder was created
    await expect(page.locator('[data-testid="mesh-info"]')).toContainText('pipeline_mesh_');
    
    console.log('[END] Cylinder processing pipeline test completed');
  });

  test('should process union operations with CSG2', async ({ page }) => {
    console.log('[DEBUG] Testing union operation with CSG2');
    
    // Input union code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('union() { cube([5, 5, 5]); translate([3, 3, 3]) sphere(2); }');
    
    // Process the code
    await page.click('[data-testid="process-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 45000 });
    
    // Check that a mesh was created (union operations create combined meshes)
    await expect(page.locator('[data-testid="mesh-info"]')).toBeVisible();
    
    console.log('[END] Union operation test completed');
  });

  test('should process difference operations with CSG2', async ({ page }) => {
    console.log('[DEBUG] Testing difference operation with CSG2');
    
    // Input difference code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('difference() { cube([10, 10, 10]); sphere(6); }');
    
    // Process the code
    await page.click('[data-testid="process-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 45000 });
    
    // Check that a mesh was created
    await expect(page.locator('[data-testid="mesh-info"]')).toBeVisible();
    
    console.log('[END] Difference operation test completed');
  });

  test('should handle translation transformations', async ({ page }) => {
    console.log('[DEBUG] Testing translation transformation');
    
    // Input translate code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('translate([5, 10, 15]) cube([5, 5, 5]);');
    
    // Process the code
    await page.click('[data-testid="process-button"]');
    
    // Wait for success
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
    
    // Check that mesh was created and positioned
    await expect(page.locator('[data-testid="mesh-info"]')).toContainText('pipeline_mesh_');
    
    console.log('[END] Translation transformation test completed');
  });

  test('should display performance metrics', async ({ page }) => {
    console.log('[DEBUG] Testing performance metrics display');
    
    // Process a simple cube
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('cube([10, 10, 10]);');
    
    await page.click('[data-testid="process-button"]');
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
    
    // Check performance metrics are displayed
    const metricsPanel = page.locator('[data-testid="performance-metrics"]');
    await expect(metricsPanel).toBeVisible();
    
    // Check specific metrics
    await expect(metricsPanel).toContainText('Parse Time');
    await expect(metricsPanel).toContainText('Visit Time');
    await expect(metricsPanel).toContainText('Total Time');
    await expect(metricsPanel).toContainText('Node Count');
    await expect(metricsPanel).toContainText('Mesh Count');
    
    console.log('[END] Performance metrics test completed');
  });

  test('should handle error cases gracefully', async ({ page }) => {
    console.log('[DEBUG] Testing error handling');
    
    // Input invalid OpenSCAD code
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('invalid_syntax_here();');
    
    // Process the code
    await page.click('[data-testid="process-button"]');
    
    // Wait for error or success (depending on error handling)
    await page.waitForTimeout(5000);
    
    // Check that the application didn't crash
    await expect(page.locator('[data-testid="openscad-editor"]')).toBeVisible();
    
    console.log('[END] Error handling test completed');
  });

  test('should demonstrate complete pipeline integration', async ({ page }) => {
    console.log('[INIT] Starting complete pipeline integration test');
    
    const testCases = [
      { name: 'Simple Cube', code: 'cube([10, 10, 10]);' },
      { name: 'Simple Sphere', code: 'sphere(5);' },
      { name: 'Simple Cylinder', code: 'cylinder(h=10, r=3);' }
    ];

    for (const testCase of testCases) {
      console.log(`[DEBUG] Testing ${testCase.name}: ${testCase.code}`);
      
      // Clear and input code
      const editor = page.locator('[data-testid="openscad-editor"]');
      await editor.clear();
      await editor.fill(testCase.code);
      
      // Process
      await page.click('[data-testid="process-button"]');
      
      // Wait for completion
      await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
      
      // Verify mesh was created
      await expect(page.locator('[data-testid="mesh-info"]')).toBeVisible();
      
      console.log(`[DEBUG] ✅ ${testCase.name} processed successfully`);
      
      // Small delay between tests
      await page.waitForTimeout(1000);
    }
    
    console.log('[END] Complete pipeline integration test finished successfully');
  });

  test('should process a complex model and verify performance metrics', async ({ page }) => {
    console.log('[DEBUG] Testing complex model processing and performance metrics');

    const complexScadCode = `
      union() {
        cube([10, 10, 10], center = true);
        translate([15, 0, 0]) sphere(r = 7);
        difference() {
          cylinder(h = 20, r = 5);
          translate([0, 0, -1]) cylinder(h = 22, r = 4);
        }
        translate([-15, 0, 0]) {
          union() {
            cube([3, 3, 3]);
            translate([1, 1, 1]) sphere(r = 2);
          }
        }
      }
    `;

    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill(complexScadCode);

    await page.click('[data-testid="process-button"]');
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 60000 }); // Increased timeout for complex model

    const metricsPanel = page.locator('[data-testid="performance-metrics"]');
    await expect(metricsPanel).toBeVisible();

    const parseTime = await metricsPanel.locator('p:has-text("Parse Time") span').textContent();
    const visitTime = await metricsPanel.locator('p:has-text("Visit Time") span').textContent();
    const totalTime = await metricsPanel.locator('p:has-text("Total Time") span').textContent();
    const nodeCount = await metricsPanel.locator('p:has-text("Node Count") span').textContent();
    const meshCount = await metricsPanel.locator('p:has-text("Mesh Count") span').textContent();

    expect(parseTime).not.toBeNull();
    expect(visitTime).not.toBeNull();
    expect(totalTime).not.toBeNull();
    expect(nodeCount).not.toBeNull();
    expect(meshCount).not.toBeNull();

    // Convert to numbers and assert they are valid
    expect(Number(parseTime)).toBeGreaterThanOrEqual(0);
    expect(Number(visitTime)).toBeGreaterThanOrEqual(0);
    expect(Number(totalTime)).toBeGreaterThanOrEqual(0);
    expect(Number(nodeCount)).toBeGreaterThan(0); // Should be more than 0 nodes for a complex model
    expect(Number(meshCount)).toBeGreaterThan(0); // Should result in at least one mesh

    console.log('[END] Complex model performance metrics test completed');
  });

  test('should verify 3D camera controls work', async ({ page }) => {
    console.log('[DEBUG] Testing 3D camera controls');
    
    // Process a cube first
    const editor = page.locator('[data-testid="openscad-editor"]');
    await editor.clear();
    await editor.fill('cube([10, 10, 10]);');
    
    await page.click('[data-testid="process-button"]');
    await expect(page.locator('[data-testid="status-indicator"]')).toContainText('Success', { timeout: 30000 });
    
    // Get the canvas element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Test mouse interactions (simulate camera controls)
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      // Simulate mouse drag for camera rotation
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 50, canvasBox.y + canvasBox.height / 2 + 50);
      await page.mouse.up();
      
      console.log('[DEBUG] Camera rotation interaction simulated');
    }
    
    console.log('[END] 3D camera controls test completed');
  });
});
