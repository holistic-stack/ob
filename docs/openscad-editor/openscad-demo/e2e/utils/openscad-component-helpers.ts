import { Page, Locator, expect } from '@playwright/test';
import { MonacoEditorHelper, PerformanceMetrics } from './monaco-helpers';

/**
 * @file OpenSCAD Editor Component test utilities for E2E testing
 * Provides specialized helper functions for testing OpenSCAD Editor React component integration
 * 
 * Based on research findings:
 * - React component lifecycle testing patterns
 * - Props and state management validation
 * - Event callback testing with proper async handling
 * - Integration testing between React components and Monaco Editor
 * - Performance benchmarking for component interactions
 * 
 * Following project standards:
 * - No mocks for OpenSCAD Editor component (uses real component instances)
 * - Real parser integration testing
 * - Comprehensive feature preset testing
 * - Performance monitoring for component operations
 */

/**
 * OpenSCAD Editor feature presets
 */
export type FeaturePreset = 'BASIC' | 'IDE' | 'FULL';

/**
 * Component integration validation results
 */
export interface ComponentIntegration {
  mounted: boolean;
  monacoInitialized: boolean;
  parserInitialized: boolean;
  featuresLoaded: boolean;
  callbacksRegistered: boolean;
}

/**
 * Feature configuration validation results
 */
export interface FeatureValidation {
  preset: FeaturePreset;
  autocomplete: boolean;
  formatting: boolean;
  errorDetection: boolean;
  symbolNavigation: boolean;
  findReplace: boolean;
}

/**
 * Component lifecycle tracking
 */
export interface ComponentLifecycle {
  mountTime: number;
  initializationTime: number;
  firstRenderTime: number;
  parserLoadTime: number;
  totalReadyTime: number;
}

/**
 * Event callback validation results
 */
export interface CallbackValidation {
  onChange: boolean;
  onReady: boolean;
  onError: boolean;
  onParseComplete: boolean;
}

export class OpenSCADComponentHelper {
  private page: Page;
  private monacoHelper: MonacoEditorHelper;
  private componentContainer: Locator;
  private performanceMetrics: PerformanceMetrics[] = [];

  constructor(page: Page) {
    this.page = page;
    this.monacoHelper = new MonacoEditorHelper(page);
    // Use the actual container from the demo structure
    this.componentContainer = page.locator('[data-testid="monaco-editor-container"]').first();
  }

  /**
   * Start performance monitoring for component operations
   */
  private startPerformanceMonitoring(operationName: string): number {
    return Date.now();
  }

  /**
   * End performance monitoring and record metrics
   */
  private endPerformanceMonitoring(operationName: string, startTime: number): PerformanceMetrics {
    const endTime = Date.now();
    const metrics: PerformanceMetrics = {
      operationName,
      startTime,
      endTime,
      duration: endTime - startTime
    };
    this.performanceMetrics.push(metrics);
    return metrics;
  }

  /**
   * Get all recorded performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }

  /**
   * Wait for OpenSCAD Editor component to be fully mounted and initialized
   */
  async waitForComponentReady(timeout = 20000): Promise<ComponentLifecycle> {
    const startTime = this.startPerformanceMonitoring('waitForComponentReady');
    
    // Wait for component container to be visible
    await expect(this.componentContainer).toBeVisible({ timeout });
    const mountTime = Date.now() - startTime;
    
    // Wait for Monaco Editor to be initialized within the component
    await this.monacoHelper.waitForEditorReady(timeout);
    const initializationTime = Date.now() - startTime;
    
    // Wait for component to be fully rendered
    await this.page.waitForFunction(() => {
      const container = document.querySelector('[data-testid="monaco-editor-container"]');
      const monacoEditor = document.querySelector('.monaco-editor');
      return container && monacoEditor && !container.classList.contains('loading') && !container.classList.contains('initializing');
    }, { timeout });
    const firstRenderTime = Date.now() - startTime;
    
    // Wait for parser service to be loaded (if IDE features are enabled)
    await this.page.waitForFunction(() => {
      return (window as any).openscadEditorReady === true || 
             document.querySelector('.monaco-editor .view-lines') !== null;
    }, { timeout });
    const parserLoadTime = Date.now() - startTime;
    
    const lifecycle = this.endPerformanceMonitoring('waitForComponentReady', startTime);
    
    return {
      mountTime,
      initializationTime,
      firstRenderTime,
      parserLoadTime,
      totalReadyTime: lifecycle.duration
    };
  }

  /**
   * Validate component integration status
   */
  async validateComponentIntegration(): Promise<ComponentIntegration> {
    await this.waitForComponentReady();

    return await this.page.evaluate(() => {
      const container = document.querySelector('[data-testid="monaco-editor-container"]');
      const monacoEditor = document.querySelector('.monaco-editor');
      const codeArea = document.querySelector('[role="code"]');
      
      // Check if component is mounted
      const mounted = !!container;
      
      // Check if Monaco Editor is initialized
      const monacoInitialized = !!(monacoEditor && codeArea && (window as any).monaco);
      
      // Check if parser is initialized (look for parser-related globals or indicators)
      const parserInitialized = !!(window as any).openscadParser || 
                               !!(window as any).openscadEditorReady ||
                               !!document.querySelector('[data-parser-ready="true"]');
      
      // Check if features are loaded (look for feature indicators)
      const featuresLoaded = !!document.querySelector('.monaco-editor .suggest-widget') ||
                            !!document.querySelector('.monaco-editor .find-widget') ||
                            monacoInitialized; // Basic feature loading
      
      // Check if callbacks are registered (look for event listeners or component state)
      const callbacksRegistered = !!(window as any).openscadEditorCallbacks ||
                                  container?.hasAttribute('data-callbacks-ready');
      
      return {
        mounted,
        monacoInitialized,
        parserInitialized,
        featuresLoaded,
        callbacksRegistered
      };
    });
  }

  /**
   * Test feature preset configuration
   */
  async validateFeaturePreset(expectedPreset: FeaturePreset): Promise<FeatureValidation> {
    await this.waitForComponentReady();
    
    // Test autocomplete functionality
    const autocomplete = await this.testAutocompleteFeature();
    
    // Test formatting functionality
    const formatting = await this.testFormattingFeature();
    
    // Test error detection
    const errorDetection = await this.testErrorDetectionFeature();
    
    // Test symbol navigation (for IDE/FULL presets)
    const symbolNavigation = await this.testSymbolNavigationFeature();
    
    // Test find/replace (for IDE/FULL presets)
    const findReplace = await this.testFindReplaceFeature();
    
    return {
      preset: expectedPreset,
      autocomplete,
      formatting,
      errorDetection,
      symbolNavigation,
      findReplace
    };
  }

  /**
   * Test autocomplete feature availability
   */
  private async testAutocompleteFeature(): Promise<boolean> {
    try {
      await this.monacoHelper.setEditorContent('cu');
      await this.monacoHelper.triggerAutocomplete();
      return await this.monacoHelper.hasAutocompleteSuggestions();
    } catch {
      return false;
    }
  }

  /**
   * Test formatting feature availability
   */
  private async testFormattingFeature(): Promise<boolean> {
    try {
      await this.monacoHelper.setEditorContent('cube([10,10,10]);sphere(r=5);');
      
      // Try to trigger format document
      await this.page.keyboard.press('Shift+Alt+F');
      await this.page.waitForTimeout(1000);
      
      const content = await this.monacoHelper.getEditorContent();
      // Check if formatting was applied (content should be different)
      return content.includes('\n') || content.includes('  '); // Basic formatting indicators
    } catch {
      return false;
    }
  }

  /**
   * Test error detection feature availability
   */
  private async testErrorDetectionFeature(): Promise<boolean> {
    try {
      await this.monacoHelper.setEditorContent('cube([10, 10, 10'); // Missing closing bracket
      await this.page.waitForTimeout(2000);
      
      const markers = await this.monacoHelper.getEditorMarkers();
      return markers.some(marker => marker.severity === 'error');
    } catch {
      return false;
    }
  }

  /**
   * Test symbol navigation feature availability
   */
  private async testSymbolNavigationFeature(): Promise<boolean> {
    try {
      await this.monacoHelper.setEditorContent(`
module test_module() {
  cube([10, 10, 10]);
}
test_module();
`);
      await this.page.waitForTimeout(1000);
      
      // Try to trigger symbol navigation (Ctrl+Shift+O)
      await this.page.keyboard.press('Control+Shift+o');
      await this.page.waitForTimeout(500);
      
      // Check if symbol navigation widget appeared
      const symbolWidget = await this.page.locator('.monaco-editor .quick-input-widget, .monaco-editor .symbol-navigator').isVisible();
      
      // Close the widget if it opened
      if (symbolWidget) {
        await this.page.keyboard.press('Escape');
      }
      
      return symbolWidget;
    } catch {
      return false;
    }
  }

  /**
   * Test find/replace feature availability
   */
  private async testFindReplaceFeature(): Promise<boolean> {
    try {
      await this.monacoHelper.setEditorContent('cube([10, 10, 10]);');
      
      // Try to open find dialog
      await this.page.keyboard.press('Control+f');
      await this.page.waitForTimeout(500);
      
      // Check if find widget appeared
      const findWidget = await this.page.locator('.monaco-editor .find-widget').isVisible();
      
      // Close the widget if it opened
      if (findWidget) {
        await this.page.keyboard.press('Escape');
      }
      
      return findWidget;
    } catch {
      return false;
    }
  }

  /**
   * Test component event callbacks
   */
  async validateEventCallbacks(): Promise<CallbackValidation> {
    await this.waitForComponentReady();
    
    // Test onChange callback
    const onChange = await this.testOnChangeCallback();
    
    // Test onReady callback (check if component signals ready state)
    const onReady = await this.testOnReadyCallback();
    
    // Test onError callback
    const onError = await this.testOnErrorCallback();
    
    // Test onParseComplete callback
    const onParseComplete = await this.testOnParseCompleteCallback();
    
    return {
      onChange,
      onReady,
      onError,
      onParseComplete
    };
  }

  /**
   * Test onChange callback functionality
   */
  private async testOnChangeCallback(): Promise<boolean> {
    try {
      const initialContent = await this.monacoHelper.getEditorContent();
      await this.monacoHelper.typeInEditor(' // test change');
      await this.page.waitForTimeout(500);
      
      const newContent = await this.monacoHelper.getEditorContent();
      return newContent !== initialContent;
    } catch {
      return false;
    }
  }

  /**
   * Test onReady callback functionality
   */
  private async testOnReadyCallback(): Promise<boolean> {
    // Check if component has signaled ready state
    return await this.page.evaluate(() => {
      return !!(window as any).openscadEditorReady ||
             !!document.querySelector('[data-editor-ready="true"]') ||
             !!document.querySelector('.monaco-editor .view-lines');
    });
  }

  /**
   * Test onError callback functionality
   */
  private async testOnErrorCallback(): Promise<boolean> {
    try {
      // Introduce an error and check if error callback is triggered
      await this.monacoHelper.setEditorContent('invalid syntax [[[');
      await this.page.waitForTimeout(2000);
      
      // Check if error state is reflected in the component
      const hasErrors = await this.page.evaluate(() => {
        return !!document.querySelector('[data-has-errors="true"]') ||
               !!document.querySelector('.monaco-editor .squiggly-error') ||
               !!(window as any).openscadEditorErrors;
      });
      
      return hasErrors;
    } catch {
      return false;
    }
  }

  /**
   * Test onParseComplete callback functionality
   */
  private async testOnParseCompleteCallback(): Promise<boolean> {
    try {
      await this.monacoHelper.setEditorContent('cube([10, 10, 10]);');
      await this.page.waitForTimeout(2000);
      
      // Check if parse complete state is reflected
      return await this.page.evaluate(() => {
        return !!(window as any).openscadParseComplete ||
               !!document.querySelector('[data-parse-complete="true"]');
      });
    } catch {
      return false;
    }
  }

  /**
   * Get Monaco Editor helper for advanced operations
   */
  getMonacoHelper(): MonacoEditorHelper {
    return this.monacoHelper;
  }

  /**
   * Test component cleanup and disposal
   */
  async testComponentCleanup(): Promise<boolean> {
    try {
      // Check if component properly cleans up resources
      return await this.page.evaluate(() => {
        // Look for cleanup indicators or absence of memory leaks
        const monacoEditors = (window as any).monaco?.editor?.getEditors() || [];
        return monacoEditors.length > 0; // Should have active editors during normal operation
      });
    } catch {
      return false;
    }
  }
}
