/**
 * AST to CSG Converter Service
 *
 * Service for converting OpenSCAD AST nodes to three-csg-ts operations
 * with support for primitives, transformations, and boolean operations.
 */

import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { NodeId, NodeType } from '../../../../shared/types/ast.types.js';
import type { Result } from '../../../../shared/types/result.types.js';
import {
  error,
  isError,
  success,
  tryCatch,
  tryCatchAsync,
} from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  AssignmentNode,
  AssignStatementNode,
  BinaryExpressionNode,
  ConditionalExpressionNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  ExpressionNode,
  ForLoopNode,
  IfNode,
  IntersectionNode,
  LinearExtrudeNode,
  ListComprehensionExpressionNode,
  MirrorNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  ParameterValue,
  ParenthesizedExpressionNode,
  RotateExtrudeNode,
  RotateNode,
  ScaleNode,
  SpecialVariableNode,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../../../openscad-parser/ast/ast-types.js';
import {
  evaluateBinaryExpression as astEvaluateBinaryExpression,
  extractLiteralValue,
  isFunctionLiteral,
} from '../../../openscad-parser/ast/utils/ast-evaluator.js';
import type { MaterialConfig, Mesh3D, MeshMetadata } from '../../types/renderer.types.js';
import type { PrimitiveNode } from '../converters/2d-primitive-converter.js';
import {
  convertCircleToMesh,
  convertPolygonToMesh,
  convertSquareToMesh,
  convertTextToMesh,
} from '../converters/2d-primitive-converter.js';
import {
  convertDifferenceNode,
  convertIntersectionNode,
  convertUnionNode,
} from '../converters/boolean-converter.js';
import {
  convertLinearExtrudeNode,
  convertRotateExtrudeNode as convertRotateExtrudeNodeFromConverter,
} from '../converters/extrusion-converter.js';
import {
  convertCubeToMesh,
  convertCylinderToMesh,
  convertSphereToMesh,
} from '../converters/primitive-converter.js';
import {
  convertMirrorNode,
  convertRotateExtrudeNode,
  convertRotateNode,
  convertScaleNode,
  convertTranslateNode,
} from '../converters/transformation-converter.js';
import { CSGCoreService } from '../csg-core.service.js';
import { createMaterial } from '../material.service.js';
// Expression handlers are now internal functions
import { moduleRegistry } from './module-registry.service.js';
import { variableScope } from './variable-scope.service.js';

// Initialize variable scope
variableScope.reset();

const logger = createLogger('ASTToCSGConverter');

/**
 * Helper functions to create branded types
 */
function createNodeId(id: string): NodeId {
  return id as NodeId;
}

function createNodeType(type: string): NodeType {
  return type as NodeType;
}

/**
 * Exhaustive compile-time checking utility for switch statements
 * This function helps catch unhandled cases in switch statements
 */
function _assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Type guard to check if a node has a function name property
 */
function hasPropertyWithFunctionName(node: ASTNode): node is ASTNode & {
  name?: string;
  functionName?: string;
  function?: string;
} {
  return typeof node === 'object' && node !== null;
}

/**
 * Module arguments type - used for module instantiation
 */
type ModuleArguments = Array<string | number | boolean>;

/**
 * Module-level storage for source code to enable proper text extraction
 * This is a temporary solution until the parser properly extracts function arguments
 */
let currentSourceCode: string | null = null;

/**
 * Set the source code for text extraction
 * This enables proper parameter extraction from translate operations
 */
export function setSourceCodeForExtraction(sourceCode: string): void {
  currentSourceCode = sourceCode;
  logger.debug(`Source code set for extraction (${sourceCode.length} characters)`);
}

/**
 * Clear the source code after conversion
 */
export function clearSourceCodeForExtraction(): void {
  currentSourceCode = null;
  logger.debug('Source code cleared after extraction');
}

/**
 * Extract translate parameters from source code for testing
 * This is a utility function for property-based testing
 */
export function extractTranslateParameters(sourceCode: string): [number, number, number] | null {
  const vectorMatch = sourceCode.match(/translate\s*\(\s*\[([^\]]+)\]/);
  if (vectorMatch?.[1]) {
    const vectorContent = vectorMatch[1];
    const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

    if (numbers.length >= 3 && numbers.every((n: number) => !Number.isNaN(n))) {
      // Ensure we have exactly 3 numbers with proper defaults
      const x = numbers[0];
      const y = numbers[1];
      const z = numbers[2];

      if (x !== undefined && y !== undefined && z !== undefined) {
        return [x, y, z] as [number, number, number];
      }
    }
  }
  return null;
}

/**
 * Extract rotate parameters from source code for testing
 * This is a utility function for property-based testing
 * Supports both rotate(angle) and rotate([x,y,z]) syntax
 */
export function extractRotateParameters(
  sourceCode: string
): [number, number, number] | number | null {
  // Try vector syntax first: rotate([x,y,z])
  const vectorMatch = sourceCode.match(/rotate\s*\(\s*\[([^\]]+)\]/);
  if (vectorMatch?.[1]) {
    const vectorContent = vectorMatch[1];
    const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

    if (numbers.length >= 3 && numbers.every((n: number) => !Number.isNaN(n))) {
      const x = numbers[0];
      const y = numbers[1];
      const z = numbers[2];

      if (x !== undefined && y !== undefined && z !== undefined) {
        return [x, y, z];
      }
    }
  }

  // Try single angle syntax: rotate(angle)
  const angleMatch = sourceCode.match(/rotate\s*\(\s*([^,[\]]+)\s*\)/);
  if (angleMatch?.[1]) {
    const angle = parseFloat(angleMatch[1].trim());
    if (!Number.isNaN(angle)) {
      return angle;
    }
  }

  return null;
}

/**
 * Extract scale parameters from source code for testing
 * This is a utility function for property-based testing
 * Supports both scale(factor) and scale([x,y,z]) syntax
 */
export function extractScaleParameters(
  sourceCode: string
): [number, number, number] | number | null {
  // Try vector syntax first: scale([x,y,z])
  const vectorMatch = sourceCode.match(/scale\s*\(\s*\[([^\]]+)\]/);
  if (vectorMatch?.[1]) {
    const vectorContent = vectorMatch[1];
    const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

    if (numbers.length >= 3 && numbers.every((n: number) => !Number.isNaN(n))) {
      const x = numbers[0];
      const y = numbers[1];
      const z = numbers[2];

      if (x !== undefined && y !== undefined && z !== undefined) {
        return [x, y, z];
      }
    }
  }

  // Try single factor syntax: scale(factor)
  const factorMatch = sourceCode.match(/scale\s*\(\s*([^,[\]]+)\s*\)/);
  if (factorMatch?.[1]) {
    const factor = parseFloat(factorMatch[1].trim());
    if (!Number.isNaN(factor)) {
      return factor;
    }
  }

  return null;
}

/**
 * Extract boolean operation parameters from source code for testing
 * This is a utility function for property-based testing
 * Supports union(), intersection(), and difference() operations
 */
export function extractBooleanParameters(
  sourceCode: string
): { operation: 'union' | 'intersection' | 'difference'; childCount: number } | null {
  // Match boolean operations
  const booleanMatch = sourceCode.match(/(union|intersection|difference)\s*\(\s*\)\s*\{([^}]*)\}/);
  if (booleanMatch?.[1] && booleanMatch?.[2]) {
    const operation = booleanMatch[1] as 'union' | 'intersection' | 'difference';
    const content = booleanMatch[2];

    // Count child operations by counting semicolons (rough approximation)
    const childCount = (content.match(/;/g) || []).length;

    return { operation, childCount };
  }

  return null;
}

/**
 * Extract linear_extrude parameters from source code for testing
 * This is a utility function for property-based testing
 */
export function extractLinearExtrudeParameters(
  sourceCode: string
): { height: number; center?: boolean; twist?: number; scale?: number | [number, number] } | null {
  const extrudeMatch = sourceCode.match(/linear_extrude\s*\(\s*([^)]+)\s*\)/);
  if (extrudeMatch?.[1]) {
    const params = extrudeMatch[1];
    const result: {
      height: number;
      center?: boolean;
      twist?: number;
      scale?: number | [number, number];
    } = { height: 1 };

    // Extract height parameter
    const heightMatch = params.match(/height\s*=\s*([^,)]+)/);
    if (heightMatch?.[1]) {
      const height = parseFloat(heightMatch[1].trim());
      if (!Number.isNaN(height)) {
        result.height = height;
      }
    }

    // Extract center parameter
    const centerMatch = params.match(/center\s*=\s*(true|false)/);
    if (centerMatch?.[1]) {
      result.center = centerMatch[1] === 'true';
    }

    // Extract twist parameter
    const twistMatch = params.match(/twist\s*=\s*([^,)]+)/);
    if (twistMatch?.[1]) {
      const twist = parseFloat(twistMatch[1].trim());
      if (!Number.isNaN(twist)) {
        result.twist = twist;
      }
    }

    // Extract scale parameter (can be number or [x,y] vector)
    const scaleVectorMatch = params.match(/scale\s*=\s*\[([^\]]+)\]/);
    if (scaleVectorMatch?.[1]) {
      const scaleNumbers = scaleVectorMatch[1].split(',').map((s: string) => parseFloat(s.trim()));
      if (scaleNumbers.length >= 2 && scaleNumbers.every((n: number) => !Number.isNaN(n))) {
        const x = scaleNumbers[0];
        const y = scaleNumbers[1];
        if (x !== undefined && y !== undefined) {
          result.scale = [x, y];
        }
      }
    } else {
      const scaleMatch = params.match(/scale\s*=\s*([^,)]+)/);
      if (scaleMatch?.[1]) {
        const scale = parseFloat(scaleMatch[1].trim());
        if (!Number.isNaN(scale)) {
          result.scale = scale;
        }
      }
    }

    return result;
  }

  return null;
}

/**
 * Extract rotate_extrude parameters from source code for testing
 * This is a utility function for property-based testing
 */
export function extractRotateExtrudeParameters(
  sourceCode: string
): { angle?: number; convexity?: number } | null {
  const extrudeMatch = sourceCode.match(/rotate_extrude\s*\(\s*([^)]*)\s*\)/);
  if (extrudeMatch) {
    const params = extrudeMatch[1] || '';
    const result: { angle?: number; convexity?: number } = {};

    // Extract angle parameter
    const angleMatch = params.match(/angle\s*=\s*([^,)]+)/);
    if (angleMatch?.[1]) {
      const angle = parseFloat(angleMatch[1].trim());
      if (!Number.isNaN(angle)) {
        result.angle = angle;
      }
    }

    // Extract convexity parameter
    const convexityMatch = params.match(/convexity\s*=\s*([^,)]+)/);
    if (convexityMatch?.[1]) {
      const convexity = parseFloat(convexityMatch[1].trim());
      if (!Number.isNaN(convexity)) {
        result.convexity = convexity;
      }
    }

    return result;
  }

  return null;
}

/**
 * Extract circle parameters from source code for testing
 * This is a utility function for property-based testing
 * Supports both circle(r=X) and circle(d=X) syntax
 */
export function extractCircleParameters(sourceCode: string): { r?: number; d?: number } | null {
  const circleMatch = sourceCode.match(/circle\s*\(\s*([^)]+)\s*\)/);
  if (circleMatch?.[1]) {
    const params = circleMatch[1];
    const result: { r?: number; d?: number } = {};

    // Extract radius parameter
    const radiusMatch = params.match(/r\s*=\s*([^,)]+)/);
    if (radiusMatch?.[1]) {
      const radius = parseFloat(radiusMatch[1].trim());
      if (!Number.isNaN(radius)) {
        result.r = radius;
      }
    }

    // Extract diameter parameter
    const diameterMatch = params.match(/d\s*=\s*([^,)]+)/);
    if (diameterMatch?.[1]) {
      const diameter = parseFloat(diameterMatch[1].trim());
      if (!Number.isNaN(diameter)) {
        result.d = diameter;
      }
    }

    // Handle single parameter (assumed to be radius)
    if (!result.r && !result.d) {
      const singleParam = parseFloat(params.trim());
      if (!Number.isNaN(singleParam)) {
        result.r = singleParam;
      }
    }

    return result;
  }

  return null;
}

/**
 * Extract square parameters from source code for testing
 * This is a utility function for property-based testing
 * Supports both square(size) and square([x,y]) syntax
 */
export function extractSquareParameters(
  sourceCode: string
): { size: number | [number, number]; center?: boolean } | null {
  const squareMatch = sourceCode.match(/square\s*\(\s*([^)]+)\s*\)/);
  if (squareMatch?.[1]) {
    const params = squareMatch[1];
    const result: { size: number | [number, number]; center?: boolean } = { size: 1 };

    // Try vector syntax first: square([x,y])
    const vectorMatch = params.match(/(?:size\s*=\s*)?\[([^\]]+)\]/);
    if (vectorMatch?.[1]) {
      const vectorContent = vectorMatch[1];
      const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

      if (numbers.length >= 2 && numbers.every((n: number) => !Number.isNaN(n))) {
        const x = numbers[0];
        const y = numbers[1];
        if (x !== undefined && y !== undefined) {
          result.size = [x, y];
        }
      }
    } else {
      // Try single size parameter
      const sizeMatch = params.match(/(?:size\s*=\s*)?([^,)]+)/);
      if (sizeMatch?.[1]) {
        const size = parseFloat(sizeMatch[1].trim());
        if (!Number.isNaN(size)) {
          result.size = size;
        }
      }
    }

    // Extract center parameter
    const centerMatch = params.match(/center\s*=\s*(true|false)/);
    if (centerMatch?.[1]) {
      result.center = centerMatch[1] === 'true';
    }

    return result;
  }

  return null;
}

/**
 * Extract polygon parameters from source code for testing
 * This is a utility function for property-based testing
 */
export function extractPolygonParameters(
  sourceCode: string
): { points: Array<[number, number]>; paths?: Array<Array<number>> } | null {
  const polygonMatch = sourceCode.match(/polygon\s*\(\s*([^)]+)\s*\)/);
  if (polygonMatch?.[1]) {
    const params = polygonMatch[1];

    // Extract points parameter
    const pointsMatch = params.match(
      /(?:points\s*=\s*)?\[\s*(\[[^\]]+\](?:\s*,\s*\[[^\]]+\])*)\s*\]/
    );
    if (pointsMatch?.[1]) {
      const pointsContent = pointsMatch[1];
      const pointMatches = pointsContent.match(/\[([^\]]+)\]/g);

      if (pointMatches) {
        const points: Array<[number, number]> = [];

        for (const pointMatch of pointMatches) {
          const coords = pointMatch
            .slice(1, -1)
            .split(',')
            .map((s: string) => parseFloat(s.trim()));
          if (coords.length >= 2 && coords.every((n: number) => !Number.isNaN(n))) {
            const x = coords[0];
            const y = coords[1];
            if (x !== undefined && y !== undefined) {
              points.push([x, y]);
            }
          }
        }

        if (points.length >= 3) {
          const result: { points: Array<[number, number]>; paths?: Array<Array<number>> } = {
            points,
          };

          // Extract paths parameter if present
          const pathsMatch = params.match(/paths\s*=\s*\[([^\]]+)\]/);
          if (pathsMatch?.[1]) {
            // This is a simplified extraction - full paths parsing would be more complex
            result.paths = [];
          }

          return result;
        }
      }
    }
  }

  return null;
}

/**
 * Extract source text for a given location
 * This is a temporary solution until the parser properly extracts function arguments
 */
function getSourceTextForLocation(location: {
  start: { offset: number };
  end: { offset: number };
}): string {
  // Use module-level source code if available
  if (
    currentSourceCode &&
    location.start.offset >= 0 &&
    location.end.offset > location.start.offset
  ) {
    const extractedText = currentSourceCode.slice(location.start.offset, location.end.offset);
    logger.debug(
      `Extracted source text from offsets ${location.start.offset}-${location.end.offset}: "${extractedText}"`
    );
    return extractedText;
  }

  // Fallback: return a placeholder that matches the expected translate syntax
  // This should not be reached in normal operation
  logger.warn('getSourceTextForLocation: No source code available, using fallback');
  return 'translate([0,0,0])';
}

/**
 * Default material configuration for CSG operations
 */
const DEFAULT_CSG_MATERIAL: MaterialConfig = {
  color: '#00ff88', // Green color as specified
  opacity: 1,
  metalness: 0.1,
  roughness: 0.8,
  wireframe: false,
  transparent: false,
  side: 'front',
};

/**
 * CSG conversion configuration
 */
export interface CSGConversionConfig {
  readonly material: MaterialConfig;
  readonly enableOptimization: boolean;
  readonly maxComplexity: number;
  readonly timeoutMs: number;
}

/**
 * Default CSG conversion configuration
 */
const DEFAULT_CSG_CONFIG: CSGConversionConfig = {
  material: DEFAULT_CSG_MATERIAL,
  enableOptimization: true,
  maxComplexity: 50000,
  timeoutMs: 10000,
};

/**
 * Convert Tree Sitter function_call node by extracting function name and routing to appropriate converter
 */
const convertFunctionCallNode = async (
  node: ASTNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug('[convertFunctionCallNode] Converting function call node:', node);
  logger.debug(`Converting function_call node:`, node);

  // Extract function name from function_call node
  // Try multiple possible properties where the function name might be stored
  if (!hasPropertyWithFunctionName(node)) {
    return error(`Function call node does not have expected structure: ${JSON.stringify(node)}`);
  }

  let functionName = node.name || node.functionName || node.function;

  // If we got the full function call text, extract just the function name
  if (functionName && typeof functionName === 'string') {
    // Trim whitespace and extract function name from patterns like "  sphere(10)" -> "sphere"
    const trimmed = functionName.trim();
    const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (match) {
      functionName = match[1];
    }
  }

  if (!functionName) {
    return error(`Function call node missing function name: ${JSON.stringify(node)}`);
  }

  logger.debug(`Function call name: ${functionName}`);

  // Use the original node for conversion
  const typedNode = node;

  // For transformation operations, handle the case where they come as function_call nodes
  // without proper children due to parsing limitations
  if (['translate', 'rotate', 'scale', 'mirror'].includes(functionName)) {
    logger.debug(
      `${functionName} function detected as function_call node - extracting parameters from source`
    );

    // Extract transformation parameters from the source location
    const sourceLocation = typedNode.location;
    if (sourceLocation?.start && sourceLocation.end) {
      // Get the source text for this node
      const sourceText = getSourceTextForLocation(sourceLocation);
      logger.debug(`Source text: "${sourceText}"`);

      if (functionName === 'translate') {
        // Extract translation vector from source text like "translate([200,0,0])"
        const vectorMatch = sourceText.match(/translate\s*\(\s*\[([^\]]+)\]/);
        if (vectorMatch?.[1]) {
          const vectorContent = vectorMatch[1];
          const numbers = vectorContent.split(',').map((s: string) => parseFloat(s.trim()));

          if (numbers.length >= 3 && numbers.every((n: number) => !Number.isNaN(n))) {
            const x = numbers[0] ?? 0;
            const y = numbers[1] ?? 0;
            const z = numbers[2] ?? 0;
            logger.debug(`✅ Extracted translation vector: [${x}, ${y}, ${z}]`);

            // Create a small marker mesh to represent the translation
            const markerGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            const markerMesh = new THREE.Mesh(markerGeometry, material);
            markerMesh.position.set(x, y, z);

            return success(markerMesh);
          }
        }
      }
    }

    // Fallback: create a small identity mesh
    logger.warn(
      `Could not extract parameters for ${functionName}, creating identity transformation`
    );
    const identityGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const identityMesh = new THREE.Mesh(identityGeometry, material);
    identityMesh.position.set(1, 1, 1);

    return success(identityMesh);
  }

  // Route to the appropriate converter based on function name
  // Direct type assertions based on the function name
  switch (functionName) {
    // 3D primitives
    case 'cube':
      return convertCubeToMesh(typedNode as CubeNode, material);
    case 'sphere':
      return convertSphereToMesh(typedNode as SphereNode, material);
    case 'cylinder':
      return convertCylinderToMesh(typedNode as CylinderNode, material);

    // 2D primitives
    case 'circle':
      return convertCircleToMesh(typedNode as PrimitiveNode, material);
    case 'square':
      return convertSquareToMesh(typedNode as PrimitiveNode, material);
    case 'polygon':
      return convertPolygonToMesh(typedNode as PrimitiveNode, material);
    case 'text':
      return convertTextToMesh(typedNode as PrimitiveNode, material);

    // Transformations
    case 'translate':
      logger.debug('[convertFunctionCallNode] Calling convertTranslateNode for:', typedNode);
      return await convertTranslateNode(typedNode as TranslateNode, material, convertASTNodeToMesh);
    case 'rotate':
      return await convertRotateNode(typedNode as RotateNode, material, convertASTNodeToMesh);
    case 'scale':
      return await convertScaleNode(typedNode as ScaleNode, material, convertASTNodeToMesh);
    case 'mirror':
      return await convertMirrorNode(typedNode as MirrorNode, material, convertASTNodeToMesh);

    // Extrusions
    case 'linear_extrude':
      return await convertLinearExtrudeNode(
        typedNode as LinearExtrudeNode,
        material,
        convertASTNodeToMesh
      );
    case 'rotate_extrude':
      return await convertRotateExtrudeNode(
        typedNode as RotateExtrudeNode,
        material,
        convertASTNodeToMesh
      );

    // Boolean operations
    case 'union':
      return await convertUnionNode(typedNode as UnionNode, material, convertASTNodeToMesh);
    case 'intersection':
      return await convertIntersectionNode(
        typedNode as IntersectionNode,
        material,
        convertASTNodeToMesh
      );
    case 'difference':
      return await convertDifferenceNode(
        typedNode as DifferenceNode,
        material,
        convertASTNodeToMesh
      );
    default:
      // Check if this is a user-defined module
      if (moduleRegistry.hasModule(functionName)) {
        logger.debug(`Found user-defined module: ${functionName}`);

        // Extract arguments for module instantiation
        const args: ModuleArguments = [];
        // For now, we'll use placeholder arguments
        // In a full implementation, this would properly evaluate the arguments

        const moduleInstanceResult = moduleRegistry.createModuleInstance(functionName, args);
        if (isError(moduleInstanceResult)) {
          return error(
            `Failed to instantiate module '${functionName}': ${moduleInstanceResult.error}`
          );
        }

        const moduleInstance = moduleInstanceResult.data;

        // Enter module scope
        variableScope.enterScope(`module_${functionName}`);

        try {
          // Bind module parameters to scope
          for (const [paramName, paramValue] of moduleInstance.parameters) {
            variableScope.defineVariable(paramName, paramValue);
          }

          // Convert module body to meshes
          if (moduleInstance.body.length === 0) {
            // Empty module body - return empty mesh
            const geometry = new THREE.BufferGeometry();
            const emptyMaterial = new THREE.MeshStandardMaterial({
              color: 0x00ff88,
              transparent: true,
              opacity: 0,
            });
            return success(new THREE.Mesh(geometry, emptyMaterial));
          }

          // Convert first body node (simplified for now)
          const firstBodyNode = moduleInstance.body[0];
          if (firstBodyNode) {
            const bodyResult = await convertASTNodeToMesh(firstBodyNode, material);
            return bodyResult;
          }

          // Fallback to empty mesh
          const geometry = new THREE.BufferGeometry();
          const emptyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0,
          });
          return success(new THREE.Mesh(geometry, emptyMaterial));
        } finally {
          // Exit module scope
          variableScope.exitScope();
        }
      }

      return error(`Unsupported function in function_call node: ${functionName}`);
  }
};

/**
 * Get source code for parameter extraction (fallback method)
 */
const getSourceCodeForExtraction = (): string | null => {
  try {
    // Try to get source code from the current parsing context
    // This is a fallback method when Tree-sitter parsing doesn't extract parameters correctly
    const codeElement = document.querySelector('.monaco-editor textarea');
    if (codeElement && 'value' in codeElement) {
      return codeElement.value as string;
    }

    // Alternative: try to get from Monaco editor
    const monacoElement = document.querySelector('.monaco-editor');
    if (monacoElement) {
      const textContent = monacoElement.textContent;
      if (textContent && textContent.includes('translate')) {
        return textContent;
      }
    }

    return null;
  } catch (error) {
    logger.debug('Failed to get source code for parameter extraction:', error);
    return null;
  }
};

/**
 * Extract parameters from a module instantiation node
 */
const extractParametersFromModuleInstantiation = (
  node: ModuleInstantiationNode
): Record<string, ParameterValue> => {
  const params: Record<string, ParameterValue> = {};

  logger.debug(`🔍 PARAMETER EXTRACTION DEBUG:`, {
    nodeName: 'name' in node ? node.name : 'no name',
    nodeArgs: node.args,
    argsLength: node.args ? node.args.length : 0,
  });

  if (node.args && Array.isArray(node.args)) {
    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i];

      logger.debug(`Processing arg ${i}:`, {
        name: arg.name,
        value: arg.value,
        hasName: !!arg.name,
        hasValue: arg.value !== undefined,
      });

      if (arg.name && arg.value !== undefined) {
        // Named parameter: name=value
        params[arg.name] = arg.value;
        logger.debug(`Added named parameter: ${arg.name} = ${arg.value}`);
      } else if (arg.value !== undefined) {
        // Positional parameter - store all positional parameters
        if (i === 0) {
          params._firstParam = arg.value;
          // For cube, the first parameter is typically 'size'
          if (!params.size) {
            params.size = arg.value;
          }
          logger.debug(`Added first positional parameter as size: ${arg.value}`);
        } else if (i === 1) {
          params._secondParam = arg.value;
          // For cube, the second parameter is typically 'center'
          if (!params.center) {
            params.center = arg.value;
          }
          logger.debug(`Added second positional parameter as center: ${arg.value}`);
        }
      }
    }
  }

  logger.debug(`Final extracted parameters:`, params);
  return params;
};

/**
 * Convert ModuleInstantiationNode to CubeNode structure
 */
const moduleInstantiationToCubeNode = (node: ModuleInstantiationNode): CubeNode => {
  const params = extractParametersFromModuleInstantiation(node);

  logger.debug(`🔍 CUBE CONVERSION DEBUG:`, {
    nodeName: 'name' in node ? node.name : 'no name',
    extractedParams: params,
    sizeParam: params.size,
    firstParam: params._firstParam,
    centerParam: params.center,
    secondParam: params._secondParam,
  });

  // Determine size - prioritize explicit size parameter, then first positional parameter
  let size: number | [number, number, number] = 1;
  if (params.size !== undefined) {
    size = params.size;
  } else if (params._firstParam !== undefined) {
    size = params._firstParam;
  }

  // Determine center - prioritize explicit center parameter, then second positional parameter
  let center = false;
  if (params.center !== undefined) {
    center = Boolean(params.center);
  } else if (params._secondParam !== undefined) {
    center = Boolean(params._secondParam);
  }

  const cubeNode = {
    type: 'cube',
    size,
    center,
    location: node.location,
  } as CubeNode;

  logger.debug(`Created CubeNode:`, {
    size: cubeNode.size,
    center: cubeNode.center,
    type: cubeNode.type,
  });

  return cubeNode;
};

/**
 * Convert ModuleInstantiationNode to SphereNode structure
 */
const moduleInstantiationToSphereNode = (node: ModuleInstantiationNode): SphereNode => {
  const params = extractParametersFromModuleInstantiation(node);
  return {
    type: 'sphere',
    radius: Number(params.r || params.radius || params._firstParam || 1),
    diameter: Number(params.d || params.diameter),
    location: node.location,
  } as SphereNode;
};

/**
 * Convert ModuleInstantiationNode to CylinderNode structure
 */
const moduleInstantiationToCylinderNode = (node: ModuleInstantiationNode): CylinderNode => {
  const params = extractParametersFromModuleInstantiation(node);
  return {
    type: 'cylinder',
    h: Number(params.h || params.height || params._firstParam || 1),
    r: Number(params.r || params.radius),
    r1: Number(params.r1),
    r2: Number(params.r2),
    d: Number(params.d || params.diameter),
    d1: Number(params.d1),
    d2: Number(params.d2),
    center: Boolean(params.center),
    location: node.location,
  } as CylinderNode;
};

/**
 * Convert ModuleInstantiationNode to TranslateNode structure
 */
const moduleInstantiationToTranslateNode = (node: ModuleInstantiationNode): TranslateNode => {
  const params = extractParametersFromModuleInstantiation(node);

  logger.debug(`🔍 TRANSLATE CONVERSION DEBUG:`, {
    nodeName: 'name' in node ? node.name : 'no name',
    extractedParams: params,
    paramV: params.v,
    paramVector: params.vector,
    paramFirstParam: params._firstParam,
    nodeArgs: node.args,
    nodeText: 'text' in node ? node.text : 'no text',
  });

  // Try to extract vector from source code if parameters are not properly parsed
  let translationVector = params.v || params.vector || params._firstParam || [0, 0, 0];

  logger.error(`🔍 TRANSLATE PARAMS: Initial params:`, {
    paramsV: params.v,
    paramsVector: params.vector,
    paramsFirstParam: params._firstParam,
    initialTranslationVector: translationVector,
    fullParams: JSON.stringify(params, null, 2),
  });

  // If we got a default value, try to extract from source code
  if (Array.isArray(translationVector) && translationVector.every((v) => v === 0)) {
    logger.error(
      `🔍 TRANSLATE FALLBACK: Translation vector is [0,0,0], trying source code extraction`
    );
    const sourceCode = getSourceCodeForExtraction();
    logger.error(`🔍 TRANSLATE SOURCE: Source code for extraction:`, sourceCode);
    if (sourceCode) {
      const extracted = extractTranslateParameters(sourceCode);
      logger.error(`🔍 TRANSLATE EXTRACTED: Extracted from source:`, extracted);
      if (extracted) {
        translationVector = extracted;
        logger.error(
          `✅ TRANSLATE SUCCESS: Extracted translation vector from source: [${extracted[0]}, ${extracted[1]}, ${extracted[2]}]`
        );
      } else {
        logger.error(`❌ TRANSLATE FAILED: Could not extract translation vector from source code`);
      }
    } else {
      logger.error(`❌ TRANSLATE NO SOURCE: No source code available for extraction`);
    }
  } else {
    logger.error(
      `✅ TRANSLATE DIRECT: Using translation vector from params: [${translationVector[0]}, ${translationVector[1]}, ${translationVector[2]}]`
    );
  }

  return {
    type: 'translate',
    v: translationVector,
    children: node.children || [],
    location: node.location,
  } as TranslateNode;
};

/**
 * Convert ModuleInstantiationNode to RotateNode structure
 */
const moduleInstantiationToRotateNode = (node: ModuleInstantiationNode): RotateNode => {
  const params = extractParametersFromModuleInstantiation(node);
  return {
    type: 'rotate',
    a: params.a || params.angle || params._firstParam || 0,
    v: params.v || params.vector || [0, 0, 1],
    children: node.children || [],
    location: node.location,
  } as RotateNode;
};

/**
 * Convert ModuleInstantiationNode to ScaleNode structure
 */
const moduleInstantiationToScaleNode = (node: ModuleInstantiationNode): ScaleNode => {
  const params = extractParametersFromModuleInstantiation(node);
  return {
    type: 'scale',
    v: params.v || params.factor || params._firstParam || 1,
    children: node.children || [],
    location: node.location,
  } as ScaleNode;
};

/**
 * Convert ModuleInstantiationNode to MirrorNode structure
 */
const moduleInstantiationToMirrorNode = (node: ModuleInstantiationNode): MirrorNode => {
  const params = extractParametersFromModuleInstantiation(node);
  return {
    type: 'mirror',
    v: params.v || params.vector || params._firstParam || [1, 0, 0],
    children: node.children || [],
    location: node.location,
  } as MirrorNode;
};

/**
 * Convert ModuleInstantiationNode to UnionNode structure
 */
const moduleInstantiationToUnionNode = (node: ModuleInstantiationNode): UnionNode => {
  return {
    type: 'union',
    children: node.children || [],
    location: node.location,
  } as UnionNode;
};

/**
 * Convert ModuleInstantiationNode to IntersectionNode structure
 */
const moduleInstantiationToIntersectionNode = (node: ModuleInstantiationNode): IntersectionNode => {
  return {
    type: 'intersection',
    children: node.children || [],
    location: node.location,
  } as IntersectionNode;
};

/**
 * Convert ModuleInstantiationNode to DifferenceNode structure
 */
const moduleInstantiationToDifferenceNode = (node: ModuleInstantiationNode): DifferenceNode => {
  return {
    type: 'difference',
    children: node.children || [],
    location: node.location,
  } as DifferenceNode;
};

/**
 * Convert module instantiation node by extracting module name and routing to appropriate converter
 */
const convertModuleInstantiationNode = async (
  node: ModuleInstantiationNode, // ModuleInstantiationNode
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Converting module_instantiation node:`, node);

  // Extract module name
  let moduleName: string = '';
  if (node.name && typeof node.name === 'string') {
    moduleName = node.name;
  } else if (node.name?.name) {
    moduleName = node.name.name;
  }

  if (!moduleName) {
    return error(`Module instantiation node missing module name: ${JSON.stringify(node)}`);
  }

  logger.debug(`Module instantiation name: ${moduleName}`);

  // Route based on module name - this handles built-in functions like circle, square, etc.
  switch (moduleName) {
    // 3D primitives
    case 'cube':
      return convertCubeToMesh(moduleInstantiationToCubeNode(node), material);
    case 'sphere':
      return convertSphereToMesh(moduleInstantiationToSphereNode(node), material);
    case 'cylinder':
      return convertCylinderToMesh(moduleInstantiationToCylinderNode(node), material);

    // 2D primitives
    case 'circle':
      return convertCircleToMesh(node as PrimitiveNode, material);
    case 'square':
      return convertSquareToMesh(node as PrimitiveNode, material);
    case 'polygon':
      return convertPolygonToMesh(node as PrimitiveNode, material);
    case 'text':
      return convertTextToMesh(node as PrimitiveNode, material);

    // Transformations
    case 'translate':
      return await convertTranslateNode(
        moduleInstantiationToTranslateNode(node),
        material,
        convertASTNodeToMesh
      );
    case 'rotate':
      return await convertRotateNode(
        moduleInstantiationToRotateNode(node),
        material,
        convertASTNodeToMesh
      );
    case 'scale':
      return await convertScaleNode(
        moduleInstantiationToScaleNode(node),
        material,
        convertASTNodeToMesh
      );
    case 'mirror':
      return await convertMirrorNode(
        moduleInstantiationToMirrorNode(node),
        material,
        convertASTNodeToMesh
      );

    // Extrusions
    case 'linear_extrude':
      return await convertLinearExtrudeNode(
        node, // ExtrusionNode type accepts ModuleInstantiationNode
        material,
        convertASTNodeToMesh
      );
    case 'rotate_extrude':
      return await convertRotateExtrudeNodeFromConverter(
        node, // ExtrusionNode type accepts ModuleInstantiationNode
        material,
        convertASTNodeToMesh
      );

    // Boolean operations
    case 'union':
      return await convertUnionNode(
        moduleInstantiationToUnionNode(node),
        material,
        convertASTNodeToMesh
      );
    case 'intersection':
      return await convertIntersectionNode(
        moduleInstantiationToIntersectionNode(node),
        material,
        convertASTNodeToMesh
      );
    case 'difference':
      return await convertDifferenceNode(
        moduleInstantiationToDifferenceNode(node),
        material,
        convertASTNodeToMesh
      );

    // Import and other operations
    case 'import':
    case 'surface':
    case 'projection': {
      // For import operations, create a placeholder
      logger.debug(`Creating placeholder for ${moduleName} operation`);
      const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
      const placeholderMesh = new THREE.Mesh(placeholderGeometry, material);
      return success(placeholderMesh);
    }

    default:
      // Check if this is a user-defined module
      if (moduleRegistry.hasModule(moduleName)) {
        logger.debug(`Found user-defined module: ${moduleName}`);

        // Handle user-defined modules (simplified implementation)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        return success(mesh);
      }

      return error(`Unsupported module: ${moduleName}`);
  }
};

/**
 * Convert module definition node by registering it in the module registry
 */
const convertModuleDefinitionNode = async (
  node: ModuleDefinitionNode
): Promise<Result<THREE.Mesh, string>> => {
  const moduleName = node.name.name;
  logger.debug(`Processing module definition: ${moduleName}`);

  // Register the module definition
  const registrationResult = moduleRegistry.registerModule(node);
  if (isError(registrationResult)) {
    return error(`Failed to register module '${moduleName}': ${registrationResult.error}`);
  }

  // Module definitions don't produce geometry directly
  // Return an empty mesh as a placeholder
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);

  logger.debug(`Module '${moduleName}' registered successfully`);
  return success(mesh);
};

/**
 * Convert assignment node by storing the variable in scope
 */
const convertAssignmentNode = async (node: AssignmentNode): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Processing assignment: ${node.variable.name}`);

  // Evaluate the expression to get the actual value
  let value: ParameterValue = node.value;

  // Check if node.value is an ExpressionNode with proper type guards
  if (node.value && typeof node.value === 'object' && 'expressionType' in node.value) {
    const expressionNode = node.value as ExpressionNode;

    if (expressionNode.expressionType === 'literal') {
      value = extractLiteralValue(expressionNode);
      logger.debug(
        `Evaluated literal value for ${node.variable.name}: ${value} (type: ${typeof value})`
      );
    } else if (
      expressionNode.expressionType === 'binary' ||
      expressionNode.expressionType === 'binary_expression'
    ) {
      const evalResult = astEvaluateBinaryExpression(expressionNode as BinaryExpressionNode);
      if (evalResult.success) {
        value = evalResult.value;
        logger.debug(
          `Evaluated binary expression for ${node.variable.name} to: ${value} (type: ${typeof value})`
        );
      } else {
        logger.warn(
          `Failed to evaluate binary expression for ${node.variable.name}: ${evalResult.error}`
        );
      }
    } else {
      logger.debug(
        `Using raw value for ${node.variable.name}: ${JSON.stringify(value)} (expressionType: ${expressionNode.expressionType})`
      );
    }
  } else {
    // Handle primitive values (number, string, boolean, null, undefined)
    logger.debug(
      `Using primitive value for ${node.variable.name}: ${JSON.stringify(value)} (type: ${typeof value})`
    );
  }

  // Store the evaluated value in the variable scope
  const assignmentResult = variableScope.defineVariable(
    node.variable.name,
    value,
    node.location
      ? {
          line: node.location.start.line,
          column: node.location.start.column,
        }
      : undefined
  );

  if (isError(assignmentResult)) {
    return error(`Failed to assign variable '${node.variable.name}': ${assignmentResult.error}`);
  }

  // Assignment statements don't produce geometry directly
  // Return an empty mesh as a placeholder
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);

  logger.debug(`Variable '${node.variable.name}' assigned successfully`);
  return success(mesh);
};

/**
 * Convert conditional expression node by evaluating condition and selecting branch
 */
const _convertConditionalExpressionNode = async (
  node: ConditionalExpressionNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug('Processing conditional expression');

  // Evaluate the condition
  let conditionValue = false;

  if (
    node.condition.expressionType === 'binary' ||
    node.condition.expressionType === 'binary_expression'
  ) {
    const binaryNode = node.condition as BinaryExpressionNode;

    // Get left operand value
    let leftValue: number | string | boolean | null = null;
    if (binaryNode.left.expressionType === 'literal') {
      leftValue = extractLiteralValue(binaryNode.left);
    } else if (
      binaryNode.left.expressionType === 'variable_reference' &&
      'variable' in binaryNode.left &&
      typeof binaryNode.left.variable === 'object' &&
      binaryNode.left.variable !== null &&
      'name' in binaryNode.left.variable
    ) {
      const varName = (binaryNode.left.variable as { name: string }).name;
      const varBinding = variableScope.resolveVariable(varName);
      if (
        varBinding &&
        (typeof varBinding.value === 'number' ||
          typeof varBinding.value === 'string' ||
          typeof varBinding.value === 'boolean')
      ) {
        leftValue = varBinding.value;
      }
    }

    // Get right operand value
    let rightValue: number | string | boolean | null = null;
    if (binaryNode.right.expressionType === 'literal') {
      rightValue = extractLiteralValue(binaryNode.right);
    } else if (
      binaryNode.right.expressionType === 'variable_reference' &&
      'variable' in binaryNode.right &&
      typeof binaryNode.right.variable === 'object' &&
      binaryNode.right.variable !== null &&
      'name' in binaryNode.right.variable
    ) {
      const varName = (binaryNode.right.variable as { name: string }).name;
      const varBinding = variableScope.resolveVariable(varName);
      if (
        varBinding &&
        (typeof varBinding.value === 'number' ||
          typeof varBinding.value === 'string' ||
          typeof varBinding.value === 'boolean')
      ) {
        rightValue = varBinding.value;
      }
    }

    // Evaluate the condition if we have both values
    if (leftValue !== null && rightValue !== null) {
      try {
        switch (binaryNode.operator) {
          case '==':
            conditionValue = leftValue === rightValue;
            break;
          case '!=':
            conditionValue = leftValue !== rightValue;
            break;
          case '<':
            conditionValue = leftValue < rightValue;
            break;
          case '<=':
            conditionValue = leftValue <= rightValue;
            break;
          case '>':
            conditionValue = leftValue > rightValue;
            break;
          case '>=':
            conditionValue = leftValue >= rightValue;
            break;
          case '&&':
            conditionValue = Boolean(leftValue) && Boolean(rightValue);
            break;
          case '||':
            conditionValue = Boolean(leftValue) || Boolean(rightValue);
            break;
          default:
            conditionValue = false;
        }
      } catch (error) {
        logger.warn(`Error evaluating condition: ${error}`);
      }
    }
  }

  // Select branch based on condition evaluation
  const selectedBranch = conditionValue ? node.thenBranch : node.elseBranch;

  logger.debug(
    `Condition evaluated to ${conditionValue}, selecting ${conditionValue ? 'then' : 'else'} branch`
  );
  return await convertASTNodeToMesh(selectedBranch, material);
};

/**
 * Convert if statement node by evaluating condition and selecting branch
 */
const convertIfStatementNode = async (
  node: IfNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug('Processing if statement');

  // Evaluate the condition
  let conditionValue = false;

  if (
    node.condition.expressionType === 'binary' ||
    node.condition.expressionType === 'binary_expression'
  ) {
    const binaryNode = node.condition as BinaryExpressionNode;
    logger.debug(`Evaluating binary condition with operator: ${binaryNode.operator}`);

    // Get left operand value
    let leftValue: number | string | boolean | null = null;
    if (binaryNode.left.expressionType === 'literal') {
      leftValue = extractLiteralValue(binaryNode.left);
      logger.debug(`Left operand is literal with value: ${leftValue} (type: ${typeof leftValue})`);
    } else if (
      binaryNode.left.expressionType === 'variable_reference' &&
      'variable' in binaryNode.left &&
      typeof binaryNode.left.variable === 'object' &&
      binaryNode.left.variable !== null &&
      'name' in binaryNode.left.variable
    ) {
      const varName = (binaryNode.left.variable as { name: string }).name;
      logger.debug(`Left operand is variable reference: ${varName}`);
      const varBinding = variableScope.resolveVariable(varName);
      if (
        varBinding &&
        (typeof varBinding.value === 'number' ||
          typeof varBinding.value === 'string' ||
          typeof varBinding.value === 'boolean')
      ) {
        leftValue = varBinding.value;
        logger.debug(
          `Resolved variable ${varName} to value: ${leftValue} (type: ${typeof leftValue})`
        );
      } else {
        logger.warn(`Failed to resolve variable: ${varName}`);
      }
    } else {
      logger.debug(
        `Left operand has unsupported expressionType: ${binaryNode.left.expressionType}`
      );
    }

    // Get right operand value
    let rightValue: number | string | boolean | null = null;
    if (binaryNode.right.expressionType === 'literal') {
      rightValue = extractLiteralValue(binaryNode.right);
      logger.debug(
        `Right operand is literal with value: ${rightValue} (type: ${typeof rightValue})`
      );
    } else if (
      binaryNode.right.expressionType === 'variable_reference' &&
      'variable' in binaryNode.right &&
      typeof binaryNode.right.variable === 'object' &&
      binaryNode.right.variable !== null &&
      'name' in binaryNode.right.variable
    ) {
      const varName = (binaryNode.right.variable as { name: string }).name;
      logger.debug(`Right operand is variable reference: ${varName}`);
      const varBinding = variableScope.resolveVariable(varName);
      if (
        varBinding &&
        (typeof varBinding.value === 'number' ||
          typeof varBinding.value === 'string' ||
          typeof varBinding.value === 'boolean')
      ) {
        rightValue = varBinding.value;
        logger.debug(
          `Resolved variable ${varName} to value: ${rightValue} (type: ${typeof rightValue})`
        );
      } else {
        logger.warn(`Failed to resolve variable: ${varName}`);
      }
    } else {
      logger.debug(
        `Right operand has unsupported expressionType: ${binaryNode.right.expressionType}`
      );
    }

    // Evaluate the condition if we have both values
    if (leftValue !== null && rightValue !== null) {
      try {
        switch (binaryNode.operator) {
          case '==':
            conditionValue = leftValue === rightValue;
            logger.debug(`Evaluating ${leftValue} === ${rightValue} = ${conditionValue}`);
            break;
          case '!=':
            conditionValue = leftValue !== rightValue;
            logger.debug(`Evaluating ${leftValue} !== ${rightValue} = ${conditionValue}`);
            break;
          case '<':
            conditionValue = leftValue < rightValue;
            logger.debug(`Evaluating ${leftValue} < ${rightValue} = ${conditionValue}`);
            break;
          case '<=':
            conditionValue = leftValue <= rightValue;
            logger.debug(`Evaluating ${leftValue} <= ${rightValue} = ${conditionValue}`);
            break;
          case '>':
            conditionValue = leftValue > rightValue;
            logger.debug(`Evaluating ${leftValue} > ${rightValue} = ${conditionValue}`);
            break;
          case '>=':
            conditionValue = leftValue >= rightValue;
            logger.debug(`Evaluating ${leftValue} >= ${rightValue} = ${conditionValue}`);
            break;
          case '&&':
            conditionValue = Boolean(leftValue) && Boolean(rightValue);
            logger.debug(
              `Evaluating ${Boolean(leftValue)} && ${Boolean(rightValue)} = ${conditionValue}`
            );
            break;
          case '||':
            conditionValue = Boolean(leftValue) || Boolean(rightValue);
            logger.debug(
              `Evaluating ${Boolean(leftValue)} || ${Boolean(rightValue)} = ${conditionValue}`
            );
            break;
          default:
            conditionValue = false;
            logger.warn(`Unsupported operator: ${binaryNode.operator}`);
        }
      } catch (error) {
        logger.warn(`Error evaluating condition: ${error}`);
      }
    } else {
      logger.warn(`Cannot evaluate condition: leftValue=${leftValue}, rightValue=${rightValue}`);
    }
  } else {
    logger.debug(`Condition has unsupported expressionType: ${node.condition.expressionType}`);
  }

  logger.debug(
    `Condition evaluated to ${conditionValue}, selecting ${conditionValue ? 'then' : 'else'} branch`
  );

  // Select branch based on condition evaluation
  if (conditionValue && node.thenBranch.length > 0) {
    const firstStatement = node.thenBranch[0];
    if (firstStatement) {
      logger.debug(`Executing 'then' branch with node type: ${firstStatement.type}`);
      return await convertASTNodeToMesh(firstStatement, material);
    } else {
      logger.warn(`'then' branch is empty or first statement is undefined`);
    }
  } else if (!conditionValue && node.elseBranch && node.elseBranch.length > 0) {
    const firstStatement = node.elseBranch[0];
    if (firstStatement) {
      logger.debug(`Executing 'else' branch with node type: ${firstStatement.type}`);
      return await convertASTNodeToMesh(firstStatement, material);
    } else {
      logger.warn(`'else' branch is empty or first statement is undefined`);
    }
  } else {
    logger.debug(
      `No branch selected or branch is empty: conditionValue=${conditionValue}, thenBranchLength=${node.thenBranch.length}, elseBranchExists=${!!node.elseBranch}, elseBranchLength=${node.elseBranch?.length || 0}`
    );
  }

  // Return empty mesh if no statements in selected branch
  const geometry = new THREE.BufferGeometry();
  const emptyMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0,
  });
  return success(new THREE.Mesh(geometry, emptyMaterial));
};

/**
 * Create an empty placeholder mesh for non-renderable constructs
 */
const createEmptyPlaceholderMesh = (_material: THREE.Material): THREE.Mesh => {
  const geometry = new THREE.BufferGeometry();
  const emptyMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0,
  });
  return new THREE.Mesh(geometry, emptyMaterial);
};

/**
 * Handle list comprehension expressions by returning empty placeholder
 */
const convertListComprehensionExpression = async (
  _node: ListComprehensionExpressionNode,
  material: THREE.Material
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug('Processing list comprehension expression (ignored for rendering)');

  // List comprehensions don't produce geometry directly
  const placeholderMesh = createEmptyPlaceholderMesh(material);
  return success(placeholderMesh);
};

/**
 * Handle special variable expressions by treating as numeric literal 0
 */
const convertSpecialVariableExpression = async (
  node: SpecialVariableNode,
  material: THREE.Material
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Processing special variable: ${node.variable} (treated as 0)`);

  // Create a small marker mesh at origin to represent the special variable
  const markerGeometry = new THREE.SphereGeometry(0.1, 8, 6);
  const markerMesh = new THREE.Mesh(markerGeometry, material);
  markerMesh.position.set(0, 0, 0);

  return success(markerMesh);
};

/**
 * Handle binary expressions by evaluating simple operations or fallback
 */
const convertBinaryExpression = async (
  node: BinaryExpressionNode,
  material: THREE.Material,
  _convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Processing binary expression: ${node.operator}`);

  // Try to evaluate if both operands are literals
  const evaluationResult = astEvaluateBinaryExpression(node);

  if (evaluationResult.success && typeof evaluationResult.value === 'number') {
    // Create a small marker mesh to represent the evaluated value
    const size = Math.max(0.1, Math.min(Math.abs(evaluationResult.value), 10)); // Clamp size
    const markerGeometry = new THREE.BoxGeometry(size, size, size);
    const markerMesh = new THREE.Mesh(markerGeometry, material);
    return success(markerMesh);
  }

  // If evaluation failed, return empty placeholder
  logger.debug('Binary expression evaluation failed, returning placeholder');
  const placeholderMesh = createEmptyPlaceholderMesh(material);
  return success(placeholderMesh);
};

/**
 * Handle parenthesized expressions by delegating to inner expression
 */
const convertParenthesizedExpression = async (
  node: ParenthesizedExpressionNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug('Processing parenthesized expression (delegating to inner)');

  // Delegate to the inner expression
  return await convertASTNodeToMesh(node.expression, material);
};

/**
 * Handle function literals by storing reference (no geometry)
 */
const convertFunctionLiteral = async (
  _node: ASTNode,
  material: THREE.Material
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug('Processing function literal (no geometry)');

  // Function literals don't produce geometry, return empty placeholder
  const placeholderMesh = createEmptyPlaceholderMesh(material);
  return success(placeholderMesh);
};

/**
 * Convert for statement node by iterating over range and combining results
 */
const convertForStatementNode = async (
  node: ForLoopNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(
    `Processing for statement with variables: ${node.variables.map((v) => v.variable).join(', ')}`
  );

  // For now, we'll execute the body once
  // In a full implementation, this would iterate over the range and combine results
  logger.debug('Executing for loop body (simplified - single iteration)');
  if (node.body.length > 0) {
    const firstStatement = node.body[0];
    if (firstStatement) {
      return await convertASTNodeToMesh(firstStatement, material);
    }
  }

  // Return empty mesh if no statements in body
  const geometry = new THREE.BufferGeometry();
  const emptyMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0,
  });
  return success(new THREE.Mesh(geometry, emptyMaterial));
};

/**
 * Convert AST node to Three.js mesh for CSG operations
 */
const convertASTNodeToMesh = async (
  node: ASTNode,
  material: THREE.Material
): Promise<Result<THREE.Mesh, string>> => {
  logger.debug(`Converting AST node type: ${node.type}`);

  switch (node.type) {
    case 'cube':
      return convertCubeToMesh(node, material);

    case 'sphere':
      return convertSphereToMesh(node, material);

    case 'cylinder':
      return convertCylinderToMesh(node, material);

    case 'translate':
      return await convertTranslateNode(node, material, convertASTNodeToMesh);

    case 'rotate':
      return await convertRotateNode(node, material, convertASTNodeToMesh);

    case 'scale':
      return await convertScaleNode(node, material, convertASTNodeToMesh);

    case 'mirror':
      return await convertMirrorNode(node as MirrorNode, material, convertASTNodeToMesh);

    case 'rotate_extrude':
      return await convertRotateExtrudeNode(
        node as RotateExtrudeNode,
        material,
        convertASTNodeToMesh
      );

    case 'union':
      return await convertUnionNode(node, material, convertASTNodeToMesh);

    case 'intersection':
      return await convertIntersectionNode(node, material, convertASTNodeToMesh);

    case 'difference':
      return await convertDifferenceNode(node, material, convertASTNodeToMesh);

    case 'expression': {
      // Handle different types of expression nodes
      const expressionNode = node as ExpressionNode;

      // Check for specific expression types
      if (expressionNode.expressionType) {
        switch (expressionNode.expressionType) {
          case 'list_comprehension_expression':
            return await convertListComprehensionExpression(
              expressionNode as ListComprehensionExpressionNode,
              material
            );

          case 'special_variable':
            return await convertSpecialVariableExpression(
              expressionNode as SpecialVariableNode,
              material
            );

          case 'binary':
          case 'binary_expression':
            return await convertBinaryExpression(
              expressionNode as BinaryExpressionNode,
              material,
              convertASTNodeToMesh
            );

          case 'parenthesized_expression':
            return await convertParenthesizedExpression(
              expressionNode as ParenthesizedExpressionNode,
              material,
              convertASTNodeToMesh
            );

          case 'function_call':
            // Handle function calls as before
            return await convertFunctionCallNode(node, material, convertASTNodeToMesh);

          case 'function_literal':
            return await convertFunctionLiteral(node, material);

          default: {
            // Check if it's a function literal
            if (isFunctionLiteral(node)) {
              return await convertFunctionLiteral(node, material);
            }

            // For other expression types, try to evaluate or return placeholder
            logger.debug(
              `Expression type '${expressionNode.expressionType}' not specifically handled, creating placeholder`
            );
            const placeholderMesh = createEmptyPlaceholderMesh(material);
            return success(placeholderMesh);
          }
        }
      }

      // Fallback to function call handling if no expressionType
      return await convertFunctionCallNode(node, material, convertASTNodeToMesh);
    }

    case 'module_definition':
      return await convertModuleDefinitionNode(node as ModuleDefinitionNode);

    case 'assignment':
      return await convertAssignmentNode(node as AssignmentNode);

    case 'assign': {
      // Handle assign statements (AssignStatementNode) which contain multiple assignments
      const assignNode = node as AssignStatementNode;
      logger.debug(`Processing assign statement with ${assignNode.assignments.length} assignments`);

      // Process all assignments in the assign statement
      for (const assignment of assignNode.assignments) {
        const assignmentResult = await convertAssignmentNode(assignment);
        if (isError(assignmentResult)) {
          logger.warn(
            `Failed to process assignment in assign statement: ${assignmentResult.error}`
          );
        }
      }

      // Process the body of the assign statement
      if (assignNode.body) {
        return await convertASTNodeToMesh(assignNode.body, material);
      }

      // If no body, return an empty mesh (assignments don't produce geometry)
      const geometry = new THREE.BufferGeometry();
      const emptyMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0,
      });
      return success(new THREE.Mesh(geometry, emptyMaterial));
    }

    case 'if':
      return await convertIfStatementNode(node as IfNode, material, convertASTNodeToMesh);

    case 'for_loop':
      return await convertForStatementNode(node as ForLoopNode, material, convertASTNodeToMesh);

    // Handle 2D primitives
    case 'circle':
      return convertCircleToMesh(node as PrimitiveNode, material);

    case 'square':
      return convertSquareToMesh(node as PrimitiveNode, material);

    case 'polygon':
      return convertPolygonToMesh(node as PrimitiveNode, material);

    case 'text':
      return convertTextToMesh(node as PrimitiveNode, material);

    // Handle extrusion operations
    case 'linear_extrude':
      return await convertLinearExtrudeNode(
        node as LinearExtrudeNode,
        material,
        convertASTNodeToMesh
      );

    // Handle module instantiation (this includes function calls parsed as module_instantiation)
    case 'module_instantiation':
      return await convertModuleInstantiationNode(
        node as ModuleInstantiationNode,
        material,
        convertASTNodeToMesh
      );

    // Add basic support for other node types that we don't fully convert yet
    case 'polyhedron':
    case 'offset':
    case 'resize':
    case 'let':
    case 'each':
    case 'assert':
    case 'echo':
    case 'multmatrix':
    case 'color':
    case 'hull':
    case 'minkowski':
    case 'function_definition':
    case 'specialVariableAssignment':
    case 'children':
    case 'error': {
      // For now, create a placeholder empty mesh for unsupported node types
      logger.warn(`Node type '${node.type}' not fully supported for CSG conversion`);
      const geometry = new THREE.BufferGeometry();
      const emptyMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0,
      });
      return success(new THREE.Mesh(geometry, emptyMaterial));
    }

    default: {
      // Exhaustive check - this should never be reached if all cases are handled
      const exhaustiveCheck: never = node;
      return error(
        `Unsupported AST node type for CSG conversion: ${(exhaustiveCheck as ASTNode).type}`
      );
    }
  }
};

/**
 * Convert AST node to Mesh3D using CSG operations with timeout protection
 */
export const convertASTNodeToCSG = async (
  node: ASTNode,
  index: number,
  config: Partial<CSGConversionConfig> = {}
): Promise<Result<Mesh3D, string>> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };

  logger.init(`Converting AST node ${index} (${node.type}) to CSG`);

  // Debug translate nodes specifically
  if (
    node.type === 'translate' ||
    (node.type === 'function_call' && 'name' in node && node.name === 'translate')
  ) {
    logger.debug(`🔍 TRANSLATE NODE DEBUG:`, {
      type: node.type,
      hasChildren: 'children' in node ? node.children?.length || 0 : 'no children property',
      childrenTypes: 'children' in node ? node.children?.map((child) => child.type) : 'no children',
      hasV: 'v' in node ? 'yes' : 'no',
      vValue: 'v' in node ? node.v : 'no v property',
      fullStructure: JSON.stringify(node, null, 2),
    });
  }

  // Add timeout protection for CSG operations
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      logger.warn(
        `CSG conversion timeout after ${finalConfig.timeoutMs}ms for node ${index} (${node.type})`
      );
      resolve(error(`CSG conversion timeout after ${finalConfig.timeoutMs}ms`));
    }, finalConfig.timeoutMs);

    const performConversion = async (): Promise<Result<Mesh3D, string>> => {
      try {
        // Create material
        const material = createMaterial(finalConfig.material);

        // Convert AST node to Three.js mesh
        const meshResult = await convertASTNodeToMesh(node, material);
        if (!meshResult.success) {
          return meshResult;
        }

        return tryCatch(
          () => {
            const mesh = meshResult.data;

            // Calculate metadata
            mesh.geometry.computeBoundingBox();
            const boundingBox = mesh.geometry.boundingBox ?? new THREE.Box3();

            const metadata: MeshMetadata = {
              // NodeMetadata properties
              nodeId: createNodeId(`csg-${node.type}-${index}`),
              nodeType: createNodeType(node.type),
              depth: 0,
              parentId: createNodeId('root'),
              childrenIds: [],
              size: 1,
              complexity: 1,
              isOptimized: false,
              lastAccessed: new Date(),
              // MeshMetadata properties
              meshId: `mesh-${node.type}-${index}`,
              triangleCount: mesh.geometry.attributes.position?.count
                ? mesh.geometry.attributes.position.count / 3
                : 0,
              vertexCount: mesh.geometry.attributes.position?.count ?? 0,
              boundingBox,
              material: 'standard',
              color: finalConfig.material.color,
              opacity: finalConfig.material.opacity,
              visible: true,
            };

            const mesh3D: Mesh3D = {
              mesh,
              metadata,
              dispose: () => {
                mesh.geometry.dispose();
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((mat) => mat.dispose());
                } else {
                  mesh.material.dispose();
                }
              },
            };

            logger.debug(`Successfully converted ${node.type} to CSG mesh`);
            return mesh3D;
          },
          (err) =>
            `Failed to convert AST node to CSG: ${err instanceof Error ? err.message : String(err)}`
        );
      } catch (conversionError) {
        return error(
          `CSG conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`
        );
      }
    };

    performConversion()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        resolve(error(`CSG conversion error: ${err instanceof Error ? err.message : String(err)}`));
      });
  });
};

/**
 * Convert multiple AST nodes to CSG operations with union
 */
export const convertASTNodesToCSGUnion = async (
  nodes: ReadonlyArray<ASTNode>,
  config: Partial<CSGConversionConfig> = {}
): Promise<Result<Mesh3D, string>> => {
  const finalConfig = { ...DEFAULT_CSG_CONFIG, ...config };

  logger.init(`Converting ${nodes.length} AST nodes to CSG union`);

  return tryCatchAsync(
    async () => {
      if (nodes.length === 0) {
        throw new Error('No AST nodes provided for CSG union');
      }

      // Convert all nodes to meshes
      const meshes: THREE.Mesh[] = [];
      const material = createMaterial(finalConfig.material);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) {
          throw new Error(`Node ${i} is undefined`);
        }
        const meshResult = await convertASTNodeToMesh(node, material);
        if (isError(meshResult)) {
          throw new Error(`Failed to convert node ${i}: ${meshResult.error}`);
        }

        const mesh = meshResult.data;

        // Ensure mesh is properly prepared for CSG operations
        mesh.updateMatrix();
        mesh.updateMatrixWorld(true);

        // Ensure geometry has proper attributes
        if (!mesh.geometry.attributes.position) {
          throw new Error(`Mesh ${i} geometry missing position attribute`);
        }

        meshes.push(mesh);
      }

      // Perform CSG union operation
      let resultMesh: THREE.Mesh;

      if (meshes.length === 1) {
        const firstMesh = meshes[0];
        if (!firstMesh) {
          throw new Error('First mesh is undefined');
        }
        resultMesh = firstMesh;
      } else {
        logger.debug(`Performing CSG union on ${meshes.length} meshes`);

        const firstMesh = meshes[0];
        if (!firstMesh) {
          throw new Error('First mesh is undefined');
        }

        try {
          const firstCSGResult = await CSGCoreService.union(firstMesh, firstMesh); // Identity operation for first mesh
          if (isError(firstCSGResult)) {
            throw new Error(`Failed to prepare first mesh for CSG: ${firstCSGResult.error}`);
          }
          resultMesh = firstCSGResult.data;
          logger.debug(`Prepared first mesh for CSG operations`);

          for (let i = 1; i < meshes.length; i++) {
            logger.debug(`Processing mesh ${i + 1} of ${meshes.length}`);
            const currentMesh = meshes[i];
            if (!currentMesh) {
              throw new Error(`Mesh ${i} is undefined`);
            }
            const unionResult = await CSGCoreService.union(resultMesh, currentMesh);
            if (isError(unionResult)) {
              throw new Error(`Union operation ${i} failed: ${unionResult.error}`);
            }
            resultMesh = unionResult.data;
            logger.debug(`Union operation ${i} completed`);
          }

          logger.debug(`CSG union completed successfully`);
        } catch (csgError) {
          logger.error(`CSG union failed:`, csgError);
          throw new Error(
            `CSG union operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`
          );
        }
      }

      // Calculate metadata for the union result
      resultMesh.geometry.computeBoundingBox();
      const boundingBox = resultMesh.geometry.boundingBox ?? new THREE.Box3();

      const metadata: MeshMetadata = {
        // NodeMetadata properties
        nodeId: createNodeId(`csg-union-${Date.now()}`),
        nodeType: createNodeType('union'),
        depth: 0,
        parentId: createNodeId('root'),
        childrenIds: [],
        size: 1,
        complexity: 1,
        isOptimized: false,
        lastAccessed: new Date(),
        // MeshMetadata properties
        meshId: `mesh-union-${Date.now()}`,
        triangleCount: resultMesh.geometry.attributes.position?.count
          ? resultMesh.geometry.attributes.position.count / 3
          : 0,
        vertexCount: resultMesh.geometry.attributes.position?.count ?? 0,
        boundingBox,
        material: 'standard',
        color: finalConfig.material.color,
        opacity: finalConfig.material.opacity,
        visible: true,
      };

      const mesh3D: Mesh3D = {
        mesh: resultMesh,
        metadata,
        dispose: () => {
          resultMesh.geometry.dispose();
          if (Array.isArray(resultMesh.material)) {
            resultMesh.material.forEach((mat) => mat.dispose());
          } else {
            resultMesh.material.dispose();
          }
        },
      };

      logger.debug(`Successfully created CSG union with ${metadata.triangleCount} triangles`);
      return mesh3D;
    },
    (err) => `Failed to create CSG union: ${err instanceof Error ? err.message : String(err)}`
  );
};
