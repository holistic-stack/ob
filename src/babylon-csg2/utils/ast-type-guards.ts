/**
 * AST Node Type Guards and Utilities for OpenSCAD Parser Integration
 * 
 * Provides comprehensive type guards, parameter extraction utilities, and validation 
 * functions for OpenSCAD AST nodes from @holistic-stack/openscad-parser.
 * 
 * Follows functional programming patterns with immutable operations and pure functions.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import type {
  ASTNode,
  BaseNode,
  CubeNode,
  SphereNode,
  CylinderNode,
  TranslateNode,
  RotateNode,
  ScaleNode,
  MirrorNode,
  UnionNode,
  DifferenceNode,
  IntersectionNode,
  ParameterValue,
  SourceLocation,
  ExpressionNode,
  ErrorNode,
  AssignmentNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  SpecialVariableAssignment,
  IfNode
} from '@holistic-stack/openscad-parser';

// ============================================================================
// RESULT TYPE FOR SAFE OPERATIONS
// ============================================================================

/**
 * Result type for safe parameter extraction and validation
 */
export type ExtractionResult<T, E = string> = 
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

// ============================================================================
// PRIMITIVE NODE TYPE GUARDS
// ============================================================================

/**
 * Type guard for CubeNode
 * 
 * @param node - AST node to check
 * @returns True if node is a CubeNode
 */
export function isCubeNode(node: ASTNode): node is CubeNode {
  return node.type === 'cube';
}

/**
 * Type guard for SphereNode
 * 
 * @param node - AST node to check
 * @returns True if node is a SphereNode
 */
export function isSphereNode(node: ASTNode): node is SphereNode {
  return node.type === 'sphere';
}

/**
 * Type guard for CylinderNode
 * 
 * @param node - AST node to check
 * @returns True if node is a CylinderNode
 */
export function isCylinderNode(node: ASTNode): node is CylinderNode {
  return node.type === 'cylinder';
}

/**
 * Type guard for primitive nodes (cube, sphere, cylinder)
 * 
 * @param node - AST node to check
 * @returns True if node is a primitive
 */
export function isPrimitiveNode(node: ASTNode): node is CubeNode | SphereNode | CylinderNode {
  return isCubeNode(node) || isSphereNode(node) || isCylinderNode(node);
}

// ============================================================================
// TRANSFORMATION NODE TYPE GUARDS
// ============================================================================

/**
 * Type guard for TranslateNode
 * 
 * @param node - AST node to check
 * @returns True if node is a TranslateNode
 */
export function isTranslateNode(node: ASTNode): node is TranslateNode {
  return node.type === 'translate';
}

/**
 * Type guard for RotateNode
 * 
 * @param node - AST node to check
 * @returns True if node is a RotateNode
 */
export function isRotateNode(node: ASTNode): node is RotateNode {
  return node.type === 'rotate';
}

/**
 * Type guard for ScaleNode
 *
 * @param node - AST node to check
 * @returns True if node is a ScaleNode
 */
export function isScaleNode(node: ASTNode): node is ScaleNode {
  return node.type === 'scale';
}

/**
 * Type guard for MirrorNode
 *
 * @param node - AST node to check
 * @returns True if node is a MirrorNode
 */
export function isMirrorNode(node: ASTNode): node is MirrorNode {
  return node.type === 'mirror';
}

/**
 * Type guard for transformation nodes (translate, rotate, scale, mirror)
 *
 * @param node - AST node to check
 * @returns True if node is a transformation
 */
export function isTransformNode(node: ASTNode): node is TranslateNode | RotateNode | ScaleNode | MirrorNode {
  return isTranslateNode(node) || isRotateNode(node) || isScaleNode(node) || isMirrorNode(node);
}

// ============================================================================
// CSG OPERATION NODE TYPE GUARDS
// ============================================================================

/**
 * Type guard for UnionNode
 * 
 * @param node - AST node to check
 * @returns True if node is a UnionNode
 */
export function isUnionNode(node: ASTNode): node is UnionNode {
  return node.type === 'union';
}

/**
 * Type guard for DifferenceNode
 * 
 * @param node - AST node to check
 * @returns True if node is a DifferenceNode
 */
export function isDifferenceNode(node: ASTNode): node is DifferenceNode {
  return node.type === 'difference';
}

/**
 * Type guard for IntersectionNode
 * 
 * @param node - AST node to check
 * @returns True if node is an IntersectionNode
 */
export function isIntersectionNode(node: ASTNode): node is IntersectionNode {
  return node.type === 'intersection';
}

/**
 * Type guard for CSG operation nodes (union, difference, intersection)
 * 
 * @param node - AST node to check
 * @returns True if node is a CSG operation
 */
export function isCSGOperationNode(node: ASTNode): node is UnionNode | DifferenceNode | IntersectionNode {
  return isUnionNode(node) || isDifferenceNode(node) || isIntersectionNode(node);
}

// ============================================================================
// GENERAL NODE TYPE GUARDS
// ============================================================================

/**
 * Type guard for AssignmentNode
 *
 * @param node - AST node to check
 * @returns True if node is an AssignmentNode
 */
export function isAssignmentNode(node: ASTNode): node is AssignmentNode {
  return node.type === 'assignment';
}

/**
 * Type guard for ModuleDefinitionNode
 *
 * @param node - AST node to check
 * @returns True if node is a ModuleDefinitionNode
 */
export function isModuleDefinitionNode(node: ASTNode): node is ModuleDefinitionNode {
  return node.type === 'module_definition';
}

/**
 * Type guard for ModuleInstantiationNode
 *
 * @param node - AST node to check
 * @returns True if node is a ModuleInstantiationNode
 */
export function isModuleInstantiationNode(node: ASTNode): node is ModuleInstantiationNode {
  return node.type === 'module_instantiation';
}

/**
 * Type guard for SpecialVariableAssignment
 *
 * @param node - AST node to check
 * @returns True if node is a SpecialVariableAssignment
 */
export function isSpecialVariableAssignmentNode(node: ASTNode): node is SpecialVariableAssignment {
  return node.type === 'specialVariableAssignment';
}

/**
 * Type guard for IfNode
 *
 * @param node - AST node to check
 * @returns True if node is an IfNode
 */
export function isIfNode(node: ASTNode): node is IfNode {
  return node.type === 'if';
}



// ============================================================================
// PARAMETER VALUE UTILITIES
// ============================================================================

/**
 * Safely extract a number value from ParameterValue
 * 
 * @param param - Parameter value to extract from
 * @param defaultValue - Default value if extraction fails
 * @returns Extraction result with number value
 */
export function extractNumber(
  param: ParameterValue, 
  defaultValue: number = 0
): ExtractionResult<number> {
  if (typeof param === 'number') {
    return { success: true, value: param };
  }
  
  if (typeof param === 'string') {
    const parsed = parseFloat(param);
    if (!isNaN(parsed)) {
      return { success: true, value: parsed };
    }
  }
  
  return { 
    success: false, 
    error: `Cannot extract number from parameter: ${String(param)}. Using default: ${defaultValue}` 
  };
}

/**
 * Safely extract a boolean value from ParameterValue
 * 
 * @param param - Parameter value to extract from
 * @param defaultValue - Default value if extraction fails
 * @returns Extraction result with boolean value
 */
export function extractBoolean(
  param: ParameterValue, 
  defaultValue: boolean = false
): ExtractionResult<boolean> {
  if (typeof param === 'boolean') {
    return { success: true, value: param };
  }
  
  if (typeof param === 'string') {
    const lower = param.toLowerCase();
    if (lower === 'true' || lower === '1') {
      return { success: true, value: true };
    }
    if (lower === 'false' || lower === '0') {
      return { success: true, value: false };
    }
  }
  
  if (typeof param === 'number') {
    return { success: true, value: param !== 0 };
  }
  
  return { 
    success: false, 
    error: `Cannot extract boolean from parameter: ${String(param)}. Using default: ${defaultValue}` 
  };
}

/**
 * Safely extract Vector3D from ParameterValue
 * 
 * @param param - Parameter value to extract from
 * @param defaultValue - Default value if extraction fails
 * @returns Extraction result with Vector3D value
 */
export function extractVector3D(
  param: ParameterValue, 
  defaultValue: readonly [number, number, number] = [0, 0, 0]
): ExtractionResult<readonly [number, number, number]> {  // Handle Vector3D type
  if (Array.isArray(param) && param.length >= 3) {
    const x = typeof param[0] === 'number' ? param[0] : 0;
    const y = typeof param[1] === 'number' ? param[1] : 0;
    const z = typeof param[2] === 'number' ? param[2] : 0;
    return { success: true, value: Object.freeze([x, y, z]) as readonly [number, number, number] };
  }
  
  // Handle single number (uniform scaling)
  if (typeof param === 'number') {
    return { success: true, value: Object.freeze([param, param, param]) as readonly [number, number, number] };
  }
  
  return { 
    success: false, 
    error: `Cannot extract Vector3D from parameter: ${String(param)}. Using default: [${defaultValue.join(', ')}]` 
  };
}

/**
 * Safely extract Vector2D from ParameterValue
 * 
 * @param param - Parameter value to extract from
 * @param defaultValue - Default value if extraction fails
 * @returns Extraction result with Vector2D value
 */
export function extractVector2D(
  param: ParameterValue, 
  defaultValue: readonly [number, number] = [0, 0]
): ExtractionResult<readonly [number, number]> {  // Handle Vector2D type
  if (Array.isArray(param) && param.length >= 2) {
    const x = typeof param[0] === 'number' ? param[0] : 0;
    const y = typeof param[1] === 'number' ? param[1] : 0;
    return { success: true, value: Object.freeze([x, y]) as readonly [number, number] };
  }
  
  // Handle single number (uniform scaling)
  if (typeof param === 'number') {
    return { success: true, value: Object.freeze([param, param]) as readonly [number, number] };
  }
  
  return { 
    success: false, 
    error: `Cannot extract Vector2D from parameter: ${String(param)}. Using default: [${defaultValue.join(', ')}]` 
  };
}

// ============================================================================
// SPECIALIZED PARAMETER EXTRACTORS
// ============================================================================

/**
 * Extract cube size parameters with validation
 * 
 * @param cubeNode - CubeNode to extract size from
 * @returns Extraction result with cube dimensions
 */
export function extractCubeSize(cubeNode: CubeNode): ExtractionResult<readonly [number, number, number]> {
  if (!cubeNode.size) {
    return { success: false, error: 'Cube node missing size parameter' };
  }
  
  return extractVector3D(cubeNode.size, [1, 1, 1]);
}

/**
 * Extract sphere radius with validation
 * 
 * @param sphereNode - SphereNode to extract radius from
 * @returns Extraction result with sphere radius
 */
export function extractSphereRadius(sphereNode: SphereNode): ExtractionResult<number> {
  // Prefer radius over diameter
  if (sphereNode.radius !== undefined) {
    return extractNumber(sphereNode.radius, 1);
  }
  
  if (sphereNode.diameter !== undefined) {
    const diameterResult = extractNumber(sphereNode.diameter, 2);
    if (diameterResult.success) {
      return { success: true, value: diameterResult.value / 2 };
    }
    return { success: false, error: 'Invalid diameter parameter' };
  }
  
  return { success: false, error: 'Sphere node missing radius/diameter parameter' };
}

/**
 * Extract cylinder parameters with validation
 * 
 * @param cylinderNode - CylinderNode to extract parameters from
 * @returns Extraction result with cylinder parameters
 */
export function extractCylinderParams(
  cylinderNode: CylinderNode
): ExtractionResult<{ radius: number; height: number }> {
  // Height is required (using 'h' property)
  if (!cylinderNode.h) {
    return { success: false, error: 'Cylinder node missing height parameter' };
  }
    const heightResult = extractNumber(cylinderNode.h, 1);
  if (!heightResult.success) {
    const errorMessage = `Invalid height parameter: ${heightResult.error}`;
    return { success: false, error: errorMessage };
  }
  
  // Radius calculation (prefer radius over diameter)
  let radius = 1; // default
  
  if (cylinderNode.r !== undefined) {
    const radiusResult = extractNumber(cylinderNode.r, 1);
    if (radiusResult.success) {
      radius = radiusResult.value;
    }
  } else if (cylinderNode.d !== undefined) {
    const diameterResult = extractNumber(cylinderNode.d, 2);
    if (diameterResult.success) {
      radius = diameterResult.value / 2;
    }
  }
  
  return {
    success: true,
    value: {
      radius,
      height: heightResult.value
    }
  };
}

/**
 * Extract translation vector from TranslateNode
 * 
 * @param translateNode - TranslateNode to extract vector from
 * @returns Extraction result with translation vector
 */
export function extractTranslationVector(
  translateNode: TranslateNode
): ExtractionResult<readonly [number, number, number]> {
  if (!translateNode.v) {
    return { success: false, error: 'Translate node missing vector parameter' };
  }
  
  return extractVector3D(translateNode.v, [0, 0, 0]);
}

/**
 * Extract scale vector from ScaleNode
 * 
 * @param scaleNode - ScaleNode to extract vector from
 * @returns Extraction result with scale vector
 */
export function extractScaleVector(
  scaleNode: ScaleNode
): ExtractionResult<readonly [number, number, number]> {
  if (!scaleNode.v) {
    return { success: false, error: 'Scale node missing vector parameter' };
  }
  
  return extractVector3D(scaleNode.v, [1, 1, 1]); // Default scale is [1,1,1]
}

// ============================================================================
// NODE VALIDATION UTILITIES
// ============================================================================

/**
 * Validate that a node has required location information
 * 
 * @param node - AST node to validate
 * @returns True if node has valid location
 */
export function hasValidLocation(node: BaseNode): node is BaseNode & { location: SourceLocation } {
  return node.location !== undefined && 
         node.location.start !== undefined && 
         node.location.end !== undefined;
}

/**
 * Validate that a node has children (for container nodes)
 * 
 * @param node - AST node to validate
 * @returns True if node has children array
 */
export function hasChildren(node: ASTNode): node is ASTNode & { children: ASTNode[] } {
  return 'children' in node && Array.isArray((node as any).children);
}

/**
 * Validate that all children in a node are non-null
 * 
 * @param node - AST node with children to validate
 * @returns True if all children are valid
 */
export function hasValidChildren(node: ASTNode & { children: ASTNode[] }): boolean {
  return node.children.length > 0 && node.children.every(child => child !== null && child !== undefined);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a human-readable description of an AST node
 * 
 * @param node - AST node to describe
 * @returns Human-readable description
 */
export function getNodeDescription(node: ASTNode): string {
  switch (node.type) {
    case 'cube':
      return `Cube primitive`;
    case 'sphere':
      return `Sphere primitive`;
    case 'cylinder':
      return `Cylinder primitive`;
    case 'translate':
      return `Translation transformation`;
    case 'rotate':
      return `Rotation transformation`;
    case 'scale':
      return `Scale transformation`;
    case 'union':
      return `Union CSG operation`;
    case 'difference':
      return `Difference CSG operation`;
    case 'intersection':
      return `Intersection CSG operation`;
    default:
      return `${node.type} node`;
  }
}

/**
 * Check if a parameter value represents an expression that needs evaluation
 * 
 * @param param - Parameter value to check
 * @returns True if parameter is an expression node
 */
export function isExpressionParameter(param: ParameterValue): param is ExpressionNode {
  return param !== null && 
         param !== undefined && 
         typeof param === 'object' && 
         'type' in param &&
         typeof (param as any).type === 'string';
}

/**
 * Check if a parameter value represents an error
 * 
 * @param param - Parameter value to check
 * @returns True if parameter is an error node
 */
export function isErrorParameter(param: ParameterValue): param is ErrorNode {
  return isExpressionParameter(param) && (param as any).type === 'error';
}
