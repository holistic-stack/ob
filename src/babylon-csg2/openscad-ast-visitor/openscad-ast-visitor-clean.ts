/**
 * @file Implements a visitor pattern for traversing the OpenSCAD AST.
 * Updated to use CSG2 for improved performance and topology.
 * @author Luciano Júnior
 */

import type { ASTNode, CubeNode, SphereNode, CylinderNode, UnionNode, DifferenceNode, IntersectionNode, ScaleNode, TranslateNode } from '@holistic-stack/openscad-parser';
import { extractVector3 } from '../utils/parameter-extractor';
import * as BABYLON from '@babylonjs/core';

/**
 * Base class for visiting nodes of an OpenSCAD AST.
 * This class is designed to be extended with concrete logic for converting
 * AST nodes into Babylon.js objects using CSG2 for boolean operations.
 */
export class OpenScadAstVisitor {
  protected scene: BABYLON.Scene;

  /**
   * Initializes a new instance of the OpenScadAstVisitor class.
   * @param scene The Babylon.js scene to which objects will be added.
   */
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }
  /**
   * Dispatches the visit call to the appropriate method based on the node's type.
   * @param node The AST node to visit.
   * @returns Promise that resolves to a Babylon.js mesh or null.
   */
  public async visit(node: ASTNode): Promise<BABYLON.Mesh | null> {
    switch (node.type) {
      case 'cube':
        return this.visitCube(node as CubeNode);
      case 'sphere':
        return this.visitSphere(node as SphereNode);
      case 'cylinder':
        return this.visitCylinder(node as CylinderNode);
      case 'union':
        return this.visitUnion(node as UnionNode);
      case 'difference':
        return this.visitDifference(node as DifferenceNode);
      case 'intersection':
        return this.visitIntersection(node as IntersectionNode);
      case 'translate':
        return this.visitTranslate(node as TranslateNode);
      case 'scale':
        return this.visitScale(node as ScaleNode);
      // Add other cases for transformations, CSG operations, etc.
      default:
        console.warn(`[WARN] Unhandled node type: ${node.type}`);
        return null;
    }
  }

  /**
   * Visits a CubeNode and creates a Babylon.js box mesh.
   * @param node The CubeNode to visit.
   * @returns A Babylon.js mesh representing the cube.
   */
  protected visitCube(node: CubeNode): BABYLON.Mesh {
    console.log('[INIT] Visiting CubeNode', node);

    const size = extractVector3(node.size, [1, 1, 1]);
    const center = node.center ?? false;

    const box = BABYLON.MeshBuilder.CreateBox(
      `cube_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        width: size[0],
        height: size[1],
        depth: size[2],
      },
      this.scene
    );

    // OpenSCAD's default is center: false, placing one corner at the origin.
    // Babylon's CreateBox defaults to center: true.
    // We need to offset the box to match OpenSCAD's behavior when center is false.
    if (!center) {
      box.position = new BABYLON.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
    }

    console.log('[DEBUG] Created box mesh:', box);
    return box;
  }

  /**
   * Visits a SphereNode and creates a Babylon.js sphere mesh.
   * @param node The SphereNode to visit.
   * @returns A Babylon.js mesh representing the sphere.
   */
  protected visitSphere(node: SphereNode): BABYLON.Mesh {
    console.log('[INIT] Visiting SphereNode', node);

    // OpenSCAD can define a sphere by either radius (r) or diameter (d).
    // The parser uses `radius` and `diameter` properties.
    // Babylon's CreateSphere uses diameter. We prioritize diameter if present.
    const diameter = node.diameter ?? (node.radius ? node.radius * 2 : 1);

    // TODO: Handle resolution parameters ($fa, $fs, $fn) -> segments

    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `sphere_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        diameter: diameter,
      },
      this.scene
    );

    console.log('[DEBUG] Created sphere mesh:', sphere);
    return sphere;
  }

  /**
   * Visits a CylinderNode and creates a Babylon.js cylinder mesh.
   * @param node The CylinderNode to visit.
   * @returns A Babylon.js mesh representing the cylinder.
   */
  protected visitCylinder(node: CylinderNode): BABYLON.Mesh {
    console.log('[INIT] Visiting CylinderNode', node);

    const h = node.h;
    const center = node.center ?? false;

    // OpenSCAD has a complex precedence for cylinder radii/diameters.
    // Babylon's CreateCylinder uses diameterTop and diameterBottom.
    const d1 = node.d1 ?? (node.r1 ? node.r1 * 2 : node.d ?? (node.r ? node.r * 2 : 1));
    const d2 = node.d2 ?? (node.r2 ? node.r2 * 2 : node.d ?? (node.r ? node.r * 2 : 1));

    // TODO: Handle resolution parameters ($fa, $fs, $fn) -> tessellation

    const cylinder = BABYLON.MeshBuilder.CreateCylinder(
      `cylinder_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        height: h,
        diameterTop: d2,
        diameterBottom: d1,
      },
      this.scene
    );

    // If not centered, move the cylinder up by half its height so its base is at the origin.
    if (!center) {
      cylinder.position = new BABYLON.Vector3(0, h / 2, 0);
    }

    console.log('[DEBUG] Created cylinder mesh:', cylinder);
    return cylinder;
  }
  /**
   * Visits a UnionNode and merges its children into a single mesh using CSG2.
   * @param node The UnionNode to visit.
   * @returns A Babylon.js mesh representing the merged geometry, or null.
   */
  protected visitUnion(node: UnionNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting UnionNode', node);

    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARN] Union has no children to merge.');
      return null;
    }

    if (childMeshes.length === 1) {
      return childMeshes[0]!; // TypeScript assertion - filter ensures non-null
    }

    console.log(`[DEBUG] Merging ${childMeshes.length} meshes using CSG2.`);
    
    // Create CSG2 objects from meshes - filter ensures all meshes are non-null
    let baseCsg = BABYLON.CSG2.FromMesh(childMeshes[0]!);

    for (let i = 1; i < childMeshes.length; i++) {
      const childCsg = BABYLON.CSG2.FromMesh(childMeshes[i]!);
      const newBaseCsg = baseCsg.add(childCsg); // CSG2 uses 'add' for union
      
      // Dispose previous CSG to prevent memory leaks
      baseCsg.dispose();
      childCsg.dispose();
      baseCsg = newBaseCsg;
    }

    // Dispose of the original meshes as they are now part of the CSG result
    childMeshes.forEach(mesh => mesh.dispose());

    const finalMesh = baseCsg.toMesh(
      `union_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      this.scene,
      { rebuildNormals: true, centerMesh: false } // CSG2 toMesh options
    );

    // Dispose the final CSG object
    baseCsg.dispose();

    console.log('[DEBUG] Created union mesh:', finalMesh);
    return finalMesh;
  }

  /**
   * Visits a DifferenceNode and subtracts its children from the first child using CSG2.
   * @param node The DifferenceNode to visit.
   * @returns A Babylon.js mesh representing the resulting geometry, or null.
   */
  protected visitDifference(node: DifferenceNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting DifferenceNode', node);

    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARN] Difference has no children.');
      return null;
    }

    if (childMeshes.length === 1) {
      return childMeshes[0];
    }

    console.log(`[DEBUG] Subtracting ${childMeshes.length - 1} meshes from the first one using CSG2.`);
    let baseCsg = BABYLON.CSG2.FromMesh(childMeshes[0]);

    for (let i = 1; i < childMeshes.length; i++) {
      const childCsg = BABYLON.CSG2.FromMesh(childMeshes[i]);
      const newBaseCsg = baseCsg.subtract(childCsg);
      
      // Dispose previous CSG to prevent memory leaks
      baseCsg.dispose();
      childCsg.dispose();
      baseCsg = newBaseCsg;
    }

    // Dispose of the original meshes as they are now part of the CSG result
    childMeshes.forEach(mesh => mesh.dispose());

    const finalMesh = baseCsg.toMesh(
      `difference_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      this.scene,
      { rebuildNormals: true, centerMesh: false } // CSG2 toMesh options
    );

    // Dispose the final CSG object
    baseCsg.dispose();

    console.log('[DEBUG] Created difference mesh:', finalMesh);
    return finalMesh;
  }

  /**
   * Visits an IntersectionNode and computes the intersection of its children using CSG2.
   * @param node The IntersectionNode to visit.
   * @returns A Babylon.js mesh representing the intersected geometry, or null.
   */
  protected visitIntersection(node: IntersectionNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting IntersectionNode', node);

    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARN] Intersection has no children to intersect.');
      return null;
    }

    if (childMeshes.length === 1) {
      return childMeshes[0];
    }

    console.log(`[DEBUG] Intersecting ${childMeshes.length} meshes using CSG2.`);
    let baseCsg = BABYLON.CSG2.FromMesh(childMeshes[0]);

    for (let i = 1; i < childMeshes.length; i++) {
      const childCsg = BABYLON.CSG2.FromMesh(childMeshes[i]);
      const newBaseCsg = baseCsg.intersect(childCsg);
      
      // Dispose previous CSG to prevent memory leaks
      baseCsg.dispose();
      childCsg.dispose();
      baseCsg = newBaseCsg;
    }

    // Dispose of the original meshes as they are now part of the CSG result
    childMeshes.forEach(mesh => mesh.dispose());

    const finalMesh = baseCsg.toMesh(
      `intersection_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      this.scene,
      { rebuildNormals: true, centerMesh: false } // CSG2 toMesh options
    );

    // Dispose the final CSG object
    baseCsg.dispose();

    console.log('[DEBUG] Created intersection mesh:', finalMesh);
    return finalMesh;
  }

  /**
   * Visits a TranslateNode and applies a translation to its child.
   * If there are multiple children, they are implicitly unioned first.
   * @param node The TranslateNode to visit.
   * @returns The translated Babylon.js mesh, or null.
   */
  protected visitTranslate(node: TranslateNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting TranslateNode', node);

    const translationVector = extractVector3(node.v, [0, 0, 0]);
    const translation = new BABYLON.Vector3(translationVector[0], translationVector[1], translationVector[2]);

    // Visit all children and filter out nulls
    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARN] Translate has no children to transform.');
      return null;
    }

    let targetMesh: BABYLON.Mesh;

    if (childMeshes.length === 1) {
      targetMesh = childMeshes[0];
    } else {
      // Multiple children: union them first using CSG2
      console.log(`[DEBUG] Multiple children (${childMeshes.length}), unioning first.`);
      let baseCsg = BABYLON.CSG2.FromMesh(childMeshes[0]);

      for (let i = 1; i < childMeshes.length; i++) {
        const childCsg = BABYLON.CSG2.FromMesh(childMeshes[i]);
        const newBaseCsg = baseCsg.add(childCsg);
        
        // Dispose previous CSG to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose of the original meshes as they are now part of the CSG result
      childMeshes.forEach(mesh => mesh.dispose());

      targetMesh = baseCsg.toMesh(
        `translate_union_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        this.scene,
        { rebuildNormals: true, centerMesh: false }
      );

      // Dispose the CSG object
      baseCsg.dispose();
    }

    // Apply the translation
    targetMesh.position.addInPlace(translation);

    console.log('[DEBUG] Applied translation:', translation);
    return targetMesh;
  }

  /**
   * Visits a ScaleNode and applies scaling to its child.
   * If there are multiple children, they are implicitly unioned first.
   * @param node The ScaleNode to visit.
   * @returns The scaled Babylon.js mesh, or null.
   */
  protected visitScale(node: ScaleNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting ScaleNode', node);

    const scaleVector = extractVector3(node.v, [1, 1, 1]);
    const scale = new BABYLON.Vector3(scaleVector[0], scaleVector[1], scaleVector[2]);

    // Visit all children and filter out nulls
    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARN] Scale has no children to transform.');
      return null;
    }

    let targetMesh: BABYLON.Mesh;

    if (childMeshes.length === 1) {
      targetMesh = childMeshes[0];
    } else {
      // Multiple children: union them first using CSG2
      console.log(`[DEBUG] Multiple children (${childMeshes.length}), unioning first.`);
      let baseCsg = BABYLON.CSG2.FromMesh(childMeshes[0]);

      for (let i = 1; i < childMeshes.length; i++) {
        const childCsg = BABYLON.CSG2.FromMesh(childMeshes[i]);
        const newBaseCsg = baseCsg.add(childCsg);
        
        // Dispose previous CSG to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose of the original meshes as they are now part of the CSG result
      childMeshes.forEach(mesh => mesh.dispose());

      targetMesh = baseCsg.toMesh(
        `scale_union_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        this.scene,
        { rebuildNormals: true, centerMesh: false }
      );

      // Dispose the CSG object
      baseCsg.dispose();
    }

    // Apply the scaling
    targetMesh.scaling.multiplyInPlace(scale);

    console.log('[DEBUG] Applied scaling:', scale);
    return targetMesh;
  }
}
