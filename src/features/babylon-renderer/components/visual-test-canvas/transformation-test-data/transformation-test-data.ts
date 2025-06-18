/**
 * @file Transformation Test Data Generator
 * 
 * Provides comprehensive test data for transformation visual regression tests
 * Following DRY principle by centralizing test parameter generation
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

/**
 * Base interface for transformation test cases
 */
export interface TransformationTestCase {
  readonly name: string;
  readonly description: string;
  readonly openscadCode: string;
  readonly expectedBehavior: string;
  readonly category: 'basic' | 'edge-case' | 'complex' | 'performance';
  readonly timeout?: number;
  readonly objectSeparation?: number;
}

/**
 * Translate transformation test cases
 */
export const translateTestCases: readonly TransformationTestCase[] = [
  // Basic single-axis translations
  {
    name: 'translate-x-positive',
    description: 'Translate cube 10 units along positive X axis',
    openscadCode: 'translate([10, 0, 0]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move 10 units to the right',
    category: 'basic'
  },
  {
    name: 'translate-x-negative',
    description: 'Translate cube 8 units along negative X axis',
    openscadCode: 'translate([-8, 0, 0]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move 8 units to the left',
    category: 'basic'
  },
  {
    name: 'translate-y-positive',
    description: 'Translate cube 12 units along positive Y axis',
    openscadCode: 'translate([0, 12, 0]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move 12 units upward',
    category: 'basic'
  },
  {
    name: 'translate-y-negative',
    description: 'Translate cube 6 units along negative Y axis',
    openscadCode: 'translate([0, -6, 0]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move 6 units downward',
    category: 'basic'
  },
  {
    name: 'translate-z-positive',
    description: 'Translate cube 15 units along positive Z axis',
    openscadCode: 'translate([0, 0, 15]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move 15 units forward',
    category: 'basic'
  },
  {
    name: 'translate-z-negative',
    description: 'Translate cube 9 units along negative Z axis',
    openscadCode: 'translate([0, 0, -9]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move 9 units backward',
    category: 'basic'
  },
  
  // Multi-axis translations
  {
    name: 'translate-xy-positive',
    description: 'Translate cube along positive X and Y axes',
    openscadCode: 'translate([8, 6, 0]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move diagonally in XY plane',
    category: 'basic'
  },
  {
    name: 'translate-xyz-mixed',
    description: 'Translate cube with mixed positive/negative values',
    openscadCode: 'translate([7, -4, 11]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move in 3D space with mixed directions',
    category: 'basic'
  },
  
  // Edge cases
  {
    name: 'translate-zero',
    description: 'Translate cube with zero values (identity)',
    openscadCode: 'translate([0, 0, 0]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should remain at origin',
    category: 'edge-case'
  },
  {
    name: 'translate-large-values',
    description: 'Translate cube with large values',
    openscadCode: 'translate([50, 40, 30]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move far from origin',
    category: 'edge-case',
    objectSeparation: 80
  },
  {
    name: 'translate-decimal-precision',
    description: 'Translate cube with high decimal precision',
    openscadCode: 'translate([3.14159, 2.71828, 1.41421]) cube([5, 5, 5]);',
    expectedBehavior: 'Cube should move with precise decimal positioning',
    category: 'edge-case'
  }
] as const;

/**
 * Rotate transformation test cases
 */
export const rotateTestCases: readonly TransformationTestCase[] = [
  // Basic single-axis rotations
  {
    name: 'rotate-x-45',
    description: 'Rotate cube 45 degrees around X axis',
    openscadCode: 'rotate([45, 0, 0]) cube([8, 4, 2]);',
    expectedBehavior: 'Cube should rotate 45° around X axis',
    category: 'basic'
  },
  {
    name: 'rotate-y-60',
    description: 'Rotate cube 60 degrees around Y axis',
    openscadCode: 'rotate([0, 60, 0]) cube([8, 4, 2]);',
    expectedBehavior: 'Cube should rotate 60° around Y axis',
    category: 'basic'
  },
  {
    name: 'rotate-z-90',
    description: 'Rotate cube 90 degrees around Z axis',
    openscadCode: 'rotate([0, 0, 90]) cube([8, 4, 2]);',
    expectedBehavior: 'Cube should rotate 90° around Z axis',
    category: 'basic'
  },
  
  // Multi-axis rotations
  {
    name: 'rotate-xyz-euler',
    description: 'Rotate cube with Euler angles',
    openscadCode: 'rotate([30, 45, 60]) cube([6, 6, 6]);',
    expectedBehavior: 'Cube should rotate with combined Euler angles',
    category: 'basic'
  },
  
  // Edge cases
  {
    name: 'rotate-360',
    description: 'Rotate cube 360 degrees (full rotation)',
    openscadCode: 'rotate([0, 0, 360]) cube([6, 4, 2]);',
    expectedBehavior: 'Cube should complete full rotation',
    category: 'edge-case'
  },
  {
    name: 'rotate-negative',
    description: 'Rotate cube with negative angles',
    openscadCode: 'rotate([-45, -30, -60]) cube([6, 4, 2]);',
    expectedBehavior: 'Cube should rotate in negative directions',
    category: 'edge-case'
  },
  {
    name: 'rotate-large-angles',
    description: 'Rotate cube with angles > 360 degrees',
    openscadCode: 'rotate([450, 720, 1080]) cube([6, 4, 2]);',
    expectedBehavior: 'Cube should handle large angle values correctly',
    category: 'edge-case'
  }
] as const;

/**
 * Scale transformation test cases
 */
export const scaleTestCases: readonly TransformationTestCase[] = [
  // Basic scaling
  {
    name: 'scale-uniform-2x',
    description: 'Scale cube uniformly by factor of 2',
    openscadCode: 'scale([2, 2, 2]) cube([4, 4, 4]);',
    expectedBehavior: 'Cube should double in size uniformly',
    category: 'basic'
  },
  {
    name: 'scale-uniform-half',
    description: 'Scale cube uniformly by factor of 0.5',
    openscadCode: 'scale([0.5, 0.5, 0.5]) cube([8, 8, 8]);',
    expectedBehavior: 'Cube should halve in size uniformly',
    category: 'basic'
  },
  
  // Non-uniform scaling
  {
    name: 'scale-x-stretch',
    description: 'Stretch cube along X axis only',
    openscadCode: 'scale([3, 1, 1]) cube([4, 6, 4]);',
    expectedBehavior: 'Cube should stretch horizontally',
    category: 'basic'
  },
  {
    name: 'scale-y-compress',
    description: 'Compress cube along Y axis',
    openscadCode: 'scale([1, 0.3, 1]) cube([6, 8, 4]);',
    expectedBehavior: 'Cube should compress vertically',
    category: 'basic'
  },
  {
    name: 'scale-xyz-different',
    description: 'Scale cube with different factors per axis',
    openscadCode: 'scale([2.5, 0.8, 1.6]) cube([4, 6, 3]);',
    expectedBehavior: 'Cube should scale differently on each axis',
    category: 'basic'
  },
  
  // Edge cases
  {
    name: 'scale-zero',
    description: 'Scale cube with zero factor (degenerate)',
    openscadCode: 'scale([0, 1, 1]) cube([6, 6, 6]);',
    expectedBehavior: 'Cube should collapse to zero width',
    category: 'edge-case'
  },
  {
    name: 'scale-negative',
    description: 'Scale cube with negative factors (mirror + scale)',
    openscadCode: 'scale([-1, 2, -0.5]) cube([6, 4, 8]);',
    expectedBehavior: 'Cube should mirror and scale simultaneously',
    category: 'edge-case'
  },
  {
    name: 'scale-large-factor',
    description: 'Scale cube with very large factor',
    openscadCode: 'scale([10, 10, 10]) cube([1, 1, 1]);',
    expectedBehavior: 'Small cube should become very large',
    category: 'edge-case',
    objectSeparation: 60
  }
] as const;

/**
 * Mirror transformation test cases
 */
export const mirrorTestCases: readonly TransformationTestCase[] = [
  // Basic mirroring
  {
    name: 'mirror-x-plane',
    description: 'Mirror cube across YZ plane (X=0)',
    openscadCode: 'mirror([1, 0, 0]) cube([8, 6, 4]);',
    expectedBehavior: 'Cube should mirror across YZ plane',
    category: 'basic'
  },
  {
    name: 'mirror-y-plane',
    description: 'Mirror cube across XZ plane (Y=0)',
    openscadCode: 'mirror([0, 1, 0]) cube([6, 8, 4]);',
    expectedBehavior: 'Cube should mirror across XZ plane',
    category: 'basic'
  },
  {
    name: 'mirror-z-plane',
    description: 'Mirror cube across XY plane (Z=0)',
    openscadCode: 'mirror([0, 0, 1]) cube([6, 4, 8]);',
    expectedBehavior: 'Cube should mirror across XY plane',
    category: 'basic'
  },
  
  // Diagonal mirroring
  {
    name: 'mirror-xy-diagonal',
    description: 'Mirror cube across diagonal plane in XY',
    openscadCode: 'mirror([1, 1, 0]) cube([8, 6, 4]);',
    expectedBehavior: 'Cube should mirror across XY diagonal',
    category: 'basic'
  },
  {
    name: 'mirror-xyz-diagonal',
    description: 'Mirror cube across 3D diagonal plane',
    openscadCode: 'mirror([1, 1, 1]) cube([6, 6, 6]);',
    expectedBehavior: 'Cube should mirror across 3D diagonal',
    category: 'basic'
  },
  
  // Edge cases
  {
    name: 'mirror-normalized-vector',
    description: 'Mirror cube with normalized vector',
    openscadCode: 'mirror([0.707, 0.707, 0]) cube([8, 6, 4]);',
    expectedBehavior: 'Cube should mirror correctly with normalized vector',
    category: 'edge-case'
  },
  {
    name: 'mirror-large-vector',
    description: 'Mirror cube with large vector components',
    openscadCode: 'mirror([100, 0, 0]) cube([6, 6, 6]);',
    expectedBehavior: 'Cube should mirror correctly regardless of vector magnitude',
    category: 'edge-case'
  }
] as const;

/**
 * Combined transformation test cases
 */
export const combinedTestCases: readonly TransformationTestCase[] = [
  {
    name: 'translate-rotate-simple',
    description: 'Simple translate then rotate combination',
    openscadCode: 'translate([5, 0, 0]) rotate([0, 0, 45]) cube([6, 6, 3]);',
    expectedBehavior: 'Cube should translate then rotate',
    category: 'basic'
  },
  {
    name: 'scale-rotate-translate',
    description: 'Scale, rotate, then translate combination',
    openscadCode: 'translate([8, 4, 2]) rotate([30, 45, 60]) scale([1.5, 1.2, 0.8]) cube([4, 4, 4]);',
    expectedBehavior: 'Cube should undergo complex transformation sequence',
    category: 'complex'
  },
  {
    name: 'all-transforms-extreme',
    description: 'All transformations with extreme values',
    openscadCode: 'translate([20, 15, 10]) rotate([90, 180, 270]) scale([3, 0.5, 2]) mirror([1, 0, 0]) cube([2, 2, 2]);',
    expectedBehavior: 'Cube should handle extreme transformation combination',
    category: 'complex',
    objectSeparation: 70,
    timeout: 6000
  }
] as const;

/**
 * Get all transformation test cases
 */
export const getAllTransformationTestCases = (): readonly TransformationTestCase[] => [
  ...translateTestCases,
  ...rotateTestCases,
  ...scaleTestCases,
  ...mirrorTestCases,
  ...combinedTestCases
] as const;

/**
 * Filter test cases by category
 */
export const getTestCasesByCategory = (category: TransformationTestCase['category']): readonly TransformationTestCase[] =>
  getAllTransformationTestCases().filter(testCase => testCase.category === category);

/**
 * Get test cases for specific transformation type
 */
export const getTestCasesByType = (type: 'translate' | 'rotate' | 'scale' | 'mirror' | 'combined'): readonly TransformationTestCase[] => {
  switch (type) {
    case 'translate': return translateTestCases;
    case 'rotate': return rotateTestCases;
    case 'scale': return scaleTestCases;
    case 'mirror': return mirrorTestCases;
    case 'combined': return combinedTestCases;
    default: return [];
  }
};
