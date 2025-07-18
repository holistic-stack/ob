/**
 * @file WebGPU Utilities
 *
 * Utility functions for WebGPU support detection and capabilities.
 * Following functional programming patterns with Result<T,E> error handling.
 */

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';

// Extend GPUAdapter interface to include experimental methods
interface ExtendedGPUAdapter extends GPUAdapter {
  requestAdapterInfo?(): Promise<GPUAdapterInfo>;
}

const logger = createLogger('WebGPUUtils');

/**
 * WebGPU capabilities information
 */
export interface WebGPUCapabilities {
  readonly isSupported: boolean;
  readonly adapterInfo: GPUAdapterInfo | null;
  readonly limits: GPUSupportedLimits | null;
  readonly features: ReadonlyArray<string>;
  readonly preferredFormat: GPUTextureFormat | null;
}

/**
 * WebGPU error types
 */
export interface WebGPUError {
  readonly code: WebGPUErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum WebGPUErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  ADAPTER_REQUEST_FAILED = 'ADAPTER_REQUEST_FAILED',
  DEVICE_REQUEST_FAILED = 'DEVICE_REQUEST_FAILED',
  CAPABILITIES_CHECK_FAILED = 'CAPABILITIES_CHECK_FAILED',
}

/**
 * Check if WebGPU is supported in the current browser
 */
export const isWebGPUSupported = (): boolean => {
  logger.debug('[DEBUG][WebGPUUtils] Checking WebGPU support...');

  const isSupported = 'gpu' in navigator && navigator.gpu !== undefined;

  logger.debug(`[DEBUG][WebGPUUtils] WebGPU supported: ${isSupported}`);
  return isSupported;
};

/**
 * Get WebGPU capabilities
 */
export const getWebGPUCapabilities = async (): Promise<Result<WebGPUCapabilities, WebGPUError>> => {
  logger.debug('[DEBUG][WebGPUUtils] Getting WebGPU capabilities...');

  return tryCatchAsync(
    async () => {
      if (!isWebGPUSupported()) {
        throw createWebGPUError(
          WebGPUErrorCode.NOT_SUPPORTED,
          'WebGPU is not supported in this browser'
        );
      }

      const adapter = await navigator.gpu?.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        throw createWebGPUError(
          WebGPUErrorCode.ADAPTER_REQUEST_FAILED,
          'Failed to request WebGPU adapter'
        );
      }

      const adapterInfo =
        'requestAdapterInfo' in adapter
          ? await (adapter as ExtendedGPUAdapter).requestAdapterInfo?.()
          : null;
      const limits = adapter.limits;
      const features = Array.from(adapter.features);

      // Get preferred canvas format
      const preferredFormat = navigator.gpu?.getPreferredCanvasFormat() || null;

      const capabilities: WebGPUCapabilities = {
        isSupported: true,
        adapterInfo: adapterInfo ?? null,
        limits,
        features,
        preferredFormat,
      };

      logger.debug('[DEBUG][WebGPUUtils] WebGPU capabilities retrieved successfully');
      return capabilities;
    },
    (error) => {
      // If error is already a WebGPUError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as WebGPUError;
      }
      return createWebGPUError(
        WebGPUErrorCode.CAPABILITIES_CHECK_FAILED,
        `Failed to get WebGPU capabilities: ${error}`
      );
    }
  );
};

/**
 * Check if specific WebGPU features are supported
 */
export const checkWebGPUFeatures = async (
  requiredFeatures: ReadonlyArray<string>
): Promise<Result<boolean, WebGPUError>> => {
  logger.debug('[DEBUG][WebGPUUtils] Checking WebGPU features...');

  return tryCatchAsync(
    async () => {
      const capabilitiesResult = await getWebGPUCapabilities();

      if (!capabilitiesResult.success) {
        throw capabilitiesResult.error;
      }

      const { features } = capabilitiesResult.data;
      const missingFeatures = requiredFeatures.filter((feature) => !features.includes(feature));

      if (missingFeatures.length > 0) {
        logger.warn(`[WARN][WebGPUUtils] Missing WebGPU features: ${missingFeatures.join(', ')}`);
        return false;
      }

      logger.debug('[DEBUG][WebGPUUtils] All required WebGPU features are supported');
      return true;
    },
    (error) =>
      createWebGPUError(
        WebGPUErrorCode.CAPABILITIES_CHECK_FAILED,
        `Failed to check WebGPU features: ${error}`
      )
  );
};

/**
 * Get WebGPU adapter with specific requirements
 */
export const requestWebGPUAdapter = async (
  options?: GPURequestAdapterOptions
): Promise<Result<GPUAdapter, WebGPUError>> => {
  logger.debug('[DEBUG][WebGPUUtils] Requesting WebGPU adapter...');

  return tryCatchAsync(
    async () => {
      if (!isWebGPUSupported()) {
        throw createWebGPUError(
          WebGPUErrorCode.NOT_SUPPORTED,
          'WebGPU is not supported in this browser'
        );
      }

      const adapter = await navigator.gpu?.requestAdapter(options);

      if (!adapter) {
        throw createWebGPUError(
          WebGPUErrorCode.ADAPTER_REQUEST_FAILED,
          'Failed to request WebGPU adapter'
        );
      }

      logger.debug('[DEBUG][WebGPUUtils] WebGPU adapter requested successfully');
      return adapter;
    },
    (error) => {
      // If error is already a WebGPUError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as WebGPUError;
      }
      return createWebGPUError(
        WebGPUErrorCode.ADAPTER_REQUEST_FAILED,
        `Failed to request WebGPU adapter: ${error}`
      );
    }
  );
};

/**
 * Request WebGPU device with specific features and limits
 */
export const requestWebGPUDevice = async (
  adapter: GPUAdapter,
  descriptor?: GPUDeviceDescriptor
): Promise<Result<GPUDevice, WebGPUError>> => {
  logger.debug('[DEBUG][WebGPUUtils] Requesting WebGPU device...');

  return tryCatchAsync(
    async () => {
      const device = await adapter.requestDevice(descriptor);

      if (!device) {
        throw createWebGPUError(
          WebGPUErrorCode.DEVICE_REQUEST_FAILED,
          'Failed to request WebGPU device'
        );
      }

      // Set up error handling
      device.addEventListener('uncapturederror', (event) => {
        const gpuEvent = event as GPUUncapturedErrorEvent;
        logger.error(
          `[ERROR][WebGPUUtils] WebGPU uncaptured error: ${gpuEvent.error?.message || 'Unknown error'}`
        );
      });

      logger.debug('[DEBUG][WebGPUUtils] WebGPU device requested successfully');
      return device;
    },
    (error) =>
      createWebGPUError(
        WebGPUErrorCode.DEVICE_REQUEST_FAILED,
        `Failed to request WebGPU device: ${error}`
      )
  );
};

/**
 * Create WebGPU error
 */
const createWebGPUError = (
  code: WebGPUErrorCode,
  message: string,
  details?: unknown
): WebGPUError => ({
  code,
  message,
  details,
  timestamp: new Date(),
});

/**
 * Log WebGPU capabilities for debugging
 */
export const logWebGPUCapabilities = async (): Promise<void> => {
  const capabilitiesResult = await getWebGPUCapabilities();

  if (!capabilitiesResult.success) {
    logger.error(
      `[ERROR][WebGPUUtils] Failed to get capabilities: ${capabilitiesResult.error.message}`
    );
    return;
  }

  const { adapterInfo, limits, features, preferredFormat } = capabilitiesResult.data;

  logger.debug('[DEBUG][WebGPUUtils] WebGPU Capabilities:');
  logger.debug(`[DEBUG][WebGPUUtils] - Vendor: ${adapterInfo?.vendor || 'Unknown'}`);
  logger.debug(`[DEBUG][WebGPUUtils] - Architecture: ${adapterInfo?.architecture || 'Unknown'}`);
  logger.debug(`[DEBUG][WebGPUUtils] - Device: ${adapterInfo?.device || 'Unknown'}`);
  logger.debug(
    `[DEBUG][WebGPUUtils] - Max Texture Size: ${limits?.maxTextureDimension2D || 'Unknown'}`
  );
  logger.debug(`[DEBUG][WebGPUUtils] - Max Buffer Size: ${limits?.maxBufferSize || 'Unknown'}`);
  logger.debug(`[DEBUG][WebGPUUtils] - Features: ${features.join(', ')}`);
  logger.debug(`[DEBUG][WebGPUUtils] - Preferred Format: ${preferredFormat || 'Unknown'}`);
};
