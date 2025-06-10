import '@testing-library/jest-dom';
import * as BABYLON from '@babylonjs/core';

/**
 * Global test setup for Babylon.js and CSG2
 * Initializes CSG2 once for all tests to avoid repeated initialization
 */

// Global CSG2 initialization flag
let isCSG2GloballyInitialized = false;

/**
 * Initialize CSG2 globally for all tests
 * This prevents the need to initialize CSG2 in every test file
 * Uses a mock implementation in test environment to avoid WASM loading issues
 */
export async function initializeCSG2ForTests(): Promise<void> {
  if (isCSG2GloballyInitialized) {
    console.log('[DEBUG] CSG2 already initialized globally');
    return;
  }

  console.log('[INIT] Initializing CSG2 globally for tests...');
  try {
    // Always use mocks in test environment to avoid WASM issues
    console.log('[DEBUG] Setting up mock CSG2 and parser for test environment');
    setupMockParser();
    setupMockCSG2();
    isCSG2GloballyInitialized = true;
    console.log('[DEBUG] Mock CSG2 and parser initialized successfully for tests');
  } catch (error) {
    console.warn('[WARN] Failed to setup mocks, continuing without them:', error);
    isCSG2GloballyInitialized = true; // Mark as initialized anyway
  }
}

/**
 * Check if CSG2 is ready for use in tests
 */
export function isCSG2ReadyForTests(): boolean {
  return isCSG2GloballyInitialized && BABYLON.IsCSG2Ready();
}

/**
 * Create a test scene with NullEngine for headless testing
 */
export function createTestScene(): { engine: BABYLON.NullEngine; scene: BABYLON.Scene } {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  return { engine, scene };
}

/**
 * Dispose test scene and engine
 */
export function disposeTestScene(engine: BABYLON.NullEngine, scene: BABYLON.Scene): void {
  scene.dispose();
  engine.dispose();
}

/**
 * Mock OpenSCAD Parser for testing
 * Provides basic parsing functionality without WASM dependencies
 */
function setupMockParser(): void {
  // Store mock parser in global for access by ParserResourceManager
  (globalThis as any).__MOCK_OPENSCAD_PARSER__ = {
    parseAST: (code: string) => {
      // Simple mock parsing - return basic AST based on code content
      if (!code || !code.trim()) {
        return [];
      }

      // Mock translate parsing (check FIRST since it contains other primitives)
      if (code.includes('translate')) {
        return [{
          type: 'translate',
          v: [5, 10, 15],
          children: [{
            type: 'cube',
            size: [5, 5, 5],
            center: false,
            location: { start: { line: 2, column: 3 }, end: { line: 2, column: 15 } }
          }],
          location: { start: { line: 1, column: 1 }, end: { line: 3, column: 1 } }
        }];
      }

      // Mock cube parsing
      if (code.includes('cube')) {
        return [{
          type: 'cube',
          size: [10, 10, 10],
          center: false,
          location: { start: { line: 1, column: 1 }, end: { line: 1, column: 20 } }
        }];
      }

      // Mock sphere parsing
      if (code.includes('sphere')) {
        return [{
          type: 'sphere',
          radius: 5,
          location: { start: { line: 1, column: 1 }, end: { line: 1, column: 15 } }
        }];
      }

      // Mock cylinder parsing
      if (code.includes('cylinder')) {
        return [{
          type: 'cylinder',
          h: 10,
          r: 3,
          location: { start: { line: 1, column: 1 }, end: { line: 1, column: 20 } }
        }];
      }

      // Mock union parsing
      if (code.includes('union')) {
        return [{
          type: 'union',
          children: [
            {
              type: 'cube',
              size: [10, 10, 10],
              center: false,
              location: { start: { line: 2, column: 3 }, end: { line: 2, column: 20 } }
            },
            {
              type: 'sphere',
              radius: 5,
              location: { start: { line: 3, column: 3 }, end: { line: 3, column: 15 } }
            }
          ],
          location: { start: { line: 1, column: 1 }, end: { line: 4, column: 1 } }
        }];
      }

      // Mock difference parsing
      if (code.includes('difference')) {
        return [{
          type: 'difference',
          children: [
            {
              type: 'cube',
              size: [10, 10, 10],
              center: false,
              location: { start: { line: 2, column: 3 }, end: { line: 2, column: 20 } }
            },
            {
              type: 'sphere',
              radius: 3,
              location: { start: { line: 3, column: 3 }, end: { line: 3, column: 15 } }
            }
          ],
          location: { start: { line: 1, column: 1 }, end: { line: 4, column: 1 } }
        }];
      }

      // Mock intersection parsing
      if (code.includes('intersection')) {
        return [{
          type: 'intersection',
          children: [
            {
              type: 'cube',
              size: [10, 10, 10],
              center: false,
              location: { start: { line: 2, column: 3 }, end: { line: 2, column: 20 } }
            },
            {
              type: 'sphere',
              radius: 8,
              location: { start: { line: 3, column: 3 }, end: { line: 3, column: 15 } }
            }
          ],
          location: { start: { line: 1, column: 1 }, end: { line: 4, column: 1 } }
        }];
      }



      // Default: return empty AST for unknown code
      return [];
    },
    init: async () => {
      // Mock initialization - just resolve
      return Promise.resolve();
    },
    dispose: () => {
      // Mock disposal - no-op
    }
  };

  console.log('[DEBUG] Mock OpenSCAD parser setup complete');
}

/**
 * Mock CSG2 implementation for testing
 * Provides the same API as real CSG2 but with simplified behavior
 */
function setupMockCSG2(): void {
  // Mock CSG2 class
  class MockCSG2 {
    private mesh: BABYLON.Mesh;

    constructor(mesh: BABYLON.Mesh) {
      this.mesh = mesh;
    }

    static FromMesh(mesh: BABYLON.Mesh): MockCSG2 {
      return new MockCSG2(mesh);
    }

    add(other: MockCSG2): MockCSG2 {
      // For testing, just return a new mesh with combined name
      const newMesh = this.mesh.clone(`union_${this.mesh.name}_${other.mesh.name}`);
      return new MockCSG2(newMesh);
    }

    subtract(other: MockCSG2): MockCSG2 {
      // For testing, just return a new mesh with difference name
      const newMesh = this.mesh.clone(`difference_${this.mesh.name}_${other.mesh.name}`);
      return new MockCSG2(newMesh);
    }

    intersect(other: MockCSG2): MockCSG2 {
      // For testing, just return a new mesh with intersection name
      const newMesh = this.mesh.clone(`intersection_${this.mesh.name}_${other.mesh.name}`);
      return new MockCSG2(newMesh);
    }

    toMesh(name: string, scene: BABYLON.Scene): BABYLON.Mesh {
      const newMesh = this.mesh.clone(name);
      return newMesh;
    }

    dispose(): void {
      // Mock disposal
    }
  }

  // Try to mock global functions using Object.defineProperty
  try {
    Object.defineProperty(BABYLON, 'CSG2', {
      value: MockCSG2,
      writable: true,
      configurable: true
    });

    Object.defineProperty(BABYLON, 'InitializeCSG2Async', {
      value: async () => {
        console.log('[DEBUG] Mock InitializeCSG2Async called');
        return Promise.resolve();
      },
      writable: true,
      configurable: true
    });

    Object.defineProperty(BABYLON, 'IsCSG2Ready', {
      value: () => {
        console.log('[DEBUG] Mock IsCSG2Ready called');
        return true;
      },
      writable: true,
      configurable: true
    });

    console.log('[DEBUG] Mock CSG2 setup complete');
  } catch (error) {
    console.warn('[WARN] Could not setup mock CSG2:', error);
    // Store mock in global for fallback
    (globalThis as any).__MOCK_CSG2__ = MockCSG2;
    (globalThis as any).__MOCK_INIT_CSG2__ = async () => Promise.resolve();
    (globalThis as any).__MOCK_IS_CSG2_READY__ = () => true;
  }
}
