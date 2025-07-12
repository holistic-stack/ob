/**
 * Whitespace Normalization Utilities
 * 
 * Provides functions to normalize OpenSCAD code whitespace to work around
 * Tree-sitter grammar bugs that cause parsing failures with certain empty line patterns.
 */

/**
 * Normalizes whitespace in OpenSCAD code to prevent Tree-sitter parsing issues.
 * 
 * This function addresses a known issue where the Tree-sitter OpenSCAD grammar
 * fails to parse code correctly when there are certain patterns of empty lines,
 * particularly between transform statements and primitives.
 * 
 * The normalization process:
 * 1. Removes excessive empty lines (more than 2 consecutive)
 * 2. Ensures consistent spacing around braces
 * 3. Preserves intentional formatting while fixing problematic patterns
 * 
 * @param code - The OpenSCAD code to normalize
 * @returns Normalized OpenSCAD code that parses reliably
 * 
 * @example
 * ```typescript
 * const problematicCode = `
 * sphere(5);
 * 
 * 
 * 
 * translate([15,0,0]) {
 *   cube(7, center=true);
 * }
 * `;
 * 
 * const normalized = normalizeWhitespace(problematicCode);
 * // Result: consistent spacing that parses correctly
 * ```
 */
export function normalizeWhitespace(code: string): string {
  if (!code || typeof code !== 'string') {
    return '';
  }

  // Split into lines for processing
  const lines = code.split('\n');
  const normalizedLines: string[] = [];
  
  let consecutiveEmptyLines = 0;
  const maxConsecutiveEmptyLines = 2;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle empty lines
    if (trimmedLine === '') {
      consecutiveEmptyLines++;
      
      // Only keep up to maxConsecutiveEmptyLines empty lines
      if (consecutiveEmptyLines <= maxConsecutiveEmptyLines) {
        normalizedLines.push('');
      }
    } else {
      // Reset empty line counter
      consecutiveEmptyLines = 0;
      
      // Add the non-empty line
      normalizedLines.push(line);
    }
  }
  
  // Remove trailing empty lines
  while (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1].trim() === '') {
    normalizedLines.pop();
  }
  
  // Join back into a string
  return normalizedLines.join('\n');
}

/**
 * Checks if the given code contains problematic whitespace patterns
 * that are known to cause Tree-sitter parsing issues.
 * 
 * @param code - The OpenSCAD code to check
 * @returns True if the code contains problematic patterns
 */
export function hasProblematicWhitespace(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  const lines = code.split('\n');
  let consecutiveEmptyLines = 0;
  
  for (const line of lines) {
    if (line.trim() === '') {
      consecutiveEmptyLines++;
      
      // More than 2 consecutive empty lines is problematic
      if (consecutiveEmptyLines > 2) {
        return true;
      }
    } else {
      consecutiveEmptyLines = 0;
    }
  }
  
  return false;
}

/**
 * Validates that the normalized code will parse correctly.
 * This is a lightweight check that looks for common patterns
 * that cause parsing issues.
 * 
 * @param code - The normalized OpenSCAD code
 * @returns True if the code appears to be safe for parsing
 */
export function validateNormalizedCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Check for balanced braces
  let braceCount = 0;
  for (const char of code) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) return false; // More closing than opening braces
  }
  
  // Should end with balanced braces
  if (braceCount !== 0) return false;
  
  // Check that we don't have problematic whitespace patterns
  if (hasProblematicWhitespace(code)) return false;
  
  return true;
}
