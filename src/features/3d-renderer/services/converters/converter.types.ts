import type { ASTNode, SourceLocation } from '@holistic-stack/openscad-parser';

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
