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
import { extractVector3 } from '../../utils/parameter-extractor.js';
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
          return this.visitCube(node);
        case 'sphere':
          return this.visitSphere(node);
        case 'cylinder':
          return this.visitCylinder(node);
        case 'union':
          return this.visitUnion(node);
        case 'difference':
          return this.visitDifference(node);
        case 'intersection':
          return this.visitIntersection(node);
        case 'translate':
          return this.visitTranslate(node);
        case 'scale':
          return this.visitScale(node);
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
    
    const dimensions = extractVector3(node.size, [1, 1, 1]);
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

    // Extract radius from node properties using proper type checking
    const radius = this.extractSphereRadius(node);
    
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

    // Extract height and radius from node properties using proper type checking
    const { height, radius } = this.extractCylinderParams(node);
    
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
   * Processes a UnionNode by combining child meshes using CSG2 add operations.
   * @param node The UnionNode from the AST.
   * @returns A mesh representing the union or null if no children.
   */
  protected visitUnion(node: UnionNode): BABYLON.Mesh | null {
    console.log('[DEBUG] Processing UnionNode with children:', node.children?.length ?? 0);
    
    if (!node.children || node.children.length === 0) {
      console.warn('[WARNING] UnionNode has no children');
      return null;
    }

    // Visit all children
    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARNING] No valid child meshes for union operation');
      return null;
    }    if (childMeshes.length === 1) {
      console.log('[DEBUG] Single child mesh, returning as-is');
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        console.error('[ERROR] First mesh is unexpectedly undefined');
        return null;
      }
      return firstMesh;
    }

    // Perform CSG2 union operations (using correct API)
    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        console.error('[ERROR] First mesh is undefined');
        return null;
      }
      let baseCsg = BABYLON.CSG2.FromMesh(firstMesh);

      for (let i = 1; i < childMeshes.length; i++) {
        const currentMesh = childMeshes[i];
        if (!currentMesh) {
          console.error(`[ERROR] Mesh at index ${i} is undefined`);
          continue;
        }
        const childCsg = BABYLON.CSG2.FromMesh(currentMesh);
        const newBaseCsg = baseCsg.add(childCsg); // CSG2 uses 'add' for union
        
        // Dispose previous CSG objects to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose original meshes as they are now part of the CSG result
      childMeshes.forEach(mesh => mesh.dispose());

      const finalMesh = baseCsg.toMesh(
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
   * @returns A mesh representing the difference or null if insufficient children.
   */
  protected visitDifference(node: DifferenceNode): BABYLON.Mesh | null {
    console.log('[DEBUG] Processing DifferenceNode with children:', node.children?.length ?? 0);
    
    if (!node.children || node.children.length < 2) {
      console.warn('[WARNING] DifferenceNode needs at least 2 children');
      return null;
    }

    // Visit all children
    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length < 2) {
      console.warn('[WARNING] Insufficient valid child meshes for difference operation');
      // Dispose any created meshes
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }

    // Perform CSG2 difference operations
    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        console.error('[ERROR] First mesh is undefined');
        return null;
      }
      let baseCsg = BABYLON.CSG2.FromMesh(firstMesh);

      for (let i = 1; i < childMeshes.length; i++) {
        const currentMesh = childMeshes[i];
        if (!currentMesh) {
          console.error(`[ERROR] Mesh at index ${i} is undefined`);
          continue;
        }
        const childCsg = BABYLON.CSG2.FromMesh(currentMesh);
        const newBaseCsg = baseCsg.subtract(childCsg);
        
        // Dispose previous CSG objects to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose original meshes
      childMeshes.forEach(mesh => mesh.dispose());

      const finalMesh = baseCsg.toMesh(
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
   * @returns A mesh representing the intersection or null if insufficient children.
   */
  protected visitIntersection(node: IntersectionNode): BABYLON.Mesh | null {
    console.log('[DEBUG] Processing IntersectionNode with children:', node.children?.length ?? 0);
    
    if (!node.children || node.children.length < 2) {
      console.warn('[WARNING] IntersectionNode needs at least 2 children');
      return null;
    }

    // Visit all children
    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length < 2) {
      console.warn('[WARNING] Insufficient valid child meshes for intersection operation');
      // Dispose any created meshes
      childMeshes.forEach(mesh => mesh.dispose());
      return null;
    }

    // Perform CSG2 intersection operations
    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        console.error('[ERROR] First mesh is undefined');
        return null;
      }
      let baseCsg = BABYLON.CSG2.FromMesh(firstMesh);

      for (let i = 1; i < childMeshes.length; i++) {
        const currentMesh = childMeshes[i];
        if (!currentMesh) {
          console.error(`[ERROR] Mesh at index ${i} is undefined`);
          continue;
        }
        const childCsg = BABYLON.CSG2.FromMesh(currentMesh);
        const newBaseCsg = baseCsg.intersect(childCsg);
        
        // Dispose previous CSG objects to prevent memory leaks
        baseCsg.dispose();
        childCsg.dispose();
        baseCsg = newBaseCsg;
      }

      // Dispose original meshes
      childMeshes.forEach(mesh => mesh.dispose());

      const finalMesh = baseCsg.toMesh(
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
   * @returns The translated mesh or null if no child.
   */
  protected visitTranslate(node: TranslateNode): BABYLON.Mesh | null {
    console.log('[DEBUG] Processing TranslateNode:', node);
    
    if (!node.children || node.children.length === 0) {
      console.warn('[WARNING] TranslateNode has no children');
      return null;
    }

    // Visit the child (translate should have exactly one child)
    const firstChild = node.children[0];
    if (!firstChild) {
      console.warn('[WARNING] TranslateNode first child is undefined');
      return null;
    }

    const childMesh = this.visit(firstChild);
    
    if (!childMesh) {
      console.warn('[WARNING] TranslateNode child produced no mesh');
      return null;
    }

    // Extract translation vector
    const translation = extractVector3(node.v, [0, 0, 0]);
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
   * @returns The scaled mesh or null if no child.
   */
  protected visitScale(node: ScaleNode): BABYLON.Mesh | null {
    console.log('[DEBUG] Processing ScaleNode:', node);
    
    if (!node.children || node.children.length === 0) {
      console.warn('[WARNING] ScaleNode has no children');
      return null;
    }

    // Visit the child (scale should have exactly one child)
    const firstChild = node.children[0];
    if (!firstChild) {
      console.warn('[WARNING] ScaleNode first child is undefined');
      return null;
    }

    const childMesh = this.visit(firstChild);
    
    if (!childMesh) {
      console.warn('[WARNING] ScaleNode child produced no mesh');
      return null;
    }

    // Extract scale vector
    const scale = extractVector3(node.v, [1, 1, 1]);
    const [x, y, z] = scale;

    // Apply scaling
    childMesh.scaling.set(x, y, z);
    
    // Update mesh name to reflect the transformation
    childMesh.name = `scale_${childMesh.name}`;
    
    console.log('[DEBUG] Applied scaling:', scale, 'to mesh:', childMesh.name);
    return childMesh;
  }

  /**
   * Extract sphere radius from SphereNode
   */
  private extractSphereRadius(node: SphereNode): number {
    // Check radius first
    if (typeof node.radius === 'number' && node.radius > 0) {
      return node.radius;
    }

    // Check diameter
    if (typeof node.diameter === 'number' && node.diameter > 0) {
      return node.diameter / 2;
    }

    // Default sphere radius
    return 1;
  }

  /**
   * Extract cylinder parameters from CylinderNode
   */
  private extractCylinderParams(node: CylinderNode): { height: number; radius: number } {
    // Extract height
    const height = typeof node.h === 'number' && node.h > 0 ? node.h : 1;

    // Extract radius - prefer r, then r1, then d/2, then d1/2
    let radius = 1; // Default radius
    if (typeof node.r === 'number' && node.r > 0) {
      radius = node.r;
    } else if (typeof node.r1 === 'number' && node.r1 > 0) {
      radius = node.r1;
    } else if (typeof node.d === 'number' && node.d > 0) {
      radius = node.d / 2;
    } else if (typeof node.d1 === 'number' && node.d1 > 0) {
      radius = node.d1 / 2;
    }

    return { height, radius };
  }

  // Private extractVector3 method removed - now using the imported utility function
}
