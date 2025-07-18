/**
 * @file index.ts
 * @description Centralized Zustand state management feature export providing production-ready
 * state architecture for the OpenSCAD Babylon application. This module implements a
 * bulletproof-react pattern with immutable state, functional programming principles,
 * and comprehensive type safety through Result<T,E> error handling patterns.
 *
 * @architectural_decision
 * **Zustand-Centric Architecture**: The application uses Zustand as the single source of truth
 * for all state management, implementing a slice-based pattern that promotes feature isolation
 * while maintaining global state coherence. This design choice enables:
 * - Predictable state updates through immutable actions
 * - Optimized re-renders through selective subscriptions
 * - Debuggable state changes with comprehensive middleware
 * - Scalable architecture that grows with feature complexity
 *
 * **Performance-First Design**: All state operations are optimized for <16ms render targets:
 * - 300ms debouncing for expensive operations (parsing, rendering)
 * - Memoized selectors prevent unnecessary computations
 * - Immutable state structures enable structural sharing
 * - Strategic use of Immer for complex state updates
 *
 * **Feature-Based State Slices**:
 * - `editor-slice`: Monaco Editor content, cursor position, selection state
 * - `parsing-slice`: OpenSCAD AST parsing with error recovery and caching
 * - `babylon-rendering-slice`: 3D scene management, mesh generation, performance metrics
 * - `config-slice`: Application configuration, user preferences, feature flags
 *
 * @performance_characteristics
 * - **State Update Latency**: <5ms for immediate updates, 300ms for debounced operations
 * - **Memory Usage**: Immutable structures with automatic garbage collection
 * - **Subscription Efficiency**: Component-level subscriptions minimize re-render scope
 * - **Persistence**: Automatic state persistence with configurable storage adapters
 *
 * @example Basic Store Usage
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { selectEditorCode, selectParsingAST } from '@/features/store';
 *
 * function OpenSCADEditor() {
 *   // Subscribe to specific state slices for optimal performance
 *   const code = useAppStore(selectEditorCode);
 *   const ast = useAppStore(selectParsingAST);
 *   const updateCode = useAppStore(state => state.updateCode);
 *   const parseCode = useAppStore(state => state.parseCode);
 *
 *   // Handle code changes with debounced parsing
 *   const handleCodeChange = useCallback((newCode: string) => {
 *     updateCode(newCode);
 *     parseCode(newCode); // Automatically debounced (300ms)
 *   }, [updateCode, parseCode]);
 *
 *   return (
 *     <div>
 *       <CodeEditor value={code} onChange={handleCodeChange} />
 *       <ASTViewer ast={ast} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Advanced State Management with Error Handling
 * ```typescript
 * import { useAppStore, selectParsingState, selectRenderingState } from '@/features/store';
 * import { useCallback, useEffect } from 'react';
 *
 * function AdvancedOpenSCADWorkflow() {
 *   const parsingState = useAppStore(selectParsingState);
 *   const renderingState = useAppStore(selectRenderingState);
 *   const { parseCode, renderAST, resetErrors } = useAppStore(state => ({
 *     parseCode: state.parseCode,
 *     renderAST: state.renderAST,
 *     resetErrors: state.resetErrors
 *   }));
 *
 *   // Handle complete OpenSCAD workflow with error recovery
 *   const processOpenSCADCode = useCallback(async (code: string) => {
 *     try {
 *       // Step 1: Parse OpenSCAD code with error handling
 *       const parseResult = await parseCode(code);
 *       if (!parseResult.success) {
 *         console.error('Parse error:', parseResult.error);
 *         return;
 *       }
 *
 *       // Step 2: Render AST to 3D scene with performance monitoring
 *       const renderResult = await renderAST(parseResult.data);
 *       if (!renderResult.success) {
 *         console.error('Render error:', renderResult.error);
 *         return;
 *       }
 *
 *       console.log(`Successfully processed OpenSCAD code in ${renderResult.data.processingTime}ms`);
 *     } catch (error) {
 *       console.error('Workflow error:', error);
 *       resetErrors(); // Clear error state for recovery
 *     }
 *   }, [parseCode, renderAST, resetErrors]);
 *
 *   // Monitor parsing and rendering states
 *   useEffect(() => {
 *     if (parsingState.isLoading) {
 *       console.log('Parsing OpenSCAD code...');
 *     }
 *     if (renderingState.isRendering) {
 *       console.log('Rendering 3D scene...');
 *     }
 *   }, [parsingState.isLoading, renderingState.isRendering]);
 *
 *   return (
 *     <div>
 *       <button onClick={() => processOpenSCADCode('cube(10);')}>
 *         Process Sample Code
 *       </button>
 *       {parsingState.error && (
 *         <div className="error">Parse Error: {parsingState.error}</div>
 *       )}
 *       {renderingState.error && (
 *         <div className="error">Render Error: {renderingState.error}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Performance Monitoring and Metrics
 * ```typescript
 * import { useAppStore } from '@/features/store';
 * import { useEffect, useState } from 'react';
 *
 * function PerformanceMonitor() {
 *   const [metrics, setMetrics] = useState({
 *     parseTime: 0,
 *     renderTime: 0,
 *     memoryUsage: 0
 *   });
 *
 *   // Subscribe to performance metrics from multiple slices
 *   const { parsingMetrics, renderingMetrics } = useAppStore(state => ({
 *     parsingMetrics: state.parsingState.performance,
 *     renderingMetrics: state.renderingState.performance
 *   }));
 *
 *   useEffect(() => {
 *     setMetrics({
 *       parseTime: parsingMetrics.lastParseTime,
 *       renderTime: renderingMetrics.lastRenderTime,
 *       memoryUsage: renderingMetrics.memoryUsage
 *     });
 *
 *     // Warn about performance issues
 *     if (parsingMetrics.lastParseTime > 1000) {
 *       console.warn(`Slow parsing detected: ${parsingMetrics.lastParseTime}ms`);
 *     }
 *     if (renderingMetrics.lastRenderTime > 16) {
 *       console.warn(`Frame rate warning: ${renderingMetrics.lastRenderTime}ms render time`);
 *     }
 *   }, [parsingMetrics, renderingMetrics]);
 *
 *   return (
 *     <div className="performance-monitor">
 *       <div>Parse Time: {metrics.parseTime}ms</div>
 *       <div>Render Time: {metrics.renderTime}ms</div>
 *       <div>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Testing Store Integration
 * ```typescript
 * import { createAppStore } from '@/features/store';
 * import { act, renderHook } from '@testing-library/react';
 *
 * describe('Store Integration', () => {
 *   it('should handle complete OpenSCAD workflow', async () => {
 *     const store = createAppStore();
 *
 *     // Test code update
 *     act(() => {
 *       store.getState().updateCode('cube(10);');
 *     });
 *
 *     expect(store.getState().code).toBe('cube(10);');
 *
 *     // Test parsing with real implementation
 *     await act(async () => {
 *       const result = await store.getState().parseCode('cube(10);');
 *       expect(result.success).toBe(true);
 *     });
 *
 *     // Test AST availability
 *     const ast = store.getState().parsingState.ast;
 *     expect(ast).toBeDefined();
 *     expect(ast?.type).toBe('Program');
 *   });
 * });
 * ```
 *
 * @diagram Store Architecture
 * ```mermaid
 * graph TD
 *     A[UI Components] --> B[Store Selectors];
 *     B --> C[Zustand Store];
 *     C --> D[Editor Slice];
 *     C --> E[Parsing Slice];
 *     C --> F[Rendering Slice];
 *     C --> G[Config Slice];
 *
 *     D --> D1[Monaco Editor State];
 *     D --> D2[Cursor Position];
 *     D --> D3[Selection State];
 *
 *     E --> E1[OpenSCAD AST];
 *     E --> E2[Parse Errors];
 *     E --> E3[Parse Performance];
 *
 *     F --> F1[3D Scene State];
 *     F --> F2[Mesh Generation];
 *     F --> F3[Render Performance];
 *
 *     G --> G1[User Preferences];
 *     G --> G2[Feature Flags];
 *     G --> G3[Debug Settings];
 *
 *     subgraph "Performance Optimizations"
 *         H[Debounced Actions]
 *         I[Memoized Selectors]
 *         J[Immutable Updates]
 *     end
 * ```
 *
 * @limitations
 * - **Browser Storage**: State persistence limited by localStorage capacity (~5-10MB)
 * - **Memory Management**: Large ASTs (>100,000 nodes) may require chunked processing
 * - **Concurrent Updates**: Store updates are synchronous; async operations require careful coordination
 * - **State Migration**: Schema changes require migration strategies for persisted state
 *
 * @integration_examples
 * **React Component Integration**:
 * - Use `useAppStore` hook for component subscriptions
 * - Import selectors for optimized state access
 * - Implement error boundaries for store error handling
 *
 * **Service Integration**:
 * - Parser service integration through parsing slice actions
 * - Renderer service coordination via rendering slice state
 * - Configuration management through config slice updates
 *
 * **Testing Integration**:
 * - Use `createAppStore()` for isolated test stores
 * - Mock selectors for unit testing
 * - Integration tests with real store instances
 */

// Main store
export * from './app-store';
// Selectors
export * from './selectors';
// Types
export * from './types';
