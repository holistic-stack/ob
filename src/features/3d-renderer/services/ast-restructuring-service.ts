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

  if (config.enableLogging && directChildren.length > 0) {
    directChildren.forEach((child) => {
      logger.debug(
        `Found direct child ${child.type} for parent ${parentNode.type} via source location`
      );
    });
  }

  return directChildren;
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
    children = findDirectChildrenForNode(transformNode, allNodes, config);
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

      // Restructure each top-level node
      const restructuredNodes = topLevelNodes.map((node) => {
        if (isTransformNode(node)) {
          return restructureTransformNode(node, ast, finalConfig);
        } else if (isCSGNode(node)) {
          return restructureCSGNode(node, ast, finalConfig);
        } else {
          // Primitive nodes don't need restructuring
          return node;
        }
      });

      if (finalConfig.enableLogging) {
        logger.debug(`Restructuring complete: ${restructuredNodes.length} top-level nodes`);
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
