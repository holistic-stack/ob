/**
 * Shared Types Utilities
 *
 * Utility functions and helpers for working with shared types across
 * all features. These utilities provide common operations and transformations
 * that maintain type safety and consistency.
 */

import type {
  BaseErrorNode,
  BaseExpressionNode,
  BasePosition,
  BaseSourceLocation,
  BaseStatementNode,
  CoreNode,
  NodeId,
  NodeMetadata,
  NodeType,
  ParentNode,
} from './ast.types.js';

import type {
  OperationError,
  OperationId,
  OperationMetadata,
  OperationMetrics,
  OperationResult,
  OperationType,
} from './operations.types.js';

import type { Result } from './result.types.js';

/**
 * AST Node Utilities
 */
export const nodeUtils = {
  /**
   * Generate a unique node ID
   */
  generateNodeId: (): NodeId => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as NodeId;
  },

  /**
   * Create a node type from string
   */
  createNodeType: (type: string): NodeType => {
    return type as NodeType;
  },

  /**
   * Check if node has children
   */
  hasChildren: (node: CoreNode): node is ParentNode => {
    return 'children' in node && Array.isArray((node as ParentNode).children);
  },

  /**
   * Check if node is an expression
   */
  isExpression: (node: CoreNode): node is BaseExpressionNode => {
    return 'expressionType' in node;
  },

  /**
   * Check if node is a statement
   */
  isStatement: (node: CoreNode): node is BaseStatementNode => {
    return 'statementType' in node || (!('expressionType' in node) && node.type !== 'error');
  },

  /**
   * Check if node is an error node
   */
  isError: (node: CoreNode): node is BaseErrorNode => {
    return node.type === 'error';
  },

  /**
   * Get all children of a node
   */
  getChildren: (node: CoreNode): ReadonlyArray<CoreNode> => {
    if (nodeUtils.hasChildren(node)) {
      return node.children;
    }
    return [];
  },

  /**
   * Find nodes by predicate
   */
  findNodes: <T extends CoreNode>(
    root: CoreNode,
    predicate: (node: CoreNode) => node is T
  ): ReadonlyArray<T> => {
    const results: T[] = [];

    const traverse = (node: CoreNode): void => {
      if (predicate(node)) {
        results.push(node);
      }

      nodeUtils.getChildren(node).forEach(traverse);
    };

    traverse(root);
    return results;
  },

  /**
   * Create node metadata
   */
  createMetadata: (
    nodeId: NodeId,
    nodeType: NodeType,
    options: Partial<NodeMetadata> = {}
  ): NodeMetadata => {
    return {
      nodeId,
      nodeType,
      depth: 0,
      childrenIds: [],
      size: 1,
      complexity: 1,
      isOptimized: false,
      lastAccessed: new Date(),
      ...options,
    };
  },

  /**
   * Calculate node depth
   */
  calculateDepth: (node: CoreNode, root: CoreNode): number => {
    const _depth = 0;

    const findDepth = (current: CoreNode, target: CoreNode, currentDepth: number): number => {
      if (current === target) {
        return currentDepth;
      }

      for (const child of nodeUtils.getChildren(current)) {
        const found = findDepth(child, target, currentDepth + 1);
        if (found !== -1) {
          return found;
        }
      }

      return -1;
    };

    return findDepth(root, node, 0);
  },

  /**
   * Count descendant nodes
   */
  countDescendants: (node: CoreNode): number => {
    let count = 0;

    const traverse = (current: CoreNode): void => {
      count++;
      nodeUtils.getChildren(current).forEach(traverse);
    };

    traverse(node);
    return count - 1; // Exclude the node itself
  },
};

/**
 * Operation Utilities
 */
export const operationUtils = {
  /**
   * Generate a unique operation ID
   */
  generateOperationId: (): OperationId => {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as OperationId;
  },

  /**
   * Create operation type from string
   */
  createOperationType: (type: string): OperationType => {
    return type as OperationType;
  },

  /**
   * Create successful operation result
   */
  createSuccess: <T>(
    data: T,
    metadata: OperationMetadata,
    metrics?: OperationMetrics
  ): OperationResult<T, OperationError> => {
    return {
      success: true,
      data: { data, metadata, metrics },
    } as OperationResult<T, OperationError>;
  },

  /**
   * Create failed operation result
   */
  createError: <T>(
    error: OperationError,
    metadata: OperationMetadata,
    metrics?: OperationMetrics
  ): OperationResult<T, OperationError> => {
    return {
      success: false,
      error: { error, metadata, metrics },
    } as OperationResult<T, OperationError>;
  },

  /**
   * Create operation metadata
   */
  createMetadata: (
    id: OperationId,
    type: OperationType,
    options: Partial<OperationMetadata> = {}
  ): OperationMetadata => {
    return {
      id,
      type,
      status: 'pending',
      priority: 'normal',
      startTime: new Date(),
      retryCount: 0,
      maxRetries: 3,
      tags: [],
      context: {},
      ...options,
    };
  },

  /**
   * Create operation error
   */
  createOperationError: (
    code: string,
    message: string,
    options: Partial<OperationError> = {}
  ): OperationError => {
    return {
      code,
      message,
      timestamp: new Date(),
      recoverable: false,
      ...options,
    };
  },

  /**
   * Check if operation is successful
   */
  isSuccess: <T>(result: OperationResult<T, OperationError>): boolean => {
    return result.success === true;
  },

  /**
   * Check if operation failed
   */
  isError: <T>(result: OperationResult<T, OperationError>): boolean => {
    return result.success === false;
  },

  /**
   * Extract data from successful operation
   */
  getData: <T>(result: OperationResult<T, OperationError>): T | null => {
    if (operationUtils.isSuccess(result)) {
      return (
        result as {
          success: true;
          data: { data: T; metadata: OperationMetadata; metrics?: OperationMetrics };
        }
      ).data.data;
    }
    return null;
  },

  /**
   * Extract error from failed operation
   */
  getError: <T>(result: OperationResult<T, OperationError>): OperationError | null => {
    if (operationUtils.isError(result)) {
      return (
        result as {
          success: false;
          error: { error: OperationError; metadata: OperationMetadata; metrics?: OperationMetrics };
        }
      ).error.error;
    }
    return null;
  },

  /**
   * Extract metadata from operation result
   */
  getMetadata: <T>(result: OperationResult<T, OperationError>): OperationMetadata | null => {
    if (operationUtils.isSuccess(result)) {
      return (
        result as {
          success: true;
          data: { data: T; metadata: OperationMetadata; metrics?: OperationMetrics };
        }
      ).data.metadata;
    }
    if (operationUtils.isError(result)) {
      return (
        result as {
          success: false;
          error: { error: OperationError; metadata: OperationMetadata; metrics?: OperationMetrics };
        }
      ).error.metadata;
    }
    return null;
  },
};

/**
 * Source Location Utilities
 */
export const locationUtils = {
  /**
   * Create a position
   */
  createPosition: (line: number, column: number, offset: number): BasePosition => {
    return { line, column, offset };
  },

  /**
   * Create a source location
   */
  createLocation: (start: BasePosition, end: BasePosition, text?: string): BaseSourceLocation => {
    return { start, end, text };
  },

  /**
   * Check if position is within range
   */
  isPositionInRange: (position: BasePosition, location: BaseSourceLocation): boolean => {
    const { start, end } = location;

    if (position.line < start.line || position.line > end.line) {
      return false;
    }

    if (position.line === start.line && position.column < start.column) {
      return false;
    }

    if (position.line === end.line && position.column >= end.column) {
      return false;
    }

    return true;
  },

  /**
   * Calculate location length
   */
  getLocationLength: (location: BaseSourceLocation): number => {
    return location.end.offset - location.start.offset;
  },

  /**
   * Merge two locations
   */
  mergeLocations: (first: BaseSourceLocation, second: BaseSourceLocation): BaseSourceLocation => {
    const start = first.start.offset <= second.start.offset ? first.start : second.start;
    const end = first.end.offset >= second.end.offset ? first.end : second.end;

    return {
      start,
      end,
      text: first.text && second.text ? `${first.text}${second.text}` : undefined,
    };
  },
};

/**
 * Type Conversion Utilities
 */
export const conversionUtils = {
  /**
   * Convert Result to OperationResult
   */
  resultToOperationResult: <T, E>(
    result: Result<T, E>,
    metadata: OperationMetadata,
    errorMapper: (error: E) => OperationError = (e) =>
      operationUtils.createOperationError('CONVERSION_ERROR', String(e))
  ): OperationResult<T, OperationError> => {
    if (result.success) {
      return operationUtils.createSuccess(result.data, metadata);
    } else {
      const error = (result as { success: false; error: E }).error;
      return operationUtils.createError(errorMapper(error), metadata);
    }
  },

  /**
   * Convert OperationResult to Result
   */
  operationResultToResult: <T>(
    operationResult: OperationResult<T, OperationError>
  ): Result<T, OperationError> => {
    if (operationUtils.isSuccess(operationResult)) {
      const data = operationUtils.getData(operationResult);
      return { success: true, data: data! };
    } else {
      const error = operationUtils.getError(operationResult);
      return { success: false, error: error! };
    }
  },
};

/**
 * Validation Utilities
 */
export const validationUtils = {
  /**
   * Validate node structure
   */
  validateNode: (node: CoreNode): ReadonlyArray<string> => {
    const errors: string[] = [];

    if (!node.type) {
      errors.push('Node must have a type');
    }

    if (nodeUtils.hasChildren(node)) {
      if (!Array.isArray(node.children)) {
        errors.push('Node children must be an array');
      } else {
        node.children.forEach((child, index) => {
          const childErrors = validationUtils.validateNode(child);
          childErrors.forEach((error) => {
            errors.push(`Child ${index}: ${error}`);
          });
        });
      }
    }

    return errors;
  },

  /**
   * Validate operation metadata
   */
  validateOperationMetadata: (metadata: OperationMetadata): ReadonlyArray<string> => {
    const errors: string[] = [];

    if (!metadata.id) {
      errors.push('Operation metadata must have an ID');
    }

    if (!metadata.type) {
      errors.push('Operation metadata must have a type');
    }

    if (!metadata.startTime) {
      errors.push('Operation metadata must have a start time');
    }

    if (metadata.endTime && metadata.endTime < metadata.startTime) {
      errors.push('Operation end time cannot be before start time');
    }

    if (metadata.retryCount < 0) {
      errors.push('Retry count cannot be negative');
    }

    if (metadata.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }

    return errors;
  },
};
