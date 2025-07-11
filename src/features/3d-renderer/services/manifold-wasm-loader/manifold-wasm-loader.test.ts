import { describe, it, expect } from 'vitest';
import { ManifoldWasmLoader } from './manifold-wasm-loader';

describe('Manifold WASM Loader', () => {
  it('should lazy load the Manifold WASM module', async () => {
    const loader = new ManifoldWasmLoader();
    const Module = await loader.load();
    expect(Module.Manifold).toBeDefined();
  });
});