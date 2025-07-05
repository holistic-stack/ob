/**
 * Minimal Three.js Renderer Hook Test
 *
 * Simplified test to isolate memory issues
 */

import { describe, expect, it, vi } from 'vitest';

// Simple mock for Three.js
vi.mock('three', () => ({
  Scene: vi.fn(() => ({ add: vi.fn(), remove: vi.fn() })),
  PerspectiveCamera: vi.fn(() => ({ position: { set: vi.fn() } })),
  WebGLRenderer: vi.fn(() => ({ render: vi.fn(), dispose: vi.fn() })),
}));

// Simple mock for store
vi.mock('../../store/index.js', () => ({
  useAppStore: vi.fn(() => []),
  selectParsingAST: vi.fn(),
  selectRenderingCamera: vi.fn(),
  selectRenderingState: vi.fn(),
  selectPerformanceMetrics: vi.fn(),
}));

// Simple mock for logger
vi.mock('../../../shared/services/logger.service.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Simple mock for primitive renderer
vi.mock('../services/primitive-renderer.js', () => ({
  renderASTNode: vi.fn(() => Promise.resolve({ success: true, data: {} })),
}));

describe('useThreeRenderer Minimal Test', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should import hook without crashing', async () => {
    const { useThreeRenderer } = await import('./use-three-renderer');
    expect(useThreeRenderer).toBeDefined();
  });
});
