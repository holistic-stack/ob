import { NodeLocation } from '../../../node-location.js';

export abstract class AstNode {
  constructor(public readonly location: NodeLocation) {}

  abstract accept<T>(visitor: unknown): T;
}
