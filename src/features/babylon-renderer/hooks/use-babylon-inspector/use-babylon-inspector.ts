/**
 * @file Use BabylonJS Inspector Hook
 * 
 * React hook for managing BabylonJS Inspector lifecycle and state.
 * Provides declarative inspector management with React 19 compatibility.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { BabylonInspectorService } from '../../services/babylon-inspector-service';
import type { 
  InspectorConfig, 
  InspectorState,
  InspectorShowResult,
  InspectorHideResult,
  InspectorSwitchTabResult
} from '../../services/babylon-inspector-service';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Scene } from '@babylonjs/core';

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
 * Hook return type
 */
export interface UseBabylonInspectorReturn {
  readonly inspectorService: BabylonInspectorService | null;
  readonly inspectorState: InspectorState;
  readonly showInspector: (scene?: Scene, options?: InspectorOptions) => InspectorShowResult;
  readonly hideInspector: () => InspectorHideResult;
  readonly switchTab: (tabName: string) => InspectorSwitchTabResult;
  readonly isInspectorAvailable: boolean;
}

/**
 * Default inspector configuration
 */
const DEFAULT_INSPECTOR_CONFIG: InspectorConfig = {
  enablePopup: false,
  enableOverlay: true,
  enableEmbedMode: false,
  enableGlobalInspector: true,
  enableSceneExplorer: true,
  enablePropertyInspector: true,
  enableDebugLayer: true,
  enableStatistics: true,
  enableConsole: true,
  initialTab: 'scene',
  theme: 'dark',
  language: 'en',
} as const;

/**
 * Initial inspector state
 */
const INITIAL_INSPECTOR_STATE: InspectorState = {
  isVisible: false,
  isInitialized: false,
  currentTab: 'scene',
  availableTabs: ['scene', 'debug', 'statistics', 'console'],
  scene: null,
  error: null,
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
      return typeof window !== 'undefined' && 
             'BABYLON' in window && 
             'Inspector' in (window as any).BABYLON;
    } catch {
      return false;
    }
  }, []);

  /**
   * Show BabylonJS inspector
   */
  const showInspector = useCallback((
    scene?: Scene,
    options: InspectorOptions = {}
  ): InspectorShowResult => {
    logger.debug('[DEBUG][useBabylonInspector] Showing inspector...');

    const inspectorService = getInspectorService();
    const targetScene = scene || currentSceneRef.current;

    if (!targetScene) {
      const error = {
        code: 'SCENE_NOT_PROVIDED' as const,
        message: 'Scene is required to show inspector',
        timestamp: new Date(),
      };

      setInspectorState(prev => ({
        ...prev,
        error,
        lastUpdated: new Date(),
      }));

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
      enableOverlay: options.enableOverlay ?? DEFAULT_INSPECTOR_CONFIG.enableOverlay,
      enableEmbedMode: options.enableEmbedMode ?? DEFAULT_INSPECTOR_CONFIG.enableEmbedMode,
      initialTab: options.initialTab ?? DEFAULT_INSPECTOR_CONFIG.initialTab,
    };

    const result = inspectorService.show(targetScene, config);

    if (result.success) {
      // Update state with successful show
      const newState = inspectorService.getState();
      setInspectorState(newState);
      currentSceneRef.current = targetScene;

      // Call success callback
      if (options.onInspectorReady) {
        options.onInspectorReady();
      }

      logger.debug('[DEBUG][useBabylonInspector] Inspector shown successfully');
    } else {
      // Update state with error
      setInspectorState(prev => ({
        ...prev,
        error: result.error,
        lastUpdated: new Date(),
      }));

      // Call error callback
      if (options.onInspectorError) {
        options.onInspectorError(new Error(result.error.message));
      }

      logger.error(`[ERROR][useBabylonInspector] Inspector show failed: ${result.error.message}`);
    }

    return result;
  }, [getInspectorService]);

  /**
   * Hide BabylonJS inspector
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
      // Update state
      const newState = inspectorServiceRef.current.getState();
      setInspectorState(newState);
      logger.debug('[DEBUG][useBabylonInspector] Inspector hidden successfully');
    } else {
      logger.error(`[ERROR][useBabylonInspector] Inspector hide failed: ${result.error.message}`);
    }

    return result;
  }, []);

  /**
   * Switch inspector tab
   */
  const switchTab = useCallback((tabName: string): InspectorSwitchTabResult => {
    logger.debug(`[DEBUG][useBabylonInspector] Switching to tab: ${tabName}`);

    if (!inspectorServiceRef.current) {
      const error = {
        code: 'TAB_SWITCH_FAILED' as const,
        message: 'Inspector service not initialized',
        timestamp: new Date(),
      };

      return {
        success: false,
        error,
      };
    }

    const result = inspectorServiceRef.current.switchTab(tabName);

    if (result.success) {
      // Update state
      const newState = inspectorServiceRef.current.getState();
      setInspectorState(newState);
      logger.debug(`[DEBUG][useBabylonInspector] Switched to tab: ${tabName}`);
    } else {
      logger.error(`[ERROR][useBabylonInspector] Tab switch failed: ${result.error.message}`);
    }

    return result;
  }, []);

  /**
   * Update inspector state periodically when visible
   */
  useEffect(() => {
    if (!inspectorServiceRef.current || !inspectorState.isVisible) {
      return;
    }

    const updateInterval = setInterval(() => {
      const newState = inspectorServiceRef.current!.getState();
      setInspectorState(newState);
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
        inspectorServiceRef.current.hide().catch((error) => {
          logger.error(`[ERROR][useBabylonInspector] Cleanup hide failed: ${error}`);
        });
      }
    };
  }, [inspectorState.isVisible]);

  return {
    inspectorService: inspectorServiceRef.current,
    inspectorState,
    showInspector,
    hideInspector,
    switchTab,
    isInspectorAvailable: isInspectorAvailable(),
  };
};
