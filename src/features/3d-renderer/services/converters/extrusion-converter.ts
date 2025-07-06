import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';

const logger = createLogger('ExtrusionConverter');

/**
 * Extract parameters from a module_instantiation node
 */
function extractParametersFromNode(node: any): Record<string, any> {
  const params: Record<string, any> = {};

  // Handle different node structures
  if (node.args && Array.isArray(node.args)) {
    // Process argument list
    for (const arg of node.args) {
      if (arg.name && arg.value !== undefined) {
        // Named parameter: name=value
        params[arg.name] = arg.value;
      } else if (arg.value !== undefined) {
        // Positional parameter - use first one for simple cases
        if (!params._firstParam) {
          params._firstParam = arg.value;
        }
      }
    }
  }

  return params;
}

/**
 * Convert linear_extrude node to mesh by processing 2D children and applying linear extrusion
 */
export const convertLinearExtrudeNode = async (
  node: any, // Can be LinearExtrudeNode or module_instantiation
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting linear_extrude node:`, node);

    // Extract parameters from node
    const params = extractParametersFromNode(node);
    const height = Number(params.height || params._firstParam || 1);
    const center = params.center || false;
    const twist = params.twist || 0;
    const scale = params.scale || 1;

    logger.debug(`Linear extrude parameters:`, { height, center, twist, scale });

    if (!node.children || node.children.length === 0) {
      // If no children, create a default extruded rectangle
      logger.debug('Linear extrude node has no children, creating default extrusion');

      const geometry = new THREE.BoxGeometry(1, height, 1);
      const mesh = new THREE.Mesh(geometry, material);

      // Handle centering
      if (!center) {
        mesh.position.setY(height / 2);
      }

      mesh.updateMatrix();
      logger.debug(`Created default linear extrude mesh: height=${height}`);
      return mesh;
    }

    // Process the first child (the 2D shape to extrude)
    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Linear extrude node first child is undefined');
    }

    // Convert the 2D child to get its shape
    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert linear extrude child: ${childResult.error}`);
    }

    const childMesh = childResult.data;

    // For linear extrusion, we need to create a 3D mesh from the 2D shape
    // This is a simplified implementation - in reality, we'd need to:
    // 1. Extract the 2D shape geometry
    // 2. Use ExtrudeGeometry with proper parameters
    // 3. Handle twist, scale, and other parameters

    // For now, create a simple extrusion by scaling the child in Y direction
    let extrudedMesh: THREE.Mesh;

    if (childMesh.geometry instanceof THREE.CircleGeometry) {
      // For circles, create a cylinder
      const radius = (childMesh.geometry.parameters as any).radius || 1;
      const segments = (childMesh.geometry.parameters as any).radialSegments || 8;
      const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
      extrudedMesh = new THREE.Mesh(geometry, material);
    } else if (childMesh.geometry instanceof THREE.PlaneGeometry) {
      // For squares/rectangles, create a box
      const width = (childMesh.geometry.parameters as any).width || 1;
      const depth = (childMesh.geometry.parameters as any).height || 1;
      const geometry = new THREE.BoxGeometry(width, height, depth);
      extrudedMesh = new THREE.Mesh(geometry, material);
    } else {
      // For other shapes, use a generic approach
      // Create a box with the height parameter
      const geometry = new THREE.BoxGeometry(1, height, 1);
      extrudedMesh = new THREE.Mesh(geometry, material);
    }

    // Handle centering
    if (!center) {
      // OpenSCAD default: extrusion starts at z=0
      extrudedMesh.position.setY(height / 2);
    }

    // Apply twist if specified
    if (twist && twist !== 0) {
      const twistRadians = THREE.MathUtils.degToRad(Number(twist));
      extrudedMesh.rotation.y = twistRadians;
      logger.debug(`Applied twist: ${twist} degrees`);
    }

    // Apply scale if specified
    if (scale && scale !== 1) {
      if (typeof scale === 'number') {
        extrudedMesh.scale.set(scale, 1, scale);
      } else if (Array.isArray(scale) && scale.length >= 2) {
        extrudedMesh.scale.set(scale[0], 1, scale[1]);
      }
      logger.debug(`Applied scale:`, scale);
    }

    extrudedMesh.updateMatrix();
    logger.debug(`Created linear extrude mesh: height=${height}`);

    return extrudedMesh;
  });
};

/**
 * Convert rotate_extrude node to mesh by processing 2D children and applying rotational extrusion
 */
export const convertRotateExtrudeNode = async (
  node: any, // Can be RotateExtrudeNode or module_instantiation
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting rotate_extrude node:`, node);

    // Extract parameters from node
    const params = extractParametersFromNode(node);
    const angle = Number(params.angle || 360); // Default to full revolution
    const convexity = params.convexity || 1;

    logger.debug(`Rotate extrude parameters:`, { angle, convexity });

    if (!node.children || node.children.length === 0) {
      // If no children, create a default torus
      logger.debug('Rotate extrude node has no children, creating default torus');

      const geometry = new THREE.TorusGeometry(5, 1, 8, 16);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.updateMatrix();
      logger.debug(`Created default rotate extrude mesh (torus)`);
      return mesh;
    }

    // Process the first child (the 2D shape to rotate-extrude)
    const firstChild = node.children[0];
    if (!firstChild) {
      throw new Error('Rotate extrude node first child is undefined');
    }

    // Convert the 2D child to get its shape
    const childResult = await convertASTNodeToMesh(firstChild, material);
    if (!childResult.success) {
      throw new Error(`Failed to convert rotate extrude child: ${childResult.error}`);
    }

    const childMesh = childResult.data;

    // For rotate extrusion, we need to create a 3D mesh by rotating the 2D shape around an axis
    // This is a simplified implementation - in reality, we'd need to:
    // 1. Extract the 2D shape geometry
    // 2. Use LatheGeometry or custom geometry generation
    // 3. Handle partial angles and other parameters

    let extrudedMesh: THREE.Mesh;

    if (childMesh.geometry instanceof THREE.CircleGeometry) {
      // For circles, create a torus
      const radius = (childMesh.geometry.parameters as any).radius || 1;
      const tubeRadius = radius / 4; // Make the tube smaller
      const radialSegments = Math.max(8, Math.min(32, Math.round(angle / 15))); // Adaptive segments
      const tubularSegments = 16;

      const geometry = new THREE.TorusGeometry(
        radius,
        tubeRadius,
        tubularSegments,
        radialSegments,
        THREE.MathUtils.degToRad(angle)
      );
      extrudedMesh = new THREE.Mesh(geometry, material);
    } else if (childMesh.geometry instanceof THREE.PlaneGeometry) {
      // For squares/rectangles, create a partial cylinder or full cylinder
      const width = (childMesh.geometry.parameters as any).width || 1;
      const height = (childMesh.geometry.parameters as any).height || 1;
      const radius = Math.max(width, height) / 2;
      const segments = Math.max(8, Math.min(32, Math.round(angle / 15)));

      const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        segments,
        1,
        false,
        0,
        THREE.MathUtils.degToRad(angle)
      );
      extrudedMesh = new THREE.Mesh(geometry, material);
    } else {
      // For other shapes, use a generic torus
      const geometry = new THREE.TorusGeometry(3, 1, 8, 16, THREE.MathUtils.degToRad(angle));
      extrudedMesh = new THREE.Mesh(geometry, material);
    }

    extrudedMesh.updateMatrix();
    logger.debug(`Created rotate extrude mesh: angle=${angle} degrees`);

    return extrudedMesh;
  });
};

/**
 * Convert mirror node to mesh by processing children and applying mirroring
 */
export const convertMirrorNode = async (
  node: any, // MirrorNode type to be defined
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    logger.debug(`Converting mirror node:`, node);

    if (!node.children || node.children.length === 0) {
      // If no children, create a placeholder mesh
      logger.debug('Mirror node has no children, creating placeholder');

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.Mesh(geometry, material);

      // Apply mirroring transformation
      if (node.v && Array.isArray(node.v) && node.v.length >= 3) {
        const [x, y, z] = node.v;
        if (x !== 0) mesh.scale.x *= -1;
        if (y !== 0) mesh.scale.y *= -1;
        if (z !== 0) mesh.scale.z *= -1;
      }

      mesh.updateMatrix();
      logger.debug(`Created placeholder mirror mesh`);
      return mesh;
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

    // Apply mirroring - flip along the specified plane
    if (node.v && Array.isArray(node.v) && node.v.length >= 3) {
      const [x, y, z] = node.v;

      // Mirror by scaling negatively along the specified axes
      if (x !== 0) mesh.scale.x *= -1;
      if (y !== 0) mesh.scale.y *= -1;
      if (z !== 0) mesh.scale.z *= -1;

      logger.debug(`Applied mirroring along [${x}, ${y}, ${z}]`);
    }

    mesh.updateMatrix();
    logger.debug(`Applied mirroring to mesh`);

    return mesh;
  });
};
