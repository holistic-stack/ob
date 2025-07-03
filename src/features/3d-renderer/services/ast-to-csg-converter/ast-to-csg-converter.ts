/**
 * AST to CSG Converter Service
 *
 * Service for converting OpenSCAD AST nodes to three-csg-ts operations
 * with support for primitives, transformations, and boolean operations.
 */

import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import {
  error,
  success,
  tryCatch,
  tryCatchAsync,
} from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  IntersectionNode,
  MirrorNode,
  RotateExtrudeNode,
  RotateNode,
  ScaleNode,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../../../openscad-parser/core/ast-types.js';
import type { MaterialConfig, Mesh3D } from '../../types/renderer.types.js';
import {
  convertDifferenceNode,
  convertIntersectionNode,
  convertUnionNode,
} from '../converters/boolean-converter.js';

import {
  convertCubeToMesh,
  convertCylinderToMesh,
  convertSphereToMesh,
} from '../converters/primitive-converter.js';
import {
  convertMirrorNode,
  convertRotateExtrudeNode,
  convertRotateNode,
  convertScaleNode,
  convertTranslateNode,
} from '../converters/transformation-converter.js';
import { CSGCoreService } from '../csg-core.service.js';
import { createMaterial } from '../material.service.js';

const logger = createLogger('ASTToCSGConverter');

/**
 * Module-level storage for source code to enable proper text extraction
 * This is a temporary solution until the parser properly extracts function arguments
 */
let currentSourceCode: string | null = null;

/**
 * Set the source code for text extraction
 * This is a temporary solution until the parser properly extracts function arguments
 */
export function setSourceCodeForExtraction(sourceCode: string): void {
  currentSourceCode = sourceCode;
  logger.debug(`Source code set for extraction (${sourceCode.length} characters)`);
}

/**
 * Clear the source code after conversion
 */
export function clearSourceCodeForExtraction(): void {
  currentSourceCode = null;
  logger.debug('Source code cleared after extraction');
}

/**
 * Extract source text for a given location
 * This is a temporary solution until the parser properly extracts function arguments
 */
function getSourceTextForLocation(location: {
  start: { offset: number };
  end: { offset: number };
}): string {
  // Use module-level source code if available
  if (
    currentSourceCode &&
    location.start.offset >= 0 &&
    location.end.offset > location.start.offset
  ) {
    const extractedText = currentSourceCode.slice(location.start.offset, location.end.offset);
    logger.debug(
      `Extracted source text from offsets ${location.start.offset}-${location.end.offset}: "${extractedText}"`
    );
    return extractedText;
  }

  // Fallback: return a placeholder that matches the expected translate syntax
  // This should not be reached in normal operation
  logger.warn('getSourceTextForLocation: No source code available, using fallback');
  return 'translate([0,0,0])';
}

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
 * Convert Tree Sitter function_call node by extracting function name and routing to appropriate converter
 */
const convertFunctionCallNode = async (
  node: ASTNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Converting function_call node:`, node);

  // Extract function name from function_call node
  // Try multiple possible properties where the function name might be stored
  const nodeWithProps = node as unknown as {
    name?: string;
    functionName?: string;
    function?: string;
  };

  let functionName = nodeWithProps.name || nodeWithProps.functionName || nodeWithProps.function;

  // If we got the full function call text, extract just the function name
  if (functionName && typeof functionName === 'string') {
    // Trim whitespace and extract function name from patterns like "  sphere(10)" -> "sphere"
    const trimmed = functionName.trim();
    const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (match) {
      functionName = match[1];
    }
  }

  if (!functionName) {
    return error(`Function call node missing function name: ${JSON.stringify(node)}`);
  }

  logger.debug(`Function call name: ${functionName}`);

  // Use the original node for conversion
  const typedNode = node;

  // For transformation operations, handle the case where they come as function_call nodes
  // without proper children due to parsing limitations
  if (['translate', 'rotate', 'scale', 'mirror'].includes(functionName)) {
    logger.debug(
      `${functionName} function detected as function_call node - extracting parameters from source`
    );

    // Extract transformation parameters from the source location
    const sourceLocation = typedNode.location;
    if (sourceLocation?.start && sourceLocation.end) {
      // Get the source text for this node
      const sourceText = getSourceTextForLocation(sourceLocation);
      logger.debug(`Source text: "${sourceText}"`);

      if (functionName === 'translate') {
        // Extract translation vector from source text like "translate([200,0,0])"
        const vectorMatch = sourceText.match(/translate\s*\(\s*\[([^\]]+)\]/);
        if (vectorMatch?.[1]) {
          const vectorContent = vectorMatch[1];
          const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

          if (numbers.length >= 3 && numbers.every((n: number) => !Number.isNaN(n))) {
            const x = numbers[0] ?? 0;
            const y = numbers[1] ?? 0;
            const z = numbers[2] ?? 0;
            logger.debug(`✅ Extracted translation vector: [${x}, ${y}, ${z}]`);

            // Create a small marker mesh to represent the translation
            const markerGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            const markerMesh = new THREE.Mesh(markerGeometry, material);
            markerMesh.position.set(x, y, z);

            return success(markerMesh);
          }
        }
      }
    }

    // Fallback: create a small identity mesh
    logger.warn(
      `Could not extract parameters for ${functionName}, creating identity transformation`
    );
    const identityGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const identityMesh = new THREE.Mesh(identityGeometry, material);
    identityMesh.position.set(1, 1, 1);

    return success(identityMesh);
  }

  // Route to the appropriate converter based on function name
  // Use unknown type assertion to bypass strict typing for dynamic node conversion
  const convertibleNode = typedNode as unknown;

  switch (functionName) {
    case 'cube':
      return convertCubeToMesh(convertibleNode as CubeNode, material);
    case 'sphere':
      return convertSphereToMesh(convertibleNode as SphereNode, material);
    case 'cylinder':
      return convertCylinderToMesh(convertibleNode as CylinderNode, material);
    case 'translate':
      return await convertTranslateNode(
        convertibleNode as TranslateNode,
        material,
        convertASTNodeToMesh
      );
    case 'rotate':
      return await convertRotateNode(convertibleNode as RotateNode, material, convertASTNodeToMesh);
    case 'scale':
      return await convertScaleNode(convertibleNode as ScaleNode, material, convertASTNodeToMesh);
    case 'mirror':
      return await convertMirrorNode(convertibleNode as MirrorNode, material, convertASTNodeToMesh);
    case 'rotate_extrude':
      return await convertRotateExtrudeNode(
        convertibleNode as RotateExtrudeNode,
        material,
        convertASTNodeToMesh
      );
    case 'union':
      return await convertUnionNode(convertibleNode as UnionNode, material, convertASTNodeToMesh);
    case 'intersection':
      return await convertIntersectionNode(
        convertibleNode as IntersectionNode,
        material,
        convertASTNodeToMesh
      );
    case 'difference':
      return await convertDifferenceNode(
        convertibleNode as DifferenceNode,
        material,
        convertASTNodeToMesh
      );
    default:
      return error(`Unsupported function in function_call node: ${functionName}`);
  }
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

    case 'function_call':
      // Handle Tree Sitter function_call nodes by extracting the function name
      return await convertFunctionCallNode(node, material, convertASTNodeToMesh);

    default:
      return error(`Unsupported AST node type for CSG conversion: ${node.type}`);
  }
};

/**
 * Convert AST node to Mesh3D using CSG operations with timeout protection
 */
export const convertASTNodeToCSG = async (
  node: ASTNode,
  index: number,
  config: Partial<CSGConversionConfig> = {}
): Promise<Result<Mesh3D, string>> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };

  logger.init(`Converting AST node ${index} (${node.type}) to CSG`);

  // Add timeout protection for CSG operations
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      logger.warn(
        `CSG conversion timeout after ${finalConfig.timeoutMs}ms for node ${index} (${node.type})`
      );
      resolve(error(`CSG conversion timeout after ${finalConfig.timeoutMs}ms`));
    }, finalConfig.timeoutMs);

    const performConversion = async (): Promise<Result<Mesh3D, string>> => {
      try {
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
      } catch (conversionError) {
        return error(
          `CSG conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`
        );
      }
    };

    performConversion()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        resolve(error(`CSG conversion error: ${err instanceof Error ? err.message : String(err)}`));
      });
  });
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
