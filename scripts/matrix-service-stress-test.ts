#!/usr/bin/env node

/**
 * Matrix Service Stress Test Runner
 *
 * Comprehensive stress testing script for MatrixService with same parameters as test suite.
 * Collects latency & failure histograms and identifies hotspots causing 66-88ms validation times.
 */

import { writeFileSync } from 'fs';
import { Matrix } from 'ml-matrix';
import { join } from 'path';
import { Euler, Matrix4 } from 'three';
import { MatrixIntegrationService } from '../src/features/3d-renderer/services/matrix-integration.service.js';
import { MatrixServiceContainer } from '../src/features/3d-renderer/services/matrix-service-container.js';
import type { DiagnosticReport } from '../src/features/3d-renderer/services/matrix-service-diagnostics.js';
import { matrixServiceDiagnostics } from '../src/features/3d-renderer/services/matrix-service-diagnostics.js';
import { createLogger } from '../src/shared/services/logger.service.js';

const logger = createLogger('MatrixStressTest');

/**
 * Stress test configuration using same parameters as test suite
 */
const STRESS_TEST_CONFIG = {
  // Based on LOAD_TEST_CONFIG from matrix-service-load.test.ts
  light: {
    operationCount: 100,
    concurrentOperations: 5,
    matrixSize: 10,
    timeoutMs: 5000,
  },
  medium: {
    operationCount: 500,
    concurrentOperations: 20,
    matrixSize: 50,
    timeoutMs: 15000,
  },
  heavy: {
    operationCount: 1000,
    concurrentOperations: 50,
    matrixSize: 100,
    timeoutMs: 30000,
  },
  stress: {
    operationCount: 2000,
    concurrentOperations: 100,
    matrixSize: 200,
    timeoutMs: 60000,
  },
  // Extended stress for hotspot identification
  validation_focused: {
    operationCount: 1500,
    concurrentOperations: 30,
    matrixSize: 80,
    timeoutMs: 45000,
    validationIntensive: true,
  },
};

/**
 * Performance thresholds for hotspot identification
 */
const PERFORMANCE_THRESHOLDS = {
  validationLatencyTarget: 66, // ms - Lower bound of problematic range
  validationLatencyMax: 88, // ms - Upper bound of problematic range
  telemetryLatencyMax: 5, // ms - Telemetry should be sub-5ms
  bootstrapLatencyMax: 100, // ms - Bootstrap should be sub-100ms
  failureRateMax: 0.05, // 5% max failure rate
};

/**
 * Create test matrix of specified size
 */
function createTestMatrix(size: number): Matrix {
  const data: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(Math.random() * 100);
    }
    data.push(row);
  }
  return new Matrix(data);
}

/**
 * Create test Matrix4 with random rotation
 */
function createTestMatrix4(): Matrix4 {
  const euler = new Euler(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    'XYZ'
  );
  return new Matrix4().makeRotationFromEuler(euler);
}

/**
 * Create challenging matrix for validation stress testing
 */
function createChallengingMatrix(size: number): Matrix {
  // Create matrices that are likely to trigger edge cases in validation
  const matrixTypes = [
    // Near-singular matrix
    () => {
      const data: number[][] = [];
      for (let i = 0; i < size; i++) {
        const row: number[] = [];
        for (let j = 0; j < size; j++) {
          if (i === j) {
            row.push(1e-10); // Very small diagonal values
          } else {
            row.push(Math.random() * 0.1);
          }
        }
        data.push(row);
      }
      return new Matrix(data);
    },
    // Ill-conditioned matrix
    () => {
      const data: number[][] = [];
      for (let i = 0; i < size; i++) {
        const row: number[] = [];
        for (let j = 0; j < size; j++) {
          if (i === j) {
            row.push(10 ** i); // Exponentially increasing diagonal
          } else {
            row.push(Math.random());
          }
        }
        data.push(row);
      }
      return new Matrix(data);
    },
    // Regular matrix for baseline
    () => createTestMatrix(size),
  ];

  const typeIndex = Math.floor(Math.random() * matrixTypes.length);
  return matrixTypes[typeIndex]!();
}

/**
 * Run stress test for a specific configuration
 */
async function runStressTest(
  config: typeof STRESS_TEST_CONFIG.light,
  testName: string,
  serviceContainer: MatrixServiceContainer,
  integrationService: MatrixIntegrationService
): Promise<void> {
  logger.info(`Starting stress test: ${testName}`);
  logger.info(`Configuration:`, config);

  const results: Array<{ success: boolean; latency: number; operation: string }> = [];
  const startTime = Date.now();

  try {
    // Sequential operations to establish baseline
    logger.info(`Running ${config.operationCount} sequential operations...`);

    for (let i = 0; i < config.operationCount; i++) {
      const operationStart = performance.now();

      try {
        if (config.validationIntensive) {
          // Focus on validation operations to identify 66-88ms issues
          const testMatrix = createChallengingMatrix(config.matrixSize);
          const validationService = serviceContainer.getValidationService();

          if (validationService) {
            const result = await validationService.validateMatrix(testMatrix, {
              useCache: false,
              computeEigenvalues: true,
              computeSVD: true,
              enableDetailedAnalysis: true,
              tolerance: 1e-10,
            });

            const latency = performance.now() - operationStart;
            results.push({
              success: result.success,
              latency,
              operation: 'validation_comprehensive',
            });

            // Log high-latency validations immediately for analysis
            if (latency >= PERFORMANCE_THRESHOLDS.validationLatencyTarget) {
              logger.warn(`High validation latency detected: ${latency.toFixed(2)}ms`, {
                matrixSize: config.matrixSize,
                iteration: i,
                success: result.success,
              });
            }
          }
        } else {
          // Mixed operations similar to load tests
          const operations = [
            async () => {
              const matrix4 = createTestMatrix4();
              return await integrationService.convertMatrix4ToMLMatrix(matrix4, {
                useValidation: true,
                useTelemetry: true,
              });
            },
            async () => {
              const matrix = createTestMatrix(Math.min(config.matrixSize, 20));
              const validationService = serviceContainer.getValidationService();
              if (!validationService) throw new Error('Validation service not available');
              return await validationService.validateMatrix(matrix, {
                useCache: false,
                tolerance: 1e-10,
              });
            },
            async () => {
              const matrix4 = createTestMatrix4();
              const conversionResult = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
                useValidation: false,
                useTelemetry: false,
              });
              if (conversionResult.success) {
                return await integrationService.performRobustInversion(
                  conversionResult.data.result
                );
              }
              return conversionResult;
            },
          ];

          const operationIndex = i % operations.length;
          const operation = operations[operationIndex]!;
          const operationName = ['conversion', 'validation', 'inversion'][operationIndex]!;

          const result = await operation();
          const latency = performance.now() - operationStart;

          results.push({
            success: result.success,
            latency,
            operation: operationName,
          });
        }
      } catch (error) {
        const latency = performance.now() - operationStart;
        results.push({
          success: false,
          latency,
          operation: config.validationIntensive ? 'validation_comprehensive' : 'mixed',
        });

        logger.error(`Operation ${i} failed:`, error);
      }

      // Progress logging
      if ((i + 1) % Math.max(1, Math.floor(config.operationCount / 10)) === 0) {
        const progress = (((i + 1) / config.operationCount) * 100).toFixed(1);
        logger.info(`Progress: ${progress}% (${i + 1}/${config.operationCount})`);
      }
    }

    // Concurrent operations stress test
    if (config.concurrentOperations > 1) {
      logger.info(`Running ${config.concurrentOperations} concurrent operations...`);

      const concurrentPromises: Promise<void>[] = [];

      for (let batch = 0; batch < Math.min(5, config.concurrentOperations); batch++) {
        const batchPromise = (async () => {
          for (let i = 0; i < Math.floor(config.operationCount / 10); i++) {
            const operationStart = performance.now();

            try {
              const matrix4 = createTestMatrix4();
              const result = await integrationService.convertMatrix4ToMLMatrix(matrix4, {
                useValidation: true,
                useTelemetry: true,
              });

              const latency = performance.now() - operationStart;
              results.push({
                success: result.success,
                latency,
                operation: 'concurrent_conversion',
              });
            } catch (error) {
              const latency = performance.now() - operationStart;
              results.push({
                success: false,
                latency,
                operation: 'concurrent_conversion',
              });
            }
          }
        })();

        concurrentPromises.push(batchPromise);
      }

      await Promise.allSettled(concurrentPromises);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Calculate basic metrics
    const totalOperations = results.length;
    const successfulOperations = results.filter((r) => r.success).length;
    const failureRate = (totalOperations - successfulOperations) / totalOperations;
    const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / totalOperations;
    const maxLatency = Math.max(...results.map((r) => r.latency));

    logger.info(`Stress test ${testName} completed:`, {
      totalTime: `${totalTime}ms`,
      totalOperations,
      successfulOperations,
      failureRate: `${(failureRate * 100).toFixed(2)}%`,
      averageLatency: `${averageLatency.toFixed(2)}ms`,
      maxLatency: `${maxLatency.toFixed(2)}ms`,
      operationsPerSecond: (totalOperations / (totalTime / 1000)).toFixed(2),
    });

    // Identify problematic validation latencies
    const validationResults = results.filter((r) => r.operation.includes('validation'));
    const highLatencyValidations = validationResults.filter(
      (r) =>
        r.latency >= PERFORMANCE_THRESHOLDS.validationLatencyTarget &&
        r.latency <= PERFORMANCE_THRESHOLDS.validationLatencyMax
    );

    if (highLatencyValidations.length > 0) {
      logger.warn(
        `Found ${highLatencyValidations.length} validation operations in 66-88ms range:`,
        {
          averageLatency: (
            highLatencyValidations.reduce((sum, r) => sum + r.latency, 0) /
            highLatencyValidations.length
          ).toFixed(2),
          count: highLatencyValidations.length,
          percentage: ((highLatencyValidations.length / validationResults.length) * 100).toFixed(1),
        }
      );
    }
  } catch (error) {
    logger.error(`Stress test ${testName} failed:`, error);
    throw error;
  }
}

/**
 * Analyze diagnostic report for hotspots
 */
function analyzeHotspots(report: DiagnosticReport): void {
  logger.info('=== HOTSPOT ANALYSIS ===');

  // Overall summary
  logger.info('Performance Summary:', {
    totalOperations: report.summary.totalOperations,
    averageLatency: `${report.summary.averageLatency.toFixed(2)}ms`,
    failureRate: `${(report.summary.overallFailureRate * 100).toFixed(2)}%`,
    criticalHotspots: report.summary.criticalHotspots,
    validationP99: `${report.summary.validationLatencyP99.toFixed(2)}ms`,
    telemetryP99: `${report.summary.telemetryLatencyP99.toFixed(2)}ms`,
    bootstrapLatency: `${report.summary.bootstrapLatency.toFixed(2)}ms`,
  });

  // Validation hotspot analysis
  const validationHotspots = report.hotspots.filter((h) => h.type === 'validation');
  if (validationHotspots.length > 0) {
    logger.info('\n=== VALIDATION HOTSPOTS ===');
    for (const hotspot of validationHotspots) {
      logger.info(`Operation: ${hotspot.operation}`, {
        severity: hotspot.severity,
        averageLatency: `${hotspot.averageLatency.toFixed(2)}ms`,
        p99Latency: `${hotspot.p99Latency.toFixed(2)}ms`,
        failureRate: `${(hotspot.failureRate * 100).toFixed(2)}%`,
        recommendations: hotspot.recommendations,
      });

      // Flag 66-88ms validation issues
      if (
        hotspot.p99Latency >= PERFORMANCE_THRESHOLDS.validationLatencyTarget &&
        hotspot.p99Latency <= PERFORMANCE_THRESHOLDS.validationLatencyMax
      ) {
        logger.warn(`🎯 IDENTIFIED: ${hotspot.operation} is in the 66-88ms problematic range!`);
      }
    }
  }

  // Telemetry counter mutation analysis
  const telemetryHotspots = report.hotspots.filter((h) => h.type === 'telemetry');
  if (telemetryHotspots.length > 0) {
    logger.info('\n=== TELEMETRY COUNTER MUTATION HOTSPOTS ===');
    for (const hotspot of telemetryHotspots) {
      logger.info(`Operation: ${hotspot.operation}`, {
        severity: hotspot.severity,
        averageLatency: `${hotspot.averageLatency.toFixed(2)}ms`,
        recommendations: hotspot.recommendations,
      });
    }
  }

  // Bootstrap analysis
  const bootstrapHotspots = report.hotspots.filter((h) => h.type === 'bootstrap');
  if (bootstrapHotspots.length > 0) {
    logger.info('\n=== BOOTSTRAP HOTSPOTS ===');
    for (const hotspot of bootstrapHotspots) {
      logger.info(`Operation: ${hotspot.operation}`, {
        severity: hotspot.severity,
        averageLatency: `${hotspot.averageLatency.toFixed(2)}ms`,
        recommendations: hotspot.recommendations,
      });
    }
  }

  // Critical recommendations
  const criticalHotspots = report.hotspots.filter((h) => h.severity === 'critical');
  if (criticalHotspots.length > 0) {
    logger.error('\n🚨 CRITICAL HOTSPOTS REQUIRING IMMEDIATE ATTENTION:');
    for (const hotspot of criticalHotspots) {
      logger.error(
        `- ${hotspot.operation}: ${hotspot.p99Latency.toFixed(2)}ms P99, ${(hotspot.failureRate * 100).toFixed(2)}% failure rate`
      );
    }
  }
}

/**
 * Export detailed report to file
 */
function exportReport(report: DiagnosticReport, testSuite: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `matrix-service-stress-report-${testSuite}-${timestamp}.json`;
  const filepath = join(process.cwd(), 'reports', filename);

  try {
    // Create reports directory if it doesn't exist
    const fs = require('fs');
    const reportsDir = join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Convert Maps to objects for JSON serialization
    const serializedReport = {
      ...report,
      latencyHistograms: Object.fromEntries(
        Array.from(report.latencyHistograms.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            buckets: Object.fromEntries(value.buckets),
          },
        ])
      ),
      failureHistograms: Object.fromEntries(
        Array.from(report.failureHistograms.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            failuresByType: Object.fromEntries(value.failuresByType),
            failuresByLatency: Object.fromEntries(value.failuresByLatency),
          },
        ])
      ),
    };

    writeFileSync(filepath, JSON.stringify(serializedReport, null, 2));
    logger.info(`Detailed report exported to: ${filepath}`);

    // Also export measurements for external analysis
    const measurementsFile = join(reportsDir, `measurements-${testSuite}-${timestamp}.json`);
    writeFileSync(measurementsFile, matrixServiceDiagnostics.exportMeasurements());
    logger.info(`Raw measurements exported to: ${measurementsFile}`);
  } catch (error) {
    logger.error('Failed to export report:', error);
  }
}

/**
 * Main stress test runner
 */
async function main(): Promise<void> {
  const testSuite = process.argv[2] || 'all';
  const validTestSuites = ['light', 'medium', 'heavy', 'stress', 'validation_focused', 'all'];

  if (!validTestSuites.includes(testSuite)) {
    logger.error(`Invalid test suite. Available options: ${validTestSuites.join(', ')}`);
    process.exit(1);
  }

  logger.info('🚀 Starting Matrix Service Stress Test Runner');
  logger.info(`Test suite: ${testSuite}`);
  logger.info(`Performance thresholds:`, PERFORMANCE_THRESHOLDS);

  let serviceContainer: MatrixServiceContainer;
  let integrationService: MatrixIntegrationService;

  try {
    // Initialize services
    logger.info('Initializing services...');
    serviceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    integrationService = new MatrixIntegrationService(serviceContainer);

    // Reset diagnostics for clean test
    matrixServiceDiagnostics.reset();
    matrixServiceDiagnostics.enable();

    // Run selected test suites
    const suitesToRun =
      testSuite === 'all'
        ? ['light', 'medium', 'heavy', 'stress', 'validation_focused']
        : [testSuite];

    for (const suite of suitesToRun) {
      const config = STRESS_TEST_CONFIG[suite as keyof typeof STRESS_TEST_CONFIG];
      await runStressTest(config, suite, serviceContainer, integrationService);

      // Brief pause between test suites
      if (suitesToRun.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Generate comprehensive diagnostic report
    logger.info('\n📊 Generating diagnostic report...');
    const report = matrixServiceDiagnostics.generateReport();

    // Analyze hotspots
    analyzeHotspots(report);

    // Export detailed report
    exportReport(report, testSuite);

    logger.info('\n✅ Stress test completed successfully');
  } catch (error) {
    logger.error('❌ Stress test failed:', error);
    process.exit(1);
  } finally {
    try {
      if (integrationService) {
        await integrationService.shutdown();
      }
      matrixServiceDiagnostics.disable();
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }
}

// Run the stress test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runStressTest };
