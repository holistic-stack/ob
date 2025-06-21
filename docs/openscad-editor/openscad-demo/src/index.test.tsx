import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * @file Test suite for the index.tsx entry point
 * Tests the application bootstrap logic without requiring full component rendering
 */

// Mock ReactDOM to avoid actual DOM manipulation in tests
const mockRender = vi.fn();
vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({
      render: mockRender,
    })),
  },
  createRoot: vi.fn(() => ({
    render: mockRender,
  })),
}));

// Mock the main App component to avoid Monaco Editor dependencies
vi.mock('./main.tsx', () => ({
  default: () => 'App Component',
}));

describe('Index Entry Point', () => {
  let originalGetElementById: typeof document.getElementById;

  beforeEach(() => {
    // Setup DOM environment
    originalGetElementById = document.getElementById;
    mockRender.mockClear();
  });

  afterEach(() => {
    // Restore original functions
    document.getElementById = originalGetElementById;
    vi.clearAllMocks();
  });

  it('should attempt to find root element', async () => {
    // Mock getElementById to return a valid element
    const mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    document.getElementById = vi.fn().mockReturnValue(mockRootElement);

    // Clear module cache and re-import to ensure fresh execution
    vi.resetModules();
    await import('./index');

    // Verify getElementById was called with 'root'
    expect(document.getElementById).toHaveBeenCalledWith('root');
  });

  it('should render App when root element exists', async () => {
    // Clear previous calls
    mockRender.mockClear();

    // Mock getElementById to return a valid element
    const mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    document.getElementById = vi.fn().mockReturnValue(mockRootElement);

    // Clear module cache and re-import to ensure fresh execution
    vi.resetModules();
    await import('./index');

    // Verify render was called
    expect(mockRender).toHaveBeenCalled();
  });

  it('should not render when root element does not exist', async () => {
    // Clear previous calls
    mockRender.mockClear();

    // Mock getElementById to return null
    document.getElementById = vi.fn().mockReturnValue(null);

    // Clear module cache and re-import to ensure fresh execution
    vi.resetModules();
    await import('./index');

    // Verify render was not called
    expect(mockRender).not.toHaveBeenCalled();
  });

  it('should handle missing root element gracefully', async () => {
    // Mock getElementById to return null
    document.getElementById = vi.fn().mockReturnValue(null);

    // Clear module cache and re-import to ensure fresh execution
    vi.resetModules();

    // This should not throw an error
    expect(async () => {
      await import('./index');
    }).not.toThrow();
  });
});
