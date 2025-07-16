/**
 * @file Modifier Visualization Service Tests
 *
 * Tests for the ModifierVisualizationService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import {
  Color3,
  CreateBox,
  CreateSphere,
  type Mesh,
  NullEngine,
  Scene,
  type StandardMaterial,
} from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type ModifierVisualizationConfig,
  ModifierVisualizationService,
  type OpenSCADModifierType,
} from './modifier-visualization.service';

describe('ModifierVisualizationService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let modifierService: ModifierVisualizationService;
  let testMesh: Mesh;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    modifierService = new ModifierVisualizationService(scene);

    // Create a test mesh
    testMesh = CreateBox('testBox', { size: 1 }, scene);
  });

  afterEach(() => {
    // Clean up resources
    modifierService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize modifier visualization service', () => {
      expect(modifierService).toBeDefined();
      expect(modifierService.getAllModifierStates().length).toBe(0);
    });
  });

  describe('Debug Modifier (#)', () => {
    it('should apply debug modifier with wireframe visualization', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'debug',
        intensity: 1.0,
        preserveOriginal: false,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const applicationResult = result.data;
        expect(applicationResult.modifierType).toBe('debug');
        expect(applicationResult.applied).toBe(true);
        expect(applicationResult.originalMesh).toBe(testMesh);
        expect(applicationResult.wireframeMesh).toBeDefined();
      }
    });

    it('should apply debug modifier with custom color', async () => {
      const customColor = new Color3(0, 1, 0); // Green
      const config: ModifierVisualizationConfig = {
        type: 'debug',
        color: customColor,
        intensity: 1.5,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const applicationResult = result.data;
        expect(applicationResult.modifierType).toBe('debug');
        expect(applicationResult.wireframeMesh).toBeDefined();

        // Check that material was applied
        expect(testMesh.material).toBeDefined();
        expect((testMesh.material as StandardMaterial).wireframe).toBe(true);
      }
    });

    it('should apply debug modifier with wireframe only', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'debug',
        wireframeOnly: true,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const applicationResult = result.data;
        expect(applicationResult.wireframeMesh).toBeDefined();
      }
    });
  });

  describe('Background Modifier (%)', () => {
    it('should apply background modifier with transparency', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'background',
        transparency: 0.5,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const applicationResult = result.data;
        expect(applicationResult.modifierType).toBe('background');
        expect(applicationResult.applied).toBe(true);

        // Check transparency was applied
        expect(testMesh.material).toBeDefined();
        expect((testMesh.material as StandardMaterial).alpha).toBe(0.5);
      }
    });

    it('should apply background modifier with default transparency', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'background',
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const material = testMesh.material as StandardMaterial;
        expect(material.alpha).toBe(0.7); // 1.0 - 0.3 (default transparency)
      }
    });
  });

  describe('Disable Modifier (*)', () => {
    it('should apply disable modifier and hide mesh', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'disable',
      };

      // Ensure mesh is initially visible
      expect(testMesh.isVisible).toBe(true);
      expect(testMesh.isEnabled()).toBe(true);

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const applicationResult = result.data;
        expect(applicationResult.modifierType).toBe('disable');
        expect(applicationResult.applied).toBe(true);

        // Check mesh is hidden
        expect(testMesh.isVisible).toBe(false);
        expect(testMesh.isEnabled()).toBe(false);
      }
    });
  });

  describe('Root Modifier (!)', () => {
    it('should apply root modifier with highlighting', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'root',
        intensity: 1.2,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const applicationResult = result.data;
        expect(applicationResult.modifierType).toBe('root');
        expect(applicationResult.applied).toBe(true);
        expect(applicationResult.wireframeMesh).toBeDefined();

        // Check highlighting material was applied
        expect(testMesh.material).toBeDefined();
        const material = testMesh.material as StandardMaterial;
        expect(material.diffuseColor).toEqual(new Color3(1, 1, 0)); // Yellow
      }
    });

    it('should apply root modifier with custom color', async () => {
      const customColor = new Color3(1, 0, 0); // Red
      const config: ModifierVisualizationConfig = {
        type: 'root',
        color: customColor,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(true);

      if (result.success) {
        const material = testMesh.material as StandardMaterial;
        expect(material.diffuseColor).toEqual(customColor);
      }
    });
  });

  describe('Modifier State Management', () => {
    it('should track modifier state for applied modifiers', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'debug',
      };

      await modifierService.applyModifier(testMesh, config);

      const state = modifierService.getModifierState(testMesh.id);
      expect(state).toBeDefined();
      expect(state?.modifierType).toBe('debug');
      expect(state?.meshId).toBe(testMesh.id);
      expect(state?.appliedAt).toBeInstanceOf(Date);
    });

    it('should track multiple modifier states', async () => {
      const sphere = CreateSphere('testSphere', { diameter: 1 }, scene);

      await modifierService.applyModifier(testMesh, { type: 'debug' });
      await modifierService.applyModifier(sphere, { type: 'background' });

      const allStates = modifierService.getAllModifierStates();
      expect(allStates.length).toBe(2);

      const debugState = allStates.find((s) => s.modifierType === 'debug');
      const backgroundState = allStates.find((s) => s.modifierType === 'background');

      expect(debugState).toBeDefined();
      expect(backgroundState).toBeDefined();
    });
  });

  describe('Modifier Removal', () => {
    it('should remove modifier and restore original state', async () => {
      const originalMaterial = testMesh.material;

      const config: ModifierVisualizationConfig = {
        type: 'background',
        transparency: 0.5,
      };

      // Apply modifier
      await modifierService.applyModifier(testMesh, config);
      expect(testMesh.material).not.toBe(originalMaterial);

      // Remove modifier
      const result = await modifierService.removeModifier(testMesh);
      expect(result.success).toBe(true);

      // Check state was restored
      expect(testMesh.material).toBe(originalMaterial);
      expect(modifierService.getModifierState(testMesh.id)).toBeUndefined();
    });

    it('should restore visibility for disabled meshes', async () => {
      // Apply disable modifier
      await modifierService.applyModifier(testMesh, { type: 'disable' });
      expect(testMesh.isVisible).toBe(false);
      expect(testMesh.isEnabled()).toBe(false);

      // Remove modifier
      await modifierService.removeModifier(testMesh);
      expect(testMesh.isVisible).toBe(true);
      expect(testMesh.isEnabled()).toBe(true);
    });

    it('should handle removal of non-existent modifier gracefully', async () => {
      const result = await modifierService.removeModifier(testMesh);
      expect(result.success).toBe(true);
    });
  });

  describe('AST Modifier Detection', () => {
    it('should detect debug modifier from AST node', () => {
      const astNode = { type: 'debug', children: [] } as any;
      const modifier = modifierService.detectModifierFromAST(astNode);
      expect(modifier).toBe('debug');
    });

    it('should detect background modifier from AST node', () => {
      const astNode = { type: 'background', children: [] } as any;
      const modifier = modifierService.detectModifierFromAST(astNode);
      expect(modifier).toBe('background');
    });

    it('should detect disable modifier from AST node', () => {
      const astNode = { type: 'disable', children: [] } as any;
      const modifier = modifierService.detectModifierFromAST(astNode);
      expect(modifier).toBe('disable');
    });

    it('should detect root modifier from AST node', () => {
      const astNode = { type: 'show_only', children: [] } as any;
      const modifier = modifierService.detectModifierFromAST(astNode);
      expect(modifier).toBe('root');
    });

    it('should return null for non-modifier AST nodes', () => {
      const astNode = { type: 'cube', children: [] } as any;
      const modifier = modifierService.detectModifierFromAST(astNode);
      expect(modifier).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid modifier type', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'invalid' as OpenSCADModifierType,
      };

      const result = await modifierService.applyModifier(testMesh, config);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('APPLICATION_FAILED');
      }
    });

    it('should handle null mesh', async () => {
      const config: ModifierVisualizationConfig = {
        type: 'debug',
      };

      const result = await modifierService.applyModifier(null as any, config);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('APPLICATION_FAILED');
      }
    });
  });

  describe('Disposal', () => {
    it('should dispose all resources and clear state', async () => {
      await modifierService.applyModifier(testMesh, { type: 'debug' });
      expect(modifierService.getAllModifierStates().length).toBe(1);

      modifierService.dispose();
      expect(modifierService.getAllModifierStates().length).toBe(0);
    });

    it('should handle multiple dispose calls', () => {
      modifierService.dispose();
      modifierService.dispose(); // Should not throw
      expect(modifierService.getAllModifierStates().length).toBe(0);
    });
  });
});
