/**
 * @file OpenSCAD AST Zustand Store
 *
 * Centralized state management for OpenSCAD AST parsing and 3D visualization pipeline.
 * Implements modern Zustand patterns with TypeScript, Result<T,E> error handling,
 * and performance optimization for the Monaco Editor → AST → Babylon.js flow.
 *
 * **Phase 3 Refactoring**: This component has been refactored to use shared utilities
 * from `src/features/ui-components/shared/ast-utils.ts` for consistent error handling
 * and performance logging across the application.
 *
 * **Shared Utilities Integration**:
 * - `createParseError`: Standardized error creation for consistent error formatting
 * - `formatPerformanceTime`: Unified performance time formatting across components
 *
 * **Usage Example**:
 * ```typescript
 * const { parseAST, parseErrors, performanceMetrics } = useOpenSCADStore();
 *
 * // Parse OpenSCAD code with automatic error handling via shared utilities
 * const result = await parseAST('cube([10, 10, 10]);', { immediate: true });
 *
 * // Errors are automatically formatted using createParseError
 * if (!result.success) {
 *   console.log('Parse errors:', parseErrors); // Consistent error format
 * }
 *
 * // Performance metrics use formatPerformanceTime for consistent logging
 * console.log('Parse time:', performanceMetrics?.parseTime); // e.g., "150.00ms"
 * ```
 *
 * Features:
 * - Type-safe state management with branded types
 * - Debounced AST parsing (300ms requirement)
 * - Result<T,E> error handling patterns
 * - Performance monitoring and optimization
 * - Selective reactivity to prevent unnecessary re-renders
 * - Memory management and cleanup
 * - **NEW**: Shared utilities integration for consistent error handling and logging
 *
 * @author OpenSCAD-Babylon Pipeline
 * @version 2.0.0 - Phase 3 Refactoring: Shared Utilities Integration
 * @since 1.0.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import {
  parseOpenSCADCodeCached,
  cancelDebouncedParsing,
  type ParseError,
  type ASTParseResult
} from '../code-editor/openscad-ast-service';
import { measurePerformance } from '../../shared/performance/performance-monitor';
import { createParseError, formatPerformanceTime } from '../../shared/ast-utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Branded type for OpenSCAD code to ensure type safety
 */
export type OpenSCADCode = string & { readonly __brand: 'OpenSCADCode' };

/**
 * Branded type for AST data to ensure type safety
 */
export type ASTData = readonly ASTNode[] & { readonly __brand: 'ASTData' };

/**
 * Result type for error handling throughout the pipeline
 */
export type Result<T, E> =
  | { readonly success: true; readonly data: T; readonly error?: never }
  | { readonly success: false; readonly data?: never; readonly error: E };

/**
 * Parse operation status
 */
export type ParseStatus = 'idle' | 'parsing' | 'success' | 'error';

/**
 * Performance metrics for AST operations
 */
export interface PerformanceMetrics {
  readonly parseTime: number;
  readonly withinTarget: boolean;
  readonly operation: string;
}

/**
 * OpenSCAD AST Store State Interface
 */
export interface OpenSCADState {
  // ========================================================================
  // State Properties
  // ========================================================================
  
  /** Current OpenSCAD code */
  readonly code: OpenSCADCode;
  
  /** Parsed AST data */
  readonly ast: ASTData;
  
  /** Parse errors from AST parsing */
  readonly parseErrors: readonly ParseError[];
  
  /** Current parsing status */
  readonly parseStatus: ParseStatus;
  
  /** Whether AST parsing is currently in progress */
  readonly isParsing: boolean;
  
  /** Performance metrics for the last parse operation */
  readonly performanceMetrics: PerformanceMetrics | null;
  
  /** CSG2 data for 3D rendering (future extension) */
  readonly csg2Data: any | null;
  
  /** Timestamp of last successful parse */
  readonly lastParseTime: number | null;
  
  /** Whether the current AST is valid and ready for rendering */
  readonly isASTValid: boolean;

  // ========================================================================
  // Action Methods
  // ========================================================================
  
  /**
   * Update the OpenSCAD code and trigger debounced parsing
   */
  updateCode: (code: string) => void;
  
  /**
   * Parse OpenSCAD code to AST with performance monitoring
   *
   * **Phase 3 Refactoring**: This method now uses shared utilities for consistent
   * error handling and performance logging across the application.
   *
   * **Shared Utilities Used**:
   * - `createParseError`: Creates standardized ParseError objects for exceptions
   * - `formatPerformanceTime`: Formats performance times consistently (e.g., "150.00ms")
   *
   * @param code - OpenSCAD code to parse
   * @param options - Parse options
   * @param options.immediate - If true, parse immediately without debouncing
   * @returns Promise resolving to Result<ASTData, ParseError[]>
   *
   * @example
   * ```typescript
   * // Parse with debouncing (default)
   * const result = await parseAST('cube([10, 10, 10]);');
   *
   * // Parse immediately without debouncing
   * const result = await parseAST('sphere(5);', { immediate: true });
   *
   * // Handle errors (automatically formatted via createParseError)
   * if (!result.success) {
   *   console.log('Parse errors:', result.error);
   * }
   * ```
   */
  parseAST: (code: string, options?: { immediate?: boolean }) => Promise<Result<ASTData, ParseError[]>>;
  
  /**
   * Set parse errors manually
   */
  setParseErrors: (errors: readonly ParseError[]) => void;
  
  /**
   * Clear all errors and reset error state
   */
  clearErrors: () => void;
  
  /**
   * Reset the entire store to initial state
   */
  reset: () => void;
  
  /**
   * Cancel any ongoing parse operations
   */
  cancelParsing: () => void;
  
  /**
   * Get current state snapshot for debugging
   */
  getSnapshot: () => Readonly<Pick<OpenSCADState, 'code' | 'ast' | 'parseErrors' | 'parseStatus' | 'isParsing'>>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  code: '' as OpenSCADCode,
  ast: [] as unknown as ASTData,
  parseErrors: [] as readonly ParseError[],
  parseStatus: 'idle' as ParseStatus,
  isParsing: false,
  performanceMetrics: null,
  csg2Data: null,
  lastParseTime: null,
  isASTValid: false,
} as const;

// ============================================================================
// Debouncing Logic
// ============================================================================

let parseTimeout: ReturnType<typeof setTimeout> | null = null;
const PARSE_DEBOUNCE_MS = 300; // Performance requirement: 300ms debouncing

/**
 * Clear existing parse timeout
 */
const clearParseTimeout = () => {
  if (parseTimeout) {
    clearTimeout(parseTimeout);
    parseTimeout = null;
  }
};

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * OpenSCAD AST Zustand Store
 *
 * Centralized state management for the OpenSCAD → AST → 3D pipeline.
 * Uses subscribeWithSelector middleware for selective reactivity.
 */
export const useOpenSCADStore = create<OpenSCADState>()(
  subscribeWithSelector((set, get) => ({
    // ========================================================================
    // Initial State
    // ========================================================================
    ...initialState,

    // ========================================================================
    // Actions Implementation
    // ========================================================================

    updateCode: (code: string) => {
      const openscadCode = code as OpenSCADCode;
      
      // Update code immediately for responsive UI
      set({ code: openscadCode });
      
      // Clear existing timeout
      clearParseTimeout();
      
      // Skip parsing for empty code
      if (!code.trim()) {
        set({
          ast: [] as unknown as ASTData,
          parseErrors: [],
          parseStatus: 'idle',
          isParsing: false,
          isASTValid: false
        });
        return;
      }
      
      // Set up debounced parsing
      parseTimeout = setTimeout(() => {
        const currentState = get();
        // Only parse if code hasn't changed during debounce period
        if (currentState.code === openscadCode) {
          void currentState.parseAST(code, { immediate: true });
        }
      }, PARSE_DEBOUNCE_MS);
    },

    parseAST: async (code: string, options = {}) => {
      const { immediate = false } = options;
      
      if (!immediate) {
        // Use debounced parsing through updateCode
        get().updateCode(code);
        return { success: true, data: get().ast } as Result<ASTData, ParseError[]>;
      }
      
      // Set parsing state
      set({ 
        isParsing: true, 
        parseStatus: 'parsing',
        parseErrors: [] 
      });
      
      try {
        console.log('[OpenSCADStore] Starting AST parsing...');
        
        // Parse with performance monitoring
        const { result } = await measurePerformance('AST_PARSING', async () => {
          return await parseOpenSCADCodeCached(code, {
            enableLogging: false,
            timeout: 3000
          });
        });
        
        const performanceMetrics: PerformanceMetrics = {
          parseTime: result.parseTime,
          withinTarget: result.parseTime < 300, // 300ms target
          operation: 'AST_PARSING'
        };
        
        if (result.success) {
          const astData = result.ast as ASTData;
          
          set({
            ast: astData,
            parseErrors: [],
            parseStatus: 'success',
            isParsing: false,
            performanceMetrics,
            lastParseTime: Date.now(),
            isASTValid: astData.length > 0
          });
          
          console.log(`[OpenSCADStore] AST parsing completed successfully in ${formatPerformanceTime(result.parseTime)}`);
          return { success: true, data: astData } as Result<ASTData, ParseError[]>;
        } else {
          set({
            ast: [] as unknown as ASTData,
            parseErrors: result.errors,
            parseStatus: 'error',
            isParsing: false,
            performanceMetrics,
            isASTValid: false
          });
          
          console.warn('[OpenSCADStore] AST parsing failed:', result.errors);
          return { success: false, error: result.errors } as Result<ASTData, ParseError[]>;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
        const parseError = createParseError(errorMessage);

        set({
          ast: [] as unknown as ASTData,
          parseErrors: [parseError],
          parseStatus: 'error',
          isParsing: false,
          isASTValid: false
        });

        console.error('[OpenSCADStore] AST parsing exception:', error);
        return { success: false, error: [parseError] } as Result<ASTData, ParseError[]>;
      }
    },

    setParseErrors: (errors: readonly ParseError[]) => {
      set({ 
        parseErrors: errors,
        parseStatus: errors.length > 0 ? 'error' : 'success',
        isASTValid: errors.length === 0 && get().ast.length > 0
      });
    },

    clearErrors: () => {
      set({ 
        parseErrors: [],
        parseStatus: get().ast.length > 0 ? 'success' : 'idle',
        isASTValid: get().ast.length > 0
      });
    },

    reset: () => {
      clearParseTimeout();
      cancelDebouncedParsing();
      set(initialState);
      console.log('[OpenSCADStore] Store reset to initial state');
    },

    cancelParsing: () => {
      clearParseTimeout();
      cancelDebouncedParsing();
      set({ 
        isParsing: false,
        parseStatus: get().ast.length > 0 ? 'success' : 'idle'
      });
      console.log('[OpenSCADStore] Parsing cancelled');
    },

    getSnapshot: () => {
      const state = get();
      // Return a simple snapshot without caching to prevent infinite loops
      return {
        code: state.code,
        ast: state.ast,
        parseErrors: state.parseErrors,
        parseStatus: state.parseStatus,
        isParsing: state.isParsing
      };
    }
  }))
);

// ============================================================================
// Selector Hooks for Performance Optimization
// ============================================================================

/**
 * Hook to subscribe to code changes only
 */
export const useOpenSCADCode = () => 
  useOpenSCADStore(state => state.code);

/**
 * Hook to subscribe to AST data only
 */
export const useOpenSCADAst = () => 
  useOpenSCADStore(state => state.ast);

/**
 * Hook to subscribe to parse errors only
 */
export const useOpenSCADErrors = () => 
  useOpenSCADStore(state => state.parseErrors);

/**
 * Hook to subscribe to parsing status only
 */
export const useOpenSCADStatus = () => {
  const isParsing = useOpenSCADStore(state => state.isParsing);
  const parseStatus = useOpenSCADStore(state => state.parseStatus);
  const isASTValid = useOpenSCADStore(state => state.isASTValid);

  return { isParsing, parseStatus, isASTValid };
};

/**
 * Hook to subscribe to performance metrics only
 */
export const useOpenSCADPerformance = () => 
  useOpenSCADStore(state => state.performanceMetrics);

/**
 * Hook to get store actions only (no re-renders on state changes)
 */
export const useOpenSCADActions = () => {
  const updateCode = useOpenSCADStore(state => state.updateCode);
  const parseAST = useOpenSCADStore(state => state.parseAST);
  const setParseErrors = useOpenSCADStore(state => state.setParseErrors);
  const clearErrors = useOpenSCADStore(state => state.clearErrors);
  const reset = useOpenSCADStore(state => state.reset);
  const cancelParsing = useOpenSCADStore(state => state.cancelParsing);
  const getSnapshot = useOpenSCADStore(state => state.getSnapshot);

  return { updateCode, parseAST, setParseErrors, clearErrors, reset, cancelParsing, getSnapshot };
};

// ============================================================================
// Store Cleanup
// ============================================================================

/**
 * Cleanup function for store resources
 * Call this when the application unmounts or store is no longer needed
 */
export const cleanupOpenSCADStore = () => {
  clearParseTimeout();
  cancelDebouncedParsing();
  console.log('[OpenSCADStore] Store cleanup completed');
};

// ============================================================================
// Default Export
// ============================================================================

export default useOpenSCADStore;
