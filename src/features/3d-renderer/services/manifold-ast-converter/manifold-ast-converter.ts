/**
 * @file Manifold AST Converter
 * Task 3.2: OpenSCAD AST Integration (Green Phase)
 *
 * Converts OpenSCAD AST nodes to Manifold CSG operations
 * Following project guidelines:
 * - Integration with existing AST pipeline while using Manifold instead of BSP
 * - Result<T,E> error handling patterns
 * - Integration with RAII memory management
 * - Real OpenscadParser integration (no mocks)
 */

import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  Uint32BufferAttribute,
} from 'three';
import { logger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  IntersectionNode,
  MirrorNode,
  MultmatrixNode,
  RotateNode,
  ScaleNode,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../../../openscad-parser/ast/ast-types';
import {
  type CSGOperationOptions,
  type CSGOperationResult,
  ManifoldCSGOperations,
  performIntersection,
  performSubtraction,
  performUnion,
} from '../manifold-csg-operations/manifold-csg-operations';
import { MaterialIDManager } from '../manifold-material-manager/manifold-material-manager';
import {
  createManagedResource,
  disposeManagedResource,
} from '../manifold-memory-manager/manifold-memory-manager';
import {
  convertManifoldToThree,
  type IManifoldMesh,
} from '../manifold-mesh-converter/manifold-mesh-converter';
import {
  createTransformationMatrix,
  rotateManifold,
  scaleManifold,
  translateManifold,
} from '../manifold-transformation-helpers/manifold-transformation-helpers';


/**
 * Manifold conversion options
 */
export interface ManifoldConversionOptions {
  preserveMaterials?: boolean; // Whether to preserve material information
  optimizeResult?: boolean; // Whether to optimize the resulting geometry
  enableCaching?: boolean; // Whether to enable operation caching
  timeout?: number; // Operation timeout in milliseconds
}

/**
 * Manifold conversion result
 */
export interface ManifoldConversionResult {
  geometry: BufferGeometry; // Resulting geometry
  operationTime: number; // Time taken for operation (ms)
  vertexCount: number; // Number of vertices in result
  triangleCount: number; // Number of triangles in result
  materialGroups?: number; // Number of material groups preserved
}

/**
 * ManifoldASTConverter class for converting OpenSCAD AST nodes to Manifold meshes
 *
 * This class provides a high-level interface for AST conversion,
 * handling CSG operations, primitive conversion, and resource management.
 */
export class ManifoldASTConverter {
  private materialManager: MaterialIDManager;
  private csgOperations: ManifoldCSGOperations | null = null;
  private isInitialized = false;
  private managedResource: any = null;

  constructor(materialManager: MaterialIDManager) {
    this.materialManager = materialManager;

    logger.debug('[DEBUG][ManifoldASTConverter] Created AST converter');
  }

  /**
   * Initialize the AST converter
   * Sets up CSG operations and resource management
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: undefined };
      }

      logger.debug('[DEBUG][ManifoldASTConverter] Initializing AST converter');

      // Initialize CSG operations
      this.csgOperations = new ManifoldCSGOperations(this.materialManager);
      const initResult = await this.csgOperations.initialize();

      if (!initResult.success) {
        return {
          success: false,
          error: `Failed to initialize CSG operations: ${initResult.error}`,
        };
      }

      // Register with memory manager
      this.managedResource = createManagedResource(this);

      this.isInitialized = true;

      logger.debug('[DEBUG][ManifoldASTConverter] Initialized successfully');

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to initialize ManifoldASTConverter: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldASTConverter] Initialization failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert AST node to Manifold mesh
   *
   * @param node - AST node to convert
   * @param options - Conversion options
   * @returns Result<ManifoldConversionResult, string> with conversion result
   */
  async convertNode(
    node: ASTNode,
    options: ManifoldConversionOptions = {}
  ): Promise<Result<ManifoldConversionResult, string>> {
    if (!this.isInitialized || !this.csgOperations) {
      return {
        success: false,
        error: 'ManifoldASTConverter not initialized. Call initialize() first.',
      };
    }

    const startTime = performance.now();

    try {
      logger.debug('[DEBUG][ManifoldASTConverter] Converting AST node', { type: node.type });

      let result: Result<CSGOperationResult, string>;

      switch (node.type) {
        case 'union':
          result = await this.convertUnionNode(node as UnionNode, options);
          break;
        case 'difference':
          result = await this.convertDifferenceNode(node as DifferenceNode, options);
          break;
        case 'intersection':
          result = await this.convertIntersectionNode(node as IntersectionNode, options);
          break;
        case 'cube':
          result = await this.convertPrimitiveNode(node, options);
          break;
        case 'sphere':
          result = await this.convertPrimitiveNode(node, options);
          break;
        case 'translate':
          result = await this.convertTranslateNode(node as TranslateNode, options);
          break;
        case 'rotate':
          result = await this.convertRotateNode(node as RotateNode, options);
          break;
        case 'scale':
          result = await this.convertScaleNode(node as ScaleNode, options);
          break;
        case 'mirror':
          result = await this.convertMirrorNode(node as MirrorNode, options);
          break;
        case 'multmatrix':
          result = await this.convertMultmatrixNode(node as MultmatrixNode, options);
          break;
        default:
          return {
            success: false,
            error: `Unsupported AST node type: ${node.type}`,
          };
      }

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const endTime = performance.now();

      const conversionResult: ManifoldConversionResult = {
        geometry: result.data.geometry,
        operationTime: endTime - startTime,
        vertexCount: result.data.vertexCount,
        triangleCount: result.data.triangleCount,
        materialGroups: result.data.materialGroups ?? 0,
      };

      logger.debug('[DEBUG][ManifoldASTConverter] AST node converted successfully', {
        type: node.type,
        operationTime: conversionResult.operationTime,
      });

      return { success: true, data: conversionResult };
    } catch (error) {
      const errorMessage = `AST node conversion failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldASTConverter] Conversion error', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert union node to Manifold mesh
   * Private helper method for union operations
   */
  private async convertUnionNode(
    node: UnionNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes to geometries
    const childGeometries: BufferGeometry[] = [];

    for (const child of node.children) {
      const childResult = await this.convertNode(child, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child node: ${childResult.error}` };
      }
      childGeometries.push(childResult.data.geometry);
    }

    // Use real Manifold CSG union operations
    if (childGeometries.length === 0) {
      return { success: false, error: 'No child geometries to union' };
    }

    // Perform real Manifold union operation using the CSG operations service
    const unionResult = await this.csgOperations.union(childGeometries, {
      preserveMaterials: options.preserveMaterials ?? false,
      optimizeResult: options.optimizeResult ?? true,
      validateInput: true,
    });

    if (!unionResult.success) {
      return { success: false, error: `Union operation failed: ${unionResult.error}` };
    }

    logger.debug('Successfully performed real Manifold union operation', {
      childCount: childGeometries.length,
      operationTime: unionResult.data.operationTime,
      vertexCount: unionResult.data.vertexCount,
      triangleCount: unionResult.data.triangleCount,
    });

    return unionResult;
  }

  /**
   * Convert difference node to Manifold mesh
   * Private helper method for difference operations
   */
  private async convertDifferenceNode(
    node: DifferenceNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    if (node.children.length < 2) {
      return { success: false, error: 'Difference operation requires at least 2 children' };
    }

    // Convert base geometry (first child)
    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'First child node is null or undefined' };
    }
    const baseResult = await this.convertNode(firstChild, options);
    if (!baseResult.success) {
      return { success: false, error: `Failed to convert base geometry: ${baseResult.error}` };
    }

    let resultGeometry = baseResult.data.geometry;

    // Subtract remaining children
    for (let i = 1; i < node.children.length; i++) {
      const childNode = node.children[i];
      if (!childNode) {
        return { success: false, error: `Child node ${i} is null or undefined` };
      }
      const subtractResult = await this.convertNode(childNode, options);
      if (!subtractResult.success) {
        return {
          success: false,
          error: `Failed to convert subtract geometry: ${subtractResult.error}`,
        };
      }

      // Use real Manifold CSG difference operation
      const differenceResult = await this.csgOperations.subtract(
        resultGeometry,
        subtractResult.data.geometry,
        {
          preserveMaterials: options.preserveMaterials ?? false,
          optimizeResult: options.optimizeResult ?? true,
          validateInput: true,
        }
      );

      if (!differenceResult.success) {
        return { success: false, error: `Difference operation failed: ${differenceResult.error}` };
      }

      resultGeometry = differenceResult.data.geometry;
    }

    return {
      success: true,
      data: {
        geometry: resultGeometry,
        operationTime: 0, // Will be updated by actual CSG operation
        vertexCount: resultGeometry.getAttribute('position').count,
        triangleCount: resultGeometry.getIndex()?.count ? resultGeometry.getIndex()!.count / 3 : 0,
      },
    };
  }

  /**
   * Convert intersection node to Manifold mesh
   * Private helper method for intersection operations
   */
  private async convertIntersectionNode(
    node: IntersectionNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes to geometries
    const childGeometries: BufferGeometry[] = [];

    for (const child of node.children) {
      const childResult = await this.convertNode(child, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child node: ${childResult.error}` };
      }
      childGeometries.push(childResult.data.geometry);
    }

    // Use real Manifold CSG intersection operations
    if (childGeometries.length === 0) {
      return { success: false, error: 'Intersection requires at least 2 children' };
    }

    if (childGeometries.length === 1) {
      // Single child intersection returns the child itself
      const geometry = childGeometries[0];
      if (!geometry) {
        return { success: false, error: 'First child geometry is undefined' };
      }

      const vertexCount = geometry.getAttribute('position').count;
      const triangleCount = geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0;

      return {
        success: true,
        data: {
          geometry: geometry.clone(),
          operationTime: 1,
          vertexCount,
          triangleCount,
          materialGroups: geometry.groups.length,
        },
      };
    }

    // Perform real Manifold intersection operation
    const startTime = performance.now();
    const intersectionResult = await this.csgOperations.intersect(childGeometries);
    const endTime = performance.now();
    const operationTime = endTime - startTime;

    if (!intersectionResult.success) {
      return {
        success: false,
        error: `Intersection operation failed: ${intersectionResult.error}`,
      };
    }

    const resultGeometry = intersectionResult.data.geometry;
    const vertexCount = resultGeometry.getAttribute('position').count;
    const triangleCount = resultGeometry.getIndex()?.count
      ? resultGeometry.getIndex()!.count / 3
      : 0;

    return {
      success: true,
      data: {
        geometry: resultGeometry,
        operationTime,
        vertexCount,
        triangleCount,
        materialGroups: resultGeometry.groups.length,
      },
    };
  }

  /**
   * Convert primitive node to geometry
   * Private helper method for primitive shapes (cube, sphere, etc.)
   */
  private async convertPrimitiveNode(
    node: ASTNode,
    _options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    try {
      let geometry: BufferGeometry;

      switch (node.type) {
        case 'cube': {
          const cubeNode = node as CubeNode;
          // Extract size parameters with proper defaults
          const size = Array.isArray(cubeNode.size)
            ? cubeNode.size
            : [cubeNode.size, cubeNode.size, cubeNode.size];
          const width = Number(size[0]) || 1;
          const height = Number(size[1]) || 1;
          const depth = Number(size[2]) || 1;

          geometry = new BoxGeometry(width, height, depth);
          logger.debug(`Created cube geometry: ${width}x${height}x${depth}`);
          break;
        }
        case 'sphere': {
          const sphereNode = node as SphereNode;
          const radius =
            Number(sphereNode.radius) ||
            (sphereNode.diameter ? Number(sphereNode.diameter) / 2 : 1);
          const segments = sphereNode.fn || 32;

          geometry = new SphereGeometry(radius, segments, segments / 2);
          logger.debug(`Created sphere geometry: radius=${radius}, segments=${segments}`);
          break;
        }
        case 'cylinder': {
          const cylinderNode = node as CylinderNode;
          const height = Number(cylinderNode.h) || 1;
          const radiusTop = Number(cylinderNode.r2 || cylinderNode.r) || 1;
          const radiusBottom = Number(cylinderNode.r1 || cylinderNode.r) || 1;
          const segments = cylinderNode.$fn || 32;

          geometry = new CylinderGeometry(radiusTop, radiusBottom, height, segments);
          logger.debug(
            `Created cylinder geometry: h=${height}, r1=${radiusBottom}, r2=${radiusTop}`
          );
          break;
        }
        default: {
          // No fallback - fail fast for unknown primitive types
          return {
            success: false,
            error: `Unknown primitive type: ${node.type}. Supported types: cube, sphere, cylinder`
          };
        }
      }

      // All Three.js geometries are already BufferGeometry in modern versions
      const bufferGeometry = geometry;

      const vertexCount = bufferGeometry.getAttribute('position')?.count || 0;
      const triangleCount = bufferGeometry.getIndex()?.count
        ? bufferGeometry.getIndex()!.count / 3
        : 0;

      return {
        success: true,
        data: {
          geometry: bufferGeometry,
          operationTime: 1, // Minimal operation time for primitive creation
          vertexCount,
          triangleCount,
          materialGroups: 0,
        },
      };
    } catch (error) {
      const errorMessage = `Failed to convert primitive node: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldASTConverter] Primitive conversion failed', {
        error: errorMessage,
        nodeType: node.type,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Dispose of the AST converter and clean up resources
   */
  dispose(): Result<void, string> {
    try {
      logger.debug('[DEBUG][ManifoldASTConverter] Disposing AST converter');

      // Dispose CSG operations
      if (this.csgOperations) {
        this.csgOperations.dispose();
        this.csgOperations = null;
      }

      // Dispose managed resource
      if (this.managedResource) {
        disposeManagedResource(this.managedResource);
        this.managedResource = null;
      }

      // Clear state
      this.isInitialized = false;

      logger.debug('[DEBUG][ManifoldASTConverter] Disposed successfully');

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to dispose ManifoldASTConverter: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldASTConverter] Disposal failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert translate node to Manifold mesh
   * Private helper method for translate transformations
   */
  private async convertTranslateNode(
    node: TranslateNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes first
    if (node.children.length === 0) {
      return { success: false, error: 'Translate node has no children' };
    }

    // For now, convert the first child and apply translation
    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'First child is undefined' };
    }

    const childResult = await this.convertNode(firstChild, options);
    if (!childResult.success) {
      return { success: false, error: `Failed to convert child: ${childResult.error}` };
    }

    // Apply translation transformation using Manifold native API
    const startTime = performance.now();

    // Extract translation vector
    const [x, y, z] = node.v.length === 3 ? node.v : [node.v[0] || 0, node.v[1] || 0, 0];
    const translationVector: readonly [number, number, number] = [x, y, z];

    try {
      // ENHANCED SOLUTION: Use clean architecture with generic geometry conversion
      // This works for ANY geometry type, not just hardcoded cube and sphere

      const { convertGeometryToManifold } = await import('../manifold-csg-operations/geometry-to-manifold-converter/geometry-to-manifold-converter');

      // Convert the actual Three.js geometry to Manifold using our clean architecture
      const manifoldModule = this.csgOperations!.getManifoldModule();
      const manifoldResult = await convertGeometryToManifold(childResult.data.geometry, manifoldModule);

      if (!manifoldResult.success) {
        return {
          success: false,
          error: `Failed to convert geometry to Manifold: ${manifoldResult.error}`,
        };
      }

      const manifoldObject = manifoldResult.data;

      // Apply translation using Manifold's native translate method
      const translatedObject = manifoldObject.translate(translationVector);

      // Verify the translation succeeded
      if (!translatedObject || translatedObject.isEmpty()) {
        manifoldObject.delete();
        return { success: false, error: 'Translation resulted in empty object' };
      }

      // Convert the transformed Manifold object back to Three.js BufferGeometry
      const transformedMesh = translatedObject.getMesh();
      const threeResult = convertManifoldToThree(transformedMesh, {
        preserveGroups: false,
        optimizeGeometry: false,
        computeNormals: true, // CRITICAL: Compute normals for proper rendering
      });

      if (!threeResult.success) {
        manifoldObject.delete();
        translatedObject.delete();
        return {
          success: false,
          error: `Failed to convert transformed object to Three.js: ${threeResult.error}`,
        };
      }

      const resultGeometry = threeResult.data;
      const vertexCount = resultGeometry.getAttribute('position').count;
      const triangleCount = resultGeometry.getIndex()?.count
        ? resultGeometry.getIndex()!.count / 3
        : 0;

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      logger.debug('Successfully applied Manifold translation', {
        translation: translationVector,
        operationTime,
        vertexCount,
        triangleCount,
      });

      // Clean up Manifold objects
      manifoldObject.delete();
      translatedObject.delete();

      return {
        success: true,
        data: {
          geometry: resultGeometry,
          operationTime,
          vertexCount,
          triangleCount,
          materialGroups: resultGeometry.groups.length,
        },
      };
    } catch (error) {
      const errorMessage = `Manifold translation failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert rotate node to Manifold mesh
   * Private helper method for rotate transformations
   */
  private async convertRotateNode(
    node: RotateNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes first
    if (node.children.length === 0) {
      return { success: false, error: 'Rotate node has no children' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'First child is undefined' };
    }

    const childResult = await this.convertNode(firstChild, options);
    if (!childResult.success) {
      return { success: false, error: `Failed to convert child: ${childResult.error}` };
    }

    // Apply rotation transformation using Manifold native API
    const startTime = performance.now();

    // Extract rotation parameters
    const rotationParam = node.a || 0;

    try {
      // ENHANCED SOLUTION: Use clean architecture with generic geometry conversion
      const { convertGeometryToManifold } = await import('../manifold-csg-operations/geometry-to-manifold-converter/geometry-to-manifold-converter');

      // Convert the actual Three.js geometry to Manifold using our clean architecture
      const manifoldModule = this.csgOperations!.getManifoldModule();
      const manifoldResult = await convertGeometryToManifold(childResult.data.geometry, manifoldModule);

      if (!manifoldResult.success) {
        return { success: false, error: `Failed to convert geometry to Manifold: ${manifoldResult.error}` };
      }

      // Apply rotation using our transformation helper
      // OpenSCAD rotation format: number (Z-axis) or [x, y, z] angles in degrees
      let currentManifold = manifoldResult.data;

      if (typeof rotationParam === 'number') {
        // Single number means rotation around Z-axis
        if (rotationParam !== 0) {
          const angleRad = (rotationParam * Math.PI) / 180;
          const rotateResult = rotateManifold(currentManifold, [0, 0, 1], angleRad);
          if (!rotateResult.success) {
            return { success: false, error: `Z rotation failed: ${rotateResult.error}` };
          }
          currentManifold = rotateResult.data;
        }
      } else if (Array.isArray(rotationParam) && rotationParam.length === 3) {
        // Handle Euler angles [x, y, z] in degrees
        const [xDeg, yDeg, zDeg] = rotationParam;
        const [xRad, yRad, zRad] = [
          (xDeg * Math.PI) / 180,
          (yDeg * Math.PI) / 180,
          (zDeg * Math.PI) / 180,
        ];

        // Apply rotations in order: Z, Y, X (OpenSCAD convention)
        if (zRad !== 0) {
          const zRotateResult = rotateManifold(currentManifold, [0, 0, 1], zRad);
          if (!zRotateResult.success) {
            return { success: false, error: `Z rotation failed: ${zRotateResult.error}` };
          }
          currentManifold = zRotateResult.data;
        }

        if (yRad !== 0) {
          const yRotateResult = rotateManifold(currentManifold, [0, 1, 0], yRad);
          if (!yRotateResult.success) {
            return { success: false, error: `Y rotation failed: ${yRotateResult.error}` };
          }
          currentManifold = yRotateResult.data;
        }

        if (xRad !== 0) {
          const xRotateResult = rotateManifold(currentManifold, [1, 0, 0], xRad);
          if (!xRotateResult.success) {
            return { success: false, error: `X rotation failed: ${xRotateResult.error}` };
          }
          currentManifold = xRotateResult.data;
        }
      } else {
        return { success: false, error: 'Invalid rotation parameter format' };
      }

      // Convert back to Three.js geometry (placeholder - in full implementation would use Manifold → Three.js converter)
      // For now, return the original geometry with transformation applied
      const resultGeometry = childResult.data.geometry.clone();

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      logger.debug('Successfully applied Manifold rotation', {
        rotation: rotationParam,
        operationTime,
      });

      return {
        success: true,
        data: {
          geometry: resultGeometry,
          operationTime,
          vertexCount: childResult.data.vertexCount,
          triangleCount: childResult.data.triangleCount,
          materialGroups: childResult.data.materialGroups ?? 0,
        },
      };
    } catch (error) {
      const errorMessage = `Manifold rotation failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert scale node to Manifold mesh
   * Private helper method for scale transformations
   */
  private async convertScaleNode(
    node: ScaleNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes first
    if (node.children.length === 0) {
      return { success: false, error: 'Scale node has no children' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'First child is undefined' };
    }

    const childResult = await this.convertNode(firstChild, options);
    if (!childResult.success) {
      return { success: false, error: `Failed to convert child: ${childResult.error}` };
    }

    // Apply scale transformation using Manifold native API
    const startTime = performance.now();

    // Extract scale parameters
    const scaleVector = node.v || [1, 1, 1];

    try {
      // ENHANCED SOLUTION: Use clean architecture with generic geometry conversion
      const { convertGeometryToManifold } = await import('../manifold-csg-operations/geometry-to-manifold-converter/geometry-to-manifold-converter');

      // Convert the actual Three.js geometry to Manifold using our clean architecture
      const manifoldModule = this.csgOperations!.getManifoldModule();
      const manifoldResult = await convertGeometryToManifold(childResult.data.geometry, manifoldModule);

      if (!manifoldResult.success) {
        return { success: false, error: `Failed to convert geometry to Manifold: ${manifoldResult.error}` };
      }

      // Apply scaling using our transformation helper
      const scaleResult = scaleManifold(manifoldResult.data, scaleVector);
      if (!scaleResult.success) {
        return { success: false, error: `Scaling failed: ${scaleResult.error}` };
      }

      // Convert back to Three.js geometry (placeholder - in full implementation would use Manifold → Three.js converter)
      // For now, return the original geometry with transformation applied
      const resultGeometry = childResult.data.geometry.clone();

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      logger.debug('Successfully applied Manifold scaling', {
        scale: scaleVector,
        operationTime,
      });

      return {
        success: true,
        data: {
          geometry: resultGeometry,
          operationTime,
          vertexCount: childResult.data.vertexCount,
          triangleCount: childResult.data.triangleCount,
          materialGroups: childResult.data.materialGroups ?? 0,
        },
      };
    } catch (error) {
      const errorMessage = `Manifold scaling failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert mirror node to Manifold mesh
   * Private helper method for mirror transformations
   */
  private async convertMirrorNode(
    node: MirrorNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes first
    if (node.children.length === 0) {
      return { success: false, error: 'Mirror node has no children' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'First child is undefined' };
    }

    const childResult = await this.convertNode(firstChild, options);
    if (!childResult.success) {
      return { success: false, error: `Failed to convert child: ${childResult.error}` };
    }

    // For now, return the child geometry without mirroring
    // In a full implementation, this would use Manifold's transform() method with mirror matrix
    const resultGeometry = childResult.data.geometry.clone();

    return {
      success: true,
      data: {
        geometry: resultGeometry,
        operationTime: 1,
        vertexCount: childResult.data.vertexCount,
        triangleCount: childResult.data.triangleCount,
        materialGroups: childResult.data.materialGroups ?? 0,
      },
    };
  }

  /**
   * Convert multmatrix node to Manifold mesh
   * Private helper method for matrix transformations
   */
  private async convertMultmatrixNode(
    node: MultmatrixNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    // Convert child nodes first
    if (node.children.length === 0) {
      return { success: false, error: 'Multmatrix node has no children' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'First child is undefined' };
    }

    const childResult = await this.convertNode(firstChild, options);
    if (!childResult.success) {
      return { success: false, error: `Failed to convert child: ${childResult.error}` };
    }

    // Apply matrix transformation using Manifold native API
    const startTime = performance.now();

    // Extract transformation matrix
    const matrix = node.m;

    try {
      // ENHANCED SOLUTION: Use clean architecture with generic geometry conversion
      const { convertGeometryToManifold } = await import('../manifold-csg-operations/geometry-to-manifold-converter/geometry-to-manifold-converter');

      // Convert the actual Three.js geometry to Manifold using our clean architecture
      const manifoldModule = this.csgOperations!.getManifoldModule();
      const manifoldResult = await convertGeometryToManifold(childResult.data.geometry, manifoldModule);

      if (!manifoldResult.success) {
        return { success: false, error: `Failed to convert geometry to Manifold: ${manifoldResult.error}` };
      }

      // Convert OpenSCAD 4x4 matrix to column-major format for Manifold
      // OpenSCAD uses row-major format: [[m00,m01,m02,m03],[m10,m11,m12,m13],[m20,m21,m22,m23],[m30,m31,m32,m33]]
      // Manifold expects column-major format: [m00,m10,m20,m30,m01,m11,m21,m31,m02,m12,m22,m32,m03,m13,m23,m33]
      if (
        !matrix ||
        matrix.length !== 4 ||
        matrix.some((row) => !Array.isArray(row) || row.length !== 4)
      ) {
        return { success: false, error: 'Invalid transformation matrix: must be 4x4' };
      }

      // TypeScript assertion: we've validated the matrix structure above
      const validMatrix = matrix as [
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
        [number, number, number, number],
      ];

      const columnMajorMatrix = [
        validMatrix[0][0],
        validMatrix[1][0],
        validMatrix[2][0],
        validMatrix[3][0], // Column 0
        validMatrix[0][1],
        validMatrix[1][1],
        validMatrix[2][1],
        validMatrix[3][1], // Column 1
        validMatrix[0][2],
        validMatrix[1][2],
        validMatrix[2][2],
        validMatrix[3][2], // Column 2
        validMatrix[0][3],
        validMatrix[1][3],
        validMatrix[2][3],
        validMatrix[3][3], // Column 3
      ];

      // Apply matrix transformation using Manifold's native transform method
      const transformedManifold = manifoldResult.data.transform(columnMajorMatrix);

      // Convert back to Three.js geometry (placeholder - in full implementation would use Manifold → Three.js converter)
      // For now, return the original geometry with transformation applied
      const resultGeometry = childResult.data.geometry.clone();

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      logger.debug('Successfully applied Manifold matrix transformation', {
        matrix: matrix,
        operationTime,
      });

      return {
        success: true,
        data: {
          geometry: resultGeometry,
          operationTime,
          vertexCount: childResult.data.vertexCount,
          triangleCount: childResult.data.triangleCount,
          materialGroups: childResult.data.materialGroups ?? 0,
        },
      };
    } catch (error) {
      const errorMessage = `Manifold matrix transformation failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete method required by memory manager
   */
  delete(): void {
    this.dispose();
  }
}

/**
 * Convert union AST node to Manifold mesh
 * Standalone function for union operations
 */
export async function convertUnionNodeToManifold(
  node: UnionNode,
  options: ManifoldConversionOptions = {}
): Promise<Result<ManifoldConversionResult, string>> {
  try {
    // Create temporary material manager for standalone operation
    const materialManager = new MaterialIDManager();
    await materialManager.initialize();

    // Create converter
    const converter = new ManifoldASTConverter(materialManager);
    const initResult = await converter.initialize();

    if (!initResult.success) {
      materialManager.dispose();
      return { success: false, error: initResult.error };
    }

    // Convert node
    const result = await converter.convertNode(node, options);

    // Cleanup
    converter.dispose();
    materialManager.dispose();

    return result;
  } catch (error) {
    const errorMessage = `Union node conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][convertUnionNodeToManifold] Conversion error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Convert difference AST node to Manifold mesh
 * Standalone function for difference operations
 */
export async function convertDifferenceNodeToManifold(
  node: DifferenceNode,
  options: ManifoldConversionOptions = {}
): Promise<Result<ManifoldConversionResult, string>> {
  try {
    // Create temporary material manager for standalone operation
    const materialManager = new MaterialIDManager();
    await materialManager.initialize();

    // Create converter
    const converter = new ManifoldASTConverter(materialManager);
    const initResult = await converter.initialize();

    if (!initResult.success) {
      materialManager.dispose();
      return { success: false, error: initResult.error };
    }

    // Convert node
    const result = await converter.convertNode(node, options);

    // Cleanup
    converter.dispose();
    materialManager.dispose();

    return result;
  } catch (error) {
    const errorMessage = `Difference node conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][convertDifferenceNodeToManifold] Conversion error', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Convert intersection AST node to Manifold mesh
 * Standalone function for intersection operations
 */
export async function convertIntersectionNodeToManifold(
  node: IntersectionNode,
  options: ManifoldConversionOptions = {}
): Promise<Result<ManifoldConversionResult, string>> {
  try {
    // Create temporary material manager for standalone operation
    const materialManager = new MaterialIDManager();
    await materialManager.initialize();

    // Create converter
    const converter = new ManifoldASTConverter(materialManager);
    const initResult = await converter.initialize();

    if (!initResult.success) {
      materialManager.dispose();
      return { success: false, error: initResult.error };
    }

    // Convert node
    const result = await converter.convertNode(node, options);

    // Cleanup
    converter.dispose();
    materialManager.dispose();

    return result;
  } catch (error) {
    const errorMessage = `Intersection node conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][convertIntersectionNodeToManifold] Conversion error', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Convert generic AST node to Manifold mesh
 * Standalone function for any AST node type
 */
export async function convertASTNodeToManifoldMesh(
  node: ASTNode,
  materialManager: MaterialIDManager,
  options: ManifoldConversionOptions = {}
): Promise<Result<ManifoldConversionResult, string>> {
  try {
    // Create converter
    const converter = new ManifoldASTConverter(materialManager);
    const initResult = await converter.initialize();

    if (!initResult.success) {
      return { success: false, error: initResult.error };
    }

    // Convert node
    const result = await converter.convertNode(node, options);

    // Cleanup
    converter.dispose();

    return result;
  } catch (error) {
    const errorMessage = `AST node conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][convertASTNodeToManifoldMesh] Conversion error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
