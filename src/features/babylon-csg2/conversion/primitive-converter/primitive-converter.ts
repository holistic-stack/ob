/**
 * @file Primitive converter for OpenSCAD primitive shapes to Babylon.js meshes
 * 
 * This module converts OpenSCAD primitive shapes (cube, sphere, cylinder) to
 * Babylon.js meshes following functional programming principles with immutable
 * data structures and comprehensive error handling.
 * 
 * @example
 * ```typescript
 * import { PrimitiveConverter } from './primitive-converter.js';
 * 
 * const converter = new PrimitiveConverter();
 * const result = await converter.convert(cubeNode, context);
 * ```
 */

import { MeshBuilder } from '@babylonjs/core';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import {
  type ConversionContext,
  type MeshConversionResult,
  type OpenSCADConverter,
  createConverterSuccess,
  createConverterFailure,
  createConversionError
} from '../types/converter-types.js';
import {
  isOpenSCADPrimitive,
  type OpenSCADPrimitiveNode
} from '../../openscad/types/openscad-types.js';

/**
 * Converter for OpenSCAD primitive shapes to Babylon.js meshes
 * 
 * Supports conversion of:
 * - cube([x, y, z]) → CreateBox
 * - sphere(r) → CreateSphere  
 * - cylinder(h, r) → CreateCylinder
 */
export class PrimitiveConverter implements OpenSCADConverter<OpenSCADPrimitiveNode> {
  readonly priority = 100; // High priority for basic primitives

  /**
   * Helper to create error context with optional location
   */
  private createErrorContext(node: OpenSCADPrimitiveNode, cause?: Error) {
    const context: Record<string, unknown> = {
      astNode: node
    };

    if (node.location) {
      context.location = node.location;
    }

    if (cause) {
      context.cause = cause;
    }

    return context;
  }

  /**
   * [DEBUG] Type guard to check if node can be converted by this converter
   */
  canConvert(node: ASTNode): node is OpenSCADPrimitiveNode {
    console.log('[DEBUG] PrimitiveConverter checking node type:', node.type);
    return isOpenSCADPrimitive(node);
  }

  /**
   * [DEBUG] Convert OpenSCAD primitive to Babylon.js mesh
   */
  async convert(node: OpenSCADPrimitiveNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[INIT] Converting primitive:', node.type);
    
    try {
      switch (node.type) {
        case 'cube':
          return this.convertCube(node, context);
        case 'sphere':
          return this.convertSphere(node, context);
        case 'cylinder':
          return this.convertCylinder(node, context);
        default: {
          // TypeScript exhaustiveness check - this should never happen
          const exhaustiveCheck: never = node;
          console.log('[WARN] Unsupported primitive type:', (exhaustiveCheck as OpenSCADPrimitiveNode).type);
          return createConverterFailure(
            createConversionError(
              'unsupported_operation',
              `Unsupported primitive type: ${(exhaustiveCheck as OpenSCADPrimitiveNode).type}`,
              this.createErrorContext(exhaustiveCheck as OpenSCADPrimitiveNode)
            )
          );
        }
      }
    } catch (error) {
      console.log('[ERROR] Failed to convert primitive:', error);
      return createConverterFailure(
        createConversionError(
          'babylon_error',
          `Failed to create Babylon.js mesh: ${error instanceof Error ? error.message : String(error)}`,
          this.createErrorContext(node, error instanceof Error ? error : undefined)
        )
      );
    }
  }

  /**
   * [DEBUG] Convert OpenSCAD cube to Babylon.js box mesh
   */
  private convertCube(node: OpenSCADPrimitiveNode, context: ConversionContext): MeshConversionResult {
    if (node.type !== 'cube') {
      return createConverterFailure(
        createConversionError(
          'unsupported_operation',
          'Expected cube node',
          this.createErrorContext(node)
        )
      );
    }

    console.log('[DEBUG] Converting cube with size:', node.size);

    const size = this.extractCubeSize(node.size);
    if (!size) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid cube size parameters',
          this.createErrorContext(node)
        )
      );
    }

    const mesh = MeshBuilder.CreateBox(
      `cube_${Date.now()}`,
      {
        width: size[0],
        height: size[1],
        depth: size[2]
      },
      context.scene
    );

    // Apply default material
    mesh.material = context.defaultMaterial;

    console.log('[DEBUG] Created cube mesh with size:', size);
    return createConverterSuccess(mesh);
  }

  /**
   * [DEBUG] Convert OpenSCAD sphere to Babylon.js sphere mesh
   */
  private convertSphere(node: OpenSCADPrimitiveNode, context: ConversionContext): MeshConversionResult {
    if (node.type !== 'sphere') {
      return createConverterFailure(
        createConversionError(
          'unsupported_operation',
          'Expected sphere node',
          this.createErrorContext(node)
        )
      );
    }

    console.log('[DEBUG] Converting sphere with radius:', node.radius, 'diameter:', node.diameter);

    const radius = this.extractSphereRadius(node);
    if (radius === null) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid sphere radius parameter',
          this.createErrorContext(node)
        )
      );
    }

    const mesh = MeshBuilder.CreateSphere(
      `sphere_${Date.now()}`,
      {
        diameter: radius * 2,
        segments: 32
      },
      context.scene
    );

    // Apply default material
    mesh.material = context.defaultMaterial;

    console.log('[DEBUG] Created sphere mesh with radius:', radius);
    return createConverterSuccess(mesh);
  }

  /**
   * [DEBUG] Convert OpenSCAD cylinder to Babylon.js cylinder mesh
   */
  private convertCylinder(node: OpenSCADPrimitiveNode, context: ConversionContext): MeshConversionResult {
    if (node.type !== 'cylinder') {
      return createConverterFailure(
        createConversionError(
          'unsupported_operation',
          'Expected cylinder node',
          this.createErrorContext(node)
        )
      );
    }

    console.log('[DEBUG] Converting cylinder with height:', node.h, 'radius:', node.r);

    const { height, radius } = this.extractCylinderParams(node);
    if (height === null || radius === null) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid cylinder parameters',
          this.createErrorContext(node)
        )
      );
    }

    const mesh = MeshBuilder.CreateCylinder(
      `cylinder_${Date.now()}`,
      {
        height,
        diameter: radius * 2,
        tessellation: 32
      },
      context.scene
    );

    // Apply default material
    mesh.material = context.defaultMaterial;

    console.log('[DEBUG] Created cylinder mesh with height:', height, 'radius:', radius);
    return createConverterSuccess(mesh);
  }

  /**
   * [DEBUG] Extract cube size from CubeNode size property
   */
  private extractCubeSize(size: unknown): readonly [number, number, number] | null {
    if (Array.isArray(size) && size.length === 3 && size.every(v => typeof v === 'number')) {
      return [size[0] as number, size[1] as number, size[2] as number] as const;
    }

    if (typeof size === 'number') {
      return [size, size, size] as const;
    }

    // Default cube size if no size specified
    if (size === undefined || size === null) {
      return [1, 1, 1] as const;
    }

    return null;
  }

  /**
   * [DEBUG] Extract sphere radius from SphereNode
   */
  private extractSphereRadius(node: { radius?: number; diameter?: number }): number | null {
    // Check radius first
    if (typeof node.radius === 'number' && node.radius > 0) {
      return node.radius;
    }

    // Check diameter
    if (typeof node.diameter === 'number' && node.diameter > 0) {
      return node.diameter / 2;
    }

    // Default sphere radius if no parameters
    if (node.radius === undefined && node.diameter === undefined) {
      return 1;
    }

    return null;
  }

  /**
   * [DEBUG] Extract cylinder parameters from CylinderNode
   */
  private extractCylinderParams(node: { h?: number; r?: number; r1?: number; r2?: number; d?: number; d1?: number; d2?: number }): { height: number | null; radius: number | null } {
    // Extract height
    const height = typeof node.h === 'number' && node.h > 0 ? node.h : (node.h === undefined ? 1 : null);

    // Extract radius - prefer r, then r1, then d/2, then d1/2
    let radius: number | null = null;
    if (typeof node.r === 'number' && node.r > 0) {
      radius = node.r;
    } else if (typeof node.r1 === 'number' && node.r1 > 0) {
      radius = node.r1;
    } else if (typeof node.d === 'number' && node.d > 0) {
      radius = node.d / 2;
    } else if (typeof node.d1 === 'number' && node.d1 > 0) {
      radius = node.d1 / 2;
    } else if (node.r === undefined && node.r1 === undefined && node.d === undefined && node.d1 === undefined) {
      radius = 1; // Default radius
    }

    return { height, radius };
  }
}

console.log('[END] PrimitiveConverter module loaded successfully');
