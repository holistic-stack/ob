/**
 * @file Use BabylonJS Inspector Hook
 *
 * React hook for managing BabylonJS Inspector lifecycle and state.
 * Provides declarative inspector management with React 19 compatibility.
 */

import type { Scene } from '@babylonjs/core';
import { useCallback, useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';
import type {
  InspectorConfig,
  InspectorError,
  InspectorHideResult,
  InspectorShowResult,
  InspectorState,
  InspectorTabSwitchResult,
} from '@/features/babylon-renderer';
import {
  BabylonInspectorService,
  InspectorErrorCode,
  InspectorTab,
} from '@/features/babylon-renderer';
import { createLogger } from '@/shared';

const logger = createLogger('useBabylonInspector');

/**
 * Inspector options
 */
export interface InspectorOptions {
  readonly enablePopup?: boolean;
  readonly enableOverlay?: boolean;
  readonly enableEmbedMode?: boolean;
  readonly initialTab?: string;
  readonly onInspectorReady?: () => void;
  readonly onInspectorError?: (error: Error) => void;
}

/**
 * Hook return type with React 19 concurrent features
 */
export interface UseBabylonInspectorReturn {
  readonly inspectorService: BabylonInspectorService | null;
  readonly inspectorState: InspectorState;
  readonly deferredInspectorState: InspectorState;
  readonly showInspector: (
    scene?: Scene,
    options?: InspectorOptions
  ) => Promise<InspectorShowResult>;
  readonly hideInspector: () => InspectorHideResult;
  readonly switchTab: (tabName: InspectorTab) => Promise<InspectorTabSwitchResult>;
  readonly isInspectorAvailable: boolean;
  readonly isPending: boolean;
  readonly startTransition: (callback: () => void) => void;
}

/**
 * Default inspector configuration
 */
const DEFAULT_INSPECTOR_CONFIG: InspectorConfig = {
  enableInspector: true,
  enablePopup: false,
  enableEmbedded: false,
  initialTab: InspectorTab.SCENE,
  showExplorer: true,
  showInspector: true,
  showActions: true,
  showStats: true,
} as const;

/**
 * Initial inspector state
 */
const INITIAL_INSPECTOR_STATE: InspectorState = {
  isVisible: false,
  isEmbedded: false,
  currentTab: InspectorTab.SCENE,
  scene: null,
  lastUpdated: new Date(),
} as const;

/**
 * Use BabylonJS Inspector Hook
 *
 * Manages BabylonJS Inspector lifecycle with React 19 compatibility.
 * Provides declarative inspector show/hide and state management.
 */
export const useBabylonInspector = (): UseBabylonInspectorReturn => {
  const [inspectorState, setInspectorState] = useState<InspectorState>(INITIAL_INSPECTOR_STATE);
  const inspectorServiceRef = useRef<BabylonInspectorService | null>(null);
  const currentSceneRef = useRef<Scene | null>(null);

  // React 19 concurrent features
  const [isPending, startTransition] = useTransition();
  const deferredInspectorState = useDeferredValue(inspectorState);

  /**
   * Initialize inspector service if not already created
   */
  const getInspectorService = useCallback((): BabylonInspectorService => {
    if (!inspectorServiceRef.current) {
      inspectorServiceRef.current = new BabylonInspectorService(DEFAULT_INSPECTOR_CONFIG);
      logger.debug('[DEBUG][useBabylonInspector] Inspector service created');
    }
    return inspectorServiceRef.current;
  }, []);

  /**
   * Check if inspector is available
   */
  const isInspectorAvailable = useCallback((): boolean => {
    try {
      // Check if BabylonJS Inspector is available
      return (
        typeof window !== 'undefined' &&
        'BABYLON' in window &&
        'Inspector' in (window as { BABYLON: { Inspector?: unknown } }).BABYLON
      );
    } catch {
      return false;
    }
  }, []);

  /**
   * Show BabylonJS inspector with React 19 concurrent features
   */
  const showInspector = useCallback(
    async (scene?: Scene, options: InspectorOptions = {}): Promise<InspectorShowResult> => {
      logger.debug('[DEBUG][useBabylonInspector] Showing inspector...');

      const inspectorService = getInspectorService();
      const targetScene = scene || currentSceneRef.current;

      if (!targetScene) {
        const error: InspectorError = {
          code: InspectorErrorCode.SCENE_NOT_PROVIDED,
          message: 'Scene is required to show inspector',
          timestamp: new Date(),
        };

        // Use startTransition for non-blocking state updates
        startTransition(() => {
          setInspectorState((prev) => ({
            ...prev,
            error,
            lastUpdated: new Date(),
          }));
        });

        if (options.onInspectorError) {
          options.onInspectorError(new Error(error.message));
        }

        return {
          success: false,
          error,
        };
      }

      // Merge options with defaults
      const config: InspectorConfig = {
        ...DEFAULT_INSPECTOR_CONFIG,
        enablePopup: options.enablePopup ?? DEFAULT_INSPECTOR_CONFIG.enablePopup,
        enableEmbedded: options.enableEmbedMode ?? DEFAULT_INSPECTOR_CONFIG.enableEmbedded,
        initialTab: (options.initialTab as InspectorTab) ?? DEFAULT_INSPECTOR_CONFIG.initialTab,
      };

      const result = await inspectorService.show(targetScene, config);

      if (result.success) {
        // Update state with successful show using startTransition for non-blocking updates
        const newState = inspectorService.getState();
        startTransition(() => {
          setInspectorState(newState);
        });
        currentSceneRef.current = targetScene;

        // Call success callback
        if (options.onInspectorReady) {
          options.onInspectorReady();
        }

        logger.debug('[DEBUG][useBabylonInspector] Inspector shown successfully');
      } else {
        // Update state with error using startTransition for non-blocking updates
        startTransition(() => {
          setInspectorState((prev) => ({
            ...prev,
            error: result.error,
            lastUpdated: new Date(),
          }));
        });

        // Call error callback
        if (options.onInspectorError) {
          options.onInspectorError(new Error(result.error.message));
        }

        logger.error(`[ERROR][useBabylonInspector] Inspector show failed: ${result.error.message}`);
      }

      return result;
    },
    [getInspectorService]
  );

  /**
   * Hide BabylonJS inspector with React 19 concurrent features
   */
  const hideInspector = useCallback((): InspectorHideResult => {
    logger.debug('[DEBUG][useBabylonInspector] Hiding inspector...');

    if (!inspectorServiceRef.current) {
      return {
        success: true,
        data: undefined,
      };
    }

    const result = inspectorServiceRef.current.hide();

    if (result.success) {
      // Update state using startTransition for non-blocking updates
      const newState = inspectorServiceRef.current.getState();
      startTransition(() => {
        setInspectorState(newState);
      });
      logger.debug('[DEBUG][useBabylonInspector] Inspector hidden successfully');
    } else {
      logger.error(`[ERROR][useBabylonInspector] Inspector hide failed: ${result.error.message}`);
    }

    return result;
  }, []);

  /**
   * Switch inspector tab
   */
  const switchTab = useCallback(
    async (tabName: InspectorTab): Promise<InspectorTabSwitchResult> => {
      logger.debug(`[DEBUG][useBabylonInspector] Switching to tab: ${tabName}`);

      if (!inspectorServiceRef.current) {
        const error: InspectorError = {
          code: InspectorErrorCode.TAB_SWITCH_FAILED,
          message: 'Inspector service not initialized',
          timestamp: new Date(),
        };

        return {
          success: false,
          error,
        };
      }

      const result = await inspectorServiceRef.current.switchTab(tabName);

      if (result.success) {
        // Update state using startTransition for non-blocking updates
        const newState = inspectorServiceRef.current.getState();
        startTransition(() => {
          setInspectorState(newState);
        });
        logger.debug(`[DEBUG][useBabylonInspector] Switched to tab: ${tabName}`);
      } else {
        logger.error(`[ERROR][useBabylonInspector] Tab switch failed: ${result.error.message}`);
      }

      return result;
    },
    []
  );

  /**
   * Update inspector state periodically when visible with React 19 concurrent features
   */
  useEffect(() => {
    if (!inspectorServiceRef.current || !inspectorState.isVisible) {
      return;
    }

    const updateInterval = setInterval(() => {
      const newState = inspectorServiceRef.current?.getState();
      if (newState) {
        // Use startTransition for non-blocking periodic updates
        startTransition(() => {
          setInspectorState(newState);
        });
      }
    }, 2000); // Update every 2 seconds

    return () => {
      clearInterval(updateInterval);
    };
  }, [inspectorState.isVisible]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (inspectorServiceRef.current && inspectorState.isVisible) {
        const result = inspectorServiceRef.current.hide();
        if (!result.success) {
          logger.error(`[ERROR][useBabylonInspector] Cleanup hide failed: ${result.error.message}`);
        }
      }
    };
  }, [inspectorState.isVisible]);

  return {
    inspectorService: inspectorServiceRef.current,
    inspectorState,
    deferredInspectorState,
    showInspector,
    hideInspector,
    switchTab,
    isInspectorAvailable: isInspectorAvailable(),
    isPending,
    startTransition,
  };
};
