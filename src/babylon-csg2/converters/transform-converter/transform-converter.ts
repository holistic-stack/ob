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
  isOpenSCADTransformation,
  type OpenSCADTransformationNode
} from '../../types/openscad-types.js';

/**
 * Converter for OpenSCAD transformation operations to Babylon.js mesh transformations
 * 
 * Supports conversion of:
 * - translate([x, y, z]) → mesh.position
 * - rotate([x, y, z]) → mesh.rotation  
 * - scale([x, y, z]) → mesh.scaling
 */
export class TransformConverter implements OpenSCADConverter<OpenSCADTransformationNode> {
  readonly priority = 200; // Lower priority than primitives, higher than CSG operations

  /**
   * [DEBUG] Type guard to check if node can be converted by this converter
   */
  canConvert(node: ASTNode): node is OpenSCADTransformationNode {
    console.log('[DEBUG] TransformConverter checking node type:', node.type);
    return isOpenSCADTransformation(node);
  }

  /**
   * [DEBUG] Convert OpenSCAD transformation to transformed Babylon.js mesh
   */
  async convert(node: OpenSCADTransformationNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[INIT] Converting transformation:', node.type);
    
    try {
      switch (node.type) {
        case 'translate':
          return this.convertTranslate(node, context);
        case 'rotate':
          return this.convertRotate(node, context);
        case 'scale':
          return this.convertScale(node, context);
        default:
          console.log('[WARN] Unsupported transformation type:', node.type);
          return createConverterFailure(
            createConversionError(
              'unsupported_operation',
              `Unsupported transformation type: ${node.type}`,
              { location: node.location, astNode: node }
            )
          );
      }
    } catch (error) {
      console.log('[ERROR] Failed to convert transformation:', error);
      return createConverterFailure(
        createConversionError(
          'babylon_error',
          `Failed to apply transformation: ${error instanceof Error ? error.message : String(error)}`,
          { location: node.location, astNode: node, cause: error instanceof Error ? error : undefined }
        )
      );
    }
  }

  /**
   * [DEBUG] Convert OpenSCAD translate to Babylon.js mesh with position
   */
  private async convertTranslate(node: OpenSCADTransformationNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[DEBUG] Converting translate with parameters:', node.parameters);
    
    // First, convert the child node to a mesh
    if (!node.children || node.children.length === 0) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Translate operation must have at least one child',
          { location: node.location, astNode: node }
        )
      );
    }

    // For now, handle single child - later we'll implement multi-child union
    const childNode = node.children[0];
    const childResult = await this.convertChild(childNode, context);
    
    if (!childResult.success) {
      return childResult;
    }

    const mesh = childResult.data;
    const translation = this.extractTranslation(node.parameters);
    
    if (!translation) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid or missing translation vector',
          { location: node.location, astNode: node }
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
  private async convertRotate(node: OpenSCADTransformationNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[DEBUG] Converting rotate with parameters:', node.parameters);
    
    // First, convert the child node to a mesh
    if (!node.children || node.children.length === 0) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Rotate operation must have at least one child',
          { location: node.location, astNode: node }
        )
      );
    }

    const childNode = node.children[0];
    const childResult = await this.convertChild(childNode, context);
    
    if (!childResult.success) {
      return childResult;
    }

    const mesh = childResult.data;
    const rotation = this.extractRotation(node.parameters);
    
    if (!rotation) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid or missing rotation vector',
          { location: node.location, astNode: node }
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
  private async convertScale(node: OpenSCADTransformationNode, context: ConversionContext): Promise<MeshConversionResult> {
    console.log('[DEBUG] Converting scale with parameters:', node.parameters);
    
    // First, convert the child node to a mesh
    if (!node.children || node.children.length === 0) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Scale operation must have at least one child',
          { location: node.location, astNode: node }
        )
      );
    }

    const childNode = node.children[0];
    const childResult = await this.convertChild(childNode, context);
    
    if (!childResult.success) {
      return childResult;
    }

    const mesh = childResult.data;
    const scaling = this.extractScaling(node.parameters);
    
    if (!scaling) {
      return createConverterFailure(
        createConversionError(
          'invalid_parameters',
          'Invalid or missing scaling vector',
          { location: node.location, astNode: node }
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
  private async convertChild(childNode: ASTNode, context: ConversionContext): Promise<MeshConversionResult> {
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
   * Extract translation vector from parameters
   */
  private extractTranslation(parameters: Record<string, unknown>): [number, number, number] | null {
    const v = parameters.v;
    
    if (Array.isArray(v) && v.length >= 3) {
      const x = typeof v[0] === 'number' ? v[0] : 0;
      const y = typeof v[1] === 'number' ? v[1] : 0;
      const z = typeof v[2] === 'number' ? v[2] : 0;
      return [x, y, z];
    }
    
    return [0, 0, 0]; // Default to no translation
  }

  /**
   * Extract rotation vector from parameters
   */
  private extractRotation(parameters: Record<string, unknown>): [number, number, number] | null {
    const a = parameters.a;
    
    if (Array.isArray(a) && a.length >= 3) {
      const x = typeof a[0] === 'number' ? a[0] : 0;
      const y = typeof a[1] === 'number' ? a[1] : 0;
      const z = typeof a[2] === 'number' ? a[2] : 0;
      return [x, y, z];
    }
    
    // Handle single angle rotation around Z-axis
    if (typeof a === 'number') {
      return [0, 0, a];
    }
    
    return [0, 0, 0]; // Default to no rotation
  }

  /**
   * Extract scaling vector from parameters
   */
  private extractScaling(parameters: Record<string, unknown>): [number, number, number] | null {
    const v = parameters.v;
    
    if (Array.isArray(v) && v.length >= 3) {
      const x = typeof v[0] === 'number' ? v[0] : 1;
      const y = typeof v[1] === 'number' ? v[1] : 1;
      const z = typeof v[2] === 'number' ? v[2] : 1;
      return [x, y, z];
    }
    
    // Handle uniform scaling
    if (typeof v === 'number' && v > 0) {
      return [v, v, v];
    }
    
    return [1, 1, 1]; // Default to no scaling
  }
}

console.log('[END] TransformConverter module loaded successfully');
