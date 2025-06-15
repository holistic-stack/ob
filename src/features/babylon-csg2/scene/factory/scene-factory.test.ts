import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { SceneFactory } from './scene-factory';
import type { ASTNode, CubeNode } from '@holistic-stack/openscad-parser';
import { initializeCSG2ForTests } from '../../../../vitest-setup';

describe('SceneFactory', () => {
  let engine: BABYLON.NullEngine;

  beforeAll(async () => {
    // Initialize CSG2 for tests
    await initializeCSG2ForTests();
  });

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
  });

  it('should create a scene with a camera and a light', async () => {
    const ast: ASTNode = { type: 'cube', size: [10, 10, 10] };
    const scene = await SceneFactory.createFromAst(engine, ast);

    expect(scene).toBeInstanceOf(BABYLON.Scene);
    expect(scene.cameras).toHaveLength(1);
    expect(scene.lights).toHaveLength(1);
  });

  it('should add a mesh to the scene if the AST is valid', async () => {
    const ast: CubeNode = { type: 'cube', size: [10, 10, 10] };
    const scene = await SceneFactory.createFromAst(engine, ast);

    // The root mesh and the light/camera placeholders
    expect(scene.meshes).toHaveLength(1);
    expect(scene.meshes[0]?.name).toContain('cube');
  });

  it('should create an empty scene (with camera/light) if the AST results in no mesh', async () => {
    const ast: ASTNode = { type: 'union', children: [] }; // An empty union
    const scene = await SceneFactory.createFromAst(engine, ast);

    expect(scene.meshes).toHaveLength(0);
  });
});
