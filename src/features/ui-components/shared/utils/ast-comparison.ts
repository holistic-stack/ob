/**
 * AST Comparison Utilities
 * 
 * Provides efficient deep comparison functions for AST nodes to prevent
 * unnecessary parsing and rendering operations.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';

/**
 * Deep comparison of two AST node arrays
 * 
 * @param ast1 - First AST array
 * @param ast2 - Second AST array
 * @returns True if ASTs are structurally identical
 */
export function compareAST(ast1: readonly ASTNode[], ast2: readonly ASTNode[]): boolean {
  // Quick reference check
  if (ast1 === ast2) return true;
  
  // Length check
  if (ast1.length !== ast2.length) return false;
  
  // Empty arrays are equal
  if (ast1.length === 0 && ast2.length === 0) return true;
  
  // Deep comparison of each node
  for (let i = 0; i < ast1.length; i++) {
    if (!compareASTNode(ast1[i], ast2[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Deep comparison of two AST nodes
 * 
 * @param node1 - First AST node
 * @param node2 - Second AST node
 * @returns True if nodes are structurally identical
 */
export function compareASTNode(node1: ASTNode, node2: ASTNode): boolean {
  // Quick reference check
  if (node1 === node2) return true;
  
  // Null/undefined checks
  if (!node1 || !node2) return node1 === node2;
  
  // Type check
  if (node1.type !== node2.type) return false;
  
  // Get all keys from both nodes
  const keys1 = Object.keys(node1);
  const keys2 = Object.keys(node2);
  
  // Key count check
  if (keys1.length !== keys2.length) return false;
  
  // Compare each property
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    const value1 = (node1 as any)[key];
    const value2 = (node2 as any)[key];
    
    if (!compareValue(value1, value2)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Deep comparison of values (handles arrays, objects, primitives)
 * 
 * @param value1 - First value
 * @param value2 - Second value
 * @returns True if values are equal
 */
function compareValue(value1: any, value2: any): boolean {
  // Quick reference check
  if (value1 === value2) return true;
  
  // Null/undefined checks
  if (value1 == null || value2 == null) return value1 === value2;
  
  // Type check
  if (typeof value1 !== typeof value2) return false;
  
  // Array comparison
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    
    for (let i = 0; i < value1.length; i++) {
      if (!compareValue(value1[i], value2[i])) {
        return false;
      }
    }
    return true;
  }
  
  // Object comparison (including AST nodes)
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    // Handle AST nodes specifically
    if (value1.type && value2.type) {
      return compareASTNode(value1, value2);
    }
    
    // Generic object comparison
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!compareValue(value1[key], value2[key])) return false;
    }
    return true;
  }
  
  // Primitive comparison (already handled by === above, but explicit for clarity)
  return value1 === value2;
}

/**
 * Generate a hash string for an AST array for quick comparison
 * 
 * @param ast - AST array to hash
 * @returns Hash string representing the AST structure
 */
export function hashAST(ast: readonly ASTNode[]): string {
  if (ast.length === 0) return 'empty';
  
  const hashParts = ast.map(node => hashASTNode(node));
  return hashParts.join('|');
}

/**
 * Generate a hash string for a single AST node
 * 
 * @param node - AST node to hash
 * @returns Hash string representing the node structure
 */
function hashASTNode(node: ASTNode): string {
  if (!node) return 'null';

  const parts: string[] = [node.type];

  // Add key-value pairs in sorted order for consistent hashing
  const keys = Object.keys(node).filter(key => key !== 'type').sort();

  for (const key of keys) {
    const value = (node as any)[key];
    parts.push(`${key}:${hashValue(value)}`);
  }

  return parts.join(',');
}

/**
 * Generate a hash for any value
 * 
 * @param value - Value to hash
 * @returns Hash string
 */
function hashValue(value: any): string {
  if (value == null) return 'null';
  
  if (Array.isArray(value)) {
    return `[${value.map(hashValue).join(',')}]`;
  }
  
  if (typeof value === 'object' && value.type) {
    return hashASTNode(value);
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const pairs = keys.map(key => `${key}:${hashValue(value[key])}`);
    return `{${pairs.join(',')}}`;
  }
  
  return String(value);
}

/**
 * Memoized AST comparison using hash-based caching
 */
class ASTComparisonCache {
  private cache = new Map<string, string>();
  private maxSize = 100;
  
  /**
   * Compare two AST arrays with caching
   * 
   * @param ast1 - First AST array
   * @param ast2 - Second AST array
   * @returns True if ASTs are identical
   */
  compareWithCache(ast1: readonly ASTNode[], ast2: readonly ASTNode[]): boolean {
    // Quick reference check
    if (ast1 === ast2) return true;
    
    // Generate hashes
    const hash1 = this.getOrCreateHash(ast1);
    const hash2 = this.getOrCreateHash(ast2);
    
    return hash1 === hash2;
  }
  
  private getOrCreateHash(ast: readonly ASTNode[]): string {
    const key = JSON.stringify(ast); // Simple key for cache lookup
    
    let hash = this.cache.get(key);
    if (!hash) {
      hash = hashAST(ast);
      
      // Manage cache size
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(key, hash);
    }
    
    return hash;
  }
  
  /**
   * Clear the comparison cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const astComparisonCache = new ASTComparisonCache();

/**
 * Convenience function for cached AST comparison
 * 
 * @param ast1 - First AST array
 * @param ast2 - Second AST array
 * @returns True if ASTs are identical
 */
export function compareASTCached(ast1: readonly ASTNode[], ast2: readonly ASTNode[]): boolean {
  return astComparisonCache.compareWithCache(ast1, ast2);
}
