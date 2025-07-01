import type { ASTNode, SourceLocation } from '../../../openscad-parser/core/ast-types.js';

/**
 * Mirror node interface for type safety
 */
export interface MirrorNode {
  type: 'mirror';
  v: readonly [number, number, number];
  children: readonly ASTNode[];
  location?: SourceLocation;
}

/**
 * Rotate extrude node interface for type safety
 */
export interface RotateExtrudeNode {
  type: 'rotate_extrude';
  angle?: number;
  children: readonly ASTNode[];
  location?: SourceLocation;
}
