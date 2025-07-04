import { AstNode } from './ast-node.js';

export abstract class Expression extends AstNode {
  abstract override accept<T>(visitor: unknown): T;
}
