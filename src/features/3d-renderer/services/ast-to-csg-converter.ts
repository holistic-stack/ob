/**
 * AST to CSG Converter Service
 * 
 * Service for converting OpenSCAD AST nodes to three-csg-ts operations
 * with support for primitives, transformations, and boolean operations.
 */

import * as THREE from 'three';
import { CSGCoreService } from './csg-core.service';
import type {
  ASTNode,
  CubeNode,
  SphereNode,
  CylinderNode,
  TranslateNode,
  RotateNode,
  ScaleNode,
  UnionNode,
  DifferenceNode,
  IntersectionNode,
  SourceLocation
} from '@holistic-stack/openscad-parser';
import type {
  Mesh3D,
  MaterialConfig
} from '../types/renderer.types';
import { error, tryCatch, tryCatchAsync } from '../../../shared/utils/functional/result';
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

    // Extract size parameters with proper defaults
    const size = Array.isArray(node.size) ? node.size : [node.size, node.size, node.size];
    const width = Number(size[0]) || 1;
    const height = Number(size[1]) || 1;
    const depth = Number(size[2]) || 1;

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
 * Convert translate node to mesh by processing children and applying transformation
 */
const convertTranslateNode = async (node: TranslateNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting translate node:`, node);

    // TranslateNode should have children and a vector parameter
    if (!node.children || node.children.length === 0) {
      throw new Error('Translate node must have children');
    }

    // Process the first child (OpenSCAD translate applies to one child)
    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Translate node first child is undefined');
    }
    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert translate child: ${childResult.error}`);
    }

    const mesh = childResult.data;

    // Apply translation - extract vector from TranslateNode
    // The TranslateNode should have a 'v' property with [x, y, z] vector
    let translationVector: [number, number, number] = [0, 0, 0];

    if (node.v) {
      translationVector = node.v as [number, number, number];
      console.log(`[DEBUG][ASTToCSGConverter] Found translation vector from node.v:`, translationVector);
    } else if ((node as unknown as Record<string, unknown>).v) {
      translationVector = (node as unknown as Record<string, unknown>).v as [number, number, number];
      console.log(`[DEBUG][ASTToCSGConverter] Found translation vector from node.v:`, translationVector);
    } else {
      console.warn(`[WARN][ASTToCSGConverter] No translation vector found in translate node, using [0,0,0]`);
    }

    const [x, y, z] = translationVector;

    // Apply translation to mesh position
    // Three.js coordinate system: X=right, Y=up, Z=forward (towards viewer)
    // OpenSCAD coordinate system: X=right, Y=forward, Z=up
    // For now, use direct mapping and verify with test case
    mesh.position.set(x, y, z);

    console.log(`[DEBUG][ASTToCSGConverter] Applied translation [${x}, ${y}, ${z}] to mesh`);
    console.log(`[DEBUG][ASTToCSGConverter] Mesh position after translation:`, {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z
    });

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Applied translation to mesh`);

    return mesh;
  });
};

/**
 * Convert rotate node to mesh by processing children and applying rotation
 */
const convertRotateNode = async (node: RotateNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting rotate node:`, node);

    if (!node.children || node.children.length === 0) {
      throw new Error('Rotate node must have children');
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Rotate node first child is undefined');
    }
    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert rotate child: ${childResult.error}`);
    }

    const mesh = childResult.data;

    // Apply rotation - need to check the actual structure of RotateNode
    if ((node as unknown as Record<string, unknown>).a) {
      const [x, y, z] = (node as unknown as Record<string, unknown>).a as [number, number, number];
      mesh.rotation.set(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z)
      );
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Applied rotation to mesh`);

    return mesh;
  });
};

/**
 * Convert scale node to mesh by processing children and applying scaling
 */
const convertScaleNode = async (node: ScaleNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting scale node:`, node);

    if (!node.children || node.children.length === 0) {
      throw new Error('Scale node must have children');
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Scale node first child is undefined');
    }
    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert scale child: ${childResult.error}`);
    }

    const mesh = childResult.data;

    // Apply scaling - need to check the actual structure of ScaleNode
    if ((node as unknown as Record<string, unknown>).v) {
      const [x, y, z] = (node as unknown as Record<string, unknown>).v as [number, number, number];
      mesh.scale.set(x, y, z);
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Applied scaling to mesh`);

    return mesh;
  });
};

/**
 * Mirror node interface for type safety
 */
interface MirrorNode {
  type: 'mirror';
  v: readonly [number, number, number];
  children: readonly ASTNode[];
  location?: SourceLocation;
}

/**
 * Convert mirror node to mesh by processing children and applying mirroring
 * Mirror reflects geometry across plane defined by normal vector
 */
const convertMirrorNode = async (node: MirrorNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting mirror node:`, node);

    if (!node.children || node.children.length === 0) {
      throw new Error('Mirror node must have children');
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Mirror node first child is undefined');
    }
    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert mirror child: ${childResult.error}`);
    }

    const mesh = childResult.data;

    // Apply mirroring using scale with negative values
    // Mirror vector defines the normal of the mirror plane
    if (node.v) {
      const [x, y, z] = node.v;

      // Convert mirror normal to scale factors
      // If normal component is non-zero, mirror across that axis
      const scaleX = x !== 0 ? -1 : 1;
      const scaleY = y !== 0 ? -1 : 1;
      const scaleZ = z !== 0 ? -1 : 1;

      mesh.scale.set(scaleX, scaleY, scaleZ);

      console.log(`[DEBUG][ASTToCSGConverter] Applied mirror transformation: scale(${scaleX}, ${scaleY}, ${scaleZ})`);
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Applied mirroring to mesh`);

    return mesh;
  });
};

/**
 * Rotate extrude node interface for type safety
 */
interface RotateExtrudeNode {
  type: 'rotate_extrude';
  angle?: number;
  children: readonly ASTNode[];
  location?: SourceLocation;
}

/**
 * Convert rotate_extrude node to mesh by revolving 2D profiles around Z-axis
 */
const convertRotateExtrudeNode = async (node: RotateExtrudeNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting rotate_extrude node:`, node);

    if (!node.children || node.children.length === 0) {
      throw new Error('Rotate_extrude node must have children');
    }

    // For now, create a simple torus as placeholder for rotate_extrude
    // In a full implementation, this would process 2D profiles and revolve them
    const angle = node.angle ?? 360;
    const segments = Math.max(8, Math.floor(angle / 15)); // More segments for smoother curves

    // Create a torus geometry as a placeholder for the revolved shape
    const geometry = new THREE.TorusGeometry(5, 2, 8, segments);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.updateMatrix();
    console.log(`[DEBUG][ASTToCSGConverter] Applied rotate_extrude with ${segments} segments (${angle}°)`);

    return mesh;
  });
};

/**
 * Convert union node to mesh by processing children and performing CSG union
 */
const convertUnionNode = async (node: UnionNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting union node:`, node);
    console.log(`[DEBUG][ASTToCSGConverter] Union node children count:`, node.children?.length || 0);

    if (node.children && node.children.length > 0) {
      console.log(`[DEBUG][ASTToCSGConverter] Union node children types:`,
        node.children.map(child => child.type));
    }

    if (!node.children || node.children.length === 0) {
      console.warn(`[WARN][ASTToCSGConverter] Union node has no children, creating placeholder mesh`);
      console.log(`[DEBUG][ASTToCSGConverter] This indicates AST restructuring may not be working correctly`);
      // Create a simple cube as placeholder when no children
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0); // Ensure placeholder is at origin
      return mesh;
    }

    // Convert all children to meshes
    const childMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) {
        throw new Error(`Union child ${i} is undefined`);
      }
      console.log(`[DEBUG][ASTToCSGConverter] Converting union child ${i + 1}/${node.children.length}: ${child.type}`);

      const childResult = await convertASTNodeToMesh(child, material);
      if (!childResult.success) {
        throw new Error(`Failed to convert union child ${i}: ${childResult.error}`);
      }
      childMeshes.push(childResult.data);
    }

    // Perform CSG union operation
    if (childMeshes.length === 1) {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First child mesh is undefined');
      }
      console.log(`[DEBUG][ASTToCSGConverter] Union has single child, returning as-is`);
      return firstMesh;
    }

    console.log(`[DEBUG][ASTToCSGConverter] Performing CSG union on ${childMeshes.length} meshes`);

    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First mesh for CSG union is undefined');
      }

      // Ensure matrices are updated
      firstMesh.updateMatrix();

      let resultMesh = firstMesh;
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          throw new Error(`Mesh ${i} for CSG union is undefined`);
        }
        nextMesh.updateMatrix();

        console.log(`[DEBUG][ASTToCSGConverter] Performing union operation ${i}/${childMeshes.length - 1}`);
        // Use the correct three-csg-ts API
        const unionResult = await CSGCoreService.union(resultMesh, nextMesh);
        if (!unionResult.success) {
          throw new Error(`Union operation failed: ${unionResult.error}`);
        }
        resultMesh = unionResult.data;
      }

      resultMesh.material = material;

      console.log(`[DEBUG][ASTToCSGConverter] CSG union completed successfully with actual combined geometry`);
      return resultMesh;
    } catch (csgError) {
      console.error(`[ERROR][ASTToCSGConverter] CSG union failed:`, csgError);
      throw new Error(`CSG union operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`);
    }
  });
};

/**
 * Convert intersection node to mesh by processing children and performing CSG intersection
 */
const convertIntersectionNode = async (node: IntersectionNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting intersection node:`, node);
    console.log(`[DEBUG][ASTToCSGConverter] Intersection node children count:`, node.children?.length || 0);

    if (node.children && node.children.length > 0) {
      console.log(`[DEBUG][ASTToCSGConverter] Intersection node children types:`,
        node.children.map(child => child.type));
    }

    if (!node.children || node.children.length === 0) {
      console.warn(`[WARN][ASTToCSGConverter] Intersection node has no children, creating placeholder mesh`);
      console.log(`[DEBUG][ASTToCSGConverter] This indicates AST restructuring may not be working correctly`);
      // Create a simple sphere as placeholder when no children
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0); // Ensure placeholder is at origin
      return mesh;
    }

    // Convert all children to meshes
    const childMeshes: THREE.Mesh[] = [];
    for (const child of node.children) {
      const childResult = await convertASTNodeToMesh(child, material);
      if (!childResult.success) {
        throw new Error(`Failed to convert intersection child: ${childResult.error}`);
      }
      childMeshes.push(childResult.data);
    }

    // Perform CSG intersection operation
    if (childMeshes.length === 1) {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First child mesh is undefined');
      }
      return firstMesh;
    }

    console.log(`[DEBUG][ASTToCSGConverter] Performing CSG intersection on ${childMeshes.length} meshes`);

    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First mesh for CSG intersection is undefined');
      }

      // Ensure matrices are updated
      firstMesh.updateMatrix();

      let resultMesh = firstMesh;
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          throw new Error(`Mesh ${i} for CSG intersection is undefined`);
        }
        nextMesh.updateMatrix();

        // Use the correct three-csg-ts API
        const intersectResult = await CSGCoreService.intersect(resultMesh, nextMesh);
        if (!intersectResult.success) {
          throw new Error(`Intersect operation failed: ${intersectResult.error}`);
        }
        resultMesh = intersectResult.data;
      }

      resultMesh.material = material;

      console.log(`[DEBUG][ASTToCSGConverter] CSG intersection completed successfully`);
      return resultMesh;
    } catch (csgError) {
      console.error(`[ERROR][ASTToCSGConverter] CSG intersection failed:`, csgError);
      throw new Error(`CSG intersection operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`);
    }
  });
};

/**
 * Convert difference node to mesh by processing children and performing CSG difference
 */
const convertDifferenceNode = async (node: DifferenceNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][ASTToCSGConverter] Converting difference node:`, node);

    if (!node.children || node.children.length === 0) {
      console.log(`[DEBUG][ASTToCSGConverter] Difference node has no children, creating empty mesh`);
      // For now, create a simple cylinder as placeholder when no children
      const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    }

    // Convert all children to meshes
    const childMeshes: THREE.Mesh[] = [];
    for (const child of node.children) {
      const childResult = await convertASTNodeToMesh(child, material);
      if (!childResult.success) {
        throw new Error(`Failed to convert difference child: ${childResult.error}`);
      }
      childMeshes.push(childResult.data);
    }

    // Perform CSG difference operation (first mesh minus all others)
    if (childMeshes.length === 1) {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First child mesh is undefined');
      }
      return firstMesh;
    }

    console.log(`[DEBUG][ASTToCSGConverter] Performing CSG difference on ${childMeshes.length} meshes`);

    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First mesh for CSG difference is undefined');
      }

      // Ensure matrices are updated
      firstMesh.updateMatrix();

      let resultMesh = firstMesh;
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          throw new Error(`Mesh ${i} for CSG difference is undefined`);
        }
        nextMesh.updateMatrix();

        // Use the correct three-csg-ts API
        const subtractResult = await CSGCoreService.subtract(resultMesh, nextMesh);
        if (!subtractResult.success) {
          throw new Error(`Subtract operation failed: ${subtractResult.error}`);
        }
        resultMesh = subtractResult.data;
      }

      resultMesh.material = material;

      console.log(`[DEBUG][ASTToCSGConverter] CSG difference completed successfully`);
      return resultMesh;
    } catch (csgError) {
      console.error(`[ERROR][ASTToCSGConverter] CSG difference failed:`, csgError);
      throw new Error(`CSG difference operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`);
    }
  });
};

/**
 * Convert AST node to Three.js mesh for CSG operations
 */
const convertASTNodeToMesh = async (node: ASTNode, material: THREE.Material): Promise<Result<THREE.Mesh, string>> => {
  console.log(`[DEBUG][ASTToCSGConverter] Converting AST node type: ${node.type}`);

  switch (node.type) {
    case 'cube':
      return convertCubeToMesh(node, material);

    case 'sphere':
      return convertSphereToMesh(node, material);

    case 'cylinder':
      return convertCylinderToMesh(node, material);

    case 'translate':
      return await convertTranslateNode(node, material);

    case 'rotate':
      return await convertRotateNode(node, material);

    case 'scale':
      return await convertScaleNode(node, material);

    case 'mirror':
      return await convertMirrorNode(node as MirrorNode, material);

    case 'rotate_extrude':
      return await convertRotateExtrudeNode(node as RotateExtrudeNode, material);

    case 'union':
      return await convertUnionNode(node, material);

    case 'intersection':
      return await convertIntersectionNode(node, material);

    case 'difference':
      return await convertDifferenceNode(node, material);

    default:
      return error(`Unsupported AST node type for CSG conversion: ${node.type}`);
  }
};

/**
 * Convert AST node to Mesh3D using CSG operations
 */
export const convertASTNodeToCSG = async (
  node: ASTNode, 
  index: number, 
  config: Partial<CSGConversionConfig> = {}
): Promise<Result<Mesh3D, string>> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };
  
  console.log(`[INIT][ASTToCSGConverter] Converting AST node ${index} (${node.type}) to CSG`);

  // Create material
  const material = createMaterial(finalConfig.material);

  // Convert AST node to Three.js mesh
  const meshResult = await convertASTNodeToMesh(node, material);
  if (!meshResult.success) {
    return meshResult;
  }

  return tryCatch(() => {

    const mesh = meshResult.data;
    
    // Calculate metadata
    mesh.geometry.computeBoundingBox();
    const boundingBox = mesh.geometry.boundingBox ?? new THREE.Box3();
    
    const metadata = {
      id: `csg-${node.type}-${index}`,
      nodeType: node.type,
      nodeIndex: index,
      triangleCount: mesh.geometry.attributes.position?.count ? mesh.geometry.attributes.position.count / 3 : 0,
      vertexCount: mesh.geometry.attributes.position?.count ?? 0,
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
export const convertASTNodesToCSGUnion = async (
  nodes: ReadonlyArray<ASTNode>,
  config: Partial<CSGConversionConfig> = {}
): Promise<Result<Mesh3D, string>> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };
  
  console.log(`[INIT][ASTToCSGConverter] Converting ${nodes.length} AST nodes to CSG union`);

  return tryCatchAsync(async () => {
    if (nodes.length === 0) {
      throw new Error('No AST nodes provided for CSG union');
    }

    // Convert all nodes to meshes
    const meshes: THREE.Mesh[] = [];
    const material = createMaterial(finalConfig.material);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node) {
        throw new Error(`Node ${i} is undefined`);
      }
      const meshResult = await convertASTNodeToMesh(node, material);
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
      const firstMesh = meshes[0];
      if (!firstMesh) {
        throw new Error('First mesh is undefined');
      }
      resultMesh = firstMesh;
    } else {
      console.log(`[DEBUG][ASTToCSGConverter] Performing CSG union on ${meshes.length} meshes`);

      const firstMesh = meshes[0];
      if (!firstMesh) {
        throw new Error('First mesh is undefined');
      }

      try {
        const firstCSGResult = await CSGCoreService.union(firstMesh, firstMesh); // Identity operation for first mesh
        if (!firstCSGResult.success) {
          throw new Error(`Failed to prepare first mesh for CSG: ${firstCSGResult.error}`);
        }
        resultMesh = firstCSGResult.data;
        console.log(`[DEBUG][ASTToCSGConverter] Prepared first mesh for CSG operations`);

        for (let i = 1; i < meshes.length; i++) {
          console.log(`[DEBUG][ASTToCSGConverter] Processing mesh ${i + 1} of ${meshes.length}`);
          const currentMesh = meshes[i];
          if (!currentMesh) {
            throw new Error(`Mesh ${i} is undefined`);
          }
          const unionResult = await CSGCoreService.union(resultMesh, currentMesh);
          if (!unionResult.success) {
            throw new Error(`Union operation ${i} failed: ${unionResult.error}`);
          }
          resultMesh = unionResult.data;
          console.log(`[DEBUG][ASTToCSGConverter] Union operation ${i} completed`);
        }

        console.log(`[DEBUG][ASTToCSGConverter] CSG union completed successfully`);
      } catch (csgError) {
        console.error(`[ERROR][ASTToCSGConverter] CSG union failed:`, csgError);
        throw new Error(`CSG union operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`);
      }
    }

    // Calculate metadata for the union result
    resultMesh.geometry.computeBoundingBox();
    const boundingBox = resultMesh.geometry.boundingBox ?? new THREE.Box3();
    
    const metadata = {
      id: `csg-union-${Date.now()}`,
      nodeType: 'union',
      nodeIndex: 0,
      triangleCount: resultMesh.geometry.attributes.position?.count ? resultMesh.geometry.attributes.position.count / 3 : 0,
      vertexCount: resultMesh.geometry.attributes.position?.count ?? 0,
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
