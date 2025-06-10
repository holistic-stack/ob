/**
 * @file Implements a visitor pattern for traversing the OpenSCAD AST with CSG2.
 * This implementation uses the correct CSG2 API which is synchronous (only initialization is async).
 * @author Luciano Júnior
 */

import type { 
  ASTNode, 
  CubeNode, 
  SphereNode, 
  CylinderNode, 
  UnionNode, 
  DifferenceNode, 
  IntersectionNode, 
  ScaleNode, 
  TranslateNode 
} from '@holistic-stack/openscad-parser';
import { extractVector3 } from '../utils/parameter-extractor';
import * as BABYLON from '@babylonjs/core';

/**
 * Visitor class for traversing OpenSCAD AST nodes and converting them to Babylon.js meshes using CSG2.
 * CSG2 operations are synchronous, only initialization is async (handled elsewhere).
 */
export class OpenScadAstVisitorCSG2 {
  protected scene: BABYLON.Scene;

  /**
   * Initializes a new instance of the OpenScadAstVisitorCSG2 class.
   * Note: CSG2 must be initialized before using this class by calling BABYLON.InitializeCSG2Async().
   * @param scene The Babylon.js scene to which objects will be added.
   */
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * Dispatches the visit call to the appropriate method based on the node's type.
   * @param node The AST node to visit.
   * @returns A Babylon.js mesh or null.
   */
  public visit(node: ASTNode): BABYLON.Mesh | null {
    try {
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
        default:
          console.warn(`[WARNING] Unsupported node type: ${node.type}`);
          return null;
      }
    } catch (error) {
      console.error(`[ERROR] Failed to visit node of type ${node.type}:`, error);
      return null;
    }
  }

  /**
   * Converts a CubeNode to a Babylon.js box mesh.
   * @param node The CubeNode from the AST.
   * @returns A Babylon.js mesh representing the cube.
   */
  protected visitCube(node: CubeNode): BABYLON.Mesh {
    console.log('[DEBUG] Converting CubeNode to mesh:', node);
    
    const dimensions = extractVector3(node.size) || [1, 1, 1];
    const [width, height, depth] = dimensions;
    
    const mesh = BABYLON.MeshBuilder.CreateBox(
      `cube_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`, 
      { 
        width, 
        height, 
        depth, 
        updatable: false 
      }, 
      this.scene
    );
    
    console.log('[DEBUG] Created cube mesh with dimensions:', dimensions);
    return mesh;
  }

  /**
   * Converts a SphereNode to a Babylon.js sphere mesh.
   * @param node The SphereNode from the AST.
   * @returns A Babylon.js mesh representing the sphere.
   */
  protected visitSphere(node: SphereNode): BABYLON.Mesh {
    console.log('[DEBUG] Converting SphereNode to mesh:', node);
    
    // Extract radius from node properties (need to check actual AST structure)
    const radius = (node as any).radius || (node as any).r || 1;
    
    const mesh = BABYLON.MeshBuilder.CreateSphere(
      `sphere_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`, 
      { 
        diameter: radius * 2, 
        updatable: false 
      }, 
      this.scene
    );
    
    console.log('[DEBUG] Created sphere mesh with radius:', radius);
    return mesh;
  }

  /**
   * Converts a CylinderNode to a Babylon.js cylinder mesh.
   * @param node The CylinderNode from the AST.
   * @returns A Babylon.js mesh representing the cylinder.
   */
  protected visitCylinder(node: CylinderNode): BABYLON.Mesh {
    console.log('[DEBUG] Converting CylinderNode to mesh:', node);
    
    // Extract height and radius from node properties (need to check actual AST structure)
    const height = (node as any).height || (node as any).h || 1;
    const radius = (node as any).radius || (node as any).r || 1;
    
    const mesh = BABYLON.MeshBuilder.CreateCylinder(
      `cylinder_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`, 
      { 
        height, 
        diameter: radius * 2, 
        updatable: false 
      }, 
      this.scene
    );
    
    console.log('[DEBUG] Created cylinder mesh with height:', height, 'radius:', radius);
    return mesh;
  }

  /**
   * Processes a UnionNode by combining child meshes using CSG2 union operations.
   * @param node The UnionNode from the AST.
   * @returns Promise that resolves to a mesh representing the union or null if no children.
   */
  protected async visitUnion(node: UnionNode): Promise<BABYLON.Mesh | null> {
    console.log('[DEBUG] Processing UnionNode with children:', node.children?.length ?? 0);
    
    if (!node.children || node.children.length === 0) {
      console.warn('[WARNING] UnionNode has no children');
      return null;
    }

    // Visit all children and await results
    const childPromises = node.children.map(child => this.visit(child));
    const childResults = await Promise.all(childPromises);
    
    // Filter out null results
    const childMeshes = childResults.filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARNING] No valid child meshes for union operation');
      return null;
    }

    if (childMeshes.length === 1) {
      console.log('[DEBUG] Single child mesh, returning as-is');
      return childMeshes[0];
    }

    // Perform CSG2 union operations
    try {
      let baseCsg = await BABYLON.CSG2.fromMesh(childMeshes[0]);

      for (let i = 1; i < childMeshes.length; i++) {
        const childCsg = await BABYLON.CSG2.fromMesh(childMeshes[i]);
        const newBaseCsg = await baseCsg.union(childCsg);
        
        // Dispose previous CSG objects to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose original meshes as they are now part of the CSG result
      childMeshes.forEach(mesh => mesh.dispose());

      const finalMesh = await baseCsg.toMesh(
        `union_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        this.scene
      );

      // Dispose the final CSG object
      baseCsg.dispose();

      console.log('[DEBUG] Created union mesh:', finalMesh);
      return finalMesh;
    } catch (error) {
      console.error('[ERROR] Failed to perform CSG2 union operation:', error);
      // Cleanup on error
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }
  }

  /**
   * Processes a DifferenceNode by subtracting child meshes using CSG2 subtract operations.
   * @param node The DifferenceNode from the AST.
   * @returns Promise that resolves to a mesh representing the difference or null if insufficient children.
   */
  protected async visitDifference(node: DifferenceNode): Promise<BABYLON.Mesh | null> {
    console.log('[DEBUG] Processing DifferenceNode with children:', node.children?.length ?? 0);
    
    if (!node.children || node.children.length < 2) {
      console.warn('[WARNING] DifferenceNode needs at least 2 children');
      return null;
    }

    // Visit all children and await results
    const childPromises = node.children.map(child => this.visit(child));
    const childResults = await Promise.all(childPromises);
    
    // Filter out null results
    const childMeshes = childResults.filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length < 2) {
      console.warn('[WARNING] Insufficient valid child meshes for difference operation');
      // Dispose any created meshes
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }

    // Perform CSG2 difference operations
    try {
      let baseCsg = await BABYLON.CSG2.fromMesh(childMeshes[0]);

      for (let i = 1; i < childMeshes.length; i++) {
        const childCsg = await BABYLON.CSG2.fromMesh(childMeshes[i]);
        const newBaseCsg = await baseCsg.subtract(childCsg);
        
        // Dispose previous CSG objects to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose original meshes
      childMeshes.forEach(mesh => mesh.dispose());

      const finalMesh = await baseCsg.toMesh(
        `difference_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        this.scene
      );

      // Dispose the final CSG object
      baseCsg.dispose();

      console.log('[DEBUG] Created difference mesh:', finalMesh);
      return finalMesh;
    } catch (error) {
      console.error('[ERROR] Failed to perform CSG2 difference operation:', error);
      // Cleanup on error
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }
  }

  /**
   * Processes an IntersectionNode by intersecting child meshes using CSG2 intersect operations.
   * @param node The IntersectionNode from the AST.
   * @returns Promise that resolves to a mesh representing the intersection or null if insufficient children.
   */
  protected async visitIntersection(node: IntersectionNode): Promise<BABYLON.Mesh | null> {
    console.log('[DEBUG] Processing IntersectionNode with children:', node.children?.length ?? 0);
    
    if (!node.children || node.children.length < 2) {
      console.warn('[WARNING] IntersectionNode needs at least 2 children');
      return null;
    }

    // Visit all children and await results
    const childPromises = node.children.map(child => this.visit(child));
    const childResults = await Promise.all(childPromises);
    
    // Filter out null results
    const childMeshes = childResults.filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length < 2) {
      console.warn('[WARNING] Insufficient valid child meshes for intersection operation');
      // Dispose any created meshes
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }

    // Perform CSG2 intersection operations
    try {
      let baseCsg = await BABYLON.CSG2.fromMesh(childMeshes[0]);

      for (let i = 1; i < childMeshes.length; i++) {
        const childCsg = await BABYLON.CSG2.fromMesh(childMeshes[i]);
        const newBaseCsg = await baseCsg.intersect(childCsg);
        
        // Dispose previous CSG objects to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose original meshes
      childMeshes.forEach(mesh => mesh.dispose());

      const finalMesh = await baseCsg.toMesh(
        `intersection_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        this.scene
      );

      // Dispose the final CSG object
      baseCsg.dispose();

      console.log('[DEBUG] Created intersection mesh:', finalMesh);
      return finalMesh;
    } catch (error) {
      console.error('[ERROR] Failed to perform CSG2 intersection operation:', error);
      // Cleanup on error
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }
  }

  /**
   * Processes a TranslateNode by applying translation to the child mesh.
   * @param node The TranslateNode from the AST.
   * @returns Promise that resolves to the translated mesh or null if no child.
   */
  protected async visitTranslate(node: TranslateNode): Promise<BABYLON.Mesh | null> {
    console.log('[DEBUG] Processing TranslateNode:', node);
    
    if (!node.children || node.children.length === 0) {
      console.warn('[WARNING] TranslateNode has no children');
      return null;
    }

    // Visit the child (translate should have exactly one child)
    const childMesh = await this.visit(node.children[0]);
    
    if (!childMesh) {
      console.warn('[WARNING] TranslateNode child produced no mesh');
      return null;
    }

    // Extract translation vector
    const translation = extractVector3(node.v) || [0, 0, 0];
    const [x, y, z] = translation;

    // Apply translation
    childMesh.position.set(x, y, z);
    
    // Update mesh name to reflect the transformation
    childMesh.name = `translate_${childMesh.name}`;
    
    console.log('[DEBUG] Applied translation:', translation, 'to mesh:', childMesh.name);
    return childMesh;
  }

  /**
   * Processes a ScaleNode by applying scaling to the child mesh.
   * @param node The ScaleNode from the AST.
   * @returns Promise that resolves to the scaled mesh or null if no child.
   */
  protected async visitScale(node: ScaleNode): Promise<BABYLON.Mesh | null> {
    console.log('[DEBUG] Processing ScaleNode:', node);
    
    if (!node.children || node.children.length === 0) {
      console.warn('[WARNING] ScaleNode has no children');
      return null;
    }

    // Visit the child (scale should have exactly one child)
    const childMesh = await this.visit(node.children[0]);
    
    if (!childMesh) {
      console.warn('[WARNING] ScaleNode child produced no mesh');
      return null;
    }

    // Extract scale vector
    const scale = extractVector3(node.v) || [1, 1, 1];
    const [x, y, z] = scale;

    // Apply scaling
    childMesh.scaling.set(x, y, z);
    
    // Update mesh name to reflect the transformation
    childMesh.name = `scale_${childMesh.name}`;
    
    console.log('[DEBUG] Applied scaling:', scale, 'to mesh:', childMesh.name);
    return childMesh;
  }
}
