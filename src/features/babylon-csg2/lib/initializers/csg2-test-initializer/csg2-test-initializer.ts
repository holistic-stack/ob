/**
 * @file CSG2 Test Initializer
 * 
 * Provides CSG2 initialization for test environments with Node.js support.
 * This file contains test-specific utilities and Node.js dependencies.
 * 
 * Separated from production code to resolve environment conflicts.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';

/**
 * Result type for CSG2 initialization
 */
export type CSG2TestInitResult = {
  readonly success: true;
  readonly message: string;
  readonly method: 'manifold-direct' | 'babylon-standard' | 'mock-vitest' | 'mock-simple';
} | {
  readonly success: false;
  readonly error: string;
  readonly method: 'failed';
};

/**
 * Configuration for CSG2 test initialization
 */
export interface CSG2TestInitConfig {
  readonly timeout?: number;
  readonly enableLogging?: boolean;
  readonly forceMockInTests?: boolean;
  readonly retryAttempts?: number;
}

/**
 * Default configuration for CSG2 test initialization
 */
const DEFAULT_TEST_CONFIG: Required<CSG2TestInitConfig> = {
  timeout: 5000, // 5 seconds for test environments
  enableLogging: true, // Enabled by default in tests
  forceMockInTests: true, // Use mocks by default in tests
  retryAttempts: 3
} as const;

/**
 * Global initialization state
 */
let isCSG2Initialized = false;
let initializationPromise: Promise<CSG2TestInitResult> | null = null;

/**
 * Initialize CSG2 for test environments
 * 
 * This function handles CSG2 initialization in test environments with support for:
 * 1. Node.js: Uses manifold-3d package directly
 * 2. Mock implementations for reliable testing
 * 3. Fallback to vitest-setup mock
 * 
 * @param config - Configuration options
 * @returns Promise resolving to initialization result
 */
export async function initializeCSG2ForTests(config: CSG2TestInitConfig = {}): Promise<CSG2TestInitResult> {
  const finalConfig = { ...DEFAULT_TEST_CONFIG, ...config };
  
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    if (finalConfig.enableLogging) {
      console.log('[DEBUG] CSG2 test initialization already in progress, waiting...');
    }
    return initializationPromise;
  }
  
  // Return success if already initialized
  if (isCSG2Initialized && isCSG2ReadyForTests()) {
    if (finalConfig.enableLogging) {
      console.log('[DEBUG] CSG2 already initialized and ready for tests');
    }
    return {
      success: true,
      message: 'CSG2 already initialized for tests',
      method: 'babylon-standard'
    };
  }
  
  // Start initialization
  initializationPromise = performCSG2TestInitialization(finalConfig);
  
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
 * Perform the actual CSG2 initialization for test environments
 */
async function performCSG2TestInitialization(config: Required<CSG2TestInitConfig>): Promise<CSG2TestInitResult> {
  const environment = isNodeEnvironment() ? 'Node.js' : 'Browser';
  if (config.enableLogging) {
    console.log(`[INIT] Starting CSG2 test initialization for ${environment} environment`);
  }

  // Strategy 1: Use mock in test environments (default)
  if (config.forceMockInTests && isTestEnvironment()) {
    if (config.enableLogging) {
      console.log('[DEBUG] Test environment detected, using mock CSG2');
    }
    return initializeMockCSG2ForTests(config);
  }

  // Strategy 2: Try manifold-3d direct initialization for Node.js
  if (isNodeEnvironment()) {
    if (config.enableLogging) {
      console.log('[DEBUG] Node.js test environment detected, trying manifold-3d direct initialization');
    }

    const manifoldResult = await tryManifoldDirectInit(config);
    if (manifoldResult.success) {
      return manifoldResult;
    }

    if (config.enableLogging) {
      console.log('[WARN] Manifold direct initialization failed, falling back to mock');
    }
  }

  // Strategy 3: Try standard Babylon.js initialization
  if (config.enableLogging) {
    console.log('[DEBUG] Trying standard BABYLON.InitializeCSG2Async() for tests');
  }

  const standardResult = await tryStandardInitForTests(config);
  if (standardResult.success) {
    return standardResult;
  }

  // Strategy 4: Fallback to mock
  if (config.enableLogging) {
    console.log('[WARN] Standard initialization failed, falling back to mock');
  }

  return initializeMockCSG2ForTests(config);
}

/**
 * Try to initialize CSG2 using manifold-3d package directly (Node.js only)
 */
async function tryManifoldDirectInit(config: Required<CSG2TestInitConfig>): Promise<CSG2TestInitResult> {
  try {
    // Dynamic import to avoid issues if manifold-3d is not available
    const Module = await import('manifold-3d');
    
    if (config.enableLogging) {
      console.log('[DEBUG] manifold-3d package loaded for tests, initializing...');
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
      console.log('[DEBUG] ✅ CSG2 initialized successfully using manifold-3d direct method for tests');
    }
    
    return {
      success: true,
      message: 'CSG2 initialized using manifold-3d direct method for tests',
      method: 'manifold-direct'
    };
  } catch (error) {
    if (config.enableLogging) {
      console.log('[ERROR] Manifold direct initialization failed in tests:', error);
    }
    
    return {
      success: false,
      error: `Manifold direct initialization failed: ${error}`,
      method: 'failed'
    };
  }
}

/**
 * Try to initialize CSG2 using standard Babylon.js method for tests
 */
async function tryStandardInitForTests(config: Required<CSG2TestInitConfig>): Promise<CSG2TestInitResult> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('CSG2 test initialization timeout')), config.timeout);
    });

    await Promise.race([
      BABYLON.InitializeCSG2Async(),
      timeoutPromise
    ]);

    if (config.enableLogging) {
      console.log('[DEBUG] ✅ CSG2 initialized successfully using standard method for tests');
    }

    return {
      success: true,
      message: 'CSG2 initialized using standard Babylon.js method for tests',
      method: 'babylon-standard'
    };
  } catch (error) {
    if (config.enableLogging) {
      console.log('[ERROR] Standard CSG2 initialization failed in tests:', error);
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
async function initializeMockCSG2ForTests(config: Required<CSG2TestInitConfig>): Promise<CSG2TestInitResult> {
  try {
    if (config.enableLogging) {
      console.log('[DEBUG] Initializing mock CSG2 for tests...');
    }

    // Try to import and setup mock from vitest-setup if available
    try {
      const { initializeCSG2ForTests } = await import('../../../../../vitest-setup');
      await initializeCSG2ForTests();

      if (config.enableLogging) {
        console.log('[DEBUG] ✅ Mock CSG2 initialized successfully from vitest-setup');
      }

      return {
        success: true,
        message: 'Mock CSG2 initialized for testing from vitest-setup',
        method: 'mock-vitest'
      };
    } catch (_importError) {
      // If vitest-setup import fails, create a simple mock
      if (config.enableLogging) {
        console.log('[DEBUG] vitest-setup not available, creating simple mock CSG2 for tests');
      }

      // Create a simple mock CSG2 for test environments
      const globalWithMock = globalThis as typeof globalThis & {
        __MOCK_CSG2__?: typeof BABYLON.CSG2;
        __MOCK_IS_CSG2_READY__?: () => boolean;
      };

      if (!globalWithMock.__MOCK_CSG2__) {
        // Create a minimal mock CSG2 implementation
        globalWithMock.__MOCK_CSG2__ = {
          FromMesh: (mesh: BABYLON.Mesh) => ({
            add: (_other: unknown) => ({ toMesh: () => mesh, dispose: () => {} }),
            subtract: (_other: unknown) => ({ toMesh: () => mesh, dispose: () => {} }),
            intersect: (_other: unknown) => ({ toMesh: () => mesh, dispose: () => {} }),
            toMesh: () => mesh,
            dispose: () => {}
          }),
          dispose: () => {}
        } as unknown as typeof BABYLON.CSG2;

        globalWithMock.__MOCK_IS_CSG2_READY__ = () => true;
      }

      if (config.enableLogging) {
        console.log('[DEBUG] ✅ Simple mock CSG2 initialized successfully for tests');
      }

      return {
        success: true,
        message: 'Simple mock CSG2 initialized for test fallback',
        method: 'mock-simple'
      };
    }
  } catch (error) {
    if (config.enableLogging) {
      console.log('[ERROR] Mock CSG2 initialization failed in tests:', error);
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
  // Check if we're in a browser environment first
  if (typeof process === 'undefined') {
    // In browser, check for test-specific globals
    return typeof global !== 'undefined' &&
           (global as typeof global & { __VITEST__?: boolean }).__VITEST__ === true ||
           typeof window !== 'undefined' &&
           (window as typeof window & { __VITEST__?: boolean }).__VITEST__ === true;
  }

  // In Node.js environment, check process.env
  return process.env.NODE_ENV === 'test' ||
         process.env.VITEST === 'true' ||
         typeof global !== 'undefined' &&
         (global as typeof global & { __VITEST__?: boolean }).__VITEST__ === true;
}

/**
 * Check if CSG2 is ready for use in tests
 */
export function isCSG2ReadyForTests(): boolean {
  try {
    // In test environment, check if mock is available
    if (isTestEnvironment() && (globalThis as typeof globalThis & { __MOCK_IS_CSG2_READY__?: () => boolean }).__MOCK_IS_CSG2_READY__) {
      return isCSG2Initialized && ((globalThis as typeof globalThis & { __MOCK_IS_CSG2_READY__?: () => boolean }).__MOCK_IS_CSG2_READY__?.() ?? false);
    }

    // In normal environment, check Babylon.js CSG2
    return isCSG2Initialized && (BABYLON.IsCSG2Ready?.() ?? false);
  } catch (error) {
    console.warn('[WARN] Error checking CSG2 ready state in tests:', error);
    return false;
  }
}

/**
 * Reset CSG2 initialization state (for testing)
 */
export function resetCSG2StateForTests(): void {
  isCSG2Initialized = false;
  initializationPromise = null;
}

/**
 * Factory function for easy CSG2 test initialization
 */
export const createCSG2TestInitializer = (config: CSG2TestInitConfig = {}) => ({
  initialize: () => initializeCSG2ForTests(config),
  isReady: isCSG2ReadyForTests,
  reset: resetCSG2StateForTests
});
