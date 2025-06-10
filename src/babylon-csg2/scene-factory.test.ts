import { describe, it, expect, beforeEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { SceneFactory } from './scene-factory';
import type { ASTNode, CubeNode } from '@holistic-stack/openscad-parser';

describe('SceneFactory', () => {
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
  });

  it('should create a scene with a camera and a light', () => {
    const ast: ASTNode = { type: 'cube', size: [10, 10, 10] };
    const scene = SceneFactory.createFromAst(engine, ast);

    expect(scene).toBeInstanceOf(BABYLON.Scene);
    expect(scene.cameras.length).toBe(1);
    expect(scene.lights.length).toBe(1);
  });

  it('should add a mesh to the scene if the AST is valid', () => {
    const ast: CubeNode = { type: 'cube', size: [10, 10, 10] };
    const scene = SceneFactory.createFromAst(engine, ast);

    // The root mesh and the light/camera placeholders
    expect(scene.meshes.length).toBe(1);
    expect(scene.meshes[0].name).toContain('cube');
  });

  it('should create an empty scene (with camera/light) if the AST results in no mesh', () => {
    const ast: ASTNode = { type: 'union', children: [] }; // An empty union
    const scene = SceneFactory.createFromAst(engine, ast);

    expect(scene.meshes.length).toBe(0);
  });
});
