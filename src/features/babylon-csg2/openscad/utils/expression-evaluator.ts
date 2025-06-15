import type {
  ExpressionNode,
  ParameterValue,
  BinaryExpressionNode,
  UnaryExpressionNode,
  FunctionCallNode
} from '@holistic-stack/openscad-parser';

/**
 * Represents a scope for variable lookup during expression evaluation.
 * A scope is a map from variable names to their values.
 */
export type Scope = Map<string, ParameterValue>;

/**
 * Evaluates OpenSCAD AST ExpressionNodes within a given scope.
 * This class handles various types of expressions, including literals, variables, and potentially
 * more complex operations like binary expressions and function calls.
 */
export class ExpressionEvaluator {
  private scope: Scope;

  constructor(scope: Scope = new Map()) {
    this.scope = scope;
  }

  /**
   * Evaluates an ExpressionNode and returns its value.
   * @param expression The ExpressionNode to evaluate.
   * @returns The evaluated value of the expression.
   * @throws Error if the expression type is unsupported or a variable is not found.
   */
  evaluate(expression: ExpressionNode): ParameterValue {
    switch (expression.expressionType) {
      case 'literal': {
        const literalExpr = expression as { value: ParameterValue };
        return literalExpr.value;
      }
      case 'identifier': {
        const identifierExpr = expression as { text?: string; name?: string };
        const varName = identifierExpr.text ?? identifierExpr.name;
        if (varName && this.scope.has(varName)) {
          const value = this.scope.get(varName);
          if (value === undefined) {
            throw new Error(`Variable '${varName}' not found in scope.`);
          }
          return value;
        } else {
          throw new Error(`Variable '${varName}' not found in scope.`);
        }
      }
      case 'binary_expression':
      case 'binary':
        return this._evaluateBinaryExpression(expression as BinaryExpressionNode);
      case 'unary_expression':
      case 'unary':
        return this._evaluateUnaryExpression(expression as UnaryExpressionNode);
      case 'function_call':
        return this._evaluateFunctionCall(expression as FunctionCallNode);
      default:
        throw new Error(`Unsupported expression type: ${expression.expressionType}`);
    }
  }

  private _evaluateBinaryExpression(node: BinaryExpressionNode): ParameterValue {
    const leftValue = this.evaluate(node.left);
    const rightValue = this.evaluate(node.right);

    // Basic arithmetic operations for now. Need to handle other types and operators.
    switch (node.operator) {
      case '+': return (leftValue as number) + (rightValue as number);
      case '-': return (leftValue as number) - (rightValue as number);
      case '*': return (leftValue as number) * (rightValue as number);
      case '/': return (leftValue as number) / (rightValue as number);
      case '%': return (leftValue as number) % (rightValue as number);
      case '&&': return (leftValue as boolean) && (rightValue as boolean);
      case '||': return (leftValue as boolean) || (rightValue as boolean);
      case '<': return (leftValue as number) < (rightValue as number);
      case '<=': return (leftValue as number) <= (rightValue as number);
      case '>': return (leftValue as number) > (rightValue as number);
      case '>=': return (leftValue as number) >= (rightValue as number);
      case '==': return leftValue === rightValue;
      case '!=': return leftValue !== rightValue;
      default:
        throw new Error(`Unsupported binary operator: ${node.operator}`);
    }
  }

  private _evaluateUnaryExpression(node: UnaryExpressionNode): ParameterValue {
    const operandValue = this.evaluate(node.operand);

    switch (node.operator) {
      case '-': return -(operandValue as number);
      case '!': return !(operandValue as boolean);
      default:
        throw new Error(`Unsupported unary operator: ${node.operator}`);
    }
  }

  private _evaluateFunctionCall(node: FunctionCallNode): ParameterValue {
    // This is a complex one. For now, let's just throw an error or return a placeholder.
    // Real implementation would involve looking up the function, evaluating its arguments,
    // and executing its logic.
    throw new Error(`Function calls are not yet supported: ${node.functionName}`);
  }

  /**
   * Creates a new scope that extends the current scope.
   * @param newVariables A map of new variables to add to the extended scope.
   * @returns A new Scope instance.
   */
  extendScope(newVariables: Map<string, ParameterValue>): Scope {
    return new Map([...this.scope, ...newVariables]);
  }
}
