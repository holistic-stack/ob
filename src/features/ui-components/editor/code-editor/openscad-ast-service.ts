/**
 * OpenSCAD AST Parsing Service
 * 
 * Provides a service layer for parsing OpenSCAD code to AST using the existing
 * ParserResourceManager with proper error handling, debouncing, and performance optimization.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { createParserResourceManager, type Result } from '../../../babylon-csg2/openscad/utils/parser-resource-manager';
import { type ASTNode } from '@holistic-stack/openscad-parser';

// Types for AST parsing results
export interface ParseError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning';
}

export interface ASTParseResult {
  readonly success: boolean;
  readonly ast: readonly ASTNode[];
  readonly errors: readonly ParseError[];
  readonly parseTime: number;
}

// Result type for functional error handling
export type ASTResult<T> = Result<T, ParseError[]>;

/**
 * Configuration for AST parsing service
 */
export interface ASTParsingConfig {
  readonly enableLogging?: boolean;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

/**
 * Default configuration for AST parsing
 */
const DEFAULT_CONFIG: Required<ASTParsingConfig> = {
  enableLogging: false,
  timeout: 5000, // 5 seconds
  maxRetries: 2
};

/**
 * Global parser manager instance for reuse across components
 */
let globalParserManager: ReturnType<typeof createParserResourceManager> | null = null;

/**
 * Initialize the global parser manager
 */
function getParserManager(): ReturnType<typeof createParserResourceManager> {
  if (!globalParserManager) {
    globalParserManager = createParserResourceManager({
      enableLogging: false,
      timeout: 5000
    });
  }
  return globalParserManager;
}

/**
 * Parse OpenSCAD code to AST with comprehensive error handling and performance monitoring
 *
 * @param code - OpenSCAD source code to parse
 * @param config - Optional parsing configuration
 * @returns Promise resolving to AST parse result
 */
export async function parseOpenSCADCode(
  code: string,
  config: ASTParsingConfig = {}
): Promise<ASTParseResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();

  if (finalConfig.enableLogging) {
    console.log('[PERF] Starting OpenSCAD code parsing...');
  }

  // Validate input
  if (!code || typeof code !== 'string') {
    return {
      success: false,
      ast: [],
      errors: [{
        message: 'Invalid or empty OpenSCAD code provided',
        line: 1,
        column: 1,
        severity: 'error'
      }],
      parseTime: performance.now() - startTime
    };
  }

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return {
      success: true,
      ast: [],
      errors: [],
      parseTime: performance.now() - startTime
    };
  }

  try {
    const parserManager = getParserManager();
    const result = await parserManager.parseOpenSCAD(trimmedCode);

    const parseTime = performance.now() - startTime;

    if (result.success) {
      if (finalConfig.enableLogging) {
        console.log(`[PERF] Successfully parsed AST with ${result.value.length} nodes in ${parseTime.toFixed(2)}ms`);
      }

      // Performance benchmark validation
      if (parseTime > 300) {
        console.warn(`[PERF] AST parsing exceeded target time: ${parseTime.toFixed(2)}ms > 300ms`);
      } else {
        console.log(`[PERF] AST parsing within target: ${parseTime.toFixed(2)}ms < 300ms`);
      }

      return {
        success: true,
        ast: result.value,
        errors: [],
        parseTime
      };
    } else {
      // Convert parser error to ParseError format
      const parseError: ParseError = {
        message: result.error,
        line: extractLineNumber(result.error) || 1,
        column: extractColumnNumber(result.error) || 1,
        severity: 'error'
      };

      if (finalConfig.enableLogging) {
        console.warn(`[AST Service] Parsing failed in ${parseTime.toFixed(2)}ms:`, result.error);
      }

      return {
        success: false,
        ast: [],
        errors: [parseError],
        parseTime
      };
    }
  } catch (error) {
    const parseTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    
    const parseError: ParseError = {
      message: `Parser exception: ${errorMessage}`,
      line: 1,
      column: 1,
      severity: 'error'
    };

    if (finalConfig.enableLogging) {
      console.error(`[AST Service] Parser exception in ${parseTime.toFixed(2)}ms:`, error);
    }

    return {
      success: false,
      ast: [],
      errors: [parseError],
      parseTime
    };
  }
}

// Cache for parsed results to avoid re-parsing identical code
const parseCache = new Map<string, { result: ASTParseResult; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache TTL

/**
 * Parse OpenSCAD code with caching to improve performance
 *
 * @param code - OpenSCAD source code
 * @param config - Optional parsing configuration
 * @returns Promise resolving to AST parse result
 */
export async function parseOpenSCADCodeCached(
  code: string,
  config: ASTParsingConfig = {}
): Promise<ASTParseResult> {
  const cacheKey = `${code.trim()}_${JSON.stringify(config)}`;
  const now = Date.now();

  // Check cache first
  const cached = parseCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log('[AST Service] Cache hit for code parsing');
    return cached.result;
  }

  // Parse and cache result
  const result = await parseOpenSCADCode(code, config);
  parseCache.set(cacheKey, { result, timestamp: now });

  // Clean old cache entries
  if (parseCache.size > 50) {
    const entries = Array.from(parseCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    parseCache.clear();
    entries.slice(0, 25).forEach(([key, value]) => parseCache.set(key, value));
  }

  return result;
}

/**
 * Parse OpenSCAD code with debouncing support
 *
 * @param code - OpenSCAD source code
 * @param debounceMs - Debounce delay in milliseconds
 * @param config - Optional parsing configuration
 * @returns Promise resolving to AST parse result
 */
export function parseOpenSCADCodeDebounced(
  code: string,
  debounceMs: number = 300,
  config: ASTParsingConfig = {}
): Promise<ASTParseResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(async () => {
      const result = await parseOpenSCADCodeCached(code, config);
      resolve(result);
    }, debounceMs);

    // Store timeout ID for potential cancellation
    (parseOpenSCADCodeDebounced as any)._lastTimeoutId = timeoutId;
  });
}

/**
 * Cancel any pending debounced parsing operation
 */
export function cancelDebouncedParsing(): void {
  const timeoutId = (parseOpenSCADCodeDebounced as any)._lastTimeoutId;
  if (timeoutId) {
    clearTimeout(timeoutId);
    (parseOpenSCADCodeDebounced as any)._lastTimeoutId = null;
  }
}

/**
 * Dispose of the global parser manager
 * Call this when the application is shutting down
 */
export function disposeASTService(): void {
  if (globalParserManager) {
    // Note: ParserResourceManager doesn't have a dispose method in the current implementation
    // This is a placeholder for future cleanup if needed
    globalParserManager = null;
  }
}

/**
 * Extract line number from error message
 * @param errorMessage - Error message that may contain line information
 * @returns Line number or null if not found
 */
function extractLineNumber(errorMessage: string): number | null {
  const lineMatch = errorMessage.match(/line\s+(\d+)/i);
  return lineMatch ? parseInt(lineMatch[1], 10) : null;
}

/**
 * Extract column number from error message
 * @param errorMessage - Error message that may contain column information
 * @returns Column number or null if not found
 */
function extractColumnNumber(errorMessage: string): number | null {
  const columnMatch = errorMessage.match(/column\s+(\d+)/i);
  return columnMatch ? parseInt(columnMatch[1], 10) : null;
}

/**
 * Validate AST structure
 * @param ast - AST nodes to validate
 * @returns True if AST is valid
 */
export function validateAST(ast: readonly ASTNode[]): boolean {
  if (!Array.isArray(ast)) {
    return false;
  }

  return ast.every(node => 
    node && 
    typeof node === 'object' && 
    typeof node.type === 'string'
  );
}

/**
 * Get performance metrics for AST parsing
 * @param parseTime - Time taken to parse in milliseconds
 * @returns Performance assessment
 */
export function getPerformanceMetrics(parseTime: number): {
  readonly assessment: 'excellent' | 'good' | 'acceptable' | 'slow';
  readonly recommendation: string;
} {
  if (parseTime < 100) {
    return {
      assessment: 'excellent',
      recommendation: 'Performance is excellent'
    };
  } else if (parseTime < 300) {
    return {
      assessment: 'good',
      recommendation: 'Performance is within target (<300ms)'
    };
  } else if (parseTime < 1000) {
    return {
      assessment: 'acceptable',
      recommendation: 'Performance is acceptable but could be improved'
    };
  } else {
    return {
      assessment: 'slow',
      recommendation: 'Performance is slow, consider optimizing code complexity'
    };
  }
}
