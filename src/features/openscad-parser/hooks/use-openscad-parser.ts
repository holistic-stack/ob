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

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { 
  parseOpenSCADCodeCached,
  type ParseError,
  type ASTParseResult 
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
  readonly parseCode: (code: string) => Promise<void>;
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
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // ========================================================================
  // Parse Function
  // ========================================================================

  const parseCode = useCallback(async (code: string): Promise<void> => {
    if (!code || !code.trim()) {
      setAstData(null);
      setParseErrors([]);
      setParseTime(0);
      return;
    }

    setIsParsing(true);
    setParseErrors([]);

    try {
      if (finalConfig.enableLogging) {
        console.log('[useOpenSCADParser] Starting parse operation for code length:', code.length);
      }

      const result: ASTParseResult = await parseOpenSCADCodeCached(code, {
        enableLogging: finalConfig.enableLogging,
        timeout: finalConfig.timeout
      });

      setParseTime(result.parseTime);

      if (result.success) {
        setAstData(result.ast);
        setParseErrors([]);
        
        if (finalConfig.enableLogging) {
          console.log('[useOpenSCADParser] Parse successful, AST nodes:', result.ast.length);
        }
      } else {
        setAstData(null);
        setParseErrors(result.errors);
        
        if (finalConfig.enableLogging) {
          console.warn('[useOpenSCADParser] Parse failed with errors:', result.errors);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      
      setAstData(null);
      setParseErrors([{
        message: `Parser exception: ${errorMessage}`,
        location: { line: 0, column: 0 },
        severity: 'error'
      }]);
      
      if (finalConfig.enableLogging) {
        console.error('[useOpenSCADParser] Parse exception:', error);
      }
    } finally {
      setIsParsing(false);
    }
  }, [finalConfig.enableLogging, finalConfig.timeout]);

  // ========================================================================
  // Debounced Parse Function
  // ========================================================================

  const debouncedParseCode = useCallback((code: string): void => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      parseCode(code).catch(console.error);
    }, finalConfig.debounceMs);

    setDebounceTimeout(timeoutId);
  }, [parseCode, finalConfig.debounceMs, debounceTimeout]);

  // ========================================================================
  // Utility Functions
  // ========================================================================

  const clearErrors = useCallback(() => {
    setParseErrors([]);
  }, []);

  const reset = useCallback(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
    
    setAstData(null);
    setParseErrors([]);
    setIsParsing(false);
    setParseTime(0);
  }, [debounceTimeout]);

  // ========================================================================
  // Effects
  // ========================================================================

  // Auto-parse initial code on mount
  useEffect(() => {
    if (initialCode && finalConfig.autoParseOnMount) {
      if (finalConfig.debounceMs > 0) {
        debouncedParseCode(initialCode);
      } else {
        parseCode(initialCode).catch(console.error);
      }
    }
  }, [initialCode, finalConfig.autoParseOnMount, finalConfig.debounceMs, debouncedParseCode, parseCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // ========================================================================
  // Derived State
  // ========================================================================

  const isReady = useMemo(() => {
    return !isParsing && (astData !== null || parseErrors.length > 0);
  }, [isParsing, astData, parseErrors]);

  // ========================================================================
  // Return Hook Interface
  // ========================================================================

  return {
    astData,
    parseErrors,
    isParsing,
    isReady,
    parseTime,
    parseCode: finalConfig.debounceMs > 0 ? 
      (code: string) => {
        debouncedParseCode(code);
        return Promise.resolve();
      } : 
      parseCode,
    clearErrors,
    reset
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
