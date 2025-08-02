/**
 * @file ast-to-geometry-converter.ts
 * @description AST to Geometry Converter Service that converts OpenSCAD AST nodes to geometry data.
 * This service centralizes the logic for converting parsed OpenSCAD AST nodes into geometry data
 * using the appropriate primitive generator services.
 *
 * @example
 * ```typescript
 * const converter = new ASTToGeometryConverterService();
 *
 * // Convert single AST node
 * const result = converter.convertASTNodeToGeometry(sphereNode, globals);
 * if (result.success) {
 *   const geometry = result.data;
 *   console.log(`Generated ${geometry.metadata.primitiveType} geometry`);
 * }
 *
 * // Convert multiple AST nodes
 * const batchResult = converter.convertASTToGeometryBatch(astNodes, globals);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-31
 */

import {
  CircleGeneratorService,
  CubeGeneratorService,
  CylinderGeneratorService,
  FragmentCalculatorService,
  PolygonGeneratorService,
  SphereGeneratorService,
  SquareGeneratorService,
} from '@/features/openscad-geometry-builder';
import type {
  ASTNode,
  CircleNode,
  CubeNode,
  CylinderNode,
  PolygonNode,
  SphereNode,
  SquareNode,
} from '@/features/openscad-parser';
import { createLogger, error, success } from '@/shared';
import type { Result } from '@/shared';
import type { BaseGeometryData } from '../../types/geometry-data';

const logger = createLogger('ASTToGeometryConverterService');

/**
 * Global variables extracted from OpenSCAD AST
 */
export interface GlobalVariables {
  $fn?: number;
  $fa: number;
  $fs: number;
  $t: number;
}

/**
 * AST to geometry conversion error types
 */
export interface ConversionError {
  readonly type:
    | 'UNSUPPORTED_NODE_TYPE'
    | 'PARAMETER_EXTRACTION_ERROR'
    | 'GEOMETRY_GENERATION_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * AST to geometry conversion result type
 */
export type ConversionResult = Result<BaseGeometryData, ConversionError>;
export type BatchConversionResult = Result<BaseGeometryData[], ConversionError>;

/**
 * AST to Geometry Converter Service
 *
 * Centralizes the conversion of OpenSCAD AST nodes to geometry data using
 * the appropriate primitive generator services. Follows SRP by handling
 * only AST-to-geometry conversion concerns.
 */
export class ASTToGeometryConverterService {
  private readonly fragmentCalculator: FragmentCalculatorService;
  private readonly sphereGenerator: SphereGeneratorService;
  private readonly cubeGenerator: CubeGeneratorService;
  private readonly cylinderGenerator: CylinderGeneratorService;
  private readonly circleGenerator: CircleGeneratorService;
  private readonly squareGenerator: SquareGeneratorService;
  private readonly polygonGenerator: PolygonGeneratorService;

  constructor() {
    // Initialize all required services
    this.fragmentCalculator = new FragmentCalculatorService();
    this.sphereGenerator = new SphereGeneratorService(this.fragmentCalculator);
    this.cubeGenerator = new CubeGeneratorService();
    this.cylinderGenerator = new CylinderGeneratorService(this.fragmentCalculator);
    this.circleGenerator = new CircleGeneratorService(this.fragmentCalculator);
    this.squareGenerator = new SquareGeneratorService();
    this.polygonGenerator = new PolygonGeneratorService();
  }

  /**
   * Convert a single AST node to geometry data
   *
   * @param node - The AST node to convert
   * @param globals - Global variables from OpenSCAD context
   * @returns Result containing geometry data or conversion error
   */
  convertASTNodeToGeometry(node: ASTNode, globals: GlobalVariables): ConversionResult {
    try {
      logger.debug(`[CONVERT_NODE] Converting ${node.type} node to geometry`);

      switch (node.type) {
        case 'sphere':
          return this.convertSphereNode(node as SphereNode, globals);
        case 'cube':
          return this.convertCubeNode(node as CubeNode, globals);
        case 'cylinder':
          return this.convertCylinderNode(node as CylinderNode, globals);
        case 'circle':
          return this.convertCircleNode(node as CircleNode, globals);
        case 'square':
          return this.convertSquareNode(node as SquareNode, globals);
        case 'polygon':
          return this.convertPolygonNode(node as PolygonNode, globals);
        default:
          return error({
            type: 'UNSUPPORTED_NODE_TYPE',
            message: `Unsupported AST node type: ${node.type}`,
            details: { nodeType: node.type },
          });
      }
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Failed to convert AST node: ${err instanceof Error ? err.message : String(err)}`,
        details: { nodeType: node.type },
      });
    }
  }

  /**
   * Convert multiple AST nodes to geometry data
   *
   * @param nodes - Array of AST nodes to convert
   * @param globals - Global variables from OpenSCAD context
   * @returns Result containing array of geometry data or conversion error
   */
  convertASTToGeometryBatch(nodes: ASTNode[], globals: GlobalVariables): BatchConversionResult {
    try {
      logger.debug(`[CONVERT_BATCH] Converting ${nodes.length} AST nodes to geometry`);

      const geometries: BaseGeometryData[] = [];

      for (const node of nodes) {
        const result = this.convertASTNodeToGeometry(node, globals);
        if (!result.success) {
          return error({
            type: 'GEOMETRY_GENERATION_ERROR',
            message: `Batch conversion failed at node type ${node.type}: ${result.error.message}`,
            details: {
              failedNodeType: node.type,
              originalError: result.error,
              processedCount: geometries.length,
              totalCount: nodes.length,
            },
          });
        }
        geometries.push(result.data);
      }

      logger.debug(`[CONVERT_BATCH] Successfully converted ${geometries.length} nodes to geometry`);
      return success(geometries);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Batch conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { nodeCount: nodes.length },
      });
    }
  }

  /**
   * Convert sphere AST node to geometry data
   */
  private convertSphereNode(node: SphereNode, globals: GlobalVariables): ConversionResult {
    try {
      // Extract parameters with proper fallbacks
      const radius = typeof node.radius === 'number' ? node.radius : 1;
      const fn = node.$fn || globals.$fn;
      const fa = node.$fa || globals.$fa;
      const fs = node.$fs || globals.$fs;

      // Calculate fragments
      const fragmentResult = this.fragmentCalculator.calculateFragments(radius, fn, fs, fa);
      if (!fragmentResult.success) {
        return error({
          type: 'PARAMETER_EXTRACTION_ERROR',
          message: `Fragment calculation failed: ${fragmentResult.error.message}`,
          details: { radius, fn, fa, fs },
        });
      }

      // Generate sphere geometry
      const sphereResult = this.sphereGenerator.generateSphere(radius, fragmentResult.data);
      if (!sphereResult.success) {
        return error({
          type: 'GEOMETRY_GENERATION_ERROR',
          message: `Sphere generation failed: ${sphereResult.error.message}`,
          details: { radius, fragments: fragmentResult.data },
        });
      }

      return success(sphereResult.data);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Sphere conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { node },
      });
    }
  }

  /**
   * Convert cube AST node to geometry data
   */
  private convertCubeNode(node: CubeNode, _globals: GlobalVariables): ConversionResult {
    try {
      // Extract parameters with proper fallbacks
      const size = node.size || 1;
      const center = node.center || false;

      // Generate cube geometry
      const cubeResult = this.cubeGenerator.generateCube(size, center);
      if (!cubeResult.success) {
        return error({
          type: 'GEOMETRY_GENERATION_ERROR',
          message: `Cube generation failed: ${cubeResult.error.message}`,
          details: { size, center },
        });
      }

      return success(cubeResult.data);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Cube conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { node },
      });
    }
  }

  /**
   * Convert cylinder AST node to geometry data
   */
  private convertCylinderNode(node: CylinderNode, globals: GlobalVariables): ConversionResult {
    try {
      // Extract parameters with proper fallbacks
      const height = node.h || 1;
      const r1 = node.r1 || node.r || 1;
      const r2 = node.r2 || node.r || 1;
      const center = node.center || false;
      const fn = node.$fn || globals.$fn;
      const fa = node.$fa || globals.$fa;
      const fs = node.$fs || globals.$fs;

      // Calculate fragments using the larger radius
      const maxRadius = Math.max(r1, r2);
      const fragmentResult = this.fragmentCalculator.calculateFragments(maxRadius, fn, fs, fa);
      if (!fragmentResult.success) {
        return error({
          type: 'PARAMETER_EXTRACTION_ERROR',
          message: `Fragment calculation failed: ${fragmentResult.error.message}`,
          details: { height, r1, r2, center, fn, fa, fs },
        });
      }

      // Generate cylinder geometry
      const cylinderResult = this.cylinderGenerator.generateCylinder(
        height,
        r1,
        r2,
        center,
        fragmentResult.data
      );
      if (!cylinderResult.success) {
        return error({
          type: 'GEOMETRY_GENERATION_ERROR',
          message: `Cylinder generation failed: ${cylinderResult.error.message}`,
          details: { height, r1, r2, center, fragments: fragmentResult.data },
        });
      }

      return success(cylinderResult.data);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Cylinder conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { node },
      });
    }
  }

  /**
   * Convert circle AST node to geometry data
   */
  private convertCircleNode(node: CircleNode, globals: GlobalVariables): ConversionResult {
    try {
      // Extract parameters with proper fallbacks
      const radius = typeof node.r === 'number' ? node.r : 1;
      const fn = node.$fn || globals.$fn;
      const fa = node.$fa || globals.$fa;
      const fs = node.$fs || globals.$fs;

      // Calculate fragments
      const fragmentResult = this.fragmentCalculator.calculateFragments(radius, fn, fs, fa);
      if (!fragmentResult.success) {
        return error({
          type: 'PARAMETER_EXTRACTION_ERROR',
          message: `Fragment calculation failed: ${fragmentResult.error.message}`,
          details: { radius, fn, fa, fs },
        });
      }

      // Generate circle geometry
      const circleResult = this.circleGenerator.generateCircle({
        radius,
        fn: fragmentResult.data,
      });
      if (!circleResult.success) {
        return error({
          type: 'GEOMETRY_GENERATION_ERROR',
          message: `Circle generation failed: ${circleResult.error.message}`,
          details: { radius, fragments: fragmentResult.data },
        });
      }

      return success(circleResult.data);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Circle conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { node },
      });
    }
  }

  /**
   * Convert square AST node to geometry data
   */
  private convertSquareNode(node: SquareNode, _globals: GlobalVariables): ConversionResult {
    try {
      // Extract parameters with proper fallbacks
      const size = node.size || 1;
      const center = node.center || false;

      // Generate square geometry using SquareParameters interface
      const squareResult = this.squareGenerator.generateSquare({
        size,
        center,
      });
      if (!squareResult.success) {
        return error({
          type: 'GEOMETRY_GENERATION_ERROR',
          message: `Square generation failed: ${squareResult.error.message}`,
          details: { size, center },
        });
      }

      return success(squareResult.data);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Square conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { node },
      });
    }
  }

  /**
   * Convert polygon AST node to geometry data
   */
  private convertPolygonNode(node: PolygonNode, _globals: GlobalVariables): ConversionResult {
    try {
      // Extract parameters with proper fallbacks
      const points = node.points || [];
      const paths = node.paths;
      const convexity = node.convexity || 1;

      // Convert points array to Vector2D format
      const vector2DPoints = points.map((point) => ({
        x: Array.isArray(point) && point.length >= 2 ? point[0] || 0 : 0,
        y: Array.isArray(point) && point.length >= 2 ? point[1] || 0 : 0,
      }));

      // Generate polygon geometry
      interface PolygonParameters {
        points: Vector2D[];
        convexity: number;
        paths?: number[][];
      }

      const polygonParameters: PolygonParameters = {
        points: vector2DPoints,
        convexity,
      };

      // Only add paths if they exist
      if (paths && paths.length > 0) {
        polygonParameters.paths = paths;
      }

      const polygonResult = this.polygonGenerator.generatePolygon(polygonParameters);
      if (!polygonResult.success) {
        return error({
          type: 'GEOMETRY_GENERATION_ERROR',
          message: `Polygon generation failed: ${polygonResult.error.message}`,
          details: { pointCount: points.length, convexity, hasPaths: !!paths },
        });
      }

      return success(polygonResult.data);
    } catch (err) {
      return error({
        type: 'GEOMETRY_GENERATION_ERROR',
        message: `Polygon conversion failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { node },
      });
    }
  }
}
