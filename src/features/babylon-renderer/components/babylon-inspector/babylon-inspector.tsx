/**
 * @file BabylonJS Inspector Component
 *
 * React component for BabylonJS Inspector with React 19 concurrent features.
 * Uses Suspense for lazy loading and concurrent rendering optimizations.
 */

import type { Scene } from '@babylonjs/core';
import { Suspense, useCallback, useEffect, useState } from 'react';
import type { InspectorTab } from '@/features/babylon-renderer';
import { useBabylonInspector } from '@/features/babylon-renderer';
import { createLogger } from '@/shared';

const logger = createLogger('BabylonInspector');

/**
 * Inspector component props
 */
export interface BabylonInspectorProps {
  readonly scene?: Scene | undefined;
  readonly isVisible?: boolean;
  readonly enableEmbedded?: boolean;
  readonly enablePopup?: boolean;
  readonly initialTab?: InspectorTab;
  readonly className?: string;
  readonly onInspectorReady?: (() => void) | undefined;
  readonly onInspectorError?: ((error: Error) => void) | undefined;
}

/**
 * Inspector loading fallback component
 */
const InspectorLoadingFallback: React.FC = () => (
  <div className="inspector-loading" data-testid="inspector-loading">
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      <span className="ml-2 text-sm text-gray-600">Loading Inspector...</span>
    </div>
  </div>
);

/**
 * Inspector error boundary fallback
 */
const InspectorErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({
  error,
  retry,
}) => (
  <div className="inspector-error" data-testid="inspector-error">
    <div className="p-4 border border-red-300 rounded-md bg-red-50">
      <h3 className="text-sm font-medium text-red-800">Inspector Error</h3>
      <p className="mt-1 text-sm text-red-700">{error.message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
      >
        Retry
      </button>
    </div>
  </div>
);

/**
 * Inspector controls component
 */
const InspectorControls: React.FC<{
  isVisible: boolean;
  isPending: boolean;
  onToggle: () => void;
  onSwitchTab: (tab: InspectorTab) => void;
}> = ({ isVisible, isPending, onToggle, onSwitchTab }) => (
  <div className="inspector-controls" data-testid="inspector-controls">
    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
      <button
        type="button"
        aria-label={isPending ? 'Loading Inspector' : isVisible ? 'Hide Inspector' : 'Show Inspector'}
        onClick={onToggle}
        disabled={isPending}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          isVisible
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isPending ? 'Loading...' : isVisible ? 'Hide Inspector' : 'Show Inspector'}
      </button>

      {(isVisible || isPending) && (
        <div className="flex space-x-1">
          <button
            type="button"
            aria-label="Scene"
            onClick={() => onSwitchTab('SCENE' as InspectorTab)}
            className="px-2 py-1 text-xs bg-white rounded hover:bg-gray-50"
          >
            Scene
          </button>
          <button
            type="button"
            aria-label="Stats"
            onClick={() => onSwitchTab('STATISTICS' as InspectorTab)}
            className="px-2 py-1 text-xs bg-white rounded hover:bg-gray-50"
          >
            Stats
          </button>
        </div>
      )}
    </div>
  </div>
);

/**
 * BabylonJS Inspector Component with React 19 concurrent features
 *
 * Features:
 * - Lazy loading with Suspense
 * - Non-blocking operations with useTransition
 * - Deferred state updates for performance
 * - Error boundaries for graceful error handling
 */
export const BabylonInspector: React.FC<BabylonInspectorProps> = ({
  scene,
  isVisible,
  enableEmbedded = true,
  enablePopup = false,
  initialTab,
  className = '',
  onInspectorReady,
  onInspectorError,
}) => {
  const {
    inspectorState,
    deferredInspectorState,
    showInspector,
    hideInspector,
    switchTab,
    isPending,
    startTransition,
  } = useBabylonInspector();

  const [error, setError] = useState<Error | null>(null);

  /**
   * Handle inspector toggle with concurrent features
   */
  const handleToggle = useCallback(() => {
    if (!scene) {
      const err = new Error('Scene is required for inspector');
      setError(err);
      onInspectorError?.(err);
      return;
    }

    if (inspectorState.isVisible) {
      const result = hideInspector();
      if (!result.success) {
        const err = new Error(result.error.message);
        setError(err);
        onInspectorError?.(err);
      }
    } else {
      showInspector(scene, {
        enableEmbedMode: enableEmbedded,
        enablePopup,
        initialTab: initialTab as string,
        ...(onInspectorReady && { onInspectorReady }),
        onInspectorError: (err) => {
          setError(err);
          onInspectorError?.(err);
        },
      }).catch((err) => {
        setError(err);
        onInspectorError?.(err);
      });
    }
  }, [
    scene,
    inspectorState.isVisible,
    showInspector,
    hideInspector,
    enableEmbedded,
    enablePopup,
    initialTab,
    onInspectorReady,
    onInspectorError,
    startTransition,
  ]);

  /**
   * Handle tab switching with concurrent features
   */
  const handleSwitchTab = useCallback(
    (tab: InspectorTab) => {
      startTransition(() => {
        switchTab(tab).catch((err) => {
          const error = new Error(`Failed to switch tab: ${err.message}`);
          setError(error);
          onInspectorError?.(error);
        });
      });
    },
    [switchTab, onInspectorError, startTransition]
  );

  /**
   * Retry function for error recovery
   */
  const handleRetry = useCallback(() => {
    setError(null);
    handleToggle();
  }, [handleToggle]);

  /**
   * Sync visibility with prop changes
   */
  useEffect(() => {
    if (!scene) return;

    // Only sync when the component is controlled via the isVisible prop
    const isControlled = typeof isVisible === 'boolean';
    if (!isControlled) return;

    // Sync visibility to prop changes without toggling back-and-forth
    if (isVisible && !inspectorState.isVisible) {
      startTransition(() => {
        showInspector(scene, {
          enableEmbedMode: enableEmbedded,
          enablePopup,
          initialTab: initialTab as string,
          ...(onInspectorReady && { onInspectorReady }),
          onInspectorError: (err) => {
            setError(err);
            onInspectorError?.(err);
          },
        }).catch((err) => {
          setError(err);
          onInspectorError?.(err);
        });
      });
    }
  }, [
    isVisible,
    inspectorState.isVisible,
    scene,
    startTransition,
    showInspector,
    enableEmbedded,
    enablePopup,
    initialTab,
    onInspectorReady,
    onInspectorError,
  ]);

  /**
   * Log state changes for debugging
   */
  useEffect(() => {
    logger.debug(
      `[DEBUG][BabylonInspector] State: visible=${deferredInspectorState.isVisible}, pending=${isPending}`
    );
  }, [deferredInspectorState.isVisible, isPending]);

  if (error) {
    return <InspectorErrorFallback error={error} retry={handleRetry} />;
  }

  return (
    <div className={`babylon-inspector ${className}`} data-testid="babylon-inspector">
      <Suspense fallback={<InspectorLoadingFallback />}>
        <InspectorControls
          isVisible={inspectorState.isVisible}
          isPending={isPending}
          onToggle={handleToggle}
          onSwitchTab={handleSwitchTab}
        />

        {deferredInspectorState.isVisible && (
          <div className="inspector-container" data-testid="inspector-container">
            <div className="text-xs text-gray-500 p-2">
              Inspector is embedded in the BabylonJS scene
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default BabylonInspector;
