import type {
  ASTNode,
  RotateNode,
  ScaleNode,
  SourceLocation,
  TranslateNode,
} from '@holistic-stack/openscad-parser';
import * as THREE from 'three';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';

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
    console.log(`[DEBUG][TransformationConverter] Converting translate node:`, node);

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
    const translationVector: readonly [number, number, number] =
      Array.isArray(node.v) && node.v.length === 2
        ? [node.v[0], node.v[1], 0] // Pad 2D vector with 0 for Z-axis
        : (node.v ?? [0, 0, 0]);

    const [x, y, z] = translationVector;

    // Apply translation to mesh position
    // Three.js coordinate system: X=right, Y=up, Z=forward (towards viewer)
    // OpenSCAD coordinate system: X=right, Y=forward, Z=up
    // For now, use direct mapping and verify with test case
    mesh.position.set(x, y, z);

    console.log(`[DEBUG][TransformationConverter] Applied translation [${x}, ${y}, ${z}] to mesh`);
    console.log(`[DEBUG][TransformationConverter] Mesh position after translation:`, {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
    });

    mesh.updateMatrix();
    console.log(`[DEBUG][TransformationConverter] Applied translation to mesh`);

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
    console.log(`[DEBUG][TransformationConverter] Converting rotate node:`, node);

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
    console.log(`[DEBUG][TransformationConverter] Applied rotation to mesh`);

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
    console.log(`[DEBUG][TransformationConverter] Converting scale node:`, node);

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
    if (node.v) {
      const [x, y, z] = node.v;
      mesh.scale.set(x, y, z);
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][TransformationConverter] Applied scaling to mesh`);

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
    console.log(`[DEBUG][TransformationConverter] Converting mirror node:`, node);

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

      console.log(
        `[DEBUG][TransformationConverter] Applied mirror transformation: scale(${scaleX}, ${scaleY}, ${scaleZ})`
      );
    }

    mesh.updateMatrix();
    console.log(`[DEBUG][TransformationConverter] Applied mirroring to mesh`);

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
    console.log(`[DEBUG][TransformationConverter] Converting rotate_extrude node:`, node);

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
    console.log(
      `[DEBUG][TransformationConverter] Applied rotate_extrude with ${segments} segments (${angle}°)`
    );

    return mesh;
  });
};
