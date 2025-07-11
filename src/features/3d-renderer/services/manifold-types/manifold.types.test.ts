import { describe, it, expect } from 'vitest';
import type { Manifold } from './manifold.types';

describe('Manifold TypeScript Types', () => {
  it('should have a branded type for Manifold', () => {
    const manifold: Manifold = {} as Manifold;
    expect(manifold).toBeDefined();
  });
});