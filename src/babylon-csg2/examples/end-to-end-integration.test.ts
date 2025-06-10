import { describe, it, expect, beforeEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { ParserResourceManager } from '../utils/parser-resource-manager';
import { SceneFactory } from '../scene-factory';

describe('End-to-End Integration Test', () => {
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
  });

  it('should parse a complex OpenSCAD file and generate a valid scene', async () => {
    // Simple OpenSCAD code for testing
    const scadCode = `
      union() {
        cube([10, 10, 10]);
        translate([5, 5, 5]) {
          sphere(r=3);
        }
      }
    `;

    // Parse the OpenSCAD code to get the AST nodes
    const parserManager = new ParserResourceManager({ enableLogging: true });
    const parseResult = await parserManager.parseOpenSCAD(scadCode);
    
    // Ensure we got a valid result
    expect(parseResult.success).toBe(true);
    if (!parseResult.success) {
      throw new Error(`Failed to parse OpenSCAD code: ${parseResult.error}`);
    }

    // Ensure we have AST nodes
    expect(parseResult.value.length).toBeGreaterThan(0);

    // Get the first AST node for scene creation
    const rootNode = parseResult.value[0];
    expect(rootNode).toBeDefined();
    
    // Generate the scene from the AST
    const scene = await SceneFactory.createFromAst(engine, rootNode!);

    // Validate the scene
    expect(scene).toBeInstanceOf(BABYLON.Scene);
    expect(scene.cameras.length).toBe(1);
    expect(scene.lights.length).toBe(1);

    // Check that we have at least one mesh from our operations
    expect(scene.meshes.length).toBeGreaterThan(0);
    
    // Filter out camera and light meshes, check for actual 3D geometry
    const userMeshes = scene.meshes.filter(mesh => 
      !mesh.name.includes('camera') && 
      !mesh.name.includes('light') &&
      mesh.name !== '__root__'
    );
    expect(userMeshes.length).toBeGreaterThan(0);
    
    // Clean up parser resources
    await parserManager.dispose();
  });
});
