/**
 * @file Transformation Test Data Module Index
 * 
 * Centralized exports for transformation test data generation
 * Following DRY principle by providing single import point
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

// Transformation test data
export type { TransformationTestCase } from './transformation-test-data';
export {
  translateTestCases,
  rotateTestCases,
  scaleTestCases,
  mirrorTestCases,
  combinedTestCases,
  getAllTransformationTestCases,
  getTestCasesByCategory,
  getTestCasesByType
} from './transformation-test-data';

// Primitive test data
export type { PrimitiveTestData } from './primitive-test-data';
export {
  cubeTestData,
  sphereTestData,
  cylinderTestData,
  getAllPrimitiveTestData,
  getPrimitiveTestDataByType,
  getPrimitiveTestDataByComplexity,
  generateTransformationWithPrimitive,
  generateTestCaseName,
  calculateObjectSeparation,
  getRecommendedTimeout
} from './primitive-test-data';

// Test case generator
export type { EnhancedTestCase, TestGenerationOptions } from './test-case-generator';
export {
  generateEnhancedTestCases,
  generateTestCasesForTypes,
  generatePerformanceTestCases,
  generateComprehensiveTestCases,
  generateTestCasesByCategory
} from './test-case-generator';
