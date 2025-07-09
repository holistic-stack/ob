/**
 * AST Restructuring Service
 *
 * Service for post-processing flat AST structures from the OpenSCAD parser
 * to reconstruct proper hierarchical parent-child relationships for boolean operations.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/utils/functional/result';
import { tryCatch } from '../../../shared/utils/functional/result';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  IntersectionNode,
  RotateNode,
  ScaleNode,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../../openscad-parser/core/ast-types.js';

const logger = createLogger('ASTRestructuringService');

/**
 * Module-level storage for source code to enable Tree-sitter grammar workarounds
 * This allows the restructuring service to access the original source code
 * for parsing child primitives that the grammar missed
 */
let currentSourceCode: string | null = null;

/**
 * Set the source code for Tree-sitter grammar workarounds
 * This enables the restructuring service to find child primitives via source code analysis
 */
export function setSourceCodeForRestructuring(sourceCode: string): void {
  currentSourceCode = sourceCode;
  logger.debug(`Source code set for restructuring (${sourceCode.length} characters)`);
}

/**
 * Clear the source code after restructuring
 */
export function clearSourceCodeForRestructuring(): void {
  currentSourceCode = null;
  logger.debug('Source code cleared after restructuring');
}

/**
 * Configuration for AST restructuring
 */
export interface ASTRestructuringConfig {
  readonly enableLogging: boolean;
  readonly maxDepth: number;
  readonly enableSourceLocationAnalysis: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ASTRestructuringConfig = {
  enableLogging: true,
  maxDepth: 10,
  enableSourceLocationAnalysis: true,
};

/**
 * Type guards for AST nodes
 */
const isCSGNode = (node: ASTNode): node is UnionNode | DifferenceNode | IntersectionNode => {
  return ['union', 'difference', 'intersection'].includes(node.type);
};

const isTransformNode = (node: ASTNode): node is TranslateNode | RotateNode | ScaleNode => {
  return ['translate', 'rotate', 'scale', 'mirror'].includes(node.type);
};

const isPrimitiveNode = (node: ASTNode): node is CubeNode | SphereNode | CylinderNode => {
  return ['cube', 'sphere', 'cylinder'].includes(node.type);
};

/**
 * Check if a node has children property
 */
const hasChildren = (node: ASTNode): node is ASTNode & { children: ASTNode[] } => {
  return 'children' in node && Array.isArray((node as unknown as Record<string, unknown>).children);
};

/**
 * Analyze source location to determine if a node is inside another node's block
 * Enhanced with sophisticated OpenSCAD block structure detection
 */
const isNodeInsideBlock = (childNode: ASTNode, parentNode: ASTNode): boolean => {
  if (!childNode.location || !parentNode.location) {
    return false;
  }

  // For CSG operations, implement precise block boundary detection
  if (isCSGNode(parentNode)) {
    return isNodeInsideCSGBlock(childNode, parentNode);
  }

  // For transform operations, use enhanced containment logic
  if (isTransformNode(parentNode)) {
    return isNodeInsideTransformBlock(childNode, parentNode);
  }

  // Default containment logic for other node types
  return isNodeContainedWithin(childNode, parentNode);
};

/**
 * Determine if a node is inside a CSG operation block using sophisticated analysis
 */
const isNodeInsideCSGBlock = (childNode: ASTNode, csgNode: ASTNode): boolean => {
  if (!childNode.location || !csgNode.location) {
    return false;
  }

  const childStart = childNode.location.start;
  const childEnd = childNode.location.end;
  const parentStart = csgNode.location.start;
  const parentEnd = csgNode.location.end;

  // Child must be completely within parent's line range
  const isWithinLineRange = childStart.line > parentStart.line && childEnd.line < parentEnd.line;

  // Child should be indented relative to parent (indicating block nesting)
  const isProperlyIndented = childStart.column > parentStart.column;

  // Additional check: ensure child is not on the same line as parent's opening
  const isNotOnOpeningLine = childStart.line !== parentStart.line;

  // Additional check: ensure child is not on the same line as parent's closing
  const isNotOnClosingLine = childEnd.line !== parentEnd.line;

  return isWithinLineRange && isProperlyIndented && isNotOnOpeningLine && isNotOnClosingLine;
};

/**
 * Determine if a node is inside a transform operation block
 */
const isNodeInsideTransformBlock = (childNode: ASTNode, transformNode: ASTNode): boolean => {
  if (!childNode.location || !transformNode.location) {
    return false;
  }

  const childStart = childNode.location.start;
  const childEnd = childNode.location.end;
  const parentStart = transformNode.location.start;
  const parentEnd = transformNode.location.end;

  // For transform operations, child can be on the same line as opening but must be after the opening brace
  const isAfterParentStart =
    childStart.line > parentStart.line ||
    (childStart.line === parentStart.line && childStart.column > parentStart.column);

  const isBeforeParentEnd =
    childEnd.line < parentEnd.line ||
    (childEnd.line === parentEnd.line && childEnd.column < parentEnd.column);

  return isAfterParentStart && isBeforeParentEnd;
};

/**
 * Basic containment check for general node types
 */
const isNodeContainedWithin = (childNode: ASTNode, parentNode: ASTNode): boolean => {
  if (!childNode.location || !parentNode.location) {
    return false;
  }

  const childStart = childNode.location.start;
  const childEnd = childNode.location.end;
  const parentStart = parentNode.location.start;
  const parentEnd = parentNode.location.end;

  const isAfterParentStart =
    childStart.line > parentStart.line ||
    (childStart.line === parentStart.line && childStart.column > parentStart.column);

  const isBeforeParentEnd =
    childEnd.line < parentEnd.line ||
    (childEnd.line === parentEnd.line && childEnd.column < parentEnd.column);

  return isAfterParentStart && isBeforeParentEnd;
};

/**
 * Find nodes that should be direct children of a given parent node
 * Enhanced with sophisticated analysis and fallback strategies
 */
const findDirectChildrenForNode = (
  parentNode: ASTNode,
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): ASTNode[] => {
  if (!config.enableSourceLocationAnalysis) {
    return [];
  }

  // Primary strategy: source location analysis
  const locationBasedChildren = findChildrenBySourceLocation(parentNode, allNodes, config);

  if (locationBasedChildren.length > 0) {
    if (config.enableLogging) {
      logger.debug(
        `Found ${locationBasedChildren.length} children via source location analysis for ${parentNode.type}`
      );
    }
    return locationBasedChildren;
  }

  // Fallback strategy: proximity-based grouping for CSG operations
  if (isCSGNode(parentNode)) {
    const proximityBasedChildren = findChildrenByProximity(parentNode, allNodes, config);
    if (proximityBasedChildren.length > 0) {
      if (config.enableLogging) {
        logger.debug(
          `Found ${proximityBasedChildren.length} children via proximity analysis for ${parentNode.type}`
        );
      }
      return proximityBasedChildren;
    }
  }

  return [];
};

/**
 * Find children using source location analysis
 */
const findChildrenBySourceLocation = (
  parentNode: ASTNode,
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): ASTNode[] => {
  const potentialChildren: ASTNode[] = [];
  const indirectChildren = new Set<ASTNode>();

  // First pass: find all nodes inside the parent's block
  for (const node of allNodes) {
    if (node === parentNode) continue;

    if (isNodeInsideBlock(node, parentNode)) {
      potentialChildren.push(node);
    }
  }

  // Special case for transform nodes: if no children found via block analysis,
  // look for the next primitive node that immediately follows the transform
  if (isTransformNode(parentNode) && potentialChildren.length === 0) {
    if (config.enableLogging) {
      logger.info(
        `Transform node ${parentNode.type} has no children via block analysis, searching for next primitive`
      );
    }
    const nextPrimitive = findNextPrimitiveAfterTransform(parentNode, allNodes, config);
    if (nextPrimitive) {
      potentialChildren.push(nextPrimitive);
      if (config.enableLogging) {
        logger.info(
          `Found next primitive ${nextPrimitive.type} after transform ${parentNode.type} via sequential analysis`
        );
      }
    } else {
      // Try to find the child primitive via source code analysis (Tree-sitter grammar workaround)
      const sourceCodeChild = tryParseChildFromSourceCode(parentNode);
      if (sourceCodeChild) {
        potentialChildren.push(sourceCodeChild);
        if (config.enableLogging) {
          logger.info(
            `Found child primitive ${sourceCodeChild.type} for transform ${parentNode.type} via source code analysis`
          );
        }
      } else if (config.enableLogging) {
        logger.info(`No next primitive found after transform ${parentNode.type}`);
      }
    }
  }

  // Second pass: identify nodes that are children of other nodes within the parent's scope
  for (const potentialParent of potentialChildren) {
    if (isCSGNode(potentialParent) || isTransformNode(potentialParent)) {
      for (const potentialChild of potentialChildren) {
        if (
          potentialChild !== potentialParent &&
          isNodeInsideBlock(potentialChild, potentialParent)
        ) {
          indirectChildren.add(potentialChild);
        }
      }
    }
  }

  // Return only direct children (not children of other children)
  const directChildren = potentialChildren.filter((node) => !indirectChildren.has(node));

  if (config.enableLogging) {
    logger.debug(
      `findDirectChildrenForNode: ${parentNode.type} - potentialChildren: ${potentialChildren.length}, directChildren: ${directChildren.length}`
    );
    console.log(
      '[DEBUG][ASTRestructuringService] potentialChildren types:',
      potentialChildren.map((c) => c.type)
    );
    console.log(
      '[DEBUG][ASTRestructuringService] directChildren types:',
      directChildren.map((c) => c.type)
    );
    if (directChildren.length > 0) {
      directChildren.forEach((child) => {
        logger.debug(
          `Found direct child ${child.type} for parent ${parentNode.type} via source location`
        );
      });
    }
  }

  return directChildren;
};

/**
 * Find the next primitive node that immediately follows a transform node
 * This handles the case where OpenSCAD syntax like "translate([10,0,0]) sphere(10);"
 * is parsed as separate nodes instead of parent-child relationship
 */
const findNextPrimitiveAfterTransform = (
  transformNode: ASTNode,
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): ASTNode | null => {
  if (!transformNode.location) {
    if (config.enableLogging) {
      logger.debug(`Transform node ${transformNode.type} has no location information`);
    }
    return null;
  }

  if (config.enableLogging) {
    logger.debug(
      `Searching for primitive after transform ${transformNode.type} at line ${transformNode.location.end.line}, column ${transformNode.location.end.column}`
    );
  }

  // Look for primitive nodes that appear immediately after the transform node
  const candidateNodes = allNodes.filter((node) => {
    if (node === transformNode || !isPrimitiveNode(node) || !node.location) {
      return false;
    }

    const transformEndLine = transformNode.location?.end.line;
    const transformEndColumn = transformNode.location?.end.column;
    const nodeStartLine = node.location.start.line;
    const nodeStartColumn = node.location.start.column;

    if (config.enableLogging) {
      logger.debug(
        `Checking primitive ${node.type} at line ${nodeStartLine}, col ${nodeStartColumn} vs transform end at line ${transformEndLine}, col ${transformEndColumn}`
      );
    }

    // For single-line format: primitive must appear AFTER the transform on the same line
    // For multi-line format: primitive must appear on a later line

    if (nodeStartLine === transformEndLine) {
      // Same line: check column position to ensure primitive comes after transform
      const isAfterTransform = nodeStartColumn > transformEndColumn;
      if (config.enableLogging) {
        logger.debug(
          `Same line check: ${node.type} ${isAfterTransform ? 'AFTER' : 'BEFORE'} transform (${nodeStartColumn} > ${transformEndColumn})`
        );
      }
      return isAfterTransform;
    } else if (nodeStartLine > transformEndLine) {
      // Later line: allow primitives within reasonable distance
      const isWithinDistance = nodeStartLine <= transformEndLine + 2;
      if (config.enableLogging) {
        logger.debug(
          `Later line check: ${node.type} ${isWithinDistance ? 'WITHIN' : 'OUTSIDE'} distance (line ${nodeStartLine} <= ${transformEndLine + 2})`
        );
      }
      return isWithinDistance;
    } else {
      // Earlier line: not a valid child
      if (config.enableLogging) {
        logger.debug(
          `Earlier line check: ${node.type} BEFORE transform (line ${nodeStartLine} < ${transformEndLine}) - REJECTED`
        );
      }
      return false;
    }
  });

  if (config.enableLogging) {
    logger.debug(
      `Found ${candidateNodes.length} candidate primitives after transform ${transformNode.type}`
    );
    candidateNodes.forEach((node) => {
      logger.debug(`✅ CANDIDATE: ${node.type} at line ${node.location?.start.line}, column ${node.location?.start.column}`);
    });

    // Also log rejected nodes for debugging
    const rejectedNodes = allNodes.filter((node) => {
      return node !== transformNode && isPrimitiveNode(node) && node.location && !candidateNodes.includes(node);
    });
    logger.debug(`Found ${rejectedNodes.length} rejected primitives:`);
    rejectedNodes.forEach((node) => {
      logger.debug(`❌ REJECTED: ${node.type} at line ${node.location?.start.line}, column ${node.location?.start.column}`);
    });
  }

  // Sort by line number and column to get the closest one
  candidateNodes.sort((a, b) => {
    if (!a.location || !b.location) return 0;
    const lineDiff = a.location.start.line - b.location.start.line;
    if (lineDiff !== 0) return lineDiff;
    return a.location.start.column - b.location.start.column;
  });

  // Return the first (closest) candidate
  return candidateNodes.length > 0 ? candidateNodes[0] : null;
};

/**
 * Find children using proximity-based analysis for CSG operations
 * This is a fallback when source location analysis fails
 */
const findChildrenByProximity = (
  parentNode: ASTNode,
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): ASTNode[] => {
  if (!parentNode.location) {
    return [];
  }

  const parentLine = parentNode.location.start.line;
  const proximityThreshold = 5; // Lines within 5 lines of the CSG operation

  const nearbyPrimitives = allNodes.filter((node) => {
    if (node === parentNode || !isPrimitiveNode(node) || !node.location) {
      return false;
    }

    const nodeLine = node.location.start.line;
    const distance = Math.abs(nodeLine - parentLine);

    // Node should be close to the CSG operation and after it (indicating it's inside the block)
    return distance <= proximityThreshold && nodeLine > parentLine;
  });

  // Sort by line number to maintain order
  nearbyPrimitives.sort((a, b) => {
    if (!a.location || !b.location) return 0;
    return a.location.start.line - b.location.start.line;
  });

  // For CSG operations, typically take the first 2-3 primitives that follow
  const maxChildren = isCSGNode(parentNode) ? 3 : 1;
  const selectedChildren = nearbyPrimitives.slice(0, maxChildren);

  if (config.enableLogging && selectedChildren.length > 0) {
    selectedChildren.forEach((child) => {
      logger.debug(
        `Found child ${child.type} for parent ${parentNode.type} via proximity analysis`
      );
    });
  }

  return selectedChildren;
};

/**
 * Restructure a single CSG node to include its proper children
 */
const restructureCSGNode = (
  csgNode: UnionNode | DifferenceNode | IntersectionNode,
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): UnionNode | DifferenceNode | IntersectionNode => {
  if (config.enableLogging) {
    logger.debug(`Restructuring ${csgNode.type} node`);
  }

  // If the CSG node already has children from the parser, preserve them
  let children: ASTNode[] = [];
  if (hasChildren(csgNode) && csgNode.children.length > 0) {
    if (config.enableLogging) {
      logger.debug(
        `${csgNode.type} already has ${csgNode.children.length} children from parser, preserving them`
      );
    }
    children = csgNode.children;
  } else {
    // Find children that belong to this CSG operation via source location analysis
    children = findDirectChildrenForNode(csgNode, allNodes, config);

    // If no children found via location analysis, try to find primitives that should belong to this CSG operation
    // This handles the case where the parser doesn't correctly process block contents
    if (children.length === 0 && config.enableSourceLocationAnalysis) {
      const potentialChildren = allNodes.filter(
        (node) =>
          isPrimitiveNode(node) &&
          node.location &&
          csgNode.location &&
          // Look for primitives that are close to this CSG operation
          Math.abs(node.location.start.line - csgNode.location.start.line) <= 3
      );

      if (potentialChildren.length > 0 && config.enableLogging) {
        logger.debug(
          `Found ${potentialChildren.length} potential children for ${csgNode.type} via proximity analysis`
        );
        children = potentialChildren;
      }
    }
  }

  // Create new node with proper children
  const restructuredNode = {
    ...csgNode,
    children,
  };

  if (config.enableLogging) {
    logger.debug(`${csgNode.type} now has ${children.length} children`);
  }

  return restructuredNode;
};

/**
 * Restructure a transform node to include its proper children
 */
const restructureTransformNode = (
  transformNode: TranslateNode | RotateNode | ScaleNode,
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): TranslateNode | RotateNode | ScaleNode => {
  if (config.enableLogging) {
    logger.debug(`Restructuring ${transformNode.type} node`);
  }

  // If the transform node already has children from the parser, preserve them
  let children: ASTNode[] = [];
  if (hasChildren(transformNode) && transformNode.children.length > 0) {
    if (config.enableLogging) {
      logger.debug(
        `${transformNode.type} already has ${transformNode.children.length} children from parser, preserving them`
      );
    }
    children = transformNode.children;
  } else {
    // Find children that belong to this transform operation via source location analysis
    if (config.enableLogging) {
      logger.debug(
        `${transformNode.type} has no children from parser, searching via source location analysis`
      );
    }
    children = findDirectChildrenForNode(transformNode, allNodes, config);
    if (config.enableLogging) {
      logger.debug(
        `${transformNode.type} found ${children.length} children via source location analysis`
      );
    }
  }

  // Recursively restructure children if they are CSG nodes
  const restructuredChildren = children.map((child) => {
    if (isCSGNode(child)) {
      return restructureCSGNode(child, allNodes, config);
    }
    return child;
  });

  // Create new node with proper children
  const restructuredNode = {
    ...transformNode,
    children: restructuredChildren,
  };

  if (config.enableLogging) {
    logger.debug(`${transformNode.type} now has ${restructuredChildren.length} children`);
    console.log(
      '[DEBUG][ASTRestructuringService] Transform children types:',
      restructuredChildren.map((c) => c.type)
    );
  }

  return restructuredNode;
};

/**
 * Determine which nodes should be kept as top-level nodes
 */
const getTopLevelNodes = (
  allNodes: readonly ASTNode[],
  config: ASTRestructuringConfig
): ASTNode[] => {
  const topLevelNodes: ASTNode[] = [];
  const childNodes = new Set<ASTNode>();

  // First pass: identify all nodes that are children of other nodes
  for (const parentNode of allNodes) {
    if (isCSGNode(parentNode) || isTransformNode(parentNode)) {
      const children = findDirectChildrenForNode(parentNode, allNodes, config);
      children.forEach((child) => childNodes.add(child));
    }
  }

  // Second pass: collect nodes that are not children of other nodes
  for (const node of allNodes) {
    if (!childNodes.has(node)) {
      topLevelNodes.push(node);
    }
  }

  if (config.enableLogging) {
    logger.debug(`Found ${topLevelNodes.length} top-level nodes`);
  }

  return topLevelNodes;
};

/**
 * Try to parse a child primitive from source code for a transform node.
 * This is a workaround for Tree-sitter grammar limitations where transform statements
 * with immediate child primitives are not parsed correctly by the grammar.
 *
 * Handles multiple patterns:
 * - Single line: 'translate([10,0,0]) sphere(10);'
 * - Multi-line: 'translate([10,0,0])\n  sphere(10);'
 * - Curly braces: 'translate([10,0,0]) { sphere(10); }'
 *
 * @param transformNode - The transform node that needs a child
 * @returns The child primitive node if found, null otherwise
 */
const tryParseChildFromSourceCode = (transformNode: ASTNode): ASTNode | null => {
  if (!transformNode.location || !currentSourceCode) {
    return null;
  }

  try {
    // Get the source code lines
    const lines = currentSourceCode.split('\n');
    const transformLineIndex = transformNode.location.start.line;
    const transformLine = lines[transformLineIndex];

    if (!transformLine) {
      return null;
    }

    // Pattern 1: Same line - "translate([10,0,0]) sphere(10);"
    const sameLinePrimitiveMatch = transformLine.match(
      /\)\s*(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
    );
    if (sameLinePrimitiveMatch) {
      const primitiveType = sameLinePrimitiveMatch[1];
      const primitiveStart = transformLine.indexOf(primitiveType!);

      return createSyntheticPrimitiveNode(
        primitiveType!,
        transformLineIndex,
        primitiveStart,
        transformLine.length
      );
    }

    // Pattern 2: Curly braces on same line - "translate([10,0,0]) { sphere(10); }"
    const curlyBraceMatch = transformLine.match(
      /\)\s*\{\s*(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
    );
    if (curlyBraceMatch) {
      const primitiveType = curlyBraceMatch[1];
      const primitiveStart = transformLine.indexOf(primitiveType!);

      return createSyntheticPrimitiveNode(
        primitiveType!,
        transformLineIndex,
        primitiveStart,
        transformLine.length
      );
    }

    // Pattern 3: Multi-line - search next few lines for primitives
    const maxLookAhead = 3; // Look ahead up to 3 lines
    for (let i = 1; i <= maxLookAhead && transformLineIndex + i < lines.length; i++) {
      const nextLine = lines[transformLineIndex + i];
      if (!nextLine) continue;

      // Skip empty lines and lines with only whitespace
      if (nextLine.trim() === '') continue;

      // Look for primitive on the next line (with optional indentation)
      const nextLinePrimitiveMatch = nextLine.match(
        /^\s*(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
      );
      if (nextLinePrimitiveMatch) {
        const primitiveType = nextLinePrimitiveMatch[1];
        const primitiveStart = nextLine.indexOf(primitiveType!);

        return createSyntheticPrimitiveNode(
          primitiveType!,
          transformLineIndex + i,
          primitiveStart,
          nextLine.length
        );
      }

      // Look for primitive inside curly braces on next line
      const nextLineCurlyMatch = nextLine.match(
        /\{\s*(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
      );
      if (nextLineCurlyMatch) {
        const primitiveType = nextLineCurlyMatch[1];
        const primitiveStart = nextLine.indexOf(primitiveType!);

        return createSyntheticPrimitiveNode(
          primitiveType!,
          transformLineIndex + i,
          primitiveStart,
          nextLine.length
        );
      }

      // If we encounter another statement (not just whitespace/braces), stop looking
      if (nextLine.trim() && !nextLine.trim().startsWith('{') && !nextLine.trim().startsWith('}')) {
        // Check if this line itself contains a primitive
        const statementPrimitiveMatch = nextLine.match(
          /(cube|sphere|cylinder|polyhedron|circle|square|polygon)\s*\(/
        );
        if (statementPrimitiveMatch) {
          const primitiveType = statementPrimitiveMatch[1];
          const primitiveStart = nextLine.indexOf(primitiveType!);

          return createSyntheticPrimitiveNode(
            primitiveType!,
            transformLineIndex + i,
            primitiveStart,
            nextLine.length
          );
        }
        break; // Stop looking if we hit another statement
      }
    }

    return null;
  } catch (error) {
    console.warn('[WARN][ASTRestructuringService] Error parsing child from source code:', error);
    return null;
  }
};

/**
 * Create a synthetic primitive node for the workaround.
 *
 * @param primitiveType - The type of primitive (cube, sphere, etc.)
 * @param line - The line number in the source
 * @param startColumn - The start column
 * @param endColumn - The end column
 * @returns A synthetic AST node for the primitive
 */
const createSyntheticPrimitiveNode = (
  primitiveType: string,
  line: number,
  startColumn: number,
  endColumn: number
): ASTNode => {
  const location = {
    start: { line, column: startColumn, offset: 0 },
    end: { line, column: endColumn, offset: 0 },
  };

  // Create appropriate primitive node based on type
  switch (primitiveType) {
    case 'cube':
      return {
        type: 'cube',
        size: 10, // Default size
        center: false,
        location,
      };
    case 'sphere':
      return {
        type: 'sphere',
        radius: 5, // Default radius
        location,
      };
    case 'cylinder':
      return {
        type: 'cylinder',
        h: 10,
        r1: 5,
        r2: 5,
        center: false,
        location,
      };
    default:
      // Generic primitive node
      return {
        type: primitiveType as any,
        location,
      };
  }
};

/**
 * Main AST restructuring function
 */
export const restructureAST = (
  ast: readonly ASTNode[],
  config: Partial<ASTRestructuringConfig> = {}
): Result<readonly ASTNode[], string> => {
  return tryCatch(
    () => {
      const finalConfig = { ...DEFAULT_CONFIG, ...config };

      if (finalConfig.enableLogging) {
        logger.init(`Restructuring AST with ${ast.length} nodes`);
      }

      // If AST is empty or has only one node, no restructuring needed
      if (ast.length <= 1) {
        if (finalConfig.enableLogging) {
          logger.debug(`AST too small for restructuring, returning as-is`);
        }
        return ast;
      }

      // Get top-level nodes (nodes that are not children of other nodes)
      const topLevelNodes = getTopLevelNodes(ast, finalConfig);

      if (finalConfig.enableLogging) {
        console.log(
          '[DEBUG][ASTRestructuringService] Initial top-level nodes:',
          topLevelNodes.map((n) => n.type)
        );
      }

      // Restructure each top-level node
      const restructuredNodes = topLevelNodes.map((node) => {
        if (finalConfig.enableLogging) {
          logger.debug(
            `Processing node: ${node.type}, isTransform: ${isTransformNode(node)}, isCSG: ${isCSGNode(node)}`
          );
        }
        if (isTransformNode(node)) {
          if (finalConfig.enableLogging) {
            logger.debug(`Restructuring transform node: ${node.type}`);
          }
          return restructureTransformNode(node, ast, finalConfig);
        } else if (isCSGNode(node)) {
          if (finalConfig.enableLogging) {
            logger.debug(`Restructuring CSG node: ${node.type}`);
          }
          return restructureCSGNode(node, ast, finalConfig);
        } else {
          // Primitive nodes don't need restructuring
          if (finalConfig.enableLogging) {
            logger.debug(`Primitive node, no restructuring needed: ${node.type}`);
          }
          return node;
        }
      });

      if (finalConfig.enableLogging) {
        logger.debug(`Restructuring complete: ${restructuredNodes.length} top-level nodes`);
        console.log(
          '[DEBUG][ASTRestructuringService] Final restructured nodes:',
          restructuredNodes.map((n) => n.type)
        );
        console.log(
          '[DEBUG][ASTRestructuringService] Final restructured nodes with children:',
          restructuredNodes.map((n) => ({
            type: n.type,
            hasChildren: 'children' in n,
            childrenCount: 'children' in n && Array.isArray(n.children) ? n.children.length : 0,
            childrenTypes:
              'children' in n && Array.isArray(n.children) ? n.children.map((c) => c.type) : [],
          }))
        );
      }

      return Object.freeze(restructuredNodes);
    },
    (err) => `AST restructuring failed: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Create AST restructuring service instance
 */
export const createASTRestructuringService = (config?: Partial<ASTRestructuringConfig>) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    restructure: (ast: readonly ASTNode[]) => restructureAST(ast, finalConfig),
    config: finalConfig,
  };
};
