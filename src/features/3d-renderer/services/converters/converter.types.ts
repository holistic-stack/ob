import type {
  BaseSourceLocation,
  CoreNode,
  ParentNode,
} from '../../../../shared/types/ast.types.js';
import type { OperationResult } from '../../../../shared/types/operations.types.js';
import type { ASTNode, SourceLocation } from '../../../openscad-parser/core/ast-types.js';

/**
 * Mirror node interface extending shared types
 */
export interface MirrorNode extends ParentNode {
  type: 'mirror';
  v: readonly [number, number, number];
  children: readonly ASTNode[];
}

/**
 * Rotate extrude node interface extending shared types
 */
export interface RotateExtrudeNode extends ParentNode {
  type: 'rotate_extrude';
  angle?: number;
  children: readonly ASTNode[];
}

/**
 * Converter operation types using shared operation patterns
 */
export interface ConverterOperation<TInput extends CoreNode, TOutput> {
  readonly convert: (node: TInput) => OperationResult<TOutput, string>;
  readonly canConvert: (node: CoreNode) => node is TInput;
  readonly name: string;
  readonly priority: number;
}

/**
 * Batch converter interface for multiple nodes
 */
export interface BatchConverter<TInput extends CoreNode, TOutput> {
  readonly convertBatch: (
    nodes: ReadonlyArray<TInput>
  ) => OperationResult<ReadonlyArray<TOutput>, string>;
  readonly canConvertBatch: (nodes: ReadonlyArray<CoreNode>) => boolean;
}
