/**
 * @file AST Utilities
 * 
 * Shared utilities for AST operations to eliminate code duplication
 * across OpenSCAD parsing and validation components
 * 
 * Follows DRY principle by extracting common AST manipulation patterns
 */

import { type ASTNode } from '@holistic-stack/openscad-parser';
import type { ParseError } from '../../openscad-parser/types/ast-types';

// Re-export ParseError for external usage
export type { ParseError };

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Result type for AST operations following functional programming patterns
 */
export type ASTResult<T, E = string> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// ============================================================================
// AST Validation Utilities
// ============================================================================

/**
 * Validate AST array for operations
 * Pure function that checks AST validity
 */
export const validateAST = (ast: readonly ASTNode[] | null | undefined): ASTResult<readonly ASTNode[]> => {
  if (!ast) {
    return { success: false, error: 'AST is null or undefined' };
  }
  
  if (!Array.isArray(ast)) {
    return { success: false, error: 'AST is not an array' };
  }
  
  // Check each node for validity
  for (let i = 0; i < ast.length; i++) {
    const node = ast[i];
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
      return { success: false, error: `Invalid AST node found at index ${i}` };
    }
  }
  
  return { success: true, data: ast };
};

/**
 * Validate single AST node for operations
 * Pure function that checks node validity
 */
export const validateASTNode = (node: ASTNode | null | undefined): ASTResult<ASTNode> => {
  if (!node) {
    return { success: false, error: 'AST node is null or undefined' };
  }
  
  if (typeof node !== 'object') {
    return { success: false, error: 'AST node is not an object' };
  }
  
  if (!node.type) {
    return { success: false, error: 'AST node missing required type property' };
  }
  
  if (typeof node.type !== 'string') {
    return { success: false, error: 'AST node type must be a string' };
  }
  
  return { success: true, data: node };
};

/**
 * Validate node array and filter out invalid nodes
 * Pure function that checks node array validity
 */
export const validateNodeArray = (nodes: ASTNode[] | null | undefined): ASTResult<ASTNode[]> => {
  if (!nodes) {
    return { success: false, error: 'Node array is null or undefined' };
  }
  
  if (!Array.isArray(nodes)) {
    return { success: false, error: 'Input is not an array' };
  }
  
  // Filter out invalid nodes
  const validNodes = nodes.filter(node => {
    const validation = validateASTNode(node);
    return validation.success;
  });
  
  return { success: true, data: validNodes };
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Create standardized AST operation error
 * Consistent error message formatting
 */
export const createASTError = (operation: string, error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return `Failed to ${operation}: ${errorMessage}`;
};

/**
 * Wrap AST operation with error handling
 * Higher-order function for consistent error handling
 */
export const withASTErrorHandling = <T>(
  operation: string,
  fn: () => T
): ASTResult<T> => {
  try {
    const result = fn();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: createASTError(operation, error) };
  }
};

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Log AST operation for debugging
 * Standardized logging format for AST operations
 */
export const logASTOperation = (
  operation: string,
  nodes: readonly ASTNode[],
  additionalInfo?: Record<string, unknown>
): void => {
  const baseInfo = {
    nodeCount: nodes.length,
    nodeTypes: nodes.map(node => node.type)
  };
  
  const logInfo = additionalInfo ? { ...baseInfo, ...additionalInfo } : baseInfo;
  
  console.log(`[AST Service] ${operation}:`, logInfo);
};

/**
 * Log AST operation result
 * Standardized logging for AST operation outcomes
 */
export const logASTResult = <T>(
  operation: string,
  result: ASTResult<T>,
  additionalInfo?: Record<string, unknown>
): void => {
  if (result.success) {
    console.log(`[AST Service] ${operation} completed successfully`, additionalInfo);
  } else {
    console.warn(`[AST Service] ${operation} failed:`, result.error, additionalInfo);
  }
};

// ============================================================================
// Processing Utilities
// ============================================================================

/**
 * Process AST nodes with a transformation function
 * Pure function for AST node processing
 */
export const processASTNodes = <T>(
  nodes: readonly ASTNode[],
  processor: (node: ASTNode) => T
): T[] => {
  return nodes.map(processor);
};

/**
 * Transform AST node with a transformation function
 * Pure function for single node transformation
 */
export const transformASTNode = <T>(
  node: ASTNode,
  transformer: (node: ASTNode) => T
): T => {
  return transformer(node);
};

// ============================================================================
// Error Parsing Utilities
// ============================================================================

/**
 * Extract line number from error message
 * Pure function that parses line information from error strings
 */
export const extractLineNumber = (errorMessage: string): number | null => {
  const lineMatch = errorMessage.match(/line\s+(\d+)/i);
  return lineMatch?.[1] ? parseInt(lineMatch[1], 10) : null;
};

/**
 * Extract column number from error message
 * Pure function that parses column information from error strings
 */
export const extractColumnNumber = (errorMessage: string): number | null => {
  const columnMatch = errorMessage.match(/column\s+(\d+)/i);
  return columnMatch?.[1] ? parseInt(columnMatch[1], 10) : null;
};

/**
 * Create ParseError from error message
 * Standardized ParseError creation with line/column extraction
 */
export const createParseError = (
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error'
): ParseError => {
  return {
    message,
    location: {
      line: extractLineNumber(message) ?? 1,
      column: extractColumnNumber(message) ?? 1,
    },
    severity,
  };
};

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Format performance time for consistent display
 * Pure function for time formatting
 */
export const formatPerformanceTime = (timeMs: number): string => {
  return `${timeMs.toFixed(2)}ms`;
};

/**
 * Check if performance time is within target
 * Pure function for performance validation
 */
export const isWithinPerformanceTarget = (timeMs: number, targetMs: number = 300): boolean => {
  return timeMs <= targetMs;
};

// All functions are already exported individually above
