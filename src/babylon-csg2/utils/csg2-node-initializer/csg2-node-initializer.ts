/**
 * @file CSG2 Node.js Initializer
 * 
 * Provides CSG2 initialization for Node.js environments using manifold-3d package.
 * Solves the issue where BABYLON.InitializeCSG2Async() fails in headless environments.
 * 
 * Based on solution from: https://forum.babylonjs.com/t/initializing-csg2-in-node-js/56431/8
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
  readonly method: 'manifold-direct' | 'babylon-standard' | 'mock-fallback';
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
  readonly forceMockInTests?: boolean;
  readonly retryAttempts?: number;
}

/**
 * Default configuration for CSG2 initialization
 */
const DEFAULT_CONFIG: Required<CSG2InitConfig> = {
  timeout: 10000, // 10 seconds
  enableLogging: true,
  forceMockInTests: true,
  retryAttempts: 3
} as const;

/**
 * Global initialization state
 */
let isCSG2Initialized = false;
let initializationPromise: Promise<CSG2InitResult> | null = null;

/**
 * Initialize CSG2 for Node.js environments
 * 
 * This function handles CSG2 initialization in different environments:
 * 1. Node.js: Uses manifold-3d package directly
 * 2. Browser: Uses standard BABYLON.InitializeCSG2Async()
 * 3. Tests: Uses mock implementation for reliability
 * 
 * @param config - Configuration options
 * @returns Promise resolving to initialization result
 */
export async function initializeCSG2ForNode(config: CSG2InitConfig = {}): Promise<CSG2InitResult> {
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
 * Perform the actual CSG2 initialization with multiple strategies
 */
async function performCSG2Initialization(config: Required<CSG2InitConfig>): Promise<CSG2InitResult> {
  if (config.enableLogging) {
    console.log('[INIT] Starting CSG2 initialization for Node.js environment');
  }
  
  // Strategy 1: Use mock in test environments
  if (config.forceMockInTests && isTestEnvironment()) {
    if (config.enableLogging) {
      console.log('[DEBUG] Test environment detected, using mock CSG2');
    }
    return initializeMockCSG2(config);
  }
  
  // Strategy 2: Try manifold-3d direct initialization for Node.js
  if (isNodeEnvironment()) {
    if (config.enableLogging) {
      console.log('[DEBUG] Node.js environment detected, trying manifold-3d direct initialization');
    }
    
    const manifoldResult = await tryManifoldDirectInit(config);
    if (manifoldResult.success) {
      return manifoldResult;
    }
    
    if (config.enableLogging) {
      console.log('[WARN] Manifold direct initialization failed, falling back to standard method');
    }
  }
  
  // Strategy 3: Try standard Babylon.js initialization
  if (config.enableLogging) {
    console.log('[DEBUG] Trying standard BABYLON.InitializeCSG2Async()');
  }
  
  const standardResult = await tryStandardInit(config);
  if (standardResult.success) {
    return standardResult;
  }
  
  // Strategy 4: Fallback to mock
  if (config.enableLogging) {
    console.log('[WARN] Standard initialization failed, falling back to mock');
  }
  
  return initializeMockCSG2(config);
}

/**
 * Try to initialize CSG2 using manifold-3d package directly
 */
async function tryManifoldDirectInit(config: Required<CSG2InitConfig>): Promise<CSG2InitResult> {
  try {
    // Dynamic import to avoid issues if manifold-3d is not available
    const Module = await import('manifold-3d');
    
    if (config.enableLogging) {
      console.log('[DEBUG] manifold-3d package loaded, initializing...');
    }
    
    const wasm = await Module.default();
    wasm.setup();
    const { Manifold, Mesh } = wasm;
    
    // Initialize CSG2 with manifold instances
    await BABYLON.InitializeCSG2Async({
      manifoldInstance: Manifold,
      manifoldMeshInstance: Mesh,
    });
    
    if (config.enableLogging) {
      console.log('[DEBUG] ✅ CSG2 initialized successfully using manifold-3d direct method');
    }
    
    return {
      success: true,
      message: 'CSG2 initialized using manifold-3d direct method',
      method: 'manifold-direct'
    };
  } catch (error) {
    if (config.enableLogging) {
      console.log('[ERROR] Manifold direct initialization failed:', error);
    }
    
    return {
      success: false,
      error: `Manifold direct initialization failed: ${error}`,
      method: 'failed'
    };
  }
}

/**
 * Try to initialize CSG2 using standard Babylon.js method
 */
async function tryStandardInit(config: Required<CSG2InitConfig>): Promise<CSG2InitResult> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('CSG2 initialization timeout')), config.timeout);
    });
    
    await Promise.race([
      BABYLON.InitializeCSG2Async(),
      timeoutPromise
    ]);
    
    if (config.enableLogging) {
      console.log('[DEBUG] ✅ CSG2 initialized successfully using standard method');
    }
    
    return {
      success: true,
      message: 'CSG2 initialized using standard Babylon.js method',
      method: 'babylon-standard'
    };
  } catch (error) {
    if (config.enableLogging) {
      console.log('[ERROR] Standard CSG2 initialization failed:', error);
    }
    
    return {
      success: false,
      error: `Standard initialization failed: ${error}`,
      method: 'failed'
    };
  }
}

/**
 * Initialize mock CSG2 for testing environments
 */
async function initializeMockCSG2(config: Required<CSG2InitConfig>): Promise<CSG2InitResult> {
  try {
    // Import and setup mock from vitest-setup
    const { initializeCSG2ForTests } = await import('../../../vitest-setup');
    await initializeCSG2ForTests();
    
    if (config.enableLogging) {
      console.log('[DEBUG] ✅ Mock CSG2 initialized successfully');
    }
    
    return {
      success: true,
      message: 'Mock CSG2 initialized for testing',
      method: 'mock-fallback'
    };
  } catch (error) {
    if (config.enableLogging) {
      console.log('[ERROR] Mock CSG2 initialization failed:', error);
    }
    
    return {
      success: false,
      error: `Mock initialization failed: ${error}`,
      method: 'failed'
    };
  }
}

/**
 * Check if running in Node.js environment
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' &&
         process.versions?.node !== null;
}

/**
 * Check if running in test environment
 */
function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || 
         process.env.VITEST === 'true' || 
         typeof global !== 'undefined' && 
         (global as typeof global & { __VITEST__?: boolean }).__VITEST__ === true;
}

/**
 * Check if CSG2 is ready for use
 */
export function isCSG2Ready(): boolean {
  // In test environment, check if mock is available
  if (isTestEnvironment() && (globalThis as typeof globalThis & { __MOCK_IS_CSG2_READY__?: () => boolean }).__MOCK_IS_CSG2_READY__) {
    return isCSG2Initialized && ((globalThis as typeof globalThis & { __MOCK_IS_CSG2_READY__?: () => boolean }).__MOCK_IS_CSG2_READY__?.() ?? false);
  }

  // In normal environment, check Babylon.js CSG2
  return isCSG2Initialized && (BABYLON.IsCSG2Ready?.() ?? false);
}

/**
 * Reset CSG2 initialization state (for testing)
 */
export function resetCSG2State(): void {
  isCSG2Initialized = false;
  initializationPromise = null;
}

/**
 * Factory function for easy CSG2 initialization
 */
export const createCSG2Initializer = (config: CSG2InitConfig = {}) => ({
  initialize: () => initializeCSG2ForNode(config),
  isReady: isCSG2Ready,
  reset: resetCSG2State
});
