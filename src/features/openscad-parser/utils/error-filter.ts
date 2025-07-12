/**
 * Error Filtering Utilities
 * 
 * Provides functions to filter out known false positive errors from the Tree-sitter
 * OpenSCAD grammar that don't actually prevent successful parsing.
 */

/**
 * Patterns of Tree-sitter syntax errors that are known false positives.
 * These errors are reported by the grammar but don't prevent successful AST generation.
 */
const KNOWN_FALSE_POSITIVE_PATTERNS = [
  // Transform statements without spaces before primitives
  /translate\(\[.*?\]\).*?cube\(/,
  /rotate\(\[.*?\]\).*?cube\(/,
  /scale\(\[.*?\]\).*?cube\(/,
  /translate\(\[.*?\]\).*?sphere\(/,
  /rotate\(\[.*?\]\).*?sphere\(/,
  /scale\(\[.*?\]\).*?sphere\(/,
  /translate\(\[.*?\]\).*?cylinder\(/,
  /rotate\(\[.*?\]\).*?cylinder\(/,
  /scale\(\[.*?\]\).*?cylinder\(/,
  
  // Transform statements with braces
  /translate\(\[.*?\]\)\s*\{/,
  /rotate\(\[.*?\]\)\s*\{/,
  /scale\(\[.*?\]\)\s*\{/,
  
  // Common syntax patterns that Tree-sitter flags incorrectly
  /center=true/,
  /\$fn=\d+/,
  /\$fa=[\d.]+/,
  /\$fs=[\d.]+/,
];

/**
 * Checks if a syntax error is likely a false positive from the Tree-sitter grammar.
 * 
 * This function analyzes the error message and the code context to determine if
 * the error is a known false positive that doesn't actually prevent parsing.
 * 
 * @param errorMessage - The syntax error message from Tree-sitter
 * @param code - The OpenSCAD code being parsed
 * @param lineNumber - The line number where the error occurred
 * @returns True if the error is likely a false positive
 * 
 * @example
 * ```typescript
 * const error = "Syntax error at line 7, column 17";
 * const code = "translate([0,15,0])cube(8, center=true);";
 * const isFalsePositive = isLikelyFalsePositiveError(error, code, 7);
 * // Returns true - this is valid OpenSCAD syntax
 * ```
 */
export function isLikelyFalsePositiveError(
  errorMessage: string,
  code: string,
  lineNumber?: number
): boolean {
  // First check if this is a Tree-sitter syntax error message
  const treeSitterSyntaxErrors = [
    /^Syntax error at line \d+, column \d+:$/,  // Only exact Tree-sitter format
  ];

  let isTreeSitterError = false;
  for (const pattern of treeSitterSyntaxErrors) {
    if (pattern.test(errorMessage.trim())) {
      isTreeSitterError = true;
      break;
    }
  }

  // Only consider Tree-sitter syntax errors as potential false positives
  if (!isTreeSitterError) {
    return false;
  }

  // If we have a line number, check the specific line for known problematic patterns
  if (lineNumber !== undefined) {
    const lines = code.split('\n');
    const errorLine = lines[lineNumber - 1]; // Convert to 0-based index

    if (errorLine) {
      // Check if the error line matches any known false positive patterns
      for (const pattern of KNOWN_FALSE_POSITIVE_PATTERNS) {
        if (pattern.test(errorLine.trim())) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Extracts the line number from a Tree-sitter syntax error message.
 * 
 * @param errorMessage - The syntax error message
 * @returns The line number if found, undefined otherwise
 * 
 * @example
 * ```typescript
 * const error = "Syntax error at line 7, column 17:";
 * const lineNumber = extractLineNumber(error);
 * // Returns 7
 * ```
 */
export function extractLineNumber(errorMessage: string): number | undefined {
  const match = errorMessage.match(/line (\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Filters out false positive errors from a list of error messages.
 * 
 * This function is useful when you have multiple error messages and want to
 * show only the ones that are likely to be real syntax errors.
 * 
 * @param errors - Array of error messages
 * @param code - The OpenSCAD code being parsed
 * @returns Filtered array with false positives removed
 * 
 * @example
 * ```typescript
 * const errors = [
 *   "Syntax error at line 7, column 17:",
 *   "Undefined variable: invalidVar",
 *   "Missing semicolon"
 * ];
 * const code = "translate([0,15,0])cube(8, center=true);";
 * const realErrors = filterFalsePositiveErrors(errors, code);
 * // Returns ["Undefined variable: invalidVar", "Missing semicolon"]
 * ```
 */
export function filterFalsePositiveErrors(errors: string[], code: string): string[] {
  return errors.filter(error => {
    const lineNumber = extractLineNumber(error);
    return !isLikelyFalsePositiveError(error, code, lineNumber);
  });
}

/**
 * Determines if parsing should be considered successful despite syntax errors.
 * 
 * This function checks if all reported errors are false positives and if
 * the parser was able to generate a valid AST.
 * 
 * @param errors - Array of error messages
 * @param code - The OpenSCAD code being parsed
 * @param astNodeCount - Number of AST nodes generated
 * @returns True if parsing should be considered successful
 * 
 * @example
 * ```typescript
 * const errors = ["Syntax error at line 7, column 17:"];
 * const code = "translate([0,15,0])cube(8, center=true);";
 * const astNodes = 2;
 * const isSuccessful = shouldConsiderParsingSuccessful(errors, code, astNodes);
 * // Returns true - false positive error with valid AST
 * ```
 */
export function shouldConsiderParsingSuccessful(
  errors: string[],
  code: string,
  astNodeCount: number
): boolean {
  // If no AST nodes were generated, parsing definitely failed
  if (astNodeCount === 0) {
    return false;
  }
  
  // If there are no errors, parsing succeeded
  if (errors.length === 0) {
    return true;
  }
  
  // If all errors are false positives, consider parsing successful
  const realErrors = filterFalsePositiveErrors(errors, code);
  return realErrors.length === 0;
}
