/**
 * @file CSG2 Browser Initializer
 * 
 * Provides CSG2 initialization for browser environments only.
 * This is the production-safe version that contains no Node.js dependencies.
 * 
 * Separated from test utilities to resolve environment conflicts.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';

/**
 * Result type for CSG2 initialization
 */
export type CSG2InitResult = {
  readonly success: true;
  readonly message: string;
  readonly method: 'babylon-standard' | 'browser-existing';
} | {
  readonly success: false;
  readonly error: string;
  readonly method: 'failed';
};

/**
 * Configuration for CSG2 initialization
 */
export interface CSG2InitConfig {
  readonly timeout?: number;
  readonly enableLogging?: boolean;
  readonly retryAttempts?: number;
}

/**
 * Default configuration for CSG2 initialization
 */
const DEFAULT_CONFIG: Required<CSG2InitConfig> = {
  timeout: 3000, // 3 seconds for browser compatibility
  enableLogging: false, // Disabled by default in production
  retryAttempts: 2
} as const;

/**
 * Global initialization state
 */
let isCSG2Initialized = false;
let initializationPromise: Promise<CSG2InitResult> | null = null;

/**
 * Initialize CSG2 for browser environments
 * 
 * This function handles CSG2 initialization in browser environments only.
 * It uses the standard BABYLON.InitializeCSG2Async() method with proper
 * error handling and timeout management.
 * 
 * @param config - Configuration options
 * @returns Promise resolving to initialization result
 */
export async function initializeCSG2ForBrowser(config: CSG2InitConfig = {}): Promise<CSG2InitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    if (finalConfig.enableLogging) {
      console.log('[DEBUG] CSG2 initialization already in progress, waiting...');
    }
    return initializationPromise;
  }
  
  // Return success if already initialized
  if (isCSG2Initialized && BABYLON.IsCSG2Ready?.()) {
    if (finalConfig.enableLogging) {
      console.log('[DEBUG] CSG2 already initialized and ready');
    }
    return {
      success: true,
      message: 'CSG2 already initialized',
      method: 'babylon-standard'
    };
  }
  
  // Start initialization
  initializationPromise = performCSG2Initialization(finalConfig);
  
  try {
    const result = await initializationPromise;
    if (result.success) {
      isCSG2Initialized = true;
    }
    return result;
  } finally {
    initializationPromise = null;
  }
}

/**
 * Perform the actual CSG2 initialization for browser environments
 */
async function performCSG2Initialization(config: Required<CSG2InitConfig>): Promise<CSG2InitResult> {
  if (config.enableLogging) {
    console.log('[INIT] Starting CSG2 initialization for browser environment');
  }

  // Check if CSG2 is already available
  if (BABYLON.IsCSG2Ready?.()) {
    if (config.enableLogging) {
      console.log('[DEBUG] ✅ CSG2 already initialized and ready');
    }
    return {
      success: true,
      message: 'CSG2 was already initialized',
      method: 'browser-existing'
    };
  }

  // Try standard initialization with timeout
  try {
    if (config.enableLogging) {
      console.log('[DEBUG] Attempting browser CSG2 initialization...');
    }

    // Add safety check for BABYLON.InitializeCSG2Async existence
    if (typeof BABYLON.InitializeCSG2Async !== 'function') {
      throw new Error('BABYLON.InitializeCSG2Async is not available');
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('CSG2 browser initialization timeout')), config.timeout);
    });

    await Promise.race([
      BABYLON.InitializeCSG2Async(),
      timeoutPromise
    ]);

    if (config.enableLogging) {
      console.log('[DEBUG] ✅ CSG2 initialized successfully using browser method');
    }

    return {
      success: true,
      message: 'CSG2 initialized using browser method',
      method: 'babylon-standard'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (config.enableLogging) {
      console.log('[ERROR] Browser CSG2 initialization failed:', errorMessage);
    }

    return {
      success: false,
      error: `Browser initialization failed: ${errorMessage}`,
      method: 'failed'
    };
  }
}

/**
 * Check if CSG2 is ready for use
 * Browser-safe implementation
 */
export function isCSG2Ready(): boolean {
  try {
    return isCSG2Initialized && (BABYLON.IsCSG2Ready?.() ?? false);
  } catch (error) {
    console.warn('[WARN] Error checking CSG2 ready state:', error);
    return false;
  }
}

/**
 * Reset CSG2 initialization state
 * Note: This is primarily for testing purposes
 */
export function resetCSG2State(): void {
  isCSG2Initialized = false;
  initializationPromise = null;
}

/**
 * Factory function for easy CSG2 initialization
 */
export const createCSG2Initializer = (config: CSG2InitConfig = {}) => ({
  initialize: () => initializeCSG2ForBrowser(config),
  isReady: isCSG2Ready,
  reset: resetCSG2State
});
