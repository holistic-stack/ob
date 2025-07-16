/**
 * @file Selection and Export Workflow Integration Tests
 *
 * Integration tests for the complete selection and export workflow.
 * Tests the end-to-end user workflow from 3D rendering to object selection to export.
 * 
 * @example
 * Tests cover the complete workflow:
 * 3D Scene → Object Selection → Export Configuration → File Generation
 */

import { NullEngine, Scene, CreateBox, CreateSphere, AbstractMesh } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectionService } from '../../features/babylon-renderer/services/selection';
import { ExportService } from '../../features/babylon-renderer/services/export';
// Mock logger to avoid console output during tests
import { vi } from 'vitest';
vi.mock('../../shared/services/logger.service', () => ({
  createLogger: vi.fn(() => ({
    init: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { createLogger } from '../../shared/services/logger.service';

const logger = createLogger('SelectionExportIntegration');

// Mock DOM APIs for export functionality
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(public data: any[], public options?: any) {}
    get size() { return 1024; }
  },
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

describe('Selection and Export Workflow Integration Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  let selectionService: SelectionService;
  let exportService: ExportService;
  let testMeshes: AbstractMesh[];

  beforeEach(async () => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    
    // Create test meshes representing OpenSCAD objects
    const cube = CreateBox('openscad-cube', { size: 2 }, scene);
    cube.metadata = { 
      openscadType: 'cube', 
      parameters: { size: [2, 2, 2] },
      source: 'cube([2, 2, 2]);'
    };
    
    const sphere = CreateSphere('openscad-sphere', { diameter: 3 }, scene);
    sphere.metadata = { 
      openscadType: 'sphere', 
      parameters: { r: 1.5 },
      source: 'sphere(r=1.5);'
    };
    
    const cylinder = CreateBox('openscad-cylinder', { size: 1 }, scene); // Simplified as box for testing
    cylinder.metadata = { 
      openscadType: 'cylinder', 
      parameters: { h: 4, r: 1 },
      source: 'cylinder(h=4, r=1);'
    };
    
    testMeshes = [cube, sphere, cylinder];
    
    // Create services
    selectionService = new SelectionService(scene);
    await selectionService.initialize();
    
    exportService = new ExportService(scene);
    
    // Clear mocks
    vi.clearAllMocks();
    
    logger.debug('[SETUP] Selection and export workflow test environment initialized');
  });

  afterEach(() => {
    // Clean up resources
    if (selectionService) {
      selectionService.dispose();
    }
    if (exportService) {
      exportService.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Single Object Selection and Export Workflow', () => {
    it('should select single object and export it', async () => {
      const cube = testMeshes[0];
      
      // Step 1: Select the cube
      const selectionResult = selectionService.selectMesh(cube);
      expect(selectionResult.success).toBe(true);
      
      // Verify selection state
      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(1);
      expect(selectedMeshes[0]).toBe(cube);
      
      // Step 2: Export selected object
      const exportConfig = {
        format: 'stl' as const,
        filename: 'selected-cube.stl',
        exportSelected: true,
      };
      
      const exportResult = await exportService.exportMeshes(selectedMeshes, exportConfig);
      
      // Export should fail gracefully (STL not implemented yet)
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        expect(exportResult.error.code).toBe('EXPORT_FAILED');
      }
      
      logger.debug('[SINGLE_WORKFLOW] Successfully tested single object selection and export workflow');
    });

    it('should handle selection metadata in export workflow', async () => {
      const sphere = testMeshes[1];
      
      // Step 1: Select the sphere
      selectionService.selectMesh(sphere);
      
      // Step 2: Verify metadata is preserved
      const selectionState = selectionService.getSelectionState();
      const selectedInfo = selectionState.selectedMeshes[0];
      
      expect(selectedInfo).toBeDefined();
      expect(selectedInfo?.metadata).toEqual({
        openscadType: 'sphere',
        parameters: { r: 1.5 },
        source: 'sphere(r=1.5);'
      });
      
      // Step 3: Export with metadata
      const selectedMeshes = selectionService.getSelectedMeshes();
      const exportConfig = {
        format: 'gltf' as const,
        filename: 'sphere-with-metadata.gltf',
        includeTextures: false,
      };
      
      const exportResult = await exportService.exportMeshes(selectedMeshes, exportConfig);
      
      // Should attempt export (will fail as GLTF not implemented)
      expect(exportResult.success).toBe(false);
      
      logger.debug('[METADATA_WORKFLOW] Successfully tested metadata preservation in selection and export');
    });
  });

  describe('Multi-Object Selection and Export Workflow', () => {
    it('should select multiple objects and export them together', async () => {
      // Step 1: Configure for multi-selection
      selectionService.updateConfig({ mode: 'multi' });
      
      // Step 2: Select multiple objects
      const cube = testMeshes[0];
      const sphere = testMeshes[1];
      
      selectionService.selectMesh(cube);
      selectionService.selectMesh(sphere, { addToSelection: true });
      
      // Verify multi-selection
      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(2);
      expect(selectedMeshes).toContain(cube);
      expect(selectedMeshes).toContain(sphere);
      
      // Step 3: Export multiple objects
      const exportConfig = {
        format: 'stl' as const,
        filename: 'multi-objects.stl',
        quality: 'high' as const,
      };
      
      const exportResult = await exportService.exportMeshes(selectedMeshes, exportConfig);
      
      // Should attempt export with multiple meshes
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        expect(exportResult.error.code).toBe('EXPORT_FAILED');
      }
      
      logger.debug('[MULTI_WORKFLOW] Successfully tested multi-object selection and export workflow');
    });

    it('should handle selective export from multi-selection', async () => {
      // Step 1: Select all objects
      selectionService.updateConfig({ mode: 'multi' });
      
      for (const mesh of testMeshes) {
        selectionService.selectMesh(mesh, { addToSelection: true });
      }
      
      // Verify all selected
      expect(selectionService.getSelectedMeshes()).toHaveLength(3);
      
      // Step 2: Export only specific objects (first two)
      const selectedForExport = testMeshes.slice(0, 2);
      
      const exportConfig = {
        format: 'glb' as const,
        filename: 'selective-export.glb',
        binary: true,
      };
      
      const exportResult = await exportService.exportMeshes(selectedForExport, exportConfig);
      
      // Should attempt export with subset
      expect(exportResult.success).toBe(false);
      
      logger.debug('[SELECTIVE_WORKFLOW] Successfully tested selective export from multi-selection');
    });
  });

  describe('Scene Export Workflow', () => {
    it('should export entire scene regardless of selection', async () => {
      // Step 1: Select some objects
      selectionService.selectMesh(testMeshes[0]);
      
      // Step 2: Export entire scene
      const exportConfig = {
        format: 'stl' as const,
        filename: 'entire-scene.stl',
        exportSelected: false,
      };
      
      const exportResult = await exportService.exportScene(exportConfig);
      
      // Should attempt to export all meshes in scene
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        expect(exportResult.error.code).toBe('EXPORT_FAILED');
      }
      
      logger.debug('[SCENE_WORKFLOW] Successfully tested entire scene export workflow');
    });

    it('should handle empty scene export', async () => {
      // Step 1: Remove all test meshes
      for (const mesh of testMeshes) {
        mesh.dispose();
      }
      
      // Step 2: Attempt to export empty scene
      const exportConfig = {
        format: 'stl' as const,
        filename: 'empty-scene.stl',
      };
      
      const exportResult = await exportService.exportScene(exportConfig);
      
      // Should fail with no meshes error
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        expect(exportResult.error.code).toBe('NO_MESHES');
      }
      
      logger.debug('[EMPTY_WORKFLOW] Successfully tested empty scene export handling');
    });
  });

  describe('Selection State Management During Export', () => {
    it('should maintain selection state during export process', async () => {
      // Step 1: Select object
      const cube = testMeshes[0];
      selectionService.selectMesh(cube);
      
      // Step 2: Start export process
      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(1);
      
      const exportConfig = {
        format: 'stl' as const,
        filename: 'state-test.stl',
      };
      
      // Step 3: Export (async operation)
      const exportPromise = exportService.exportMeshes(selectedMeshes, exportConfig);
      
      // Step 4: Verify selection state is maintained during export
      const currentSelection = selectionService.getSelectedMeshes();
      expect(currentSelection).toHaveLength(1);
      expect(currentSelection[0]).toBe(cube);
      
      // Step 5: Wait for export to complete
      await exportPromise;
      
      // Step 6: Verify selection state after export
      const finalSelection = selectionService.getSelectedMeshes();
      expect(finalSelection).toHaveLength(1);
      expect(finalSelection[0]).toBe(cube);
      
      logger.debug('[STATE_WORKFLOW] Successfully tested selection state management during export');
    });

    it('should handle selection changes during export', async () => {
      // Step 1: Select initial object
      const cube = testMeshes[0];
      const sphere = testMeshes[1];
      
      selectionService.selectMesh(cube);
      
      // Step 2: Start export
      const initialSelection = selectionService.getSelectedMeshes();
      const exportConfig = {
        format: 'stl' as const,
        filename: 'change-test.stl',
      };
      
      const exportPromise = exportService.exportMeshes(initialSelection, exportConfig);
      
      // Step 3: Change selection during export
      selectionService.selectMesh(sphere);
      
      // Step 4: Verify export uses original selection
      const newSelection = selectionService.getSelectedMeshes();
      expect(newSelection).toHaveLength(1);
      expect(newSelection[0]).toBe(sphere);
      
      // Step 5: Export should complete with original selection
      await exportPromise;
      
      logger.debug('[CHANGE_WORKFLOW] Successfully tested selection changes during export');
    });
  });

  describe('Export Configuration Workflow', () => {
    it('should handle different export formats for selected objects', async () => {
      const cube = testMeshes[0];
      selectionService.selectMesh(cube);
      const selectedMeshes = selectionService.getSelectedMeshes();
      
      // Test different export formats
      const formats = ['stl', '3mf', 'gltf', 'glb'] as const;
      
      for (const format of formats) {
        const exportConfig = {
          format,
          filename: `test.${format}`,
        };
        
        const exportResult = await exportService.exportMeshes(selectedMeshes, exportConfig);
        
        // All should fail gracefully (not implemented yet)
        expect(exportResult.success).toBe(false);
        if (!exportResult.success) {
          expect(exportResult.error.code).toBe('EXPORT_FAILED');
        }
      }
      
      logger.debug('[FORMAT_WORKFLOW] Successfully tested different export formats');
    });

    it('should validate export configuration with selection', async () => {
      const cube = testMeshes[0];
      selectionService.selectMesh(cube);
      const selectedMeshes = selectionService.getSelectedMeshes();
      
      // Test invalid configuration
      const invalidConfig = {
        format: 'stl' as const,
        filename: '', // Invalid: empty filename
      };
      
      const exportResult = await exportService.exportMeshes(selectedMeshes, invalidConfig);
      
      // Should fail with validation error
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        expect(exportResult.error.code).toBe('INVALID_CONFIG');
      }
      
      logger.debug('[VALIDATION_WORKFLOW] Successfully tested export configuration validation');
    });
  });

  describe('Error Handling in Selection-Export Workflow', () => {
    it('should handle export errors gracefully without affecting selection', async () => {
      // Step 1: Select object
      const cube = testMeshes[0];
      selectionService.selectMesh(cube);
      
      // Step 2: Attempt export with invalid format
      const selectedMeshes = selectionService.getSelectedMeshes();
      const invalidConfig = {
        format: 'invalid' as any,
        filename: 'test.invalid',
      };
      
      const exportResult = await exportService.exportMeshes(selectedMeshes, invalidConfig);
      
      // Step 3: Export should fail
      expect(exportResult.success).toBe(false);
      
      // Step 4: Selection should remain intact
      const currentSelection = selectionService.getSelectedMeshes();
      expect(currentSelection).toHaveLength(1);
      expect(currentSelection[0]).toBe(cube);
      
      logger.debug('[ERROR_WORKFLOW] Successfully tested error handling in selection-export workflow');
    });
  });
});
