import type { ExpressionNode, ParameterValue } from '@holistic-stack/openscad-parser';

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
      case 'literal':
        return (expression as any).value;
      case 'identifier':
        const identifierExpr = expression as any;
        const varName = identifierExpr.text || identifierExpr.name;
        if (varName && this.scope.has(varName)) {
          return this.scope.get(varName)!;
        } else {
          throw new Error(`Variable '${varName}' not found in scope.`);
        }
      // TODO: Add cases for binary_expression, unary_expression, function_call, etc.
      default:
        throw new Error(`Unsupported expression type: ${expression.expressionType}`);
    }
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
