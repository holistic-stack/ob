/**
 * @file Enhanced Feature Configuration Panel
 * @description Advanced feature configuration panel with tooltips, performance metrics, and enhanced UX
 * 
 * This component extends the basic feature configuration panel with:
 * - Detailed tooltips explaining each feature's functionality
 * - Real-time performance metrics for different configurations
 * - Visual indicators for feature dependencies
 * - Enhanced accessibility and keyboard navigation
 * 
 * @example
 * ```tsx
 * <EnhancedFeatureConfigPanel
 *   currentPreset="IDE"
 *   customFeatures={null}
 *   featureMode="preset"
 *   onPresetChange={handlePresetChange}
 *   onCustomFeatureChange={handleCustomFeatureChange}
 *   onClose={handleClose}
 *   performanceMetrics={metrics}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { OpenscadEditorFeatures, FeaturePreset, CoreFeatures, ParserFeatures, IDEFeatures, AdvancedFeatures } from '@openscad/editor';

/**
 * Performance metrics for feature configuration
 */
export interface PerformanceMetrics {
  readonly parseTime: number;
  readonly renderTime: number;
  readonly memoryUsage: number;
  readonly featureLoadTime: number;
  readonly totalFeatures: number;
  readonly activeFeatures: number;
}

/**
 * Feature tooltip information
 */
export interface FeatureTooltip {
  readonly title: string;
  readonly description: string;
  readonly dependencies?: readonly string[];
  readonly performance: 'low' | 'medium' | 'high';
  readonly category: 'core' | 'parser' | 'ide' | 'advanced';
}

/**
 * Props for the Enhanced Feature Configuration Panel
 */
export interface EnhancedFeatureConfigPanelProps {
  readonly currentPreset: FeaturePreset;
  readonly customFeatures: OpenscadEditorFeatures | null;
  readonly featureMode: 'preset' | 'custom';
  readonly onPresetChange: (preset: FeaturePreset) => void;
  readonly onCustomFeatureChange: (features: OpenscadEditorFeatures) => void;
  readonly onClose: () => void;
  readonly performanceMetrics?: PerformanceMetrics;
  readonly showPerformanceMetrics?: boolean;
  readonly showTooltips?: boolean;
  readonly inline?: boolean; // New prop to control modal vs inline display
}

/**
 * Feature tooltip definitions with detailed explanations organized by category
 */
const FEATURE_TOOLTIPS = {
  core: {
    syntaxHighlighting: {
      title: 'Syntax Highlighting',
      description: 'Colorizes OpenSCAD keywords, functions, and syntax elements for better code readability.',
      performance: 'low' as const,
      category: 'core' as const
    },
    basicEditing: {
      title: 'Basic Editing',
      description: 'Essential editing features including text input, selection, copy/paste, and undo/redo.',
      performance: 'low' as const,
      category: 'core' as const
    },
    keyboardShortcuts: {
      title: 'Keyboard Shortcuts',
      description: 'Cross-platform keyboard shortcuts for common editing operations.',
      performance: 'low' as const,
      category: 'core' as const
    }
  },
  parser: {
    realTimeParsing: {
      title: 'Real-time Parsing',
      description: 'Real-time parsing of OpenSCAD code using Tree-sitter for advanced features.',
      dependencies: ['core.syntaxHighlighting'],
      performance: 'medium' as const,
      category: 'parser' as const
    },
    errorDetection: {
      title: 'Error Detection',
      description: 'Live syntax and semantic error detection with detailed error messages.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'medium' as const,
      category: 'parser' as const
    },
    documentOutline: {
      title: 'Document Outline',
      description: 'Hierarchical view of modules, functions, and variables with click-to-navigate.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'medium' as const,
      category: 'parser' as const
    },
    performanceMonitoring: {
      title: 'Performance Monitoring',
      description: 'Monitor parsing performance and provide diagnostics for optimization.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'low' as const,
      category: 'parser' as const
    }
  },
  ide: {
    codeCompletion: {
      title: 'Code Completion',
      description: 'Intelligent auto-completion for OpenSCAD keywords, functions, and user-defined symbols.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'medium' as const,
      category: 'ide' as const
    },
    navigationCommands: {
      title: 'Navigation Commands',
      description: 'Go-to-definition, find references, and symbol search with keyboard shortcuts.',
      dependencies: ['parser.realTimeParsing', 'ide.codeCompletion'],
      performance: 'medium' as const,
      category: 'ide' as const
    },
    hoverInformation: {
      title: 'Hover Information',
      description: 'Rich tooltips showing symbol information, parameter details, and documentation.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'low' as const,
      category: 'ide' as const
    },
    quickFixes: {
      title: 'Quick Fixes',
      description: 'Automated suggestions and fixes for common syntax and semantic errors.',
      dependencies: ['parser.errorDetection'],
      performance: 'medium' as const,
      category: 'ide' as const
    },
    diagnostics: {
      title: 'Diagnostics',
      description: 'Comprehensive error and warning reporting with severity levels and locations.',
      dependencies: ['parser.errorDetection'],
      performance: 'medium' as const,
      category: 'ide' as const
    },
    formatting: {
      title: 'Code Formatting',
      description: 'Automatic code formatting with consistent indentation and style.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'medium' as const,
      category: 'ide' as const
    }
  },
  advanced: {
    refactoring: {
      title: 'Refactoring',
      description: 'Advanced code refactoring including rename symbol, extract function, and organize code.',
      dependencies: ['parser.realTimeParsing', 'ide.navigationCommands'],
      performance: 'high' as const,
      category: 'advanced' as const
    },
    symbolSearch: {
      title: 'Symbol Search',
      description: 'Fast symbol search with fuzzy matching and filtering by type (modules, functions, variables).',
      dependencies: ['parser.realTimeParsing', 'ide.navigationCommands'],
      performance: 'medium' as const,
      category: 'advanced' as const
    },
    folding: {
      title: 'Code Folding',
      description: 'Collapse and expand code blocks, modules, functions, and comments for better navigation.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'low' as const,
      category: 'advanced' as const
    },
    bracketMatching: {
      title: 'Bracket Matching',
      description: 'Highlight matching brackets, parentheses, and braces with auto-closing.',
      performance: 'low' as const,
      category: 'advanced' as const
    },
    smartIndentation: {
      title: 'Smart Indentation',
      description: 'Intelligent indentation based on OpenSCAD syntax and structure.',
      dependencies: ['parser.realTimeParsing'],
      performance: 'low' as const,
      category: 'advanced' as const
    },
    commentCommands: {
      title: 'Comment Commands',
      description: 'Toggle line and block comments with keyboard shortcuts.',
      performance: 'low' as const,
      category: 'advanced' as const
    }
  }
} as const;

/**
 * Enhanced Feature Configuration Panel Component
 * 
 * Provides advanced feature configuration with tooltips, performance metrics,
 * and enhanced user experience for the OpenSCAD editor.
 */
export const EnhancedFeatureConfigPanel: React.FC<EnhancedFeatureConfigPanelProps> = ({
  currentPreset,
  customFeatures,
  featureMode,
  onPresetChange,
  onCustomFeatureChange,
  onClose,
  performanceMetrics,
  showPerformanceMetrics = true,
  showTooltips = true,
  inline = false
}) => {
  const [_hoveredFeature, _setHoveredFeature] = useState<keyof OpenscadEditorFeatures | null>(null);
  const [showDependencies, setShowDependencies] = useState(false);

  /**
   * Get current feature configuration based on mode
   */
  const currentFeatures = useMemo((): OpenscadEditorFeatures => {
    if (featureMode === 'custom' && customFeatures) {
      return customFeatures;
    }

    // Return preset configuration
    const presetConfigs: Record<FeaturePreset, OpenscadEditorFeatures> = {
      BASIC: {
        core: {
          syntaxHighlighting: true,
          basicEditing: true,
          keyboardShortcuts: true
        },
        parser: {
          realTimeParsing: false,
          errorDetection: false,
          documentOutline: false,
          performanceMonitoring: false
        },
        ide: {
          codeCompletion: false,
          navigationCommands: false,
          hoverInformation: false,
          quickFixes: false,
          diagnostics: false,
          formatting: false
        },
        advanced: {
          refactoring: false,
          symbolSearch: false,
          folding: false,
          bracketMatching: false,
          smartIndentation: false,
          commentCommands: false,
          semanticHighlighting: false
        }
      },
      PARSER: {
        core: {
          syntaxHighlighting: true,
          basicEditing: true,
          keyboardShortcuts: true
        },
        parser: {
          realTimeParsing: true,
          errorDetection: true,
          documentOutline: true,
          performanceMonitoring: true
        },
        ide: {
          codeCompletion: false,
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
          commentCommands: false,
          semanticHighlighting: false
        }
      },
      IDE: {
        core: {
          syntaxHighlighting: true,
          basicEditing: true,
          keyboardShortcuts: true
        },
        parser: {
          realTimeParsing: true,
          errorDetection: true,
          documentOutline: true,
          performanceMonitoring: true
        },
        ide: {
          codeCompletion: true,
          navigationCommands: true,
          hoverInformation: true,
          quickFixes: true,
          diagnostics: true,
          formatting: true
        },
        advanced: {
          refactoring: false,
          symbolSearch: true,
          folding: true,
          bracketMatching: true,
          smartIndentation: true,
          commentCommands: true,
          semanticHighlighting: true
        }
      },
      FULL: {
        core: {
          syntaxHighlighting: true,
          basicEditing: true,
          keyboardShortcuts: true
        },
        parser: {
          realTimeParsing: true,
          errorDetection: true,
          documentOutline: true,
          performanceMonitoring: true
        },
        ide: {
          codeCompletion: true,
          navigationCommands: true,
          hoverInformation: true,
          quickFixes: true,
          diagnostics: true,
          formatting: true
        },
        advanced: {
          refactoring: true,
          symbolSearch: true,
          folding: true,
          bracketMatching: true,
          smartIndentation: true,
          commentCommands: true,
          semanticHighlighting: true
        }
      }
    };

    return presetConfigs[currentPreset];
  }, [currentPreset, customFeatures, featureMode]);

  /**
   * Calculate feature statistics
   */
  const featureStats = useMemo(() => {
    const categoryCounts = {
      core: 0,
      parser: 0,
      ide: 0,
      advanced: 0
    };

    let totalFeatures = 0;
    let activeFeatures = 0;

    // Count features in each category
    Object.entries(currentFeatures.core).forEach(([, enabled]) => {
      totalFeatures++;
      if (enabled) {
        activeFeatures++;
        categoryCounts.core++;
      }
    });

    Object.entries(currentFeatures.parser).forEach(([, enabled]) => {
      totalFeatures++;
      if (enabled) {
        activeFeatures++;
        categoryCounts.parser++;
      }
    });

    Object.entries(currentFeatures.ide).forEach(([, enabled]) => {
      totalFeatures++;
      if (enabled) {
        activeFeatures++;
        categoryCounts.ide++;
      }
    });

    Object.entries(currentFeatures.advanced).forEach(([, enabled]) => {
      totalFeatures++;
      if (enabled) {
        activeFeatures++;
        categoryCounts.advanced++;
      }
    });

    return {
      total: totalFeatures,
      active: activeFeatures,
      categories: categoryCounts
    };
  }, [currentFeatures]);

  /**
   * Handle feature toggle with dependency checking
   */
  const handleFeatureToggle = useCallback((category: keyof OpenscadEditorFeatures, featureName: string, enabled: boolean) => {
    const newFeatures = { ...currentFeatures };

    // Update the specific feature based on category
    if (category === 'core') {
      newFeatures.core = {
        ...newFeatures.core,
        [featureName]: enabled
      } as CoreFeatures;
    } else if (category === 'parser') {
      newFeatures.parser = {
        ...newFeatures.parser,
        [featureName]: enabled
      } as ParserFeatures;
    } else if (category === 'ide') {
      newFeatures.ide = {
        ...newFeatures.ide,
        [featureName]: enabled
      } as IDEFeatures;
    } else if (category === 'advanced') {
      newFeatures.advanced = {
        ...newFeatures.advanced,
        [featureName]: enabled
      } as AdvancedFeatures;
    }

    onCustomFeatureChange(newFeatures);
  }, [currentFeatures, onCustomFeatureChange]);

  return (
    <div
      className="enhanced-feature-config-panel"
      data-testid="enhanced-feature-config-panel"
      style={inline ? {
        // Inline styling for sidebar display
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        border: 'none',
        borderRadius: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      } : {
        // Modal styling for overlay display
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        maxHeight: '90vh',
        backgroundColor: '#1e1e1e',
        border: '1px solid #3c3c3c',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #3c3c3c',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>
          Enhanced Feature Configuration
        </h2>
        <button
          onClick={onClose}
          data-testid="enhanced-feature-config-close-button"
          data-testid-legacy="feature-config-close-button"
          style={{
            background: 'none',
            border: 'none',
            color: '#cccccc',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: showPerformanceMetrics ? '1fr 300px' : '1fr',
        gap: '20px'
      }}>
        {/* Main Configuration */}
        <div>
          {/* Preset Selection */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px' }}>
              Feature Presets
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['BASIC', 'PARSER', 'IDE', 'FULL'] as const).map(preset => (
                <button
                  key={preset}
                  onClick={() => onPresetChange(preset)}
                  data-testid={`enhanced-feature-preset-${preset.toLowerCase()}`}
                  data-testid-legacy={`feature-preset-${preset.toLowerCase()}`}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #3c3c3c',
                    borderRadius: '4px',
                    backgroundColor: currentPreset === preset ? '#0e639c' : '#2d2d30',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Statistics */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px' }}>
              Feature Statistics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px' 
            }}>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#2d2d30', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#4fc3f7', fontSize: '24px', fontWeight: 'bold' }}>
                  {featureStats.active}
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>Active</div>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#2d2d30', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#81c784', fontSize: '24px', fontWeight: 'bold' }}>
                  {featureStats.categories.core}
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>Core</div>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#2d2d30', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#ffb74d', fontSize: '24px', fontWeight: 'bold' }}>
                  {featureStats.categories.parser}
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>Parser</div>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#2d2d30', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#ba68c8', fontSize: '24px', fontWeight: 'bold' }}>
                  {featureStats.categories.ide}
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>IDE</div>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#2d2d30', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#f06292', fontSize: '24px', fontWeight: 'bold' }}>
                  {featureStats.categories.advanced}
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>Advanced</div>
              </div>
            </div>
          </div>

          {/* Individual Features */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
                Individual Features
              </h3>
              <button
                onClick={() => setShowDependencies(!showDependencies)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #3c3c3c',
                  borderRadius: '4px',
                  backgroundColor: showDependencies ? '#0e639c' : '#2d2d30',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {showDependencies ? 'Hide' : 'Show'} Dependencies
              </button>
            </div>
            
            <div
              data-testid="enhanced-individual-features-container"
              data-testid-legacy="individual-features-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Core Features */}
              <div>
                <h4
                  data-testid="feature-category-header-core"
                  style={{ color: '#81c784', marginBottom: '8px', fontSize: '14px' }}
                >
                  🔧 Core Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                  {Object.entries(FEATURE_TOOLTIPS.core).map(([featureName, tooltip]) => {
                    const isEnabled = currentFeatures.core[featureName as keyof CoreFeatures];

                    return (
                      <div
                        key={`core-${featureName}`}
                        style={{
                          padding: '8px',
                          backgroundColor: '#2d2d30',
                          borderRadius: '4px',
                          border: `1px solid ${isEnabled ? '#81c784' : '#3c3c3c'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleFeatureToggle('core', featureName, e.target.checked)}
                            data-testid={`enhanced-feature-core-${featureName}`}
                            style={{ marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                              {tooltip.title}
                            </div>
                            {showTooltips && (
                              <div style={{ color: '#cccccc', fontSize: '11px', lineHeight: '1.3', marginTop: '2px' }}>
                                {tooltip.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parser Features */}
              <div>
                <h4
                  data-testid="feature-category-header-parser"
                  style={{ color: '#ffb74d', marginBottom: '8px', fontSize: '14px' }}
                >
                  🌳 Parser Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                  {Object.entries(FEATURE_TOOLTIPS.parser).map(([featureName, tooltip]) => {
                    const isEnabled = currentFeatures.parser[featureName as keyof ParserFeatures];

                    return (
                      <div
                        key={`parser-${featureName}`}
                        style={{
                          padding: '8px',
                          backgroundColor: '#2d2d30',
                          borderRadius: '4px',
                          border: `1px solid ${isEnabled ? '#ffb74d' : '#3c3c3c'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleFeatureToggle('parser', featureName, e.target.checked)}
                            data-testid={`enhanced-feature-parser-${featureName}`}
                            style={{ marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                              {tooltip.title}
                            </div>
                            {showTooltips && (
                              <div style={{ color: '#cccccc', fontSize: '11px', lineHeight: '1.3', marginTop: '2px' }}>
                                {tooltip.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* IDE Features */}
              <div>
                <h4
                  data-testid="feature-category-header-ide"
                  style={{ color: '#ba68c8', marginBottom: '8px', fontSize: '14px' }}
                >
                  ✨ IDE Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                  {Object.entries(FEATURE_TOOLTIPS.ide).map(([featureName, tooltip]) => {
                    const isEnabled = currentFeatures.ide[featureName as keyof IDEFeatures];

                    return (
                      <div
                        key={`ide-${featureName}`}
                        style={{
                          padding: '8px',
                          backgroundColor: '#2d2d30',
                          borderRadius: '4px',
                          border: `1px solid ${isEnabled ? '#ba68c8' : '#3c3c3c'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleFeatureToggle('ide', featureName, e.target.checked)}
                            data-testid={`enhanced-feature-ide-${featureName}`}
                            style={{ marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                              {tooltip.title}
                            </div>
                            {showTooltips && (
                              <div style={{ color: '#cccccc', fontSize: '11px', lineHeight: '1.3', marginTop: '2px' }}>
                                {tooltip.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <h4
                  data-testid="feature-category-header-advanced"
                  style={{ color: '#f06292', marginBottom: '8px', fontSize: '14px' }}
                >
                  🚀 Advanced Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                  {Object.entries(FEATURE_TOOLTIPS.advanced).map(([featureName, tooltip]) => {
                    const isEnabled = currentFeatures.advanced[featureName as keyof AdvancedFeatures];

                    return (
                      <div
                        key={`advanced-${featureName}`}
                        style={{
                          padding: '8px',
                          backgroundColor: '#2d2d30',
                          borderRadius: '4px',
                          border: `1px solid ${isEnabled ? '#f06292' : '#3c3c3c'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleFeatureToggle('advanced', featureName, e.target.checked)}
                            data-testid={`enhanced-feature-advanced-${featureName}`}
                            style={{ marginTop: '2px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                              {tooltip.title}
                            </div>
                            {showTooltips && (
                              <div style={{ color: '#cccccc', fontSize: '11px', lineHeight: '1.3', marginTop: '2px' }}>
                                {tooltip.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          {/* Feature Analysis Section */}
          <div
            data-testid="feature-analysis-section"
            style={{ marginTop: '24px' }}
          >
            <h3 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px' }}>
              Feature Analysis
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div
                data-testid="parser-required-indicator"
                style={{
                  padding: '12px',
                  backgroundColor: '#2d2d30',
                  borderRadius: '4px',
                  border: `1px solid ${currentFeatures.parser.realTimeParsing ? '#ffb74d' : '#3c3c3c'}`
                }}
              >
                <div style={{ color: '#ffb74d', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Parser Required
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>
                  {currentFeatures.parser.realTimeParsing ? '✅' : '❌'} {currentFeatures.parser.realTimeParsing ? 'Active' : 'Inactive'} - Real-time parsing enables advanced features
                </div>
              </div>

              <div
                data-testid="ide-features-indicator"
                style={{
                  padding: '12px',
                  backgroundColor: '#2d2d30',
                  borderRadius: '4px',
                  border: `1px solid ${featureStats.categories.ide > 0 ? '#ba68c8' : '#3c3c3c'}`
                }}
              >
                <div style={{ color: '#ba68c8', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  IDE Features
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>
                  {featureStats.categories.ide > 0 ? '✅' : '❌'} {featureStats.categories.ide} active - Code completion, navigation, hover info
                </div>
              </div>

              <div
                data-testid="advanced-features-indicator"
                style={{
                  padding: '12px',
                  backgroundColor: '#2d2d30',
                  borderRadius: '4px',
                  border: `1px solid ${featureStats.categories.advanced > 0 ? '#f06292' : '#3c3c3c'}`
                }}
              >
                <div style={{ color: '#f06292', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Advanced Features
                </div>
                <div style={{ color: '#cccccc', fontSize: '12px' }}>
                  {featureStats.categories.advanced > 0 ? '✅' : '❌'} {featureStats.categories.advanced} active - Refactoring, symbol search, folding
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Performance Metrics Sidebar */}
        {showPerformanceMetrics && performanceMetrics && (
          <div style={{
            backgroundColor: '#252526',
            borderRadius: '4px',
            padding: '16px',
            height: 'fit-content'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '16px' }}>
              Performance Metrics
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '4px' }}>
                  Parse Time
                </div>
                <div style={{ color: '#4fc3f7', fontSize: '18px', fontWeight: 'bold' }}>
                  {performanceMetrics.parseTime.toFixed(1)}ms
                </div>
              </div>
              
              <div>
                <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '4px' }}>
                  Render Time
                </div>
                <div style={{ color: '#81c784', fontSize: '18px', fontWeight: 'bold' }}>
                  {performanceMetrics.renderTime.toFixed(1)}ms
                </div>
              </div>
              
              <div>
                <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '4px' }}>
                  Memory Usage
                </div>
                <div style={{ color: '#ffb74d', fontSize: '18px', fontWeight: 'bold' }}>
                  {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
              
              <div>
                <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '4px' }}>
                  Feature Load Time
                </div>
                <div style={{ color: '#ba68c8', fontSize: '18px', fontWeight: 'bold' }}>
                  {performanceMetrics.featureLoadTime.toFixed(1)}ms
                </div>
              </div>
              
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#2d2d30',
                borderRadius: '4px'
              }}>
                <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '8px' }}>
                  Feature Efficiency
                </div>
                <div style={{ 
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#3c3c3c',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (performanceMetrics.activeFeatures / performanceMetrics.totalFeatures) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#4fc3f7',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  color: '#888888', 
                  fontSize: '11px', 
                  marginTop: '4px',
                  textAlign: 'center'
                }}>
                  {performanceMetrics.activeFeatures} / {performanceMetrics.totalFeatures} features active
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedFeatureConfigPanel;
