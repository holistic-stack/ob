/**
 * @file AST-to-CSG Converter Service
 *
 * Converts optimized OpenSCAD ASTs into three-csg-ts CSG operations for 3D rendering.
 * Handles primitives, transformations, and boolean operations with performance optimization.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import {
  createCSGConfig,
  performCSGOperation,
} from '../../../3d-renderer/services/csg-operations.js';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  IntersectionNode,
  MirrorNode,
  PolyhedronNode,
  RotateNode,
  ScaleNode,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../ast-types.js';
import type { ScopeManager } from '../symbols/scope-manager.js';
import { TransformationMatrix, type TransformationParams } from './transformation-matrix.js';

const _logger = createLogger('ASTToCSGConverter');

/**
 * CSG conversion result
 */
export interface CSGConversionResult {
  readonly meshes: THREE.Mesh[];
  readonly statistics: CSGStatistics;
  readonly errors: CSGError[];
  readonly warnings: CSGWarning[];
}

/**
 * CSG conversion statistics
 */
export interface CSGStatistics {
  readonly totalNodes: number;
  readonly primitivesCreated: number;
  readonly transformationsApplied: number;
  readonly booleanOperations: number;
  readonly conversionTime: number;
  readonly memoryUsage: number;
}

/**
 * CSG conversion error
 */
export interface CSGError {
  readonly message: string;
  readonly code: string;
  readonly nodeType?: string;
  readonly location?: { line: number; column: number };
  readonly severity: 'error' | 'warning';
}

/**
 * CSG conversion warning
 */
export interface CSGWarning {
  readonly message: string;
  readonly code: string;
  readonly nodeType?: string;
  readonly suggestion?: string;
}

/**
 * CSG conversion configuration
 */
export interface CSGConversionConfig {
  readonly enableOptimization: boolean;
  readonly maxComplexity: number;
  readonly defaultMaterial: THREE.Material;
  readonly enableWireframe: boolean;
  readonly enableShadows: boolean;
  readonly performanceMode: boolean;
}

/**
 * Default CSG conversion configuration
 */
export const DEFAULT_CSG_CONFIG: CSGConversionConfig = {
  enableOptimization: true,
  maxComplexity: 1000,
  defaultMaterial: new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    metalness: 0.1,
    roughness: 0.8,
  }),
  enableWireframe: false,
  enableShadows: true,
  performanceMode: false,
};

/**
 * AST-to-CSG Converter Service
 * Converts optimized OpenSCAD ASTs into three-csg-ts CSG operations
 */
export class ASTToCSGConverter {
  private readonly logger = createLogger('ASTToCSGConverter');
  private readonly config: CSGConversionConfig;
  private readonly scopeManager: ScopeManager | undefined;

  private statistics: {
    totalNodes: number;
    primitivesCreated: number;
    transformationsApplied: number;
    booleanOperations: number;
    conversionTime: number;
    memoryUsage: number;
  } = {
    totalNodes: 0,
    primitivesCreated: 0,
    transformationsApplied: 0,
    booleanOperations: 0,
    conversionTime: 0,
    memoryUsage: 0,
  };

  private errors: CSGError[] = [];
  private warnings: CSGWarning[] = [];

  constructor(config: CSGConversionConfig = DEFAULT_CSG_CONFIG, scopeManager?: ScopeManager) {
    this.config = config;
    this.scopeManager = scopeManager;
    this.logger.debug('ASTToCSGConverter initialized');
  }

  /**
   * Convert an AST to CSG meshes
   * @param ast - AST nodes to convert
   * @returns CSG conversion result
   */
  async convert(ast: ASTNode[]): Promise<Result<CSGConversionResult, CSGError>> {
    this.logger.debug(`Starting CSG conversion for ${ast.length} AST nodes`);
    const startTime = performance.now();

    try {
      // Reset state
      this.resetState();

      // Convert AST nodes to meshes
      const meshes: THREE.Mesh[] = [];

      for (const node of ast) {
        const meshResult = await this.convertNode(node);
        if (meshResult.success) {
          if (meshResult.data) {
            meshes.push(meshResult.data);
          }
        } else {
          this.errors.push(meshResult.error);
        }
      }

      // Calculate final statistics
      const endTime = performance.now();
      this.statistics.totalNodes = ast.length;
      this.statistics.conversionTime = endTime - startTime;
      this.statistics.memoryUsage = this.estimateMemoryUsage(meshes);

      const result: CSGConversionResult = {
        meshes,
        statistics: {
          totalNodes: this.statistics.totalNodes,
          primitivesCreated: this.statistics.primitivesCreated,
          transformationsApplied: this.statistics.transformationsApplied,
          booleanOperations: this.statistics.booleanOperations,
          conversionTime: this.statistics.conversionTime,
          memoryUsage: this.statistics.memoryUsage,
        },
        errors: [...this.errors],
        warnings: [...this.warnings],
      };

      this.logger.debug(
        `CSG conversion completed: ${meshes.length} meshes created, ${this.errors.length} errors, ${this.warnings.length} warnings`
      );

      return success(result);
    } catch (err) {
      const conversionError: CSGError = {
        message: `CSG conversion failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'CSG_CONVERSION_FAILURE',
        severity: 'error' as const,
      };

      this.logger.error(`CSG conversion failed: ${conversionError.message}`);
      return error(conversionError);
    }
  }

  /**
   * Convert a single AST node to a mesh
   * @param node - AST node to convert
   * @returns Mesh or null if not renderable
   */
  private async convertNode(node: ASTNode): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      switch (node.type) {
        case 'cube':
          return this.convertCube(node as CubeNode);
        case 'sphere':
          return this.convertSphere(node as SphereNode);
        case 'cylinder':
          return this.convertCylinder(node as CylinderNode);
        case 'polyhedron':
          return this.convertPolyhedron(node as PolyhedronNode);
        case 'translate':
          return await this.convertTranslate(node as TranslateNode);
        case 'rotate':
          return await this.convertRotate(node as RotateNode);
        case 'scale':
          return await this.convertScale(node as ScaleNode);
        case 'mirror':
          return await this.convertMirror(node as MirrorNode);
        case 'union':
          return await this.convertUnion(node as UnionNode);
        case 'difference':
          return await this.convertDifference(node as DifferenceNode);
        case 'intersection':
          return await this.convertIntersection(node as IntersectionNode);
        default:
          // Non-renderable nodes (assignments, function definitions, etc.)
          this.logger.debug(`Skipping non-renderable node type: ${node.type}`);
          return success(null);
      }
    } catch (err) {
      const conversionError: CSGError = {
        message: `Failed to convert ${node.type} node: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'NODE_CONVERSION_FAILURE',
        nodeType: node.type,
        location: node.location
          ? { line: node.location.start.line, column: node.location.start.column }
          : { line: 0, column: 0 },
        severity: 'error' as const,
      };

      return error(conversionError);
    }
  }

  /**
   * Convert a cube node to a mesh
   * @param node - Cube AST node
   * @returns Cube mesh
   */
  private convertCube(node: CubeNode): Result<THREE.Mesh, CSGError> {
    try {
      // Parameter validation and calculation
      const size = typeof node.size === 'number' ? [node.size, node.size, node.size] : node.size;
      const [width = 1, height = 1, depth = 1] = size;

      // Validate dimensions
      if (width <= 0 || height <= 0 || depth <= 0) {
        return error({
          message: `Invalid cube dimensions: ${width}x${height}x${depth}. All dimensions must be positive.`,
          code: 'INVALID_CUBE_DIMENSIONS',
          nodeType: 'cube',
          severity: 'error' as const,
        });
      }

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = this.config.defaultMaterial.clone();
      const mesh = new THREE.Mesh(geometry, material);

      // Handle centering
      if (!node.center) {
        mesh.position.set(width / 2, height / 2, depth / 2);
      }

      mesh.updateMatrix();
      this.statistics.primitivesCreated++;

      this.logger.debug(`Created cube: ${width}x${height}x${depth}, center: ${node.center}`);
      return success(mesh);
    } catch (err) {
      return error({
        message: `Failed to create cube: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'CUBE_CREATION_FAILURE',
        nodeType: 'cube',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a sphere node to a mesh
   * @param node - Sphere AST node
   * @returns Sphere mesh
   */
  private convertSphere(node: SphereNode): Result<THREE.Mesh, CSGError> {
    try {
      // Parameter validation and calculation
      let radius: number;

      if (node.r !== undefined) {
        radius = node.r;
      } else if (node.radius !== undefined) {
        radius = node.radius;
      } else if (node.d !== undefined) {
        radius = node.d / 2;
      } else if (node.diameter !== undefined) {
        radius = node.diameter / 2;
      } else {
        radius = 1; // Default radius
      }

      // Validate radius
      if (radius <= 0) {
        return error({
          message: `Invalid sphere radius: ${radius}. Radius must be positive.`,
          code: 'INVALID_SPHERE_RADIUS',
          nodeType: 'sphere',
          severity: 'error' as const,
        });
      }

      const segments = this.config.performanceMode ? 16 : 32;
      const geometry = new THREE.SphereGeometry(radius, segments, segments);
      const material = this.config.defaultMaterial.clone();
      const mesh = new THREE.Mesh(geometry, material);

      mesh.updateMatrix();
      this.statistics.primitivesCreated++;

      this.logger.debug(`Created sphere: radius ${radius}, segments ${segments}`);
      return success(mesh);
    } catch (err) {
      return error({
        message: `Failed to create sphere: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'SPHERE_CREATION_FAILURE',
        nodeType: 'sphere',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a cylinder node to a mesh
   * @param node - Cylinder AST node
   * @returns Cylinder mesh
   */
  private convertCylinder(node: CylinderNode): Result<THREE.Mesh, CSGError> {
    try {
      // Parameter validation and calculation
      const height = node.h;
      if (height <= 0) {
        return error({
          message: `Invalid cylinder height: ${height}. Height must be positive.`,
          code: 'INVALID_CYLINDER_HEIGHT',
          nodeType: 'cylinder',
          severity: 'error' as const,
        });
      }

      // Handle radius parameters (r, r1, r2)
      let radiusTop: number;
      let radiusBottom: number;

      if (node.r1 !== undefined && node.r2 !== undefined) {
        // Tapered cylinder
        radiusBottom = node.r1;
        radiusTop = node.r2;
      } else if (node.r !== undefined) {
        // Regular cylinder
        radiusTop = radiusBottom = node.r;
      } else {
        // Default radius
        radiusTop = radiusBottom = 1;
      }

      // Validate radii
      if (radiusTop < 0 || radiusBottom < 0) {
        return error({
          message: `Invalid cylinder radius: top=${radiusTop}, bottom=${radiusBottom}. Radii must be non-negative.`,
          code: 'INVALID_CYLINDER_RADIUS',
          nodeType: 'cylinder',
          severity: 'error' as const,
        });
      }

      const segments = this.config.performanceMode ? 16 : 32;
      const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
      const material = this.config.defaultMaterial.clone();
      const mesh = new THREE.Mesh(geometry, material);

      // Handle centering
      if (!node.center) {
        mesh.position.y = height / 2;
      }

      mesh.updateMatrix();
      this.statistics.primitivesCreated++;

      this.logger.debug(
        `Created cylinder: radiusTop=${radiusTop}, radiusBottom=${radiusBottom}, height=${height}, segments=${segments}`
      );
      return success(mesh);
    } catch (err) {
      return error({
        message: `Failed to create cylinder: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'CYLINDER_CREATION_FAILURE',
        nodeType: 'cylinder',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Reset internal state for new conversion
   */
  private resetState(): void {
    this.statistics = {
      totalNodes: 0,
      primitivesCreated: 0,
      transformationsApplied: 0,
      booleanOperations: 0,
      conversionTime: 0,
      memoryUsage: 0,
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Convert a polyhedron node to a mesh
   * @param node - Polyhedron AST node
   * @returns Polyhedron mesh
   */
  private convertPolyhedron(node: PolyhedronNode): Result<THREE.Mesh, CSGError> {
    try {
      // Validate points and faces
      if (!node.points || node.points.length === 0) {
        return error({
          message: 'Polyhedron requires at least one point',
          code: 'INVALID_POLYHEDRON_POINTS',
          nodeType: 'polyhedron',
          severity: 'error' as const,
        });
      }

      if (!node.faces || node.faces.length === 0) {
        return error({
          message: 'Polyhedron requires at least one face',
          code: 'INVALID_POLYHEDRON_FACES',
          nodeType: 'polyhedron',
          severity: 'error' as const,
        });
      }

      // Create BufferGeometry from points and faces
      const geometry = new THREE.BufferGeometry();

      // Convert points to vertices
      const vertices: number[] = [];
      const indices: number[] = [];

      for (const point of node.points) {
        if (point.length !== 3) {
          return error({
            message: `Invalid point format: ${JSON.stringify(point)}. Points must have 3 coordinates.`,
            code: 'INVALID_POLYHEDRON_POINT_FORMAT',
            nodeType: 'polyhedron',
            severity: 'error' as const,
          });
        }
        vertices.push(point[0], point[1], point[2]);
      }

      // Convert faces to indices
      for (const face of node.faces) {
        if (face.length < 3) {
          return error({
            message: `Invalid face format: ${JSON.stringify(face)}. Faces must have at least 3 vertices.`,
            code: 'INVALID_POLYHEDRON_FACE_FORMAT',
            nodeType: 'polyhedron',
            severity: 'error' as const,
          });
        }

        // Triangulate face if it has more than 3 vertices
        for (let i = 1; i < face.length - 1; i++) {
          const v0 = face[0];
          const v1 = face[i];
          const v2 = face[i + 1];

          // Validate vertex indices exist and are valid
          if (v0 === undefined || v1 === undefined || v2 === undefined) {
            return error({
              message: `Undefined vertex index in face: [${v0}, ${v1}, ${v2}]`,
              code: 'INVALID_POLYHEDRON_VERTEX_INDEX',
              nodeType: 'polyhedron',
              severity: 'error' as const,
            });
          }

          if (v0 >= node.points.length || v1 >= node.points.length || v2 >= node.points.length) {
            return error({
              message: `Invalid vertex index in face: [${v0}, ${v1}, ${v2}]. Max index: ${node.points.length - 1}`,
              code: 'INVALID_POLYHEDRON_VERTEX_INDEX',
              nodeType: 'polyhedron',
              severity: 'error' as const,
            });
          }

          indices.push(v0, v1, v2);
        }
      }

      // Set geometry attributes
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = this.config.defaultMaterial.clone();
      const mesh = new THREE.Mesh(geometry, material);

      mesh.updateMatrix();
      this.statistics.primitivesCreated++;

      this.logger.debug(
        `Created polyhedron: ${node.points.length} points, ${node.faces.length} faces, ${indices.length / 3} triangles`
      );
      return success(mesh);
    } catch (err) {
      return error({
        message: `Failed to create polyhedron: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'POLYHEDRON_CREATION_FAILURE',
        nodeType: 'polyhedron',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a translate node to a mesh
   * @param node - Translate AST node
   * @returns Transformed mesh
   */
  private async convertTranslate(
    node: TranslateNode
  ): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length === 0) {
        return success(null);
      }

      // Convert child nodes first
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length === 0) {
        return success(null);
      }

      // Create transformation matrix
      const translation = node.v || [0, 0, 0];
      const transformParams: TransformationParams = {
        translation: translation as readonly [number, number, number],
      };

      const matrixResult = TransformationMatrix.createFromParams(transformParams);
      if (!matrixResult.success) {
        return error({
          message: `Failed to create translation matrix: ${matrixResult.error.message}`,
          code: 'TRANSLATION_MATRIX_FAILURE',
          nodeType: 'translate',
          severity: 'error' as const,
        });
      }

      // Apply transformation to all child meshes
      for (const mesh of childMeshes) {
        const applyResult = TransformationMatrix.applyToMesh(mesh, matrixResult.data);
        if (!applyResult.success) {
          this.errors.push({
            message: `Failed to apply translation to mesh: ${applyResult.error.message}`,
            code: 'MESH_TRANSLATION_FAILURE',
            nodeType: 'translate',
            severity: 'warning' as const,
          });
        }
      }

      this.statistics.transformationsApplied++;
      this.logger.debug(
        `Applied translation: [${translation[0]}, ${translation[1]}, ${translation[2]}] to ${childMeshes.length} meshes`
      );

      // Return the first mesh (or combine them if multiple)
      return success(childMeshes[0] ?? null);
    } catch (err) {
      return error({
        message: `Failed to apply translation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'TRANSLATE_FAILURE',
        nodeType: 'translate',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a rotate node to a mesh
   * @param node - Rotate AST node
   * @returns Rotated mesh
   */
  private async convertRotate(node: RotateNode): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length === 0) {
        return success(null);
      }

      // Convert child nodes first
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length === 0) {
        return success(null);
      }

      // Create transformation matrix
      const rotation = node.a || [0, 0, 0];
      const rotationArray = Array.isArray(rotation) ? rotation : [0, 0, rotation];

      // Ensure we have exactly 3 elements
      const normalizedRotation: readonly [number, number, number] = [
        rotationArray[0] ?? 0,
        rotationArray[1] ?? 0,
        rotationArray[2] ?? 0,
      ];

      const transformParams: TransformationParams = {
        rotation: normalizedRotation,
      };

      const matrixResult = TransformationMatrix.createFromParams(transformParams);
      if (!matrixResult.success) {
        return error({
          message: `Failed to create rotation matrix: ${matrixResult.error.message}`,
          code: 'ROTATION_MATRIX_FAILURE',
          nodeType: 'rotate',
          severity: 'error' as const,
        });
      }

      // Apply transformation to all child meshes
      for (const mesh of childMeshes) {
        const applyResult = TransformationMatrix.applyToMesh(mesh, matrixResult.data);
        if (!applyResult.success) {
          this.errors.push({
            message: `Failed to apply rotation to mesh: ${applyResult.error.message}`,
            code: 'MESH_ROTATION_FAILURE',
            nodeType: 'rotate',
            severity: 'warning' as const,
          });
        }
      }

      this.statistics.transformationsApplied++;
      this.logger.debug(
        `Applied rotation: [${rotationArray[0]}, ${rotationArray[1]}, ${rotationArray[2]}] degrees to ${childMeshes.length} meshes`
      );

      return success(childMeshes[0] || null);
    } catch (err) {
      return error({
        message: `Failed to apply rotation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'ROTATE_FAILURE',
        nodeType: 'rotate',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a scale node to a mesh
   * @param node - Scale AST node
   * @returns Scaled mesh
   */
  private async convertScale(node: ScaleNode): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length === 0) {
        return success(null);
      }

      // Convert child nodes first
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length === 0) {
        return success(null);
      }

      // Create transformation matrix
      const scale = node.v || [1, 1, 1];
      const scaleArray = Array.isArray(scale) ? scale : [scale, scale, scale];

      // Ensure we have exactly 3 elements
      const normalizedScale: readonly [number, number, number] = [
        scaleArray[0] ?? 1,
        scaleArray[1] ?? 1,
        scaleArray[2] ?? 1,
      ];

      const transformParams: TransformationParams = {
        scale: normalizedScale,
      };

      const matrixResult = TransformationMatrix.createFromParams(transformParams);
      if (!matrixResult.success) {
        return error({
          message: `Failed to create scale matrix: ${matrixResult.error.message}`,
          code: 'SCALE_MATRIX_FAILURE',
          nodeType: 'scale',
          severity: 'error' as const,
        });
      }

      // Apply transformation to all child meshes
      for (const mesh of childMeshes) {
        const applyResult = TransformationMatrix.applyToMesh(mesh, matrixResult.data);
        if (!applyResult.success) {
          this.errors.push({
            message: `Failed to apply scale to mesh: ${applyResult.error.message}`,
            code: 'MESH_SCALE_FAILURE',
            nodeType: 'scale',
            severity: 'warning' as const,
          });
        }
      }

      this.statistics.transformationsApplied++;
      this.logger.debug(
        `Applied scale: [${scaleArray[0]}, ${scaleArray[1]}, ${scaleArray[2]}] to ${childMeshes.length} meshes`
      );

      return success(childMeshes[0] || null);
    } catch (err) {
      return error({
        message: `Failed to apply scale: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'SCALE_FAILURE',
        nodeType: 'scale',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a mirror node to a mesh
   * @param node - Mirror AST node
   * @returns Mirrored mesh
   */
  private async convertMirror(node: MirrorNode): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length === 0) {
        return success(null);
      }

      // Convert child nodes first
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length === 0) {
        return success(null);
      }

      // Create transformation matrix
      const mirrorVector = node.v || [1, 0, 0]; // Default to X-axis mirror
      const transformParams: TransformationParams = {
        mirror: mirrorVector as readonly [number, number, number],
      };

      const matrixResult = TransformationMatrix.createFromParams(transformParams);
      if (!matrixResult.success) {
        return error({
          message: `Failed to create mirror matrix: ${matrixResult.error.message}`,
          code: 'MIRROR_MATRIX_FAILURE',
          nodeType: 'mirror',
          severity: 'error' as const,
        });
      }

      // Apply transformation to all child meshes
      for (const mesh of childMeshes) {
        const applyResult = TransformationMatrix.applyToMesh(mesh, matrixResult.data);
        if (!applyResult.success) {
          this.errors.push({
            message: `Failed to apply mirror to mesh: ${applyResult.error.message}`,
            code: 'MESH_MIRROR_FAILURE',
            nodeType: 'mirror',
            severity: 'warning' as const,
          });
        }
      }

      this.statistics.transformationsApplied++;
      this.logger.debug(
        `Applied mirror: [${mirrorVector[0]}, ${mirrorVector[1]}, ${mirrorVector[2]}] to ${childMeshes.length} meshes`
      );

      return success(childMeshes[0] ?? null);
    } catch (err) {
      return error({
        message: `Failed to apply mirror: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'MIRROR_FAILURE',
        nodeType: 'mirror',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Apply complex transformation with proper matrix composition
   * Handles nested transformations with correct order: scale → rotate → translate
   * @param mesh - Mesh to transform
   * @param transformations - Array of transformation parameters to compose
   * @returns Result indicating success or failure
   */
  private applyComplexTransformation(
    mesh: THREE.Mesh,
    transformations: TransformationParams[]
  ): Result<void, CSGError> {
    try {
      if (transformations.length === 0) {
        return success(undefined);
      }

      // Create individual transformation matrices
      const matrices: THREE.Matrix4[] = [];
      for (const transform of transformations) {
        const matrixResult = TransformationMatrix.createFromParams(transform);
        if (!matrixResult.success) {
          return error({
            message: `Failed to create transformation matrix: ${matrixResult.error.message}`,
            code: 'COMPLEX_TRANSFORMATION_FAILURE',
            nodeType: 'transformation',
            severity: 'error' as const,
          });
        }
        matrices.push(matrixResult.data);
      }

      // Compose all transformation matrices
      const composedMatrix = TransformationMatrix.compose(matrices);

      // Apply the composed transformation to the mesh
      const applyResult = TransformationMatrix.applyToMesh(mesh, composedMatrix);
      if (!applyResult.success) {
        return error({
          message: `Failed to apply composed transformation: ${applyResult.error.message}`,
          code: 'MESH_COMPLEX_TRANSFORMATION_FAILURE',
          nodeType: 'transformation',
          severity: 'error' as const,
        });
      }

      this.logger.debug(`Applied complex transformation with ${transformations.length} components`);
      return success(undefined);
    } catch (err) {
      return error({
        message: `Failed to apply complex transformation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'COMPLEX_TRANSFORMATION_ERROR',
        nodeType: 'transformation',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert a union node to a mesh using advanced CSG operations
   * @param node - Union AST node
   * @returns Combined mesh
   */
  private async convertUnion(node: UnionNode): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length === 0) {
        return success(null);
      }

      // Convert all child nodes
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length === 0) {
        return success(null);
      }

      if (childMeshes.length === 1) {
        return success(childMeshes[0] ?? null);
      }

      // Perform actual CSG union operation using the advanced CSG service
      const csgConfig = createCSGConfig('union', childMeshes, {
        maxComplexity: this.config.maxComplexity,
        enableOptimization: this.config.enableOptimization,
      });

      const csgResult = await performCSGOperation(csgConfig);

      if (!csgResult.success) {
        return error({
          message: `CSG union operation failed: ${csgResult.error}`,
          code: 'CSG_UNION_FAILURE',
          nodeType: 'union',
          severity: 'error' as const,
          location: node.location
            ? { line: node.location.start.line, column: node.location.start.column }
            : { line: 0, column: 0 },
        });
      }

      this.statistics.booleanOperations++;
      this.logger.debug(`Performed union operation on ${childMeshes.length} meshes`);

      // Add warning about CSG operation simplification
      this.warnings.push({
        message: 'CSG union operation was simplified for performance',
        code: 'CSG_OPERATION_SIMPLIFIED',
        nodeType: 'union',
        suggestion: 'Consider reducing mesh complexity for better performance',
      });

      return success(csgResult.data);
    } catch (err) {
      return error({
        message: `Failed to perform union: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'UNION_FAILURE',
        nodeType: 'union',
        severity: 'error' as const,
        location: node.location
          ? { line: node.location.start.line, column: node.location.start.column }
          : { line: 0, column: 0 },
      });
    }
  }

  /**
   * Convert a difference node to a mesh using advanced CSG operations
   * @param node - Difference AST node
   * @returns Subtracted mesh
   */
  private async convertDifference(
    node: DifferenceNode
  ): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length < 2) {
        this.warnings.push({
          message: 'Difference operation requires at least 2 children',
          code: 'INSUFFICIENT_CHILDREN',
          nodeType: 'difference',
          suggestion: 'Add more child objects to the difference operation',
        });
        return success(null);
      }

      // Convert all child nodes
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length < 2) {
        return success(childMeshes[0] ?? null);
      }

      // Perform actual CSG difference operation using the advanced CSG service
      const csgConfig = createCSGConfig('difference', childMeshes, {
        maxComplexity: this.config.maxComplexity,
        enableOptimization: this.config.enableOptimization,
      });

      const csgResult = await performCSGOperation(csgConfig);

      if (!csgResult.success) {
        return error({
          message: `CSG difference operation failed: ${csgResult.error}`,
          code: 'CSG_DIFFERENCE_FAILURE',
          nodeType: 'difference',
          severity: 'error' as const,
          location: node.location
            ? { line: node.location.start.line, column: node.location.start.column }
            : { line: 0, column: 0 },
        });
      }

      this.statistics.booleanOperations++;
      this.logger.debug(`Performed difference operation on ${childMeshes.length} meshes`);

      return success(csgResult.data);
    } catch (err) {
      return error({
        message: `Failed to perform difference: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'DIFFERENCE_FAILURE',
        nodeType: 'difference',
        severity: 'error' as const,
      });
    }
  }

  /**
   * Convert an intersection node to a mesh using advanced CSG operations
   * @param node - Intersection AST node
   * @returns Intersected mesh
   */
  private async convertIntersection(
    node: IntersectionNode
  ): Promise<Result<THREE.Mesh | null, CSGError>> {
    try {
      if (!node.children || node.children.length < 2) {
        this.warnings.push({
          message: 'Intersection operation requires at least 2 children',
          code: 'INSUFFICIENT_CHILDREN',
          nodeType: 'intersection',
          suggestion: 'Add more child objects to the intersection operation',
        });
        return success(null);
      }

      // Convert all child nodes
      const childMeshes: THREE.Mesh[] = [];
      for (const child of node.children) {
        const childResult = await this.convertNode(child);
        if (childResult.success && childResult.data) {
          childMeshes.push(childResult.data);
        } else if (!childResult.success) {
          this.errors.push(childResult.error);
        }
      }

      if (childMeshes.length < 2) {
        return success(childMeshes[0] ?? null);
      }

      // Perform actual CSG intersection operation using the advanced CSG service
      const csgConfig = createCSGConfig('intersection', childMeshes, {
        maxComplexity: this.config.maxComplexity,
        enableOptimization: this.config.enableOptimization,
      });

      const csgResult = await performCSGOperation(csgConfig);

      if (!csgResult.success) {
        return error({
          message: `CSG intersection operation failed: ${csgResult.error}`,
          code: 'CSG_INTERSECTION_FAILURE',
          nodeType: 'intersection',
          severity: 'error' as const,
          location: node.location
            ? { line: node.location.start.line, column: node.location.start.column }
            : { line: 0, column: 0 },
        });
      }

      this.statistics.booleanOperations++;
      this.logger.debug(`Performed intersection operation on ${childMeshes.length} meshes`);

      // Add warning about CSG operation simplification
      this.warnings.push({
        message: 'CSG intersection operation was simplified for performance',
        code: 'CSG_OPERATION_SIMPLIFIED',
        nodeType: 'intersection',
        suggestion: 'Consider reducing mesh complexity for better performance',
      });

      return success(csgResult.data);
    } catch (err) {
      return error({
        message: `Failed to perform intersection: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: 'INTERSECTION_FAILURE',
        nodeType: 'intersection',
        severity: 'error' as const,
        location: node.location
          ? { line: node.location.start.line, column: node.location.start.column }
          : { line: 0, column: 0 },
      });
    }
  }

  /**
   * Estimate memory usage of meshes
   * @param meshes - Array of meshes
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(meshes: THREE.Mesh[]): number {
    let totalMemory = 0;

    for (const mesh of meshes) {
      if (mesh.geometry) {
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        const normals = geometry.attributes.normal;
        const uvs = geometry.attributes.uv;

        totalMemory += positions ? positions.count * 3 * 4 : 0; // 3 floats per vertex
        totalMemory += normals ? normals.count * 3 * 4 : 0; // 3 floats per normal
        totalMemory += uvs ? uvs.count * 2 * 4 : 0; // 2 floats per UV
      }
    }

    return totalMemory;
  }
}
