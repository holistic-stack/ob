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

import { MeshBuilder, Mesh, StandardMaterial, Color3 } from '@babylonjs/core';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type {
  ConversionContext,
  MeshConversionResult,
  OpenSCADConverter,
  ConversionError
} from '../../types/converter-types.js';
import {
  createConverterSuccess,
  createConverterFailure,
  createConversionError
} from '../../types/converter-types.js';
import {
  isOpenSCADPrimitive,
  type OpenSCADPrimitiveNode
} from '../../types/openscad-types.js';

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
          return this.convertCylinder(node, context);        default:
          console.log('[WARN] Unsupported primitive type:', (node as any).type);
          return createConverterFailure(
            createConversionError(
              'unsupported_operation',
              `Unsupported primitive type: ${(node as any).type}`,
              { 
                ...((node as any).location && { location: (node as any).location }),
                astNode: node 
              }
            )
          );
      }
    } catch (error) {
      console.log('[ERROR] Failed to convert primitive:', error);      return createConverterFailure(
        createConversionError(
          'babylon_error',
          `Failed to create Babylon.js mesh: ${error instanceof Error ? error.message : String(error)}`,
          { 
            ...(node.location && { location: node.location }),
            astNode: node,
            ...(error instanceof Error && { cause: error })
          }
        )
      );
    }
  }

  /**
   * [DEBUG] Convert OpenSCAD cube to Babylon.js box mesh
   */  private convertCube(node: OpenSCADPrimitiveNode, context: ConversionContext): MeshConversionResult {
    console.log('[DEBUG] Converting cube with size:', (node as any).size);
    
    const size = this.extractCubeSize(node as any);
    if (!size) {      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid cube size parameters',
          { 
            ...(node.location && { location: node.location }),
            astNode: node 
          }
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
   */  private convertSphere(node: OpenSCADPrimitiveNode, context: ConversionContext): MeshConversionResult {
    console.log('[DEBUG] Converting sphere with properties:', node);
    
    const radius = this.extractSphereRadius(node as any);
    if (radius === null) {      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid sphere radius parameter',
          { 
            ...(node.location && { location: node.location }),
            astNode: node 
          }
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
   */  private convertCylinder(node: OpenSCADPrimitiveNode, context: ConversionContext): MeshConversionResult {
    console.log('[DEBUG] Converting cylinder with properties:', node);
    
    const { height, radius } = this.extractCylinderParams(node as any);
    if (height === null || radius === null) {      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid cylinder parameters',
          { 
            ...(node.location && { location: node.location }),
            astNode: node 
          }
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
  }  /**
   * [DEBUG] Extract cube size from CubeNode properties
   */
  private extractCubeSize(node: any): readonly [number, number, number] | null {
    const size = node.size;
    
    if (Array.isArray(size) && size.length === 3) {
      const [x, y, z] = size;
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        return [x, y, z] as const;
      }
    }
    
    if (typeof size === 'number') {
      return [size, size, size] as const;
    }
    
    // Default cube size if no size specified
    if (!size) {
      return [1, 1, 1] as const;
    }
    
    return null;
  }
  /**
   * [DEBUG] Extract sphere radius from SphereNode properties
   */
  private extractSphereRadius(node: any): number | null {
    const radius = node.radius;
    const diameter = node.diameter;
    
    if (typeof radius === 'number' && radius > 0) {
      return radius;
    }
    
    if (typeof diameter === 'number' && diameter > 0) {
      return diameter / 2;
    }
    
    // Default sphere radius if no radius/diameter specified
    if (!radius && !diameter) {
      return 1;
    }
    
    return null;
  }
  /**
   * [DEBUG] Extract cylinder parameters from CylinderNode properties
   */
  private extractCylinderParams(node: any): { height: number | null; radius: number | null } {
    const height = node.h;
    const radius = node.r || node.radius;
    
    return {
      height: typeof height === 'number' && height > 0 ? height : (height === undefined ? 1 : null),
      radius: typeof radius === 'number' && radius > 0 ? radius : (radius === undefined ? 1 : null)
    };
  }
}

console.log('[END] PrimitiveConverter module loaded successfully');
