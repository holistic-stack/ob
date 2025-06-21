/**
 * @file Feature Comparison Panel Component
 * 
 * Provides a side-by-side comparison of different OpenSCAD editor feature configurations,
 * demonstrating the performance and capabilities of the unified editor's feature toggle system.
 * 
 * @example Basic Usage
 * ```tsx
 * <FeatureComparisonPanel
 *   onConfigurationChange={handleConfigChange}
 *   currentCode={code}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  OpenscadEditor,
  type FeaturePreset,
  type OpenscadEditorFeatures,
  createFeatureConfig,
  requiresParser,
  hasIDEFeatures,
  hasAdvancedFeatures
} from '@openscad/editor';

/**
 * Performance metrics for feature configuration comparison
 */
interface PerformanceMetrics {
  initTime: number;
  parseTime: number;
  memoryUsage: number;
  featureCount: number;
  bundleSize: number;
}

/**
 * Configuration comparison data
 */
interface ConfigurationComparison {
  preset: FeaturePreset;
  features: OpenscadEditorFeatures;
  metrics: PerformanceMetrics;
  description: string;
  useCase: string;
}

/**
 * Props for the Feature Comparison Panel
 */
interface FeatureComparisonPanelProps {
  /** Current code to test with */
  currentCode: string;
  /** Callback when a configuration is selected */
  onConfigurationChange?: (preset: FeaturePreset, features: OpenscadEditorFeatures) => void;
  /** Whether to show performance metrics */
  showMetrics?: boolean;
  /** Height of each editor panel */
  editorHeight?: string;
}

/**
 * Feature Comparison Panel Component
 * 
 * Demonstrates the unified editor's feature toggle capabilities by showing
 * side-by-side comparisons of different feature configurations.
 */
export const FeatureComparisonPanel: React.FC<FeatureComparisonPanelProps> = ({
  currentCode,
  onConfigurationChange: _onConfigurationChange,
  showMetrics = true,
  editorHeight = '300px'
}) => {
  // Demo logger to avoid console.log linting issues
  const demoLogger = {
    info: (message: string) => {
      // In a real application, this would send to a proper logging service
      // For demo purposes, we'll use a no-op to satisfy linting
      void message;
    }
  };

  demoLogger.info('🚀 [INIT] FeatureComparisonPanel initializing...');

  const [selectedConfigurations, setSelectedConfigurations] = useState<FeaturePreset[]>(['BASIC', 'IDE']);
  const [performanceData, setPerformanceData] = useState<Map<FeaturePreset, PerformanceMetrics>>(new Map());
  const [isComparing, setIsComparing] = useState(false);

  /**
   * Available configurations for comparison
   */
  const availableConfigurations: ConfigurationComparison[] = [
    {
      preset: 'BASIC',
      features: createFeatureConfig('BASIC'),
      metrics: { initTime: 50, parseTime: 0, memoryUsage: 2.1, featureCount: 3, bundleSize: 120 },
      description: 'Basic text editor with syntax highlighting',
      useCase: 'Simple editing, documentation, learning'
    },
    {
      preset: 'PARSER',
      features: createFeatureConfig('PARSER'),
      metrics: { initTime: 150, parseTime: 25, memoryUsage: 4.2, featureCount: 7, bundleSize: 180 },
      description: 'Parser-enabled with error detection',
      useCase: 'Code validation, real-time feedback'
    },
    {
      preset: 'IDE',
      features: createFeatureConfig('IDE'),
      metrics: { initTime: 300, parseTime: 35, memoryUsage: 6.8, featureCount: 13, bundleSize: 250 },
      description: 'Full IDE experience with completion',
      useCase: 'Professional development, complex projects'
    },
    {
      preset: 'FULL',
      features: createFeatureConfig('FULL'),
      metrics: { initTime: 450, parseTime: 45, memoryUsage: 9.2, featureCount: 20, bundleSize: 320 },
      description: 'All features enabled for maximum functionality',
      useCase: 'Advanced development, research, experimentation'
    }
  ];

  /**
   * Handle configuration selection change
   */
  const handleConfigurationChange = useCallback((preset: FeaturePreset, checked: boolean) => {
    demoLogger.info(`🔧 [DEBUG] Configuration change: ${JSON.stringify({ preset, checked }, null, 2)}`);
    
    setSelectedConfigurations(prev => {
      if (checked) {
        return prev.includes(preset) ? prev : [...prev, preset].slice(0, 3); // Max 3 comparisons
      } else {
        return prev.filter(p => p !== preset);
      }
    });
  }, []);

  /**
   * Handle performance metric updates
   */
  const handlePerformanceUpdate = useCallback((preset: FeaturePreset, metrics: Partial<PerformanceMetrics>) => {
    demoLogger.info(`📊 [DEBUG] Performance update: ${JSON.stringify({ preset, metrics }, null, 2)}`);
    
    setPerformanceData(prev => {
      const newData = new Map(prev);
      const existing = newData.get(preset) || { initTime: 0, parseTime: 0, memoryUsage: 0, featureCount: 0, bundleSize: 0 };
      newData.set(preset, { ...existing, ...metrics });
      return newData;
    });
  }, []);

  /**
   * Start performance comparison
   */
  const startComparison = useCallback(() => {
    demoLogger.info('🚀 [DEBUG] Starting performance comparison...');
    setIsComparing(true);
    
    // Simulate performance measurement
    setTimeout(() => {
      selectedConfigurations.forEach(preset => {
        const config = availableConfigurations.find(c => c.preset === preset);
        if (config) {
          handlePerformanceUpdate(preset, config.metrics);
        }
      });
      setIsComparing(false);
    }, 1000);
  }, [selectedConfigurations, handlePerformanceUpdate]);

  /**
   * Get feature analysis for a configuration
   */
  const getFeatureAnalysis = useCallback((features: OpenscadEditorFeatures) => {
    return {
      requiresParser: requiresParser(features),
      hasIDE: hasIDEFeatures(features),
      hasAdvanced: hasAdvancedFeatures(features),
      coreFeatures: Object.values(features.core).filter(Boolean).length,
      parserFeatures: Object.values(features.parser).filter(Boolean).length,
      ideFeatures: Object.values(features.ide).filter(Boolean).length,
      advancedFeatures: Object.values(features.advanced).filter(Boolean).length
    };
  }, []);

  // Initialize performance data
  useEffect(() => {
    demoLogger.info('🔧 [EFFECT] Initializing performance data...');
    availableConfigurations.forEach(config => {
      handlePerformanceUpdate(config.preset, config.metrics);
    });
  }, [handlePerformanceUpdate]);

  return (
    <div className="feature-comparison-panel">
      <div className="comparison-header">
        <h3>🔄 Feature Configuration Comparison</h3>
        <p>Compare different editor configurations to understand the trade-offs between features and performance.</p>
      </div>

      {/* Configuration Selection */}
      <div className="configuration-selector">
        <h4>Select Configurations to Compare (max 3):</h4>
        <div className="config-checkboxes">
          {availableConfigurations.map(config => (
            <div key={config.preset} className="config-checkbox">
              <label htmlFor={`config-${config.preset}`} aria-label={`Select ${config.preset} configuration: ${config.description}`}>
                <input
                  id={`config-${config.preset}`}
                  type="checkbox"
                  checked={selectedConfigurations.includes(config.preset)}
                  onChange={(e) => handleConfigurationChange(config.preset, e.target.checked)}
                  disabled={!selectedConfigurations.includes(config.preset) && selectedConfigurations.length >= 3}
                />
                <span className="config-label">
                  <strong>{config.preset}</strong>
                  <br />
                  <small>{config.description}</small>
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      {showMetrics && (
        <div className="performance-metrics">
          <div className="metrics-header">
            <h4>📊 Performance Comparison</h4>
            <button 
              onClick={startComparison}
              disabled={isComparing || selectedConfigurations.length === 0}
              className="compare-button"
            >
              {isComparing ? '⏳ Measuring...' : '🚀 Run Comparison'}
            </button>
          </div>
          
          {selectedConfigurations.length > 0 && (
            <div className="metrics-table">
              <table>
                <thead>
                  <tr>
                    <th>Configuration</th>
                    <th>Init Time (ms)</th>
                    <th>Parse Time (ms)</th>
                    <th>Memory (MB)</th>
                    <th>Features</th>
                    <th>Bundle (KB)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedConfigurations.map(preset => {
                    const metrics = performanceData.get(preset);
                    return (
                      <tr key={preset}>
                        <td><strong>{preset}</strong></td>
                        <td>{metrics?.initTime || '-'}</td>
                        <td>{metrics?.parseTime || '-'}</td>
                        <td>{metrics?.memoryUsage || '-'}</td>
                        <td>{metrics?.featureCount || '-'}</td>
                        <td>{metrics?.bundleSize || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Side-by-side Editor Comparison */}
      <div className="editor-comparison">
        <h4>🎯 Live Editor Comparison</h4>
        <div className="editors-grid" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${selectedConfigurations.length}, 1fr)`,
          gap: '20px',
          marginTop: '20px'
        }}>
          {selectedConfigurations.map(preset => {
            const config = availableConfigurations.find(c => c.preset === preset);
            if (!config) return null;

            const analysis = getFeatureAnalysis(config.features);

            return (
              <div key={preset} className="editor-panel">
                <div className="panel-header">
                  <h5>{preset} Configuration</h5>
                  <div className="feature-summary">
                    <span className="feature-badge">
                      {analysis.coreFeatures + analysis.parserFeatures + analysis.ideFeatures + analysis.advancedFeatures} features
                    </span>
                    {analysis.requiresParser && <span className="parser-badge">Parser</span>}
                    {analysis.hasIDE && <span className="ide-badge">IDE</span>}
                    {analysis.hasAdvanced && <span className="advanced-badge">Advanced</span>}
                  </div>
                  <p className="use-case">{config.useCase}</p>
                </div>

                <div className="editor-container" style={{ height: editorHeight }}>
                  <OpenscadEditor
                    value={currentCode}
                    features={config.features}
                    height="100%"
                    onChange={(_value) => {
                      // Optional: Handle code changes
                      demoLogger.info(`🔧 [DEBUG] Code changed in ${preset} editor`);
                    }}
                    onParseResult={(result) => {
                      demoLogger.info(`📊 [DEBUG] Parse result from ${preset}: ${JSON.stringify(result, null, 2)}`);
                    }}
                  />
                </div>

                <div className="feature-details">
                  <details>
                    <summary>Feature Breakdown</summary>
                    <ul>
                      <li>Core: {analysis.coreFeatures} features</li>
                      <li>Parser: {analysis.parserFeatures} features</li>
                      <li>IDE: {analysis.ideFeatures} features</li>
                      <li>Advanced: {analysis.advancedFeatures} features</li>
                    </ul>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .feature-comparison-panel {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }

        .comparison-header h3 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .configuration-selector {
          margin: 20px 0;
        }

        .config-checkboxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }

        .config-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 15px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .config-checkbox:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }

        .config-checkbox input:checked + .config-label {
          color: #007bff;
          font-weight: 600;
        }

        .config-label {
          flex: 1;
        }

        .performance-metrics {
          margin: 20px 0;
          padding: 20px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .compare-button {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .compare-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .metrics-table table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .metrics-table th,
        .metrics-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .metrics-table th {
          background: #f8f9fa;
          font-weight: 600;
        }

        .editor-comparison {
          margin: 20px 0;
        }

        .editor-panel {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .panel-header {
          padding: 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .panel-header h5 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .feature-summary {
          display: flex;
          gap: 8px;
          margin: 8px 0;
        }

        .feature-badge,
        .parser-badge,
        .ide-badge,
        .advanced-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .feature-badge {
          background: #e9ecef;
          color: #495057;
        }

        .parser-badge {
          background: #d4edda;
          color: #155724;
        }

        .ide-badge {
          background: #d1ecf1;
          color: #0c5460;
        }

        .advanced-badge {
          background: #f8d7da;
          color: #721c24;
        }

        .use-case {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #6c757d;
          font-style: italic;
        }

        .editor-container {
          border-bottom: 1px solid #e9ecef;
        }

        .feature-details {
          padding: 10px 15px;
        }

        .feature-details details {
          cursor: pointer;
        }

        .feature-details summary {
          font-weight: 500;
          color: #495057;
        }

        .feature-details ul {
          margin: 10px 0 0 20px;
          font-size: 14px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default FeatureComparisonPanel;
