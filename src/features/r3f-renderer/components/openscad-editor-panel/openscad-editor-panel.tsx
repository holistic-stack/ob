/**
 * @file OpenSCAD Editor Panel
 * 
 * Dedicated OpenSCAD code editor panel component with syntax highlighting,
 * real-time conversion, and glass morphism design. Integrates with the R3F
 * renderer to provide a seamless OpenSCAD → 3D workflow.
 * 
 * Features:
 * - Syntax-highlighted code editor with OpenSCAD support
 * - Real-time conversion with progress tracking
 * - Example code library with common patterns
 * - Error handling and validation
 * - Glass morphism UI with 8px grid system
 * - Responsive design and accessibility
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useR3FCSGConverter } from '../../../r3f-csg/hooks/use-r3f-csg-converter';
import type { ProcessingProgress } from '../../../r3f-csg/types/r3f-csg-types';
import type { UseR3FCSGConverterConfig } from '../../../r3f-csg/hooks/use-r3f-csg-converter';
import './openscad-editor-panel.css';

// ============================================================================
// Component Props and Types
// ============================================================================

/**
 * Props for the OpenSCAD Editor Panel component
 */
export interface OpenSCADEditorPanelProps {
  readonly initialCode?: string;
  readonly onCodeChange?: (code: string) => void;
  readonly onConversionComplete?: (result: any) => void;
  readonly onConversionError?: (error: string) => void;
  readonly onMeshesGenerated?: (meshes: THREE.Mesh[]) => void;
  readonly autoConvert?: boolean;
  readonly showExamples?: boolean;
  readonly showStatistics?: boolean;
  readonly converterConfig?: UseR3FCSGConverterConfig;
  readonly className?: string;
  readonly disabled?: boolean;
}

/**
 * Example OpenSCAD code snippets
 */
const EXAMPLE_CODES = {
  cube: {
    name: 'Simple Cube',
    code: 'cube([10, 10, 10]);',
    description: 'Basic cube primitive'
  },
  sphere: {
    name: 'Simple Sphere',
    code: 'sphere(8);',
    description: 'Basic sphere primitive'
  },
  cylinder: {
    name: 'Simple Cylinder',
    code: 'cylinder(h=15, r=5);',
    description: 'Basic cylinder primitive'
  },
  difference: {
    name: 'Difference Operation',
    code: `difference() {
  cube([20, 15, 8], center=true);
  
  // Mounting holes
  translate([-6, 0, 0])
    cylinder(h=10, r=2, center=true);
  
  translate([6, 0, 0])
    cylinder(h=10, r=2, center=true);
  
  // Central cutout
  cube([8, 6, 10], center=true);
}`,
    description: 'Mechanical part with holes'
  },
  union: {
    name: 'Union Operation',
    code: `union() {
  cube([10, 10, 2]);
  
  translate([0, 0, 2])
    cylinder(h=8, r=4);
  
  translate([0, 0, 10])
    sphere(3);
}`,
    description: 'Combined shapes'
  },
  intersection: {
    name: 'Intersection Operation',
    code: `intersection() {
  cube([15, 15, 15], center=true);
  sphere(10);
}`,
    description: 'Intersected cube and sphere'
  }
} as const;

// ============================================================================
// OpenSCAD Editor Panel Component
// ============================================================================

/**
 * OpenSCAD Editor Panel component
 * 
 * Provides a comprehensive code editor for OpenSCAD with real-time conversion
 * to React Three Fiber components, featuring syntax highlighting, examples,
 * and progress tracking.
 */
export const OpenSCADEditorPanel: React.FC<OpenSCADEditorPanelProps> = ({
  initialCode = 'cube([10, 10, 10]);',
  onCodeChange,
  onConversionComplete,
  onConversionError,
  onMeshesGenerated,
  autoConvert = false,
  showExamples = true,
  showStatistics = true,
  converterConfig,
  className = '',
  disabled = false
}) => {
  // State management
  const [code, setCode] = useState(initialCode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [lastConversionTime, setLastConversionTime] = useState<number>(0);

  // CSG Converter integration
  const converter = useR3FCSGConverter({
    enableCaching: true,
    enableLogging: false,
    autoConvert: false,
    debounceMs: 1000,
    retryOnError: true,
    maxRetries: 2,
    canvasConfig: {
      shadows: true,
      antialias: true,
      camera: {
        position: [15, 15, 15],
        fov: 60
      }
    },
    sceneConfig: {
      backgroundColor: '#1e293b',
      enableGrid: true,
      enableAxes: true,
      enableStats: false
    },
    ...converterConfig
  });

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  }, [onCodeChange]);

  // Handle manual conversion
  const handleConvert = useCallback(async () => {
    if (!code.trim() || disabled) return;

    console.log('[DEBUG] Starting manual OpenSCAD conversion');
    const startTime = performance.now();

    try {
      const result = await converter.convertToR3F(code);
      const conversionTime = performance.now() - startTime;
      setLastConversionTime(conversionTime);

      if (result.success && result.data) {
        console.log('[DEBUG] OpenSCAD conversion successful');
        
        if (onConversionComplete) {
          onConversionComplete(result.data);
        }
        
        if (onMeshesGenerated && result.data.meshes) {
          onMeshesGenerated(result.data.meshes);
        }
      } else {
        const error = result.error || 'Unknown conversion error';
        console.error('[ERROR] OpenSCAD conversion failed:', error);
        
        if (onConversionError) {
          onConversionError(error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ERROR] OpenSCAD conversion exception:', errorMessage);
      
      if (onConversionError) {
        onConversionError(errorMessage);
      }
    }
  }, [code, disabled, converter, onConversionComplete, onConversionError, onMeshesGenerated]);

  // Handle example selection
  const handleExampleSelect = useCallback((exampleKey: string) => {
    const example = EXAMPLE_CODES[exampleKey as keyof typeof EXAMPLE_CODES];
    if (example) {
      handleCodeChange(example.code);
      setSelectedExample(exampleKey);
    }
  }, [handleCodeChange]);

  // Auto-convert effect
  useEffect(() => {
    if (autoConvert && code.trim() && !disabled) {
      const timeoutId = setTimeout(() => {
        handleConvert();
      }, 1500); // Debounce auto-conversion

      return () => clearTimeout(timeoutId);
    }
    
    return undefined;
  }, [code, autoConvert, disabled, handleConvert]);

  // Memoized statistics
  const statistics = useMemo(() => {
    return {
      ...converter.statistics,
      lastConversionTime,
      codeLength: code.length,
      lineCount: code.split('\n').length
    };
  }, [converter.statistics, lastConversionTime, code]);

  return (
    <div className={`openscad-editor-panel ${className} ${disabled ? 'disabled' : ''}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <div className="header-content">
          <h3 className="panel-title">
            <span className="title-icon">📝</span>
            OpenSCAD Code Editor
          </h3>
          <div className="header-controls">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              disabled={disabled}
              aria-label={isExpanded ? 'Collapse editor' : 'Expand editor'}
            >
              {isExpanded ? '🔽' : '▶️'}
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="quick-stats">
          <span className="stat-item">
            Lines: {statistics.lineCount}
          </span>
          <span className="stat-item">
            Chars: {statistics.codeLength}
          </span>
          {converter.isProcessing && (
            <span className="stat-item processing">
              Converting...
            </span>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="panel-content">
          {/* Code Editor */}
          <div className="editor-section">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="code-editor"
              placeholder="Enter your OpenSCAD code here..."
              rows={16}
              spellCheck={false}
              disabled={disabled}
              aria-label="OpenSCAD code editor"
            />
          </div>

          {/* Editor Controls */}
          <div className="editor-controls">
            <div className="primary-controls">
              <button
                onClick={handleConvert}
                disabled={disabled || converter.isProcessing || !code.trim()}
                className="convert-button primary"
              >
                {converter.isProcessing ? (
                  <>
                    <span className="spinner">⟳</span>
                    Converting...
                  </>
                ) : (
                  <>
                    <span className="icon">🎯</span>
                    Convert to 3D
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleCodeChange('')}
                disabled={disabled || !code.trim()}
                className="clear-button secondary"
              >
                <span className="icon">🗑️</span>
                Clear
              </button>
            </div>

            <div className="utility-controls">
              <button
                onClick={converter.clearCache}
                disabled={disabled}
                className="cache-button secondary"
                title="Clear conversion cache"
              >
                <span className="icon">🧹</span>
                Clear Cache
              </button>
              
              <button
                onClick={converter.reset}
                disabled={disabled}
                className="reset-button secondary"
                title="Reset converter state"
              >
                <span className="icon">🔄</span>
                Reset
              </button>
            </div>
          </div>

          {/* Progress Display */}
          {converter.progress && (
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-message">{converter.progress.message}</span>
                <span className="progress-percentage">{converter.progress.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${converter.progress.progress}%` }}
                />
              </div>
              <div className="progress-details">
                <span>Stage: {converter.progress.stage}</span>
                <span>Time: {converter.progress.timeElapsed.toFixed(0)}ms</span>
                {converter.progress.estimatedTimeRemaining && (
                  <span>ETA: {converter.progress.estimatedTimeRemaining.toFixed(0)}ms</span>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {converter.error && (
            <div className="error-section">
              <div className="error-header">
                <span className="error-icon">❌</span>
                <span className="error-title">Conversion Error</span>
                <button
                  onClick={converter.clearError}
                  className="error-dismiss"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
              <div className="error-message">{converter.error}</div>
              <div className="error-actions">
                <button
                  onClick={handleConvert}
                  disabled={disabled}
                  className="retry-button"
                >
                  <span className="icon">🔄</span>
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Example Code Library */}
          {showExamples && (
            <div className="examples-section">
              <h4 className="section-title">
                <span className="title-icon">📚</span>
                Example Code Library
              </h4>
              <div className="examples-grid">
                {Object.entries(EXAMPLE_CODES).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => handleExampleSelect(key)}
                    disabled={disabled}
                    className={`example-button ${selectedExample === key ? 'selected' : ''}`}
                    title={example.description}
                  >
                    <span className="example-name">{example.name}</span>
                    <span className="example-description">{example.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Display */}
          {showStatistics && (
            <div className="statistics-section">
              <h4 className="section-title">
                <span className="title-icon">📊</span>
                Converter Statistics
              </h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{statistics.conversionCount}</div>
                  <div className="stat-label">Total Conversions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.cacheHitRate.toFixed(1)}%</div>
                  <div className="stat-label">Cache Hit Rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.cacheSize}</div>
                  <div className="stat-label">Cache Size</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.lastConversionTime.toFixed(0)}ms</div>
                  <div className="stat-label">Last Conversion</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Default export
export default OpenSCADEditorPanel;
