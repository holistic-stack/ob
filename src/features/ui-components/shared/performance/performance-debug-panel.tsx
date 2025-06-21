/**
 * Performance Debug Panel
 * 
 * A development-only component for monitoring real-time performance metrics
 * and identifying performance bottlenecks in the OpenSCAD 3D visualization pipeline.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { globalPerformanceMonitor, type PerformanceMetrics } from './performance-monitor';

interface PerformanceDebugPanelProps {
  readonly enabled?: boolean;
  readonly position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  readonly maxMetrics?: number;
}

export const PerformanceDebugPanel: React.FC<PerformanceDebugPanelProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right',
  maxMetrics = 10
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Update metrics periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const report = globalPerformanceMonitor.generateReport();
      const recentMetrics = report.metrics
        .slice(-maxMetrics)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setMetrics(recentMetrics);
      setLastUpdate(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, maxMetrics]);

  const handleClearMetrics = useCallback(() => {
    globalPerformanceMonitor.clearMetrics();
    setMetrics([]);
  }, []);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getMetricColor = (metric: PerformanceMetrics) => {
    if (metric.withinTarget) {
      return 'text-green-400';
    } else if (metric.duration < metric.target * 1.5) {
      return 'text-yellow-400';
    } else {
      return 'text-red-400';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${ms.toFixed(2)}ms`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
      style={{ fontFamily: 'monospace' }}
    >
      <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
        {/* Header */}
        <div 
          className="p-2 bg-gray-900/90 border-b border-white/10 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold">PERF</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">
              {metrics.length} ops
            </span>
            <span className="text-white text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="p-2 max-h-96 overflow-y-auto">
            {/* Controls */}
            <div className="mb-2 flex gap-2">
              <button
                onClick={handleClearMetrics}
                className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded transition-colors"
              >
                Clear
              </button>
              <span className="text-gray-400 text-xs flex items-center">
                Updated: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            </div>

            {/* Metrics list */}
            {metrics.length === 0 ? (
              <div className="text-gray-400 text-xs text-center py-4">
                No performance metrics yet
              </div>
            ) : (
              <div className="space-y-1">
                {metrics.map((metric, index) => (
                  <div 
                    key={`${metric.operation}-${metric.timestamp}-${index}`}
                    className="p-2 bg-gray-800/50 rounded border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-medium">
                        {metric.operation}
                      </span>
                      <span className={`text-xs ${getMetricColor(metric)}`}>
                        {formatDuration(metric.duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Target: {formatDuration(metric.target)}
                      </span>
                      <span className={`${metric.withinTarget ? 'text-green-400' : 'text-red-400'}`}>
                        {metric.withinTarget ? '✓' : '✗'}
                      </span>
                    </div>

                    {/* Performance bar */}
                    <div className="mt-1 w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          metric.withinTarget 
                            ? 'bg-green-400' 
                            : metric.duration < metric.target * 1.5
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (metric.duration / (metric.target * 2)) * 100)}%` 
                        }}
                      />
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {metrics.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-700/50">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span className="text-white">
                      {formatDuration(
                        metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="text-white">
                      {((metrics.filter(m => m.withinTarget).length / metrics.length) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slowest:</span>
                    <span className="text-red-400">
                      {formatDuration(Math.max(...metrics.map(m => m.duration)))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDebugPanel;
