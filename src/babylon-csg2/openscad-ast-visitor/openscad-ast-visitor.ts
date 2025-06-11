/**
 * @file Enhanced AST visitor for OpenSCAD-to-Babylon.js CSG2 conversion.
 * Updated to use @holistic-stack/openscad-parser AST structure and CSG2 API.
 * 
 * Key improvements:
 * - Uses correct AST node property access (direct properties, not .parameters)
 * - Properly handles ParameterValue types from the parser
 * - Uses CSG2 API correctly (FromMesh, add, subtract, intersect)
 * - Integrates with AST type guards for safety
 * 
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
  TranslateNode,
  ModuleInstantiationNode,
  ModuleDefinitionNode,
  Parameter,
  AssignmentNode,
  ParameterValue,
  ExpressionNode
} from '@holistic-stack/openscad-parser';

import {
  isCubeNode,
  isSphereNode,
  isCylinderNode,
  isUnionNode,
  isDifferenceNode,
  isIntersectionNode,
  isTranslateNode,
  isModuleInstantiationNode,
  isModuleDefinitionNode,
  isScaleNode,
  isAssignmentNode,
  extractCubeSize,
  extractSphereRadius,
  extractCylinderParams,
  extractTranslationVector,
  extractScaleVector
} from '../utils/ast-type-guards';

import * as BABYLON from '@babylonjs/core';
import { ExpressionEvaluator, Scope } from '../utils/expression-evaluator';

/**
 * Enhanced OpenSCAD AST visitor that converts AST nodes to Babylon.js meshes
 * using CSG2 for boolean operations. Integrates with @holistic-stack/openscad-parser
 * and uses type-safe parameter extraction.
 */
export class OpenScadAstVisitor {
  protected scene: BABYLON.Scene;
  private isCSG2Initialized: boolean = false;
  private moduleDefinitions: Map<string, ModuleDefinitionNode>;
  private expressionEvaluator: ExpressionEvaluator;
  private currentScope: Scope;

  /**
   * Initializes the visitor with a Babylon.js scene and module definitions.
   * @param scene The Babylon.js scene to which objects will be added.
   * @param moduleDefinitions A map of module names to their definitions.
   * @param initialScope The initial scope for the expression evaluator.
   */
  constructor(
    scene: BABYLON.Scene,
    moduleDefinitions: Map<string, ModuleDefinitionNode> = new Map(),
    initialScope: Scope = new Map()
  ) {
    this.scene = scene;
    this.moduleDefinitions = moduleDefinitions;
    this.currentScope = initialScope;
    this.expressionEvaluator = new ExpressionEvaluator(this.currentScope);
    console.log('[INIT] OpenScadAstVisitor initialized.');
  }

  /**
   * Initialize CSG2 for boolean operations.
   * Must be called before performing any CSG operations.
   * @returns Promise that resolves when CSG2 is ready
   */
  async initializeCSG2(): Promise<void> {
    if (this.isCSG2Initialized) {
      console.log('[DEBUG] CSG2 already initialized');
      return;
    }

    console.log('[INIT] Initializing CSG2...');
    try {
      // Check if we're in a test environment with mock CSG2
      if ((globalThis as any).__MOCK_CSG2__) {
        console.log('[DEBUG] Using mock CSG2 for tests');
        this.isCSG2Initialized = true;
        return;
      }

      // Try to initialize real CSG2
      if (BABYLON.InitializeCSG2Async) {
        await BABYLON.InitializeCSG2Async();
        this.isCSG2Initialized = true;
        console.log('[DEBUG] CSG2 initialized successfully');
      } else {
        console.warn('[WARN] CSG2 not available, operations will be skipped');
        this.isCSG2Initialized = false;
      }
    } catch (error) {
      console.warn('[WARN] Failed to initialize CSG2, operations will be skipped:', error);
      this.isCSG2Initialized = false;
    }
  }

  /**
   * Check if CSG2 is initialized and ready for use.
   * @returns True if CSG2 is initialized
   */
  isCSG2Ready(): boolean {
    // Check if we're using mock CSG2 for tests
    if ((globalThis as any).__MOCK_CSG2__) {
      return this.isCSG2Initialized;
    }

    // Check real CSG2 availability
    return this.isCSG2Initialized && BABYLON.IsCSG2Ready && BABYLON.IsCSG2Ready();
  }

  /**
   * Dispatches the visit call to the appropriate method based on the node's type.
   * Uses type guards for additional safety.
   * @param node The AST node to visit.
   * @returns The result of visiting the node, typically a Babylon.js mesh or null.
   */
  public visit(node: ASTNode): BABYLON.Mesh | null {
    console.log(`[DEBUG] Visiting node type: ${node.type}`);

    // Use type guards for safe dispatching
    if (isCubeNode(node)) {
      return this.visitCube(node);
    }
    if (isSphereNode(node)) {
      return this.visitSphere(node);
    }
    if (isCylinderNode(node)) {
      return this.visitCylinder(node);
    }
    if (isUnionNode(node)) {
      return this.visitUnion(node);
    }
    if (isDifferenceNode(node)) {
      return this.visitDifference(node);
    }
    if (isIntersectionNode(node)) {
      return this.visitIntersection(node);
    }
    if (isTranslateNode(node)) {
      return this.visitTranslate(node);
    }
    if (isModuleInstantiationNode(node)) {
      return this.visitModuleInstantiation(node);
    }
    if (isModuleDefinitionNode(node)) {
      this.moduleDefinitions.set(node.name.name, node);
      console.log(`[DEBUG] Stored module definition: ${node.name.name}`);
      return null; // Module definitions don't produce meshes directly
    }
    if (isScaleNode(node)) {
      return this.visitScale(node);
    }

    if (isAssignmentNode(node)) {
      return this.visitAssignment(node);
    }

    // If no specific visitor found, log a warning and return null
    console.warn('[WARN] No visitor found for node type:', node.type, node);
    return null;
  }

  /**
   * Visits an AssignmentNode and processes the variable assignment.
   * @param node The AssignmentNode to visit.
   * @returns Null, as assignments do not produce a mesh directly.
   */
  protected visitAssignment(node: AssignmentNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting AssignmentNode:', node.variable.name, '=', node.value);

    try {
      const evaluatedValue = this.expressionEvaluator.evaluate(node.value as ExpressionNode);
      // Note: ExpressionEvaluator doesn't have setVariable method, so we'll update the scope directly
      this.currentScope.set(node.variable.name, evaluatedValue);
      console.log(`[DEBUG] Variable '${node.variable.name}' assigned value:`, evaluatedValue);
    } catch (error) {
      console.error(`[ERROR] Failed to evaluate or assign variable '${node.variable.name}':`, error);
    }

    return null; // Assignments do not produce a mesh directly
  }

  /**
   * Visits a ModuleInstantiationNode.
   * @param node The ModuleInstantiationNode to visit.
   * @returns A Babylon.js mesh representing the module instantiation, or null.
   */
  protected visitModuleInstantiation(node: ModuleInstantiationNode): BABYLON.Mesh | null {
    console.warn(`[WARN] Module calls are not yet fully supported. Module: ${node.name}`);

    const moduleDefinition = this.moduleDefinitions.get(node.name);
    if (!moduleDefinition) {
      console.warn(`[WARN] Module definition for '${node.name}' not found.`);
      return null;
    }

    console.log(`[DEBUG] Module '${node.name}' definition parameters:`, moduleDefinition.parameters);
    console.log(`[DEBUG] Module '${node.name}' call parameters:`, node.args);

    // Create a new scope for the module call
    const newScope = new Map<string, ParameterValue>();

    // Map formal parameters to actual arguments
    for (const formalParam of moduleDefinition.parameters) {
      const actualArg = node.args.find((arg: any) => arg.name === formalParam.name);

      let paramValue: ParameterValue | undefined;

      if (actualArg) {
        // If an actual argument is provided, evaluate its value
        paramValue = this.expressionEvaluator.evaluate(actualArg.value as ExpressionNode);
      } else if (formalParam.defaultValue) {
        // If no actual argument, use the formal parameter's default value
        paramValue = this.expressionEvaluator.evaluate(formalParam.defaultValue as ExpressionNode);
      }

      if (formalParam.name && paramValue !== undefined) {
        newScope.set(formalParam.name, paramValue);
      }
    }

    // Save current scope and evaluator, then set new ones for module execution
    const originalScope = this.currentScope;
    const originalEvaluator = this.expressionEvaluator;

    this.currentScope = this.expressionEvaluator.extendScope(newScope);
    this.expressionEvaluator = new ExpressionEvaluator(this.currentScope);

    let resultMesh: BABYLON.Mesh | null = null;
    const childMeshes: BABYLON.Mesh[] = [];

    if (moduleDefinition.body && moduleDefinition.body.length > 0) {
      // Visit all children of the module definition within the new scope
      for (const childNode of moduleDefinition.body) {
        const childMesh = this.visit(childNode);
        if (childMesh) {
          childMeshes.push(childMesh);
        }
      }
    }

    if (childMeshes.length > 0) {
      // If multiple meshes are generated, union them together
      if (childMeshes.length > 1) {
        // Create a union node to handle the CSG operation
        const unionNode: UnionNode = {
          type: 'union',
          children: [],
          location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } }
        };
        resultMesh = this.performCSGUnion(childMeshes, unionNode);
      } else {
        resultMesh = childMeshes[0]!;
      }
    }

    // Restore original scope and evaluator
    this.expressionEvaluator = originalEvaluator;
    this.currentScope = originalScope;

    return resultMesh;
  }

  /**
   * Visits a CubeNode and creates a Babylon.js box mesh.
   * Uses the extractCubeSize utility for safe parameter extraction.
   * @param node The CubeNode to visit.
   * @returns A Babylon.js mesh representing the cube.
   */
  protected visitCube(node: CubeNode): BABYLON.Mesh {
    console.log('[INIT] Visiting CubeNode', node);

    const sizeResult = extractCubeSize(node);
    if (!sizeResult.success) {
      console.warn(`[WARN] Failed to extract cube size: ${sizeResult.error}`);
      // Use default size
      const defaultSize = [1, 1, 1] as const;
      return this.createBox(defaultSize, node.center ?? false, node);
    }

    const size = sizeResult.value;
    const center = node.center ?? false;

    console.log(`[DEBUG] Creating cube with size: [${size.join(', ')}], center: ${center}`);
    return this.createBox(size, center, node);
  }

  /**
   * Visits a SphereNode and creates a Babylon.js sphere mesh.
   * Uses the extractSphereRadius utility for safe parameter extraction.
   * @param node The SphereNode to visit.
   * @returns A Babylon.js mesh representing the sphere.
   */
  protected visitSphere(node: SphereNode): BABYLON.Mesh {
    console.log('[INIT] Visiting SphereNode', node);

    const radiusResult = extractSphereRadius(node);
    if (!radiusResult.success) {
      console.warn(`[WARN] Failed to extract sphere radius: ${radiusResult.error}`);
      // Use default radius
      return this.createSphere(1, node);
    }

    const radius = radiusResult.value;
    console.log(`[DEBUG] Creating sphere with radius: ${radius}`);
    return this.createSphere(radius, node);
  }

  /**
   * Visits a CylinderNode and creates a Babylon.js cylinder mesh.
   * Uses the extractCylinderParams utility for safe parameter extraction.
   * @param node The CylinderNode to visit.
   * @returns A Babylon.js mesh representing the cylinder.
   */
  protected visitCylinder(node: CylinderNode): BABYLON.Mesh {
    console.log('[INIT] Visiting CylinderNode', node);

    const paramsResult = extractCylinderParams(node);
    if (!paramsResult.success) {
      console.warn(`[WARN] Failed to extract cylinder params: ${paramsResult.error}`);
      // Use default params
      return this.createCylinder({ height: 1, radiusTop: 1, radiusBottom: 1 }, node.center ?? false, node);
    }

    const extractedParams = paramsResult.value;
    const center = node.center ?? false;

    // Convert extracted params to Babylon.js cylinder format
    const params = {
      height: extractedParams.height,
      radiusTop: extractedParams.radius,
      radiusBottom: extractedParams.radius
    };

    console.log(`[DEBUG] Creating cylinder with params:`, params, `center: ${center}`);
    return this.createCylinder(params, center, node);
  }

  /**
   * Visits a UnionNode and merges its children using CSG2 add operations.
   * @param node The UnionNode to visit.
   * @returns A Babylon.js mesh representing the merged geometry, or null.
   */
  protected visitUnion(node: UnionNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting UnionNode with', node.children?.length ?? 0, 'children');

    if (!node.children || node.children.length === 0) {
      console.warn('[WARN] Union has no children to merge.');
      return null;
    }

    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length === 0) {
      console.warn('[WARN] Union has no valid child meshes.');
      return null;
    }

    if (childMeshes.length === 1) {
      console.log('[DEBUG] Union has only one child, returning it directly.');
      return childMeshes[0]!; // Safe access - length check ensures element exists
    }

    console.log(`[DEBUG] Merging ${childMeshes.length} child meshes using CSG2 union operations.`);
    return this.performCSGUnion(childMeshes, node);
  }

  /**
   * Visits a DifferenceNode and subtracts children from the first child using CSG2.
   * @param node The DifferenceNode to visit.
   * @returns A Babylon.js mesh representing the result, or null.
   */
  protected visitDifference(node: DifferenceNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting DifferenceNode with', node.children?.length ?? 0, 'children');

    if (!node.children || node.children.length < 2) {
      console.warn('[WARN] Difference needs at least 2 children.');
      return null;
    }

    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length < 2) {
      console.warn('[WARN] Difference has insufficient valid child meshes.');
      return childMeshes.length === 1 ? childMeshes[0]! : null;
    }

    console.log(`[DEBUG] Performing CSG2 difference operation on ${childMeshes.length} meshes.`);
    return this.performCSGDifference(childMeshes, node);
  }

  /**
   * Visits an IntersectionNode and intersects all children using CSG2.
   * @param node The IntersectionNode to visit.
   * @returns A Babylon.js mesh representing the result, or null.
   */
  protected visitIntersection(node: IntersectionNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting IntersectionNode with', node.children?.length ?? 0, 'children');

    if (!node.children || node.children.length < 2) {
      console.warn('[WARN] Intersection needs at least 2 children.');
      return null;
    }

    const childMeshes = node.children
      .map(child => this.visit(child))
      .filter((mesh): mesh is BABYLON.Mesh => mesh !== null);

    if (childMeshes.length < 2) {
      console.warn('[WARN] Intersection has insufficient valid child meshes.');
      return childMeshes.length === 1 ? childMeshes[0]! : null;
    }

    console.log(`[DEBUG] Performing CSG2 intersection operation on ${childMeshes.length} meshes.`);
    return this.performCSGIntersection(childMeshes, node);
  }

  /**
   * Visits a TranslateNode and applies translation to its child.
   * @param node The TranslateNode to visit.
   * @returns A Babylon.js mesh with translation applied, or null.
   */
  protected visitTranslate(node: TranslateNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting TranslateNode');

    if (!node.children || node.children.length === 0) {
      console.warn('[WARN] Translate has no children.');
      return null;
    }

    const translationResult = extractTranslationVector(node);
    if (!translationResult.success) {
      console.warn(`[WARN] Failed to extract translation vector: ${translationResult.error}`);
      // Use zero translation as fallback
      const translation = [0, 0, 0] as const;
      return this.applyTranslation(node.children[0]!, translation, node);
    }

    const translation = translationResult.value;
    console.log(`[DEBUG] Applying translation: [${translation.join(', ')}]`);
    return this.applyTranslation(node.children[0]!, translation, node);
  }

  /**
   * Visits a ScaleNode and applies scaling to its child.
   * @param node The ScaleNode to visit.
   * @returns A Babylon.js mesh with scaling applied, or null.
   */
  protected visitScale(node: ScaleNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting ScaleNode');

    if (!node.children || node.children.length === 0) {
      console.warn('[WARN] Scale has no children.');
      return null;
    }

    const scaleResult = extractScaleVector(node);
    if (!scaleResult.success) {
      console.warn(`[WARN] Failed to extract scale vector: ${scaleResult.error}`);
      // Use default scale as fallback
      const scale = [1, 1, 1] as const;
      return this.applyScale(node.children[0]!, scale, node);
    }
    const scale = scaleResult.value;
    return this.applyScale(node.children[0]!, scale, node);
  }

  /**
   * Applies scaling to a child node.
   */
  private applyScale(
    childNode: ASTNode,
    scale: readonly [number, number, number],
    node: ScaleNode
  ): BABYLON.Mesh | null {
    const childMesh = this.visit(childNode);
    if (!childMesh) {
      console.warn('[WARN] Scale has no valid child mesh.');
      return null;
    }

    childMesh.scaling = new BABYLON.Vector3(scale[0], scale[1], scale[2]);
    console.log(`[DEBUG] Applied scaling: [${scale.join(', ')}]`);
    return childMesh;
  }

  // Helper methods for mesh creation

  /**
   * Creates a Babylon.js box mesh with the specified parameters.
   */
  private createBox(size: readonly [number, number, number], center: boolean, node: CubeNode): BABYLON.Mesh {
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
    if (!center) {
      box.position = new BABYLON.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
    }

    // Add a default material for visibility
    if (!box.material) {
      const material = new BABYLON.StandardMaterial(`${box.name}_material`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4); // Orange-ish color
      material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      box.material = material;
    }

    console.log('[DEBUG] Created box mesh:', {
      name: box.name,
      vertices: box.getTotalVertices(),
      indices: box.getTotalIndices(),
      isVisible: box.isVisible,
      isEnabled: box.isEnabled(),
      hasGeometry: box.geometry !== null,
      hasMaterial: box.material !== null,
      scene: box.getScene()?.constructor.name,
      sceneUid: box.getScene()?.uid
    });
    return box;
  }

  /**
   * Creates a Babylon.js sphere mesh with the specified radius.
   */
  private createSphere(radius: number, node: SphereNode): BABYLON.Mesh {
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `sphere_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        diameter: radius * 2, // Babylon uses diameter
        segments: 32, // Default segments for sphere
      },
      this.scene
    );

    // Add a default material for visibility
    if (!sphere.material) {
      const material = new BABYLON.StandardMaterial(`${sphere.name}_material`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.6, 0.8, 0.4); // Green-ish color
      material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      sphere.material = material;
    }

    console.log('[DEBUG] Created sphere mesh:', sphere.name, 'with material');
    return sphere;
  }

  /**
   * Creates a Babylon.js cylinder mesh with the specified parameters.
   */
  private createCylinder(
    params: { height: number; radiusTop: number; radiusBottom: number }, 
    center: boolean, 
    node: CylinderNode
  ): BABYLON.Mesh {
    const cylinder = BABYLON.MeshBuilder.CreateCylinder(
      `cylinder_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        height: params.height,
        diameterTop: params.radiusTop * 2,
        diameterBottom: params.radiusBottom * 2,
        tessellation: 32, // Default tessellation for cylinder
      },
      this.scene
    );

    // If not centered, move the cylinder up by half its height so its base is at the origin.
    if (!center) {
      cylinder.position = new BABYLON.Vector3(0, params.height / 2, 0);
    }

    // Add a default material for visibility
    if (!cylinder.material) {
      const material = new BABYLON.StandardMaterial(`${cylinder.name}_material`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.8); // Blue-ish color
      material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      cylinder.material = material;
    }

    console.log('[DEBUG] Created cylinder mesh:', cylinder.name, 'with material');
    return cylinder;
  }

  // Helper methods for CSG operations

  /**
   * Performs CSG2 union operation on multiple meshes.
   */
  private performCSGUnion(meshes: BABYLON.Mesh[], node: UnionNode): BABYLON.Mesh {
    if (!this.isCSG2Ready()) {
      console.warn('[WARN] CSG2 not available, returning first mesh for union');
      return meshes[0]!; // Safe access - caller ensures non-empty array
    }

    // Use mock CSG2 if available
    const CSG2Class = (globalThis as any).__MOCK_CSG2__ || BABYLON.CSG2;
    let baseCsg = CSG2Class.FromMesh(meshes[0]!);

    for (let i = 1; i < meshes.length; i++) {
      const childCsg = CSG2Class.FromMesh(meshes[i]!);
      const newBaseCsg = baseCsg.add(childCsg); // CSG2 uses 'add' for union

      // Dispose previous CSG to prevent memory leaks
      baseCsg.dispose();
      childCsg.dispose();
      baseCsg = newBaseCsg;
    }

    // Dispose original meshes
    meshes.forEach(mesh => mesh.dispose());

    const finalMesh = baseCsg.toMesh(
      `union_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      this.scene
    );

    baseCsg.dispose();
    console.log('[DEBUG] Created union mesh:', finalMesh.name);
    return finalMesh;
  }

  /**
   * Performs CSG2 difference operation on multiple meshes.
   */
  private performCSGDifference(meshes: BABYLON.Mesh[], node: DifferenceNode): BABYLON.Mesh {
    if (!this.isCSG2Ready()) {
      console.warn('[WARN] CSG2 not available, returning first mesh for difference');
      return meshes[0]!; // Safe access - caller ensures non-empty array
    }

    // Use mock CSG2 if available
    const CSG2Class = (globalThis as any).__MOCK_CSG2__ || BABYLON.CSG2;
    let baseCsg = CSG2Class.FromMesh(meshes[0]!);

    for (let i = 1; i < meshes.length; i++) {
      const childCsg = CSG2Class.FromMesh(meshes[i]!);
      const newBaseCsg = baseCsg.subtract(childCsg); // CSG2 uses 'subtract' for difference

      // Dispose previous CSG to prevent memory leaks
      baseCsg.dispose();
      childCsg.dispose();
      baseCsg = newBaseCsg;
    }

    // Dispose original meshes
    meshes.forEach(mesh => mesh.dispose());

    const finalMesh = baseCsg.toMesh(
      `difference_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      this.scene
    );

    baseCsg.dispose();
    console.log('[DEBUG] Created difference mesh:', finalMesh.name);
    return finalMesh;
  }

  /**
   * Performs CSG2 intersection operation on multiple meshes.
   */
  private performCSGIntersection(meshes: BABYLON.Mesh[], node: IntersectionNode): BABYLON.Mesh {
    if (!this.isCSG2Ready()) {
      console.warn('[WARN] CSG2 not available, returning first mesh for intersection');
      return meshes[0]!; // Safe access - caller ensures non-empty array
    }

    // Use mock CSG2 if available
    const CSG2Class = (globalThis as any).__MOCK_CSG2__ || BABYLON.CSG2;
    let baseCsg = CSG2Class.FromMesh(meshes[0]!);

    for (let i = 1; i < meshes.length; i++) {
      const childCsg = CSG2Class.FromMesh(meshes[i]!);
      const newBaseCsg = baseCsg.intersect(childCsg); // CSG2 uses 'intersect' for intersection

      // Dispose previous CSG to prevent memory leaks
      baseCsg.dispose();
      childCsg.dispose();
      baseCsg = newBaseCsg;
    }

    // Dispose original meshes
    meshes.forEach(mesh => mesh.dispose());

    const finalMesh = baseCsg.toMesh(
      `intersection_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      this.scene
    );

    baseCsg.dispose();
    console.log('[DEBUG] Created intersection mesh:', finalMesh.name);
    return finalMesh;
  }

  /**
   * Applies translation to a child node.
   */
  private applyTranslation(
    childNode: ASTNode, 
    translation: readonly [number, number, number], 
    node: TranslateNode
  ): BABYLON.Mesh | null {
    const childMesh = this.visit(childNode);
    if (!childMesh) {
      console.warn('[WARN] Translate has no valid child mesh.');
      return null;
    }

    childMesh.position = new BABYLON.Vector3(translation[0], translation[1], translation[2]);
    console.log(`[DEBUG] Applied translation to mesh: ${childMesh.name}`);
    return childMesh;
  }
}
