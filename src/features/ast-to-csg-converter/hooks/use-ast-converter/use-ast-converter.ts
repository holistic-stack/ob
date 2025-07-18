/**
 * @file use-ast-converter.ts
 * @description React hook that provides AST to mesh conversion functionality
 * with proper lifecycle management, error handling, and performance tracking.
 * It integrates with the `ASTToMeshConversionService` to transform OpenSCAD AST nodes
 * into renderable 3D mesh data.
 *
 * @architectural_decision
 * - **Hook-based API**: Exposes conversion capabilities as a React hook, allowing easy
 *   integration into React components while managing internal state and side effects.
 * - **Singleton Service**: Internally uses a `useRef` to hold an instance of `ASTToMeshConversionService`,
 *   ensuring that the conversion service is initialized only once and persists across re-renders.
 * - **Result Type for Errors**: Employs the `Result<T, E>` type for all asynchronous operations
 *   to explicitly handle success and error states, promoting functional error handling.
 * - **Performance Tracking**: Tracks the time taken for conversions, which can be used for
 *   performance monitoring and optimization.
 *
 * @performance_integration
 * **Real-time Performance Monitoring**:
 * ```typescript
 * import { useASTConverter } from './use-ast-converter';
 * import { usePerformanceMonitor } from '@/shared/hooks/use-performance-monitor';
 *
 * function PerformanceAwareRenderer() {
 *   const { state, convert } = useASTConverter();
 *   const monitor = usePerformanceMonitor();
 *
 *   const performConversion = async (ast: ASTNode[]) => {
 *     monitor.start('conversion');
 *     const result = await convert(ast, {
 *       optimizeResult: true,
 *       enableCaching: true
 *     });
 *     monitor.end('conversion');
 *
 *     if (result.success) {
 *       const totalTime = monitor.getDuration('conversion');
 *       console.log(`🎯 Performance: ${totalTime}ms total, ${result.data.operationTime}ms conversion`);
 *
 *       // Alert if performance target exceeded
 *       if (totalTime > 50) {
 *         console.warn(`⚠️ Performance target exceeded: ${totalTime}ms > 50ms`);
 *       }
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <div>Last conversion: {state.lastConversionTime.toFixed(2)}ms</div>
 *       <div>Status: {state.isConverting ? 'Converting...' : 'Ready'}</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Complete integration example with OpenSCAD editor
 * import { useASTConverter } from './features/ast-to-csg-converter/hooks/use-ast-converter/use-ast-converter';
 * import { useAppStore } from './features/store/app-store';
 * import { selectParsingAST } from './features/store/selectors';
 * import { useDebounce } from './shared/hooks/use-debounce';
 *
 * function OpenSCADEditor() {
 *   const ast = useAppStore(selectParsingAST);
 *   const { state, convert, clearError } = useASTConverter();
 *   const [meshes, setMeshes] = useState<GenericMeshData[]>([]);
 *
 *   // Debounce AST changes to prevent excessive conversions
 *   const debouncedAST = useDebounce(ast, 300);
 *
 *   useEffect(() => {
 *     if (debouncedAST.length > 0 && !state.isConverting) {
 *       const performConversion = async () => {
 *         clearError(); // Clear previous errors
 *
 *         const result = await convert(debouncedAST, {
 *           optimizeResult: true,
 *           enableCaching: true,
 *           timeout: 5000,
 *           maxComplexity: 100000
 *         });
 *
 *         if (result.success) {
 *           setMeshes(result.data.meshes);
 *           console.log(`✅ Converted ${result.data.meshes.length} meshes in ${result.data.operationTime}ms`);
 *
 *           // Performance validation
 *           if (result.data.operationTime > 50) {
 *             console.warn(`⚠️ Slow conversion: ${result.data.operationTime}ms`);
 *           }
 *         } else {
 *           console.error('❌ Conversion failed:', result.error);
 *           setMeshes([]); // Clear meshes on error
 *         }
 *       };
 *
 *       performConversion();
 *     }
 *   }, [debouncedAST, state.isConverting, convert, clearError]);
 *
 *   return (
 *     <div className="openscad-editor">
 *       <div className="status-bar">
 *         {state.isConverting && (
 *           <div className="converting">
 *             🔄 Converting... ({state.lastConversionTime.toFixed(2)}ms last)
 *           </div>
 *         )}
 *         {state.error && (
 *           <div className="error">
 *             ❌ Error: {state.error}
 *             <button onClick={clearError}>Clear</button>
 *           </div>
 *         )}
 *         {meshes.length > 0 && (
 *           <div className="success">
 *             ✅ {meshes.length} objects ({meshes.reduce((sum, m) => sum + m.metadata.vertexCount, 0)} vertices)
 *           </div>
 *         )}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with custom error recovery and batch processing
 * import { useASTConverter } from './use-ast-converter';
 * import type { ConversionOptions } from '../../types/conversion.types';
 *
 * function AdvancedMeshConverter() {
 *   const { state, convert, convertSingle, clearError } = useASTConverter();
 *   const [processingQueue, setProcessingQueue] = useState<ASTNode[]>([]);
 *   const [completedMeshes, setCompletedMeshes] = useState<GenericMeshData[]>([]);
 *
 *   // Batch processing with error recovery
 *   const processBatch = async (astNodes: ASTNode[]) => {
 *     setProcessingQueue(astNodes);
 *     const results: GenericMeshData[] = [];
 *     const errors: string[] = [];
 *
 *     for (const [index, node] of astNodes.entries()) {
 *       try {
 *         console.log(`Processing ${index + 1}/${astNodes.length}: ${node.type}`);
 *
 *         const options: ConversionOptions = {
 *           optimizeResult: true,
 *           enableCaching: true,
 *           timeout: 2000, // Shorter timeout for individual nodes
 *           maxComplexity: 10000
 *         };
 *
 *         const result = await convertSingle(node, options);
 *
 *         if (result.success) {
 *           results.push(result.data);
 *           console.log(`✅ ${node.type} converted (${result.data.metadata.vertexCount} vertices)`);
 *         } else {
 *           errors.push(`${node.type}: ${result.error}`);
 *           console.error(`❌ ${node.type} failed: ${result.error}`);
 *         }
 *       } catch (error) {
 *         errors.push(`${node.type}: ${error}`);
 *         console.error(`💥 ${node.type} crashed:`, error);
 *       }
 *     }
 *
 *     setCompletedMeshes(results);
 *     setProcessingQueue([]);
 *
 *     console.log(`🎯 Batch complete: ${results.length}/${astNodes.length} successful`);
 *     if (errors.length > 0) {
 *       console.warn(`⚠️ Errors encountered:`, errors);
 *     }
 *   };
 *
 *   // Progressive enhancement: try fast conversion first, fallback to slow
 *   const convertWithFallback = async (astNodes: ASTNode[]) => {
 *     // Fast attempt
 *     const fastResult = await convert(astNodes, {
 *       optimizeResult: false, // Skip optimization for speed
 *       enableCaching: true,
 *       timeout: 1000,         // Very short timeout
 *       maxComplexity: 5000    // Low complexity limit
 *     });
 *
 *     if (fastResult.success && fastResult.data.errors.length === 0) {
 *       console.log('🚀 Fast conversion successful');
 *       return fastResult.data.meshes;
 *     }
 *
 *     // Fallback to thorough conversion
 *     console.log('🔄 Falling back to thorough conversion');
 *     const thoroughResult = await convert(astNodes, {
 *       optimizeResult: true,
 *       enableCaching: true,
 *       timeout: 10000,
 *       maxComplexity: 100000
 *     });
 *
 *     if (thoroughResult.success) {
 *       console.log('✅ Thorough conversion successful');
 *       return thoroughResult.data.meshes;
 *     }
 *
 *     // Final fallback: batch processing
 *     console.log('🔄 Falling back to batch processing');
 *     await processBatch(astNodes);
 *     return completedMeshes;
 *   };
 *
 *   return (
 *     <div className="advanced-converter">
 *       <div className="metrics">
 *         <div>Conversion time: {state.lastConversionTime.toFixed(2)}ms</div>
 *         <div>Queue: {processingQueue.length} items</div>
 *         <div>Completed: {completedMeshes.length} meshes</div>
 *       </div>
 *
 *       {state.isConverting && (
 *         <div className="progress">
 *           Converting... ({processingQueue.length} remaining)
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[useASTConverter Hook] --> B{autoInitialize?};
 *    B -- Yes --> C[useEffect: Initialize on Mount];
 *    B -- No --> D[Manual Call to initializeConverter];
 *    C --> E[ASTToMeshConversionService.initialize()];
 *    D --> E;
 *    E -- Success --> F[state.isInitialized = true];
 *    E -- Failure --> G[state.error = errorMessage];
 *    F --> H[convert() / convertSingle() available];
 *    H -- Call convert --> I[ASTToMeshConversionService.convert()];
 *    H -- Call convertSingle --> J[ASTToMeshConversionService.convertSingle()];
 *    I -- Result --> K[Update state (isConverting, lastConversionTime, error)];
 *    J -- Result --> K;
 *    K --> L[Return Result<T, E>];
 *    A --> M[useEffect: Cleanup on Unmount];
 *    M --> N[ASTToMeshConversionService.dispose()];
 *
 *    subgraph "Performance Tracking"
 *        O[Track Conversion Time]
 *        P[Monitor Cache Hits]
 *        Q[Error Recovery]
 *    end
 *
 *    subgraph "React Integration"
 *        R[State Management]
 *        S[Lifecycle Hooks]
 *        T[Error Boundaries]
 *    end
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { ASTToMeshConversionService } from '../../services/ast-to-mesh-converter/ast-to-mesh-converter';
import type {
  ConversionOptions,
  ConversionResult,
  GenericMeshData,
} from '../../types/conversion.types';

/**
 * @constant logger
 * @description Logger instance for the `useASTConverter` hook, providing structured logging for debugging and tracing.
 */
const logger = createLogger('useASTConverter');

/**
 * @interface UseASTConverterState
 * @description Defines the shape of the state managed by the `useASTConverter` hook.
 * @property {boolean} isInitialized - Indicates whether the underlying `ASTToMeshConversionService` has been successfully initialized.
 * @property {boolean} isConverting - Indicates whether a conversion operation is currently in progress.
 * @property {string | null} error - Stores any error message encountered during initialization or conversion, or `null` if no error.
 * @property {number} lastConversionTime - The time in milliseconds taken for the last successful or failed conversion operation.
 */
interface UseASTConverterState {
  readonly isInitialized: boolean;
  readonly isConverting: boolean;
  readonly error: string | null;
  readonly lastConversionTime: number;
}

/**
 * @interface UseASTConverterReturn
 * @description Defines the shape of the object returned by the `useASTConverter` hook.
 * @property {UseASTConverterState} state - The current state of the converter.
 * @property {(ast: ReadonlyArray<unknown>, options?: ConversionOptions) => Promise<Result<ConversionResult, string>>} convert - A function to convert an array of AST nodes to mesh data.
 * @property {(node: unknown, options?: ConversionOptions) => Promise<Result<GenericMeshData, string>>} convertSingle - A function to convert a single AST node to mesh data.
 * @property {() => void} clearError - A function to clear the current error state.
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
 * @function useASTConverter
 * @description React hook for converting OpenSCAD AST nodes to 3D mesh data.
 * It manages the lifecycle of the `ASTToMeshConversionService` and provides functions
 * to perform conversions, along with state to track initialization, conversion progress, and errors.
 *
 * @param {boolean} [autoInitialize=true] - If `true`, the converter service will be automatically initialized on component mount.
 * @returns {UseASTConverterReturn} An object containing the current state and conversion functions.
 *
 * @architectural_decision
 * - **Lazy Initialization**: The `ASTToMeshConversionService` is initialized only when the hook is mounted
 *   (if `autoInitialize` is true) or when `initializeConverter` is explicitly called. This avoids unnecessary resource allocation.
 * - **Immutability**: The `state` object is updated immutably using the spread operator, ensuring predictable state changes.
 * - **Error Propagation**: Errors from the conversion service are captured and exposed through the `error` state property and the `Result` type.
 *
 * @limitations
 * - The `ASTToMeshConversionService` itself might have performance limitations for very complex ASTs.
 * - Error messages are currently simple strings; more detailed error objects could be implemented for better debugging.
 *
 * @edge_cases
 * - **Converter Not Initialized**: Calls to `convert` or `convertSingle` before initialization will result in an error.
 * - **Empty AST**: Passing an empty array to `convert` should gracefully return an empty result.
 * - **Invalid AST Nodes**: The conversion service is expected to handle invalid AST nodes and report errors appropriately.
 *
 * @example
 * ```typescript
 * // Basic usage in a functional component:
 * function MyComponent() {
 *   const { state, convert, clearError } = useASTConverter();
 *   const astNodes = [{ type: 'Cube', size: 10 }]; // Example AST
 *
 *   const handleConvert = async () => {
 *     clearError();
 *     const result = await convert(astNodes);
 *     if (result.success) {
 *       console.log('Converted meshes:', result.data.meshes);
 *     } else {
 *       console.error('Conversion error:', result.error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleConvert} disabled={state.isConverting || !state.isInitialized}>
 *         {state.isConverting ? 'Converting...' : 'Convert AST'}
 *       </button>
 *       {state.error && <p style={{ color: 'red' }}>Error: {state.error}</p>}
 *       {state.isInitialized ? <p>Converter Ready</p> : <p>Converter Initializing...</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[useASTConverter Hook] --> B{autoInitialize?};
 *    B -- Yes --> C[useEffect: Initialize on Mount];
 *    B -- No --> D[Manual Call to initializeConverter];
 *    C --> E[ASTToMeshConversionService.initialize()];
 *    D --> E;
 *    E -- Success --> F[state.isInitialized = true];
 *    E -- Failure --> G[state.error = errorMessage];
 *    F --> H[convert() / convertSingle() available];
 *    H -- Call convert --> I[ASTToMeshConversionService.convert()];
 *    H -- Call convertSingle --> J[ASTToMeshConversionService.convertSingle()];
 *    I -- Result --> K[Update state (isConverting, lastConversionTime, error)];
 *    J -- Result --> K;
 *    K --> L[Return Result<T, E>];
 *    A --> M[useEffect: Cleanup on Unmount];
 *    M --> N[ASTToMeshConversionService.dispose()];
 * ```
 */
export function useASTConverter(autoInitialize = true): UseASTConverterReturn {
  /**
   * @constant converterRef
   * @description A `useRef` hook to hold the instance of `ASTToMeshConversionService`.
   * This ensures that the service instance persists across component re-renders without being re-created,
   * acting as a singleton within the hook's lifecycle.
   */
  const converterRef = useRef<ASTToMeshConversionService | null>(null);

  /**
   * @constant state
   * @description The local state managed by the hook, tracking initialization status, conversion progress, and errors.
   * @type {UseASTConverterState}
   */
  const [state, setState] = useState<UseASTConverterState>({
    isInitialized: false,
    isConverting: false,
    error: null,
    lastConversionTime: 0,
  });

  /**
   * @function initializeConverter
   * @description Initializes the `ASTToMeshConversionService`.
   * This function is memoized using `useCallback` to prevent unnecessary re-creations.
   * It handles the asynchronous initialization process and updates the hook's state based on the outcome.
   *
   * @returns {Promise<void>}
   *
   * @edge_cases
   * - **Already Initialized**: If `converterRef.current` already exists, it will not re-initialize the service.
   * - **Initialization Failure**: Catches any errors during initialization and updates the `error` state.
   *
   * @example
   * ```typescript
   * // Can be called manually if autoInitialize is false:
   * const { initializeConverter } = useASTConverter(false);
   * // ... later in a useEffect or event handler
   * initializeConverter();
   * ```
   */
  const initializeConverter = useCallback(async () => {
    try {
      logger.debug('[INIT] Initializing AST converter hook');

      if (!converterRef.current) {
        converterRef.current = new ASTToMeshConversionService();
      }

      const result = await converterRef.current.initialize();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isInitialized: true,
          error: null,
        }));
        logger.debug('[INIT] AST converter hook initialized successfully');
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : String(result.error);
        setState((prev) => ({
          ...prev,
          isInitialized: false,
          error: errorMessage,
        }));
        logger.error('[ERROR] Failed to initialize AST converter:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState((prev) => ({
        ...prev,
        isInitialized: false,
        error: errorMessage,
      }));
      logger.error('[ERROR] AST converter initialization error:', errorMessage);
    }
  }, []);

  /**
   * @function convert
   * @description Converts a `ReadonlyArray` of AST nodes into `ConversionResult` (mesh data).
   * This function is memoized using `useCallback` and tracks the conversion progress and time.
   *
   * @param {ReadonlyArray<unknown>} ast - The Abstract Syntax Tree (AST) nodes to convert.
   * @param {ConversionOptions} [options] - Optional conversion parameters (e.g., optimization flags).
   * @returns {Promise<Result<ConversionResult, string>>} A promise that resolves to a `Result` object,
   * indicating success with `ConversionResult` or failure with an error message.
   *
   * @limitations
   * - Requires the converter to be initialized (`state.isInitialized` must be `true`).
   * - The `unknown` type for AST nodes implies that the internal `ASTToMeshConversionService`
   *   is responsible for type checking and handling specific AST node structures.
   *
   * @edge_cases
   * - **Uninitialized Converter**: Returns an error if called before the service is initialized.
   * - **Conversion Errors**: Catches and reports errors that occur during the conversion process.
   *
   * @example
   * ```typescript
   * // Convert an array of AST nodes with optimization:
   * const astNodes = [{ type: 'Cube', size: 10 }, { type: 'Sphere', radius: 5 }];
   * const result = await convert(astNodes, { optimizeResult: true });
   * if (result.success) {
   *   console.log('Converted meshes:', result.data.meshes);
   * }
   * ```
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

      setState((prev) => ({ ...prev, isConverting: true, error: null }));
      const startTime = performance.now();

      try {
        logger.debug(`[CONVERT] Converting ${ast.length} AST nodes`);

        const result = await converterRef.current.convert(ast, options);
        const conversionTime = performance.now() - startTime;

        setState((prev) => ({
          ...prev,
          isConverting: false,
          lastConversionTime: conversionTime,
          error: result.success
            ? null
            : typeof result.error === 'string'
              ? result.error
              : String(result.error),
        }));

        if (result.success) {
          logger.debug(`[CONVERT] Conversion completed in ${conversionTime.toFixed(2)}ms`);
        } else {
          const errorMessage =
            typeof result.error === 'string' ? result.error : String(result.error);
          logger.error('[ERROR] Conversion failed:', errorMessage);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const conversionTime = performance.now() - startTime;

        setState((prev) => ({
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
   * @function convertSingle
   * @description Converts a single AST node into `GenericMeshData`.
   * This function is memoized using `useCallback` and tracks the conversion progress and time.
   *
   * @param {unknown} node - The single AST node to convert.
   * @param {ConversionOptions} [options] - Optional conversion parameters.
   * @returns {Promise<Result<GenericMeshData, string>>} A promise that resolves to a `Result` object,
   * indicating success with `GenericMeshData` or failure with an error message.
   *
   * @limitations
   * - Similar to `convert`, requires the converter to be initialized.
   * - The `unknown` type for the node implies that the internal `ASTToMeshConversionService`
   *   is responsible for type checking and handling specific AST node structures.
   *
   * @edge_cases
   * - **Uninitialized Converter**: Returns an error if called before the service is initialized.
   * - **Invalid Node**: Catches and reports errors if the provided node is not a valid AST node for conversion.
   *
   * @example
   * ```typescript
   * // Convert a single cube AST node:
   * const cubeNode = { type: 'Cube', size: 10 };
   * const result = await convertSingle(cubeNode);
   * if (result.success) {
   *   console.log('Converted single mesh:', result.data);
   * }
   * ```
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

      setState((prev) => ({ ...prev, isConverting: true, error: null }));
      const startTime = performance.now();

      try {
        logger.debug('[CONVERT] Converting single AST node');

        const result = await converterRef.current.convertSingle(node, options);
        const conversionTime = performance.now() - startTime;

        setState((prev) => ({
          ...prev,
          isConverting: false,
          lastConversionTime: conversionTime,
          error: result.success
            ? null
            : typeof result.error === 'string'
              ? result.error
              : String(result.error),
        }));

        if (result.success) {
          logger.debug(
            `[CONVERT] Single node conversion completed in ${conversionTime.toFixed(2)}ms`
          );
        } else {
          const errorMessage =
            typeof result.error === 'string' ? result.error : String(result.error);
          logger.error('[ERROR] Single node conversion failed:', errorMessage);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const conversionTime = performance.now() - startTime;

        setState((prev) => ({
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
   * @function clearError
   * @description Clears the current error state of the hook.
   * This can be used to reset the error display after a user has acknowledged an error.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Call this function to dismiss an error message:
   * clearError();
   * ```
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * @effect
   * @description Initializes the `ASTToMeshConversionService` when the component mounts,
   * provided `autoInitialize` is `true` and the service is not already initialized.
   * This ensures the converter is ready for use as soon as the hook is active.
   *
   * @dependencies `autoInitialize`, `state.isInitialized`, `initializeConverter`
   *
   * @example
   * ```typescript
   * // This effect runs automatically on mount:
   * useASTConverter(true); // Will trigger initialization
   * ```
   */
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !converterRef.current) {
      initializeConverter();
    }
  }, [autoInitialize, state.isInitialized, initializeConverter]);

  /**
   * @effect
   * @description Cleans up the `ASTToMeshConversionService` instance when the component unmounts.
   * This is crucial for preventing memory leaks by disposing of resources held by the service.
   *
   * @returns {() => void} A cleanup function that disposes the converter.
   *
   * @example
   * ```typescript
   * // This effect's cleanup function runs automatically on unmount:
   * // (No direct call needed in component code)
   * ```
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
