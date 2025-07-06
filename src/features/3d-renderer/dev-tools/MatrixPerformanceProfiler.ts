/**
 * Matrix Performance Profiler for development tools
 */

export interface MatrixPerformanceMetrics {
  readonly operationCount: number;
  readonly averageExecutionTime: number;
  readonly totalExecutionTime: number;
  readonly memoryUsage: number;
  readonly cacheHitRate: number;
}

export class MatrixPerformanceProfiler {
  private metrics: MatrixPerformanceMetrics = {
    operationCount: 0,
    averageExecutionTime: 0,
    totalExecutionTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
  };

  getMetrics(): MatrixPerformanceMetrics {
    return this.metrics;
  }

  recordOperation(executionTime: number): void {
    this.metrics = {
      ...this.metrics,
      operationCount: this.metrics.operationCount + 1,
      totalExecutionTime: this.metrics.totalExecutionTime + executionTime,
      averageExecutionTime: this.metrics.totalExecutionTime / this.metrics.operationCount,
    };
  }

  reset(): void {
    this.metrics = {
      operationCount: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
    };
  }
}

export const createMatrixPerformanceProfiler = (): MatrixPerformanceProfiler => {
  return new MatrixPerformanceProfiler();
};
