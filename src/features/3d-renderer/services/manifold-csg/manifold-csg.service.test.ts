import init from 'manifold-3d';
import { describe, expect, it } from 'vitest';

describe('Manifold CSG Service', () => {
  it('should import and instantiate the Manifold module', async () => {
    // The manifold-3d library is a WASM module that needs to be initialized asynchronously.
    const Module = await init();

    expect(Module.Manifold).toBeDefined();

    // Create a simple cube to instantiate a Manifold object.
    const manifold = Module._Cube({ x: 1, y: 1, z: 1 }, false);
    expect(manifold).toBeInstanceOf(Module.Manifold);
  });
});
