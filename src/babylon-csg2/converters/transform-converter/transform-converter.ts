/**
 * @file Transform converter for OpenSCAD transformation operations to Babylon.js meshes
 * 
 * This module converts OpenSCAD transformations (translate, rotate, scale) to
 * Babylon.js mesh transformations following functional programming principles 
 * with immutable data structures and comprehensive error handling.
 * 
 * @example
 * ```typescript
 * import { TransformConverter } from './transform-converter.js';
 * 
 * const converter = new TransformConverter();
 * const result = await converter.convert(translateNode, context);
 * ```
 */

import { Vector3 } from '@babylonjs/core';
import type { 
  ASTNode, 
  TranslateNode, 
  RotateNode, 
  ScaleNode,
  Vector3D
} from '@holistic-stack/openscad-parser';
import {
  type ConversionContext,
  type MeshConversionResult,
  type OpenSCADConverter,
  createConverterSuccess,
  createConverterFailure,
  createConversionError
} from '../../types/converter-types.js';

export type TransformASTNode = TranslateNode | RotateNode | ScaleNode;

/**
 * Converter for OpenSCAD transformation operations to Babylon.js mesh transformations
 * 
 * Supports conversion of:
 * - translate([x, y, z]) → mesh.position
 * - rotate([x, y, z]) → mesh.rotation  
 * - scale([x, y, z]) → mesh.scaling
 */
export class TransformConverter implements OpenSCADConverter<TransformASTNode> {
  readonly priority = 200; // Lower priority than primitives, higher than CSG operations

  /**
   * [DEBUG] Type guard to check if node can be converted by this converter
   */  canConvert(node: ASTNode): node is TransformASTNode {
    console.log('[DEBUG] TransformConverter checking node type:', node.type);
    return node.type === 'translate' || node.type === 'rotate' || node.type === 'scale';
  }

  /**
   * [DEBUG] Convert OpenSCAD transformation to transformed Babylon.js mesh
   */
  async convert(node: TransformASTNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[INIT] Converting transformation:', node.type);
    
    try {
      switch (node.type) {
        case 'translate':
          return this.convertTranslate(node, context);
        case 'rotate':
          return this.convertRotate(node, context);
        case 'scale':
          return this.convertScale(node, context);        default: {
          const unknownNode = node as ASTNode;
          console.log('[WARN] Unsupported transformation type:', unknownNode.type);
          return createConverterFailure(
            createConversionError(
              'unsupported_operation',
              `Unsupported transformation type: ${unknownNode.type}`,
              { ...(unknownNode.location && { location: unknownNode.location }), astNode: unknownNode }
            )
          );
        }
      }
    } catch (error) {
      console.log('[ERROR] Failed to convert transformation:', error);
      return createConverterFailure(
        createConversionError(
          'babylon_error',
          `Failed to apply transformation: ${error instanceof Error ? error.message : String(error)}`,
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
   * [DEBUG] Convert OpenSCAD translate to Babylon.js mesh with position
   */  private async convertTranslate(node: TranslateNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[DEBUG] Converting translate with vector:', node.v);
      // First, convert the child node to a mesh
    if (!node.children || node.children.length === 0) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Translate operation must have at least one child',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }

    // For now, handle single child - later we'll implement multi-child union
    const childNode = node.children[0];
    if (!childNode) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Translate operation child node is undefined',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }
    
    const childResult = await this.convertChild(childNode, context);
    
    if (!childResult.success) {
      return childResult;
    }    const mesh = childResult.data;
    const translation = this.extractTranslation(node);
    
    if (!translation) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid or missing translation vector',
          { 
            ...(node.location && { location: node.location }),
            astNode: node 
          }
        )
      );
    }

    // Apply translation
    mesh.position.addInPlace(new Vector3(translation[0], translation[1], translation[2]));
    console.log(`[DEBUG] Applied translation [${translation.join(', ')}] to mesh`);

    return createConverterSuccess(mesh);
  }
  /**
   * [DEBUG] Convert OpenSCAD rotate to Babylon.js mesh with rotation
   */
  private async convertRotate(node: RotateNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[DEBUG] Converting rotate with angle:', node.a, 'axis:', node.v);
    
    // First, convert the child node to a mesh
    if (!node.children || node.children.length === 0) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Rotate operation must have at least one child',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );    }

    const childNode = node.children[0];
    if (!childNode) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Rotate operation child node is undefined',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }
    
    const childResult = await this.convertChild(childNode, context);
    
    if (!childResult.success) {
      return childResult;
    }

    const mesh = childResult.data;
    const rotation = this.extractRotation(node.a, node.v);
    
    if (!rotation) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid or missing rotation vector',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }

    // Apply rotation (convert degrees to radians)
    const rotationRadians = rotation.map(deg => (deg * Math.PI) / 180);
    mesh.rotation.addInPlace(new Vector3(rotationRadians[0], rotationRadians[1], rotationRadians[2]));
    console.log(`[DEBUG] Applied rotation [${rotation.join(', ')}] degrees to mesh`);

    return createConverterSuccess(mesh);
  }
  /**
   * [DEBUG] Convert OpenSCAD scale to Babylon.js mesh with scaling
   */
  private async convertScale(node: ScaleNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[DEBUG] Converting scale with vector:', node.v);
      // First, convert the child node to a mesh
    if (!node.children || node.children.length === 0) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Scale operation must have at least one child',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }

    const childNode = node.children[0];
    if (!childNode) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Scale operation child node is undefined',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }
    
    const childResult = await this.convertChild(childNode, context);
    
    if (!childResult.success) {
      return childResult;
    }

    const mesh = childResult.data;
    const scaling = this.extractScaling(node.v);
    
    if (!scaling) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid or missing scaling vector',
          { ...(node.location && { location: node.location }), astNode: node }
        )
      );
    }

    // Apply scaling
    mesh.scaling.multiplyInPlace(new Vector3(scaling[0], scaling[1], scaling[2]));
    console.log(`[DEBUG] Applied scaling [${scaling.join(', ')}] to mesh`);

    return createConverterSuccess(mesh);
  }

  /**
   * Convert a child node using the appropriate converter
   */
  private async convertChild(childNode: ASTNode, _context: ConversionContext): Promise<MeshConversionResult> {
    // This would typically use a converter registry
    // For now, we'll implement a basic dispatch mechanism
    
    // Import other converters here when needed
    // For now, return a basic error - this will be implemented when we set up the converter registry
    return createConverterFailure(
      createConversionError(
        'unsupported_operation',
        'Child converter not yet implemented - needs converter registry',
        { astNode: childNode }
      )
    );
  }
  /**
   * Extract translation vector from TranslateNode
   */
  private extractTranslation(node: TranslateNode): [number, number, number] | null {
    const v = node.v;
    
    if (Array.isArray(v) && v.length >= 3) {
      const x = typeof v[0] === 'number' ? v[0] : 0;
      const y = typeof v[1] === 'number' ? v[1] : 0;
      const z = typeof v[2] === 'number' ? v[2] : 0;
      return [x, y, z];
    }
    
    return [0, 0, 0]; // Default to no translation
  }
  /**
   * Extract rotation vector from RotateNode properties
   */
  private extractRotation(a: number | Vector3D, v?: Vector3D): [number, number, number] | null {
    // If 'a' is a vector, it represents [x, y, z] rotation angles
    if (Array.isArray(a) && a.length >= 3) {
      const x = typeof a[0] === 'number' ? a[0] : 0;
      const y = typeof a[1] === 'number' ? a[1] : 0;
      const z = typeof a[2] === 'number' ? a[2] : 0;
      return [x, y, z];
    }
    
    // Handle single angle rotation
    if (typeof a === 'number') {
      // If axis vector is provided, calculate rotation around that axis
      if (v && Array.isArray(v) && v.length >= 3) {
        // For now, simplify by applying rotation to the axis with the largest component
        const absX = Math.abs(v[0]);
        const absY = Math.abs(v[1]);
        const absZ = Math.abs(v[2]);
        
        if (absX >= absY && absX >= absZ) {
          return [a, 0, 0];  // Rotate around X-axis
        } else if (absY >= absZ) {
          return [0, a, 0];  // Rotate around Y-axis
        } else {
          return [0, 0, a];  // Rotate around Z-axis
        }
      }
      // Default to Z-axis rotation for single angle
      return [0, 0, a];
    }
    
    return [0, 0, 0]; // Default to no rotation
  }
  /**
   * Extract scaling vector from ScaleNode properties
   */
  private extractScaling(v: Vector3D): [number, number, number] | null {
    if (Array.isArray(v) && v.length >= 3) {
      const x = typeof v[0] === 'number' ? v[0] : 1;
      const y = typeof v[1] === 'number' ? v[1] : 1;
      const z = typeof v[2] === 'number' ? v[2] : 1;
      return [x, y, z];
    }
    
    return [1, 1, 1]; // Default to no scaling
  }
}

console.log('[END] TransformConverter module loaded successfully');
