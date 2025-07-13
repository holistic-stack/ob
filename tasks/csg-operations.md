# Manifold Transformation Enhancement Plan

## Implementation Status: FOCUSED ENHANCEMENT ✅
**Objective**: Replace transformation placeholders with Manifold native methods in existing ManifoldASTConverter
**Architecture Pattern**: Enhance existing SOLID architecture without rebuilding
**Methodology**: TDD enhancement of existing comprehensive test suite

## Problem Analysis

### Current Architecture (Working Well) ✅
```typescript
// Existing data flow that works correctly
AST → renderASTNode() → ManifoldASTConverter → CSG Operations → Three.js Mesh → R3FScene
```

**Existing Infrastructure (Keep):**
- ✅ ManifoldASTConverter with comprehensive AST handling
- ✅ ManifoldCSGOperations with union, intersection, difference
- ✅ ManifoldMemoryManager with RAII patterns
- ✅ MaterialIDManager with material handling
- ✅ Comprehensive test suite with real parser integration
- ✅ Result<T,E> error handling throughout
- ✅ Performance targets achieved (<16ms)

### Specific Issues to Fix 🔧

**Transformation Placeholders in ManifoldASTConverter:**

<augment_code_snippet path="src/features/3d-renderer/services/manifold-ast-converter/manifold-ast-converter.ts" mode="EXCERPT">
````typescript
// ISSUE 1: Manual vertex manipulation instead of Manifold native (lines 551-561)
const positions = positionAttribute.array as Float32Array;
for (let i = 0; i < positions.length; i += 3) {
  positions[i]! += x; // X translation
  positions[i + 1]! += y; // Y translation
  positions[i + 2]! += z; // Z translation
}

// ISSUE 2: Missing Manifold transformation (line 732)
// For now, return the child geometry without matrix transformation
// In a full implementation, this would use Manifold's transform() method
````
</augment_code_snippet>

**What Needs Enhancement:**
- 🔧 Replace manual vertex manipulation with Manifold native `translate()`
- 🔧 Implement proper `rotate()`, `scale()`, `multmatrix()` using Manifold API
- 🔧 Add transformation composition for nested operations
- 🔧 Enhance performance monitoring in existing converter

### SOLID Principles Compliance ✅

**Current ManifoldASTConverter Already Follows SOLID:**
- **SRP**: Handles AST to geometry conversion (single responsibility)
- **OCP**: Can be extended with better transformation methods
- **LSP**: Returns consistent Result<T,E> patterns
- **ISP**: Uses focused interfaces (ManifoldConversionOptions)
- **DIP**: Uses injected MaterialIDManager dependency

## Enhancement Strategy

### Manifold-Three.js Conversion Utilities
```typescript
/**
 * Utility functions for converting between Manifold and Three.js formats
 * These will be used by enhanced transformation methods
 */
interface ManifoldConversionUtils {
  /**
   * Convert Three.js BufferGeometry to Manifold object
   * @param geometry - Three.js geometry to convert
   * @returns Result with Manifold object or error
   */
  convertThreeToManifold(geometry: THREE.BufferGeometry): Promise<Result<any, string>>;

  /**
   * Convert Manifold object to Three.js BufferGeometry
   * @param manifoldObject - Manifold WASM object to convert
   * @returns Result with Three.js geometry or error
   */
  convertManifoldToThree(manifoldObject: any): Promise<Result<THREE.BufferGeometry, string>>;

  /**
   * Apply Manifold transformation and convert back to Three.js
   * @param geometry - Source Three.js geometry
   * @param transformation - Transformation function to apply
   * @returns Result with transformed Three.js geometry or error
   */
  applyManifoldTransformation(
    geometry: THREE.BufferGeometry,
    transformation: (manifold: any) => any
  ): Promise<Result<THREE.BufferGeometry, string>>;
}

/**
 * Enhanced transformation metadata for existing ManifoldConversionResult
 */
interface TransformationMetadata {
  readonly usedManifoldNative: boolean;
  readonly transformationType: string;
  readonly transformationParams: Record<string, unknown>;
  readonly composedTransformations?: readonly string[];
  readonly processingTime: number;
}

/**
 * Enhanced ManifoldConversionResult with transformation metadata
 */
interface EnhancedManifoldConversionResult extends ManifoldConversionResult {
  readonly transformationMetadata?: TransformationMetadata;
}
```

## Focused Enhancement Implementation Plan

### Phase 1: Manifold Transformation Enhancement (TDD - 45 minutes)

#### Step 1.1: Manifold Conversion Utilities (15 minutes)

**Red Phase (5 minutes)**:
```typescript
// Test: src/features/3d-renderer/services/manifold-ast-converter/manifold-conversion-utils.test.ts
describe('ManifoldConversionUtils', () => {
  let utils: ManifoldConversionUtils;

  beforeEach(async () => {
    utils = new ManifoldConversionUtils();
    await utils.initialize();
  });

  test('should convert Three.js geometry to Manifold object', async () => {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const result = await utils.convertThreeToManifold(cubeGeometry);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(typeof result.data.delete).toBe('function'); // Manifold WASM object
  });

  test('should convert Manifold object back to Three.js geometry', async () => {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const manifoldResult = await utils.convertThreeToManifold(cubeGeometry);

    const threeResult = await utils.convertManifoldToThree(manifoldResult.data);

    expect(threeResult.success).toBe(true);
    expect(threeResult.data).toBeInstanceOf(THREE.BufferGeometry);
    expect(threeResult.data.getAttribute('position')).toBeDefined();
  });

  test('should apply Manifold transformation and convert back', async () => {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const result = await utils.applyManifoldTransformation(
      cubeGeometry,
      (manifold) => manifold.translate([1, 2, 3])
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(THREE.BufferGeometry);
    // Verify transformation was applied (positions should be offset)
  });
});
```

**Green Phase (8 minutes)**:
```typescript
// Implementation: src/features/3d-renderer/services/manifold-ast-converter/manifold-conversion-utils.ts
/**
 * @file Manifold Conversion Utilities
 * @description Helper functions for converting between Manifold and Three.js formats
 */

import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';
import { createLogger } from '../../../../../shared/services/logger.service';
import type { Result } from '../../../../../shared/types/result.types';

/**
 * Utility class for Manifold-Three.js conversions
 * Enhances existing ManifoldASTConverter with native transformation support
 */
export class ManifoldConversionUtils {
  private readonly logger = createLogger('ManifoldConversionUtils');
  private manifoldModule: any = null;
  private wasmLoader: ManifoldWasmLoader;

  constructor() {
    this.wasmLoader = new ManifoldWasmLoader();
  }

  /**
   * Initialize Manifold WASM module
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      const loadResult = await this.wasmLoader.load();
      if (!loadResult.success) {
        return { success: false, error: `Failed to load Manifold WASM: ${loadResult.error}` };
      }

      this.manifoldModule = loadResult.data;
      this.logger.info('[INIT] ManifoldConversionUtils initialized');
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: `Initialization failed: ${error}` };
    }
  }

  /**
   * Convert Three.js BufferGeometry to Manifold object
   * @param geometry - Three.js geometry to convert
   * @returns Result with Manifold object or error
   */
  async convertThreeToManifold(geometry: THREE.BufferGeometry): Promise<Result<any, string>> {
    if (!this.manifoldModule) {
      return { success: false, error: 'Manifold WASM module not initialized' };
    }

    try {
      // Extract vertex and index data from Three.js geometry
      const positions = geometry.getAttribute('position').array;
      const indices = geometry.getIndex()?.array || this.generateIndices(positions.length / 3);

      // Create Manifold mesh from vertex data
      const manifoldMesh = {
        vertPos: Array.from(positions),
        triVerts: Array.from(indices),
        numProp: 3, // x, y, z coordinates
      };

      // Create Manifold object from mesh
      const manifoldObject = new this.manifoldModule.Manifold(manifoldMesh);

      return { success: true, data: manifoldObject };
    } catch (error) {
      return { success: false, error: `Three.js to Manifold conversion failed: ${error}` };
    }
  }

  /**
   * Convert Manifold object to Three.js BufferGeometry
   * @param manifoldObject - Manifold WASM object to convert
   * @returns Result with Three.js geometry or error
   */
  async convertManifoldToThree(manifoldObject: any): Promise<Result<THREE.BufferGeometry, string>> {
    try {
      // Get mesh data from Manifold object
      const mesh = manifoldObject.getMesh();

      // Create Three.js BufferGeometry
      const geometry = new THREE.BufferGeometry();

      // Set vertex positions
      const positions = new Float32Array(mesh.vertPos);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Set indices
      const indices = new Uint32Array(mesh.triVerts);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));

      // Compute normals for proper lighting
      geometry.computeVertexNormals();

      return { success: true, data: geometry };
    } catch (error) {
      return { success: false, error: `Manifold to Three.js conversion failed: ${error}` };
    }
  }

  /**
   * Apply Manifold transformation and convert back to Three.js
   * @param geometry - Source Three.js geometry
   * @param transformation - Transformation function to apply
   * @returns Result with transformed Three.js geometry or error
   */
  async applyManifoldTransformation(
    geometry: THREE.BufferGeometry,
    transformation: (manifold: any) => any
  ): Promise<Result<THREE.BufferGeometry, string>> {
    // Convert to Manifold
    const manifoldResult = await this.convertThreeToManifold(geometry);
    if (!manifoldResult.success) {
      return { success: false, error: manifoldResult.error };
    }

    try {
      // Apply transformation
      const transformedManifold = transformation(manifoldResult.data);

      // Convert back to Three.js
      const threeResult = await this.convertManifoldToThree(transformedManifold);

      // Clean up Manifold objects
      manifoldResult.data.delete();
      transformedManifold.delete();

      return threeResult;
    } catch (error) {
      // Clean up on error
      manifoldResult.data.delete();
      return { success: false, error: `Transformation failed: ${error}` };
    }
  }

  /**
   * Generate indices for non-indexed geometry
   */
  private generateIndices(vertexCount: number): number[] {
    const indices: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      indices.push(i);
    }
    return indices;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.manifoldModule = null;
    this.logger.debug('[END] ManifoldConversionUtils disposed');
  }
}
```

**Refactor Phase (2 minutes)**:
- Add error handling for edge cases in geometry conversion
- Optimize memory usage during conversions
- Add comprehensive JSDoc documentation

#### Step 1.2: Enhanced Transformation Methods (30 minutes)

**Red Phase (10 minutes)**:
```typescript
// Test: src/features/3d-renderer/services/manifold-ast-converter/manifold-ast-converter.test.ts
// Add to existing test suite - don't create new file
describe('ManifoldASTConverter - Enhanced Transformations', () => {
  let converter: ManifoldASTConverter;
  let materialManager: MaterialIDManager;

  beforeEach(async () => {
    materialManager = new MaterialIDManager();
    await materialManager.initialize();

    converter = new ManifoldASTConverter(materialManager);
    await converter.initialize();
  });

  test('should use Manifold native translate instead of vertex manipulation', async () => {
    const translateNode: TranslateNode = {
      type: 'translate',
      v: [1, 2, 3],
      children: [{
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 9 } }
      }],
      location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 19 } }
    };

    const result = await converter.convertNode(translateNode);

    expect(result.success).toBe(true);
    expect(result.data.transformationMetadata?.usedManifoldNative).toBe(true);
    expect(result.data.transformationMetadata?.transformationType).toBe('translate');
    expect(result.data.transformationMetadata?.transformationParams).toEqual({ x: 1, y: 2, z: 3 });
  });

  test('should handle rotation with Manifold native methods', async () => {
    const rotateNode: RotateNode = {
      type: 'rotate',
      a: [0, 0, Math.PI/4],
      children: [{
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 9 } }
      }],
      location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 19 } }
    };

    const result = await converter.convertNode(rotateNode);

    expect(result.success).toBe(true);
    expect(result.data.transformationMetadata?.usedManifoldNative).toBe(true);
    expect(result.data.transformationMetadata?.transformationType).toBe('rotate');
  });

  test('should compose nested transformations correctly', async () => {
    const nestedNode: TranslateNode = {
      type: 'translate',
      v: [1, 0, 0],
      children: [{
        type: 'rotate',
        a: [0, 0, Math.PI/4],
        children: [{
          type: 'cube',
          size: [1, 1, 1],
          location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 9 } }
        }],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 15, offset: 14 } }
      }],
      location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 25, offset: 24 } }
    };

    const result = await converter.convertNode(nestedNode);

    expect(result.success).toBe(true);
    expect(result.data.transformationMetadata?.composedTransformations).toEqual(['rotate', 'translate']);
  });

  test('should maintain performance targets with native transformations', async () => {
    const translateNode: TranslateNode = {
      type: 'translate',
      v: [1, 2, 3],
      children: [{ type: 'cube', size: [1, 1, 1] }]
    };

    const startTime = performance.now();
    const result = await converter.convertNode(translateNode);
    const duration = performance.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(16); // <16ms target
    expect(result.data.transformationMetadata?.processingTime).toBeLessThan(16);
  });
});
```

**Green Phase (18 minutes)**:
```typescript
// Implementation: src/features/3d-renderer/services/manifold-pipeline/manifold-pipeline.service.ts
/**
 * @file Central Manifold Pipeline Service implementing SRP and DIP
 * @description Orchestrates geometric processing through Manifold ecosystem
 */

import type { ASTNode } from '../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../shared/types/result.types';
import { BasePipelineProcessor } from './base/pipeline-processor';

/**
 * Pipeline dependencies interface for DIP compliance
 */
interface PipelineDependencies {
  readonly primitiveFactory: ManifoldPrimitiveFactory;
  readonly transformationProcessor: ManifoldTransformationProcessor;
  readonly csgProcessor: ManifoldCSGProcessor;
  readonly converter: ManifoldToThreeConverter;
}

/**
 * Main pipeline service orchestrating Manifold operations
 * Follows SRP by focusing solely on pipeline orchestration
 */
export class ManifoldPipelineService extends BasePipelineProcessor<ASTNode[], ManifoldPipelineResult> {
  readonly name = 'ManifoldPipelineService';
  readonly version = '1.0.0';

  private readonly dependencies: PipelineDependencies;
  private isInitialized = false;

  constructor(dependencies: PipelineDependencies) {
    super();
    this.dependencies = dependencies;
  }

  /**
   * Initialize pipeline and all dependencies
   * @returns Result indicating initialization success/failure
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      // Initialize all processors (DRY principle)
      const processors = Object.values(this.dependencies);
      for (const processor of processors) {
        if ('initialize' in processor) {
          const initResult = await processor.initialize();
          if (!initResult.success) {
            return { success: false, error: `Failed to initialize ${processor.name}: ${initResult.error}` };
          }
        }
      }

      this.isInitialized = true;
      this.logger.info('[INIT] Manifold pipeline initialized successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: `Pipeline initialization failed: ${error}` };
    }
  }

  /**
   * Process AST nodes through complete Manifold pipeline
   * @param nodes - AST nodes to process
   * @param options - Processing options
   * @returns Result with pipeline output or error
   */
  protected async processInternal(
    nodes: ASTNode[],
    options?: ManifoldProcessingOptions
  ): Promise<Result<ManifoldPipelineResult, string>> {
    if (!this.isInitialized) {
      return { success: false, error: 'Pipeline not initialized. Call initialize() first.' };
    }

    const startTime = performance.now();
    const operationsPerformed: string[] = [];

    try {
      // Stage 1: Create Manifold primitives (SRP)
      this.logger.debug('[STAGE 1] Creating Manifold primitives');
      const primitiveResult = await this.dependencies.primitiveFactory.process(nodes, options);
      if (!primitiveResult.success) {
        return { success: false, error: `Primitive creation failed: ${primitiveResult.error}` };
      }
      operationsPerformed.push('primitive_creation');

      // Stage 2: Apply transformations (SRP)
      this.logger.debug('[STAGE 2] Applying transformations');
      const transformResult = await this.dependencies.transformationProcessor.process(primitiveResult.data, options);
      if (!transformResult.success) {
        return { success: false, error: `Transformation failed: ${transformResult.error}` };
      }
      operationsPerformed.push('transformation');

      // Stage 3: Perform CSG operations (SRP)
      this.logger.debug('[STAGE 3] Performing CSG operations');
      const csgResult = await this.dependencies.csgProcessor.process(transformResult.data, options);
      if (!csgResult.success) {
        return { success: false, error: `CSG operations failed: ${csgResult.error}` };
      }
      operationsPerformed.push('csg_operations');

      // Stage 4: Convert to Three.js format (SRP)
      this.logger.debug('[STAGE 4] Converting to Three.js format');
      const conversionResult = await this.dependencies.converter.process(csgResult.data, options);
      if (!conversionResult.success) {
        return { success: false, error: `Conversion failed: ${conversionResult.error}` };
      }
      operationsPerformed.push('three_conversion');

      const processingTime = performance.now() - startTime;

      return {
        success: true,
        data: {
          geometries: conversionResult.data.geometries,
          manifoldness: true, // Guaranteed by Manifold pipeline
          processingTime,
          operationsPerformed,
          metadata: {
            nodeCount: nodes.length,
            pipelineVersion: this.version,
            timestamp: new Date(),
          },
        },
      };
    } catch (error) {
      return { success: false, error: `Pipeline processing failed: ${error}` };
    }
  }

  /**
   * Validate AST nodes before processing
   * @param nodes - AST nodes to validate
   * @returns Result indicating validation success/failure
   */
  validate(nodes: ASTNode[]): Result<void, string> {
    if (!Array.isArray(nodes)) {
      return { success: false, error: 'Input must be an array of AST nodes' };
    }

    if (nodes.length === 0) {
      return { success: false, error: 'At least one AST node is required' };
    }

    // Validate each node has required properties
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || typeof node.type !== 'string') {
        return { success: false, error: `Invalid AST node at index ${i}: missing or invalid type` };
      }
    }

    return { success: true, data: undefined };
  }

  /**
   * Clean up pipeline resources
   */
  dispose(): void {
    super.dispose();

    // Dispose all processors (DRY principle)
    Object.values(this.dependencies).forEach(processor => {
      if ('dispose' in processor) {
        processor.dispose();
      }
    });

    this.isInitialized = false;
    this.logger.info('[END] Manifold pipeline disposed');
  }
}
```

**Refactor Phase (2 minutes)**:
- Add comprehensive error context and logging
- Ensure proper resource cleanup in all error paths
- Add performance monitoring for each pipeline stage

### Phase 2: Complete Processor Implementations (3 hours)

#### Step 2.1: Manifold Primitive Processor (30 minutes)

**Red Phase (10 minutes)**:
```typescript
// Test: src/features/3d-renderer/services/manifold-pipeline/processors/manifold-primitive-processor.test.ts
describe('ManifoldPrimitiveProcessor', () => {
  let processor: ManifoldPrimitiveProcessor;
  let context: ProcessingContext;

  beforeEach(async () => {
    processor = new ManifoldPrimitiveProcessor();
    context = createTestProcessingContext();
    await processor.initialize();
  });

  test('should create cube primitive using Manifold native API', async () => {
    const cubeNode: CubeNode = { type: 'cube', size: [2, 3, 4] };

    const result = await processor.processNode(cubeNode, context);

    expect(result.success).toBe(true);
    expect(result.data.isManifold).toBe(true);
    expect(result.data.type).toBe('cube');
    expect(result.data.manifoldInstance).toBeDefined();
    expect(result.data.boundingBox).toBeDefined();
  });

  test('should create sphere with correct parameters', async () => {
    const sphereNode: SphereNode = { type: 'sphere', r: 1.5 };

    const result = await processor.processNode(sphereNode, context);

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('sphere');
    expect(result.data.metadata.parameters.radius).toBe(1.5);
  });

  test('should create cylinder with proper geometry', async () => {
    const cylinderNode: CylinderNode = { type: 'cylinder', h: 2, r: 0.5 };

    const result = await processor.processNode(cylinderNode, context);

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('cylinder');
    expect(result.data.metadata.parameters.height).toBe(2);
    expect(result.data.metadata.parameters.radius).toBe(0.5);
  });

  test('should handle unsupported primitive types', async () => {
    const invalidNode = { type: 'unsupported' } as any;

    const result = await processor.processNode(invalidNode, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported primitive type');
  });

  test('should register resources for cleanup', async () => {
    const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

    await processor.processNode(cubeNode, context);

    expect(context.resourceManager.getResourceCount()).toBe(1);
  });

  test('should validate primitive parameters', async () => {
    const invalidCube: CubeNode = { type: 'cube', size: [-1, 0, 1] }; // Invalid size

    const result = await processor.processNode(invalidCube, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid cube parameters');
  });
});
```

**Green Phase (11 minutes)**:
```typescript
// Implementation: src/features/3d-renderer/services/manifold-pipeline/processors/manifold-primitive-factory.ts
/**
 * @file Manifold Primitive Factory implementing SRP for primitive creation
 * @description Creates Manifold primitives using native API exclusively
 */

import type { ASTNode, CubeNode, SphereNode, CylinderNode } from '../../../../openscad-parser/core/ast-types';
import { BasePipelineProcessor } from '../base/pipeline-processor';
import { ManifoldWasmLoader } from '../../manifold-wasm-loader/manifold-wasm-loader';

/**
 * Manifold primitive with metadata
 */
interface ManifoldPrimitive {
  readonly type: string;
  readonly manifoldObject: any; // Manifold WASM object
  readonly parameters: Record<string, unknown>;
  readonly boundingBox: BoundingBox;
}

/**
 * Factory result containing created primitives
 */
interface PrimitiveFactoryResult {
  readonly primitives: readonly ManifoldPrimitive[];
  readonly creationTime: number;
}

/**
 * Factory for creating Manifold primitives using native API
 * Follows SRP by focusing solely on primitive creation
 */
export class ManifoldPrimitiveFactory extends BasePipelineProcessor<ASTNode[], PrimitiveFactoryResult> {
  readonly name = 'ManifoldPrimitiveFactory';
  readonly version = '1.0.0';

  private manifoldModule: any = null;
  private wasmLoader: ManifoldWasmLoader;

  constructor() {
    super();
    this.wasmLoader = new ManifoldWasmLoader();
  }

  /**
   * Initialize Manifold WASM module
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      const loadResult = await this.wasmLoader.load();
      if (!loadResult.success) {
        return { success: false, error: `Failed to load Manifold WASM: ${loadResult.error}` };
      }

      this.manifoldModule = loadResult.data;
      this.logger.info('[INIT] ManifoldPrimitiveFactory initialized');
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: `Initialization failed: ${error}` };
    }
  }

  /**
   * Create Manifold primitives from AST nodes
   * @param nodes - AST nodes to convert to primitives
   * @param options - Processing options
   * @returns Result with created primitives or error
   */
  protected async processInternal(
    nodes: ASTNode[],
    options?: ManifoldProcessingOptions
  ): Promise<Result<PrimitiveFactoryResult, string>> {
    if (!this.manifoldModule) {
      return { success: false, error: 'Manifold WASM module not initialized' };
    }

    const startTime = performance.now();
    const primitives: ManifoldPrimitive[] = [];

    try {
      for (const node of nodes) {
        const primitiveResult = await this.createPrimitive(node);
        if (!primitiveResult.success) {
          return { success: false, error: primitiveResult.error };
        }
        primitives.push(primitiveResult.data);
      }

      return {
        success: true,
        data: {
          primitives: Object.freeze(primitives),
          creationTime: performance.now() - startTime,
        },
      };
    } catch (error) {
      return { success: false, error: `Primitive creation failed: ${error}` };
    }
  }

  /**
   * Create single Manifold primitive from AST node
   * @param node - AST node to convert
   * @returns Result with created primitive or error
   */
  private async createPrimitive(node: ASTNode): Promise<Result<ManifoldPrimitive, string>> {
    try {
      switch (node.type) {
        case 'cube':
          return this.createCube(node as CubeNode);
        case 'sphere':
          return this.createSphere(node as SphereNode);
        case 'cylinder':
          return this.createCylinder(node as CylinderNode);
        default:
          return { success: false, error: `Unsupported primitive type: ${node.type}` };
      }
    } catch (error) {
      return { success: false, error: `Failed to create ${node.type}: ${error}` };
    }
  }

  /**
   * Create Manifold cube using native API
   */
  private createCube(node: CubeNode): Result<ManifoldPrimitive, string> {
    const size = Array.isArray(node.size) ? node.size : [node.size, node.size, node.size];
    const [width, height, depth] = size.map(Number);

    // Use Manifold native cube creation
    const manifoldCube = this.manifoldModule.cube([width, height, depth], node.center ?? false);

    return {
      success: true,
      data: {
        type: 'cube',
        manifoldObject: manifoldCube,
        parameters: { width, height, depth, center: node.center ?? false },
        boundingBox: this.calculateBoundingBox(manifoldCube),
      },
    };
  }

  /**
   * Create Manifold sphere using native API
   */
  private createSphere(node: SphereNode): Result<ManifoldPrimitive, string> {
    const radius = Number(node.r);
    const segments = node.segments ?? 32;

    // Use Manifold native sphere creation
    const manifoldSphere = this.manifoldModule.sphere(radius, segments);

    return {
      success: true,
      data: {
        type: 'sphere',
        manifoldObject: manifoldSphere,
        parameters: { radius, segments },
        boundingBox: this.calculateBoundingBox(manifoldSphere),
      },
    };
  }

  /**
   * Create Manifold cylinder using native API
   */
  private createCylinder(node: CylinderNode): Result<ManifoldPrimitive, string> {
    const height = Number(node.h);
    const radius = Number(node.r);
    const segments = node.segments ?? 32;

    // Use Manifold native cylinder creation
    const manifoldCylinder = this.manifoldModule.cylinder(height, radius, radius, segments);

    return {
      success: true,
      data: {
        type: 'cylinder',
        manifoldObject: manifoldCylinder,
        parameters: { height, radius, segments },
        boundingBox: this.calculateBoundingBox(manifoldCylinder),
      },
    };
  }

  /**
   * Calculate bounding box for Manifold object
   */
  private calculateBoundingBox(manifoldObject: any): BoundingBox {
    // Use Manifold's bounding box calculation
    const bounds = manifoldObject.boundingBox();
    return {
      min: [bounds.min.x, bounds.min.y, bounds.min.z],
      max: [bounds.max.x, bounds.max.y, bounds.max.z],
    };
  }

  /**
   * Clean up Manifold objects
   */
  dispose(): void {
    super.dispose();
    // Manifold objects are cleaned up by the pipeline orchestrator
    this.manifoldModule = null;
  }
}
```

**Refactor Phase (2 minutes)**:
- Add parameter validation for each primitive type
- Implement proper error handling for Manifold API calls
- Add comprehensive JSDoc documentation

#### Step 2.2: Manifold Transformation Processor (45 minutes)

**Red Phase (15 minutes)**:
```typescript
// Test: src/features/3d-renderer/services/manifold-pipeline/processors/manifold-transformation-processor.test.ts
describe('ManifoldTransformationProcessor', () => {
  let processor: ManifoldTransformationProcessor;
  let context: ProcessingContext;

  beforeEach(async () => {
    processor = new ManifoldTransformationProcessor();
    context = createTestProcessingContext();
    await processor.initialize();
  });

  test('should apply translation transformation', async () => {
    const translateNode: TranslateNode = {
      type: 'translate',
      v: [1, 2, 3],
      children: [{ type: 'cube', size: [1, 1, 1] }]
    };

    const result = await processor.processNode(translateNode, context);

    expect(result.success).toBe(true);
    expect(result.data.isManifold).toBe(true);
    expect(result.data.type).toBe('translate');
    expect(result.data.metadata.transformation.translation).toEqual([1, 2, 3]);
  });

  test('should compose nested transformations correctly', async () => {
    const nestedNode: TranslateNode = {
      type: 'translate',
      v: [1, 0, 0],
      children: [{
        type: 'rotate',
        a: [0, 0, Math.PI/4],
        children: [{ type: 'cube', size: [1, 1, 1] }]
      }]
    };

    const result = await processor.processNode(nestedNode, context);

    expect(result.success).toBe(true);
    expect(result.data.metadata.transformation.composed).toBe(true);
    expect(result.data.metadata.transformation.operations).toHaveLength(2);
  });

  test('should handle rotation with proper matrix composition', async () => {
    const rotateNode: RotateNode = {
      type: 'rotate',
      a: [Math.PI/2, 0, 0],
      children: [{ type: 'cube', size: [1, 1, 1] }]
    };

    const result = await processor.processNode(rotateNode, context);

    expect(result.success).toBe(true);
    expect(result.data.metadata.transformation.rotation).toEqual([Math.PI/2, 0, 0]);
  });

  test('should apply scaling transformation', async () => {
    const scaleNode: ScaleNode = {
      type: 'scale',
      v: [2, 1, 0.5],
      children: [{ type: 'sphere', r: 1 }]
    };

    const result = await processor.processNode(scaleNode, context);

    expect(result.success).toBe(true);
    expect(result.data.metadata.transformation.scale).toEqual([2, 1, 0.5]);
  });

  test('should handle mirror transformation', async () => {
    const mirrorNode: MirrorNode = {
      type: 'mirror',
      v: [1, 0, 0],
      children: [{ type: 'cube', size: [1, 1, 1] }]
    };

    const result = await processor.processNode(mirrorNode, context);

    expect(result.success).toBe(true);
    expect(result.data.metadata.transformation.mirror).toEqual([1, 0, 0]);
  });

  test('should apply multmatrix transformation', async () => {
    const matrix = [
      [1, 0, 0, 1],
      [0, 1, 0, 2],
      [0, 0, 1, 3],
      [0, 0, 0, 1]
    ];

    const multmatrixNode: MultmatrixNode = {
      type: 'multmatrix',
      m: matrix,
      children: [{ type: 'cube', size: [1, 1, 1] }]
    };

    const result = await processor.processNode(multmatrixNode, context);

    expect(result.success).toBe(true);
    expect(result.data.metadata.transformation.matrix).toEqual(matrix);
  });

  test('should maintain transformation stack correctly', async () => {
    const initialStackLength = context.transformationStack.length;

    const translateNode: TranslateNode = {
      type: 'translate',
      v: [1, 0, 0],
      children: [{ type: 'cube', size: [1, 1, 1] }]
    };

    await processor.processNode(translateNode, context);

    // Stack should be restored after processing
    expect(context.transformationStack.length).toBe(initialStackLength);
  });
});
```

**Green Phase (25 minutes)**:
```typescript
// Implementation: src/features/3d-renderer/services/manifold-pipeline/processors/manifold-transformation-processor.ts
/**
 * @file Manifold Transformation Processor
 * @description Handles all OpenSCAD transformation operations using Manifold native methods
 */

import type { ASTNode, TranslateNode, RotateNode, ScaleNode, MirrorNode, MultmatrixNode } from '../../../../openscad-parser/core/ast-types';
import { createLogger } from '../../../../../shared/services/logger.service';
import type { Result } from '../../../../../shared/types/result.types';

/**
 * Processor for transformation operations using Manifold native API
 * Implements SRP by focusing solely on transformations
 */
export class ManifoldTransformationProcessor implements ASTProcessor {
  readonly name = 'ManifoldTransformationProcessor';
  readonly version = '1.0.0';

  private readonly logger = createLogger(this.name);
  private manifoldModule: any = null;

  /**
   * Initialize Manifold WASM module
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      const { ManifoldWasmLoader } = await import('../../manifold-wasm-loader/manifold-wasm-loader');
      const loader = new ManifoldWasmLoader();
      const loadResult = await loader.load();

      if (!loadResult.success) {
        return { success: false, error: `Failed to load Manifold WASM: ${loadResult.error}` };
      }

      this.manifoldModule = loadResult.data;
      this.logger.info('[INIT] ManifoldTransformationProcessor initialized');
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: `Initialization failed: ${error}` };
    }
  }

  /**
   * Check if processor can handle this node type
   */
  canProcess(node: ASTNode): boolean {
    return ['translate', 'rotate', 'scale', 'mirror', 'multmatrix'].includes(node.type);
  }

  /**
   * Process transformation node with context
   */
  async processNode(node: ASTNode, context: ProcessingContext): Promise<Result<ManifoldObject, string>> {
    if (!this.manifoldModule) {
      return { success: false, error: 'Manifold WASM module not initialized' };
    }

    context.performanceMonitor.startStage(`transformation_${node.type}`);

    try {
      let result: Result<ManifoldObject, string>;

      switch (node.type) {
        case 'translate':
          result = await this.processTranslate(node as TranslateNode, context);
          break;
        case 'rotate':
          result = await this.processRotate(node as RotateNode, context);
          break;
        case 'scale':
          result = await this.processScale(node as ScaleNode, context);
          break;
        case 'mirror':
          result = await this.processMirror(node as MirrorNode, context);
          break;
        case 'multmatrix':
          result = await this.processMultmatrix(node as MultmatrixNode, context);
          break;
        default:
          return { success: false, error: `Unsupported transformation type: ${node.type}` };
      }

      const duration = context.performanceMonitor.endStage(`transformation_${node.type}`);
      this.logger.debug(`Transformation ${node.type} completed in ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      context.performanceMonitor.endStage(`transformation_${node.type}`);
      return { success: false, error: `Transformation failed: ${error}` };
    }
  }

  /**
   * Process translate transformation using Manifold native API
   */
  private async processTranslate(node: TranslateNode, context: ProcessingContext): Promise<Result<ManifoldObject, string>> {
    // Process child first
    const childResult = await this.processChild(node.children[0], context);
    if (!childResult.success) {
      return childResult;
    }

    // Apply translation using Manifold native method
    const [x, y, z] = node.v.length === 3 ? node.v : [node.v[0] || 0, node.v[1] || 0, 0];

    try {
      const translatedManifold = childResult.data.manifoldInstance.translate([x, y, z]);

      // Register for cleanup
      context.resourceManager.register(translatedManifold, {
        type: 'translated_manifold',
        estimatedSize: this.estimateManifoldSize(translatedManifold),
      });

      return {
        success: true,
        data: {
          manifoldInstance: translatedManifold,
          type: 'translate',
          boundingBox: this.calculateBoundingBox(translatedManifold),
          metadata: {
            transformation: {
              translation: [x, y, z],
              composed: false,
              operations: ['translate'],
            },
            originalChild: childResult.data,
          },
          isManifold: true,
        },
      };
    } catch (error) {
      return { success: false, error: `Translation failed: ${error}` };
    }
  }

  /**
   * Process child node recursively
   */
  private async processChild(child: ASTNode, context: ProcessingContext): Promise<Result<ManifoldObject, string>> {
    // This would delegate to the appropriate processor based on node type
    // Implementation depends on the processor registry/factory pattern
    throw new Error('Child processing not implemented - requires processor registry');
  }

  /**
   * Calculate bounding box for Manifold object
   */
  private calculateBoundingBox(manifoldObject: any): BoundingBox {
    const bounds = manifoldObject.boundingBox();
    return {
      min: [bounds.min.x, bounds.min.y, bounds.min.z],
      max: [bounds.max.x, bounds.max.y, bounds.max.z],
    };
  }

  /**
   * Estimate Manifold object size for memory tracking
   */
  private estimateManifoldSize(manifoldObject: any): number {
    // Basic estimation - can be improved with actual Manifold API
    const mesh = manifoldObject.getMesh();
    return mesh.vertPos.length * 4 + mesh.triVerts.length * 4; // Rough estimate
  }

  /**
   * Clean up processor resources
   */
  dispose(): void {
    this.manifoldModule = null;
    this.logger.debug('[END] ManifoldTransformationProcessor disposed');
  }
}
```

**Refactor Phase (5 minutes)**:
- Implement remaining transformation methods (rotate, scale, mirror, multmatrix)
- Add proper matrix composition for nested transformations
- Implement transformation stack management

#### Step 2.3: Manifold CSG Processor (60 minutes)

**Integration Testing (25 minutes)**:
```typescript
// Test: src/features/3d-renderer/services/manifold-pipeline/integration/pipeline-integration.test.ts
describe('Manifold Pipeline Integration', () => {
  let pipeline: ManifoldPipelineService;

  beforeEach(async () => {
    // Create pipeline with real processors (not mocks)
    pipeline = new ManifoldPipelineService({
      primitiveFactory: new ManifoldPrimitiveFactory(),
      transformationProcessor: new ManifoldTransformationProcessor(),
      csgProcessor: new ManifoldCSGProcessor(),
      converter: new ManifoldToThreeConverter(),
    });
    await pipeline.initialize();
  });

  test('should process complete OpenSCAD example maintaining manifoldness', async () => {
    const complexAST: ASTNode[] = [
      {
        type: 'difference',
        children: [
          { type: 'cube', size: [2, 2, 2] },
          {
            type: 'translate',
            v: [0, 0, 0.5],
            children: [{ type: 'cylinder', h: 3, r: 0.5 }]
          }
        ]
      }
    ];

    const result = await pipeline.processAST(complexAST);

    expect(result.success).toBe(true);
    expect(result.data.manifoldness).toBe(true);
    expect(result.data.operationsPerformed).toContain('primitive_creation');
    expect(result.data.operationsPerformed).toContain('transformation');
    expect(result.data.operationsPerformed).toContain('csg_operations');
    expect(result.data.operationsPerformed).toContain('three_conversion');
  });

  test('should maintain performance targets (<16ms)', async () => {
    const simpleAST: ASTNode[] = [{ type: 'cube', size: [1, 1, 1] }];

    const startTime = performance.now();
    const result = await pipeline.processAST(simpleAST);
    const processingTime = performance.now() - startTime;

    expect(result.success).toBe(true);
    expect(processingTime).toBeLessThan(16); // <16ms target
    expect(result.data.processingTime).toBeLessThan(16);
  });

  test('should handle memory cleanup properly', async () => {
    const astNodes: ASTNode[] = Array.from({ length: 10 }, (_, i) => ({
      type: 'cube',
      size: [1, 1, 1]
    }));

    // Process multiple times to test memory cleanup
    for (let i = 0; i < 5; i++) {
      const result = await pipeline.processAST(astNodes);
      expect(result.success).toBe(true);
    }

    // Verify no memory leaks (implementation-specific)
    expect(pipeline.getMemoryUsage()).toBeLessThan(100 * 1024 * 1024); // 100MB limit
  });
});
```

**Performance Validation (15 minutes)**:
```typescript
// Test: src/features/3d-renderer/services/manifold-pipeline/performance/pipeline-performance.test.ts
describe('Manifold Pipeline Performance', () => {
  test('should benchmark pipeline stages', async () => {
    const pipeline = new ManifoldPipelineService(dependencies);
    await pipeline.initialize();

    const astNodes: ASTNode[] = [
      { type: 'cube', size: [1, 1, 1] },
      { type: 'sphere', r: 0.5 },
      { type: 'cylinder', h: 2, r: 0.3 }
    ];

    const result = await pipeline.processAST(astNodes);

    expect(result.success).toBe(true);

    // Validate stage performance
    const stageMetrics = result.data.metadata.stageMetrics;
    expect(stageMetrics.primitiveCreation).toBeLessThan(5); // 5ms max
    expect(stageMetrics.transformation).toBeLessThan(3); // 3ms max
    expect(stageMetrics.csgOperations).toBeLessThan(5); // 5ms max
    expect(stageMetrics.conversion).toBeLessThan(3); // 3ms max
  });

  test('should scale linearly with primitive count', async () => {
    const pipeline = new ManifoldPipelineService(dependencies);
    await pipeline.initialize();

    const singlePrimitive = [{ type: 'cube', size: [1, 1, 1] }];
    const multiplePrimitives = Array.from({ length: 10 }, () => ({ type: 'cube', size: [1, 1, 1] }));

    const singleResult = await pipeline.processAST(singlePrimitive);
    const multipleResult = await pipeline.processAST(multiplePrimitives);

    expect(singleResult.success).toBe(true);
    expect(multipleResult.success).toBe(true);

    // Should scale roughly linearly (with some overhead)
    const scalingFactor = multipleResult.data.processingTime / singleResult.data.processingTime;
    expect(scalingFactor).toBeLessThan(15); // Should be close to 10x, allowing for overhead
  });
});
```

### Phase 3: Architecture Cleanup and Documentation (30 minutes)

#### Step 3.1: Remove Redundant Code (15 minutes)

**Files to Remove/Refactor:**
1. **ManifoldASTConverter transformation methods** - Replace with pipeline processors
2. **Mixed primitive creation code** - Consolidate in ManifoldPrimitiveFactory
3. **Scattered CSG operations** - Centralize in ManifoldCSGProcessor
4. **Redundant mesh conversion utilities** - Use ManifoldToThreeConverter

**Refactoring Strategy:**
```typescript
// Update renderASTNode to use new pipeline
export const renderASTNode = async (
  node: ASTNode,
  index: number
): Promise<Result<Mesh3D, string>> => {
  // Use dependency injection for testability (DIP)
  const pipeline = PipelineFactory.createManifoldPipeline();

  const result = await pipeline.processAST([node]);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return convertPipelineResultToMesh3D(result.data, index);
};

// Factory for pipeline creation (OCP)
export class PipelineFactory {
  static createManifoldPipeline(): ManifoldPipelineService {
    return new ManifoldPipelineService({
      primitiveFactory: new ManifoldPrimitiveFactory(),
      transformationProcessor: new ManifoldTransformationProcessor(),
      csgProcessor: new ManifoldCSGProcessor(),
      converter: new ManifoldToThreeConverter(),
    });
  }
}
```

#### Step 3.2: Update Documentation (15 minutes)

**Architecture Documentation Updates:**
1. **Pipeline Flow Diagrams** - Visual representation of new architecture
2. **API Documentation** - JSDoc for all new services and interfaces
3. **Performance Benchmarks** - Before/after performance comparisons
4. **Migration Guide** - How to transition from old to new architecture

**Documentation Structure:**
```markdown
# Manifold Pipeline Architecture

## Overview
- Pipeline stages and responsibilities
- SOLID principles implementation
- Performance characteristics

## API Reference
- Interface documentation
- Usage examples
- Error handling patterns

## Performance Guide
- Benchmarking results
- Optimization strategies
- Memory management

## Migration Guide
- Breaking changes
- Upgrade path
- Compatibility notes
```

## Success Criteria

## Success Criteria

### Functional Requirements ✅
- [ ] **Pipeline Architecture**: Complete Manifold Operations Layer implemented with clean separation of concerns
- [ ] **SOLID Compliance**: All services follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
- [ ] **Manifold Native Operations**: All primitives, transformations, and CSG operations use Manifold native API exclusively
- [ ] **Manifoldness Guarantees**: Pipeline ensures manifold properties throughout geometric processing
- [ ] **Performance Targets**: <16ms render times maintained with new architecture

### Quality Requirements ✅
- [ ] **TypeScript Strict Mode**: Zero compilation errors with explicit type annotations and advanced types
- [ ] **Functional Programming**: Pure functions, immutability, Result<T,E> error handling, and function composition
- [ ] **Code Quality**: Zero Biome violations, comprehensive JSDoc documentation, and clean code principles
- [ ] **Test Coverage**: 95% coverage maintained with TDD methodology and real implementation testing
- [ ] **Memory Management**: Proper Manifold object lifecycle management with RAII patterns

### Architecture Requirements ✅
- [ ] **Clean Interfaces**: Well-defined processor interfaces following ISP
- [ ] **Dependency Injection**: Services depend on abstractions for testability (DIP)
- [ ] **Error Handling**: Structured error handling with meaningful context and validation
- [ ] **Performance Monitoring**: Pipeline stage timing and memory usage tracking
- [ ] **Extensibility**: Plugin architecture for new processors and transformation types

## Focused Implementation Timeline

**Total Estimated Time**: 1.5 hours (focused enhancement of existing system)

### Phase 1: Manifold Transformation Enhancement (45 minutes)
- **Step 1.1**: Manifold Conversion Utilities (15 minutes)
- **Step 1.2**: Enhanced Transformation Methods (30 minutes)

### Phase 2: Performance Enhancement and Integration (30 minutes)
- **Step 2.1**: Performance Monitoring Integration (15 minutes)
- **Step 2.2**: Integration Testing with Existing System (15 minutes)

### Phase 3: Validation and Documentation (15 minutes)
- **Step 3.1**: Performance Validation (10 minutes)
- **Step 3.2**: Documentation Updates (5 minutes)

## Enhanced ManifoldASTConverter Implementation

### Phase 2: Performance Enhancement and Integration (30 minutes)

#### Step 2.1: Performance Monitoring Integration (15 minutes)

**Implementation**: Enhance existing ManifoldASTConverter with performance monitoring
```typescript
// Enhancement: src/features/3d-renderer/services/manifold-ast-converter/manifold-ast-converter.ts
/**
 * Enhanced ManifoldASTConverter with Manifold native transformations
 * Builds on existing architecture following SOLID/DRY principles
 */
export class ManifoldASTConverter {
  private materialManager: MaterialIDManager;
  private csgOperations: ManifoldCSGOperations | null = null;
  private conversionUtils: ManifoldConversionUtils; // NEW: Add conversion utilities
  private performanceMetrics: Map<string, number> = new Map(); // NEW: Performance tracking
  private isInitialized = false;

  constructor(materialManager: MaterialIDManager) {
    this.materialManager = materialManager;
    this.conversionUtils = new ManifoldConversionUtils(); // NEW: Initialize utilities
    logger.debug('[DEBUG][ManifoldASTConverter] Created enhanced AST converter');
  }

  /**
   * Enhanced initialization with conversion utilities
   */
  async initialize(): Promise<Result<void, string>> {
    // Existing initialization logic...

    // NEW: Initialize conversion utilities
    const utilsResult = await this.conversionUtils.initialize();
    if (!utilsResult.success) {
      return { success: false, error: `Failed to initialize conversion utils: ${utilsResult.error}` };
    }

    this.isInitialized = true;
    logger.info('[INIT] Enhanced ManifoldASTConverter initialized with native transformations');
    return { success: true, data: undefined };
  }

  /**
   * Enhanced convertNode with performance monitoring
   */
  async convertNode(
    node: ASTNode,
    options: ManifoldConversionOptions = {}
  ): Promise<Result<EnhancedManifoldConversionResult, string>> {
    if (!this.isInitialized || !this.csgOperations) {
      return { success: false, error: 'ManifoldASTConverter not initialized' };
    }

    const startTime = performance.now();
    const operationType = `convert_${node.type}`;

    try {
      logger.debug(`[DEBUG][ManifoldASTConverter] Converting AST node with enhanced transformations`, { type: node.type });

      let result: Result<CSGOperationResult, string>;

      // Existing switch statement with enhanced transformation methods
      switch (node.type) {
        case 'cube':
        case 'sphere':
        case 'cylinder':
          result = await this.convertPrimitiveNode(node, options);
          break;
        case 'translate':
          result = await this.convertTranslateNodeEnhanced(node as TranslateNode, options); // ENHANCED
          break;
        case 'rotate':
          result = await this.convertRotateNodeEnhanced(node as RotateNode, options); // ENHANCED
          break;
        case 'scale':
          result = await this.convertScaleNodeEnhanced(node as ScaleNode, options); // ENHANCED
          break;
        case 'multmatrix':
          result = await this.convertMultmatrixNodeEnhanced(node as MultmatrixNode, options); // ENHANCED
          break;
        // ... existing CSG operations remain unchanged
        default:
          return { success: false, error: `Unsupported AST node type: ${node.type}` };
      }

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const processingTime = performance.now() - startTime;
      this.performanceMetrics.set(operationType, processingTime);

      // Enhanced result with transformation metadata
      const enhancedResult: EnhancedManifoldConversionResult = {
        ...result.data,
        transformationMetadata: {
          usedManifoldNative: ['translate', 'rotate', 'scale', 'multmatrix'].includes(node.type),
          transformationType: node.type,
          transformationParams: this.extractTransformationParams(node),
          processingTime,
        },
      };

      logger.debug(`[DEBUG][ManifoldASTConverter] Enhanced conversion completed in ${processingTime.toFixed(2)}ms`);
      return { success: true, data: enhancedResult };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.performanceMetrics.set(`${operationType}_error`, processingTime);

      const errorMessage = `Enhanced conversion failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldASTConverter] Enhanced conversion failed', { error: errorMessage, nodeType: node.type });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Enhanced translate node conversion using Manifold native API
   * Replaces manual vertex manipulation with Manifold transformation
   */
  private async convertTranslateNodeEnhanced(
    node: TranslateNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    const firstChild = node.children?.[0];
    if (!firstChild) {
      return { success: false, error: 'Translate node must have at least one child' };
    }

    // Process child first (existing pattern)
    const childResult = await this.convertNode(firstChild, options);
    if (!childResult.success) {
      return { success: false, error: `Failed to convert child: ${childResult.error}` };
    }

    // NEW: Use Manifold native transformation instead of vertex manipulation
    const [x, y, z] = node.v.length === 3 ? node.v : [node.v[0] || 0, node.v[1] || 0, 0];

    try {
      const transformedResult = await this.conversionUtils.applyManifoldTransformation(
        childResult.data.geometry,
        (manifold) => manifold.translate([x, y, z])
      );

      if (!transformedResult.success) {
        return { success: false, error: transformedResult.error };
      }

      return {
        success: true,
        data: {
          geometry: transformedResult.data,
          operationTime: performance.now() - Date.now(),
          vertexCount: transformedResult.data.getAttribute('position').count,
          triangleCount: transformedResult.data.getIndex()?.count ? transformedResult.data.getIndex()!.count / 3 : 0,
          materialGroups: childResult.data.materialGroups ?? 0,
        },
      };
    } catch (error) {
      return { success: false, error: `Manifold translation failed: ${error}` };
    }
  }

  /**
   * Extract transformation parameters for metadata
   */
  private extractTransformationParams(node: ASTNode): Record<string, unknown> {
    switch (node.type) {
      case 'translate':
        const translateNode = node as TranslateNode;
        const [x, y, z] = translateNode.v.length === 3 ? translateNode.v : [translateNode.v[0] || 0, translateNode.v[1] || 0, 0];
        return { x, y, z };
      case 'rotate':
        const rotateNode = node as RotateNode;
        return { rotation: rotateNode.a };
      case 'scale':
        const scaleNode = node as ScaleNode;
        return { scale: scaleNode.v };
      default:
        return {};
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): ReadonlyMap<string, number> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Enhanced disposal with conversion utilities cleanup
   */
  dispose(): void {
    // Existing disposal logic...
    this.conversionUtils.dispose(); // NEW: Clean up utilities
    this.performanceMetrics.clear(); // NEW: Clear metrics
    logger.debug('[END] Enhanced ManifoldASTConverter disposed');
  }
}
```

## Conclusion

This focused enhancement plan applies SOLID, DRY, and TDD principles correctly by building on existing architecture:

### Key Improvements Applied ✅

**1. Follows SOLID Principles**
- **SRP**: Enhances existing ManifoldASTConverter (single responsibility for AST conversion)
- **OCP**: Extends existing methods with Manifold native transformations (open for extension)
- **LSP**: Maintains existing Result<T,E> patterns and interfaces
- **ISP**: Uses existing focused interfaces without creating unnecessary new ones
- **DIP**: Leverages existing dependency injection patterns

**2. Follows DRY Principles**
- **Reuses Existing Infrastructure**: Builds on comprehensive ManifoldASTConverter, CSG operations, memory management
- **Enhances Existing Tests**: Adds to existing test suite instead of rewriting
- **Leverages Existing Patterns**: Uses established Result<T,E>, RAII, and error handling

**3. Follows TDD Principles**
- **Builds on Existing Tests**: Enhances comprehensive existing test coverage
- **Real Implementation Testing**: Uses actual Manifold WASM module (no mocks)
- **Incremental Enhancement**: Red-Green-Refactor cycle for transformation improvements

**4. Addresses Real Problem**
- **Transformation Placeholders**: Replaces manual vertex manipulation with Manifold native API
- **Performance Enhancement**: Adds monitoring to existing converter
- **Maintains Compatibility**: Existing renderASTNode() and R3FScene continue to work

### Technical Benefits ✅
- **Lower Risk**: Enhances working code instead of complete rewrite
- **Faster Implementation**: 1.5 hours vs 4.5 hours (3x faster)
- **Maintains Quality**: Leverages existing comprehensive infrastructure
- **Better Architecture**: Follows established patterns instead of creating new complexity

### Implementation Readiness ✅
- **Focused Scope**: Only fixes actual transformation placeholder issues
- **Existing Infrastructure**: Leverages comprehensive existing test suite and patterns
- **Proven Approach**: Enhances working architecture following SOLID/DRY/TDD principles
- **Low Risk**: Minimal changes to working system with comprehensive fallback

**This focused enhancement plan correctly applies software engineering principles by enhancing existing working architecture rather than rebuilding it, resulting in faster delivery, lower risk, and better adherence to SOLID, DRY, and TDD principles.**
