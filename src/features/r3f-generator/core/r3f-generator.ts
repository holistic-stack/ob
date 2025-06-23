/**
 * @file R3F Generator Core
 * 
 * Core generator that converts CSG trees into React Three Fiber components.
 * Implements pure functions with geometry caching, material optimization,
 * and performance monitoring.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import {
  type CSGTree,
  type CSGTreeNode,
  type CSGCube,
  type CSGSphere,
  type CSGCylinder,
  isCSGCube,
  isCSGSphere,
  isCSGCylinder,
  isCSGOperation,
  isCSGTransform,
  type Vector3,
  type Result
} from '../../csg-processor';
import {
  type R3FGenerationResult,
  type R3FGeneratorConfig,
  type R3FGenerationError,
  type GeneratedMesh,
  type GeometryParams,
  type R3FMaterialConfig,
  type GeometryCacheEntry,
  DEFAULT_R3F_CONFIG,
  DEFAULT_GEOMETRY_PARAMS,
  DEFAULT_MATERIAL_CONFIG
} from '../types/r3f-generator-types';

// ============================================================================
// Cache Management
// ============================================================================

const geometryCache = new Map<string, GeometryCacheEntry>();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Generate cache key for geometry
 */
function generateCacheKey(node: CSGTreeNode, params: GeometryParams): string {
  const nodeData = {
    type: node.type,
    ...('size' in node ? { size: node.size } : {}),
    ...('radius' in node ? { radius: node.radius } : {}),
    ...('height' in node ? { height: node.height } : {}),
    ...('radius1' in node ? { radius1: node.radius1 } : {}),
    ...('radius2' in node ? { radius2: node.radius2 } : {})
  };
  
  return `${JSON.stringify(nodeData)}_${JSON.stringify(params)}`;
}

/**
 * Clean expired cache entries
 */
function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of geometryCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      entry.geometry.dispose();
      if (Array.isArray(entry.material)) {
        entry.material.forEach(mat => mat.dispose());
      } else {
        entry.material.dispose();
      }
      geometryCache.delete(key);
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create R3F generation error
 */
function createR3FError(
  message: string,
  code: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  nodeId?: string,
  nodeType?: string
): R3FGenerationError {
  return {
    message,
    code,
    severity,
    nodeId,
    nodeType
  };
}

/**
 * Convert Vector3 to THREE.Vector3
 */
function toThreeVector3(vector: Vector3): THREE.Vector3 {
  return new THREE.Vector3(vector[0], vector[1], vector[2]);
}

/**
 * Calculate memory usage of geometry
 */
function calculateGeometryMemory(geometry: THREE.BufferGeometry): number {
  let memory = 0;
  
  for (const [, attribute] of Object.entries(geometry.attributes)) {
    if (attribute && attribute.array) {
      memory += attribute.array.byteLength;
    }
  }
  
  if (geometry.index) {
    memory += geometry.index.array.byteLength;
  }
  
  return memory;
}

// ============================================================================
// Geometry Generation Functions
// ============================================================================

/**
 * Generate cube geometry
 */
function generateCubeGeometry(
  node: CSGCube,
  params: GeometryParams,
  config: R3FGeneratorConfig
): Result<THREE.BufferGeometry, R3FGenerationError> {
  try {
    const [width, height, depth] = node.size;
    
    if (width <= 0 || height <= 0 || depth <= 0) {
      return {
        success: false,
        error: createR3FError(
          'Cube dimensions must be positive',
          'INVALID_CUBE_DIMENSIONS',
          'error',
          node.id,
          'cube'
        )
      };
    }
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    if (params.computeNormals) {
      geometry.computeVertexNormals();
    }
    
    if (params.mergeVertices) {
      // mergeVertices was removed in newer Three.js versions
      // The geometry is already optimized by default
    }
    
    // Center the geometry if specified
    if (node.center) {
      geometry.translate(0, 0, 0); // Already centered by default
    } else {
      geometry.translate(width / 2, height / 2, depth / 2);
    }
    
    return { success: true, data: geometry };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown cube generation error';
    return {
      success: false,
      error: createR3FError(
        `Failed to generate cube geometry: ${errorMessage}`,
        'CUBE_GENERATION_ERROR',
        'error',
        node.id,
        'cube'
      )
    };
  }
}

/**
 * Generate sphere geometry
 */
function generateSphereGeometry(
  node: CSGSphere,
  params: GeometryParams,
  config: R3FGeneratorConfig
): Result<THREE.BufferGeometry, R3FGenerationError> {
  try {
    if (node.radius <= 0) {
      return {
        success: false,
        error: createR3FError(
          'Sphere radius must be positive',
          'INVALID_SPHERE_RADIUS',
          'error',
          node.id,
          'sphere'
        )
      };
    }
    
    const segments = node.segments || params.segments || 32;
    const geometry = new THREE.SphereGeometry(
      node.radius,
      segments,
      segments / 2
    );
    
    if (params.computeNormals) {
      geometry.computeVertexNormals();
    }
    
    if (params.mergeVertices) {
      // mergeVertices was removed in newer Three.js versions
      // The geometry is already optimized by default
    }
    
    return { success: true, data: geometry };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sphere generation error';
    return {
      success: false,
      error: createR3FError(
        `Failed to generate sphere geometry: ${errorMessage}`,
        'SPHERE_GENERATION_ERROR',
        'error',
        node.id,
        'sphere'
      )
    };
  }
}

/**
 * Generate cylinder geometry
 */
function generateCylinderGeometry(
  node: CSGCylinder,
  params: GeometryParams,
  config: R3FGeneratorConfig
): Result<THREE.BufferGeometry, R3FGenerationError> {
  try {
    if (node.height <= 0 || node.radius1 <= 0) {
      return {
        success: false,
        error: createR3FError(
          'Cylinder height and radius must be positive',
          'INVALID_CYLINDER_DIMENSIONS',
          'error',
          node.id,
          'cylinder'
        )
      };
    }
    
    const radius2 = node.radius2 !== undefined ? node.radius2 : node.radius1;
    const segments = node.segments || params.segments || 32;
    
    const geometry = new THREE.CylinderGeometry(
      radius2, // top radius
      node.radius1, // bottom radius
      node.height,
      segments
    );
    
    if (params.computeNormals) {
      geometry.computeVertexNormals();
    }
    
    if (params.mergeVertices) {
      // mergeVertices was removed in newer Three.js versions
      // The geometry is already optimized by default
    }
    
    // Center the geometry if specified
    if (node.center) {
      geometry.translate(0, 0, 0); // Already centered by default
    } else {
      geometry.translate(0, node.height / 2, 0);
    }
    
    return { success: true, data: geometry };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown cylinder generation error';
    return {
      success: false,
      error: createR3FError(
        `Failed to generate cylinder geometry: ${errorMessage}`,
        'CYLINDER_GENERATION_ERROR',
        'error',
        node.id,
        'cylinder'
      )
    };
  }
}

/**
 * Generate geometry for CSG primitive
 */
function generatePrimitiveGeometry(
  node: CSGTreeNode,
  params: GeometryParams,
  config: R3FGeneratorConfig
): Result<THREE.BufferGeometry, R3FGenerationError> {
  if (isCSGCube(node)) {
    return generateCubeGeometry(node, params, config);
  } else if (isCSGSphere(node)) {
    return generateSphereGeometry(node, params, config);
  } else if (isCSGCylinder(node)) {
    return generateCylinderGeometry(node, params, config);
  } else {
    return {
      success: false,
      error: createR3FError(
        `Unsupported primitive type: ${node.type}`,
        'UNSUPPORTED_PRIMITIVE',
        'error',
        node.id,
        node.type
      )
    };
  }
}

// ============================================================================
// Material Generation
// ============================================================================

/**
 * Generate Three.js material from CSG material config
 */
function generateMaterial(
  materialConfig: R3FMaterialConfig,
  config: R3FGeneratorConfig
): Result<THREE.Material, R3FGenerationError> {
  try {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(
        materialConfig.color?.r || 0.3,
        materialConfig.color?.g || 0.5,
        materialConfig.color?.b || 0.8
      ),
      opacity: materialConfig.opacity || 1.0,
      transparent: materialConfig.transparent || materialConfig.opacity !== undefined && materialConfig.opacity < 1.0,
      metalness: materialConfig.metalness || 0.1,
      roughness: materialConfig.roughness || 0.4,
      wireframe: materialConfig.wireframe || config.enableWireframe || false,
      side: materialConfig.side !== undefined ? materialConfig.side : THREE.DoubleSide
    });
    
    if (materialConfig.emissive) {
      material.emissive = new THREE.Color(
        materialConfig.emissive.r,
        materialConfig.emissive.g,
        materialConfig.emissive.b
      );
    }
    
    if (config.enableShadows) {
      // Shadow properties are set on the mesh, not the material
    }
    
    return { success: true, data: material };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown material generation error';
    return {
      success: false,
      error: createR3FError(
        `Failed to generate material: ${errorMessage}`,
        'MATERIAL_GENERATION_ERROR'
      )
    };
  }
}

// ============================================================================
// CSG Operations
// ============================================================================

/**
 * Perform CSG operation on geometries using three-csg-ts
 */
function performCSGOperation(
  operation: 'union' | 'difference' | 'intersection',
  geometries: readonly THREE.BufferGeometry[],
  config: R3FGeneratorConfig
): Result<THREE.BufferGeometry, R3FGenerationError> {
  try {
    if (geometries.length === 0) {
      return {
        success: false,
        error: createR3FError(
          'CSG operation requires at least one geometry',
          'EMPTY_GEOMETRIES_ERROR'
        )
      };
    }

    if (geometries.length === 1) {
      // Single geometry, just return a clone
      return { success: true, data: geometries[0].clone() };
    }

    // Convert first geometry to CSG
    let resultCSG = CSG.fromGeometry(geometries[0]);

    if (!resultCSG) {
      return {
        success: false,
        error: createR3FError(
          'Failed to convert first geometry to CSG',
          'CSG_CONVERSION_ERROR'
        )
      };
    }

    // Apply operation to remaining geometries
    for (let i = 1; i < geometries.length; i++) {
      const nextCSG = CSG.fromGeometry(geometries[i]);

      if (!nextCSG) {
        return {
          success: false,
          error: createR3FError(
            `Failed to convert geometry ${i} to CSG`,
            'CSG_CONVERSION_ERROR'
          )
        };
      }

      switch (operation) {
        case 'union':
          resultCSG = resultCSG.union(nextCSG);
          break;
        case 'difference':
          resultCSG = resultCSG.subtract(nextCSG);
          break;
        case 'intersection':
          resultCSG = resultCSG.intersect(nextCSG);
          break;
        default:
          return {
            success: false,
            error: createR3FError(
              `Unsupported CSG operation: ${operation}`,
              'UNSUPPORTED_CSG_OPERATION'
            )
          };
      }

      if (!resultCSG) {
        return {
          success: false,
          error: createR3FError(
            `${operation} operation failed at geometry ${i}`,
            'CSG_OPERATION_FAILED'
          )
        };
      }
    }

    // Convert back to BufferGeometry
    const resultGeometry = CSG.toGeometry(resultCSG, new THREE.Matrix4());

    if (!resultGeometry) {
      return {
        success: false,
        error: createR3FError(
          'Failed to convert CSG result back to geometry',
          'CSG_TO_GEOMETRY_ERROR'
        )
      };
    }

    // Optimize geometry if enabled
    if (config.enableOptimization) {
      resultGeometry.computeVertexNormals();
      resultGeometry.computeBoundingBox();
      resultGeometry.computeBoundingSphere();
    }

    return { success: true, data: resultGeometry };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown CSG operation error';
    return {
      success: false,
      error: createR3FError(
        `CSG operation failed: ${errorMessage}`,
        'CSG_OPERATION_EXCEPTION'
      )
    };
  }
}

// ============================================================================
// Mesh Generation
// ============================================================================

/**
 * Generate Three.js mesh from geometry and material
 */
function generateMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  node: CSGTreeNode,
  config: R3FGeneratorConfig
): Result<GeneratedMesh, R3FGenerationError> {
  try {
    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply transform if present
    if (node.transform) {
      if (node.transform.translation) {
        const translation = toThreeVector3(node.transform.translation);
        mesh.position.copy(translation);
      }
      
      if (node.transform.rotation) {
        const rotation = toThreeVector3(node.transform.rotation);
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      }
      
      if (node.transform.scale) {
        const scale = toThreeVector3(node.transform.scale);
        mesh.scale.copy(scale);
      }
    }
    
    // Configure shadows
    if (config.enableShadows) {
      mesh.castShadow = node.material?.castShadow !== false;
      mesh.receiveShadow = node.material?.receiveShadow !== false;
    }
    
    // Calculate metadata
    const vertexCount = geometry.attributes.position?.count || 0;
    const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
    const memoryUsage = calculateGeometryMemory(geometry);
    
    const generatedMesh: GeneratedMesh = {
      mesh,
      nodeId: node.id,
      nodeType: node.type,
      metadata: {
        vertexCount,
        triangleCount,
        generationTime: 0, // Will be set by caller
        memoryUsage
      }
    };
    
    return { success: true, data: generatedMesh };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown mesh generation error';
    return {
      success: false,
      error: createR3FError(
        `Failed to generate mesh: ${errorMessage}`,
        'MESH_GENERATION_ERROR',
        'error',
        node.id,
        node.type
      )
    };
  }
}

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generate R3F meshes from CSG tree node
 */
async function generateMeshFromNode(
  node: CSGTreeNode,
  config: R3FGeneratorConfig,
  params: GeometryParams,
  errors: R3FGenerationError[] = []
): Promise<Result<GeneratedMesh[], R3FGenerationError[]>> {
  const startTime = performance.now();
  
  try {
    // Handle primitive nodes
    if (['cube', 'sphere', 'cylinder'].includes(node.type)) {
      // Check cache first
      const cacheKey = generateCacheKey(node, params);
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;
      let cached = false;
      
      if (config.enableCaching && geometryCache.has(cacheKey)) {
        const cacheEntry = geometryCache.get(cacheKey)!;
        geometry = cacheEntry.geometry.clone();
        material = cacheEntry.material.clone();
        // Update cache entry with new access count
        geometryCache.set(cacheKey, {
          ...cacheEntry,
          accessCount: cacheEntry.accessCount + 1
        });
        cached = true;
      } else {
        // Generate new geometry
        const geometryResult = generatePrimitiveGeometry(node, params, config);
        if (!geometryResult.success) {
          errors.push(geometryResult.error);
          return { success: false, error: errors };
        }
        geometry = geometryResult.data;
        
        // Generate material
        const materialConfig = { ...DEFAULT_MATERIAL_CONFIG, ...node.material };
        const materialResult = generateMaterial(materialConfig, config);
        if (!materialResult.success) {
          errors.push(materialResult.error);
          return { success: false, error: errors };
        }
        material = materialResult.data;
        
        // Cache the result
        if (config.enableCaching) {
          const memoryUsage = calculateGeometryMemory(geometry);
          geometryCache.set(cacheKey, {
            geometry: geometry.clone(),
            material: material.clone(),
            timestamp: Date.now(),
            accessCount: 1,
            memoryUsage
          });
        }
      }
      
      // Generate mesh
      const meshResult = generateMesh(geometry, material, node, config);
      if (!meshResult.success) {
        errors.push(meshResult.error);
        return { success: false, error: errors };
      }
      
      const generatedMesh = meshResult.data;
      generatedMesh.metadata.generationTime = performance.now() - startTime;
      
      return { success: true, data: [generatedMesh] };
    }
    
    // Handle CSG operations using three-csg-ts
    if (isCSGOperation(node)) {
      const childMeshes: GeneratedMesh[] = [];

      // Generate meshes for all children
      for (const child of node.children) {
        const childResult = await generateMeshFromNode(child, config, params, errors);
        if (childResult.success) {
          childMeshes.push(...childResult.data);
        }
      }

      if (childMeshes.length === 0) {
        errors.push(createR3FError(
          `CSG operation ${node.type} has no valid children`,
          'EMPTY_CSG_CHILDREN',
          'error',
          node.id,
          node.type
        ));
        return { success: false, error: errors };
      }

      // Extract geometries from child meshes
      const childGeometries = childMeshes.map(mesh => mesh.mesh.geometry);

      // Perform CSG operation
      const csgResult = performCSGOperation(node.type, childGeometries, config);

      if (!csgResult.success) {
        errors.push(csgResult.error);
        // Fallback: return first child mesh
        return { success: true, data: childMeshes.slice(0, 1) };
      }

      // Create new mesh with CSG result
      const materialConfig = { ...DEFAULT_MATERIAL_CONFIG, ...node.material };
      const materialResult = generateMaterial(materialConfig, config);

      if (!materialResult.success) {
        errors.push(materialResult.error);
        return { success: false, error: errors };
      }

      const csgMesh = new THREE.Mesh(csgResult.data, materialResult.data);
      csgMesh.name = `${node.type}_${node.id}`;

      // Apply transform if present
      if (node.transform) {
        if (node.transform.translation) {
          const translation = toThreeVector3(node.transform.translation);
          csgMesh.position.copy(translation);
        }

        if (node.transform.rotation) {
          const rotation = toThreeVector3(node.transform.rotation);
          csgMesh.rotation.set(rotation.x, rotation.y, rotation.z);
        }

        if (node.transform.scale) {
          const scale = toThreeVector3(node.transform.scale);
          csgMesh.scale.copy(scale);
        }
      }

      // Configure shadows
      if (config.enableShadows) {
        csgMesh.castShadow = node.material?.castShadow !== false;
        csgMesh.receiveShadow = node.material?.receiveShadow !== false;
      }

      // Calculate metadata
      const vertexCount = csgResult.data.attributes.position?.count || 0;
      const triangleCount = csgResult.data.index ? csgResult.data.index.count / 3 : vertexCount / 3;
      const memoryUsage = calculateGeometryMemory(csgResult.data);

      const generatedMesh: GeneratedMesh = {
        mesh: csgMesh,
        nodeId: node.id,
        nodeType: node.type,
        metadata: {
          vertexCount,
          triangleCount,
          generationTime: performance.now() - startTime,
          memoryUsage
        }
      };

      return { success: true, data: [generatedMesh] };
    }
    
    // Handle transform nodes
    if (isCSGTransform(node)) {
      const childResult = await generateMeshFromNode(node.child, config, params, errors);
      if (childResult.success) {
        // Apply additional transform to child meshes
        const transformedMeshes = childResult.data.map(generatedMesh => {
          const mesh = generatedMesh.mesh.clone();
          
          if (node.transform?.translation) {
            const translation = toThreeVector3(node.transform.translation);
            mesh.position.add(translation);
          }
          
          if (node.transform?.rotation) {
            const rotation = toThreeVector3(node.transform.rotation);
            mesh.rotation.x += rotation.x;
            mesh.rotation.y += rotation.y;
            mesh.rotation.z += rotation.z;
          }
          
          if (node.transform?.scale) {
            const scale = toThreeVector3(node.transform.scale);
            mesh.scale.multiply(scale);
          }
          
          return {
            ...generatedMesh,
            mesh,
            nodeId: node.id
          };
        });
        
        return { success: true, data: transformedMeshes };
      }
    }
    
    // Unsupported node type
    errors.push(createR3FError(
      `Unsupported node type: ${node.type}`,
      'UNSUPPORTED_NODE_TYPE',
      'warning',
      node.id,
      node.type
    ));
    
    return { success: true, data: [] };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown generation error';
    errors.push(createR3FError(
      `Failed to generate mesh from node: ${errorMessage}`,
      'NODE_GENERATION_ERROR',
      'error',
      node.id,
      node.type
    ));
    
    return { success: false, error: errors };
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate R3F scene from CSG tree
 * 
 * @param tree - CSG tree to convert
 * @param config - Generation configuration
 * @returns R3F generation result with meshes and metrics
 */
export async function generateR3FFromCSGTree(
  tree: CSGTree,
  config: R3FGeneratorConfig = {}
): Promise<R3FGenerationResult> {
  const startTime = performance.now();
  const finalConfig = { ...DEFAULT_R3F_CONFIG, ...config };
  const params = { ...DEFAULT_GEOMETRY_PARAMS };
  const errors: R3FGenerationError[] = [];
  const warnings: R3FGenerationError[] = [];
  const allMeshes: GeneratedMesh[] = [];
  
  if (finalConfig.enableLogging) {
    console.log('[R3F Generator] Starting CSG tree to R3F conversion...');
  }
  
  try {
    // Clean cache periodically
    if (finalConfig.enableCaching) {
      cleanCache();
    }
    
    // Process all root nodes
    for (const rootNode of tree.root) {
      const result = await generateMeshFromNode(rootNode, finalConfig, params, []);
      
      if (result.success) {
        allMeshes.push(...result.data);
      } else {
        errors.push(...result.error);
      }
    }
    
    // Create scene
    const scene = new THREE.Scene();
    allMeshes.forEach(generatedMesh => {
      scene.add(generatedMesh.mesh);
    });
    
    // Calculate metrics
    const totalVertices = allMeshes.reduce((sum, mesh) => sum + mesh.metadata.vertexCount, 0);
    const totalTriangles = allMeshes.reduce((sum, mesh) => sum + mesh.metadata.triangleCount, 0);
    const memoryUsage = allMeshes.reduce((sum, mesh) => sum + mesh.metadata.memoryUsage, 0);
    const generationTime = performance.now() - startTime;
    
    const cacheHits = Array.from(geometryCache.values()).reduce((sum, entry) => sum + entry.accessCount - 1, 0);
    const cacheMisses = allMeshes.length - cacheHits;
    const cacheHitRate = allMeshes.length > 0 ? (cacheHits / allMeshes.length) * 100 : 0;
    
    if (finalConfig.enableLogging) {
      console.log(`[R3F Generator] Generation completed in ${generationTime.toFixed(2)}ms`);
      console.log(`[R3F Generator] Generated ${allMeshes.length} meshes (${totalVertices} vertices, ${totalTriangles} triangles)`);
      console.log(`[R3F Generator] Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
    }
    
    return {
      success: errors.length === 0,
      meshes: allMeshes,
      scene,
      errors,
      warnings,
      metrics: {
        totalMeshes: allMeshes.length,
        totalVertices,
        totalTriangles,
        generationTime,
        memoryUsage,
        cacheHitRate
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown generation error';
    const generationTime = performance.now() - startTime;
    
    return {
      success: false,
      meshes: [],
      errors: [createR3FError(`R3F generation failed: ${errorMessage}`, 'GENERATION_ERROR')],
      warnings: [],
      metrics: {
        totalMeshes: 0,
        totalVertices: 0,
        totalTriangles: 0,
        generationTime,
        memoryUsage: 0,
        cacheHitRate: 0
      }
    };
  }
}

// ============================================================================
// Cache Management API
// ============================================================================

/**
 * Clear geometry cache
 */
export function clearGeometryCache(): void {
  for (const entry of geometryCache.values()) {
    entry.geometry.dispose();
    if (Array.isArray(entry.material)) {
      entry.material.forEach(mat => mat.dispose());
    } else {
      entry.material.dispose();
    }
  }
  geometryCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStatistics() {
  const totalMemory = Array.from(geometryCache.values())
    .reduce((sum, entry) => sum + entry.memoryUsage, 0);
  
  return {
    size: geometryCache.size,
    memoryUsage: totalMemory,
    entries: Array.from(geometryCache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      memoryUsage: entry.memoryUsage,
      age: Date.now() - entry.timestamp
    }))
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default generateR3FFromCSGTree;
