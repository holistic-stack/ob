/**
 * @file Visual Test Canvas Component Tests
 * 
 * Unit tests for the VisualTestCanvas component
 * Focuses on component lifecycle, props handling, and integration points
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VisualTestCanvas } from './visual-test-canvas';

// Mock the Babylon.js hooks
vi.mock('../../hooks/use-babylon-engine/use-babylon-engine', () => ({
  useBabylonEngine: vi.fn(() => ({
    engine: null,
    isReady: false,
    error: null,
    dispose: vi.fn()
  }))
}));

vi.mock('../../hooks/use-babylon-scene/use-babylon-scene', () => ({
  useBabylonScene: vi.fn(() => ({
    scene: null,
    isReady: false,
    render: vi.fn(),
    dispose: vi.fn()
  }))
}));

describe('VisualTestCanvas', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render canvas element with correct attributes', () => {
      render(
        <VisualTestCanvas
          testName="test-scenario"
          width={800}
          height={600}
        />
      );

      const canvas = screen.getByTestId('visual-test-canvas-test-scenario');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('visual-test-canvas');
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
      expect(canvas).toHaveAttribute('aria-label', 'Visual test canvas for test-scenario');
    });

    it('should use default dimensions when not specified', () => {
      render(<VisualTestCanvas testName="default-test" />);

      const canvas = screen.getByTestId('visual-test-canvas-default-test');
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('should use default test name when not specified', () => {
      render(<VisualTestCanvas />);

      const canvas = screen.getByTestId('visual-test-canvas-visual-test');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('aria-label', 'Visual test canvas for visual-test');
    });
  });

  describe('Props Handling', () => {
    it('should pass through canvas props correctly', () => {
      render(
        <VisualTestCanvas
          testName="props-test"
          id="custom-canvas-id"
          style={{ border: '1px solid red' }}
        />
      );

      const canvas = screen.getByTestId('visual-test-canvas-props-test');
      expect(canvas).toHaveAttribute('id', 'custom-canvas-id');
      expect(canvas).toHaveStyle({ border: '1px solid red' });
    });

    it('should handle OpenSCAD code prop', () => {
      const openscadCode = 'cube([10, 10, 10]);';

      render(
        <VisualTestCanvas
          testName="openscad-test"
          openscadCode={openscadCode}
        />
      );

      const canvas = screen.getByTestId('visual-test-canvas-openscad-test');
      expect(canvas).toBeInTheDocument();

      // Verify that the component was initialized with OpenSCAD code
      // (actual processing will be tested in integration tests)
    });

    it('should handle debug logging configuration', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(
        <VisualTestCanvas
          testName="debug-test"
          enableDebugLogging={true}
        />
      );

      // Should have logged initialization message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[VISUAL-TEST:debug-test] [INIT] Initializing VisualTestCanvas component')
      );
    });

    it('should not log when debug logging is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(
        <VisualTestCanvas
          testName="no-debug-test"
          enableDebugLogging={false}
        />
      );

      // Should not have logged any debug messages
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[VISUAL-TEST:no-debug-test]')
      );
    });
  });

  describe('Configuration Merging', () => {
    it('should merge scene configuration correctly', () => {
      const customSceneConfig = {
        enableCamera: false,
        backgroundColor: '#ff0000'
      };

      render(
        <VisualTestCanvas
          testName="scene-config-test"
          sceneConfig={customSceneConfig}
        />
      );

      // Component should render without errors
      const canvas = screen.getByTestId('visual-test-canvas-scene-config-test');
      expect(canvas).toBeInTheDocument();
    });

    it('should merge engine configuration correctly', () => {
      const customEngineConfig = {
        antialias: false,
        powerPreference: 'low-power' as const
      };

      render(
        <VisualTestCanvas
          testName="engine-config-test"
          engineConfig={customEngineConfig}
        />
      );

      // Component should render without errors
      const canvas = screen.getByTestId('visual-test-canvas-engine-config-test');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <VisualTestCanvas
          testName="accessibility-test"
        />
      );

      const canvas = screen.getByTestId('visual-test-canvas-accessibility-test');
      expect(canvas).toHaveAttribute('aria-label', 'Visual test canvas for accessibility-test');
    });

    it('should be keyboard accessible', () => {
      render(
        <VisualTestCanvas
          testName="keyboard-test"
        />
      );

      const canvas = screen.getByTestId('visual-test-canvas-keyboard-test');
      expect(canvas).toBeInTheDocument();

      // Canvas should be focusable for keyboard navigation
      canvas.focus();
      expect(document.activeElement).toBe(canvas);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing OpenSCAD code gracefully', () => {
      expect(() => {
        render(
          <VisualTestCanvas
            testName="no-code-test"
            openscadCode=""
          />
        );
      }).not.toThrow();

      const canvas = screen.getByTestId('visual-test-canvas-no-code-test');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle invalid dimensions gracefully', () => {
      expect(() => {
        render(
          <VisualTestCanvas
            testName="invalid-dimensions-test"
            width={0}
            height={-100}
          />
        );
      }).not.toThrow();

      const canvas = screen.getByTestId('visual-test-canvas-invalid-dimensions-test');
      expect(canvas).toBeInTheDocument();
    });
  });
});
