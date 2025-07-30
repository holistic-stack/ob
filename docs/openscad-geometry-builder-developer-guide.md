# OpenSCAD Geometry Builder Developer Guide

## Overview

This guide provides comprehensive instructions for extending and maintaining the OpenSCAD Geometry Builder. It covers adding new primitive generators, using test utilities, and following established patterns.

**Prerequisites:**
- Understanding of TypeScript and functional programming
- Familiarity with OpenSCAD syntax and 3D geometry
- Knowledge of TDD methodology and SOLID principles

## Table of Contents

1. [Adding New Primitive Generators](#adding-new-primitive-generators)
2. [Using Test Utilities](#using-test-utilities)
3. [Extending Validation Utilities](#extending-validation-utilities)
4. [Performance Testing Guidelines](#performance-testing-guidelines)
5. [Code Quality Standards](#code-quality-standards)
6. [Common Patterns](#common-patterns)

## Adding New Primitive Generators

### Step 1: Create Generator Structure

Follow the established SRP-based file structure:

```
src/features/openscad-geometry-builder/services/primitive-generators/3d-primitives/
└── new-primitive-generator/
    ├── new-primitive-generator.ts
    ├── new-primitive-generator.test.ts
    └── index.ts
```

### Step 2: Define Types

Create parameter and geometry data types:

```typescript
// In types/primitive-parameters.ts
export interface NewPrimitiveParameters {
  readonly parameter1: number;
  readonly parameter2: boolean;
  readonly fn?: number;
  readonly fs?: number;
  readonly fa?: number;
}

// In types/geometry-data.ts
export interface NewPrimitiveGeometryData extends BaseGeometryData {
  readonly metadata: GeometryMetadata & {
    readonly parameters: {
      readonly parameter1: number;
      readonly parameter2: boolean;
      readonly fragments: number;
    };
  };
}
```

### Step 3: Implement Generator Service

```typescript
import type { Result } from '@/shared/types/result.types';
import { error, success } from '@/shared/utils/functional/result';
import {
  calculateFragmentsWithErrorHandling,
  createGeometryMetadata,
  createGeometryData
} from '../../../../utils/geometry-helpers';
import { validateParameter1, validateParameter2 } from '../../../../utils/validation-helpers';

export class NewPrimitiveGeneratorService {
  constructor(private readonly fragmentCalculator: FragmentCalculatorService) {}

  generateNewPrimitive(
    parameter1: number,
    parameter2: boolean,
    fragments: number
  ): Result<NewPrimitiveGeometryData, GeometryGenerationError> {
    try {
      // Validate parameters
      const validationResult = this.validateParameters(parameter1, parameter2, fragments);
      if (!validationResult.success) {
        return validationResult;
      }

      // Generate geometry
      const vertices = this.generateVertices(parameter1, parameter2, fragments);
      const faces = this.generateFaces(fragments);
      const normals = this.generateNormals(vertices, faces);

      // Create geometry data using utilities
      const metadata = createGeometryMetadata(
        '3d-new-primitive',
        { parameter1, parameter2, fragments },
        true
      );

      const geometryData = createGeometryData<NewPrimitiveGeometryData>(
        vertices,
        faces,
        normals,
        metadata
      );

      return success(geometryData);
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `New primitive generation failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { parameter1, parameter2, fragments },
      });
    }
  }

  generateNewPrimitiveFromParameters(
    params: NewPrimitiveParameters
  ): Result<NewPrimitiveGeometryData, GeometryGenerationError> {
    try {
      // Calculate fragments using fragment calculator
      const fragmentResult = calculateFragmentsWithErrorHandling(
        this.fragmentCalculator,
        parameter1, // Use appropriate parameter for fragment calculation
        params.fn,
        params.fs,
        params.fa
      );

      if (!fragmentResult.success) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: fragmentResult.error.message,
          details: { params },
        });
      }

      return this.generateNewPrimitive(
        params.parameter1,
        params.parameter2,
        fragmentResult.data
      );
    } catch (err) {
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Parameter processing failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { params },
      });
    }
  }

  private validateParameters(
    parameter1: number,
    parameter2: boolean,
    fragments: number
  ): Result<void, GeometryGenerationError> {
    // Use validation utilities
    const param1Validation = validateParameter1(parameter1);
    if (!param1Validation.success) return param1Validation;

    const fragmentValidation = validateFragmentCount(fragments);
    if (!fragmentValidation.success) return fragmentValidation;

    return success(undefined);
  }

  private generateVertices(
    parameter1: number,
    parameter2: boolean,
    fragments: number
  ): Vector3[] {
    // Implement vertex generation logic
    // Follow SRP - extract complex logic into separate methods
    return [];
  }

  private generateFaces(fragments: number): readonly (readonly number[])[] {
    // Implement face generation logic
    // Follow SRP - extract complex logic into separate methods
    return [];
  }

  private generateNormals(
    vertices: readonly Vector3[],
    faces: readonly (readonly number[])[]
  ): Vector3[] {
    // Implement normal generation logic
    // Consider using geometry utilities if applicable
    return [];
  }
}
```

### Step 4: Write Comprehensive Tests

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import {
  expectSuccess,
  expectInvalidParametersError,
  expectSuccessfulGeometry,
  expectValidGeometry,
  expectPerformance,
  createNewPrimitiveTestParameters,
  createInvalidNewPrimitiveParameters,
} from '../../../../test-utilities';
import { FragmentCalculatorService } from '../../../fragment-calculator';
import { NewPrimitiveGeneratorService } from './new-primitive-generator';

describe('NewPrimitiveGeneratorService', () => {
  let generator: NewPrimitiveGeneratorService;
  let fragmentCalculator: FragmentCalculatorService;

  beforeEach(() => {
    fragmentCalculator = new FragmentCalculatorService();
    generator = new NewPrimitiveGeneratorService(fragmentCalculator);
  });

  describe('generateNewPrimitive', () => {
    it('should generate valid geometry', () => {
      const result = generator.generateNewPrimitive(5, true, 8);

      const geometry = expectSuccessfulGeometry(result, {
        hasVertices: true,
        hasFaces: true,
        hasNormals: true,
        hasMetadata: true,
      });

      expectValidGeometry(geometry);
    });

    it('should handle performance requirements', async () => {
      const geometry = await expectPerformance(
        () => generator.generateNewPrimitive(5, true, 8),
        50, // max 50ms
        'new primitive generation'
      );

      expectSuccessfulGeometry(geometry);
    });
  });

  describe('parameter validation', () => {
    const invalidParams = createInvalidNewPrimitiveParameters();

    invalidParams.forEach(({ params, description, expectedError }) => {
      it(`should reject ${description}`, () => {
        const result = generator.generateNewPrimitiveFromParameters(params);
        expectInvalidParametersError(result, expectedError);
      });
    });
  });
});
```

## Using Test Utilities

### Result Assertions

```typescript
// Test successful results
const geometry = expectSuccessfulGeometry(result, {
  vertexCount: 24,
  faceCount: 12,
  hasNormals: true,
  hasMetadata: true
});

// Test error results
expectInvalidParametersError(result, 'Parameter must be positive');
expectComputationError(result, 'Calculation failed');

// Test multiple results
const allGeometries = expectAllSuccessful([result1, result2, result3]);
```

### Geometry Assertions

```typescript
// Validate geometry structure
expectValidGeometry(geometry, {
  hasVertices: true,
  hasFaces: true,
  hasNormals: true,
  minVertices: 8,
  minFaces: 6
});

// Validate specific components
expectValidVertices(geometry.vertices, 24);
expectValidFaces(geometry.faces, 24, 12);
expectValidNormals(geometry.normals, 24);
expectValidMetadata(geometry.metadata, '3d-new-primitive', ['parameter1', 'parameter2']);
```

### Test Data Generators

```typescript
// Create test data generators
export function createNewPrimitiveTestParameters(
  overrides: Partial<NewPrimitiveParameters> = {}
): NewPrimitiveParameters {
  return {
    parameter1: 5,
    parameter2: true,
    fn: 8,
    fs: 2,
    fa: 12,
    ...overrides,
  };
}

export function createInvalidNewPrimitiveParameters(): Array<{
  params: Partial<NewPrimitiveParameters>;
  description: string;
  expectedError: string;
}> {
  return [
    {
      params: { parameter1: -5 },
      description: 'negative parameter1',
      expectedError: 'Parameter1 must be positive',
    },
    // Add more invalid cases
  ];
}
```

### Performance Testing

```typescript
// Test performance
const result = await expectPerformance(
  () => generator.generateNewPrimitive(5, true, 8),
  50, // max 50ms
  'new primitive generation'
);

// Run benchmarks
const benchmark = await runPerformanceBenchmark(
  () => generator.generateNewPrimitive(5, true, 8),
  10 // iterations
);

expectBenchmarkPerformance(benchmark, {
  maxAverageTime: 30,
  maxSingleTime: 50
});
```

## Extending Validation Utilities

### Adding New Validators

```typescript
// In validation-helpers.ts
export function validateNewParameter(
  value: number
): Result<void, GeometryGenerationError> {
  if (!Number.isFinite(value)) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: 'New parameter must be a finite number',
      details: { value },
    });
  }

  if (value <= 0) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: 'New parameter must be positive',
      details: { value },
    });
  }

  return success(undefined);
}
```

### Testing Validators

```typescript
describe('validateNewParameter', () => {
  it('should accept valid values', () => {
    const result = validateNewParameter(5);
    expectSuccess(result);
  });

  it('should reject invalid values', () => {
    const result = validateNewParameter(-5);
    expectInvalidParametersError(result, 'must be positive');
  });
});
```

## Performance Testing Guidelines

### Performance Targets

- **Simple Operations**: <10ms (basic parameter validation, simple calculations)
- **Complex Operations**: <50ms (geometry generation, complex calculations)
- **Batch Operations**: <200ms (multiple geometry generations)

### Performance Testing Patterns

```typescript
// Test individual operations
await expectSimpleOperationPerformance(
  () => validateParameters(params),
  'parameter validation'
);

await expectComplexOperationPerformance(
  () => generator.generateGeometry(params),
  'geometry generation'
);

// Test batch operations
await expectBatchOperationPerformance(
  () => generateMultipleGeometries(paramsList),
  'batch geometry generation'
);
```

## Code Quality Standards

### Mandatory Requirements

1. **Zero TypeScript Errors**: Run `pnpm type-check` after each change
2. **Zero Biome Violations**: Run `pnpm biome:fix` after each change
3. **SRP Compliance**: Each function has single responsibility
4. **File Size Limit**: Keep files under 500 lines
5. **Test Coverage**: Maintain 95%+ test coverage

### Code Review Checklist

- [ ] All functions follow SRP principles
- [ ] Error handling uses Result<T,E> patterns
- [ ] Comprehensive tests with real implementations
- [ ] Performance requirements met
- [ ] Documentation updated
- [ ] TypeScript strict mode compliance
- [ ] Biome formatting applied

## Common Patterns

### Error Handling Pattern

```typescript
try {
  // Validate inputs
  const validation = validateInputs(params);
  if (!validation.success) return validation;

  // Perform calculations
  const result = performCalculations(params);

  // Create output using utilities
  const output = createOutput(result);

  return success(output);
} catch (err) {
  return error({
    type: 'COMPUTATION_ERROR',
    message: `Operation failed: ${err instanceof Error ? err.message : String(err)}`,
    details: { params },
  });
}
```

### Utility Usage Pattern

```typescript
// Use existing utilities
const fragmentResult = calculateFragmentsWithErrorHandling(
  this.fragmentCalculator,
  radius,
  params.fn,
  params.fs,
  params.fa
);

const metadata = createGeometryMetadata(
  primitiveType,
  parameters,
  isConvex
);

const geometryData = createGeometryData(
  vertices,
  faces,
  normals,
  metadata
);
```

### Test Pattern

```typescript
describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Initialize services
  });

  // Success cases
  describe('success cases', () => {
    it('should handle standard case', () => {
      const result = service.method(validParams);
      const data = expectSuccessfulGeometry(result);
      expectValidGeometry(data);
    });
  });

  // Error cases
  describe('error cases', () => {
    it('should reject invalid input', () => {
      const result = service.method(invalidParams);
      expectInvalidParametersError(result, 'expected error message');
    });
  });

  // Performance cases
  describe('performance', () => {
    it('should meet performance requirements', async () => {
      await expectPerformance(
        () => service.method(params),
        maxTime,
        'operation description'
      );
    });
  });
});
```
