import { Expression } from '../expression.js';
import { NodeLocation } from '../../../../node-location.js';

type BinaryOperator =
  | '+' | '-' | '*' | '/' | '%'     // Arithmetic
  | '==' | '!=' | '<' | '<=' | '>' | '>='  // Comparison
  | '&&' | '||';                           // Logical

export class BinaryExpression extends Expression {
  constructor(
    location: NodeLocation,
    public readonly left: Expression,
    public readonly operator: BinaryOperator,
    public readonly right: Expression
  ) {
    super(location);
  }

  override toString(): string {
    return `(${this.left} ${this.operator} ${this.right})`;
  }

  accept<T>(visitor: { visitBinaryExpression(node: BinaryExpression): T }): T {
    return visitor.visitBinaryExpression(this);
  }
}
