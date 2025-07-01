/**
 * 3D Renderer Testing Utilities - Barrel Exports
 *
 * Comprehensive testing infrastructure for the 3D renderer feature
 * following bulletproof-react architecture and TDD methodology.
 */

// Integration testing suite
export * from './integration-test-suite';
// Matrix testing utilities
export * from './matrix-test-utils';

/**
 * Testing utilities summary:
 *
 * Matrix Test Utils:
 * - MatrixTestDataGenerator: Generate test matrices with various properties
 * - PerformanceAssertion: Assert performance and numerical accuracy
 * - MatrixOperationTester: Test matrix operations with edge cases
 *
 * Integration Test Suite:
 * - IntegrationTestSuite: Test complete OpenSCAD processing pipeline
 * - Pipeline testing: Monaco Editor → AST → CSG → Three.js rendering
 * - Performance validation and visual output verification
 *
 * Usage Examples:
 *
 * ```typescript
 * // Matrix testing
 * import { matrixOperationTester } from './testing';
 *
 * const result = await matrixOperationTester.testMatrixOperation(
 *   async (matrix) => someMatrixOperation(matrix),
 *   'operation_name'
 * );
 *
 * // Integration testing
 * import { integrationTestSuite } from './testing';
 *
 * const pipelineResult = await integrationTestSuite.testCompletePipeline(
 *   'cube([10,10,10]);',
 *   'cube'
 * );
 *
 * // Multiple primitives testing
 * const multiResult = await integrationTestSuite.testMultiplePrimitives();
 * ```
 */
