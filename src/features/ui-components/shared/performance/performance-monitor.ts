/**
 * Performance Monitoring Utilities
 * 
 * Comprehensive performance monitoring for the OpenSCAD 3D visualization pipeline
 * with benchmarking, metrics collection, and optimization recommendations.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

// Performance targets (in milliseconds)
export const PERFORMANCE_TARGETS = {
  AST_PARSING: 300,
  CSG2_CONVERSION: 500,
  MESH_CREATION: 200,
  SCENE_RENDERING: 16, // 60 FPS target
  TOTAL_PIPELINE: 1000
} as const;

// Performance metrics interface
export interface PerformanceMetrics {
  readonly operation: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly target: number;
  readonly withinTarget: boolean;
  readonly timestamp: number;
}

// Performance report interface
export interface PerformanceReport {
  readonly totalDuration: number;
  readonly metrics: readonly PerformanceMetrics[];
  readonly recommendations: readonly string[];
  readonly overallScore: number; // 0-100
}

/**
 * Performance monitor class for tracking pipeline performance
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTiming(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  /**
   * End timing an operation and record metrics
   */
  endTiming(operation: string): PerformanceMetrics | null {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`[PerformanceMonitor] No start time found for operation: ${operation}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const target = this.getTargetForOperation(operation);
    
    const metric: PerformanceMetrics = {
      operation,
      startTime,
      endTime,
      duration,
      target,
      withinTarget: duration <= target,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    this.startTimes.delete(operation);

    // Log performance result
    const status = metric.withinTarget ? 'PASS' : 'FAIL';
    console.log(`[PERF] ${operation}: ${duration.toFixed(2)}ms (target: ${target}ms) - ${status}`);

    return metric;
  }

  /**
   * Get target time for a specific operation
   */
  private getTargetForOperation(operation: string): number {
    const operationLower = operation.toLowerCase();
    
    if (operationLower.includes('ast') || operationLower.includes('parse')) {
      return PERFORMANCE_TARGETS.AST_PARSING;
    }
    if (operationLower.includes('csg2') || operationLower.includes('conversion')) {
      return PERFORMANCE_TARGETS.CSG2_CONVERSION;
    }
    if (operationLower.includes('mesh') || operationLower.includes('creation')) {
      return PERFORMANCE_TARGETS.MESH_CREATION;
    }
    if (operationLower.includes('render') || operationLower.includes('scene')) {
      return PERFORMANCE_TARGETS.SCENE_RENDERING;
    }
    
    return PERFORMANCE_TARGETS.TOTAL_PIPELINE;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        totalDuration: 0,
        metrics: [],
        recommendations: ['No performance data available'],
        overallScore: 0
      };
    }

    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    const passedMetrics = this.metrics.filter(m => m.withinTarget).length;
    const overallScore = Math.round((passedMetrics / this.metrics.length) * 100);
    
    const recommendations = this.generateRecommendations();

    return {
      totalDuration,
      metrics: [...this.metrics],
      recommendations,
      overallScore
    };
  }

  /**
   * Generate optimization recommendations based on metrics
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze each metric for recommendations
    this.metrics.forEach(metric => {
      if (!metric.withinTarget) {
        const overage = metric.duration - metric.target;
        const percentageOver = Math.round((overage / metric.target) * 100);
        
        switch (metric.operation.toLowerCase()) {
          case 'ast_parsing':
            if (percentageOver > 50) {
              recommendations.push('Consider simplifying OpenSCAD code complexity to improve parsing performance');
            } else {
              recommendations.push('AST parsing is slightly slow - check for syntax complexity');
            }
            break;
            
          case 'csg2_conversion':
            if (percentageOver > 100) {
              recommendations.push('CSG2 conversion is very slow - consider reducing boolean operation complexity');
            } else {
              recommendations.push('CSG2 conversion performance could be improved - optimize geometry operations');
            }
            break;
            
          case 'mesh_creation':
            recommendations.push('Mesh creation is slow - consider implementing mesh pooling or LOD');
            break;
            
          case 'scene_rendering':
            recommendations.push('Scene rendering is slow - enable hardware acceleration and reduce polygon count');
            break;
            
          default:
            recommendations.push(`${metric.operation} exceeded target by ${percentageOver}% - investigate optimization opportunities`);
        }
      }
    });

    // General recommendations based on overall performance
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    if (totalTime > PERFORMANCE_TARGETS.TOTAL_PIPELINE) {
      recommendations.push('Overall pipeline performance is slow - consider implementing progressive rendering');
    }

    // Hardware recommendations
    const renderingMetrics = this.metrics.filter(m => 
      m.operation.toLowerCase().includes('render') || 
      m.operation.toLowerCase().includes('scene')
    );
    
    if (renderingMetrics.some(m => !m.withinTarget)) {
      recommendations.push('Consider enabling WebGL hardware acceleration and updating graphics drivers');
    }

    return recommendations.length > 0 ? recommendations : ['Performance is within acceptable targets'];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(operation: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetricsForOperation(operation);
    if (operationMetrics.length === 0) return 0;
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / operationMetrics.length;
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Utility function to measure async operation performance
 */
export async function measurePerformance<T>(
  operation: string,
  asyncFn: () => Promise<T>
): Promise<{ result: T; metrics: PerformanceMetrics | null }> {
  globalPerformanceMonitor.startTiming(operation);
  
  try {
    const result = await asyncFn();
    const metrics = globalPerformanceMonitor.endTiming(operation);
    return { result, metrics };
  } catch (error) {
    globalPerformanceMonitor.endTiming(operation);
    throw error;
  }
}

/**
 * Utility function to measure sync operation performance
 */
export function measureSyncPerformance<T>(
  operation: string,
  syncFn: () => T
): { result: T; metrics: PerformanceMetrics | null } {
  globalPerformanceMonitor.startTiming(operation);
  
  try {
    const result = syncFn();
    const metrics = globalPerformanceMonitor.endTiming(operation);
    return { result, metrics };
  } catch (error) {
    globalPerformanceMonitor.endTiming(operation);
    throw error;
  }
}

/**
 * Performance decorator for methods
 */
export function performanceMonitor(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return measurePerformance(operation, () => method.apply(this, args));
    };
  };
}

export default PerformanceMonitor;
