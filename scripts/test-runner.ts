#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 *
 * Orchestrates the complete test suite for the OpenSCAD 3D visualization pipeline
 * including unit tests, integration tests, visual regression tests, and performance benchmarks.
 *
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ============================================================================
// Configuration
// ============================================================================

interface TestConfig {
  readonly name: string;
  readonly command: string;
  readonly timeout: number;
  readonly required: boolean;
  readonly description: string;
}

const TEST_SUITES: TestConfig[] = [
  {
    name: 'unit',
    command: 'vitest run --config vitest.config.ts',
    timeout: 120000, // 2 minutes
    required: true,
    description: 'Unit tests for individual components and utilities',
  },
  {
    name: 'integration',
    command: 'vitest run --config vitest.config.integration.ts',
    timeout: 300000, // 5 minutes
    required: true,
    description: 'Integration tests for complete data flow pipeline',
  },
  {
    name: 'visual',
    command: 'playwright test --config playwright-ct.config.ts',
    timeout: 600000, // 10 minutes
    required: false,
    description: 'Visual regression tests for 3D rendering',
  },
  {
    name: 'performance',
    command: 'vitest bench --config vitest.config.ts',
    timeout: 180000, // 3 minutes
    required: false,
    description: 'Performance benchmarks and stress tests',
  },
  {
    name: 'e2e',
    command: 'playwright test --config playwright.config.ts',
    timeout: 900000, // 15 minutes
    required: false,
    description: 'End-to-end tests in real browser environment',
  },
];

// ============================================================================
// Test Results Interface
// ============================================================================

interface TestResult {
  readonly suite: string;
  readonly success: boolean;
  readonly duration: number;
  readonly output: string;
  readonly error?: string;
  readonly coverage?: CoverageResult;
}

interface CoverageResult {
  readonly lines: number;
  readonly functions: number;
  readonly branches: number;
  readonly statements: number;
}

interface TestReport {
  readonly timestamp: string;
  readonly totalDuration: number;
  readonly results: readonly TestResult[];
  readonly summary: {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
  };
  readonly overallCoverage?: CoverageResult;
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
  const colors = {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    success: '\x1b[32m', // Green
    reset: '\x1b[0m',
  };

  const timestamp = new Date().toISOString();
  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
}

function ensureDirectoryExists(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ============================================================================
// Test Execution
// ============================================================================

async function runTestSuite(config: TestConfig): Promise<TestResult> {
  log(`Starting ${config.name} tests: ${config.description}`, 'info');

  const startTime = Date.now();

  try {
    const output = execSync(config.command, {
      encoding: 'utf8',
      timeout: config.timeout,
      stdio: 'pipe',
    });

    const duration = Date.now() - startTime;

    log(`✓ ${config.name} tests completed in ${formatDuration(duration)}`, 'success');

    return {
      suite: config.name,
      success: true,
      duration,
      output,
      coverage: extractCoverage(output),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error';
    const output = error.stdout || error.output || '';

    log(`✗ ${config.name} tests failed after ${formatDuration(duration)}`, 'error');
    log(`Error: ${errorMessage}`, 'error');

    return {
      suite: config.name,
      success: false,
      duration,
      output,
      error: errorMessage,
      coverage: extractCoverage(output),
    };
  }
}

function extractCoverage(output: string): CoverageResult | undefined {
  // Simple regex-based coverage extraction
  // In a real implementation, you'd parse JSON coverage reports
  const coverageMatch = output.match(
    /Lines\s*:\s*(\d+\.?\d*)%.*Functions\s*:\s*(\d+\.?\d*)%.*Branches\s*:\s*(\d+\.?\d*)%.*Statements\s*:\s*(\d+\.?\d*)%/s
  );

  if (coverageMatch) {
    return {
      lines: parseFloat(coverageMatch[1]),
      functions: parseFloat(coverageMatch[2]),
      branches: parseFloat(coverageMatch[3]),
      statements: parseFloat(coverageMatch[4]),
    };
  }

  return undefined;
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(results: TestResult[]): TestReport {
  const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const skipped = TEST_SUITES.length - results.length;

  // Calculate overall coverage (weighted average)
  const coverageResults = results.filter((r) => r.coverage);
  const overallCoverage =
    coverageResults.length > 0
      ? {
          lines:
            coverageResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) /
            coverageResults.length,
          functions:
            coverageResults.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) /
            coverageResults.length,
          branches:
            coverageResults.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) /
            coverageResults.length,
          statements:
            coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) /
            coverageResults.length,
        }
      : undefined;

  return {
    timestamp: new Date().toISOString(),
    totalDuration,
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
    },
    overallCoverage,
  };
}

function saveReport(report: TestReport): void {
  const reportsDir = join(process.cwd(), 'test-results');
  ensureDirectoryExists(reportsDir);

  const reportPath = join(reportsDir, `test-report-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`Test report saved to: ${reportPath}`, 'info');
}

function printSummary(report: TestReport): void {
  log(`\n${'='.repeat(80)}`, 'info');
  log('TEST SUMMARY', 'info');
  log('='.repeat(80), 'info');

  log(`Total Duration: ${formatDuration(report.totalDuration)}`, 'info');
  log(`Tests Run: ${report.summary.total}`, 'info');
  log(`Passed: ${report.summary.passed}`, report.summary.passed > 0 ? 'success' : 'info');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
  log(`Skipped: ${report.summary.skipped}`, report.summary.skipped > 0 ? 'warn' : 'info');

  if (report.overallCoverage) {
    log('\nCOVERAGE SUMMARY:', 'info');
    log(`Lines: ${report.overallCoverage.lines.toFixed(1)}%`, 'info');
    log(`Functions: ${report.overallCoverage.functions.toFixed(1)}%`, 'info');
    log(`Branches: ${report.overallCoverage.branches.toFixed(1)}%`, 'info');
    log(`Statements: ${report.overallCoverage.statements.toFixed(1)}%`, 'info');
  }

  log('\nDETAILED RESULTS:', 'info');
  report.results.forEach((result) => {
    const status = result.success ? '✓' : '✗';
    const level = result.success ? 'success' : 'error';
    log(`${status} ${result.suite}: ${formatDuration(result.duration)}`, level);

    if (result.error) {
      log(`  Error: ${result.error}`, 'error');
    }

    if (result.coverage) {
      log(`  Coverage: ${result.coverage.lines.toFixed(1)}% lines`, 'info');
    }
  });

  log('='.repeat(80), 'info');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = {
    skipOptional: args.includes('--skip-optional'),
    suiteFilter: args.find((arg) => arg.startsWith('--suite='))?.split('=')[1],
    verbose: args.includes('--verbose'),
    coverage: args.includes('--coverage'),
    ci: args.includes('--ci'),
  };

  log('Starting OpenSCAD Pipeline Test Suite', 'info');
  log(`Options: ${JSON.stringify(options)}`, 'info');

  // Filter test suites based on options
  let suitesToRun = TEST_SUITES;

  if (options.skipOptional) {
    suitesToRun = suitesToRun.filter((suite) => suite.required);
  }

  if (options.suiteFilter) {
    suitesToRun = suitesToRun.filter((suite) => suite.name === options.suiteFilter);
  }

  if (suitesToRun.length === 0) {
    log('No test suites to run', 'warn');
    process.exit(0);
  }

  log(`Running ${suitesToRun.length} test suite(s)`, 'info');

  // Run test suites
  const results: TestResult[] = [];

  for (const suite of suitesToRun) {
    try {
      const result = await runTestSuite(suite);
      results.push(result);

      // Stop on first failure in CI mode
      if (options.ci && !result.success) {
        log('Stopping on first failure (CI mode)', 'error');
        break;
      }
    } catch (error) {
      log(`Failed to run ${suite.name} tests: ${error}`, 'error');
      results.push({
        suite: suite.name,
        success: false,
        duration: 0,
        output: '',
        error: String(error),
      });
    }
  }

  // Generate and save report
  const report = generateReport(results);
  saveReport(report);
  printSummary(report);

  // Exit with appropriate code
  const hasFailures = results.some((r) => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// ============================================================================
// Error Handling
// ============================================================================

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`, 'error');
  process.exit(1);
});

// Run the test suite
if (require.main === module) {
  main().catch((error) => {
    log(`Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  });
}
