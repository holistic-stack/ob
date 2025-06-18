/**
 * @file Primitive Shape Test Data Generator
 * 
 * Provides test data for different OpenSCAD primitive shapes
 * Following SRP by separating primitive generation from transformation logic
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

/**
 * Interface for primitive shape test data
 */
export interface PrimitiveTestData {
  readonly name: string;
  readonly description: string;
  readonly openscadCode: string;
  readonly expectedDimensions: {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
  };
  readonly complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Cube primitive test cases
 */
export const cubeTestData: readonly PrimitiveTestData[] = [
  {
    name: 'cube-unit',
    description: 'Unit cube (1x1x1)',
    openscadCode: 'cube([1, 1, 1]);',
    expectedDimensions: { width: 1, height: 1, depth: 1 },
    complexity: 'simple'
  },
  {
    name: 'cube-standard',
    description: 'Standard cube (5x5x5)',
    openscadCode: 'cube([5, 5, 5]);',
    expectedDimensions: { width: 5, height: 5, depth: 5 },
    complexity: 'simple'
  },
  {
    name: 'cube-rectangular',
    description: 'Rectangular cube (8x6x4)',
    openscadCode: 'cube([8, 6, 4]);',
    expectedDimensions: { width: 8, height: 6, depth: 4 },
    complexity: 'simple'
  },
  {
    name: 'cube-thin',
    description: 'Thin cube (10x1x3)',
    openscadCode: 'cube([10, 1, 3]);',
    expectedDimensions: { width: 10, height: 1, depth: 3 },
    complexity: 'simple'
  },
  {
    name: 'cube-large',
    description: 'Large cube (15x15x15)',
    openscadCode: 'cube([15, 15, 15]);',
    expectedDimensions: { width: 15, height: 15, depth: 15 },
    complexity: 'medium'
  }
] as const;

/**
 * Sphere primitive test cases
 */
export const sphereTestData: readonly PrimitiveTestData[] = [
  {
    name: 'sphere-unit',
    description: 'Unit sphere (radius 1)',
    openscadCode: 'sphere(r=1);',
    expectedDimensions: { width: 2, height: 2, depth: 2 },
    complexity: 'medium'
  },
  {
    name: 'sphere-standard',
    description: 'Standard sphere (radius 3)',
    openscadCode: 'sphere(r=3);',
    expectedDimensions: { width: 6, height: 6, depth: 6 },
    complexity: 'medium'
  },
  {
    name: 'sphere-large',
    description: 'Large sphere (radius 8)',
    openscadCode: 'sphere(r=8);',
    expectedDimensions: { width: 16, height: 16, depth: 16 },
    complexity: 'medium'
  },
  {
    name: 'sphere-small',
    description: 'Small sphere (radius 0.5)',
    openscadCode: 'sphere(r=0.5);',
    expectedDimensions: { width: 1, height: 1, depth: 1 },
    complexity: 'medium'
  }
] as const;

/**
 * Cylinder primitive test cases
 */
export const cylinderTestData: readonly PrimitiveTestData[] = [
  {
    name: 'cylinder-standard',
    description: 'Standard cylinder (r=2, h=5)',
    openscadCode: 'cylinder(r=2, h=5);',
    expectedDimensions: { width: 4, height: 5, depth: 4 },
    complexity: 'medium'
  },
  {
    name: 'cylinder-tall',
    description: 'Tall cylinder (r=1.5, h=10)',
    openscadCode: 'cylinder(r=1.5, h=10);',
    expectedDimensions: { width: 3, height: 10, depth: 3 },
    complexity: 'medium'
  },
  {
    name: 'cylinder-wide',
    description: 'Wide cylinder (r=5, h=2)',
    openscadCode: 'cylinder(r=5, h=2);',
    expectedDimensions: { width: 10, height: 2, depth: 10 },
    complexity: 'medium'
  },
  {
    name: 'cylinder-cone',
    description: 'Cone shape (r1=0, r2=3, h=6)',
    openscadCode: 'cylinder(r1=0, r2=3, h=6);',
    expectedDimensions: { width: 6, height: 6, depth: 6 },
    complexity: 'complex'
  },
  {
    name: 'cylinder-truncated',
    description: 'Truncated cone (r1=1, r2=4, h=8)',
    openscadCode: 'cylinder(r1=1, r2=4, h=8);',
    expectedDimensions: { width: 8, height: 8, depth: 8 },
    complexity: 'complex'
  }
] as const;

/**
 * Get all primitive test data
 */
export const getAllPrimitiveTestData = (): readonly PrimitiveTestData[] => [
  ...cubeTestData,
  ...sphereTestData,
  ...cylinderTestData
] as const;

/**
 * Get primitive test data by type
 */
export const getPrimitiveTestDataByType = (type: 'cube' | 'sphere' | 'cylinder'): readonly PrimitiveTestData[] => {
  switch (type) {
    case 'cube': return cubeTestData;
    case 'sphere': return sphereTestData;
    case 'cylinder': return cylinderTestData;
    default: return [];
  }
};

/**
 * Get primitive test data by complexity
 */
export const getPrimitiveTestDataByComplexity = (complexity: PrimitiveTestData['complexity']): readonly PrimitiveTestData[] =>
  getAllPrimitiveTestData().filter(primitive => primitive.complexity === complexity);

/**
 * Generate transformation test with specific primitive
 */
export const generateTransformationWithPrimitive = (
  transformation: string,
  primitive: PrimitiveTestData
): string => `${transformation} ${primitive.openscadCode}`;

/**
 * Generate test case name combining transformation and primitive
 */
export const generateTestCaseName = (
  transformationName: string,
  primitiveName: string
): string => `${transformationName}-${primitiveName}`;

/**
 * Calculate expected object separation based on primitive dimensions
 */
export const calculateObjectSeparation = (primitive: PrimitiveTestData): number => {
  const maxDimension = Math.max(
    primitive.expectedDimensions.width,
    primitive.expectedDimensions.height,
    primitive.expectedDimensions.depth
  );
  
  // Base separation of 25 units plus 2x the largest dimension
  return Math.max(25, maxDimension * 2 + 10);
};

/**
 * Get recommended timeout based on primitive complexity
 */
export const getRecommendedTimeout = (primitive: PrimitiveTestData): number => {
  switch (primitive.complexity) {
    case 'simple': return 4000;
    case 'medium': return 5000;
    case 'complex': return 6000;
    default: return 4000;
  }
};
