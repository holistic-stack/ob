/**
 * @file Test Case Generator Utility
 * 
 * Generates comprehensive test cases by combining transformations with primitives
 * Following DRY principle by eliminating repetitive test case creation
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import type { TransformationTestCase } from './transformation-test-data';
import type { PrimitiveTestData } from './primitive-test-data';
import {
  getAllTransformationTestCases,
  getTestCasesByType as getTransformationsByType
} from './transformation-test-data';
import {
  getAllPrimitiveTestData,
  getPrimitiveTestDataByType,
  generateTransformationWithPrimitive,
  generateTestCaseName,
  calculateObjectSeparation,
  getRecommendedTimeout
} from './primitive-test-data';

/**
 * Enhanced test case with primitive information
 */
export interface EnhancedTestCase extends TransformationTestCase {
  readonly primitiveInfo: PrimitiveTestData;
  readonly baseOpenscadCode: string; // Original primitive without transformation
  readonly transformedOpenscadCode: string; // Primitive with transformation applied
}

/**
 * Test generation options
 */
export interface TestGenerationOptions {
  readonly includeBasicTests?: boolean;
  readonly includeEdgeCases?: boolean;
  readonly includeComplexTests?: boolean;
  readonly includePerformanceTests?: boolean;
  readonly primitiveTypes?: readonly ('cube' | 'sphere' | 'cylinder')[];
  readonly transformationTypes?: readonly ('translate' | 'rotate' | 'scale' | 'mirror' | 'combined')[];
  readonly maxTestsPerCategory?: number;
}

/**
 * Default test generation options
 */
const defaultOptions: Required<TestGenerationOptions> = {
  includeBasicTests: true,
  includeEdgeCases: true,
  includeComplexTests: true,
  includePerformanceTests: false, // Disabled by default for CI performance
  primitiveTypes: ['cube', 'sphere', 'cylinder'],
  transformationTypes: ['translate', 'rotate', 'scale', 'mirror', 'combined'],
  maxTestsPerCategory: 10
} as const;

/**
 * Generate enhanced test cases by combining transformations with primitives
 */
export const generateEnhancedTestCases = (
  options: TestGenerationOptions = {}
): readonly EnhancedTestCase[] => {
  console.log('[INIT] Generating enhanced test cases with options:', options);
  
  const opts = { ...defaultOptions, ...options };
  const enhancedTestCases: EnhancedTestCase[] = [];

  // Get filtered transformations based on options
  const transformations = getFilteredTransformations(opts);
  console.log(`[DEBUG] Found ${transformations.length} transformations to test`);

  // Get filtered primitives based on options
  const primitives = getFilteredPrimitives(opts);
  console.log(`[DEBUG] Found ${primitives.length} primitives to test`);

  // Generate combinations
  for (const transformation of transformations) {
    for (const primitive of primitives) {
      const enhancedTestCase = createEnhancedTestCase(transformation, primitive);
      enhancedTestCases.push(enhancedTestCase);
    }
  }

  console.log(`[END] Generated ${enhancedTestCases.length} enhanced test cases`);
  return enhancedTestCases;
};

/**
 * Get filtered transformations based on options
 */
const getFilteredTransformations = (options: Required<TestGenerationOptions>): readonly TransformationTestCase[] => {
  const allTransformations = getAllTransformationTestCases();
  
  // Filter by category
  const filteredByCategory = allTransformations.filter(transformation => {
    switch (transformation.category) {
      case 'basic': return options.includeBasicTests;
      case 'edge-case': return options.includeEdgeCases;
      case 'complex': return options.includeComplexTests;
      case 'performance': return options.includePerformanceTests;
      default: return false;
    }
  });

  // Filter by transformation type
  const filteredByType = filteredByCategory.filter(transformation => {
    const transformationType = getTransformationType(transformation.name);
    return options.transformationTypes.includes(transformationType);
  });

  // Limit per category if specified
  if (options.maxTestsPerCategory < Number.MAX_SAFE_INTEGER) {
    const limitedTests: TransformationTestCase[] = [];
    const categoryCounts = new Map<string, number>();

    for (const transformation of filteredByType) {
      const currentCount = categoryCounts.get(transformation.category) || 0;
      if (currentCount < options.maxTestsPerCategory) {
        limitedTests.push(transformation);
        categoryCounts.set(transformation.category, currentCount + 1);
      }
    }

    return limitedTests;
  }

  return filteredByType;
};

/**
 * Get filtered primitives based on options
 */
const getFilteredPrimitives = (options: Required<TestGenerationOptions>): readonly PrimitiveTestData[] => {
  const allPrimitives = getAllPrimitiveTestData();
  
  return allPrimitives.filter(primitive => {
    const primitiveType = getPrimitiveType(primitive.name);
    return options.primitiveTypes.includes(primitiveType);
  });
};

/**
 * Create enhanced test case from transformation and primitive
 */
const createEnhancedTestCase = (
  transformation: TransformationTestCase,
  primitive: PrimitiveTestData
): EnhancedTestCase => {
  const baseOpenscadCode = primitive.openscadCode;
  const transformedOpenscadCode = generateTransformationWithPrimitive(
    transformation.openscadCode.split(') ')[0] + ')',
    primitive
  );

  const enhancedName = generateTestCaseName(transformation.name, primitive.name);
  const objectSeparation = Math.max(
    transformation.objectSeparation || 25,
    calculateObjectSeparation(primitive)
  );
  const timeout = Math.max(
    transformation.timeout || 4000,
    getRecommendedTimeout(primitive)
  );

  return {
    ...transformation,
    name: enhancedName,
    description: `${transformation.description} using ${primitive.description}`,
    openscadCode: transformedOpenscadCode,
    primitiveInfo: primitive,
    baseOpenscadCode,
    transformedOpenscadCode,
    objectSeparation,
    timeout
  };
};

/**
 * Extract transformation type from test case name
 */
const getTransformationType = (testCaseName: string): 'translate' | 'rotate' | 'scale' | 'mirror' | 'combined' => {
  if (testCaseName.startsWith('translate')) return 'translate';
  if (testCaseName.startsWith('rotate')) return 'rotate';
  if (testCaseName.startsWith('scale')) return 'scale';
  if (testCaseName.startsWith('mirror')) return 'mirror';
  return 'combined';
};

/**
 * Extract primitive type from primitive name
 */
const getPrimitiveType = (primitiveName: string): 'cube' | 'sphere' | 'cylinder' => {
  if (primitiveName.startsWith('cube')) return 'cube';
  if (primitiveName.startsWith('sphere')) return 'sphere';
  if (primitiveName.startsWith('cylinder')) return 'cylinder';
  throw new Error(`Unknown primitive type for name: ${primitiveName}`);
};

/**
 * Generate test cases for specific transformation type and primitive type
 */
export const generateTestCasesForTypes = (
  transformationType: 'translate' | 'rotate' | 'scale' | 'mirror' | 'combined',
  primitiveType: 'cube' | 'sphere' | 'cylinder'
): readonly EnhancedTestCase[] => {
  console.log(`[INIT] Generating test cases for ${transformationType} with ${primitiveType}`);
  
  const transformations = getTransformationsByType(transformationType);
  const primitives = getPrimitiveTestDataByType(primitiveType);
  
  const testCases: EnhancedTestCase[] = [];
  
  for (const transformation of transformations) {
    for (const primitive of primitives) {
      const enhancedTestCase = createEnhancedTestCase(transformation, primitive);
      testCases.push(enhancedTestCase);
    }
  }
  
  console.log(`[END] Generated ${testCases.length} test cases for ${transformationType}-${primitiveType}`);
  return testCases;
};

/**
 * Generate performance test cases (subset for CI/CD)
 */
export const generatePerformanceTestCases = (): readonly EnhancedTestCase[] => {
  console.log('[INIT] Generating performance test cases');
  
  return generateEnhancedTestCases({
    includeBasicTests: true,
    includeEdgeCases: false,
    includeComplexTests: false,
    includePerformanceTests: false,
    primitiveTypes: ['cube'], // Only cubes for performance
    transformationTypes: ['translate', 'rotate', 'scale', 'mirror'],
    maxTestsPerCategory: 2 // Limit for CI performance
  });
};

/**
 * Generate comprehensive test cases (all combinations)
 */
export const generateComprehensiveTestCases = (): readonly EnhancedTestCase[] => {
  console.log('[INIT] Generating comprehensive test cases');
  
  return generateEnhancedTestCases({
    includeBasicTests: true,
    includeEdgeCases: true,
    includeComplexTests: true,
    includePerformanceTests: true,
    primitiveTypes: ['cube', 'sphere', 'cylinder'],
    transformationTypes: ['translate', 'rotate', 'scale', 'mirror', 'combined'],
    maxTestsPerCategory: Number.MAX_SAFE_INTEGER
  });
};

/**
 * Generate test cases by category
 */
export const generateTestCasesByCategory = (
  category: 'basic' | 'edge-case' | 'complex' | 'performance'
): readonly EnhancedTestCase[] => {
  console.log(`[INIT] Generating test cases for category: ${category}`);
  
  const options: TestGenerationOptions = {
    includeBasicTests: category === 'basic',
    includeEdgeCases: category === 'edge-case',
    includeComplexTests: category === 'complex',
    includePerformanceTests: category === 'performance'
  };
  
  return generateEnhancedTestCases(options);
};
