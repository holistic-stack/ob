import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  RotateNode,
  ScaleNode,
  SourceLocation,
  TranslateNode,
} from '../../../openscad-parser/core/ast-types.js';

const logger = createLogger('TransformationConverter');

/**
 * Get current source code from Monaco Editor for vector parsing workaround
 */
function getCurrentSourceCode(): string | null {
  try {
    // Try to get source code from Monaco Editor
    const codeElement = document.querySelector('.monaco-editor textarea');
    if (codeElement && 'value' in codeElement) {
      return (codeElement as HTMLTextAreaElement).value;
    }

    // Fallback: try to get from Monaco Editor content
    const monacoContent = document.querySelector('.monaco-editor .view-lines');
    if (monacoContent) {
      return monacoContent.textContent || null;
    }

    return null;
  } catch (error) {
    logger.error('Failed to get current source code:', error);
    return null;
  }
}

/**
 * Convert translate node to mesh by processing children and applying transformation
 */
export const convertTranslateNode = async (
  node: TranslateNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting translate node:`, node);
    logger.debug(`Translate node children count:`, node.children?.length || 0);
    logger.debug(`Translate node children types:`, node.children?.map(child => child.type) || []);
    logger.debug(`Translate node vector (v):`, node.v);
    logger.debug(`Full translate node structure:`, JSON.stringify(node, null, 2));

    // Check if TranslateNode has children and a vector parameter
    if (!node.children || node.children.length === 0) {
      // If no children, create a placeholder mesh at the translated position
      logger.debug('Translate node has no children, creating placeholder');
      const translationVector: [number, number, number] =
        Array.isArray(node.v) && node.v.length === 3
          ? [node.v[0], node.v[1], node.v[2]]
          : [0, 0, 0];

      const [x, y, z] = translationVector;

      // Create a small marker mesh to represent the translation
      const markerGeometry = new THREE.SphereGeometry(0.5, 8, 6);
      const markerMesh = new THREE.Mesh(markerGeometry, material);
      markerMesh.position.set(x, y, z);
      markerMesh.updateMatrix();

      logger.debug(`Created placeholder translate mesh at [${x}, ${y}, ${z}]`);
      return markerMesh;
    }

    // Process the first child (OpenSCAD translate applies to one child)
    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Translate node first child is undefined');
    }

    logger.debug(`🔍 TRANSLATE CHILD: Converting child node:`, {
      childType: firstChild.type,
      childData: JSON.stringify(firstChild, null, 2)
    });

    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert translate child: ${childResult.error}`);
    }

    const mesh = childResult.data;
    logger.debug(`✅ TRANSLATE CHILD SUCCESS: Child mesh created for ${firstChild.type}`);

    // Apply translation - extract vector from TranslateNode
    // The TranslateNode should have a 'v' property with [x, y, z] vector
    logger.error(`🔍 TRANSLATE RAW: Raw node.v received:`, node.v);
    logger.error(`🔍 TRANSLATE RAW: node.v type:`, typeof node.v);
    logger.error(`🔍 TRANSLATE RAW: node.v isArray:`, Array.isArray(node.v));
    logger.error(`🔍 TRANSLATE RAW: node.v length:`, Array.isArray(node.v) ? node.v.length : 'not array');
    logger.error(`🔍 TRANSLATE RAW: node.v values:`, Array.isArray(node.v) ? node.v.map((v, i) => `[${i}]=${v} (${typeof v})`) : 'not array');

    // Extract translation vector with Tree-sitter workaround
    let translationVector: [number, number, number] = [0, 0, 0];

    if (Array.isArray(node.v) && node.v.length === 3) {
      translationVector = [node.v[0], node.v[1], node.v[2]];
      logger.error(`✅ TRANSLATE TREE-SITTER: Successfully extracted vector from Tree-sitter: [${translationVector[0]}, ${translationVector[1]}, ${translationVector[2]}]`);
    } else {
      // Tree-sitter vector parsing failed - apply text-based workaround
      logger.error(`🔧 TRANSLATE WORKAROUND: Tree-sitter vector parsing failed, applying text-based extraction`);

      // Try to extract from source code using text-based parsing
      const sourceCode = getCurrentSourceCode();
      if (sourceCode) {
        const vectorMatch = sourceCode.match(/translate\s*\(\s*\[([^\]]+)\]/);
        if (vectorMatch?.[1]) {
          const vectorContent = vectorMatch[1];
          const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

          if (numbers.length >= 3 && numbers.every((n: number) => !Number.isNaN(n))) {
            translationVector = [numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0];
            logger.error(`✅ TRANSLATE WORKAROUND: Successfully extracted vector from source code: [${translationVector[0]}, ${translationVector[1]}, ${translationVector[2]}]`);
          } else {
            logger.error(`❌ TRANSLATE WORKAROUND: Failed to parse vector from source code: "${vectorContent}"`);
          }
        } else {
          logger.error(`❌ TRANSLATE WORKAROUND: No translate vector pattern found in source code`);
        }
      } else {
        logger.error(`❌ TRANSLATE WORKAROUND: No source code available for text-based extraction`);
      }
    }

    const [x, y, z] = translationVector;

    logger.error(`🔍 TRANSLATE VECTOR: Using translation vector [${x}, ${y}, ${z}] from node.v:`, node.v);
    logger.error(`🔍 TRANSLATE NODE: Full translate node:`, JSON.stringify(node, null, 2));

    // Apply translation to mesh position (proper Three.js behavior)
    // Three.js coordinate system: X=right, Y=up, Z=forward (towards viewer)
    // OpenSCAD coordinate system: X=right, Y=forward, Z=up
    // For now, use direct mapping and verify with test case

    logger.debug(`🔧 TRANSLATE POSITION FIX: Applying translation [${x}, ${y}, ${z}] to mesh position`);

    // Apply translation to mesh position (proper Three.js approach)
    mesh.position.set(x, y, z);

    logger.debug(`✅ TRANSLATE APPLIED: Mesh position set to [${x}, ${y}, ${z}]`);
    logger.debug(`🔍 TRANSLATE FINAL: Translation applied to mesh position for proper Three.js behavior`);
    logger.debug(`🔍 TRANSLATE POSITION: Mesh position is now [${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z}]`);

    mesh.updateMatrix();
    logger.debug(`✅ TRANSLATE COMPLETE: Mesh position applied and matrix updated`);

    return mesh;
  });
};

/**
 * Convert rotate node to mesh by processing children and applying rotation
 */
export const convertRotateNode = async (
  node: RotateNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting rotate node:`, node);

    if (!node.children || node.children.length === 0) {
      // If no children, create a placeholder mesh with rotation applied
      logger.debug('Rotate node has no children, creating placeholder');

      // Create a small marker mesh to represent the rotation
      const markerGeometry = new THREE.BoxGeometry(1, 0.2, 0.2); // Arrow-like shape
      const markerMesh = new THREE.Mesh(markerGeometry, material);

      // Apply rotation
      if (typeof node.a === 'number') {
        // If 'a' is a single number, it's rotation around Z-axis
        markerMesh.rotation.set(0, 0, THREE.MathUtils.degToRad(node.a));
      } else if (Array.isArray(node.a)) {
        // If 'a' is a vector, it's rotation around [x,y,z] axes
        const [x, y, z] = node.a;
        markerMesh.rotation.set(
          THREE.MathUtils.degToRad(x),
          THREE.MathUtils.degToRad(y),
          THREE.MathUtils.degToRad(z)
        );
      }

      markerMesh.updateMatrix();
      logger.debug(`Created placeholder rotate mesh with rotation applied`);
      return markerMesh;
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
    if (typeof node.a === 'number') {
      // If 'a' is a single number, it's rotation around Z-axis
      mesh.rotation.set(0, 0, THREE.MathUtils.degToRad(node.a));
    } else if (Array.isArray(node.a)) {
      // If 'a' is a vector, it's rotation around [x,y,z] axes
      const [x, y, z] = node.a;
      mesh.rotation.set(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z)
      );
    }

    mesh.updateMatrix();
    logger.debug(`Applied rotation to mesh`);

    return mesh;
  });
};

/**
 * Convert scale node to mesh by processing children and applying scaling
 */
export const convertScaleNode = async (
  node: ScaleNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting scale node:`, node);

    if (!node.children || node.children.length === 0) {
      // If no children, create a placeholder mesh with scaling applied
      logger.debug('Scale node has no children, creating placeholder');

      // Create a small marker mesh to represent the scaling
      const markerGeometry = new THREE.BoxGeometry(1, 1, 1);
      const markerMesh = new THREE.Mesh(markerGeometry, material);

      // Apply scaling
      if (node.v) {
        if (typeof node.v === 'number') {
          markerMesh.scale.set(node.v, node.v, node.v);
        } else if (Array.isArray(node.v) && node.v.length === 3) {
          const [x, y, z] = node.v;
          markerMesh.scale.set(x, y, z);
        }
      }

      markerMesh.updateMatrix();
      logger.debug(`Created placeholder scale mesh with scaling applied`);
      return markerMesh;
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
    if (node.v) {
      if (typeof node.v === 'number') {
        mesh.scale.set(node.v, node.v, node.v);
      } else if (Array.isArray(node.v) && node.v.length === 3) {
        const [x, y, z] = node.v;
        mesh.scale.set(x, y, z);
      }
    }

    mesh.updateMatrix();
    logger.debug(`Applied scaling to mesh`);

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
export const convertMirrorNode = async (
  node: MirrorNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting mirror node:`, node);

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

      logger.debug(`Applied mirror transformation: scale(${scaleX}, ${scaleY}, ${scaleZ})`);
    }

    mesh.updateMatrix();
    logger.debug(`Applied mirroring to mesh`);

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
export const convertRotateExtrudeNode = async (
  node: RotateExtrudeNode,
  material: THREE.Material,
  _convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting rotate_extrude node:`, node);

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
    logger.debug(`Applied rotate_extrude with ${segments} segments (${angle}deg)`);

    return mesh;
  });
};
