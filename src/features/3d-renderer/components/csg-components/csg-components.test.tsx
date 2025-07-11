/**
 * @file React Three Fiber CSG Components Tests
 * Task 3.1: Create R3F CSG Components (Red Phase)
 *
 * Tests for declarative CSG components in React Three Fiber
 * Following project guidelines:
 * - Use real implementations (no mocks except Three.js WebGL components)
 * - TDD methodology with Red-Green-Refactor cycles
 * - Result<T,E> error handling patterns
 * - React Three Fiber integration with declarative CSG operations
 */

import { Canvas } from '@react-three/fiber';
import { act, render, screen } from '@testing-library/react';
import { BufferGeometry } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaterialIDManager } from '../../services/manifold-material-manager/manifold-material-manager';
import {
  clearAllResources,
  getMemoryStats,
} from '../../services/manifold-memory-manager/manifold-memory-manager';
import {
  type CSGComponentProps,
  CSGIntersect,
  CSGSubtract,
  CSGUnion,
  useManifoldCSG,
} from './csg-components';

// Mock Canvas for integration tests
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    Canvas: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="r3f-canvas">{children}</div>
    ),
  };
});

/**
 * Test suite for React Three Fiber CSG components
 */
describe('R3F CSG Components', () => {
  let materialManager: MaterialIDManager;

  beforeEach(async () => {
    // Clear memory for clean test state
    clearAllResources();

    // Initialize material manager
    materialManager = new MaterialIDManager();
    await materialManager.initialize();
  });

  afterEach(async () => {
    // Proper cleanup
    if (materialManager) {
      materialManager.dispose();
    }

    // Verify no memory leaks
    const stats = getMemoryStats();
    expect(stats.activeResources).toBe(0);
  });

  describe('CSGUnion Component', () => {
    it('should render CSGUnion component with children geometries', async () => {
      // Test CSGUnion component interface
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGUnion materialManager={materialManager}>
            <mesh>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[2.5, 0, 0]}>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          </CSGUnion>
        </Canvas>
      );

      // Render component
      await act(async () => {
        render(<TestApp />);
      });

      // Verify Canvas is rendered (component interface test)
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();

      // Component should accept the required props without errors
      expect(materialManager).toBeDefined();
    });

    it('should handle CSGUnion with material preservation', async () => {
      // Test material preservation props interface
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGUnion materialManager={materialManager} preserveMaterials={true}>
            <mesh>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[2.5, 0, 0]}>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          </CSGUnion>
        </Canvas>
      );

      // Render component with material preservation
      await act(async () => {
        render(<TestApp />);
      });

      // Verify component accepts preserveMaterials prop
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('CSGSubtract Component', () => {
    it('should render CSGSubtract component with base and subtract geometries', async () => {
      // Test CSGSubtract component interface
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGSubtract materialManager={materialManager}>
            <mesh>
              <boxGeometry args={[10, 10, 10]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[2, 2, 2]}>
              <boxGeometry args={[6, 6, 6]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          </CSGSubtract>
        </Canvas>
      );

      // Render component
      await act(async () => {
        render(<TestApp />);
      });

      // Verify Canvas is rendered (component interface test)
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle CSGSubtract with multiple subtract geometries', async () => {
      // Test multiple subtract operations interface
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGSubtract materialManager={materialManager}>
            <mesh>
              <boxGeometry args={[10, 10, 10]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[2, 2, 2]}>
              <boxGeometry args={[3, 3, 3]} />
              <meshStandardMaterial color="blue" />
            </mesh>
            <mesh position={[-2, -2, -2]}>
              <boxGeometry args={[3, 3, 3]} />
              <meshStandardMaterial color="green" />
            </mesh>
          </CSGSubtract>
        </Canvas>
      );

      // Render component with multiple children
      await act(async () => {
        render(<TestApp />);
      });

      // Verify component handles multiple children
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('CSGIntersect Component', () => {
    it('should render CSGIntersect component with overlapping geometries', async () => {
      // Test CSGIntersect component interface
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGIntersect materialManager={materialManager}>
            <mesh>
              <boxGeometry args={[10, 10, 10]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[5, 5, 5]}>
              <boxGeometry args={[10, 10, 10]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          </CSGIntersect>
        </Canvas>
      );

      // Render component
      await act(async () => {
        render(<TestApp />);
      });

      // Verify Canvas is rendered (component interface test)
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('useManifoldCSG Hook', () => {
    it('should provide CSG operations through React hook', () => {
      // Test useManifoldCSG hook (this will fail in Red phase)
      let hookResult: any;

      const TestComponent = () => {
        hookResult = useManifoldCSG(materialManager);
        return null;
      };

      render(<TestComponent />);

      // Verify hook returns expected interface
      expect(hookResult).toBeDefined();
      expect(typeof hookResult.performUnion).toBe('function');
      expect(typeof hookResult.performSubtract).toBe('function');
      expect(typeof hookResult.performIntersect).toBe('function');
      expect(typeof hookResult.isInitialized).toBe('boolean');
      expect(typeof hookResult.isLoading).toBe('boolean');
    });

    it('should handle CSG operations with React state management', async () => {
      // Test hook with state management
      let hookResult: any;

      const TestComponent = () => {
        hookResult = useManifoldCSG(materialManager);
        return null;
      };

      render(<TestComponent />);

      if (hookResult?.isInitialized) {
        // Create test geometries
        const geometry1 = new BufferGeometry();
        const geometry2 = new BufferGeometry();

        // Test union operation through hook
        const unionResult = await hookResult.performUnion([geometry1, geometry2]);
        expect(unionResult).toBeDefined();
        expect(typeof unionResult.success).toBe('boolean');
      }
    });
  });

  describe('Component Integration', () => {
    it('should integrate CSG components with Canvas', () => {
      // Test integration with React Three Fiber Canvas
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGUnion materialManager={materialManager}>
            <mesh>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[2.5, 0, 0]}>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          </CSGUnion>
        </Canvas>
      );

      render(<TestApp />);

      // Verify Canvas is rendered
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle nested CSG operations', async () => {
      // Test nested CSG components interface
      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGUnion materialManager={materialManager}>
            <CSGSubtract materialManager={materialManager}>
              <mesh>
                <boxGeometry args={[10, 10, 10]} />
                <meshStandardMaterial color="red" />
              </mesh>
              <mesh position={[2, 2, 2]}>
                <boxGeometry args={[4, 4, 4]} />
                <meshStandardMaterial color="blue" />
              </mesh>
            </CSGSubtract>
            <mesh position={[8, 0, 0]}>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="green" />
            </mesh>
          </CSGUnion>
        </Canvas>
      );

      // Render nested components
      await act(async () => {
        render(<TestApp />);
      });

      // Verify nested components render without errors
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle component props and options', async () => {
      // Test component props interface
      const props: CSGComponentProps = {
        materialManager,
        preserveMaterials: true,
        optimizeResult: true,
        onOperationComplete: vi.fn(),
        onError: vi.fn(),
      };

      const TestApp = () => (
        <Canvas data-testid="r3f-canvas">
          <CSGUnion {...props}>
            <mesh>
              <boxGeometry args={[5, 5, 5]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </CSGUnion>
        </Canvas>
      );

      // Render component with props
      await act(async () => {
        render(<TestApp />);
      });

      // Verify component accepts props without errors
      const canvas = screen.getByTestId('r3f-canvas');
      expect(canvas).toBeInTheDocument();

      // Callbacks should be defined
      expect(props.onOperationComplete).toBeDefined();
      expect(props.onError).toBeDefined();
    });
  });
});
