/**
 * @file Comprehensive Transformation Tests Index
 * 
 * Centralized exports for comprehensive transformation visual regression tests
 * Following DRY principle by providing single import point
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

/**
 * Re-export test data utilities for use in comprehensive tests
 */
export * from '../transformation-test-data';

/**
 * Test file documentation for reference
 * 
 * This module contains comprehensive visual regression tests for all OpenSCAD transformations:
 * 
 * - translate-comprehensive.vspec.tsx: Translate transformation tests with all primitive types
 * - rotate-comprehensive.vspec.tsx: Rotate transformation tests with all primitive types  
 * - scale-comprehensive.vspec.tsx: Scale transformation tests with all primitive types
 * - mirror-comprehensive.vspec.tsx: Mirror transformation tests with all primitive types
 * - combined-comprehensive.vspec.tsx: Combined transformation tests with complex scenarios
 * 
 * Each test file follows TDD, DRY, KISS, and SRP principles:
 * - TDD: Tests are written first, implementation follows
 * - DRY: Common test data and utilities are shared
 * - KISS: Simple, focused test cases
 * - SRP: Each test file has single responsibility
 * 
 * Test execution patterns:
 * - Individual test: npx playwright test [file].vspec.tsx --workers=1 --grep="test-name"
 * - Full suite: npx playwright test comprehensive-transformation-tests/ --workers=1
 * - Update snapshots: Add --update-snapshots flag
 * - Debug mode: Add --debug flag
 * 
 * Performance considerations:
 * - Use --workers=1 for visual regression tests to avoid resource conflicts
 * - Tests include performance assertions with reasonable timeout limits
 * - Complex transformations have longer wait times for rendering completion
 * 
 * Visual verification features:
 * - Side-by-side comparison of reference vs transformed objects
 * - Scale reference grids and coordinate axes for spatial context
 * - Distinct materials (gray vs white) for clear visual differentiation
 * - Automatic camera positioning for optimal viewing angles
 * - Comprehensive logging for debugging and verification
 */

/**
 * Test execution utilities
 */
export const TEST_EXECUTION_COMMANDS = {
  // Individual transformation type tests
  TRANSLATE_TESTS: 'npx playwright test translate-comprehensive.vspec.tsx --config=playwright-ct.config.ts --workers=1',
  ROTATE_TESTS: 'npx playwright test rotate-comprehensive.vspec.tsx --config=playwright-ct.config.ts --workers=1',
  SCALE_TESTS: 'npx playwright test scale-comprehensive.vspec.tsx --config=playwright-ct.config.ts --workers=1',
  MIRROR_TESTS: 'npx playwright test mirror-comprehensive.vspec.tsx --config=playwright-ct.config.ts --workers=1',
  COMBINED_TESTS: 'npx playwright test combined-comprehensive.vspec.tsx --config=playwright-ct.config.ts --workers=1',
  
  // Full comprehensive test suite
  ALL_COMPREHENSIVE_TESTS: 'npx playwright test comprehensive-transformation-tests/ --config=playwright-ct.config.ts --workers=1',
  
  // Update snapshots
  UPDATE_SNAPSHOTS: 'npx playwright test comprehensive-transformation-tests/ --config=playwright-ct.config.ts --workers=1 --update-snapshots',
  
  // Performance subset (for CI/CD)
  PERFORMANCE_TESTS: 'npx playwright test comprehensive-transformation-tests/ --config=playwright-ct.config.ts --workers=1 --grep="Performance Tests"'
} as const;

/**
 * Test categories and their purposes
 */
export const TEST_CATEGORIES = {
  BASIC: 'Basic transformation operations with standard parameters',
  EDGE_CASE: 'Edge cases including zero values, negative values, and extreme values',
  COMPLEX: 'Complex scenarios with multiple transformations and nested operations',
  PERFORMANCE: 'Performance tests with timing assertions and optimization verification'
} as const;

/**
 * Primitive types tested
 */
export const TESTED_PRIMITIVES = {
  CUBE: 'Cube primitives with various dimensions',
  SPHERE: 'Sphere primitives with different radii',
  CYLINDER: 'Cylinder primitives including cones and truncated cones'
} as const;

/**
 * Transformation types covered
 */
export const TRANSFORMATION_TYPES = {
  TRANSLATE: 'Translation along X, Y, Z axes with various parameter combinations',
  ROTATE: 'Rotation around X, Y, Z axes with Euler angles and edge cases',
  SCALE: 'Uniform and non-uniform scaling with positive, negative, and zero factors',
  MIRROR: 'Mirroring across coordinate planes and diagonal planes',
  COMBINED: 'Complex combinations of multiple transformation operations'
} as const;

/**
 * Expected test coverage statistics
 */
export const EXPECTED_COVERAGE = {
  TRANSLATE_TESTS: {
    CUBE: 55,
    SPHERE: 44,
    CYLINDER: 55,
    EDGE_CASES: 4,
    PERFORMANCE: 1
  },
  ROTATE_TESTS: {
    CUBE: 35,
    SPHERE: 28,
    CYLINDER: 35,
    EDGE_CASES: 4,
    PERFORMANCE: 2
  },
  SCALE_TESTS: {
    CUBE: 40,
    SPHERE: 32,
    CYLINDER: 40,
    EDGE_CASES: 5,
    PERFORMANCE: 2
  },
  MIRROR_TESTS: {
    CUBE: 35,
    SPHERE: 28,
    CYLINDER: 35,
    EDGE_CASES: 6,
    PERFORMANCE: 2
  },
  COMBINED_TESTS: {
    CUBE: 15,
    SPHERE: 12,
    CYLINDER: 15,
    COMPLEX_SCENARIOS: 5,
    EDGE_CASES: 2,
    PERFORMANCE: 1
  }
} as const;
