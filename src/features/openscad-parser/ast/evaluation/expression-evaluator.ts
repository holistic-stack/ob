/**
 * @file Expression Evaluator Interface
 *
 * Defines the interface for evaluating different types of expressions.
 * Uses the Strategy pattern to allow different evaluation approaches.
 */

import { Node as TSNode } from 'web-tree-sitter';
import type { ExpressionEvaluationContext, EvaluationResult } from './expression-evaluation-context.js';

/**
 * Base interface for expression evaluators
 */
export interface IExpressionEvaluator {
  /**
   * Check if this evaluator can handle the given node type
   */
  canEvaluate(node: TSNode): boolean;

  /**
   * Evaluate the expression node
   */
  evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult;

  /**
   * Get the priority of this evaluator (higher = more specific)
   */
  getPriority(): number;
}

/**
 * Abstract base class for expression evaluators
 */
export abstract class BaseExpressionEvaluator implements IExpressionEvaluator {
  protected supportedTypes: Set<string>;

  constructor(supportedTypes: string[]) {
    this.supportedTypes = new Set(supportedTypes);
  }

  canEvaluate(node: TSNode): boolean {
    return this.supportedTypes.has(node.type);
  }

  abstract evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult;

  abstract getPriority(): number;

  /**
   * Helper to safely get child nodes with field names
   */
  protected getChildByField(node: TSNode, fieldName: string): TSNode | null {
    return node.childForFieldName(fieldName);
  }

  /**
   * Helper to get all children of a specific type
   */
  protected getChildrenByType(node: TSNode, type: string): TSNode[] {
    const children: TSNode[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === type) {
        children.push(child);
      }
    }
    return children;
  }

  /**
   * Helper to create error result
   */
  protected createErrorResult(message: string, context: ExpressionEvaluationContext): EvaluationResult {
    context.getOptions(); // Access context for error handling
    return {
      value: null,
      type: 'undef'
    };
  }

  /**
   * Helper to validate numeric operands
   */
  protected validateNumericOperands(left: EvaluationResult, right: EvaluationResult): boolean {
    return left.type === 'number' && right.type === 'number' &&
           typeof left.value === 'number' && typeof right.value === 'number';
  }

  /**
   * Helper to convert result to number
   */
  protected toNumber(result: EvaluationResult): number {
    if (result.type === 'number' && typeof result.value === 'number') {
      return result.value;
    }
    if (result.type === 'string' && typeof result.value === 'string') {
      const num = parseFloat(result.value);
      return isNaN(num) ? 0 : num;
    }
    if (result.type === 'boolean') {
      return result.value ? 1 : 0;
    }
    return 0;
  }

  /**
   * Helper to convert result to boolean
   */
  protected toBoolean(result: EvaluationResult): boolean {
    if (result.type === 'boolean') {
      return result.value as boolean;
    }
    if (result.type === 'number') {
      return (result.value as number) !== 0;
    }
    if (result.type === 'string') {
      return (result.value as string).length > 0;
    }
    return false;
  }

  /**
   * Helper to create cache key
   */
  protected createCacheKey(node: TSNode, suffix?: string): string {
    const base = `${node.type}:${node.text}:${node.startIndex}-${node.endIndex}`;
    return suffix ? `${base}:${suffix}` : base;
  }
}

/**
 * Literal value evaluator for numbers, strings, booleans
 */
export class LiteralEvaluator extends BaseExpressionEvaluator {
  constructor() {
    super(['number', 'string', 'boolean', 'true', 'false', 'undef']);
  }

  getPriority(): number {
    return 100; // Highest priority - most specific
  }

  evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult {
    const cacheKey = this.createCacheKey(node);
    const cached = context.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    let result: EvaluationResult;

    switch (node.type) {
      case 'number': {
        const numValue = parseFloat(node.text);
        result = {
          value: isNaN(numValue) ? 0 : numValue,
          type: 'number'
        };
        break;
      }

      case 'string': {
        // Remove quotes from string literals
        let stringValue = node.text;
        if (stringValue.startsWith('"') && stringValue.endsWith('"')) {
          stringValue = stringValue.slice(1, -1);
        }
        result = {
          value: stringValue,
          type: 'string'
        };
        break;
      }

      case 'boolean':
      case 'true':
        result = {
          value: true,
          type: 'boolean'
        };
        break;

      case 'false':
        result = {
          value: false,
          type: 'boolean'
        };
        break;

      case 'undef':
        result = {
          value: null,
          type: 'undef'
        };
        break;

      default:
        result = this.createErrorResult(`Unsupported literal type: ${node.type}`, context);
    }

    context.setCachedResult(cacheKey, result);
    return result;
  }
}

/**
 * Identifier evaluator for variable references
 */
export class IdentifierEvaluator extends BaseExpressionEvaluator {
  constructor() {
    super(['identifier']);
  }

  getPriority(): number {
    return 90;
  }

  evaluate(node: TSNode, context: ExpressionEvaluationContext): EvaluationResult {
    const variableName = node.text;
    const variable = context.getVariable(variableName);

    if (variable) {
      return variable;
    }

    // Return undef for undefined variables
    return {
      value: null,
      type: 'undef'
    };
  }
}
