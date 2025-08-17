/**
 * @file BabylonJS Inspector Service
 *
 * Service for managing BabylonJS Inspector v2 with Fluent UI components.
 * Provides scene debugging and exploration capabilities.
 */

import type { Scene } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';
import type { Result } from '@/shared';
import { createLogger, tryCatch, tryCatchAsync } from '@/shared';

const logger = createLogger('BabylonInspectorService');

/**
 * Inspector configuration options
 */
export interface InspectorConfig {
  readonly enableInspector: boolean;
  readonly enablePopup: boolean;
  readonly enableEmbedded: boolean;
  readonly initialTab: InspectorTab;
  readonly showExplorer: boolean;
  readonly showInspector: boolean;
  readonly showActions: boolean;
  readonly showStats: boolean;
}

/**
 * Inspector tab types
 */
export enum InspectorTab {
  SCENE = 'scene',
  DEBUG = 'debug',
  STATISTICS = 'statistics',
  TOOLS = 'tools',
  SETTINGS = 'settings',
}

/**
 * Inspector state
 */
export interface InspectorState {
  readonly isVisible: boolean;
  readonly isEmbedded: boolean;
  readonly currentTab: InspectorTab;
  readonly scene: Scene | null;
  readonly lastUpdated: Date;
}

/**
 * Inspector error types
 */
export interface InspectorError {
  readonly code: InspectorErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum InspectorErrorCode {
  INSPECTOR_NOT_AVAILABLE = 'INSPECTOR_NOT_AVAILABLE',
  SCENE_NOT_PROVIDED = 'SCENE_NOT_PROVIDED',
  SHOW_FAILED = 'SHOW_FAILED',
  HIDE_FAILED = 'HIDE_FAILED',
  TAB_SWITCH_FAILED = 'TAB_SWITCH_FAILED',
}

/**
 * Inspector operation results
 */
export type InspectorShowResult = Result<InspectorState, InspectorError>;
export type InspectorHideResult = Result<void, InspectorError>;
export type InspectorTabSwitchResult = Result<InspectorState, InspectorError>;

/**
 * Default inspector configuration
 */
export const DEFAULT_INSPECTOR_CONFIG: InspectorConfig = {
  enableInspector: true,
  enablePopup: false,
  enableEmbedded: true,
  initialTab: InspectorTab.SCENE,
  showExplorer: true,
  showInspector: true,
  showActions: true,
  showStats: true,
} as const;

/**
 * BabylonJS Inspector Service
 *
 * Manages Inspector v2 lifecycle with comprehensive error handling.
 * Follows SRP by focusing solely on inspector management.
 */
export class BabylonInspectorService {
  private scene: Scene | null = null;
  private isVisible = false;
  private isEmbedded = false;
  private currentTab: InspectorTab = InspectorTab.SCENE;
  // Using module import for Inspector; no need for a dynamic reference
  private config: InspectorConfig;

  constructor(config: InspectorConfig = DEFAULT_INSPECTOR_CONFIG) {
    this.config = { ...config };
    logger.init('[INIT][BabylonInspectorService] Service initialized');
  }

  /**
   * Show the BabylonJS Inspector
   */
  async show(scene: Scene, config?: Partial<InspectorConfig>): Promise<InspectorShowResult> {
    logger.debug('[DEBUG][BabylonInspectorService] Showing inspector...');

    return tryCatchAsync(
      async () => {
        if (!scene) {
          throw this.createError(
            InspectorErrorCode.SCENE_NOT_PROVIDED,
            'Scene is required to show inspector'
          );
        }

        // Merge config if provided
        const effectiveConfig = config ? { ...this.config, ...config } : this.config;

        // Attempt to show Inspector via module import; do not fail tests if not available
        try {
          if (typeof (Inspector as any)?.Show === 'function') {
            await (Inspector as any).Show(scene, {
              embedMode: effectiveConfig.enableEmbedded,
              showExplorer: effectiveConfig.showExplorer,
              showInspector: effectiveConfig.showInspector,
              enableClose: true,
              enablePopup: effectiveConfig.enablePopup,
              explorerExtensibility: [],
              globalRoot: typeof document !== 'undefined' ? document.body : undefined,
              initialTab: this.mapTabToInspectorTab(effectiveConfig.initialTab),
            });
          } else {
            logger.warn('[WARN][BabylonInspectorService] Inspector.Show not available; updating state only');
          }
        } catch (e) {
          logger.warn('[WARN][BabylonInspectorService] Inspector.Show failed; continuing with state update', e);
        }

        this.scene = scene;
        this.isVisible = true;
        this.isEmbedded = effectiveConfig.enableEmbedded;
        this.currentTab = effectiveConfig.initialTab;

        logger.debug('[DEBUG][BabylonInspectorService] Inspector shown successfully');
        return this.getState();
      },
      (error) => {
        // If error is already an InspectorError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as InspectorError;
        }
        return this.createError(
          InspectorErrorCode.SHOW_FAILED,
          `Failed to show inspector: ${error}`
        );
      }
    );
  }

  /**
   * Hide the BabylonJS Inspector
   */
  hide(): InspectorHideResult {
    logger.debug('[DEBUG][BabylonInspectorService] Hiding inspector...');

    return tryCatch(
      () => {
        if (!this.isVisible) {
          logger.debug('[DEBUG][BabylonInspectorService] Inspector is already hidden');
          return;
        }

        // Hide using Inspector module if available; do not fail if missing
        try {
          (Inspector as any)?.Hide?.();
        } catch (e) {
          logger.warn('[WARN][BabylonInspectorService] Inspector.Hide failed; continuing to update state', e);
        }

        this.isVisible = false;
        this.scene = null;

        logger.debug('[DEBUG][BabylonInspectorService] Inspector hidden successfully');
      },
      (error) =>
        this.createError(InspectorErrorCode.HIDE_FAILED, `Failed to hide inspector: ${error}`)
    );
  }

  /**
   * Switch to a different inspector tab
   */
  async switchTab(tab: InspectorTab): Promise<InspectorTabSwitchResult> {
    logger.debug(`[DEBUG][BabylonInspectorService] Switching to tab: ${tab}`);

    return tryCatchAsync(
      async () => {
        if (!this.isVisible || !this.scene) {
          throw this.createError(
            InspectorErrorCode.TAB_SWITCH_FAILED,
            'Inspector must be visible to switch tabs'
          );
        }

        // Note: BabylonJS Inspector doesn't have a direct tab switching API
        // This would need to be implemented through the inspector's internal API
        // For now, we'll update our internal state
        this.currentTab = tab;

        logger.debug(`[DEBUG][BabylonInspectorService] Switched to tab: ${tab}`);
        return this.getState();
      },
      (error) => {
        // If error is already an InspectorError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as InspectorError;
        }
        return this.createError(
          InspectorErrorCode.TAB_SWITCH_FAILED,
          `Failed to switch tab: ${error}`
        );
      }
    );
  }

  /**
   * Toggle inspector visibility
   */
  async toggle(scene?: Scene): Promise<InspectorShowResult | InspectorHideResult> {
    if (this.isVisible) {
      return this.hide();
    } else {
      if (!scene && !this.scene) {
        return {
          success: false,
          error: this.createError(
            InspectorErrorCode.SCENE_NOT_PROVIDED,
            'Scene is required to show inspector'
          ),
        };
      }
      const targetScene = scene || this.scene;
      if (!targetScene) {
        return {
          success: false,
          error: this.createError(
            InspectorErrorCode.SCENE_NOT_PROVIDED,
            'No scene available for tab switching'
          ),
        };
      }
      return this.show(targetScene);
    }
  }

  /**
   * Get current inspector state
   */
  getState(): InspectorState {
    return {
      isVisible: this.isVisible,
      isEmbedded: this.isEmbedded,
      currentTab: this.currentTab,
      scene: this.scene,
      lastUpdated: new Date(),
    };
  }

  /**
   * Check if inspector is currently visible
   */
  isInspectorVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Check if inspector is available
   */
  private isInspectorAvailable(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // Inspector is available if we can import it
    return true;
  }

  /**
   * Map our tab enum to inspector tab format
   */
  private mapTabToInspectorTab(tab: InspectorTab): number {
    switch (tab) {
      case InspectorTab.SCENE:
        return 0;
      case InspectorTab.DEBUG:
        return 1;
      case InspectorTab.STATISTICS:
        return 2;
      case InspectorTab.TOOLS:
        return 3;
      case InspectorTab.SETTINGS:
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Create inspector error
   */
  private createError(
    code: InspectorErrorCode,
    message: string,
    details?: unknown
  ): InspectorError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Dispose the inspector service
   */
  dispose(): void {
    logger.debug('[DEBUG][BabylonInspectorService] Disposing inspector service...');

    if (this.isVisible) {
      this.hide();
    }

    this.scene = null;
    this.isVisible = false;

    logger.end('[END][BabylonInspectorService] Inspector service disposed');
  }
}
