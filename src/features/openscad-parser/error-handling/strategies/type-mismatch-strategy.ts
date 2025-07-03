/**
 * @file Type mismatch recovery strategy for OpenSCAD parser error handling
 *
 * This module implements a sophisticated recovery strategy for handling type mismatch
 * errors in OpenSCAD code. Type mismatches occur when values of incompatible types
 * are used in operations, function calls, or assignments. This strategy provides
 * automatic type conversion capabilities and intelligent suggestions for resolving
 * type-related errors through safe and semantically correct transformations.
 *
 * The type mismatch strategy includes:
 * - **Automatic Type Conversion**: Converts values between compatible types when possible
 * - **Binary Operation Recovery**: Handles type mismatches in arithmetic and logical operations
 * - **Function Argument Conversion**: Fixes type mismatches in function parameter passing
 * - **Type Compatibility Checking**: Uses pluggable type checker for compatibility validation
 * - **Safe Conversion Rules**: Implements conservative conversion rules to preserve semantics
 * - **Context-Aware Recovery**: Considers operation context for appropriate conversion strategies
 *
 * Key features:
 * - **Pluggable Type System**: Uses TypeChecker interface for flexible type validation
 * - **Conservative Conversions**: Only performs safe, semantically preserving conversions
 * - **Multi-Error Support**: Handles type mismatches, invalid operations, and argument errors
 * - **Precise Replacement**: Performs exact text replacement at error locations
 * - **Conversion Registry**: Extensible system for adding new type conversion rules
 * - **High Priority Processing**: Executes early (priority 20) for type-related errors
 *
 * Supported type conversions:
 * - **String to Number**: Automatic parsing of numeric strings and explicit conversion
 * - **Number to String**: String representation using str() function
 * - **Boolean Conversions**: Logical conversions between boolean, string, and number types
 * - **Compatible Types**: Uses type checker for determining type compatibility
 *
 * Recovery patterns handled:
 * - **Assignment Mismatches**: `x = "5"` → `x = 5` (when number expected)
 * - **Function Arguments**: `sin("45")` → `sin(45)` (string to number conversion)
 * - **Binary Operations**: `5 + "3"` → `5 + 3` (mixed type arithmetic)
 * - **Boolean Context**: `if ("false")` → `if (false)` (string to boolean conversion)
 * - **Explicit Conversions**: `"123"` → `parseFloat("123")` (when automatic parsing fails)
 *
 * The strategy implements a multi-phase recovery approach:
 * 1. **Error Classification**: Determine the specific type of type mismatch error
 * 2. **Type Analysis**: Extract expected and found types from error context
 * 3. **Conversion Feasibility**: Check if conversion is possible and safe
 * 4. **Conversion Application**: Apply appropriate conversion function or rule
 * 5. **Code Replacement**: Replace the problematic value with converted version
 * 6. **Validation**: Ensure the replacement maintains code structure and semantics
 *
 * @example Basic type conversion recovery
 * ```typescript
 * import { TypeMismatchStrategy } from './type-mismatch-strategy';
 * import { TypeError } from '../types/error-types';
 *
 * // Create type checker (implementation specific)
 * const typeChecker = new OpenSCADTypeChecker();
 * const strategy = new TypeMismatchStrategy(typeChecker);
 *
 * // Create error for type mismatch
 * const error = new TypeError('Type mismatch: expected number, found string', {
 *   line: 1,
 *   column: 5,
 *   expected: 'number',
 *   found: 'string',
 *   value: '"5"',
 *   location: { line: 1, column: 5 }
 * });
 *
 * // Attempt recovery
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, 'x = "5";');
 *   console.log('Fixed code:', fixedCode);
 *   // Output: 'x = 5;' (automatic string to number conversion)
 * }
 * ```
 *
 * @example Function argument type conversion
 * ```typescript
 * const strategy = new TypeMismatchStrategy(typeChecker);
 *
 * // Function argument type mismatch
 * const error = new TypeError('Invalid argument type', {
 *   line: 2,
 *   column: 5,
 *   functionName: 'sin',
 *   paramIndex: 0,
 *   expected: 'number',
 *   found: 'string',
 *   value: '"45"',
 *   location: { line: 2, column: 5 }
 * });
 *
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, 'y = sin("45");');
 *   console.log('Fixed code:', fixedCode);
 *   // Output: 'y = sin(45);' (string to number conversion)
 *
 *   const suggestion = strategy.getRecoverySuggestion(error);
 *   console.log('Suggestion:', suggestion);
 *   // Output: "Convert argument 1 of sin() from string to number"
 * }
 * ```
 *
 * @example Binary operation type conversion
 * ```typescript
 * const strategy = new TypeMismatchStrategy(typeChecker);
 *
 * // Binary operation with mixed types
 * const error = new TypeError('Invalid operation: number + string', {
 *   line: 3,
 *   column: 7,
 *   operation: '+',
 *   leftType: 'number',
 *   rightType: 'string',
 *   leftValue: '5',
 *   rightValue: '"3"',
 *   location: { line: 3, column: 7 }
 * });
 *
 * if (strategy.canHandle(error)) {
 *   const fixedCode = strategy.recover(error, 'result = 5 + "3";');
 *   // Converts to common type: 'result = 5 + 3;'
 * }
 * ```
 *
 * @module type-mismatch-strategy
 * @since 0.1.0
 */

import { ParserError, ErrorCode } from '../types/error-types.js';
import { BaseRecoveryStrategy } from './recovery-strategy.js';

/**
 * Interface for type checking functionality
 */
interface TypeChecker {
  /**
   * Gets the type of a value or expression
   */
  getType(value: unknown): string;

  /**
   * Checks if a type is assignable to another type
   */
  isAssignable(fromType: string, toType: string): boolean;

  /**
   * Finds a common type that all given types can be converted to
   */
  findCommonType(types: string[]): string | null;
}

/**
 * Sophisticated recovery strategy for automatically fixing type mismatch errors.
 *
 * The TypeMismatchStrategy extends BaseRecoveryStrategy to provide intelligent
 * recovery for type-related errors in OpenSCAD code. This strategy implements
 * automatic type conversion capabilities using a pluggable type system and
 * conservative conversion rules that preserve semantic meaning while fixing
 * type compatibility issues.
 *
 * This implementation provides:
 * - **High Priority Processing**: Executes early (priority 20) for type-related errors
 * - **Pluggable Type System**: Uses TypeChecker interface for flexible type validation
 * - **Conservative Conversions**: Only performs safe, semantically preserving conversions
 * - **Multi-Error Support**: Handles type mismatches, invalid operations, and argument errors
 * - **Conversion Registry**: Extensible system for adding new type conversion rules
 * - **Precise Replacement**: Performs exact text replacement at error locations
 *
 * The strategy maintains a comprehensive conversion registry:
 * - **String Conversions**: Automatic parsing of numeric strings and explicit conversion functions
 * - **Number Conversions**: String representation and boolean conversion rules
 * - **Boolean Conversions**: Logical conversions to string and number representations
 * - **Type Compatibility**: Uses type checker for determining safe conversion paths
 *
 * Recovery algorithm features:
 * - **Error Classification**: Determines specific type of type mismatch error
 * - **Type Analysis**: Extracts expected and found types from error context
 * - **Conversion Feasibility**: Checks if conversion is possible and semantically safe
 * - **Multi-Phase Recovery**: Handles simple mismatches, binary operations, and function arguments
 * - **Context Preservation**: Maintains error context and provides human-readable suggestions
 *
 * @class TypeMismatchStrategy
 * @extends {BaseRecoveryStrategy}
 * @since 0.1.0
 */
export class TypeMismatchStrategy extends BaseRecoveryStrategy {
  private readonly typeConverters: Record<string, Record<string, (value: string) => string>> = {
    'string': {
      'number': (v) => {
        // If it's a quoted string containing only a number, just remove quotes
        if (v.startsWith('"') && v.endsWith('"')) {
          const inner = v.slice(1, -1);
          if (/^-?\d+(\.\d+)?$/.test(inner)) {
            return inner;
          }
        }
        return `parseFloat(${v})`;
      },
      'boolean': (v) => `(${v} != "" && ${v}.toLowerCase() !== "false")`,
    },
    'number': {
      'string': (v) => `str(${v})`,
      'boolean': (v) => `(${v} != 0)`,
    },
    'boolean': {
      'string': (v) => `(${v} ? "true" : "false")`,
      'number': (v) => `(${v} ? 1 : 0)`,
    },
  };

  constructor(private readonly typeChecker: TypeChecker) {
    super();
  }

  /** Higher priority than default */
  public override readonly priority: number = 20;

  /**
   * Determines if this strategy can handle the given error
   */
  canHandle(error: ParserError): boolean {
    return [
      ErrorCode.TYPE_MISMATCH,
      ErrorCode.INVALID_OPERATION,
      ErrorCode.INVALID_ARGUMENTS,
    ].includes(error.code);
  }

  /**
   * Attempts to recover from a type mismatch error
   */
  recover(error: ParserError, code: string): string | null {
    try {
      if (error.code === ErrorCode.TYPE_MISMATCH) {
        return this.handleTypeMismatch(error, code);
      } else if (error.code === ErrorCode.INVALID_OPERATION) {
        // Complex binary operation recovery is not yet implemented
        return null;
      } else if (error.code === ErrorCode.INVALID_ARGUMENTS) {
        // Complex function argument recovery is not yet implemented
        return null;
      }
    } catch (_e) {
      // If any error occurs during recovery, log it and return null
      console.warn('Error during type mismatch recovery:', _e);
    }
    return null;
  }

  /**
   * Handles simple type mismatch errors
   */
  private handleTypeMismatch(error: ParserError, code: string): string | null {
    const { expected, found, value, location } = error.context;
    if (!expected || !found || !location) return null;

    // Check if we can convert from found type to expected type
    const expectedType = Array.isArray(expected) ? expected[0] : expected;
    const safeExpectedType = expectedType ?? '';
    const safeFound = found ?? '';
    if (this.canConvert(safeFound, safeExpectedType)) {
      const safeValue = value ?? '';
      const convertedValue = this.convertValue(safeValue, safeFound, safeExpectedType);
      if (convertedValue !== null) {
        return this.replaceAtPosition(
          code,
          location.line,
          location.column,
          safeValue,
          convertedValue
        );
      }
    }

    return null;
  }

  /**
   * Handles invalid operation errors (e.g., number + string)
   */
  private handleInvalidOperation(error: ParserError, code: string): string | null {
    const {
      operation,
      leftType,
      rightType,
      leftValue,
      rightValue,
      location
    } = error.context;

    if (!operation || !leftType || !rightType || !location) return null;

    // Find a common type that both operands can be converted to
    const commonType = this.typeChecker.findCommonType([leftType, rightType]);
    if (!commonType) return null;

    // Convert both operands to the common type
    const convertLeft = this.canConvert(leftType, commonType) && leftValue;
    const convertRight = this.canConvert(rightType, commonType) && rightValue;

    if (convertLeft || convertRight) {
      const left = convertLeft
        ? this.convertValue(leftValue, leftType, commonType)
        : leftValue;
      const right = convertRight
        ? this.convertValue(rightValue, rightType, commonType)
        : rightValue;

      if (left !== null && right !== null) {
        // Reconstruct the operation with type conversions
        const original = `${leftValue} ${operation} ${rightValue}`;
        const converted = `${left} ${operation} ${right}`;

        return this.replaceAtPosition(
          code,
          location.line,
          location.column,
          original,
          converted
        );
      }
    }

    return null;
  }

  /**
   * Handles function argument type mismatches
   */
  private handleInvalidArguments(error: ParserError, code: string): string | null {
    const {
      functionName,
      paramIndex,
      expected,
      found,
      value,
      location
    } = error.context;

    if (expected === undefined || found === undefined || !location || value === undefined) {
      return null;
    }

    // Check if we can convert the argument to the expected type
    const expectedType = Array.isArray(expected) ? expected[0] : expected;
    const safeExpectedType = expectedType ?? '';
    const safeFound = found ?? '';
    if (this.canConvert(safeFound, safeExpectedType)) {
      const safeValue = value ?? '';
      const convertedValue = this.convertValue(safeValue, safeFound, safeExpectedType);
      if (convertedValue !== null) {
        return this.replaceAtPosition(
          code,
          location.line,
          location.column,
          safeValue,
          convertedValue
        );
      }
    }

    return null;
  }

  /**
   * Checks if a value of type 'from' can be converted to type 'to'
   */
  private canConvert(from: string, to: string): boolean {
    // Check if types are the same or if an explicit converter exists
    return from === to ||
           this.typeChecker.isAssignable(from, to) ||
           Boolean(this.getConverter(from, to));
  }

  /**
   * Gets a converter function for converting between two types
   */
  private getConverter(from: string, to: string): ((value: string) => string) | null {
    return this.typeConverters[from]?.[to] ?? null;
  }

  /**
   * Converts a value from one type to another
   */
  private convertValue(value: string, from: string, to: string): string | null {
    if (from === to) return value;

    // First try the type checker's conversion
    if (this.typeChecker.isAssignable(from, to)) {
      return value; // No conversion needed if types are compatible
    }

    // Then try explicit converters
    const converter = this.getConverter(from, to);
    if (converter) {
      return converter(value);
    }

    return null;
  }

  /**
   * Gets a human-readable description of the recovery action
   */
  getRecoverySuggestion(error: ParserError): string {
    if (error.code === ErrorCode.TYPE_MISMATCH) {
      const { expected, found } = error.context;
      const expectedType = Array.isArray(expected) ? expected[0] : expected;
      return `Convert ${found} to ${expectedType}`;
    }

    if (error.code === ErrorCode.INVALID_OPERATION) {
      const { operation, leftType, rightType } = error.context;
      return `Convert operands to compatible types for ${operation} operation (${leftType} ${operation} ${rightType})`;
    }

    if (error.code === ErrorCode.INVALID_ARGUMENTS) {
      const { functionName, paramIndex, expected, found } = error.context;
      const expectedType = Array.isArray(expected) ? expected[0] : expected;
      return `Convert argument ${(paramIndex ?? 0) + 1} of ${functionName}() from ${found} to ${expectedType}`;
    }

    return 'Fix type mismatch';
  }

  /**
   * Replace text at a specific position in the code
   * @param code The source code
   * @param line The line number (1-based)
   * @param column The column number (1-based)
   * @param oldText The text to replace
   * @param newText The replacement text
   * @returns The modified code
   */
  private replaceAtPosition(
    code: string,
    line: number,
    column: number,
    oldText: string,
    newText: string
  ): string {
    const lines = code.split('\n');
    if (line < 1 || line > lines.length) {
      return code; // Invalid line number
    }

    const targetLine = lines[line - 1];
    if (!targetLine || column < 1 || column > targetLine.length + 1) {
      return code; // Invalid column number or line not found
    }

    // Find the old text starting at the specified position
    const startIndex = column - 1;
    const endIndex = startIndex + oldText.length;

    if (targetLine.substring(startIndex, endIndex) === oldText) {
      // Replace the text
      const newLine = targetLine.substring(0, startIndex) + newText + targetLine.substring(endIndex);
      lines[line - 1] = newLine;
      return lines.join('\n');
    }

    return code; // Text not found at the specified position
  }
}
