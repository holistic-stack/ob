/**
 * @file OpenSCAD Parser Hook
 * 
 * React hook for parsing OpenSCAD code to AST using the existing parser infrastructure.
 * Provides a clean interface for components that need OpenSCAD parsing capabilities
 * without directly managing the Zustand store.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ASTNode } from '../types/ast-types';
import {
  createParseError,
  parseOpenSCADCodeCached,
  type ParseError,
} from '../../ui-components/editor/code-editor/openscad-ast-service';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Configuration options for the OpenSCAD parser hook
 */
export interface UseOpenSCADParserConfig {
  readonly enableLogging?: boolean;
  readonly timeout?: number;
  readonly debounceMs?: number;
  readonly autoParseOnMount?: boolean;
}

/**
 * Result interface for the OpenSCAD parser hook
 */
export interface UseOpenSCADParserResult {
  readonly astData: readonly ASTNode[] | null;
  readonly parseErrors: readonly ParseError[];
  readonly isParsing: boolean;
  readonly isReady: boolean;
  readonly parseTime: number;
  readonly parseCode: (code: string) => void;
  readonly clearErrors: () => void;
  readonly reset: () => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<UseOpenSCADParserConfig> = {
  enableLogging: false,
  timeout: 5000,
  debounceMs: 300,
  autoParseOnMount: true
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for parsing OpenSCAD code to AST
 * 
 * Provides a convenient interface for components that need to parse OpenSCAD code
 * without directly managing the parsing state. Uses the existing parser infrastructure
 * with proper error handling and performance optimization.
 * 
 * @param initialCode - Initial OpenSCAD code to parse (optional)
 * @param config - Configuration options for the parser
 * @returns Hook result with AST data, errors, and parsing functions
 * 
 * @example
 * ```tsx
 * function OpenSCADViewer({ code }: { code: string }) {
 *   const {
 *     astData,
 *     parseErrors,
 *     isParsing,
 *     parseCode
 *   } = useOpenSCADParser(code);
 * 
 *   useEffect(() => {
 *     if (code) {
 *       parseCode(code);
 *     }
 *   }, [code, parseCode]);
 * 
 *   if (isParsing) return <div>Parsing...</div>;
 *   if (parseErrors.length > 0) return <div>Errors: {parseErrors.map(e => e.message).join(', ')}</div>;
 *   if (!astData) return <div>No data</div>;
 * 
 *   return <div>AST nodes: {astData.length}</div>;
 * }
 * ```
 */
export function useOpenSCADParser(
  initialCode?: string,
  config: UseOpenSCADParserConfig = {}
): UseOpenSCADParserResult {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // ========================================================================
  // State Management
  // ========================================================================
  
  const [astData, setAstData] = useState<readonly ASTNode[] | null>(null);
  const [parseErrors, setParseErrors] = useState<readonly ParseError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseTime, setParseTime] = useState(0);
  const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

  // ========================================================================
  // Parse Function
  // ========================================================================

  const parseCode = useCallback(
    async (code: string): Promise<void> => {
      if (!code?.trim()) {
        setAstData(null);
        setParseErrors([]);
        return;
      }

      if (finalConfig.enableLogging) {
        console.log(`[Parser Hook] Parsing code...`);
      }

      setIsParsing(true);
      const startTime = performance.now();

      try {
        const result = await parseOpenSCADCodeCached(code, {
          enableLogging: finalConfig.enableLogging,
          timeout: finalConfig.timeout,
        });

        const parseTime = performance.now() - startTime;
        setParseTime(parseTime);

        if (result.success) {
          setAstData(result.ast);
          setParseErrors([]);
          if (finalConfig.enableLogging) {
            console.log(
              `[Parser Hook] Code parsed successfully in ${parseTime.toFixed(
                2,
              )}ms`,
            );
          }
        } else {
          setAstData(null);
          setParseErrors(result.errors);
          if (finalConfig.enableLogging) {
            console.warn(
              `[Parser Hook] Parsing failed:`,
              result.errors.map(e => e.message).join('\n'),
            );
          }
        }
      } catch (error) {
        const parseTime = performance.now() - startTime;
        setParseTime(parseTime);
        setAstData(null);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown parsing error';
        setParseErrors([createParseError(errorMessage)]);
        if (finalConfig.enableLogging) {
          console.error('[Parser Hook] Unexpected error during parsing:', error);
        }
      } finally {
        setIsParsing(false);
      }
    },
    [finalConfig],
  );

  // ========================================================================
  // Debounced Parse Function
  // ========================================================================

  const debouncedParse = useCallback(
    (code: string) => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      const newTimeout = window.setTimeout(() => {
        void parseCode(code);
      }, finalConfig.debounceMs);
      setDebounceTimeout(newTimeout);
    },
    [parseCode, finalConfig.debounceMs, debounceTimeout],
  );

  // ========================================================================
  // Effects
  // ========================================================================

  useEffect(() => {
    if (initialCode && finalConfig.autoParseOnMount) {
      debouncedParse(initialCode);
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [initialCode, finalConfig.autoParseOnMount]);

  // ========================================================================
  // Public API
  // ========================================================================

  const clearErrors = useCallback(() => {
    setParseErrors([]);
  }, []);

  const reset = useCallback(() => {
    setAstData(null);
    setParseErrors([]);
    setIsParsing(false);
    setParseTime(0);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
  }, [debounceTimeout]);

  return {
    astData,
    parseErrors,
    isParsing,
    isReady: !isParsing && astData !== null,
    parseTime,
    parseCode: debouncedParse, // Expose the debounced version
    clearErrors,
    reset,
  };
}

// ============================================================================
// Hook Variants
// ============================================================================

/**
 * Simplified hook for basic OpenSCAD parsing without debouncing
 * 
 * @param code - OpenSCAD code to parse
 * @returns Simplified hook result
 */
export function useOpenSCADParserSimple(code?: string) {
  return useOpenSCADParser(code, {
    debounceMs: 0,
    enableLogging: false,
    autoParseOnMount: true
  });
}

/**
 * Hook for OpenSCAD parsing with custom debouncing
 * 
 * @param code - OpenSCAD code to parse
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Hook result with custom debouncing
 */
export function useOpenSCADParserDebounced(code?: string, debounceMs: number = 300) {
  return useOpenSCADParser(code, {
    debounceMs,
    enableLogging: false,
    autoParseOnMount: true
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default useOpenSCADParser;
