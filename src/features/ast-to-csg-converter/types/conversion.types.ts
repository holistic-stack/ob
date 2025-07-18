/**
 * @file conversion.types.ts
 * @description This file defines the core type interfaces for the AST to CSG (Constructive Solid Geometry)
 * conversion layer. This layer acts as a bridge, encapsulating OpenSCAD-specific knowledge
 * and providing generic, renderer-agnostic data structures for the 3D rendering pipeline.
 *
 * @architectural_decision
 * - **Renderer Agnostic Data Structures**: The types defined here (`GenericMeshData`, `MaterialConfig`,
 *   `MeshMetadata`) are designed to be independent of any specific 3D rendering library (e.g., Babylon.js, Three.js).
 *   This promotes modularity and allows for easier swapping of rendering engines in the future.
 * - **Clear Separation of Concerns**: This file focuses solely on defining data structures for conversion,
 *   keeping it separate from the implementation logic of the conversion services themselves.
 * - **Readonly Properties**: All properties in the interfaces are marked `readonly` to enforce immutability,
 *   aligning with functional programming principles and preventing accidental state mutations.
 * - **Bridge Pattern Support**: These types support the Bridge Pattern implementation, allowing the
 *   existing OpenSCAD parser to remain unchanged while adding conversion capabilities.
 *
 * @performance_considerations
 * **Memory Efficiency**:
 * - All interfaces use `readonly` properties to enable structural sharing and prevent mutations
 * - `GenericMeshData` uses `unknown` types for renderer-specific data to avoid memory overhead
 * - Metadata includes `lastAccessed` timestamps for cache management and cleanup
 *
 * **Conversion Performance**:
 * - `ConversionOptions` allows fine-tuning performance vs quality trade-offs
 * - `timeout` and `maxComplexity` options prevent runaway conversions
 * - `enableCaching` provides significant speedup for repeated conversions
 *
 * @example
 * ```typescript
 * // Production pipeline example - OpenSCAD to BabylonJS
 * import type { GenericMeshData, ConversionResult } from './conversion.types';
 * import { ASTToMeshConversionService } from '../services/ast-to-mesh-converter/ast-to-mesh-converter';
 *
 * async function productionConversionPipeline(openscadCode: string): Promise<GenericMeshData[]> {
 *   // Step 1: Parse OpenSCAD code (using existing parser)
 *   const parser = await createTestParser();
 *   const parseResult = parser.parseASTWithResult(openscadCode);
 *
 *   if (!parseResult.success) {
 *     throw new Error(`Parsing failed: ${parseResult.error}`);
 *   }
 *
 *   // Step 2: Convert AST to generic mesh data
 *   const converter = new ASTToMeshConversionService();
 *   await converter.initialize();
 *
 *   const conversionOptions: ConversionOptions = {
 *     preserveMaterials: true,
 *     optimizeResult: true,
 *     timeout: 10000,           // 10 second timeout
 *     enableCaching: true,
 *     maxComplexity: 100000     // Prevent excessive complexity
 *   };
 *
 *   const conversionResult = await converter.convert(parseResult.data, conversionOptions);
 *
 *   if (!conversionResult.success) {
 *     throw new Error(`Conversion failed: ${conversionResult.error}`);
 *   }
 *
 *   // Step 3: Validate performance targets
 *   const result: ConversionResult = conversionResult.data;
 *   console.log(`✅ Conversion metrics:`);
 *   console.log(`   Meshes: ${result.meshes.length}`);
 *   console.log(`   Vertices: ${result.totalVertices}`);
 *   console.log(`   Triangles: ${result.totalTriangles}`);
 *   console.log(`   Time: ${result.operationTime.toFixed(2)}ms`);
 *
 *   if (result.operationTime > 50) {
 *     console.warn(`⚠️ Conversion exceeded 50ms target: ${result.operationTime}ms`);
 *   }
 *
 *   // Step 4: Return generic mesh data (ready for any renderer)
 *   converter.dispose();
 *   parser.dispose();
 *
 *   return result.meshes;
 * }
 *
 * // Usage examples:
 * const cubeGeometry = await productionConversionPipeline('cube(10);');
 * const csgGeometry = await productionConversionPipeline('difference() { cube(10); sphere(6); }');
 * ```
 *
 * @example
 * ```typescript
 * // Multi-renderer compatibility example
 * import type { GenericMeshData, MaterialConfig } from './conversion.types';
 *
 * // BabylonJS renderer adapter
 * function convertToBabylonMesh(genericMesh: GenericMeshData): BABYLON.Mesh {
 *   const babylonGeometry = genericMesh.geometry as BABYLON.Geometry;
 *   const babylonMaterial = createBabylonMaterial(genericMesh.material);
 *   const babylonTransform = genericMesh.transform as BABYLON.Matrix;
 *
 *   const mesh = new BABYLON.Mesh(genericMesh.id, scene);
 *   mesh.geometry = babylonGeometry;
 *   mesh.material = babylonMaterial;
 *   mesh.setWorldMatrix(babylonTransform);
 *
 *   return mesh;
 * }
 *
 * // Three.js renderer adapter (future implementation)
 * function convertToThreeMesh(genericMesh: GenericMeshData): THREE.Mesh {
 *   const threeGeometry = genericMesh.geometry as THREE.BufferGeometry;
 *   const threeMaterial = createThreeMaterial(genericMesh.material);
 *   const threeTransform = genericMesh.transform as THREE.Matrix4;
 *
 *   const mesh = new THREE.Mesh(threeGeometry, threeMaterial);
 *   mesh.applyMatrix4(threeTransform);
 *
 *   return mesh;
 * }
 *
 * // Unified rendering interface
 * interface RendererAdapter<TMesh> {
 *   convertMesh(genericMesh: GenericMeshData): TMesh;
 *   addToScene(mesh: TMesh): void;
 * }
 *
 * class BabylonAdapter implements RendererAdapter<BABYLON.Mesh> {
 *   convertMesh = convertToBabylonMesh;
 *   addToScene(mesh: BABYLON.Mesh) { /* babylon-specific scene addition * / }
 * }
 * ```
 *
 * @integration_patterns
 * **React Component Integration**:
 * ```typescript
 * import { useASTConverter } from '../hooks/use-ast-converter/use-ast-converter';
 * import type { GenericMeshData, ConversionOptions } from './conversion.types';
 *
 * function MeshPreview({ openscadCode }: { openscadCode: string }) {
 *   const { state, convert } = useASTConverter();
 *   const [meshes, setMeshes] = useState<GenericMeshData[]>([]);
 *
 *   useEffect(() => {
 *     async function performConversion() {
 *       const parser = await createTestParser();
 *       const parseResult = parser.parseASTWithResult(openscadCode);
 *
 *       if (parseResult.success) {
 *         const options: ConversionOptions = {
 *           optimizeResult: true,
 *           enableCaching: true,
 *           timeout: 5000
 *         };
 *
 *         const result = await convert(parseResult.data, options);
 *         if (result.success) {
 *           setMeshes(result.data.meshes);
 *         }
 *       }
 *       parser.dispose();
 *     }
 *
 *     performConversion();
 *   }, [openscadCode, convert]);
 *
 *   return (
 *     <div>
 *       {state.isConverting ? 'Converting...' : `${meshes.length} objects`}
 *       {meshes.map(mesh => (
 *         <div key={mesh.id}>
 *           Mesh: {mesh.metadata.vertexCount} vertices, {mesh.metadata.triangleCount} triangles
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @error_handling_patterns
 * ```typescript
 * import type { ConversionError, ConversionResult } from './conversion.types';
 *
 * function handleConversionErrors(result: ConversionResult): void {
 *   if (result.errors.length > 0) {
 *     result.errors.forEach(error => {
 *       console.error(`Conversion error: ${error}`);
 *
 *       // Log structured error for monitoring
 *       const structuredError: ConversionError = {
 *         type: 'geometry',
 *         message: error,
 *         nodeType: 'unknown',
 *         timestamp: new Date()
 *       };
 *
 *       // Send to error tracking service
 *       reportError(structuredError);
 *     });
 *   }
 * }
 *
 * // Usage with comprehensive error handling
 * async function safeConversion(ast: ASTNode[]): Promise<GenericMeshData[]> {
 *   try {
 *     const result = await converter.convert(ast, {
 *       timeout: 10000,
 *       maxComplexity: 50000
 *     });
 *
 *     if (result.success) {
 *       handleConversionErrors(result.data);
 *       return result.data.meshes;
 *     } else {
 *       throw new Error(result.error);
 *     }
 *   } catch (error) {
 *     console.error('Critical conversion failure:', error);
 *     return []; // Graceful degradation
 *   }
 * }
 * ```
 */

import type { Result } from '../../../shared/types/result.types';

/**
 * @interface GenericMeshData
 * @description Represents a renderer-agnostic 3D mesh data structure.
 * This interface defines the standardized format for 3D objects after conversion from OpenSCAD AST,
 * making them consumable by various rendering layers without direct OpenSCAD dependencies.
 * @property {string} id - A unique identifier for the mesh.
 * @property {unknown} geometry - The raw geometric data of the mesh (e.g., vertex buffers, index buffers).
 *   This is `unknown` to remain renderer-agnostic; it will be cast to a specific type (e.g., Babylon.js `Geometry`)
 *   by the rendering layer.
 * @property {MaterialConfig} material - Configuration for the mesh's visual appearance (color, roughness, etc.).
 * @property {unknown} transform - The transformation matrix (e.g., position, rotation, scale) applied to the mesh.
 *   This is `unknown` to remain renderer-agnostic; it will be cast to a specific type (e.g., Babylon.js `Matrix`).
 * @property {MeshMetadata} metadata - Additional descriptive information about the mesh, such as vertex counts and bounding box.
 *
 * @limitations
 * - The `geometry` and `transform` properties are currently `unknown`.
 *   While this maintains renderer-agnosticism, it requires careful type assertion in consuming code.
 *   Future improvements might involve more specific generic types or a dedicated abstraction layer.
 *
 * @example
 * ```typescript
 * const mesh: GenericMeshData = {
 *   id: 'my-sphere',
 *   geometry: { /* ... vertex and index data ... * / },
 *   material: { color: '#00FF00', metalness: 0.5 },
 *   transform: { /* ... 4x4 matrix ... * / },
 *   metadata: { meshId: 'my-sphere', vertexCount: 100, triangleCount: 200, /* ... * / },
 * };
 * ```
 */
export interface GenericMeshData {
  readonly id: string;
  readonly geometry: unknown; // TODO: Replace with BabylonJS Geometry
  readonly material: MaterialConfig;
  readonly transform: unknown; // TODO: Replace with BabylonJS Matrix
  readonly metadata: MeshMetadata;
}

/**
 * @interface MaterialConfig
 * @description Defines the properties for configuring the visual material of a 3D mesh.
 * These properties are common across many rendering engines and allow for basic material customization.
 * @property {string} color - The base color of the material, typically in hexadecimal format (e.g., '#RRGGBB').
 * @property {number} metalness - How metallic the material is (0.0 for dielectric, 1.0 for metallic).
 * @property {number} roughness - How rough the material is (0.0 for smooth, 1.0 for rough).
 * @property {number} opacity - The transparency of the material (0.0 for fully transparent, 1.0 for fully opaque).
 * @property {boolean} transparent - A flag indicating whether the material should be rendered with transparency.
 * @property {'front' | 'back' | 'double'} side - Specifies which sides of the mesh faces are rendered.
 *   - `'front'`: Only front faces are rendered.
 *   - `'back'`: Only back faces are rendered.
 *   - `'double'`: Both front and back faces are rendered.
 * @property {boolean} [wireframe] - Optional. If `true`, the mesh will be rendered as a wireframe.
 *
 * @example
 * ```typescript
 * const redOpaque: MaterialConfig = {
 *   color: '#FF0000',
 *   metalness: 0.1,
 *   roughness: 0.8,
 *   opacity: 1.0,
 *   transparent: false,
 *   side: 'double',
 * };
 *
 * const blueTransparentWireframe: MaterialConfig = {
 *   color: '#0000FF',
 *   metalness: 0.0,
 *   roughness: 0.5,
 *   opacity: 0.5,
 *   transparent: true,
 *   side: 'front',
 *   wireframe: true,
 * };
 * ```
 */
export interface MaterialConfig {
  readonly color: string;
  readonly metalness: number;
  readonly roughness: number;
  readonly opacity: number;
  readonly transparent: boolean;
  readonly side: 'front' | 'back' | 'double';
  readonly wireframe?: boolean;
}

/**
 * @interface MeshMetadata
 * @description Provides additional descriptive and performance-related metadata for a `GenericMeshData` object.
 * This information can be used for debugging, optimization, or displaying statistics in the UI.
 * @property {string} meshId - A unique identifier for the mesh, often derived from the conversion process.
 * @property {number} triangleCount - The number of triangles (faces) in the mesh.
 * @property {number} vertexCount - The number of vertices in the mesh.
 * @property {unknown} boundingBox - The axis-aligned bounding box of the mesh. This is `unknown` to remain
 *   renderer-agnostic; it will be cast to a specific type (e.g., Babylon.js `BoundingBox`).
 * @property {number} complexity - A metric representing the complexity of the mesh (e.g., number of vertices).
 * @property {number} operationTime - The time taken in milliseconds to generate or process this mesh.
 * @property {boolean} isOptimized - A flag indicating whether the mesh has undergone any optimization processes.
 * @property {Date} lastAccessed - The timestamp when this mesh data was last accessed or generated.
 *
 * @limitations
 * - The `boundingBox` is currently `unknown` and needs to be properly typed with a renderer-agnostic bounding box interface.
 * - `complexity` is currently just `vertexCount`; a more sophisticated metric might be needed for complex scenarios.
 *
 * @example
 * ```typescript
 * const metadata: MeshMetadata = {
 *   meshId: 'my-complex-model-123',
 *   triangleCount: 15000,
 *   vertexCount: 8000,
 *   boundingBox: { min: { x: -10, y: -10, z: -10 }, max: { x: 10, y: 10, z: 10 } },
 *   complexity: 8000,
 *   operationTime: 25.7,
 *   isOptimized: true,
 *   lastAccessed: new Date(),
 * };
 * ```
 */
export interface MeshMetadata {
  readonly meshId: string;
  readonly triangleCount: number;
  readonly vertexCount: number;
  readonly boundingBox: unknown; // TODO: Replace with BabylonJS BoundingBox
  readonly complexity: number;
  readonly operationTime: number;
  readonly isOptimized: boolean;
  readonly lastAccessed: Date;
}

/**
 * @interface ConversionOptions
 * @description Defines optional parameters that can influence the behavior of the AST to mesh conversion process.
 * These options allow for fine-tuning performance, quality, and feature support during conversion.
 * @property {boolean} [preserveMaterials] - Optional. If `true`, the converter should attempt to preserve material properties defined in the AST.
 * @property {boolean} [optimizeResult] - Optional. If `true`, the converter should apply mesh optimization techniques (e.g., simplification, merging).
 * @property {number} [timeout] - Optional. The maximum time in milliseconds allowed for a conversion operation before it times out.
 * @property {boolean} [enableCaching] - Optional. If `true`, the converter should cache conversion results for performance.
 * @property {number} [maxComplexity] - Optional. A threshold for mesh complexity. Conversions exceeding this might trigger warnings or alternative processing.
 *
 * @example
 * ```typescript
 * const options: ConversionOptions = {
 *   optimizeResult: true,
 *   enableCaching: true,
 *   timeout: 5000, // 5 seconds
 * };
 * ```
 */
export interface ConversionOptions {
  readonly preserveMaterials?: boolean;
  readonly optimizeResult?: boolean;
  readonly timeout?: number;
  readonly enableCaching?: boolean;
  readonly maxComplexity?: number;
}

/**
 * @interface ConversionResult
 * @description Represents the comprehensive result of an AST to mesh conversion operation,
 * especially when converting multiple AST nodes.
 * @property {ReadonlyArray<GenericMeshData>} meshes - An array of successfully converted `GenericMeshData` objects.
 * @property {number} operationTime - The total time taken in milliseconds for the entire conversion operation.
 * @property {number} totalVertices - The sum of all vertices across all generated meshes.
 * @property {number} totalTriangles - The sum of all triangles across all generated meshes.
 * @property {ReadonlyArray<string>} errors - An array of error messages encountered during the conversion process.
 *   This allows for partial success, where some meshes might convert successfully while others fail.
 *
 * @example
 * ```typescript
 * const result: ConversionResult = {
 *   meshes: [ /* ... array of GenericMeshData ... * / ],
 *   operationTime: 123.45,
 *   totalVertices: 5000,
 *   totalTriangles: 8000,
 *   errors: ['Failed to convert invalid node X', 'Material parsing error in node Y'],
 * };
 * ```
 */
export interface ConversionResult {
  readonly meshes: ReadonlyArray<GenericMeshData>;
  readonly operationTime: number;
  readonly totalVertices: number;
  readonly totalTriangles: number;
  readonly errors: ReadonlyArray<string>;
}

/**
 * @interface ASTToMeshConverter
 * @description Defines the contract for any service or class responsible for converting OpenSCAD AST nodes into 3D mesh data.
 * This interface promotes dependency inversion and allows for different implementations of the conversion logic.
 * @property {() => Promise<Result<void, string>>} initialize - Asynchronously initializes the converter and its internal dependencies.
 *   Must be called before any conversion operations.
 * @property {(ast: ReadonlyArray<unknown>, options?: ConversionOptions) => Promise<Result<ConversionResult, string>>} convert - Converts an array of generic AST nodes into a `ConversionResult`.
 * @property {(node: unknown, options?: ConversionOptions) => Promise<Result<GenericMeshData, string>>} convertSingle - Converts a single generic AST node into `GenericMeshData`.
 * @property {() => void} dispose - Disposes of any resources held by the converter, preventing memory leaks.
 *
 * @example
 * ```typescript
 * class MyCustomConverter implements ASTToMeshConverter {
 *   async initialize() { /* ... * / }
 *   async convert(astNodes) { /* ... * / }
 *   async convertSingle(node) { /* ... * / }
 *   dispose() { /* ... * / }
 * }
 *
 * const converter: ASTToMeshConverter = new MyCustomConverter();
 * await converter.initialize();
 * ```
 */
export interface ASTToMeshConverter {
  readonly initialize: () => Promise<Result<void, string>>;
  readonly convert: (
    ast: ReadonlyArray<unknown>, // Generic AST nodes
    options?: ConversionOptions
  ) => Promise<Result<ConversionResult, string>>;
  readonly convertSingle: (
    node: unknown, // Generic AST node
    options?: ConversionOptions
  ) => Promise<Result<GenericMeshData, string>>;
  readonly dispose: () => void;
}

/**
 * @interface ConversionPipelineConfig
 * @description Defines configuration parameters for the overall AST to mesh conversion pipeline.
 * These settings control aspects like optimization, concurrency, caching, and resource limits.
 * @property {boolean} enableOptimization - If `true`, enables various mesh optimization techniques within the pipeline.
 * @property {number} maxConcurrentOperations - The maximum number of conversion operations that can run in parallel.
 * @property {number} cacheSize - The maximum number of conversion results to store in the cache.
 * @property {number} timeoutMs - The maximum time in milliseconds allowed for any single operation within the pipeline.
 * @property {number} memoryLimitMB - The maximum memory in megabytes that the conversion pipeline should attempt to use.
 *
 * @example
 * ```typescript
 * const pipelineConfig: ConversionPipelineConfig = {
 *   enableOptimization: true,
 *   maxConcurrentOperations: 4,
 *   cacheSize: 100,
 *   timeoutMs: 30000, // 30 seconds
 *   memoryLimitMB: 512,
 * };
 * ```
 */
export interface ConversionPipelineConfig {
  readonly enableOptimization: boolean;
  readonly maxConcurrentOperations: number;
  readonly cacheSize: number;
  readonly timeoutMs: number;
  readonly memoryLimitMB: number;
}

/**
 * @interface ConversionError
 * @description Represents a detailed error object that can occur during the AST to mesh conversion process.
 * This provides more context than a simple string error.
 * @property {'geometry' | 'material' | 'transformation' | 'csg' | 'memory'} type - The category of the error.
 * @property {string} message - A human-readable description of the error.
 * @property {string} [nodeType] - Optional. The type of the AST node that caused the error (e.g., 'Cube', 'Sphere').
 * @property {number} [nodeIndex] - Optional. The index of the AST node in the input array that caused the error.
 * @property {string} [stack] - Optional. The stack trace of the error, useful for debugging.
 *
 * @example
 * ```typescript
 * const geomError: ConversionError = {
 *   type: 'geometry',
 *   message: 'Invalid dimensions for cube',
 *   nodeType: 'Cube',
 *   nodeIndex: 0,
 * };
 *
 * const csgError: ConversionError = {
 *   type: 'csg',
 *   message: 'CSG operation resulted in an empty mesh',
 *   nodeType: 'Difference',
 * };
 * ```
 */
export interface ConversionError {
  readonly type: 'geometry' | 'material' | 'transformation' | 'csg' | 'memory';
  readonly message: string;
  readonly nodeType?: string;
  readonly nodeIndex?: number;
  readonly stack?: string;
}

/**
 * @interface ConversionMetrics
 * @description Defines performance and quality metrics collected during the conversion process.
 * This data can be used for monitoring, profiling, and reporting.
 * @property {number} totalConversions - The total number of conversion operations performed.
 * @property {number} averageTime - The average time in milliseconds taken per conversion.
 * @property {number} cacheHitRate - The percentage of conversion requests that were served from the cache.
 * @property {number} memoryUsage - The estimated memory usage in bytes by the conversion process.
 * @property {number} errorRate - The percentage of conversion operations that resulted in an error.
 *
 * @example
 * ```typescript
 * const metrics: ConversionMetrics = {
 *   totalConversions: 100,
 *   averageTime: 15.2,
 *   cacheHitRate: 0.75, // 75% cache hit
 *   memoryUsage: 1024 * 1024 * 50, // 50 MB
 *   errorRate: 0.02, // 2% error rate
 * };
 * ```
 */
export interface ConversionMetrics {
  readonly totalConversions: number;
  readonly averageTime: number;
  readonly cacheHitRate: number;
  readonly memoryUsage: number;
  readonly errorRate: number;
}
