/**
 * @file Feature Detection Service
 *
 * Provides comprehensive feature detection and capability checking for
 * graceful degradation in production environments. Detects browser
 * capabilities, WebGL support, and application-specific features.
 *
 * @example
 * ```typescript
 * import { FeatureDetectionService } from './feature-detection.service';
 *
 * const detector = new FeatureDetectionService();
 * await detector.initialize();
 *
 * if (detector.isWebGLSupported()) {
 *   // Use WebGL rendering
 * } else {
 *   // Fall back to alternative rendering
 * }
 *
 * const capabilities = detector.getCapabilities();
 * console.log('Supported features:', capabilities);
 * ```
 */

import type { Result } from '../../types/result.types';
import { tryCatch, tryCatchAsync } from '../../utils/functional/result';
import { createLogger } from '../logger.service';

/**
 * Extended Navigator interface for experimental browser APIs
 */
interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
  };
  mozConnection?: {
    effectiveType?: string;
    downlink?: number;
  };
  webkitConnection?: {
    effectiveType?: string;
    downlink?: number;
  };
}

const logger = createLogger('FeatureDetection');

/**
 * Browser capabilities information
 */
export interface BrowserCapabilities {
  readonly webgl: {
    readonly supported: boolean;
    readonly version: string | null;
    readonly renderer: string | null;
    readonly vendor: string | null;
    readonly maxTextureSize: number;
    readonly maxVertexAttribs: number;
  };
  readonly webgpu: {
    readonly supported: boolean;
    readonly adapter: boolean;
    readonly features: readonly string[];
  };
  readonly performance: {
    readonly hardwareConcurrency: number;
    readonly deviceMemory: number | null;
    readonly connection: {
      readonly effectiveType: string | null;
      readonly downlink: number | null;
    };
  };
  readonly storage: {
    readonly localStorage: boolean;
    readonly sessionStorage: boolean;
    readonly indexedDB: boolean;
  };
  readonly apis: {
    readonly webWorkers: boolean;
    readonly sharedArrayBuffer: boolean;
    readonly offscreenCanvas: boolean;
    readonly resizeObserver: boolean;
  };
}

/**
 * Application feature support levels
 */
export enum FeatureSupportLevel {
  FULL = 'full',
  PARTIAL = 'partial',
  FALLBACK = 'fallback',
  UNSUPPORTED = 'unsupported',
}

/**
 * Feature support information
 */
export interface FeatureSupport {
  readonly level: FeatureSupportLevel;
  readonly reason: string;
  readonly fallbackAvailable: boolean;
  readonly recommendations: readonly string[];
}

/**
 * Feature detection error
 */
export interface FeatureDetectionError {
  readonly code: 'DETECTION_FAILED' | 'INITIALIZATION_FAILED' | 'CAPABILITY_CHECK_FAILED';
  readonly message: string;
  readonly feature: string;
  readonly timestamp: Date;
}

/**
 * Feature Detection Service
 *
 * Provides comprehensive feature detection and capability assessment
 * for graceful degradation in production environments.
 */
export class FeatureDetectionService {
  private capabilities: BrowserCapabilities | null = null;
  private initialized = false;

  constructor() {
    logger.init('[INIT] Feature detection service created');
  }

  /**
   * Initialize the feature detection service
   */
  async initialize(): Promise<Result<void, FeatureDetectionError>> {
    if (this.initialized) {
      return { success: true, data: undefined };
    }

    logger.debug('[INIT] Initializing feature detection...');

    return tryCatchAsync(
      async () => {
        this.capabilities = await this.detectCapabilities();
        this.initialized = true;

        logger.debug('[INIT] Feature detection initialized successfully');
        logger.debug('[CAPABILITIES]', this.capabilities);
      },
      (error): FeatureDetectionError => ({
        code: 'INITIALIZATION_FAILED',
        message: `Failed to initialize feature detection: ${error instanceof Error ? error.message : String(error)}`,
        feature: 'initialization',
        timestamp: new Date(),
      })
    );
  }

  /**
   * Get browser capabilities
   */
  getCapabilities(): BrowserCapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if WebGL is supported
   */
  isWebGLSupported(): boolean {
    return this.capabilities?.webgl?.supported ?? false;
  }

  /**
   * Check if WebGPU is supported
   */
  isWebGPUSupported(): boolean {
    return this.capabilities?.webgpu?.supported ?? false;
  }

  /**
   * Check if high-performance rendering is available
   */
  isHighPerformanceRenderingAvailable(): boolean {
    if (!this.capabilities) return false;

    const { webgl, performance } = this.capabilities;
    return Boolean(
      webgl?.supported && webgl?.maxTextureSize >= 4096 && performance?.hardwareConcurrency >= 4
    );
  }

  /**
   * Get feature support level for a specific capability
   */
  getFeatureSupport(feature: string): FeatureSupport {
    if (!this.capabilities) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'Feature detection not initialized',
        fallbackAvailable: false,
        recommendations: ['Initialize feature detection service'],
      };
    }

    switch (feature) {
      case 'webgl':
        return this.getWebGLSupport();
      case 'webgpu':
        return this.getWebGPUSupport();
      case 'high-performance':
        return this.getHighPerformanceSupport();
      case 'storage':
        return this.getStorageSupport();
      case 'workers':
        return this.getWorkerSupport();
      default:
        return {
          level: FeatureSupportLevel.UNSUPPORTED,
          reason: `Unknown feature: ${feature}`,
          fallbackAvailable: false,
          recommendations: [],
        };
    }
  }

  /**
   * Detect all browser capabilities
   */
  private async detectCapabilities(): Promise<BrowserCapabilities> {
    const [webgl, webgpu, performance, storage, apis] = await Promise.all([
      this.detectWebGLCapabilities(),
      this.detectWebGPUCapabilities(),
      this.detectPerformanceCapabilities(),
      this.detectStorageCapabilities(),
      this.detectAPICapabilities(),
    ]);

    return {
      webgl,
      webgpu,
      performance,
      storage,
      apis,
    };
  }

  /**
   * Detect WebGL capabilities
   */
  private detectWebGLCapabilities(): BrowserCapabilities['webgl'] {
    const result = tryCatch(
      () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) {
          return {
            supported: false,
            version: null,
            renderer: null,
            vendor: null,
            maxTextureSize: 0,
            maxVertexAttribs: 0,
          };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const version = gl.getParameter(gl.VERSION);
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null;
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

        return {
          supported: true,
          version,
          renderer,
          vendor,
          maxTextureSize,
          maxVertexAttribs,
        };
      },
      () => ({
        supported: false,
        version: null,
        renderer: null,
        vendor: null,
        maxTextureSize: 0,
        maxVertexAttribs: 0,
      })
    );

    return result.success
      ? result.data
      : {
          supported: false,
          version: null,
          renderer: null,
          vendor: null,
          maxTextureSize: 0,
          maxVertexAttribs: 0,
        };
  }

  /**
   * Detect WebGPU capabilities
   */
  private async detectWebGPUCapabilities(): Promise<BrowserCapabilities['webgpu']> {
    const result = await tryCatchAsync(
      async () => {
        if (!('gpu' in navigator)) {
          return {
            supported: false,
            adapter: false,
            features: [],
          };
        }

        if (!navigator.gpu) {
          return {
            supported: false,
            adapter: false,
            features: [],
          };
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          return {
            supported: true,
            adapter: false,
            features: [],
          };
        }

        return {
          supported: true,
          adapter: true,
          features: Array.from(adapter.features),
        };
      },
      () => ({
        supported: false,
        adapter: false,
        features: [],
      })
    );

    return result.success
      ? result.data
      : {
          supported: false,
          adapter: false,
          features: [],
        };
  }

  /**
   * Detect performance capabilities
   */
  private detectPerformanceCapabilities(): BrowserCapabilities['performance'] {
    const result = tryCatch(
      () => {
        const hardwareConcurrency = navigator.hardwareConcurrency || 1;
        const deviceMemory = (navigator as ExtendedNavigator).deviceMemory || null;

        const connection =
          (navigator as ExtendedNavigator).connection ||
          (navigator as ExtendedNavigator).mozConnection ||
          (navigator as ExtendedNavigator).webkitConnection;
        const connectionInfo = connection
          ? {
              effectiveType: connection.effectiveType || null,
              downlink: connection.downlink || null,
            }
          : {
              effectiveType: null,
              downlink: null,
            };

        return {
          hardwareConcurrency,
          deviceMemory,
          connection: connectionInfo,
        };
      },
      () => ({
        hardwareConcurrency: 1,
        deviceMemory: null,
        connection: {
          effectiveType: null,
          downlink: null,
        },
      })
    );

    return result.success ? result.data : result.error;
  }

  /**
   * Detect storage capabilities
   */
  private detectStorageCapabilities(): BrowserCapabilities['storage'] {
    return {
      localStorage: this.testStorage('localStorage'),
      sessionStorage: this.testStorage('sessionStorage'),
      indexedDB: 'indexedDB' in window,
    };
  }

  /**
   * Detect API capabilities
   */
  private detectAPICapabilities(): BrowserCapabilities['apis'] {
    return {
      webWorkers: typeof Worker !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      resizeObserver: typeof ResizeObserver !== 'undefined',
    };
  }

  /**
   * Test storage availability
   */
  private testStorage(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get WebGL support details
   */
  private getWebGLSupport(): FeatureSupport {
    const webgl = this.capabilities?.webgl;

    if (!webgl || !webgl.supported) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'WebGL is not supported by this browser',
        fallbackAvailable: true,
        recommendations: [
          'Update your browser to the latest version',
          'Enable hardware acceleration in browser settings',
          'Use a different browser that supports WebGL',
        ],
      };
    }

    if (webgl.maxTextureSize < 2048) {
      return {
        level: FeatureSupportLevel.FALLBACK,
        reason: 'Limited WebGL capabilities detected',
        fallbackAvailable: true,
        recommendations: ['Update graphics drivers', 'Use lower quality settings'],
      };
    }

    return {
      level: FeatureSupportLevel.FULL,
      reason: 'Full WebGL support available',
      fallbackAvailable: false,
      recommendations: [],
    };
  }

  /**
   * Get WebGPU support details
   */
  private getWebGPUSupport(): FeatureSupport {
    const webgpu = this.capabilities?.webgpu;

    if (!webgpu || !webgpu.supported) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'WebGPU is not supported by this browser',
        fallbackAvailable: true,
        recommendations: [
          'Use Chrome Canary or Firefox Nightly',
          'Enable WebGPU experimental features',
          'Fall back to WebGL rendering',
        ],
      };
    }

    if (!webgpu.adapter) {
      return {
        level: FeatureSupportLevel.FALLBACK,
        reason: 'WebGPU adapter not available',
        fallbackAvailable: true,
        recommendations: ['Update graphics drivers', 'Fall back to WebGL rendering'],
      };
    }

    return {
      level: FeatureSupportLevel.FULL,
      reason: 'Full WebGPU support available',
      fallbackAvailable: false,
      recommendations: [],
    };
  }

  /**
   * Get high-performance support details
   */
  private getHighPerformanceSupport(): FeatureSupport {
    const capabilities = this.capabilities;
    if (!capabilities) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'Feature detection not initialized',
        fallbackAvailable: false,
        recommendations: ['Initialize feature detection service'],
      };
    }

    const { webgl, performance } = capabilities;

    if (!webgl?.supported) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'WebGL not supported',
        fallbackAvailable: true,
        recommendations: ['Enable WebGL support'],
      };
    }

    if ((performance?.hardwareConcurrency || 0) < 2 || (webgl?.maxTextureSize || 0) < 4096) {
      return {
        level: FeatureSupportLevel.PARTIAL,
        reason: 'Limited hardware capabilities',
        fallbackAvailable: true,
        recommendations: [
          'Use performance optimization features',
          'Reduce model complexity',
          'Enable LOD and culling',
        ],
      };
    }

    return {
      level: FeatureSupportLevel.FULL,
      reason: 'High-performance rendering available',
      fallbackAvailable: false,
      recommendations: [],
    };
  }

  /**
   * Get storage support details
   */
  private getStorageSupport(): FeatureSupport {
    const capabilities = this.capabilities;
    if (!capabilities) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'Feature detection not initialized',
        fallbackAvailable: false,
        recommendations: ['Initialize feature detection service'],
      };
    }

    const storage = capabilities.storage;

    if (!storage?.localStorage && !storage?.sessionStorage) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'No storage APIs available',
        fallbackAvailable: true,
        recommendations: ['Enable cookies and local storage', 'Use in-memory storage fallback'],
      };
    }

    if (!storage?.localStorage) {
      return {
        level: FeatureSupportLevel.PARTIAL,
        reason: 'Only session storage available',
        fallbackAvailable: true,
        recommendations: ['Enable local storage for better persistence'],
      };
    }

    return {
      level: FeatureSupportLevel.FULL,
      reason: 'Full storage support available',
      fallbackAvailable: false,
      recommendations: [],
    };
  }

  /**
   * Get worker support details
   */
  private getWorkerSupport(): FeatureSupport {
    const capabilities = this.capabilities;
    if (!capabilities) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'Feature detection not initialized',
        fallbackAvailable: false,
        recommendations: ['Initialize feature detection service'],
      };
    }

    const apis = capabilities.apis;

    if (!apis?.webWorkers) {
      return {
        level: FeatureSupportLevel.UNSUPPORTED,
        reason: 'Web Workers not supported',
        fallbackAvailable: true,
        recommendations: [
          'Update browser to support Web Workers',
          'Use main thread processing fallback',
        ],
      };
    }

    return {
      level: FeatureSupportLevel.FULL,
      reason: 'Web Workers supported',
      fallbackAvailable: false,
      recommendations: [],
    };
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    this.capabilities = null;
    this.initialized = false;
    logger.debug('[DISPOSE] Feature detection service disposed');
  }
}
