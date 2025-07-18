/**
 * @file generic-mesh-data.types.ts
 * @description Renderer-agnostic mesh data structures enabling multi-backend 3D rendering
 * support. This implements the abstract mesh layer that bridges OpenSCAD AST to multiple
 * rendering backends (BabylonJS, Three.js future) while maintaining performance optimization
 * and comprehensive debugging capabilities.
 *
 * @architectural_decision
 * **Renderer-Agnostic Design**: GenericMeshData provides a universal interface that
 * abstracts away renderer-specific details, enabling:
 * - **Multi-Backend Support**: Same mesh data can drive BabylonJS, Three.js, or custom renderers
 * - **Future Extensibility**: New rendering backends can be added without changing core logic
 * - **Serialization Support**: Complete mesh state can be cached, persisted, or transmitted
 * - **Testing Flexibility**: Mesh generation can be tested without WebGL dependencies
 * - **Performance Isolation**: Renderer-specific optimizations don't affect core data structures
 *
 * **Comprehensive Metadata System**: Rich metadata enables debugging, performance monitoring,
 * editor integration, and sophisticated caching strategies while maintaining immutability.
 *
 * **OpenSCAD-Specific Features**: Material presets and metadata fields specifically designed
 * for OpenSCAD modifiers (*, !, #, %) and parameter tracking for editor integration.
 *
 * @performance_characteristics
 * **Memory Efficiency**:
 * - **Typed Arrays**: Float32Array/Uint32Array for optimal memory layout and GPU transfer
 * - **Immutable Sharing**: Readonly arrays prevent accidental mutations and enable sharing
 * - **Lazy Computation**: Expensive properties (surface area, volume) computed on demand
 * - **Cache-Friendly**: Sequential memory layout optimized for CPU cache performance
 *
 * **GPU Compatibility**:
 * - **Direct Transfer**: Typed arrays can be directly uploaded to GPU buffers
 * - **Interleaved Data**: Vertex attributes organized for optimal GPU access patterns
 * - **Index Optimization**: Uint32Array indices support meshes with >65K vertices
 * - **Normal Computation**: Pre-computed normals eliminate GPU computation overhead
 *
 * @example
 * **Complete Mesh Generation Pipeline**:
 * ```typescript
 * import {
 *   GenericMeshData,
 *   GenericGeometry,
 *   GenericMaterialConfig,
 *   MATERIAL_PRESETS,
 *   isGenericMeshData
 * } from './generic-mesh-data.types';
 * import { BoundingBox, Vector3, Matrix } from '@babylonjs/core';
 *
 * async function generateCubeMesh(
 *   size: [number, number, number],
 *   center: boolean = false
 * ): Promise<GenericMeshData> {
 *   const startTime = performance.now();
 *   const [width, height, depth] = size;
 *
 *   // Generate cube geometry with optimized vertex layout
 *   const geometry = createCubeGeometry(width, height, depth, center);
 *
 *   // Create material configuration for OpenSCAD default appearance
 *   const material: GenericMaterialConfig = {
 *     ...MATERIAL_PRESETS.DEFAULT,
 *     diffuseColor: [0.8, 0.8, 0.8], // Light gray
 *     metallicFactor: 0.1,
 *     roughnessFactor: 0.8,
 *   };
 *
 *   // Calculate transform matrix (identity for this example)
 *   const transform = Matrix.Identity();
 *
 *   // Generate comprehensive metadata
 *   const generationTime = performance.now() - startTime;
 *   const metadata: GenericMeshMetadata = {
 *     meshId: `cube_${Date.now()}`,
 *     name: 'cube',
 *     nodeType: 'cube',
 *     vertexCount: geometry.vertexCount,
 *     triangleCount: geometry.triangleCount,
 *     boundingBox: geometry.boundingBox,
 *     surfaceArea: calculateCubeSurfaceArea(width, height, depth),
 *     volume: width * height * depth,
 *     generationTime,
 *     optimizationTime: 0,
 *     memoryUsage: calculateMemoryUsage(geometry),
 *     complexity: geometry.triangleCount, // Simple complexity metric
 *     isOptimized: true,
 *     hasErrors: false,
 *     warnings: [],
 *     debugInfo: {
 *       dimensions: { width, height, depth },
 *       centered: center,
 *       algorithmUsed: 'box_primitive',
 *     },
 *     createdAt: new Date(),
 *     lastModified: new Date(),
 *     lastAccessed: new Date(),
 *     childIds: [],
 *     depth: 0,
 *     openscadParameters: { size, center },
 *     modifiers: [],
 *     transformations: [],
 *     csgOperations: [],
 *   };
 *
 *   const meshData: GenericMeshData = {
 *     id: metadata.meshId,
 *     geometry,
 *     material,
 *     transform,
 *     metadata,
 *   };
 *
 *   // Validate generated mesh data
 *   if (!isGenericMeshData(meshData)) {
 *     throw new Error('Generated mesh data failed validation');
 *   }
 *
 *   console.log(`Generated cube mesh: ${geometry.triangleCount} triangles in ${generationTime.toFixed(2)}ms`);
 *   return meshData;
 * }
 *
 * function createCubeGeometry(
 *   width: number,
 *   height: number,
 *   depth: number,
 *   center: boolean
 * ): GenericGeometry {
 *   // Calculate cube vertices (24 vertices for proper normals)
 *   const vertices = generateCubeVertices(width, height, depth, center);
 *   const indices = generateCubeIndices();
 *   const normals = generateCubeNormals();
 *   const uvs = generateCubeUVs();
 *
 *   // Calculate bounding box
 *   const min = center
 *     ? new Vector3(-width/2, -height/2, -depth/2)
 *     : new Vector3(0, 0, 0);
 *   const max = center
 *     ? new Vector3(width/2, height/2, depth/2)
 *     : new Vector3(width, height, depth);
 *   const boundingBox = new BoundingBox(min, max);
 *
 *   return {
 *     positions: new Float32Array(vertices),
 *     indices: new Uint32Array(indices),
 *     normals: new Float32Array(normals),
 *     uvs: new Float32Array(uvs),
 *     vertexCount: vertices.length / 3,
 *     triangleCount: indices.length / 3,
 *     boundingBox,
 *   };
 * }
 * ```
 *
 * @example
 * **Multi-Renderer Compatibility**:
 * ```typescript
 * import { GenericMeshData } from './generic-mesh-data.types';
 * import { Mesh as BabylonMesh, Scene as BabylonScene } from '@babylonjs/core';
 * import { Mesh as ThreeMesh, Scene as ThreeScene, BufferGeometry } from 'three';
 *
 * // Abstract renderer interface for multi-backend support
 * interface MeshRenderer {
 *   createMesh(data: GenericMeshData): Promise<any>;
 *   updateMesh(mesh: any, data: GenericMeshData): Promise<void>;
 *   disposeMesh(mesh: any): void;
 * }
 *
 * // BabylonJS renderer implementation
 * class BabylonMeshRenderer implements MeshRenderer {
 *   constructor(private scene: BabylonScene) {}
 *
 *   async createMesh(data: GenericMeshData): Promise<BabylonMesh> {
 *     const mesh = new BabylonMesh(data.id, this.scene);
 *
 *     // Create vertex data from generic geometry
 *     const vertexData = new VertexData();
 *     vertexData.positions = Array.from(data.geometry.positions);
 *     vertexData.indices = Array.from(data.geometry.indices);
 *     vertexData.normals = Array.from(data.geometry.normals || []);
 *     vertexData.uvs = Array.from(data.geometry.uvs || []);
 *
 *     vertexData.applyToMesh(mesh);
 *
 *     // Apply material configuration
 *     const material = new StandardMaterial(data.material.id, this.scene);
 *     material.diffuseColor = new Color3(...data.material.diffuseColor);
 *     material.alpha = data.material.alpha;
 *     material.metallicFactor = data.material.metallicFactor;
 *     material.roughness = data.material.roughnessFactor;
 *     mesh.material = material;
 *
 *     // Apply transform
 *     mesh.setPreTransformMatrix(data.transform);
 *
 *     // Store metadata for debugging and performance tracking
 *     mesh.metadata = {
 *       originalMeshData: data,
 *       creationTime: Date.now(),
 *       renderer: 'babylon',
 *     };
 *
 *     return mesh;
 *   }
 *
 *   async updateMesh(mesh: BabylonMesh, data: GenericMeshData): Promise<void> {
 *     // Update vertex data
 *     const vertexData = new VertexData();
 *     vertexData.positions = Array.from(data.geometry.positions);
 *     vertexData.indices = Array.from(data.geometry.indices);
 *     vertexData.normals = Array.from(data.geometry.normals || []);
 *
 *     vertexData.applyToMesh(mesh, true); // Update existing mesh
 *
 *     // Update material properties
 *     const material = mesh.material as StandardMaterial;
 *     if (material) {
 *       material.diffuseColor = new Color3(...data.material.diffuseColor);
 *       material.alpha = data.material.alpha;
 *     }
 *
 *     // Update transform
 *     mesh.setPreTransformMatrix(data.transform);
 *   }
 *
 *   disposeMesh(mesh: BabylonMesh): void {
 *     mesh.dispose(false, true); // Dispose mesh and materials
 *   }
 * }
 *
 * // Three.js renderer implementation (future support)
 * class ThreeMeshRenderer implements MeshRenderer {
 *   constructor(private scene: ThreeScene) {}
 *
 *   async createMesh(data: GenericMeshData): Promise<ThreeMesh> {
 *     // Create BufferGeometry from generic data
 *     const geometry = new BufferGeometry();
 *     geometry.setAttribute('position', new Float32BufferAttribute(data.geometry.positions, 3));
 *     geometry.setIndex(new Uint32BufferAttribute(data.geometry.indices, 1));
 *
 *     if (data.geometry.normals) {
 *       geometry.setAttribute('normal', new Float32BufferAttribute(data.geometry.normals, 3));
 *     }
 *
 *     if (data.geometry.uvs) {
 *       geometry.setAttribute('uv', new Float32BufferAttribute(data.geometry.uvs, 2));
 *     }
 *
 *     // Create material from generic configuration
 *     const material = new MeshStandardMaterial({
 *       color: new Color().setRGB(...data.material.diffuseColor),
 *       transparent: data.material.transparent,
 *       opacity: data.material.alpha,
 *       metalness: data.material.metallicFactor,
 *       roughness: data.material.roughnessFactor,
 *     });
 *
 *     const mesh = new ThreeMesh(geometry, material);
 *     mesh.name = data.id;
 *
 *     // Apply transform matrix
 *     mesh.matrix.fromArray(data.transform.asArray());
 *     mesh.matrixAutoUpdate = false;
 *
 *     return mesh;
 *   }
 *
 *   async updateMesh(mesh: ThreeMesh, data: GenericMeshData): Promise<void> {
 *     // Update geometry
 *     const geometry = mesh.geometry as BufferGeometry;
 *     geometry.setAttribute('position', new Float32BufferAttribute(data.geometry.positions, 3));
 *     geometry.setIndex(new Uint32BufferAttribute(data.geometry.indices, 1));
 *     geometry.attributes.position.needsUpdate = true;
 *
 *     // Update material
 *     const material = mesh.material as MeshStandardMaterial;
 *     material.color.setRGB(...data.material.diffuseColor);
 *     material.opacity = data.material.alpha;
 *   }
 *
 *   disposeMesh(mesh: ThreeMesh): void {
 *     mesh.geometry.dispose();
 *     if (Array.isArray(mesh.material)) {
 *       mesh.material.forEach(mat => mat.dispose());
 *     } else {
 *       mesh.material.dispose();
 *     }
 *   }
 * }
 *
 * // Universal mesh management with renderer abstraction
 * class UniversalMeshManager {
 *   constructor(private renderer: MeshRenderer) {}
 *
 *   async createFromOpenSCAD(
 *     openscadCode: string,
 *     options: { enableOptimization?: boolean; targetTriangleCount?: number } = {}
 *   ): Promise<any[]> {
 *     // Parse OpenSCAD and convert to generic mesh data
 *     const parseResult = await parseOpenSCAD(openscadCode);
 *     if (!parseResult.success) {
 *       throw new Error(`OpenSCAD parsing failed: ${parseResult.error.message}`);
 *     }
 *
 *     const meshDataResults = await convertASTToMeshData(parseResult.data);
 *     const meshes = [];
 *
 *     for (const meshData of meshDataResults) {
 *       if (isGenericMeshData(meshData)) {
 *         // Apply optimizations if requested
 *         const optimizedData = options.enableOptimization
 *           ? await optimizeMeshData(meshData, options.targetTriangleCount)
 *           : meshData;
 *
 *         // Create mesh using the configured renderer
 *         const mesh = await this.renderer.createMesh(optimizedData);
 *         meshes.push(mesh);
 *       }
 *     }
 *
 *     return meshes;
 *   }
 * }
 * ```
 *
 * @example
 * **Performance Optimization and Caching**:
 * ```typescript
 * import { GenericMeshData, GenericMeshCollection } from './generic-mesh-data.types';
 *
 * class MeshDataCache {
 *   private cache = new Map<string, GenericMeshData>();
 *   private stats = { hits: 0, misses: 0, evictions: 0 };
 *   private readonly maxCacheSize = 1000;
 *
 *   // Generate cache key from OpenSCAD parameters
 *   private generateCacheKey(nodeType: string, parameters: Record<string, any>): string {
 *     const paramString = JSON.stringify(parameters, Object.keys(parameters).sort());
 *     return `${nodeType}_${this.hashString(paramString)}`;
 *   }
 *
 *   private hashString(str: string): string {
 *     let hash = 0;
 *     for (let i = 0; i < str.length; i++) {
 *       const char = str.charCodeAt(i);
 *       hash = ((hash << 5) - hash) + char;
 *       hash = hash & hash; // Convert to 32-bit integer
 *     }
 *     return hash.toString(36);
 *   }
 *
 *   async getCachedMesh(
 *     nodeType: string,
 *     parameters: Record<string, any>,
 *     generator: () => Promise<GenericMeshData>
 *   ): Promise<GenericMeshData> {
 *     const cacheKey = this.generateCacheKey(nodeType, parameters);
 *
 *     // Check cache first
 *     const cached = this.cache.get(cacheKey);
 *     if (cached) {
 *       this.stats.hits++;
 *       console.log(`Cache hit for ${nodeType}: ${this.getCacheHitRate().toFixed(1)}% hit rate`);
 *
 *       // Update access timestamp
 *       cached.metadata.lastAccessed = new Date();
 *       return cached;
 *     }
 *
 *     // Cache miss - generate new mesh data
 *     this.stats.misses++;
 *     const startTime = performance.now();
 *
 *     const meshData = await generator();
 *     const generationTime = performance.now() - startTime;
 *
 *     // Update metadata with cache information
 *     const enhancedMeshData: GenericMeshData = {
 *       ...meshData,
 *       metadata: {
 *         ...meshData.metadata,
 *         generationTime,
 *         debugInfo: {
 *           ...meshData.metadata.debugInfo,
 *           cacheKey,
 *           cacheGeneration: true,
 *         },
 *       },
 *     };
 *
 *     // Add to cache with eviction if necessary
 *     if (this.cache.size >= this.maxCacheSize) {
 *       this.evictOldestEntry();
 *     }
 *
 *     this.cache.set(cacheKey, enhancedMeshData);
 *
 *     console.log(`Generated and cached ${nodeType} in ${generationTime.toFixed(2)}ms`);
 *     return enhancedMeshData;
 *   }
 *
 *   private evictOldestEntry(): void {
 *     let oldestKey = '';
 *     let oldestTime = Date.now();
 *
 *     for (const [key, meshData] of this.cache) {
 *       const accessTime = meshData.metadata.lastAccessed.getTime();
 *       if (accessTime < oldestTime) {
 *         oldestTime = accessTime;
 *         oldestKey = key;
 *       }
 *     }
 *
 *     if (oldestKey) {
 *       this.cache.delete(oldestKey);
 *       this.stats.evictions++;
 *     }
 *   }
 *
 *   getCacheHitRate(): number {
 *     const total = this.stats.hits + this.stats.misses;
 *     return total > 0 ? (this.stats.hits / total) * 100 : 0;
 *   }
 *
 *   getStats(): typeof this.stats & { size: number; hitRate: number } {
 *     return {
 *       ...this.stats,
 *       size: this.cache.size,
 *       hitRate: this.getCacheHitRate(),
 *     };
 *   }
 *
 *   clear(): void {
 *     this.cache.clear();
 *     this.stats = { hits: 0, misses: 0, evictions: 0 };
 *   }
 * }
 *
 * // Usage with performance monitoring
 * const meshCache = new MeshDataCache();
 *
 * async function generateOptimizedCube(size: number[]): Promise<GenericMeshData> {
 *   return meshCache.getCachedMesh(
 *     'cube',
 *     { size },
 *     () => generateCubeMesh(size as [number, number, number])
 *   );
 * }
 *
 * // Performance testing
 * async function performanceTest() {
 *   const testSizes = [
 *     [1, 1, 1], [2, 2, 2], [1, 1, 1], // Repeat for cache hit
 *     [3, 3, 3], [2, 2, 2], [4, 4, 4], [1, 1, 1], // Mixed
 *   ];
 *
 *   for (const size of testSizes) {
 *     const startTime = performance.now();
 *     await generateOptimizedCube(size);
 *     const endTime = performance.now();
 *
 *     console.log(`Size ${size}: ${(endTime - startTime).toFixed(2)}ms`);
 *   }
 *
 *   const stats = meshCache.getStats();
 *   console.log(`Final cache stats:`, stats);
 *   console.log(`Cache efficiency: ${stats.hitRate.toFixed(1)}% hit rate`);
 * }
 * ```
 *
 * @technical_specifications
 * **Geometry Data Layout**:
 * - **Positions**: Float32Array with [x,y,z, x,y,z, ...] layout for CPU cache efficiency
 * - **Indices**: Uint32Array supporting meshes up to 4.3 billion vertices
 * - **Normals**: Float32Array with same layout as positions, pre-computed for GPU upload
 * - **UVs**: Float32Array with [u,v, u,v, ...] layout for texture coordinates
 * - **Colors**: Optional Float32Array with [r,g,b,a, r,g,b,a, ...] layout
 *
 * **Material System**:
 * - **PBR Support**: Metallic-roughness workflow compatible with glTF 2.0 standard
 * - **OpenSCAD Modifiers**: Built-in support for *, !, #, % modifier visual styles
 * - **Texture References**: String-based texture paths for lazy loading and sharing
 * - **Transparency**: Full alpha blending support with proper depth sorting hints
 *
 * **Metadata Optimization**:
 * - **Lazy Computation**: Expensive properties computed only when accessed
 * - **Serialization**: JSON-compatible structure for persistence and networking
 * - **Debug Information**: Comprehensive tracking for development and debugging
 * - **Performance Metrics**: Built-in timing and memory usage tracking
 */

import type { BoundingBox, Matrix } from '@babylonjs/core';
import type { SourceLocation } from '../../openscad-parser/ast/ast-types';

/**
 * Generic geometry data structure (renderer-agnostic)
 */
export interface GenericGeometry {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
  readonly normals?: Float32Array;
  readonly uvs?: Float32Array;
  readonly colors?: Float32Array;
  readonly tangents?: Float32Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox;
}

/**
 * Enhanced material configuration for all OpenSCAD constructs
 */
export interface GenericMaterialConfig {
  // Basic color properties
  readonly diffuseColor: readonly [number, number, number]; // RGB
  readonly alpha: number; // Transparency (0-1)
  readonly emissiveColor?: readonly [number, number, number]; // RGB
  readonly specularColor?: readonly [number, number, number]; // RGB

  // PBR properties
  readonly metallicFactor: number; // 0-1
  readonly roughnessFactor: number; // 0-1
  readonly normalScale: number; // Normal map intensity
  readonly occlusionStrength: number; // AO intensity

  // Rendering properties
  readonly transparent: boolean;
  readonly wireframe: boolean;
  readonly backFaceCulling: boolean;
  readonly side: 'front' | 'back' | 'double';

  // OpenSCAD-specific properties
  readonly isDebugMaterial: boolean; // For # modifier
  readonly isBackgroundMaterial: boolean; // For % modifier
  readonly isShowOnlyMaterial: boolean; // For ! modifier
  readonly isDisabled: boolean; // For * modifier

  // Texture references (optional)
  readonly textures?: {
    readonly diffuse?: string;
    readonly normal?: string;
    readonly metallic?: string;
    readonly roughness?: string;
    readonly emissive?: string;
    readonly occlusion?: string;
  };
}

/**
 * Enhanced metadata for debugging and editor integration
 */
export interface GenericMeshMetadata {
  // Basic mesh information
  readonly meshId: string;
  readonly name: string;
  readonly nodeType: string; // OpenSCAD node type (cube, sphere, etc.)

  // Geometry metrics
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox;
  readonly surfaceArea: number;
  readonly volume: number;

  // Performance metrics
  readonly generationTime: number; // Time to generate mesh (ms)
  readonly optimizationTime: number; // Time spent optimizing (ms)
  readonly memoryUsage: number; // Memory used (bytes)
  readonly complexity: number; // Complexity score

  // Source tracking for editor integration
  readonly sourceLocation?: SourceLocation;
  readonly originalOpenscadCode?: string;
  readonly astNodeId?: string;

  // Debugging information
  readonly isOptimized: boolean;
  readonly hasErrors: boolean;
  readonly warnings: readonly string[];
  readonly debugInfo: Record<string, unknown>;

  // Timestamps
  readonly createdAt: Date;
  readonly lastModified: Date;
  readonly lastAccessed: Date;

  // Hierarchy information
  readonly parentId?: string;
  readonly childIds: readonly string[];
  readonly depth: number; // Nesting depth in AST

  // OpenSCAD-specific metadata
  readonly openscadParameters: Record<string, unknown>;
  readonly modifiers: readonly string[]; // Applied modifiers (*, !, #, %)
  readonly transformations: readonly string[]; // Applied transformations
  readonly csgOperations: readonly string[]; // Applied CSG operations
}

/**
 * Complete GenericMeshData interface for all OpenSCAD constructs
 */
export interface GenericMeshData {
  readonly id: string;
  readonly geometry: GenericGeometry;
  readonly material: GenericMaterialConfig;
  readonly transform: Matrix;
  readonly metadata: GenericMeshMetadata;
}

/**
 * Collection of related meshes (for complex operations)
 */
export interface GenericMeshCollection {
  readonly id: string;
  readonly meshes: readonly GenericMeshData[];
  readonly metadata: {
    readonly collectionType:
      | 'csg_result'
      | 'transformation_group'
      | 'extrusion_result'
      | 'control_flow_result';
    readonly totalVertices: number;
    readonly totalTriangles: number;
    readonly boundingBox: BoundingBox;
    readonly generationTime: number;
    readonly sourceLocation?: SourceLocation;
  };
}

/**
 * Material preset configurations for common OpenSCAD use cases
 */
export const MATERIAL_PRESETS = {
  DEFAULT: {
    diffuseColor: [0.8, 0.8, 0.8] as const,
    alpha: 1.0,
    metallicFactor: 0.1,
    roughnessFactor: 0.8,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: false,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: false,
    isDisabled: false,
  },

  DEBUG: {
    diffuseColor: [1.0, 0.0, 0.0] as const, // Bright red
    alpha: 1.0,
    emissiveColor: [0.2, 0.0, 0.0] as const,
    metallicFactor: 0.0,
    roughnessFactor: 0.5,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: false,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: true,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: false,
    isDisabled: false,
  },

  BACKGROUND: {
    diffuseColor: [0.7, 0.7, 0.7] as const, // Light gray
    alpha: 0.3, // Transparent
    metallicFactor: 0.0,
    roughnessFactor: 1.0,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: true,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: true,
    isShowOnlyMaterial: false,
    isDisabled: false,
  },

  SHOW_ONLY: {
    diffuseColor: [1.0, 1.0, 0.0] as const, // Bright yellow
    alpha: 1.0,
    emissiveColor: [0.3, 0.3, 0.0] as const,
    metallicFactor: 0.0,
    roughnessFactor: 0.3,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: false,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: true,
    isDisabled: false,
  },

  DISABLED: {
    diffuseColor: [0.5, 0.5, 0.5] as const, // Gray
    alpha: 0.0, // Invisible
    metallicFactor: 0.0,
    roughnessFactor: 1.0,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: true,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: false,
    isDisabled: true,
  },
} as const;

/**
 * Utility type for creating material configurations
 */
export type MaterialConfigBuilder = Partial<GenericMaterialConfig> & {
  readonly diffuseColor: readonly [number, number, number];
};

/**
 * Utility type for creating mesh metadata
 */
export type MeshMetadataBuilder = Partial<GenericMeshMetadata> & {
  readonly meshId: string;
  readonly name: string;
  readonly nodeType: string;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox;
};

/**
 * Type guard for GenericMeshData
 */
export const isGenericMeshData = (obj: unknown): obj is GenericMeshData => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'geometry' in obj &&
    'material' in obj &&
    'transform' in obj &&
    'metadata' in obj
  );
};

/**
 * Type guard for GenericMeshCollection
 */
export const isGenericMeshCollection = (obj: unknown): obj is GenericMeshCollection => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'meshes' in obj &&
    'metadata' in obj &&
    Array.isArray((obj as Record<string, unknown>).meshes)
  );
};

/**
 * Default values for creating mesh metadata
 */
export const DEFAULT_MESH_METADATA: Omit<
  GenericMeshMetadata,
  'meshId' | 'name' | 'nodeType' | 'vertexCount' | 'triangleCount' | 'boundingBox'
> = {
  surfaceArea: 0,
  volume: 0,
  generationTime: 0,
  optimizationTime: 0,
  memoryUsage: 0,
  complexity: 0,
  isOptimized: false,
  hasErrors: false,
  warnings: [],
  debugInfo: {},
  createdAt: new Date(),
  lastModified: new Date(),
  lastAccessed: new Date(),
  childIds: [],
  depth: 0,
  openscadParameters: {},
  modifiers: [],
  transformations: [],
  csgOperations: [],
} as const;
