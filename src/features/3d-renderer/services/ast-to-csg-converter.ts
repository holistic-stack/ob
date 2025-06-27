/**
 * AST to CSG Converter Service
 * 
 * Service for converting OpenSCAD AST nodes to three-csg-ts operations
 * with support for primitives, transformations, and boolean operations.
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import type { 
  ASTNode, 
  CubeNode, 
  SphereNode, 
  CylinderNode 
} from '@holistic-stack/openscad-parser';
import type { 
  Mesh3D,
  MaterialConfig,
  RenderingError 
} from '../types/renderer.types';
import { success, error, tryCatch } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

/**
 * Default material configuration for CSG operations
 */
const DEFAULT_CSG_MATERIAL: MaterialConfig = {
  color: '#00ff88', // Green color as specified
  opacity: 1,
  metalness: 0.1,
  roughness: 0.8,
  wireframe: false,
  transparent: false,
  side: 'front'
};

/**
 * CSG conversion configuration
 */
export interface CSGConversionConfig {
  readonly material: MaterialConfig;
  readonly enableOptimization: boolean;
  readonly maxComplexity: number;
  readonly timeoutMs: number;
}

/**
 * Default CSG conversion configuration
 */
const DEFAULT_CSG_CONFIG: CSGConversionConfig = {
  material: DEFAULT_CSG_MATERIAL,
  enableOptimization: true,
  maxComplexity: 50000,
  timeoutMs: 10000
};

/**
 * Create Three.js material from configuration
 */
const createMaterial = (config: MaterialConfig): THREE.MeshStandardMaterial => {
  console.log(`[DEBUG][ASTToCSGConverter] Creating material with color: ${config.color}`);
  
  return new THREE.MeshStandardMaterial({
    color: config.color,
    opacity: config.opacity,
    metalness: config.metalness,
    roughness: config.roughness,
    wireframe: config.wireframe,
    transparent: config.transparent,
    side: config.side === 'front' ? THREE.FrontSide : 
          config.side === 'back' ? THREE.BackSide : THREE.DoubleSide
  });
};

/**
 * Convert cube AST node to Three.js mesh
 */
const convertCubeToMesh = (node: CubeNode, material: THREE.Material): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting cube node:`, {
      size: node.size,
      center: node.center
    });

    // Extract size parameters
    const size = Array.isArray(node.size) ? node.size : [node.size, node.size, node.size];
    const [width, height, depth] = size.map(s => Number(s) || 1);

    // Create cube geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);

    // Handle centering
    if (!node.center) {
      // OpenSCAD default: cube is positioned with one corner at origin
      mesh.position.set(width / 2, height / 2, depth / 2);
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Created cube mesh: ${width}x${height}x${depth}`);
    
    return mesh;
  }, (err) => `Failed to convert cube node: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Convert sphere AST node to Three.js mesh
 */
const convertSphereToMesh = (node: SphereNode, material: THREE.Material): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting sphere node:`, {
      radius: node.radius
    });

    const radius = Number(node.radius) || 1;
    
    // Create sphere geometry with reasonable detail
    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Created sphere mesh: radius=${radius}`);
    
    return mesh;
  }, (err) => `Failed to convert sphere node: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Convert cylinder AST node to Three.js mesh
 */
const convertCylinderToMesh = (node: CylinderNode, material: THREE.Material): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting cylinder node:`, {
      h: node.h,
      r: node.r,
      center: node.center
    });

    const height = Number(node.h) || 1;
    const radius = Number(node.r) || 1;
    
    // Create cylinder geometry
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const mesh = new THREE.Mesh(geometry, material);

    // Handle centering
    if (!node.center) {
      // OpenSCAD default: cylinder base is at z=0
      mesh.position.setY(height / 2);
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Created cylinder mesh: r=${radius}, h=${height}`);
    
    return mesh;
  }, (err) => `Failed to convert cylinder node: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Convert AST node to Three.js mesh for CSG operations
 */
const convertASTNodeToMesh = (node: ASTNode, material: THREE.Material): Result<THREE.Mesh, string> => {
  console.log(`[DEBUG][ASTToCSGConverter] Converting AST node type: ${node.type}`);

  switch (node.type) {
    case 'cube':
      return convertCubeToMesh(node as CubeNode, material);
    
    case 'sphere':
      return convertSphereToMesh(node as SphereNode, material);
    
    case 'cylinder':
      return convertCylinderToMesh(node as CylinderNode, material);
    
    default:
      return error(`Unsupported AST node type for CSG conversion: ${node.type}`);
  }
};

/**
 * Convert AST node to Mesh3D using CSG operations
 */
export const convertASTNodeToCSG = (
  node: ASTNode, 
  index: number, 
  config: Partial<CSGConversionConfig> = {}
): Result<Mesh3D, string> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };
  
  console.log(`[INIT][ASTToCSGConverter] Converting AST node ${index} (${node.type}) to CSG`);

  // Create material
  const material = createMaterial(finalConfig.material);

  // Convert AST node to Three.js mesh
  const meshResult = convertASTNodeToMesh(node, material);
  if (!meshResult.success) {
    return meshResult;
  }

  return tryCatch(() => {

    const mesh = meshResult.data;
    
    // Calculate metadata
    mesh.geometry.computeBoundingBox();
    const boundingBox = mesh.geometry.boundingBox || new THREE.Box3();
    
    const metadata = {
      id: `csg-${node.type}-${index}`,
      nodeType: node.type,
      nodeIndex: index,
      triangleCount: mesh.geometry.attributes.position.count / 3,
      vertexCount: mesh.geometry.attributes.position.count,
      boundingBox,
      material: 'standard',
      color: finalConfig.material.color,
      opacity: finalConfig.material.opacity,
      visible: true
    };

    const mesh3D: Mesh3D = {
      mesh,
      metadata,
      dispose: () => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    };

    console.log(`[DEBUG][ASTToCSGConverter] Successfully converted ${node.type} to CSG mesh`);
    return mesh3D;
    
  }, (err) => `Failed to convert AST node to CSG: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Convert multiple AST nodes to CSG operations with union
 */
export const convertASTNodesToCSGUnion = (
  nodes: ReadonlyArray<ASTNode>,
  config: Partial<CSGConversionConfig> = {}
): Result<Mesh3D, string> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };
  
  console.log(`[INIT][ASTToCSGConverter] Converting ${nodes.length} AST nodes to CSG union`);

  return tryCatch(() => {
    if (nodes.length === 0) {
      throw new Error('No AST nodes provided for CSG union');
    }

    // Convert all nodes to meshes
    const meshes: THREE.Mesh[] = [];
    const material = createMaterial(finalConfig.material);

    for (let i = 0; i < nodes.length; i++) {
      const meshResult = convertASTNodeToMesh(nodes[i], material);
      if (!meshResult.success) {
        throw new Error(`Failed to convert node ${i}: ${meshResult.error}`);
      }

      const mesh = meshResult.data;

      // Ensure mesh is properly prepared for CSG operations
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);

      // Ensure geometry has proper attributes
      if (!mesh.geometry.attributes.position) {
        throw new Error(`Mesh ${i} geometry missing position attribute`);
      }

      meshes.push(mesh);
    }

    // Perform CSG union operation
    let resultMesh: THREE.Mesh;
    
    if (meshes.length === 1) {
      resultMesh = meshes[0];
    } else {
      console.log(`[DEBUG][ASTToCSGConverter] Performing CSG union on ${meshes.length} meshes`);

      try {
        let csgResult = CSG.fromMesh(meshes[0]);
        console.log(`[DEBUG][ASTToCSGConverter] Created first CSG from mesh`);

        for (let i = 1; i < meshes.length; i++) {
          console.log(`[DEBUG][ASTToCSGConverter] Processing mesh ${i + 1} of ${meshes.length}`);
          const nextCSG = CSG.fromMesh(meshes[i]);
          csgResult = csgResult.union(nextCSG);
          console.log(`[DEBUG][ASTToCSGConverter] Union operation ${i} completed`);
        }

        console.log(`[DEBUG][ASTToCSGConverter] Converting CSG result back to mesh`);
        resultMesh = csgResult.toMesh();
        resultMesh.material = material;
        console.log(`[DEBUG][ASTToCSGConverter] CSG union completed successfully`);
      } catch (csgError) {
        console.error(`[ERROR][ASTToCSGConverter] CSG union failed:`, csgError);
        throw new Error(`CSG union operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`);
      }
    }

    // Calculate metadata for the union result
    resultMesh.geometry.computeBoundingBox();
    const boundingBox = resultMesh.geometry.boundingBox || new THREE.Box3();
    
    const metadata = {
      id: `csg-union-${Date.now()}`,
      nodeType: 'union',
      nodeIndex: 0,
      triangleCount: resultMesh.geometry.attributes.position.count / 3,
      vertexCount: resultMesh.geometry.attributes.position.count,
      boundingBox,
      material: 'standard',
      color: finalConfig.material.color,
      opacity: finalConfig.material.opacity,
      visible: true
    };

    const mesh3D: Mesh3D = {
      mesh: resultMesh,
      metadata,
      dispose: () => {
        resultMesh.geometry.dispose();
        if (Array.isArray(resultMesh.material)) {
          resultMesh.material.forEach(mat => mat.dispose());
        } else {
          resultMesh.material.dispose();
        }
      }
    };

    console.log(`[DEBUG][ASTToCSGConverter] Successfully created CSG union with ${metadata.triangleCount} triangles`);
    return mesh3D;
    
  }, (err) => `Failed to create CSG union: ${err instanceof Error ? err.message : String(err)}`);
};
