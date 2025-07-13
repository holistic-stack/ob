/**
 * @file Manifold AST Converter (Moved to Conversion Layer)
 * 
 * Converts OpenSCAD AST nodes to Manifold CSG operations.
 * This file has been moved from 3d-renderer to ast-to-csg-converter
 * to achieve proper architectural separation of concerns.
 * 
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
import { createLogger } from '../../../../shared/services/logger.service';

const logger = createLogger('ManifoldASTConverter');
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
// Import Manifold services (still in 3d-renderer until moved to conversion layer)
import {
  type CSGOperationOptions,
  type CSGOperationResult,
  ManifoldCSGOperations,
} from '../../../3d-renderer/services/manifold-csg-operations/manifold-csg-operations';
import { MaterialIDManager } from '../../../3d-renderer/services/manifold-material-manager/manifold-material-manager';

/**
 * Conversion options for Manifold AST conversion
 */
export interface ManifoldConversionOptions {
  readonly preserveMaterials?: boolean;
  readonly optimizeResult?: boolean;
  readonly timeout?: number;
}

/**
 * Result of Manifold AST conversion
 */
export interface ManifoldConversionResult {
  readonly geometry: BufferGeometry;
  readonly operationTime: number;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly materialGroups?: number;
}

/**
 * Manifold AST Converter Class
 * 
 * Converts OpenSCAD AST nodes to Three.js BufferGeometry using Manifold CSG operations.
 * This converter is now properly located in the conversion layer, separate from rendering.
 */
export class ManifoldASTConverter {
  private isInitialized = false;
  private csgOperations: ManifoldCSGOperations | null = null;
  private materialManager: MaterialIDManager;

  constructor(materialManager: MaterialIDManager) {
    this.materialManager = materialManager;
  }

  /**
   * Initialize the converter
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: undefined };
      }

      logger.debug('[INIT][ManifoldASTConverter] Initializing converter');

      // Initialize CSG operations
      this.csgOperations = new ManifoldCSGOperations(this.materialManager);
      const initResult = await this.csgOperations.initialize();

      if (!initResult.success) {
        return { success: false, error: `Failed to initialize CSG operations: ${initResult.error}` };
      }

      this.isInitialized = true;
      logger.debug('[INIT][ManifoldASTConverter] Converter initialized successfully');

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `ManifoldASTConverter initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      };
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

      // Convert based on node type
      switch (node.type) {
        case 'cube':
          result = await this.convertCubeNode(node as CubeNode, options);
          break;
        case 'sphere':
          result = await this.convertSphereNode(node as SphereNode, options);
          break;
        case 'cylinder':
          result = await this.convertCylinderNode(node as CylinderNode, options);
          break;
        case 'union':
          result = await this.convertUnionNode(node as UnionNode, options);
          break;
        case 'difference':
          result = await this.convertDifferenceNode(node as DifferenceNode, options);
          break;
        case 'intersection':
          result = await this.convertIntersectionNode(node as IntersectionNode, options);
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

      logger.debug('[DEBUG][ManifoldASTConverter] Conversion completed', {
        type: node.type,
        operationTime: conversionResult.operationTime,
        vertexCount: conversionResult.vertexCount,
      });

      return { success: true, data: conversionResult };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert ${node.type} node: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert cube node to BufferGeometry
   */
  private async convertCubeNode(
    node: CubeNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    try {
      // Extract cube parameters
      const size = Array.isArray(node.size) ? node.size : [node.size, node.size, node.size];
      const [width, height, depth] = size.length === 3 ? size : [size[0], size[0], size[0]];

      // Create Three.js box geometry
      const geometry = new BoxGeometry(width, height, depth);

      // Center the geometry if needed
      if (node.center) {
        // Geometry is already centered by default in Three.js
      } else {
        // Translate to position corner at origin
        geometry.translate(width / 2, height / 2, depth / 2);
      }

      const result: CSGOperationResult = {
        geometry,
        operationTime: 0,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert cube node: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert sphere node to BufferGeometry
   */
  private async convertSphereNode(
    node: SphereNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    try {
      // Extract sphere parameters
      const radius = node.radius || node.r || 1;
      const segments = 32; // Default segments for good quality

      // Create Three.js sphere geometry
      const geometry = new SphereGeometry(radius, segments, segments);

      const result: CSGOperationResult = {
        geometry,
        operationTime: 0,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert sphere node: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert cylinder node to BufferGeometry
   */
  private async convertCylinderNode(
    node: CylinderNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    try {
      // Extract cylinder parameters
      const height = node.h || 1;
      const radius1 = node.r1 || node.r || 1;
      const radius2 = node.r2 || node.r || radius1;
      const segments = 32; // Default segments

      // Create Three.js cylinder geometry
      const geometry = new CylinderGeometry(radius2, radius1, height, segments);

      // Center the geometry if needed
      if (node.center) {
        // Geometry is already centered by default in Three.js
      } else {
        // Translate to position bottom at origin
        geometry.translate(0, height / 2, 0);
      }

      const result: CSGOperationResult = {
        geometry,
        operationTime: 0,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert cylinder node: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert union node to BufferGeometry
   */
  private async convertUnionNode(
    node: UnionNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    if (node.children.length === 0) {
      return { success: false, error: 'Union operation requires at least 1 child' };
    }

    try {
      // Convert all children to geometries
      const childGeometries: BufferGeometry[] = [];

      for (const child of node.children) {
        const childResult = await this.convertNode(child, options);
        if (!childResult.success) {
          return { success: false, error: `Failed to convert union child: ${childResult.error}` };
        }
        childGeometries.push(childResult.data.geometry);
      }

      // Perform union operation
      const unionResult = await this.csgOperations.union(childGeometries, {
        preserveMaterials: options.preserveMaterials ?? false,
        optimizeResult: options.optimizeResult ?? true,
        validateInput: true,
      });

      if (!unionResult.success) {
        return { success: false, error: `Union operation failed: ${unionResult.error}` };
      }

      return { success: true, data: unionResult.data };
    } catch (error) {
      return {
        success: false,
        error: `Union operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert difference node to BufferGeometry
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

    try {
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
          return { success: false, error: `Failed to convert subtract geometry: ${subtractResult.error}` };
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

      const result: CSGOperationResult = {
        geometry: resultGeometry,
        operationTime: 0, // Will be updated by actual CSG operation
        vertexCount: resultGeometry.getAttribute('position').count,
        triangleCount: resultGeometry.getIndex()?.count ? resultGeometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Difference operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert intersection node to BufferGeometry
   */
  private async convertIntersectionNode(
    node: IntersectionNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.csgOperations) {
      return { success: false, error: 'CSG operations not initialized' };
    }

    if (node.children.length < 2) {
      return { success: false, error: 'Intersection operation requires at least 2 children' };
    }

    try {
      // Convert all children to geometries
      const childGeometries: BufferGeometry[] = [];

      for (const child of node.children) {
        const childResult = await this.convertNode(child, options);
        if (!childResult.success) {
          return { success: false, error: `Failed to convert intersection child: ${childResult.error}` };
        }
        childGeometries.push(childResult.data.geometry);
      }

      // Perform intersection operation
      const intersectionResult = await this.csgOperations.intersect(childGeometries, {
        preserveMaterials: options.preserveMaterials ?? false,
        optimizeResult: options.optimizeResult ?? true,
        validateInput: true,
      });

      if (!intersectionResult.success) {
        return { success: false, error: `Intersection operation failed: ${intersectionResult.error}` };
      }

      return { success: true, data: intersectionResult.data };
    } catch (error) {
      return {
        success: false,
        error: `Intersection operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert translate node to BufferGeometry
   */
  private async convertTranslateNode(
    node: TranslateNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (node.children.length !== 1) {
      return { success: false, error: 'Translate operation requires exactly 1 child' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Child node is null or undefined' };
    }

    try {
      // Convert child geometry
      const childResult = await this.convertNode(firstChild, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child: ${childResult.error}` };
      }

      // Apply translation
      const [x, y, z] = node.v.length === 3 ? node.v : [node.v[0] || 0, node.v[1] || 0, 0];
      const geometry = childResult.data.geometry.clone();
      geometry.translate(x, y, z);

      const result: CSGOperationResult = {
        geometry,
        operationTime: childResult.data.operationTime,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Translate operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert rotate node to BufferGeometry
   */
  private async convertRotateNode(
    node: RotateNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (node.children.length !== 1) {
      return { success: false, error: 'Rotate operation requires exactly 1 child' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Child node is null or undefined' };
    }

    try {
      // Convert child geometry
      const childResult = await this.convertNode(firstChild, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child: ${childResult.error}` };
      }

      // Apply rotation
      const [x, y, z] = node.a.length === 3 ? node.a : [node.a[0] || 0, node.a[1] || 0, node.a[2] || 0];
      const geometry = childResult.data.geometry.clone();

      // Convert degrees to radians and apply rotations
      if (x !== 0) geometry.rotateX((x * Math.PI) / 180);
      if (y !== 0) geometry.rotateY((y * Math.PI) / 180);
      if (z !== 0) geometry.rotateZ((z * Math.PI) / 180);

      const result: CSGOperationResult = {
        geometry,
        operationTime: childResult.data.operationTime,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Rotate operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert scale node to BufferGeometry
   */
  private async convertScaleNode(
    node: ScaleNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (node.children.length !== 1) {
      return { success: false, error: 'Scale operation requires exactly 1 child' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Child node is null or undefined' };
    }

    try {
      // Convert child geometry
      const childResult = await this.convertNode(firstChild, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child: ${childResult.error}` };
      }

      // Apply scaling
      const scale = Array.isArray(node.v) ? node.v : [node.v, node.v, node.v];
      const [x, y, z] = scale.length === 3 ? scale : [scale[0], scale[0], scale[0]];
      const geometry = childResult.data.geometry.clone();
      geometry.scale(x, y, z);

      const result: CSGOperationResult = {
        geometry,
        operationTime: childResult.data.operationTime,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Scale operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert mirror node to BufferGeometry (simplified implementation)
   */
  private async convertMirrorNode(
    node: MirrorNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (node.children.length !== 1) {
      return { success: false, error: 'Mirror operation requires exactly 1 child' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Child node is null or undefined' };
    }

    try {
      // Convert child geometry
      const childResult = await this.convertNode(firstChild, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child: ${childResult.error}` };
      }

      // Apply mirroring (simplified - just scale by -1 on specified axis)
      const [x, y, z] = node.v.length === 3 ? node.v : [node.v[0] || 1, node.v[1] || 0, 0];
      const geometry = childResult.data.geometry.clone();

      const scaleX = x !== 0 ? -1 : 1;
      const scaleY = y !== 0 ? -1 : 1;
      const scaleZ = z !== 0 ? -1 : 1;

      geometry.scale(scaleX, scaleY, scaleZ);

      const result: CSGOperationResult = {
        geometry,
        operationTime: childResult.data.operationTime,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Mirror operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Convert multmatrix node to BufferGeometry (simplified implementation)
   */
  private async convertMultmatrixNode(
    node: MultmatrixNode,
    options: ManifoldConversionOptions
  ): Promise<Result<CSGOperationResult, string>> {
    if (node.children.length !== 1) {
      return { success: false, error: 'Multmatrix operation requires exactly 1 child' };
    }

    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Child node is null or undefined' };
    }

    try {
      // Convert child geometry
      const childResult = await this.convertNode(firstChild, options);
      if (!childResult.success) {
        return { success: false, error: `Failed to convert child: ${childResult.error}` };
      }

      // Apply matrix transformation (simplified - would need proper matrix implementation)
      const geometry = childResult.data.geometry.clone();
      // TODO: Apply matrix transformation when proper matrix support is added

      const result: CSGOperationResult = {
        geometry,
        operationTime: childResult.data.operationTime,
        vertexCount: geometry.getAttribute('position').count,
        triangleCount: geometry.getIndex()?.count ? geometry.getIndex()!.count / 3 : 0,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Multmatrix operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    logger.debug('[DISPOSE][ManifoldASTConverter] Disposing converter');
    this.csgOperations?.dispose();
    this.isInitialized = false;
  }
}
