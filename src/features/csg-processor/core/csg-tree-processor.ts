/**
 * @file CSG Tree Processor
 * 
 * Core processor that converts OpenSCAD AST into structured CSG tree format.
 * Implements pure functions following DRY and SRP principles with comprehensive
 * error handling and validation.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type {
  CSGTree,
  CSGTreeNode,
  CSGProcessingResult,
  CSGProcessorConfig,
  CSGError,
  Result,
  Vector3,
  Transform3D,
  CSGMaterial
} from '../types/csg-tree-types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<CSGProcessorConfig> = {
  enableLogging: false,
  enableOptimization: true,
  enableValidation: true,
  maxDepth: 50,
  maxNodes: 10000,
  defaultMaterial: {
    color: { r: 0.3, g: 0.5, b: 0.8, a: 1.0 },
    opacity: 1.0,
    metalness: 0.1,
    roughness: 0.4,
    wireframe: false
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID for CSG nodes
 */
function generateNodeId(): string {
  return `csg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create CSG error with proper formatting
 */
function createCSGError(
  message: string,
  code: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  sourceLocation?: { line: number; column: number },
  nodeId?: string
): CSGError {
  return {
    message,
    code,
    severity,
    sourceLocation,
    nodeId
  };
}

/**
 * Extract numeric value from AST parameter
 */
function extractNumericValue(param: any, defaultValue: number = 0): number {
  if (typeof param === 'number') return param;
  if (typeof param === 'string') {
    const parsed = parseFloat(param);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (param && typeof param === 'object' && 'value' in param) {
    return extractNumericValue(param.value, defaultValue);
  }
  return defaultValue;
}

/**
 * Extract vector3 from AST parameter
 */
function extractVector3(param: any, defaultValue: Vector3 = [0, 0, 0]): Vector3 {
  if (Array.isArray(param)) {
    const [x = 0, y = 0, z = 0] = param.map((v: any) => extractNumericValue(v));
    return [x, y, z];
  }
  if (typeof param === 'number') {
    return [param, param, param];
  }
  return defaultValue;
}

/**
 * Extract transform from AST node
 */
function extractTransform(node: ASTNode): Transform3D | undefined {
  const transform: Transform3D = {};
  
  // Handle different transform types
  switch (node.type) {
    case 'translate':
      if ('vector' in node && node.vector) {
        transform.translation = extractVector3(node.vector);
      }
      break;
    case 'rotate':
      if ('vector' in node && node.vector) {
        transform.rotation = extractVector3(node.vector);
      }
      break;
    case 'scale':
      if ('vector' in node && node.vector) {
        transform.scale = extractVector3(node.vector, [1, 1, 1]);
      }
      break;
  }
  
  return Object.keys(transform).length > 0 ? transform : undefined;
}

// ============================================================================
// AST to CSG Conversion Functions
// ============================================================================

/**
 * Convert cube AST node to CSG cube
 */
function convertCubeNode(node: ASTNode, config: Required<CSGProcessorConfig>): Result<CSGTreeNode, CSGError> {
  try {
    const size = extractVector3(
      'size' in node ? node.size : 
      'parameters' in node && node.parameters?.size ? node.parameters.size :
      [1, 1, 1]
    );
    
    const center = 'center' in node ? Boolean(node.center) : 
                  'parameters' in node && node.parameters?.center ? Boolean(node.parameters.center) :
                  false;

    const csgNode: CSGTreeNode = {
      id: generateNodeId(),
      type: 'cube',
      size,
      center,
      material: config.defaultMaterial,
      sourceLocation: node.location ? {
        line: node.location.start?.line || 0,
        column: node.location.start?.column || 0
      } : undefined
    };

    return { success: true, data: csgNode };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error converting cube node';
    return {
      success: false,
      error: createCSGError(`Failed to convert cube node: ${errorMessage}`, 'CUBE_CONVERSION_ERROR')
    };
  }
}

/**
 * Convert sphere AST node to CSG sphere
 */
function convertSphereNode(node: ASTNode, config: Required<CSGProcessorConfig>): Result<CSGTreeNode, CSGError> {
  try {
    const radius = extractNumericValue(
      'radius' in node ? node.radius :
      'r' in node ? node.r :
      'parameters' in node && node.parameters?.r ? node.parameters.r :
      'parameters' in node && node.parameters?.radius ? node.parameters.radius :
      1
    );

    const segments = extractNumericValue(
      'fn' in node ? node.fn :
      'parameters' in node && node.parameters?.fn ? node.parameters.fn :
      32
    );

    const csgNode: CSGTreeNode = {
      id: generateNodeId(),
      type: 'sphere',
      radius,
      segments,
      material: config.defaultMaterial,
      sourceLocation: node.location ? {
        line: node.location.start?.line || 0,
        column: node.location.start?.column || 0
      } : undefined
    };

    return { success: true, data: csgNode };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error converting sphere node';
    return {
      success: false,
      error: createCSGError(`Failed to convert sphere node: ${errorMessage}`, 'SPHERE_CONVERSION_ERROR')
    };
  }
}

/**
 * Convert cylinder AST node to CSG cylinder
 */
function convertCylinderNode(node: ASTNode, config: Required<CSGProcessorConfig>): Result<CSGTreeNode, CSGError> {
  try {
    const height = extractNumericValue(
      'height' in node ? node.height :
      'h' in node ? node.h :
      'parameters' in node && node.parameters?.h ? node.parameters.h :
      'parameters' in node && node.parameters?.height ? node.parameters.height :
      1
    );

    const radius1 = extractNumericValue(
      'radius' in node ? node.radius :
      'r' in node ? node.r :
      'r1' in node ? node.r1 :
      'parameters' in node && node.parameters?.r ? node.parameters.r :
      'parameters' in node && node.parameters?.r1 ? node.parameters.r1 :
      1
    );

    const radius2 = extractNumericValue(
      'r2' in node ? node.r2 :
      'parameters' in node && node.parameters?.r2 ? node.parameters.r2 :
      radius1
    );

    const segments = extractNumericValue(
      'fn' in node ? node.fn :
      'parameters' in node && node.parameters?.fn ? node.parameters.fn :
      32
    );

    const center = 'center' in node ? Boolean(node.center) :
                  'parameters' in node && node.parameters?.center ? Boolean(node.parameters.center) :
                  false;

    const csgNode: CSGTreeNode = {
      id: generateNodeId(),
      type: 'cylinder',
      height,
      radius1,
      radius2,
      segments,
      center,
      material: config.defaultMaterial,
      sourceLocation: node.location ? {
        line: node.location.start?.line || 0,
        column: node.location.start?.column || 0
      } : undefined
    };

    return { success: true, data: csgNode };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error converting cylinder node';
    return {
      success: false,
      error: createCSGError(`Failed to convert cylinder node: ${errorMessage}`, 'CYLINDER_CONVERSION_ERROR')
    };
  }
}

/**
 * Convert CSG operation AST node to CSG operation
 */
function convertCSGOperationNode(
  node: ASTNode,
  children: readonly CSGTreeNode[],
  config: Required<CSGProcessorConfig>
): Result<CSGTreeNode, CSGError> {
  try {
    if (children.length === 0) {
      return {
        success: false,
        error: createCSGError(
          `CSG operation ${node.type} requires at least one child`,
          'EMPTY_CSG_OPERATION'
        )
      };
    }

    const csgNode: CSGTreeNode = {
      id: generateNodeId(),
      type: node.type as 'union' | 'difference' | 'intersection',
      children,
      material: config.defaultMaterial,
      sourceLocation: node.location ? {
        line: node.location.start?.line || 0,
        column: node.location.start?.column || 0
      } : undefined
    };

    return { success: true, data: csgNode };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error converting CSG operation';
    return {
      success: false,
      error: createCSGError(`Failed to convert CSG operation: ${errorMessage}`, 'CSG_OPERATION_ERROR')
    };
  }
}

/**
 * Convert transform AST node to CSG transform
 */
function convertTransformNode(
  node: ASTNode,
  child: CSGTreeNode,
  config: Required<CSGProcessorConfig>
): Result<CSGTreeNode, CSGError> {
  try {
    const transform = extractTransform(node);
    
    if (!transform) {
      return {
        success: false,
        error: createCSGError(
          `Transform node ${node.type} has no valid transform data`,
          'INVALID_TRANSFORM'
        )
      };
    }

    const csgNode: CSGTreeNode = {
      id: generateNodeId(),
      type: 'transform',
      child,
      transform,
      material: config.defaultMaterial,
      sourceLocation: node.location ? {
        line: node.location.start?.line || 0,
        column: node.location.start?.column || 0
      } : undefined
    };

    return { success: true, data: csgNode };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error converting transform';
    return {
      success: false,
      error: createCSGError(`Failed to convert transform: ${errorMessage}`, 'TRANSFORM_CONVERSION_ERROR')
    };
  }
}

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * Convert single AST node to CSG node
 */
function convertASTNodeToCSG(
  node: ASTNode,
  config: Required<CSGProcessorConfig>,
  depth: number = 0,
  errors: CSGError[] = []
): Result<CSGTreeNode | null, CSGError[]> {
  // Check depth limit
  if (depth > config.maxDepth) {
    errors.push(createCSGError(
      `Maximum depth ${config.maxDepth} exceeded`,
      'MAX_DEPTH_EXCEEDED'
    ));
    return { success: false, error: errors };
  }

  try {
    switch (node.type) {
      case 'cube': {
        const result = convertCubeNode(node, config);
        if (!result.success) {
          errors.push(result.error);
          return { success: false, error: errors };
        }
        return { success: true, data: result.data };
      }

      case 'sphere': {
        const result = convertSphereNode(node, config);
        if (!result.success) {
          errors.push(result.error);
          return { success: false, error: errors };
        }
        return { success: true, data: result.data };
      }

      case 'cylinder': {
        const result = convertCylinderNode(node, config);
        if (!result.success) {
          errors.push(result.error);
          return { success: false, error: errors };
        }
        return { success: true, data: result.data };
      }

      case 'union':
      case 'difference':
      case 'intersection': {
        // Process children first
        const children: CSGTreeNode[] = [];
        if ('children' in node && Array.isArray(node.children)) {
          for (const childNode of node.children) {
            const childResult = convertASTNodeToCSG(childNode, config, depth + 1, errors);
            if (childResult.success && childResult.data) {
              children.push(childResult.data);
            }
          }
        }

        const result = convertCSGOperationNode(node, children, config);
        if (!result.success) {
          errors.push(result.error);
          return { success: false, error: errors };
        }
        return { success: true, data: result.data };
      }

      case 'translate':
      case 'rotate':
      case 'scale': {
        // Process child first
        let child: CSGTreeNode | null = null;
        if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
          const childResult = convertASTNodeToCSG(node.children[0], config, depth + 1, errors);
          if (childResult.success && childResult.data) {
            child = childResult.data;
          }
        }

        if (!child) {
          errors.push(createCSGError(
            `Transform ${node.type} requires a child node`,
            'TRANSFORM_NO_CHILD'
          ));
          return { success: false, error: errors };
        }

        const result = convertTransformNode(node, child, config);
        if (!result.success) {
          errors.push(result.error);
          return { success: false, error: errors };
        }
        return { success: true, data: result.data };
      }

      default:
        // Skip unsupported node types with warning
        errors.push(createCSGError(
          `Unsupported AST node type: ${node.type}`,
          'UNSUPPORTED_NODE_TYPE',
          'warning'
        ));
        return { success: true, data: null };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
    errors.push(createCSGError(
      `Failed to convert AST node: ${errorMessage}`,
      'CONVERSION_ERROR'
    ));
    return { success: false, error: errors };
  }
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process OpenSCAD AST into CSG tree
 * 
 * @param ast - OpenSCAD AST nodes to process
 * @param config - Processing configuration
 * @returns CSG processing result with tree or errors
 */
export function processASTToCSGTree(
  ast: readonly ASTNode[],
  config: CSGProcessorConfig = {}
): CSGProcessingResult {
  const startTime = performance.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: CSGError[] = [];
  const warnings: CSGError[] = [];

  if (finalConfig.enableLogging) {
    console.log('[CSG Processor] Starting AST to CSG tree conversion...');
  }

  try {
    // Validate input
    if (!ast || ast.length === 0) {
      return {
        success: true,
        tree: {
          root: [],
          metadata: {
            nodeCount: 0,
            primitiveCount: 0,
            operationCount: 0,
            maxDepth: 0
          },
          processingTime: performance.now() - startTime
        },
        errors: [],
        warnings: [],
        processingTime: performance.now() - startTime
      };
    }

    // Convert AST nodes to CSG nodes
    const rootNodes: CSGTreeNode[] = [];
    for (const astNode of ast) {
      const result = convertASTNodeToCSG(astNode, finalConfig, 0, []);
      
      if (result.success && result.data) {
        rootNodes.push(result.data);
      } else if (!result.success) {
        errors.push(...result.error);
      }
    }

    // Calculate metadata
    let nodeCount = 0;
    let primitiveCount = 0;
    let operationCount = 0;
    let maxDepth = 0;

    function calculateStats(nodes: readonly CSGTreeNode[], depth: number = 0) {
      maxDepth = Math.max(maxDepth, depth);
      
      for (const node of nodes) {
        nodeCount++;
        
        if (['cube', 'sphere', 'cylinder', 'cone', 'polyhedron'].includes(node.type)) {
          primitiveCount++;
        } else if (['union', 'difference', 'intersection'].includes(node.type)) {
          operationCount++;
          if ('children' in node) {
            calculateStats(node.children, depth + 1);
          }
        } else if (node.type === 'transform' && 'child' in node) {
          calculateStats([node.child], depth + 1);
        } else if (node.type === 'group' && 'children' in node) {
          calculateStats(node.children, depth + 1);
        }
      }
    }

    calculateStats(rootNodes);

    const processingTime = performance.now() - startTime;

    // Separate errors and warnings
    const allErrors = errors.filter(e => e.severity === 'error');
    const allWarnings = errors.filter(e => e.severity === 'warning');

    const tree: CSGTree = {
      root: rootNodes,
      metadata: {
        nodeCount,
        primitiveCount,
        operationCount,
        maxDepth
      },
      processingTime,
      sourceAST: ast
    };

    if (finalConfig.enableLogging) {
      console.log(`[CSG Processor] Conversion completed in ${processingTime.toFixed(2)}ms`);
      console.log(`[CSG Processor] Generated ${nodeCount} nodes (${primitiveCount} primitives, ${operationCount} operations)`);
    }

    return {
      success: allErrors.length === 0,
      tree,
      errors: allErrors,
      warnings: allWarnings,
      processingTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    const processingTime = performance.now() - startTime;

    return {
      success: false,
      errors: [createCSGError(`CSG processing failed: ${errorMessage}`, 'PROCESSING_ERROR')],
      warnings: [],
      processingTime
    };
  }
}

// ============================================================================
// CSG Tree Utility Functions
// ============================================================================

/**
 * Traverse CSG tree with visitor function
 */
export function traverseCSGTree<T>(
  nodes: readonly CSGTreeNode[],
  visitor: (node: CSGTreeNode, depth: number, path: readonly number[]) => T,
  depth: number = 0,
  path: readonly number[] = []
): T[] {
  const results: T[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const currentPath = [...path, i];

    // Visit current node
    results.push(visitor(node, depth, currentPath));

    // Recursively visit children
    if ('children' in node && Array.isArray(node.children)) {
      results.push(...traverseCSGTree(node.children, visitor, depth + 1, currentPath));
    } else if ('child' in node) {
      results.push(...traverseCSGTree([node.child], visitor, depth + 1, currentPath));
    }
  }

  return results;
}

/**
 * Find CSG node by ID
 */
export function findCSGNodeById(
  nodes: readonly CSGTreeNode[],
  id: string
): CSGTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    if ('children' in node && Array.isArray(node.children)) {
      const found = findCSGNodeById(node.children, id);
      if (found) return found;
    } else if ('child' in node) {
      const found = findCSGNodeById([node.child], id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Validate CSG tree structure
 */
export function validateCSGTree(tree: CSGTree): Result<true, readonly CSGError[]> {
  const errors: CSGError[] = [];

  traverseCSGTree(tree.root, (node, depth) => {
    // Check required properties
    if (!node.id) {
      errors.push(createCSGError('Node missing required ID', 'MISSING_NODE_ID'));
    }

    if (!node.type) {
      errors.push(createCSGError('Node missing required type', 'MISSING_NODE_TYPE'));
    }

    // Validate specific node types
    if (node.type === 'cube' && 'size' in node) {
      const size = node.size as Vector3;
      if (size.some(s => s <= 0)) {
        errors.push(createCSGError('Cube size must be positive', 'INVALID_CUBE_SIZE', 'error', undefined, node.id));
      }
    }

    if (node.type === 'sphere' && 'radius' in node) {
      const radius = node.radius as number;
      if (radius <= 0) {
        errors.push(createCSGError('Sphere radius must be positive', 'INVALID_SPHERE_RADIUS', 'error', undefined, node.id));
      }
    }

    if (node.type === 'cylinder' && 'height' in node && 'radius1' in node) {
      const height = node.height as number;
      const radius1 = node.radius1 as number;
      if (height <= 0) {
        errors.push(createCSGError('Cylinder height must be positive', 'INVALID_CYLINDER_HEIGHT', 'error', undefined, node.id));
      }
      if (radius1 <= 0) {
        errors.push(createCSGError('Cylinder radius must be positive', 'INVALID_CYLINDER_RADIUS', 'error', undefined, node.id));
      }
    }

    return null;
  });

  if (errors.length > 0) {
    return { success: false, error: errors };
  }

  return { success: true, data: true };
}

// ============================================================================
// Default Export
// ============================================================================

export default processASTToCSGTree;
