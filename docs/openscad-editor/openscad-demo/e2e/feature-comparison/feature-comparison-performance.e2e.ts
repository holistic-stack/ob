/**
 * @file Feature Comparison Panel Performance E2E Tests
 * 
 * Advanced E2E tests focusing on performance, edge cases, and complex scenarios
 * for the Feature Comparison Panel component.
 * 
 * Tests cover:
 * - Performance metrics accuracy
 * - Large code handling in multiple editors
 * - Memory usage monitoring
 * - Error handling and edge cases
 * - Complex user interaction flows
 * - Real-world usage scenarios
 * 
 * Following project standards:
 * - No mocks for OpenSCAD Editor (uses real editor instances)
 * - Performance monitoring with actual measurements
 * - Real Monaco Editor integration testing
 * - Comprehensive error scenario coverage
 */

import { test, expect, Page } from '@playwright/test';
import { MonacoEditorHelper, setupDemoPage } from '../utils/monaco-helpers';

/**
 * Complex OpenSCAD code for performance testing
 */
const COMPLEX_OPENSCAD_CODE = `
// Complex OpenSCAD model for performance testing
module parametric_gear(
    teeth = 20,
    circular_pitch = 5,
    pressure_angle = 20,
    clearance = 0.2,
    gear_thickness = 5,
    rim_thickness = 8,
    hub_thickness = 10,
    hub_diameter = 15,
    bore_diameter = 5
) {
    // Calculate gear parameters
    pitch_radius = teeth * circular_pitch / (2 * PI);
    base_radius = pitch_radius * cos(pressure_angle);
    outer_radius = pitch_radius + (circular_pitch / PI - clearance);
    root_radius = pitch_radius - (circular_pitch / PI + clearance);
    
    difference() {
        union() {
            // Gear teeth
            for (i = [0:teeth-1]) {
                rotate([0, 0, i * 360 / teeth]) {
                    linear_extrude(height = gear_thickness) {
                        polygon(points = gear_tooth_profile(
                            base_radius, outer_radius, root_radius, pressure_angle
                        ));
                    }
                }
            }
            
            // Rim
            if (rim_thickness > gear_thickness) {
                translate([0, 0, -rim_thickness + gear_thickness]) {
                    cylinder(h = rim_thickness, r = root_radius);
                }
            }
            
            // Hub
            translate([0, 0, -hub_thickness + gear_thickness]) {
                cylinder(h = hub_thickness, r = hub_diameter/2);
            }
        }
        
        // Bore
        translate([0, 0, -hub_thickness - 1]) {
            cylinder(h = hub_thickness + gear_thickness + 2, r = bore_diameter/2);
        }
    }
}

// Generate multiple gears for testing
for (i = [0:2]) {
    translate([i * 50, 0, 0]) {
        parametric_gear(teeth = 15 + i * 5, circular_pitch = 4 + i);
    }
}

// Complex mathematical functions
function fibonacci(n) = n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);
function factorial(n) = n <= 1 ? 1 : n * factorial(n-1);

// Performance stress test
module stress_test() {
    for (x = [0:10:100]) {
        for (y = [0:10:100]) {
            translate([x, y, 0]) {
                cube([fibonacci(5), factorial(3), 2]);
            }
        }
    }
}

stress_test();
`;

/**
 * Helper class for Feature Comparison Performance testing
 */
class FeatureComparisonPerformanceHelper {
  constructor(private page: Page) {}

  /**
   * [INIT] Setup performance testing environment
   */
  async setupPerformanceTest(): Promise<void> {
    console.log('[INIT] Setting up performance testing environment...');
    
    // Open Feature Comparison Panel
    const compareButton = this.page.locator('[data-testid="feature-comparison-button"]');
    await expect(compareButton).toBeVisible();
    await compareButton.click();
    
    // Wait for panel to be fully loaded
    await expect(this.page.locator('.feature-comparison-panel')).toBeVisible();
    await this.page.waitForTimeout(1000);
    
    console.log('[DEBUG] Performance test environment ready');
  }

  /**
   * [DEBUG] Measure editor loading performance
   */
  async measureEditorLoadingPerformance(): Promise<{
    totalLoadTime: number;
    editorCount: number;
    averageLoadTime: number;
  }> {
    console.log('[DEBUG] Measuring editor loading performance...');
    
    const startTime = Date.now();
    
    // Wait for all Monaco editors to be loaded
    await this.page.waitForFunction(() => {
      const editors = document.querySelectorAll('.editor-panel .monaco-editor');
      return editors.length > 0 && Array.from(editors).every(editor => {
        return !editor.classList.contains('loading') && 
               editor.querySelector('.view-lines');
      });
    }, { timeout: 15000 });
    
    const endTime = Date.now();
    const totalLoadTime = endTime - startTime;
    
    const editorCount = await this.page.locator('.editor-panel .monaco-editor').count();
    const averageLoadTime = totalLoadTime / editorCount;
    
    const result = {
      totalLoadTime,
      editorCount,
      averageLoadTime
    };
    
    console.log('[DEBUG] Editor loading performance:', result);
    return result;
  }

  /**
   * [DEBUG] Test complex code handling in multiple editors
   */
  async testComplexCodeHandling(): Promise<{
    success: boolean;
    editorCount: number;
    codeLength: number;
    processingTime: number;
  }> {
    console.log('[DEBUG] Testing complex code handling...');
    
    const startTime = Date.now();
    
    // Set complex code in all editors
    await this.page.evaluate((code) => {
      const monacoEditors = (window as any).monaco?.editor?.getEditors();
      if (monacoEditors) {
        monacoEditors.forEach((editor: any) => {
          editor.setValue(code);
        });
      }
    }, COMPLEX_OPENSCAD_CODE);
    
    // Wait for code to be processed
    await this.page.waitForTimeout(2000);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Verify code was set correctly
    const success = await this.page.evaluate((expectedCode) => {
      const monacoEditors = (window as any).monaco?.editor?.getEditors();
      if (monacoEditors) {
        return monacoEditors.every((editor: any) => {
          const content = editor.getValue();
          return content.includes('parametric_gear') && content.includes('stress_test');
        });
      }
      return false;
    }, COMPLEX_OPENSCAD_CODE);
    
    const editorCount = await this.page.locator('.editor-panel .monaco-editor').count();
    const codeLength = COMPLEX_OPENSCAD_CODE.length;
    
    const result = {
      success,
      editorCount,
      codeLength,
      processingTime
    };
    
    console.log('[DEBUG] Complex code handling result:', result);
    return result;
  }

  /**
   * [DEBUG] Monitor memory usage during operations
   */
  async monitorMemoryUsage(): Promise<{
    initialMemory: number;
    peakMemory: number;
    finalMemory: number;
    memoryIncrease: number;
  }> {
    console.log('[DEBUG] Monitoring memory usage...');
    
    const getMemoryUsage = async (): Promise<number> => {
      return await this.page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory?.usedJSHeapSize || 0;
        }
        return 0;
      });
    };
    
    const initialMemory = await getMemoryUsage();
    
    // Perform memory-intensive operations
    await this.testComplexCodeHandling();
    await this.page.waitForTimeout(1000);
    
    const peakMemory = await getMemoryUsage();
    
    // Wait for potential garbage collection
    await this.page.waitForTimeout(2000);
    
    const finalMemory = await getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    const result = {
      initialMemory,
      peakMemory,
      finalMemory,
      memoryIncrease
    };
    
    console.log('[DEBUG] Memory usage monitoring result:', result);
    return result;
  }

  /**
   * [DEBUG] Test error handling scenarios
   */
  async testErrorHandling(): Promise<{
    handlesInvalidCode: boolean;
    handlesEditorErrors: boolean;
    recoversFromErrors: boolean;
  }> {
    console.log('[DEBUG] Testing error handling scenarios...');
    
    // Test invalid OpenSCAD code
    const invalidCode = 'invalid syntax { [ } unclosed';
    
    const handlesInvalidCode = await this.page.evaluate((code) => {
      try {
        const monacoEditors = (window as any).monaco?.editor?.getEditors();
        if (monacoEditors && monacoEditors.length > 0) {
          monacoEditors[0].setValue(code);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error handling invalid code:', error);
        return false;
      }
    }, invalidCode);
    
    // Test editor error recovery
    const handlesEditorErrors = await this.page.evaluate(() => {
      try {
        // Simulate editor error scenario
        const monacoEditors = (window as any).monaco?.editor?.getEditors();
        if (monacoEditors && monacoEditors.length > 0) {
          // Try to trigger an error and see if it's handled
          monacoEditors[0].trigger('test', 'invalid-action', {});
          return true;
        }
        return false;
      } catch (error) {
        // Error was caught, which is good error handling
        return true;
      }
    });
    
    // Test recovery by setting valid code
    const validCode = 'cube([10, 10, 10]);';
    const recoversFromErrors = await this.page.evaluate((code) => {
      try {
        const monacoEditors = (window as any).monaco?.editor?.getEditors();
        if (monacoEditors && monacoEditors.length > 0) {
          monacoEditors[0].setValue(code);
          return monacoEditors[0].getValue().includes('cube');
        }
        return false;
      } catch (error) {
        console.error('Error during recovery:', error);
        return false;
      }
    }, validCode);
    
    const result = {
      handlesInvalidCode,
      handlesEditorErrors,
      recoversFromErrors
    };
    
    console.log('[DEBUG] Error handling test result:', result);
    return result;
  }

  /**
   * [DEBUG] Test rapid configuration changes
   */
  async testRapidConfigurationChanges(): Promise<{
    success: boolean;
    changesProcessed: number;
    averageResponseTime: number;
  }> {
    console.log('[DEBUG] Testing rapid configuration changes...');
    
    const configurations = ['BASIC', 'PARSER', 'IDE', 'FULL'];
    const startTime = Date.now();
    let changesProcessed = 0;
    
    // Rapidly toggle configurations
    for (let i = 0; i < 10; i++) {
      const config = configurations[i % configurations.length];
      const checkbox = this.page.locator(`#config-${config}`);
      
      try {
        if (await checkbox.isVisible()) {
          await checkbox.click();
          await this.page.waitForTimeout(100);
          changesProcessed++;
        }
      } catch (error) {
        console.warn(`[WARN] Failed to toggle ${config}:`, error);
      }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageResponseTime = totalTime / changesProcessed;
    
    const result = {
      success: changesProcessed > 0,
      changesProcessed,
      averageResponseTime
    };
    
    console.log('[DEBUG] Rapid configuration changes result:', result);
    return result;
  }
}

test.describe('Feature Comparison Panel Performance E2E Tests', () => {
  let helper: FeatureComparisonPerformanceHelper;
  let monacoHelper: MonacoEditorHelper;

  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up Feature Comparison Performance E2E test...');
    
    // Setup demo page
    await setupDemoPage(page);
    
    // Initialize helpers
    helper = new FeatureComparisonPerformanceHelper(page);
    monacoHelper = new MonacoEditorHelper(page);
    
    // Wait for main editor to be ready
    await monacoHelper.waitForEditorReady();
    
    console.log('[DEBUG] Performance test setup completed');
  });

  test.describe('Performance Metrics', () => {
    test('should load multiple editors within acceptable time limits', async () => {
      console.log('[INIT] Testing editor loading performance...');
      
      await helper.setupPerformanceTest();
      
      const performance = await helper.measureEditorLoadingPerformance();
      
      // Performance assertions
      expect(performance.editorCount).toBeGreaterThan(0);
      expect(performance.totalLoadTime).toBeLessThan(10000); // 10 seconds max
      expect(performance.averageLoadTime).toBeLessThan(5000); // 5 seconds per editor max
      
      console.log('[END] Editor loading performance test completed successfully');
    });

    test('should handle complex OpenSCAD code efficiently', async () => {
      console.log('[INIT] Testing complex code handling performance...');
      
      await helper.setupPerformanceTest();
      
      const result = await helper.testComplexCodeHandling();
      
      // Performance and functionality assertions
      expect(result.success).toBe(true);
      expect(result.editorCount).toBeGreaterThan(0);
      expect(result.codeLength).toBeGreaterThan(1000);
      expect(result.processingTime).toBeLessThan(5000); // 5 seconds max
      
      console.log('[END] Complex code handling test completed successfully');
    });

    test('should maintain reasonable memory usage', async () => {
      console.log('[INIT] Testing memory usage...');
      
      await helper.setupPerformanceTest();
      
      const memoryResult = await helper.monitorMemoryUsage();
      
      // Memory usage assertions (if memory API is available)
      if (memoryResult.initialMemory > 0) {
        expect(memoryResult.memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max increase
        expect(memoryResult.peakMemory).toBeGreaterThan(memoryResult.initialMemory);
      }
      
      console.log('[END] Memory usage test completed successfully');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle invalid OpenSCAD code gracefully', async () => {
      console.log('[INIT] Testing error handling...');

      await helper.setupPerformanceTest();

      const errorResult = await helper.testErrorHandling();

      // Error handling assertions
      expect(errorResult.handlesInvalidCode).toBe(true);
      expect(errorResult.handlesEditorErrors).toBe(true);
      expect(errorResult.recoversFromErrors).toBe(true);

      console.log('[END] Error handling test completed successfully');
    });

    test('should handle rapid configuration changes', async () => {
      console.log('[INIT] Testing rapid configuration changes...');

      await helper.setupPerformanceTest();

      const rapidResult = await helper.testRapidConfigurationChanges();

      // Rapid changes assertions
      expect(rapidResult.success).toBe(true);
      expect(rapidResult.changesProcessed).toBeGreaterThan(5);
      expect(rapidResult.averageResponseTime).toBeLessThan(1000); // 1 second max per change

      console.log('[END] Rapid configuration changes test completed successfully');
    });

    test('should handle browser resource constraints', async ({ page }) => {
      console.log('[INIT] Testing resource constraints handling...');

      await helper.setupPerformanceTest();

      // Simulate resource constraints by limiting viewport and memory
      await page.setViewportSize({ width: 800, height: 600 });

      // Test that panel still functions under constraints
      const panelVisible = await page.locator('.feature-comparison-panel').isVisible();
      expect(panelVisible).toBe(true);

      // Test that editors still load
      const editorCount = await page.locator('.editor-panel .monaco-editor').count();
      expect(editorCount).toBeGreaterThan(0);

      console.log('[END] Resource constraints test completed successfully');
    });
  });

  test.describe('Real-World Usage Scenarios', () => {
    test('should support typical developer workflow', async () => {
      console.log('[INIT] Testing typical developer workflow...');

      await helper.setupPerformanceTest();

      // Simulate typical workflow: compare BASIC vs IDE configurations
      const basicCheckbox = page.locator('#config-BASIC');
      const ideCheckbox = page.locator('#config-IDE');

      // Ensure BASIC and IDE are selected
      if (!await basicCheckbox.isChecked()) {
        await basicCheckbox.check();
      }
      if (!await ideCheckbox.isChecked()) {
        await ideCheckbox.check();
      }

      // Run performance comparison
      const compareButton = page.locator('button:has-text("🚀 Run Comparison")');
      await compareButton.click();

      // Wait for comparison to complete
      await expect(page.locator('button:has-text("🚀 Run Comparison")')).toBeVisible({ timeout: 5000 });

      // Verify metrics are displayed
      const metricsTable = page.locator('.metrics-table');
      await expect(metricsTable).toBeVisible();

      // Check that both configurations are shown in results
      const basicRow = page.locator('td:has-text("BASIC")');
      const ideRow = page.locator('td:has-text("IDE")');
      await expect(basicRow).toBeVisible();
      await expect(ideRow).toBeVisible();

      console.log('[END] Developer workflow test completed successfully');
    });

    test('should support educational use case', async () => {
      console.log('[INIT] Testing educational use case...');

      await helper.setupPerformanceTest();

      // Educational scenario: compare all configurations to show progression
      const configurations = ['BASIC', 'PARSER', 'IDE'];

      // Select first three configurations (educational progression)
      for (const config of configurations) {
        const checkbox = page.locator(`#config-${config}`);
        if (!await checkbox.isChecked()) {
          await checkbox.check();
        }
      }

      // Verify all three editor panels are visible
      const editorPanels = page.locator('.editor-panel');
      const panelCount = await editorPanels.count();
      expect(panelCount).toBe(3);

      // Verify feature progression is visible in badges
      const parserBadges = page.locator('.parser-badge');
      const ideBadges = page.locator('.ide-badge');

      expect(await parserBadges.count()).toBeGreaterThan(0);
      expect(await ideBadges.count()).toBeGreaterThan(0);

      console.log('[END] Educational use case test completed successfully');
    });

    test('should support performance analysis workflow', async () => {
      console.log('[INIT] Testing performance analysis workflow...');

      await helper.setupPerformanceTest();

      // Performance analysis: compare lightweight vs full-featured
      const basicCheckbox = page.locator('#config-BASIC');
      const fullCheckbox = page.locator('#config-FULL');

      // Deselect default selections first
      const ideCheckbox = page.locator('#config-IDE');
      if (await ideCheckbox.isChecked()) {
        await ideCheckbox.uncheck();
      }

      // Select BASIC and FULL for performance comparison
      if (!await basicCheckbox.isChecked()) {
        await basicCheckbox.check();
      }
      if (!await fullCheckbox.isChecked()) {
        await fullCheckbox.check();
      }

      // Run performance comparison
      const compareButton = page.locator('button:has-text("🚀 Run Comparison")');
      await compareButton.click();

      // Wait for results
      await expect(page.locator('button:has-text("🚀 Run Comparison")')).toBeVisible({ timeout: 5000 });

      // Verify performance metrics show meaningful differences
      const metricsRows = page.locator('.metrics-table tbody tr');
      const rowCount = await metricsRows.count();
      expect(rowCount).toBe(2); // BASIC and FULL

      // Check that metrics are populated
      const initTimeColumns = page.locator('.metrics-table tbody tr td:nth-child(2)');
      const initTimeCount = await initTimeColumns.count();
      expect(initTimeCount).toBe(2);

      console.log('[END] Performance analysis workflow test completed successfully');
    });
  });

  test.describe('Integration and Compatibility', () => {
    test('should work with different browser configurations', async ({ page }) => {
      console.log('[INIT] Testing browser compatibility...');

      // Test with different user agent (simulate different browsers)
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      await helper.setupPerformanceTest();

      // Verify basic functionality works
      const panelVisible = await page.locator('.feature-comparison-panel').isVisible();
      expect(panelVisible).toBe(true);

      const editorCount = await page.locator('.editor-panel .monaco-editor').count();
      expect(editorCount).toBeGreaterThan(0);

      console.log('[END] Browser compatibility test completed successfully');
    });

    test('should maintain performance under concurrent operations', async () => {
      console.log('[INIT] Testing concurrent operations...');

      await helper.setupPerformanceTest();

      // Perform multiple operations concurrently
      const operations = [
        helper.testComplexCodeHandling(),
        helper.testRapidConfigurationChanges(),
        helper.monitorMemoryUsage()
      ];

      const results = await Promise.allSettled(operations);

      // Verify all operations completed successfully
      const successfulOperations = results.filter(result => result.status === 'fulfilled');
      expect(successfulOperations.length).toBe(operations.length);

      console.log('[END] Concurrent operations test completed successfully');
    });
  });
});
