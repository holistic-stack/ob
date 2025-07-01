/**
 * AST to CSG Converter Service
 *
 * Service for converting OpenSCAD AST nodes to three-csg-ts operations
 * with support for primitives, transformations, and boolean operations.
 */

import * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, tryCatch, tryCatchAsync } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type { MaterialConfig, Mesh3D } from '../types/renderer.types.js';
import {
  convertDifferenceNode,
  convertIntersectionNode,
  convertUnionNode,
} from './converters/boolean-converter.js';
import type { MirrorNode, RotateExtrudeNode } from './converters/converter.types.js';
import {
  convertCubeToMesh,
  convertCylinderToMesh,
  convertSphereToMesh,
} from './converters/primitive-converter.js';
import {
  convertMirrorNode,
  convertRotateExtrudeNode,
  convertRotateNode,
  convertScaleNode,
  convertTranslateNode,
} from './converters/transformation-converter.js';
import { CSGCoreService } from './csg-core.service.js';
import { createMaterial } from './material.service.js';

const logger = createLogger('ASTToCSGConverter');

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
  side: 'front',
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
  timeoutMs: 10000,
};

/**
 * Convert AST node to Three.js mesh for CSG operations
 */
const convertASTNodeToMesh = async (
  node: ASTNode,
  material: THREE.Material
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Converting AST node type: ${node.type}`);

  switch (node.type) {
    case 'cube':
      return convertCubeToMesh(node, material);

    case 'sphere':
      return convertSphereToMesh(node, material);

    case 'cylinder':
      return convertCylinderToMesh(node, material);

    case 'translate':
      return await convertTranslateNode(node, material, convertASTNodeToMesh);

    case 'rotate':
      return await convertRotateNode(node, material, convertASTNodeToMesh);

    case 'scale':
      return await convertScaleNode(node, material, convertASTNodeToMesh);

    case 'mirror':
      return await convertMirrorNode(node as MirrorNode, material, convertASTNodeToMesh);

    case 'rotate_extrude':
      return await convertRotateExtrudeNode(
        node as RotateExtrudeNode,
        material,
        convertASTNodeToMesh
      );

    case 'union':
      return await convertUnionNode(node, material, convertASTNodeToMesh);

    case 'intersection':
      return await convertIntersectionNode(node, material, convertASTNodeToMesh);

    case 'difference':
      return await convertDifferenceNode(node, material, convertASTNodeToMesh);

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

  logger.init(`Converting AST node ${index} (${node.type}) to CSG`);

  // Create material
  const material = createMaterial(finalConfig.material);

  // Convert AST node to Three.js mesh
  const meshResult = await convertASTNodeToMesh(node, material);
  if (!meshResult.success) {
    return meshResult;
  }

  return tryCatch(
    () => {
      const mesh = meshResult.data;

      // Calculate metadata
      mesh.geometry.computeBoundingBox();
      const boundingBox = mesh.geometry.boundingBox ?? new THREE.Box3();

      const metadata = {
        id: `csg-${node.type}-${index}`,
        nodeType: node.type,
        nodeIndex: index,
        triangleCount: mesh.geometry.attributes.position?.count
          ? mesh.geometry.attributes.position.count / 3
          : 0,
        vertexCount: mesh.geometry.attributes.position?.count ?? 0,
        boundingBox,
        material: 'standard',
        color: finalConfig.material.color,
        opacity: finalConfig.material.opacity,
        visible: true,
      };

      const mesh3D: Mesh3D = {
        mesh,
        metadata,
        dispose: () => {
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        },
      };

      logger.debug(`Successfully converted ${node.type} to CSG mesh`);
      return mesh3D;
    },
    (err) =>
      `Failed to convert AST node to CSG: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Convert multiple AST nodes to CSG operations with union
 */
export const convertASTNodesToCSGUnion = async (
  nodes: ReadonlyArray<ASTNode>,
  config: Partial<CSGConversionConfig> = {}
): Promise<Result<Mesh3D, string>> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };

  logger.init(`Converting ${nodes.length} AST nodes to CSG union`);

  return tryCatchAsync(
    async () => {
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
        logger.debug(`Performing CSG union on ${meshes.length} meshes`);

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
          logger.debug(`Prepared first mesh for CSG operations`);

          for (let i = 1; i < meshes.length; i++) {
            logger.debug(`Processing mesh ${i + 1} of ${meshes.length}`);
            const currentMesh = meshes[i];
            if (!currentMesh) {
              throw new Error(`Mesh ${i} is undefined`);
            }
            const unionResult = await CSGCoreService.union(resultMesh, currentMesh);
            if (!unionResult.success) {
              throw new Error(`Union operation ${i} failed: ${unionResult.error}`);
            }
            resultMesh = unionResult.data;
            logger.debug(`Union operation ${i} completed`);
          }

          logger.debug(`CSG union completed successfully`);
        } catch (csgError) {
          logger.error(`CSG union failed:`, csgError);
          throw new Error(
            `CSG union operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`
          );
        }
      }

      // Calculate metadata for the union result
      resultMesh.geometry.computeBoundingBox();
      const boundingBox = resultMesh.geometry.boundingBox ?? new THREE.Box3();

      const metadata = {
        id: `csg-union-${Date.now()}`,
        nodeType: 'union',
        nodeIndex: 0,
        triangleCount: resultMesh.geometry.attributes.position?.count
          ? resultMesh.geometry.attributes.position.count / 3
          : 0,
        vertexCount: resultMesh.geometry.attributes.position?.count ?? 0,
        boundingBox,
        material: 'standard',
        color: finalConfig.material.color,
        opacity: finalConfig.material.opacity,
        visible: true,
      };

      const mesh3D: Mesh3D = {
        mesh: resultMesh,
        metadata,
        dispose: () => {
          resultMesh.geometry.dispose();
          if (Array.isArray(resultMesh.material)) {
            resultMesh.material.forEach((mat) => mat.dispose());
          } else {
            resultMesh.material.dispose();
          }
        },
      };

      logger.debug(`Successfully created CSG union with ${metadata.triangleCount} triangles`);
      return mesh3D;
    },
    (err) => `Failed to create CSG union: ${err instanceof Error ? err.message : String(err)}`
  );
};
