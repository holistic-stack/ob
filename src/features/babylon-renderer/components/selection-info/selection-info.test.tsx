/**
 * @file Selection Info Component Tests
 *
 * Tests for the SelectionInfo component following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NullEngine, Scene, CreateBox, CreateSphere, AbstractMesh } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectionInfo } from './selection-info';
import { SelectionService } from '../../services/selection/selection.service';

// Mock the selection hooks to control the test data
vi.mock('../../services/selection/use-selection.hook', () => ({
  useSelection: vi.fn(),
  useSelectionStats: vi.fn(),
}));

import { useSelection, useSelectionStats } from '../../services/selection/use-selection.hook';

const mockUseSelection = useSelection as any;
const mockUseSelectionStats = useSelectionStats as any;

describe('SelectionInfo', () => {
  let engine: NullEngine;
  let scene: Scene;
  let testMesh1: AbstractMesh;
  let testMesh2: AbstractMesh;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    
    // Create test meshes
    testMesh1 = CreateBox('testBox1', { size: 1 }, scene);
    testMesh1.metadata = { type: 'box', material: 'metal' };
    
    testMesh2 = CreateSphere('testSphere1', { diameter: 1 }, scene);
    testMesh2.metadata = { type: 'sphere', material: 'plastic' };

    // Setup default mock returns
    mockUseSelection.mockReturnValue({
      selectedMeshes: [],
      selectedMeshInfos: [],
      hoveredMesh: null,
      clearSelection: vi.fn(),
    });

    mockUseSelectionStats.mockReturnValue({
      selectedCount: 0,
      hasSelection: false,
      isMultiSelection: false,
      lastSelectionTime: null,
      selectionMode: 'single',
    });
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with no scene', () => {
      render(<SelectionInfo scene={null} />);
      
      expect(screen.getByText('No scene available')).toBeInTheDocument();
    });

    it('should render with no selection', () => {
      render(<SelectionInfo scene={scene} />);
      
      expect(screen.getByText('No objects selected')).toBeInTheDocument();
      expect(screen.getByText('Click on a 3D object to select it')).toBeInTheDocument();
    });

    it('should render selection statistics', () => {
      mockUseSelectionStats.mockReturnValue({
        selectedCount: 0,
        hasSelection: false,
        isMultiSelection: false,
        lastSelectionTime: null,
        selectionMode: 'single',
      });

      render(<SelectionInfo scene={scene} showStatistics={true} />);
      
      expect(screen.getByText('Selection')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Count
      expect(screen.getByText('Single')).toBeInTheDocument(); // Mode
    });
  });

  describe('Selection Display', () => {
    it('should display selected mesh information', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: testMesh1.metadata,
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 1,
        hasSelection: true,
        isMultiSelection: false,
        lastSelectionTime: selectionTime,
        selectionMode: 'single',
      });

      render(<SelectionInfo scene={scene} />);
      
      expect(screen.getByText('testBox1')).toBeInTheDocument();
      expect(screen.getByText('Mesh')).toBeInTheDocument(); // Type
      expect(screen.getByText('Yes')).toBeInTheDocument(); // Visible
    });

    it('should display multiple selected meshes', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1, testMesh2],
        selectedMeshInfos: [
          { mesh: testMesh1, selectionTime, metadata: testMesh1.metadata },
          { mesh: testMesh2, selectionTime, metadata: testMesh2.metadata },
        ],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 2,
        hasSelection: true,
        isMultiSelection: true,
        lastSelectionTime: selectionTime,
        selectionMode: 'multi',
      });

      render(<SelectionInfo scene={scene} />);
      
      expect(screen.getByText('testBox1')).toBeInTheDocument();
      expect(screen.getByText('testSphere1')).toBeInTheDocument();
      expect(screen.getByTestId('selected-mesh-0')).toBeInTheDocument();
      expect(screen.getByTestId('selected-mesh-1')).toBeInTheDocument();
    });

    it('should display hovered mesh', () => {
      mockUseSelection.mockReturnValue({
        selectedMeshes: [],
        selectedMeshInfos: [],
        hoveredMesh: testMesh1,
        clearSelection: vi.fn(),
      });

      render(<SelectionInfo scene={scene} />);
      
      expect(screen.getByText('Hovering')).toBeInTheDocument();
      expect(screen.getByText('testBox1')).toBeInTheDocument();
      expect(screen.getByText('Type: Mesh')).toBeInTheDocument();
    });
  });

  describe('Mesh Properties', () => {
    it('should display basic mesh properties', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: testMesh1.metadata,
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 1,
        hasSelection: true,
        isMultiSelection: false,
        lastSelectionTime: selectionTime,
        selectionMode: 'single',
      });

      render(<SelectionInfo scene={scene} />);
      
      // Check for position, rotation, scaling
      expect(screen.getByText('Position:')).toBeInTheDocument();
      expect(screen.getByText('Rotation:')).toBeInTheDocument();
      expect(screen.getByText('Scaling:')).toBeInTheDocument();
      
      // Check for vector format (x, y, z)
      expect(screen.getByText('(0.00, 0.00, 0.00)')).toBeInTheDocument();
    });

    it('should display bounding box information when enabled', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: testMesh1.metadata,
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 1,
        hasSelection: true,
        isMultiSelection: false,
        lastSelectionTime: selectionTime,
        selectionMode: 'single',
      });

      render(<SelectionInfo scene={scene} showBoundingBox={true} />);
      
      expect(screen.getByText('Bounding Box')).toBeInTheDocument();
      expect(screen.getByText('Min:')).toBeInTheDocument();
      expect(screen.getByText('Max:')).toBeInTheDocument();
      expect(screen.getByText('Size:')).toBeInTheDocument();
      expect(screen.getByText('Center:')).toBeInTheDocument();
      expect(screen.getByText('Volume:')).toBeInTheDocument();
    });

    it('should hide bounding box when disabled', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: testMesh1.metadata,
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      render(<SelectionInfo scene={scene} showBoundingBox={false} />);
      
      expect(screen.queryByText('Bounding Box')).not.toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display mesh metadata when enabled', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: { type: 'box', material: 'metal', count: 42 },
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      render(<SelectionInfo scene={scene} showMetadata={true} />);
      
      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText('type:')).toBeInTheDocument();
      expect(screen.getByText('box')).toBeInTheDocument();
      expect(screen.getByText('material:')).toBeInTheDocument();
      expect(screen.getByText('metal')).toBeInTheDocument();
      expect(screen.getByText('count:')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should hide metadata when disabled', () => {
      const selectionTime = new Date();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: { type: 'box' },
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      render(<SelectionInfo scene={scene} showMetadata={false} />);
      
      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('should handle complex metadata objects', () => {
      const selectionTime = new Date();
      const complexMetadata = {
        simple: 'value',
        nested: { x: 1, y: 2 },
        array: [1, 2, 3],
      };
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime,
          metadata: complexMetadata,
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      render(<SelectionInfo scene={scene} showMetadata={true} />);
      
      expect(screen.getByText('simple:')).toBeInTheDocument();
      expect(screen.getByText('value')).toBeInTheDocument();
      expect(screen.getByText('nested:')).toBeInTheDocument();
      expect(screen.getByText('array:')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call clearSelection when clear button is clicked', () => {
      const mockClearSelection = vi.fn();
      const mockOnClearSelection = vi.fn();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{ mesh: testMesh1, selectionTime: new Date(), metadata: {} }],
        hoveredMesh: null,
        clearSelection: mockClearSelection,
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 1,
        hasSelection: true,
        isMultiSelection: false,
        lastSelectionTime: new Date(),
        selectionMode: 'single',
      });

      render(
        <SelectionInfo 
          scene={scene} 
          onClearSelection={mockOnClearSelection}
        />
      );
      
      const clearButton = screen.getByTestId('clear-selection-button');
      fireEvent.click(clearButton);
      
      expect(mockClearSelection).toHaveBeenCalledTimes(1);
      expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectMesh when focus button is clicked', () => {
      const mockOnSelectMesh = vi.fn();
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{ mesh: testMesh1, selectionTime: new Date(), metadata: {} }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 1,
        hasSelection: true,
        isMultiSelection: false,
        lastSelectionTime: new Date(),
        selectionMode: 'single',
      });

      render(
        <SelectionInfo 
          scene={scene} 
          onSelectMesh={mockOnSelectMesh}
        />
      );
      
      const focusButton = screen.getByTestId('focus-mesh-0');
      fireEvent.click(focusButton);
      
      expect(mockOnSelectMesh).toHaveBeenCalledTimes(1);
      expect(mockOnSelectMesh).toHaveBeenCalledWith(testMesh1);
    });
  });

  describe('Statistics Display', () => {
    it('should show selection statistics when enabled', () => {
      mockUseSelectionStats.mockReturnValue({
        selectedCount: 2,
        hasSelection: true,
        isMultiSelection: true,
        lastSelectionTime: new Date('2023-01-01T12:00:00'),
        selectionMode: 'multi',
      });

      render(<SelectionInfo scene={scene} showStatistics={true} />);
      
      expect(screen.getByText('Selection')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Count
      expect(screen.getByText('Multi')).toBeInTheDocument(); // Mode
      expect(screen.getByText(/Last:/)).toBeInTheDocument(); // Last selection time
    });

    it('should hide statistics when disabled', () => {
      render(<SelectionInfo scene={scene} showStatistics={false} />);
      
      expect(screen.queryByText('Selection')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility and Props', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SelectionInfo 
          scene={scene} 
          className="custom-selection-info"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-selection-info');
    });

    it('should apply custom data-testid', () => {
      render(
        <SelectionInfo 
          scene={scene} 
          data-testid="custom-selection-info"
        />
      );
      
      expect(screen.getByTestId('custom-selection-info')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle mesh without name', () => {
      const meshWithoutName = CreateBox('', { size: 1 }, scene);
      meshWithoutName.name = '';
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [meshWithoutName],
        selectedMeshInfos: [{
          mesh: meshWithoutName,
          selectionTime: new Date(),
          metadata: {},
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      mockUseSelectionStats.mockReturnValue({
        selectedCount: 1,
        hasSelection: true,
        isMultiSelection: false,
        lastSelectionTime: new Date(),
        selectionMode: 'single',
      });

      render(<SelectionInfo scene={scene} />);
      
      // Should display the mesh ID when name is empty
      expect(screen.getByText(meshWithoutName.id)).toBeInTheDocument();
    });

    it('should handle mesh without metadata', () => {
      mockUseSelection.mockReturnValue({
        selectedMeshes: [testMesh1],
        selectedMeshInfos: [{
          mesh: testMesh1,
          selectionTime: new Date(),
          metadata: undefined,
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      render(<SelectionInfo scene={scene} showMetadata={true} />);
      
      // Should not show metadata section when no metadata
      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('should handle bounding box calculation errors', () => {
      // Create a mesh that might cause bounding box errors
      const problematicMesh = CreateBox('problematic', { size: 1 }, scene);
      
      mockUseSelection.mockReturnValue({
        selectedMeshes: [problematicMesh],
        selectedMeshInfos: [{
          mesh: problematicMesh,
          selectionTime: new Date(),
          metadata: {},
        }],
        hoveredMesh: null,
        clearSelection: vi.fn(),
      });

      // Should not throw errors even if bounding box calculation fails
      expect(() => {
        render(<SelectionInfo scene={scene} showBoundingBox={true} />);
      }).not.toThrow();
    });
  });
});
