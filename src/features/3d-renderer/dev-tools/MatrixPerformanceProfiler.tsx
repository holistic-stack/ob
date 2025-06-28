/**
 * Matrix Performance Profiler
 * 
 * Development tool for monitoring matrix operation performance with real-time
 * metrics, visualization, and debugging capabilities following bulletproof-react patterns.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMatrixOperationContext } from '../providers/MatrixOperationProvider';
import type { APIPerformanceMetrics } from '../api/matrix-operations.api';

/**
 * Performance profiler props
 */
export interface MatrixPerformanceProfilerProps {
  readonly enabled?: boolean;
  readonly updateInterval?: number;
  readonly maxHistorySize?: number;
  readonly showDetails?: boolean;
  readonly position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  readonly className?: string;
  readonly onPerformanceAlert?: (metric: string, value: number, threshold: number) => void;
}

/**
 * Performance history entry
 */
interface PerformanceHistoryEntry {
  readonly timestamp: number;
  readonly metrics: APIPerformanceMetrics;
}

/**
 * Performance thresholds
 */
const PERFORMANCE_THRESHOLDS = {
  averageExecutionTime: 16, // <16ms target
  memoryUsage: 100 * 1024 * 1024, // 100MB
  failureRate: 0.05, // 5%
  cacheHitRate: 0.8 // 80%
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration to human readable string
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Get performance status color
 */
const getPerformanceColor = (value: number, threshold: number, inverse = false): string => {
  const ratio = value / threshold;
  if (inverse) {
    return ratio >= 1 ? '#4caf50' : ratio >= 0.8 ? '#ff9800' : '#f44336';
  }
  return ratio <= 1 ? '#4caf50' : ratio <= 1.5 ? '#ff9800' : '#f44336';
};

/**
 * Matrix Performance Profiler Component
 */
export const MatrixPerformanceProfiler: React.FC<MatrixPerformanceProfilerProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  updateInterval = 1000,
  maxHistorySize = 60,
  showDetails = true,
  position = 'top-right',
  className = '',
  onPerformanceAlert
}) => {
  const { getPerformanceReport, isServiceHealthy } = useMatrixOperationContext();
  const [history, setHistory] = useState<PerformanceHistoryEntry[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<APIPerformanceMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Update performance metrics
   */
  const updateMetrics = useCallback(() => {
    try {
      const report = getPerformanceReport();
      if (!report) return;

      const metrics: APIPerformanceMetrics = {
        totalOperations: report.totalOperations || 0,
        successfulOperations: report.successfulOperations || 0,
        failedOperations: report.failedOperations || 0,
        averageExecutionTime: report.averageExecutionTime || 0,
        totalExecutionTime: report.totalExecutionTime || 0,
        cacheHitRate: report.cacheHitRate || 0,
        memoryUsage: report.memoryUsage || 0,
        lastOperationTime: report.lastOperationTime || 0
      };

      setCurrentMetrics(metrics);

      // Add to history
      setHistory(prev => {
        const newEntry: PerformanceHistoryEntry = {
          timestamp: Date.now(),
          metrics
        };
        
        const newHistory = [...prev, newEntry];
        return newHistory.slice(-maxHistorySize);
      });

      // Check for performance alerts
      if (onPerformanceAlert) {
        if (metrics.averageExecutionTime > PERFORMANCE_THRESHOLDS.averageExecutionTime) {
          onPerformanceAlert('averageExecutionTime', metrics.averageExecutionTime, PERFORMANCE_THRESHOLDS.averageExecutionTime);
        }
        
        if (metrics.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage) {
          onPerformanceAlert('memoryUsage', metrics.memoryUsage, PERFORMANCE_THRESHOLDS.memoryUsage);
        }
        
        const failureRate = metrics.totalOperations > 0 ? metrics.failedOperations / metrics.totalOperations : 0;
        if (failureRate > PERFORMANCE_THRESHOLDS.failureRate) {
          onPerformanceAlert('failureRate', failureRate, PERFORMANCE_THRESHOLDS.failureRate);
        }
        
        if (metrics.cacheHitRate < PERFORMANCE_THRESHOLDS.cacheHitRate && metrics.totalOperations > 10) {
          onPerformanceAlert('cacheHitRate', metrics.cacheHitRate, PERFORMANCE_THRESHOLDS.cacheHitRate);
        }
      }
    } catch (err) {
      console.error('[ERROR][MatrixPerformanceProfiler] Failed to update metrics:', err);
    }
  }, [getPerformanceReport, maxHistorySize, onPerformanceAlert]);

  /**
   * Set up update interval
   */
  useEffect(() => {
    if (!enabled) return;

    console.log(`[DEBUG][MatrixPerformanceProfiler] Starting performance monitoring (interval: ${updateInterval}ms)`);
    
    // Initial update
    updateMetrics();
    
    // Set up interval
    intervalRef.current = setInterval(updateMetrics, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('[END][MatrixPerformanceProfiler] Performance monitoring stopped');
    };
  }, [enabled, updateInterval, updateMetrics]);

  if (!enabled || !currentMetrics) {
    return null;
  }

  const failureRate = currentMetrics.totalOperations > 0 
    ? currentMetrics.failedOperations / currentMetrics.totalOperations 
    : 0;

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' }
  };

  return (
    <div 
      className={`matrix-performance-profiler ${className}`}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        zIndex: 9999,
        minWidth: '280px',
        maxWidth: '400px',
        border: `2px solid ${isServiceHealthy ? '#4caf50' : '#f44336'}`,
        backdropFilter: 'blur(4px)'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Matrix Performance Profiler - ${isExpanded ? 'Collapse' : 'Expand'}`}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          🔍 Matrix Performance
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: isServiceHealthy ? '#4caf50' : '#f44336',
            fontSize: '16px'
          }}>
            {isServiceHealthy ? '●' : '●'}
          </span>
          <span style={{ fontSize: '10px' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Compact view */}
      {!isExpanded && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
          <div>
            <span style={{ color: '#888' }}>Ops:</span> {currentMetrics.totalOperations}
          </div>
          <div>
            <span style={{ color: '#888' }}>Avg:</span>{' '}
            <span style={{ 
              color: getPerformanceColor(currentMetrics.averageExecutionTime, PERFORMANCE_THRESHOLDS.averageExecutionTime)
            }}>
              {formatDuration(currentMetrics.averageExecutionTime)}
            </span>
          </div>
          <div>
            <span style={{ color: '#888' }}>Mem:</span>{' '}
            <span style={{ 
              color: getPerformanceColor(currentMetrics.memoryUsage, PERFORMANCE_THRESHOLDS.memoryUsage)
            }}>
              {formatBytes(currentMetrics.memoryUsage)}
            </span>
          </div>
        </div>
      )}

      {/* Expanded view */}
      {isExpanded && showDetails && (
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          {/* Operations */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#ccc', marginBottom: '4px' }}>Operations</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>Total: {currentMetrics.totalOperations}</div>
              <div style={{ color: '#4caf50' }}>Success: {currentMetrics.successfulOperations}</div>
              <div style={{ color: '#f44336' }}>Failed: {currentMetrics.failedOperations}</div>
              <div style={{ 
                color: getPerformanceColor(failureRate, PERFORMANCE_THRESHOLDS.failureRate)
              }}>
                Rate: {(failureRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Performance */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#ccc', marginBottom: '4px' }}>Performance</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                Avg Time:{' '}
                <span style={{ 
                  color: getPerformanceColor(currentMetrics.averageExecutionTime, PERFORMANCE_THRESHOLDS.averageExecutionTime)
                }}>
                  {formatDuration(currentMetrics.averageExecutionTime)}
                </span>
              </div>
              <div>
                Total: {formatDuration(currentMetrics.totalExecutionTime)}
              </div>
              <div>
                Cache Hit:{' '}
                <span style={{ 
                  color: getPerformanceColor(currentMetrics.cacheHitRate, PERFORMANCE_THRESHOLDS.cacheHitRate, true)
                }}>
                  {(currentMetrics.cacheHitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                Memory:{' '}
                <span style={{ 
                  color: getPerformanceColor(currentMetrics.memoryUsage, PERFORMANCE_THRESHOLDS.memoryUsage)
                }}>
                  {formatBytes(currentMetrics.memoryUsage)}
                </span>
              </div>
            </div>
          </div>

          {/* History chart (simple text-based) */}
          {history.length > 1 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#ccc', marginBottom: '4px' }}>
                Execution Time Trend (last {Math.min(history.length, 10)})
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '4px',
                borderRadius: '4px'
              }}>
                {history.slice(-10).map((entry, index) => {
                  const time = entry.metrics.averageExecutionTime;
                  const bar = '█'.repeat(Math.max(1, Math.min(20, Math.floor(time / 2))));
                  const color = getPerformanceColor(time, PERFORMANCE_THRESHOLDS.averageExecutionTime);
                  
                  return (
                    <div key={index} style={{ color }}>
                      {bar} {formatDuration(time)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Last operation */}
          {currentMetrics.lastOperationTime > 0 && (
            <div style={{ fontSize: '10px', color: '#888' }}>
              Last: {new Date(currentMetrics.lastOperationTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Matrix Operation Debugger
 *
 * Advanced debugging tool for matrix operations with operation tracing,
 * error analysis, and performance bottleneck identification.
 */
export interface MatrixOperationDebuggerProps {
  readonly enabled?: boolean;
  readonly maxLogSize?: number;
  readonly showStackTraces?: boolean;
  readonly autoScroll?: boolean;
  readonly className?: string;
}

/**
 * Debug log entry
 */
interface DebugLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  operation?: string;
  readonly message: string;
  readonly data?: any;
  stackTrace?: string;
  readonly executionTime?: number;
}

/**
 * Matrix Operation Debugger Component
 */
export const MatrixOperationDebugger: React.FC<MatrixOperationDebuggerProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  maxLogSize = 100,
  showStackTraces = false,
  autoScroll = true,
  className = ''
}) => {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const logContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Add log entry
   */
  const addLog = useCallback((entry: Omit<DebugLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: DebugLogEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setLogs(prev => {
      const newLogs = [...prev, newEntry];
      return newLogs.slice(-maxLogSize);
    });
  }, [maxLogSize]);

  /**
   * Clear logs
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * Auto-scroll to bottom
   */
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  /**
   * Set up console interception for matrix operations
   */
  useEffect(() => {
    if (!enabled) return;

    const originalConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    // Intercept console methods for matrix-related logs
    const interceptConsole = (level: 'debug' | 'info' | 'warn' | 'error', originalMethod: any) => {
      return (...args: any[]) => {
        originalMethod.apply(console, args);

        const message = args.join(' ');
        if (message.includes('[MatrixOperations]') ||
            message.includes('[MatrixIntegration]') ||
            message.includes('[MatrixConversion]') ||
            message.includes('[MatrixValidation]') ||
            message.includes('[MatrixTelemetry]')) {

          // Extract operation name from log message
          const operationMatch = message.match(/\[(\w+)\]/);
          const operation = operationMatch ? operationMatch[1] : 'Unknown';

          const logPayload: Omit<DebugLogEntry, 'id' | 'timestamp'> = {
            level,
            operation: operation || 'Unknown',
            message,
            data: args.length > 1 ? args.slice(1) : undefined,
          };

          if (showStackTraces) {
            const stack = new Error().stack;
            if (stack) {
              logPayload.stackTrace = stack;
            }
          }

          addLog(logPayload);
        }
      };
    };

    console.debug = interceptConsole('debug', originalConsole.debug);
    console.info = interceptConsole('info', originalConsole.info);
    console.warn = interceptConsole('warn', originalConsole.warn);
    console.error = interceptConsole('error', originalConsole.error);

    return () => {
      // Restore original console methods
      Object.assign(console, originalConsole);
    };
  }, [enabled, addLog, showStackTraces]);

  if (!enabled) {
    return null;
  }

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.level === filter);

  const levelColors = {
    debug: '#888',
    info: '#2196f3',
    warn: '#ff9800',
    error: '#f44336'
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Matrix Operation Debugger"
      >
        🐛
      </button>

      {/* Debugger panel */}
      {isVisible && (
        <div
          className={`matrix-operation-debugger ${className}`}
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '20px',
            width: '600px',
            height: '400px',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            borderRadius: '8px',
            border: '1px solid #333',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '12px'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>
              🐛 Matrix Operation Debugger
            </h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                style={{
                  background: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px'
                }}
              >
                <option value="all">All</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
              <button
                onClick={clearLogs}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Log container */}
          <div
            ref={logContainerRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px',
              fontSize: '11px',
              lineHeight: '1.4'
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>
                No matrix operation logs yet...
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    marginBottom: '8px',
                    padding: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${levelColors[log.level]}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: levelColors[log.level], fontWeight: 'bold' }}>
                      [{log.level.toUpperCase()}] {log.operation}
                    </span>
                    <span style={{ color: '#888', fontSize: '10px' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: '#ccc' }}>
                    {log.message}
                  </div>
                  {log.data && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ color: '#888', cursor: 'pointer', fontSize: '10px' }}>
                        Data
                      </summary>
                      <pre style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        overflow: 'auto',
                        maxHeight: '100px'
                      }}>
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.stackTrace && showStackTraces && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ color: '#888', cursor: 'pointer', fontSize: '10px' }}>
                        Stack Trace
                      </summary>
                      <pre style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        overflow: 'auto',
                        maxHeight: '150px'
                      }}>
                        {log.stackTrace}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
