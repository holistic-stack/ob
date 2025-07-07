import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import { tryCatch } from '../../../../shared/utils/functional/result.js';

// AST types are passed as parameters

import type {
  CircleNode,
  ModuleInstantiationNode,
  ParameterValue,
  PolygonNode,
  SquareNode,
  TextNode,
} from '../../../openscad-parser/ast/ast-types.js';

const logger = createLogger('2DPrimitiveConverter');

/**
 * Union type for primitive nodes that can be converted to 2D meshes
 */
export type PrimitiveNode =
  | CircleNode
  | SquareNode
  | PolygonNode
  | TextNode
  | ModuleInstantiationNode;

/**
 * Extract parameters from a module_instantiation node or primitive node
 */
function extractParametersFromNode(node: PrimitiveNode): Record<string, ParameterValue> {
  const params: Record<string, ParameterValue> = {};

  // Handle different node structures
  if ('args' in node && node.args && Array.isArray(node.args)) {
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
 * Convert circle AST node to Three.js mesh
 * Creates a circular 2D shape using PlaneGeometry with circular shape
 */
export const convertCircleToMesh = (
  node: PrimitiveNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      if (!node) {
        throw new Error('Circle node is null or undefined');
      }
      if (!material) {
        throw new Error('Material is null or undefined');
      }

      logger.debug(`Converting circle node:`, node);

      // Extract parameters from node
      const params = extractParametersFromNode(node);

      // Determine radius from either r or d parameter
      let radius: number;
      if (params.r !== undefined) {
        radius = Number(params.r);
      } else if (params.d !== undefined) {
        radius = Number(params.d) / 2;
      } else if (params._firstParam !== undefined) {
        // Single parameter assumed to be radius
        radius = Number(params._firstParam);
      } else {
        radius = 1; // Default radius
      }

      if (radius <= 0) {
        radius = 1; // Prevent invalid geometries
      }

      // Create circular geometry
      // For 2D shapes, we create a thin cylinder or use CircleGeometry
      const segments = Math.max(8, Math.min(64, Math.round(radius * 8))); // Adaptive segments
      const geometry = new THREE.CircleGeometry(radius, segments);

      // Rotate to lie in XY plane (OpenSCAD convention)
      geometry.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.updateMatrix();

      logger.debug(`Created circle mesh: radius=${radius}, segments=${segments}`);
      return mesh;
    },
    (err) => `Failed to convert circle node: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Convert square AST node to Three.js mesh
 * Creates a square/rectangular 2D shape using PlaneGeometry
 */
export const convertSquareToMesh = (
  node: PrimitiveNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      if (!node) {
        throw new Error('Square node is null or undefined');
      }
      if (!material) {
        throw new Error('Material is null or undefined');
      }

      logger.debug(`Converting square node:`, node);

      // Extract parameters from node
      const params = extractParametersFromNode(node);

      // Extract size parameters with proper defaults
      let width: number, height: number;

      if (params.size !== undefined) {
        if (typeof params.size === 'number') {
          width = height = Number(params.size);
        } else if (Array.isArray(params.size) && params.size.length >= 2) {
          width = Number(params.size[0]);
          height = Number(params.size[1]);
        } else {
          width = height = 1;
        }
      } else if (params._firstParam !== undefined) {
        // Single parameter - could be size or [width, height]
        if (typeof params._firstParam === 'number') {
          width = height = Number(params._firstParam);
        } else if (Array.isArray(params._firstParam) && params._firstParam.length >= 2) {
          width = Number(params._firstParam[0]);
          height = Number(params._firstParam[1]);
        } else {
          width = height = 1;
        }
      } else {
        width = height = 1; // Default size
      }

      if (width <= 0) width = 1;
      if (height <= 0) height = 1;

      // Create square/rectangle geometry
      const geometry = new THREE.PlaneGeometry(width, height);

      // Rotate to lie in XY plane (OpenSCAD convention)
      geometry.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, material);

      // Handle centering
      if (!params.center) {
        // OpenSCAD default: square is positioned with one corner at origin
        mesh.position.set(width / 2, 0, height / 2);
      }

      mesh.updateMatrix();
      logger.debug(`Created square mesh: ${width}x${height}`);

      return mesh;
    },
    (err) => `Failed to convert square node: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Convert polygon AST node to Three.js mesh
 * Creates a polygon 2D shape using custom geometry from points
 */
export const convertPolygonToMesh = (
  node: PrimitiveNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      if (!node) {
        throw new Error('Polygon node is null or undefined');
      }
      if (!material) {
        throw new Error('Material is null or undefined');
      }

      logger.debug(`Converting polygon node:`, node);

      // Extract parameters from node
      const params = extractParametersFromNode(node);
      const points = params.points || params._firstParam || [];

      if (!points || !Array.isArray(points) || points.length < 3) {
        // Create a default triangle if no valid points
        logger.warn('Polygon has insufficient points, creating default triangle');
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0.5, 0, 1]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.updateMatrix();
        return mesh;
      }

      // Create geometry from polygon points
      const shape = new THREE.Shape();

      // Move to first point
      const firstPoint = Array.isArray(points) ? points[0] : null;
      if (firstPoint && Array.isArray(firstPoint) && firstPoint.length >= 2) {
        shape.moveTo(firstPoint[0] as number, firstPoint[1] as number);
      }

      // Line to subsequent points
      if (Array.isArray(points)) {
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          if (point && Array.isArray(point) && point.length >= 2) {
            shape.lineTo(point[0] as number, point[1] as number);
          }
        }
      }

      // Close the shape
      shape.closePath();

      // Create geometry from shape
      const geometry = new THREE.ShapeGeometry(shape);

      // Rotate to lie in XY plane (OpenSCAD convention)
      geometry.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.updateMatrix();

      logger.debug(`Created polygon mesh with ${Array.isArray(points) ? points.length : 0} points`);
      return mesh;
    },
    (err) => `Failed to convert polygon node: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Convert text AST node to Three.js mesh
 * Creates a text 2D shape using TextGeometry (simplified version)
 */
export const convertTextToMesh = (
  node: PrimitiveNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      if (!node) {
        throw new Error('Text node is null or undefined');
      }
      if (!material) {
        throw new Error('Material is null or undefined');
      }

      logger.debug(`Converting text node:`, node);

      // Extract parameters from node
      const params = extractParametersFromNode(node);
      const text = params.text || params._firstParam || 'Text';
      const textSizeParam = params.size || 10;
      const textSize = typeof textSizeParam === 'number' ? textSizeParam : 10;
      const _font = params.font || 'Arial';

      // For now, create a placeholder mesh since TextGeometry requires font loading
      // In a full implementation, this would load fonts and create proper text geometry
      const textLength = String(text).length * textSize * 0.6; // Approximate width

      // Create a simple rectangular placeholder
      const geometry = new THREE.PlaneGeometry(textLength, textSize);

      // Rotate to lie in XY plane (OpenSCAD convention)
      geometry.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.updateMatrix();

      logger.debug(`Created text placeholder mesh: "${text}" (${textLength}x${textSize})`);
      return mesh;
    },
    (err) => `Failed to convert text node: ${err instanceof Error ? err.message : String(err)}`
  );
};
