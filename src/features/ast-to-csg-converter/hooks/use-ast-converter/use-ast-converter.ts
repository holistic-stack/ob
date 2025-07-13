/**
 * @file React Hook for AST to Mesh Conversion
 * 
 * React hook that provides AST to mesh conversion functionality
 * with proper lifecycle management and error handling.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { ASTToMeshConversionService } from '../../services/ast-to-mesh-converter/ast-to-mesh-converter';
import type {
  ConversionOptions,
  ConversionResult,
  GenericMeshData,
  ConversionError,
} from '../../types/conversion.types';

const logger = createLogger('useASTConverter');

/**
 * Hook state interface
 */
interface UseASTConverterState {
  readonly isInitialized: boolean;
  readonly isConverting: boolean;
  readonly error: string | null;
  readonly lastConversionTime: number;
}

/**
 * Hook return interface
 */
interface UseASTConverterReturn {
  readonly state: UseASTConverterState;
  readonly convert: (
    ast: ReadonlyArray<unknown>,
    options?: ConversionOptions
  ) => Promise<Result<ConversionResult, string>>;
  readonly convertSingle: (
    node: unknown,
    options?: ConversionOptions
  ) => Promise<Result<GenericMeshData, string>>;
  readonly clearError: () => void;
}

/**
 * React hook for AST to mesh conversion
 * 
 * Provides a clean interface for converting OpenSCAD AST nodes to generic mesh data
 * with proper lifecycle management, error handling, and performance tracking.
 * 
 * @param autoInitialize - Whether to automatically initialize the converter
 * @returns Hook interface with conversion functions and state
 * 
 * @example
 * ```typescript
 * const { state, convert, convertSingle } = useASTConverter();
 * 
 * // Convert multiple nodes
 * const result = await convert(astNodes, { optimizeResult: true });
 * 
 * // Convert single node
 * const meshResult = await convertSingle(astNode);
 * ```
 */
export function useASTConverter(autoInitialize = true): UseASTConverterReturn {
  const converterRef = useRef<ASTToMeshConversionService | null>(null);
  const [state, setState] = useState<UseASTConverterState>({
    isInitialized: false,
    isConverting: false,
    error: null,
    lastConversionTime: 0,
  });

  /**
   * Initialize the conversion service
   */
  const initializeConverter = useCallback(async () => {
    try {
      logger.debug('[INIT] Initializing AST converter hook');
      
      if (!converterRef.current) {
        converterRef.current = new ASTToMeshConversionService();
      }

      const result = await converterRef.current.initialize();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: null,
        }));
        logger.debug('[INIT] AST converter hook initialized successfully');
      } else {
        setState(prev => ({
          ...prev,
          isInitialized: false,
          error: result.error,
        }));
        logger.error('[ERROR] Failed to initialize AST converter:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        isInitialized: false,
        error: errorMessage,
      }));
      logger.error('[ERROR] AST converter initialization error:', errorMessage);
    }
  }, []);

  /**
   * Convert multiple AST nodes to meshes
   */
  const convert = useCallback(
    async (
      ast: ReadonlyArray<unknown>,
      options?: ConversionOptions
    ): Promise<Result<ConversionResult, string>> => {
      if (!converterRef.current || !state.isInitialized) {
        const error = 'AST converter not initialized';
        logger.error('[ERROR]', error);
        return { success: false, error };
      }

      setState(prev => ({ ...prev, isConverting: true, error: null }));
      const startTime = performance.now();

      try {
        logger.debug(`[CONVERT] Converting ${ast.length} AST nodes`);
        
        const result = await converterRef.current.convert(ast, options);
        const conversionTime = performance.now() - startTime;

        setState(prev => ({
          ...prev,
          isConverting: false,
          lastConversionTime: conversionTime,
          error: result.success ? null : result.error,
        }));

        if (result.success) {
          logger.debug(`[CONVERT] Conversion completed in ${conversionTime.toFixed(2)}ms`);
        } else {
          logger.error('[ERROR] Conversion failed:', result.error);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const conversionTime = performance.now() - startTime;
        
        setState(prev => ({
          ...prev,
          isConverting: false,
          lastConversionTime: conversionTime,
          error: errorMessage,
        }));

        logger.error('[ERROR] Conversion error:', errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [state.isInitialized]
  );

  /**
   * Convert single AST node to mesh
   */
  const convertSingle = useCallback(
    async (
      node: unknown,
      options?: ConversionOptions
    ): Promise<Result<GenericMeshData, string>> => {
      if (!converterRef.current || !state.isInitialized) {
        const error = 'AST converter not initialized';
        logger.error('[ERROR]', error);
        return { success: false, error };
      }

      setState(prev => ({ ...prev, isConverting: true, error: null }));
      const startTime = performance.now();

      try {
        logger.debug('[CONVERT] Converting single AST node');
        
        const result = await converterRef.current.convertSingle(node, options);
        const conversionTime = performance.now() - startTime;

        setState(prev => ({
          ...prev,
          isConverting: false,
          lastConversionTime: conversionTime,
          error: result.success ? null : result.error,
        }));

        if (result.success) {
          logger.debug(`[CONVERT] Single node conversion completed in ${conversionTime.toFixed(2)}ms`);
        } else {
          logger.error('[ERROR] Single node conversion failed:', result.error);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const conversionTime = performance.now() - startTime;
        
        setState(prev => ({
          ...prev,
          isConverting: false,
          lastConversionTime: conversionTime,
          error: errorMessage,
        }));

        logger.error('[ERROR] Single node conversion error:', errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [state.isInitialized]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Initialize converter on mount if autoInitialize is true
   */
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !converterRef.current) {
      initializeConverter();
    }
  }, [autoInitialize, state.isInitialized, initializeConverter]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (converterRef.current) {
        logger.debug('[CLEANUP] Disposing AST converter');
        converterRef.current.dispose();
        converterRef.current = null;
      }
    };
  }, []);

  return {
    state,
    convert,
    convertSingle,
    clearError,
  };
}
