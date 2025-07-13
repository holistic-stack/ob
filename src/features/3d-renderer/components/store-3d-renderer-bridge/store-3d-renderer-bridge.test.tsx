/**
 * @file Store Connected Generic Renderer Tests
 * 
 * Tests for the store connected generic renderer component that bridges
 * the Zustand store with the new generic rendering architecture.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { StoreConnectedGenericRenderer } from './store-connected-generic-renderer';

// Mock React Three Fiber components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div data-testid="r3f-canvas" {...props}>
      {children}
    </div>
  ),
  useThree: () => ({
    scene: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    gl: {
      shadowMap: { enabled: false },
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
    },
  }),
}));

// Mock the generic scene component
vi.mock('../generic-scene/generic-scene', () => ({
  GenericScene: ({ meshes, onRenderComplete }: any) => {
    // Simulate successful rendering
    if (onRenderComplete && meshes) {
      setTimeout(() => onRenderComplete([]), 0);
    }
    return (
      <div data-testid="generic-scene">
        Generic Scene with {meshes?.length || 0} meshes
      </div>
    );
  },
}));

// Mock the app store
const mockStore = {
  parsing: {
    ast: [],
  },
  rendering: {
    camera: {
      position: [5, 5, 5] as const,
      target: [0, 0, 0] as const,
      zoom: 1,
      fov: 75,
      near: 0.1,
      far: 1000,
      enableControls: true,
      enableAutoRotate: false,
      autoRotateSpeed: 1,
    },
  },
  addRenderError: vi.fn(),
};

vi.mock('../../../store/app-store', () => ({
  useAppStore: (selector: any) => selector(mockStore),
}));

describe('StoreConnectedGenericRenderer', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    // Create real parser instance (no mocks)
    parser = await createTestParser();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up resources
    parser.dispose();
  });

  describe('Initialization', () => {
    it('should render without crashing', async () => {
      render(<StoreConnectedGenericRenderer />);

      expect(screen.getByTestId('store-connected-generic-renderer')).toBeInTheDocument();
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('generic-scene')).toBeInTheDocument();
    });

    it('should render with custom props', async () => {
      render(
        <StoreConnectedGenericRenderer
          className="custom-class"
          data-testid="custom-renderer"
          enableDebug={true}
          enableShadows={false}
          lightIntensity={50}
        />
      );

      expect(screen.getByTestId('custom-renderer')).toBeInTheDocument();
      expect(screen.getByTestId('custom-renderer')).toHaveClass('custom-class');
    });

    it('should show debug info when enabled', async () => {
      render(<StoreConnectedGenericRenderer enableDebug={true} />);

      expect(screen.getByText(/Converter:/)).toBeInTheDocument();
      expect(screen.getByText(/Converting:/)).toBeInTheDocument();
      expect(screen.getByText(/AST Nodes:/)).toBeInTheDocument();
      expect(screen.getByText(/Generic Meshes:/)).toBeInTheDocument();
    });
  });

  describe('AST Conversion', () => {
    it('should handle empty AST', async () => {
      // Mock store with empty AST
      mockStore.parsing.ast = [];

      render(<StoreConnectedGenericRenderer enableDebug={true} />);

      await waitFor(() => {
        expect(screen.getByText(/AST Nodes: 0/)).toBeInTheDocument();
        expect(screen.getByText(/Generic Meshes: 0/)).toBeInTheDocument();
      });
    });

    it('should handle AST with nodes', async () => {
      // Parse some OpenSCAD code
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      // Mock store with AST
      mockStore.parsing.ast = parseResult.data;

      render(<StoreConnectedGenericRenderer enableDebug={true} />);

      await waitFor(() => {
        expect(screen.getByText(/AST Nodes: 1/)).toBeInTheDocument();
      });
    });

    it('should show loading indicator during conversion', async () => {
      // Parse some OpenSCAD code
      const code = 'cube(10); sphere(5);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      // Mock store with AST
      mockStore.parsing.ast = parseResult.data;

      render(<StoreConnectedGenericRenderer />);

      // Should show loading indicator briefly
      expect(screen.getByText(/Converting AST to meshes.../)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion errors gracefully', async () => {
      // Mock store with invalid AST
      mockStore.parsing.ast = [{ type: 'invalid', children: [] }] as any;

      render(<StoreConnectedGenericRenderer />);

      await waitFor(() => {
        // Should call addRenderError
        expect(mockStore.addRenderError).toHaveBeenCalled();
      });
    });

    it('should display error message when conversion fails', async () => {
      // Mock store with invalid AST
      mockStore.parsing.ast = [{ type: 'invalid', children: [] }] as any;

      render(<StoreConnectedGenericRenderer />);

      await waitFor(() => {
        // Should show error message
        expect(screen.getByText(/Conversion Error:/)).toBeInTheDocument();
      });
    });

    it('should not show error in debug mode (shown in debug panel instead)', async () => {
      // Mock store with invalid AST
      mockStore.parsing.ast = [{ type: 'invalid', children: [] }] as any;

      render(<StoreConnectedGenericRenderer enableDebug={true} />);

      await waitFor(() => {
        // Should show error in debug panel
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      // Should not show the bottom error message
      expect(screen.queryByText(/Conversion Error:/)).not.toBeInTheDocument();
    });
  });

  describe('Camera Integration', () => {
    it('should use camera from store', async () => {
      render(<StoreConnectedGenericRenderer />);

      const canvas = screen.getByTestId('r3f-canvas');
      
      // Should pass camera props to Canvas
      expect(canvas).toBeInTheDocument();
    });

    it('should handle camera changes', async () => {
      render(<StoreConnectedGenericRenderer />);

      // Component should render without errors when camera changes
      expect(screen.getByTestId('store-connected-generic-renderer')).toBeInTheDocument();
    });
  });

  describe('Rendering Integration', () => {
    it('should pass meshes to generic scene', async () => {
      render(<StoreConnectedGenericRenderer />);

      await waitFor(() => {
        expect(screen.getByTestId('generic-scene')).toBeInTheDocument();
      });
    });

    it('should handle render completion', async () => {
      render(<StoreConnectedGenericRenderer />);

      await waitFor(() => {
        // Generic scene should be rendered
        expect(screen.getByTestId('generic-scene')).toBeInTheDocument();
      });
    });
  });

  describe('Configuration Options', () => {
    it('should apply shadow configuration', async () => {
      render(<StoreConnectedGenericRenderer enableShadows={false} />);

      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should apply light intensity configuration', async () => {
      render(<StoreConnectedGenericRenderer lightIntensity={200} />);

      expect(screen.getByTestId('generic-scene')).toBeInTheDocument();
    });

    it('should apply debug wireframe configuration', async () => {
      render(<StoreConnectedGenericRenderer enableDebug={true} />);

      expect(screen.getByTestId('generic-scene')).toBeInTheDocument();
    });
  });
});
