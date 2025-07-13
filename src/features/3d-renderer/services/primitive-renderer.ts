/**
 * Primitive Renderer Service
 *
 * Service for converting OpenSCAD AST nodes to Three.js geometries
 * with support for all OpenSCAD primitives and transformations.
 */

import * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service';
import type { Result } from '../../../shared/types/result.types';
import { error, tryCatch } from '../../../shared/utils/functional/result';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type {
  MaterialConfig,
  MaterialFactory,
  Mesh3D,
  PrimitiveParams,
  PrimitiveRendererFactory,
} from '../types/renderer.types';
import { ManifoldASTConverter } from './manifold-ast-converter/manifold-ast-converter.js';
import { configureCSGMesh } from './lighting-fix/csg-lighting-setup';

// Create logger instance for this service
const logger = createLogger('PrimitiveRenderer');

/**
 * Default material configuration
 */
const DEFAULT_MATERIAL: MaterialConfig = {
  color: '#ffffff',
  opacity: 1,
  metalness: 0.1,
  roughness: 0.8,
  wireframe: false,
  transparent: false,
  side: 'front',
};

/**
 * Primitive geometry factory implementation
 */
export const createPrimitiveRendererFactory = (): PrimitiveRendererFactory => ({
  createCube: (size: number | readonly [number, number, number]) => {
    return tryCatch(
      () => {
        const [x, y, z] = Array.isArray(size) ? size : [size, size, size];

        if (x <= 0 || y <= 0 || z <= 0) {
          throw new Error('Cube dimensions must be positive');
        }

        return new THREE.BoxGeometry(x, y, z);
      },
      (err) => `Failed to create cube geometry: ${err instanceof Error ? err.message : String(err)}`
    );
  },

  createSphere: (radius: number, segments = 32) => {
    return tryCatch(
      () => {
        if (radius <= 0) {
          throw new Error('Sphere radius must be positive');
        }

        if (segments < 3) {
          throw new Error('Sphere segments must be at least 3');
        }

        return new THREE.SphereGeometry(radius, segments, segments);
      },
      (err) =>
        `Failed to create sphere geometry: ${err instanceof Error ? err.message : String(err)}`
    );
  },

  createCylinder: (radius: number, height: number, segments = 32) => {
    return tryCatch(
      () => {
        if (radius <= 0) {
          throw new Error('Cylinder radius must be positive');
        }

        if (height <= 0) {
          throw new Error('Cylinder height must be positive');
        }

        if (segments < 3) {
          throw new Error('Cylinder segments must be at least 3');
        }

        return new THREE.CylinderGeometry(radius, radius, height, segments);
      },
      (err) =>
        `Failed to create cylinder geometry: ${err instanceof Error ? err.message : String(err)}`
    );
  },

  createPolyhedron: (
    vertices: ReadonlyArray<readonly [number, number, number]>,
    faces: ReadonlyArray<ReadonlyArray<number>>
  ) => {
    return tryCatch(
      () => {
        if (vertices.length < 4) {
          throw new Error('Polyhedron must have at least 4 vertices');
        }

        if (faces.length < 4) {
          throw new Error('Polyhedron must have at least 4 faces');
        }

        // Flatten vertices array
        const verticesFlat: number[] = [];
        vertices.forEach((vertex) => {
          verticesFlat.push(vertex[0], vertex[1], vertex[2]);
        });

        // Flatten faces array (triangulate if necessary)
        const indicesFlat: number[] = [];
        faces.forEach((face) => {
          if (face.length < 3) {
            throw new Error('Face must have at least 3 vertices');
          }

          // Triangulate face if it has more than 3 vertices
          for (let i = 1; i < face.length - 1; i++) {
            const v0 = face[0];
            const v1 = face[i];
            const v2 = face[i + 1];
            if (v0 !== undefined && v1 !== undefined && v2 !== undefined) {
              indicesFlat.push(v0, v1, v2);
            }
          }
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(indicesFlat);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(verticesFlat, 3));
        geometry.computeVertexNormals();

        return geometry;
      },
      (err) =>
        `Failed to create polyhedron geometry: ${err instanceof Error ? err.message : String(err)}`
    );
  },
});

/**
 * Material factory implementation
 */
export const createMaterialFactory = (): MaterialFactory => ({
  createStandard: (config: MaterialConfig) => {
    return tryCatch(
      () => {
        const material = new THREE.MeshStandardMaterial({
          color: config.color,
          opacity: config.opacity,
          metalness: config.metalness,
          roughness: config.roughness,
          wireframe: config.wireframe,
          transparent: config.transparent || config.opacity < 1,
          side:
            config.side === 'front'
              ? THREE.FrontSide
              : config.side === 'back'
                ? THREE.BackSide
                : THREE.DoubleSide,
        });

        return material;
      },
      (err) =>
        `Failed to create standard material: ${err instanceof Error ? err.message : String(err)}`
    );
  },

  createWireframe: (color: string) => {
    return tryCatch(
      () => {
        return new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.8,
        });
      },
      (err) =>
        `Failed to create wireframe material: ${err instanceof Error ? err.message : String(err)}`
    );
  },

  createTransparent: (color: string, opacity: number) => {
    return tryCatch(
      () => {
        if (opacity < 0 || opacity > 1) {
          throw new Error('Opacity must be between 0 and 1');
        }

        return new THREE.MeshStandardMaterial({
          color,
          opacity,
          transparent: true,
          side: THREE.DoubleSide,
        });
      },
      (err) =>
        `Failed to create transparent material: ${err instanceof Error ? err.message : String(err)}`
    );
  },
});

/**
 * Parse OpenSCAD parameters from AST node
 */
const _parseParameters = (node: ASTNode): Record<string, unknown> => {
  // In the new parser structure, parameters are direct properties of the node
  // Extract only the non-standard properties (not type, location)
  const {
    type: _type,
    location: _location,
    ...parameters
  } = node as unknown as Record<string, unknown>;
  return parameters;
};

/**
 * Apply transformations to mesh
 */
const applyTransformations = (
  mesh: THREE.Mesh,
  transformations: ReadonlyArray<{ type: string; parameters: Record<string, unknown> }>
): Result<void, string> => {
  return tryCatch(
    () => {
      transformations.forEach((transform) => {
        switch (transform.type) {
          case 'translate': {
            const [x = 0, y = 0, z = 0] = (transform.parameters.vector as [
              number,
              number,
              number,
            ]) || [0, 0, 0];
            mesh.position.add(new THREE.Vector3(x, y, z));
            break;
          }
          case 'rotate': {
            const [x = 0, y = 0, z = 0] = (transform.parameters.vector as [
              number,
              number,
              number,
            ]) || [0, 0, 0];
            mesh.rotation.x += THREE.MathUtils.degToRad(x);
            mesh.rotation.y += THREE.MathUtils.degToRad(y);
            mesh.rotation.z += THREE.MathUtils.degToRad(z);
            break;
          }
          case 'scale': {
            const scale = transform.parameters.vector;
            if (Array.isArray(scale)) {
              const [x = 1, y = 1, z = 1] = scale as [number, number, number];
              mesh.scale.multiply(new THREE.Vector3(x, y, z));
            } else if (typeof scale === 'number') {
              mesh.scale.multiplyScalar(scale);
            }
            break;
          }
          case 'color': {
            const color = transform.parameters.color as string;
            if (color && mesh.material instanceof THREE.Material) {
              (mesh.material as THREE.Material & { color?: THREE.Color }).color = new THREE.Color(
                color
              );
            }
            break;
          }
        }
      });
    },
    (err) => `Failed to apply transformations: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Render OpenSCAD primitive to Three.js mesh
 */
export const renderPrimitive = (params: PrimitiveParams): Result<Mesh3D, string> => {
  const geometryFactory = createPrimitiveRendererFactory();
  const materialFactory = createMaterialFactory();

  return tryCatch(
    () => {
      // Create geometry based on primitive type
      let geometryResult: Result<THREE.BufferGeometry, string>;

      switch (params.type) {
        case 'cube': {
          const size = params.parameters.size || [1, 1, 1];
          geometryResult = geometryFactory.createCube(
            size as number | readonly [number, number, number]
          );
          break;
        }
        case 'sphere': {
          const radius = (params.parameters.radius as number) || 1;
          const segments = (params.parameters.segments as number) || 32;
          geometryResult = geometryFactory.createSphere(radius, segments);
          break;
        }
        case 'cylinder': {
          const radius = (params.parameters.radius as number) || 1;
          const height = (params.parameters.height as number) || 1;
          const segments = (params.parameters.segments as number) || 32;
          geometryResult = geometryFactory.createCylinder(radius, height, segments);
          break;
        }
        default:
          geometryResult = error(`Unsupported primitive type: ${params.type}`);
      }

      if (!geometryResult.success) {
        throw new Error(geometryResult.error);
      }

      // Create material
      const materialConfig = { ...DEFAULT_MATERIAL, ...params.material };
      const materialResult = materialFactory.createStandard(materialConfig);

      if (!materialResult.success) {
        throw new Error(materialResult.error);
      }

      // Create mesh
      const mesh = new THREE.Mesh(geometryResult.data, materialResult.data);

      // Apply transformations
      const transformResult = applyTransformations(mesh, params.transformations);
      if (!transformResult.success) {
        throw new Error(transformResult.error);
      }

      // Calculate bounding box and metadata
      geometryResult.data.computeBoundingBox();
      const boundingBox = geometryResult.data.boundingBox || new THREE.Box3();

      const metadata: import('../types/renderer.types.js').MeshMetadata = {
        // NodeMetadata properties
        nodeId:
          `${params.type}-${Date.now()}` as import('../../../shared/types/ast.types.js').NodeId,
        nodeType: params.type as import('../../../shared/types/ast.types.js').NodeType,
        depth: 0,
        parentId: 'root' as import('../../../shared/types/ast.types.js').NodeId,
        childrenIds: [],
        size: 1,
        complexity: 1,
        isOptimized: false,
        lastAccessed: new Date(),
        // MeshMetadata properties
        meshId: `mesh-${params.type}-${Date.now()}`,
        triangleCount: geometryResult.data.attributes.position?.count
          ? geometryResult.data.attributes.position.count / 3
          : 0,
        vertexCount: geometryResult.data.attributes.position?.count ?? 0,
        boundingBox,
        material: 'standard',
        color: materialConfig.color,
        opacity: materialConfig.opacity,
        visible: true,
      };

      return {
        mesh,
        metadata,
        dispose: () => {
          geometryResult.data.dispose();
          materialResult.data.dispose();
        },
      };
    },
    (err) => `Failed to render primitive: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Render OpenSCAD AST node to Three.js mesh using CSG operations
 */
export const renderASTNode = async (
  node: ASTNode,
  index: number
): Promise<Result<Mesh3D, string>> => {
  logger.debug(`Rendering AST node ${index}: ${node.type} using CSG`);

  // Use the Manifold converter for all OpenSCAD primitives
  const { MaterialIDManager } = await import(
    '../services/manifold-material-manager/manifold-material-manager'
  );
  const materialManager = new MaterialIDManager();
  await materialManager.initialize();

  const converter = new ManifoldASTConverter(materialManager);
  await converter.initialize();

  const csgResult = await converter.convertNode(node, {
    preserveMaterials: false,
    optimizeResult: true,
    timeout: 10000,
  });

  if (csgResult.success) {
    logger.debug(`Successfully rendered ${node.type} using CSG`);

    // Create a THREE.Mesh from the BufferGeometry
    const geometry = csgResult.data.geometry;
    const material = new THREE.MeshStandardMaterial({
      color: '#00ff88', // Green color as specified
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide, // CRITICAL: Use DoubleSide for CSG operations to show interior surfaces
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Configure mesh for CSG operations (shadow casting, receiving, etc.)
    configureCSGMesh(mesh);

    // Calculate bounding box
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox || new THREE.Box3();

    // Convert ManifoldConversionResult to Mesh3D format
    const mesh3D: Mesh3D = {
      mesh,
      metadata: {
        meshId: `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        triangleCount: csgResult.data.triangleCount,
        vertexCount: csgResult.data.vertexCount,
        boundingBox,
        material: 'standard',
        color: '#00ff88',
        opacity: 1,
        visible: true,
        nodeId: `node_${index}` as any,
        nodeType: node.type as any,
        depth: 0,
        childrenIds: [],
        size: 1,
        complexity: csgResult.data.vertexCount,
        isOptimized: false,
        lastAccessed: new Date(),
      },
      dispose: () => {
        geometry.dispose();
        material.dispose();
      },
    };

    return { success: true, data: mesh3D };
  } else {
    logger.error(`Failed to render ${node.type} using CSG:`, csgResult.error);
    return { success: false, error: csgResult.error };
  }
};
