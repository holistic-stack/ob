import { describe, it, expect, beforeEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadParser } from '@holistic-stack/openscad-parser';
import { SceneFactory } from '../scene-factory';
import * as fs from 'fs';
import * as path from 'path';

describe('End-to-End Integration Test', () => {
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
  });

  it('should parse a complex OpenSCAD file and generate a valid scene', () => {
    // Load the complex OpenSCAD model
    const scadFilePath = path.resolve(__dirname, '../test-assets/complex-model.scad');
    const scadCode = fs.readFileSync(scadFilePath, 'utf-8');

    // Parse the OpenSCAD code to get the AST
    const parser = new OpenScadParser();
    const ast = parser.parse(scadCode);

    // Generate the scene from the AST
    const scene = SceneFactory.createFromAst(engine, ast);

    // Validate the scene
    expect(scene).toBeInstanceOf(BABYLON.Scene);
    expect(scene.cameras.length).toBe(1);
    expect(scene.lights.length).toBe(1);

    // The complex model should result in a single final mesh
    expect(scene.meshes.length).toBe(1);
    expect(scene.meshes[0]).toBeInstanceOf(BABYLON.Mesh);
  });
});
