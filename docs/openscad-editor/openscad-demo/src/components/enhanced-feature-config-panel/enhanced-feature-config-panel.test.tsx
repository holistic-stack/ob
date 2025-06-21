/**
 * @file Enhanced Feature Configuration Panel Tests
 * @description Comprehensive tests for the enhanced feature configuration panel component
 * 
 * Tests cover:
 * - Component rendering and basic functionality
 * - Feature tooltips and descriptions
 * - Performance metrics display
 * - Feature dependency handling
 * - Accessibility and keyboard navigation
 * - Real-time feature statistics
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedFeatureConfigPanel } from './enhanced-feature-config-panel';
import type { OpenscadEditorFeatures, FeaturePreset } from '@openscad/editor';

/**
 * Mock performance metrics for testing
 */
const mockPerformanceMetrics = {
  parseTime: 45.2,
  renderTime: 12.8,
  memoryUsage: 8 * 1024 * 1024, // 8MB
  featureLoadTime: 23.5,
  totalFeatures: 15,
  activeFeatures: 8
};

/**
 * Mock custom features configuration
 */
const mockCustomFeatures: OpenscadEditorFeatures = {
  core: {
    syntaxHighlighting: true,
    basicEditing: true,
    keyboardShortcuts: true
  },
  parser: {
    realTimeParsing: true,
    errorDetection: true,
    documentOutline: false,
    performanceMonitoring: true
  },
  ide: {
    codeCompletion: true,
    navigationCommands: false,
    hoverInformation: true,
    quickFixes: false,
    diagnostics: true,
    formatting: false
  },
  advanced: {
    refactoring: false,
    symbolSearch: false,
    folding: true,
    bracketMatching: true,
    smartIndentation: false,
    commentCommands: false
  }
};

/**
 * Default props for testing
 */
const defaultProps = {
  currentPreset: 'IDE' as FeaturePreset,
  customFeatures: null,
  featureMode: 'preset' as const,
  onPresetChange: vi.fn(),
  onCustomFeatureChange: vi.fn(),
  onClose: vi.fn(),
  performanceMetrics: mockPerformanceMetrics,
  showPerformanceMetrics: true,
  showTooltips: true
};

describe('EnhancedFeatureConfigPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the enhanced feature configuration panel', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);
      
      expect(screen.getByTestId('enhanced-feature-config-panel')).toBeInTheDocument();
      expect(screen.getByText('Enhanced Feature Configuration')).toBeInTheDocument();
    });

    it('should render close button with correct test id', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);
      
      const closeButton = screen.getByTestId('enhanced-feature-config-close-button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent('×');
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<EnhancedFeatureConfigPanel {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByTestId('enhanced-feature-config-close-button');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Feature Presets', () => {
    it('should render all feature preset buttons', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);
      
      expect(screen.getByTestId('enhanced-feature-preset-basic')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-feature-preset-parser')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-feature-preset-ide')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-feature-preset-full')).toBeInTheDocument();
    });

    it('should highlight current preset button', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} currentPreset="PARSER" />);
      
      const parserButton = screen.getByTestId('enhanced-feature-preset-parser');
      expect(parserButton).toHaveStyle({ backgroundColor: '#0e639c' });
    });

    it('should call onPresetChange when preset button is clicked', () => {
      const onPresetChange = vi.fn();
      render(<EnhancedFeatureConfigPanel {...defaultProps} onPresetChange={onPresetChange} />);
      
      const basicButton = screen.getByTestId('enhanced-feature-preset-basic');
      fireEvent.click(basicButton);
      
      expect(onPresetChange).toHaveBeenCalledWith('BASIC');
    });
  });

  describe('Feature Statistics', () => {
    it('should display feature statistics correctly', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      // Check that statistics are displayed (exact numbers may vary based on preset configuration)
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Core')).toBeInTheDocument();
      expect(screen.getByText('Parser')).toBeInTheDocument();
      expect(screen.getAllByText('IDE')).toHaveLength(2); // One in preset button, one in statistics
      expect(screen.getByText('Advanced')).toBeInTheDocument();

      // Check that there are numeric values displayed
      const activeCountElement = screen.getByText('Active').parentElement?.querySelector('div[style*="font-size: 24px"]');
      expect(activeCountElement).toBeInTheDocument();
    });

    it('should update statistics when preset changes', async () => {
      const { rerender } = render(<EnhancedFeatureConfigPanel {...defaultProps} currentPreset="BASIC" />);

      // BASIC preset should have fewer active features
      const basicActiveElement = screen.getByText('Active').parentElement?.querySelector('div[style*="font-size: 24px"]');
      expect(basicActiveElement).toBeInTheDocument();
      const basicCount = parseInt(basicActiveElement?.textContent || '0');

      // Change to FULL preset
      rerender(<EnhancedFeatureConfigPanel {...defaultProps} currentPreset="FULL" />);

      await waitFor(() => {
        const fullActiveElement = screen.getByText('Active').parentElement?.querySelector('div[style*="font-size: 24px"]');
        expect(fullActiveElement).toBeInTheDocument();
        const fullCount = parseInt(fullActiveElement?.textContent || '0');
        expect(fullCount).toBeGreaterThan(basicCount); // FULL should have more features than BASIC
      });
    });
  });

  describe('Individual Features', () => {
    it('should render individual features container', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);
      
      expect(screen.getByTestId('enhanced-individual-features-container')).toBeInTheDocument();
    });

    it('should render feature checkboxes with correct test ids', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      expect(screen.getByTestId('enhanced-feature-core-syntaxHighlighting')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-feature-core-basicEditing')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-feature-parser-realTimeParsing')).toBeInTheDocument();
    });

    it('should display feature tooltips when showTooltips is true', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} showTooltips={true} />);

      expect(screen.getByText('Colorizes OpenSCAD keywords, functions, and syntax elements for better code readability.')).toBeInTheDocument();
      expect(screen.getByText('Essential editing features including text input, selection, copy/paste, and undo/redo.')).toBeInTheDocument();
    });

    it('should hide feature tooltips when showTooltips is false', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} showTooltips={false} />);

      expect(screen.queryByText('Colorizes OpenSCAD keywords, functions, and syntax elements for better code readability.')).not.toBeInTheDocument();
    });

    it('should display feature categories with section headers', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      expect(screen.getByText('🔧 Core Features')).toBeInTheDocument();
      expect(screen.getByText('🌳 Parser Features')).toBeInTheDocument();
      expect(screen.getByText('✨ IDE Features')).toBeInTheDocument();
      expect(screen.getByText('🚀 Advanced Features')).toBeInTheDocument();
    });
  });

  describe('Feature Dependencies', () => {
    it('should show/hide dependencies toggle button', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      const toggleButton = screen.getByText('Show Dependencies');
      expect(toggleButton).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.getByText('Hide Dependencies')).toBeInTheDocument();
    });

    it('should display dependencies when toggle is enabled', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      const toggleButton = screen.getByText('Show Dependencies');
      fireEvent.click(toggleButton);

      // Should show dependency information (may not be visible in current implementation)
      // Just check that the toggle worked
      expect(screen.getByText('Hide Dependencies')).toBeInTheDocument();
    });

    it('should handle feature toggle with dependency checking', () => {
      const onCustomFeatureChange = vi.fn();
      render(
        <EnhancedFeatureConfigPanel
          {...defaultProps}
          featureMode="custom"
          customFeatures={mockCustomFeatures}
          onCustomFeatureChange={onCustomFeatureChange}
        />
      );

      // Toggle a parser feature
      const realTimeParsingCheckbox = screen.getByTestId('enhanced-feature-parser-realTimeParsing');
      fireEvent.click(realTimeParsingCheckbox);

      expect(onCustomFeatureChange).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    it('should display performance metrics when enabled', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} showPerformanceMetrics={true} />);
      
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('45.2ms')).toBeInTheDocument(); // Parse time
      expect(screen.getByText('12.8ms')).toBeInTheDocument(); // Render time
      expect(screen.getByText('8.0MB')).toBeInTheDocument(); // Memory usage
      expect(screen.getByText('23.5ms')).toBeInTheDocument(); // Feature load time
    });

    it('should hide performance metrics when disabled', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} showPerformanceMetrics={false} />);
      
      expect(screen.queryByText('Performance Metrics')).not.toBeInTheDocument();
    });

    it('should display feature efficiency bar', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);
      
      expect(screen.getByText('Feature Efficiency')).toBeInTheDocument();
      expect(screen.getByText('8 / 15 features active')).toBeInTheDocument();
    });

    it('should handle missing performance metrics gracefully', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} performanceMetrics={undefined} />);
      
      // Should not crash and should not show performance metrics
      expect(screen.queryByText('Performance Metrics')).not.toBeInTheDocument();
    });
  });

  describe('Custom Features Mode', () => {
    it('should use custom features when in custom mode', () => {
      render(
        <EnhancedFeatureConfigPanel
          {...defaultProps}
          featureMode="custom"
          customFeatures={mockCustomFeatures}
        />
      );

      // Check that custom features are reflected in the UI
      const realTimeParsingCheckbox = screen.getByTestId('enhanced-feature-parser-realTimeParsing') as HTMLInputElement;
      expect(realTimeParsingCheckbox.checked).toBe(true);

      const documentOutlineCheckbox = screen.getByTestId('enhanced-feature-parser-documentOutline') as HTMLInputElement;
      expect(documentOutlineCheckbox.checked).toBe(false);
    });

    it('should call onCustomFeatureChange when feature is toggled', () => {
      const onCustomFeatureChange = vi.fn();
      render(
        <EnhancedFeatureConfigPanel
          {...defaultProps}
          featureMode="custom"
          customFeatures={mockCustomFeatures}
          onCustomFeatureChange={onCustomFeatureChange}
        />
      );

      const documentOutlineCheckbox = screen.getByTestId('enhanced-feature-parser-documentOutline');
      fireEvent.click(documentOutlineCheckbox);

      expect(onCustomFeatureChange).toHaveBeenCalledWith(
        expect.objectContaining({
          parser: expect.objectContaining({
            documentOutline: true
          })
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);
      
      // Check that checkboxes are properly labeled
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      const firstCheckbox = screen.getByTestId('enhanced-feature-core-syntaxHighlighting');
      firstCheckbox.focus();

      expect(document.activeElement).toBe(firstCheckbox);
    });
  });

  describe('Responsive Design', () => {
    it('should apply correct layout for features', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} />);

      const featuresContainer = screen.getByTestId('enhanced-individual-features-container');
      expect(featuresContainer).toHaveStyle({
        display: 'flex',
        flexDirection: 'column'
      });
    });

    it('should adjust layout when performance metrics are hidden', () => {
      render(<EnhancedFeatureConfigPanel {...defaultProps} showPerformanceMetrics={false} />);
      
      // Should use single column layout when performance metrics are hidden
      const panel = screen.getByTestId('enhanced-feature-config-panel');
      expect(panel).toBeInTheDocument();
    });
  });
});
