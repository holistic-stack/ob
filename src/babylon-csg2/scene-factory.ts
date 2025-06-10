import * as BABYLON from '@babylonjs/core';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { OpenScadAstVisitor } from './openscad-ast-visitor/openscad-ast-visitor';

/**
 * A factory for creating a complete Babylon.js scene from an OpenSCAD AST.
 */
export class SceneFactory {
  /**
   * Creates a Babylon.js scene from an OpenSCAD AST.
   * @param engine The Babylon.js engine.
   * @param ast The root node of the OpenSCAD AST.
   * @returns A new Babylon.js scene.
   */
  public static createFromAst(engine: BABYLON.Engine, ast: ASTNode): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);

    // Add a camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(true);

    // Add a light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene);

    // Process the AST and add the resulting mesh to the scene
    const visitor = new OpenScadAstVisitor(scene);
    const mesh = visitor.visit(ast);

    if (mesh) {
      // Optionally, center the camera on the new mesh
      camera.setTarget(mesh.getAbsolutePosition());
    }

    return scene;
  }
}
