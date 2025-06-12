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
  CircleNode,
  SquareNode,
  PolygonNode,
  UnionNode,
  DifferenceNode,
  IntersectionNode,
  ScaleNode,
  TranslateNode,
  RotateNode,
  MirrorNode,
  ModuleInstantiationNode,
  ModuleDefinitionNode,
  AssignmentNode,
  ParameterValue,
  ExpressionNode,
  SpecialVariableAssignment, // Added for $fa, $fs, $fn
  IfNode, // Added for conditional logic
  IdentifierNode // Added for completeness if used in Scope
} from '@holistic-stack/openscad-parser';

import {
  isCubeNode,
  isSphereNode,
  isCylinderNode,
  isCircleNode,
  isSquareNode,
  isPolygonNode,
  isUnionNode,
  isDifferenceNode,
  isIntersectionNode,
  isTranslateNode,
  isRotateNode,
  isMirrorNode,
  isModuleInstantiationNode,
  isModuleDefinitionNode,
  isScaleNode,
  isAssignmentNode,
  extractCubeSize,
  extractSphereRadius,
  extractCylinderParams,
  extractCircleRadius,
  extractSquareSize,
  extractPolygonPoints,
  extractTranslationVector,
  extractScaleVector,
  isSpecialVariableAssignmentNode, // Added for $fa, $fs, $fn
  isIfNode // Added for conditional logic
} from '../utils/ast-type-guards';

import * as BABYLON from '@babylonjs/core';
import { ExpressionEvaluator, Scope } from '../utils/expression-evaluator';

// Type definition for storing special variable context ($fa, $fs, $fn)
type TessellationOptions = {
  segments?: number; // Removed readonly
  rings?: number; // Removed readonly
};

type SpecialVariablesContext = {
  $fa: number | undefined; // Removed readonly
  $fs: number | undefined; // Removed readonly
  $fn: number | undefined; // Removed readonly
};

/**
 * Enhanced OpenSCAD AST visitor that converts AST nodes to Babylon.js meshes
 * using CSG2 for boolean operations. Integrates with @holistic-stack/openscad-parser
 * and uses type-safe parameter extraction.
 */
export class OpenScadAstVisitor {
  protected readonly scene: BABYLON.Scene; // Added readonly
  private isCSG2Initialized: boolean = false;
  private moduleDefinitions: Map<string, ModuleDefinitionNode>; // Kept as mutable Map
  private expressionEvaluator: ExpressionEvaluator;
  private currentScope: Scope; 
  private specialVariablesContext: SpecialVariablesContext;

  /**
   * Initializes the visitor with a Babylon.js scene and module definitions.
   * @param scene The Babylon.js scene to which objects will be added.
   * @param moduleDefinitions A map of module names to their definitions.
   * @param initialScope The initial scope for the expression evaluator.
   */
  constructor(
    scene: BABYLON.Scene,
    moduleDefinitions: Map<string, ModuleDefinitionNode> = new Map(), // Kept as mutable Map
    initialScope: Scope = new Map()
  ) {
    this.scene = scene;
    this.moduleDefinitions = moduleDefinitions; 
    this.currentScope = new Map(initialScope); 
    this.expressionEvaluator = new ExpressionEvaluator(this.currentScope);
    this.specialVariablesContext = {
      $fa: 12, 
      $fs: 2,
      $fn: undefined,
    };
    console.log('[INIT] OpenScadAstVisitor initialized. Special variables context:', this.specialVariablesContext);
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
      const globalWithMock = globalThis as { __MOCK_CSG2__?: unknown };
      if (globalWithMock.__MOCK_CSG2__) {
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
    const globalWithMock = globalThis as { __MOCK_CSG2__?: unknown };
    if (globalWithMock.__MOCK_CSG2__) {
      return this.isCSG2Initialized;
    }

    // Check real CSG2 availability
    return this.isCSG2Initialized && BABYLON.IsCSG2Ready?.() === true;
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
    // 3D Primitives
    if (isCubeNode(node)) {
      return this.visitCube(node);
    }
    if (isSphereNode(node)) {
      return this.visitSphere(node);
    }
    if (isCylinderNode(node)) {
      return this.visitCylinder(node);
    }

    // 2D Primitives
    if (isCircleNode(node)) {
      return this.visitCircle(node);
    }
    if (isSquareNode(node)) {
      return this.visitSquare(node);
    }
    if (isPolygonNode(node)) {
      return this.visitPolygon(node);
    }

    // CSG Operations
    if (isUnionNode(node)) {
      return this.visitUnion(node);
    }
    if (isDifferenceNode(node)) {
      return this.visitDifference(node);
    }
    if (isIntersectionNode(node)) {
      return this.visitIntersection(node);
    }

    // Transformations
    if (isTranslateNode(node)) {
      return this.visitTranslate(node);
    }
    if (isRotateNode(node)) {
      return this.visitRotate(node);
    }
    if (isMirrorNode(node)) {
      return this.visitMirror(node);
    }
    if (isScaleNode(node)) {
      return this.visitScale(node);
    }

    // Module System
    if (isModuleInstantiationNode(node)) {
      return this.visitModuleInstantiation(node);
    }
    if (isModuleDefinitionNode(node)) {
      this.moduleDefinitions.set(node.name.name, node);
      console.log(`[DEBUG] Stored module definition: ${node.name.name}`);
      return null; // Module definitions don't produce meshes directly
    }

    // Variables and Control Flow
    if (isAssignmentNode(node)) {
      return this.visitAssignment(node);
    }
    if (isSpecialVariableAssignmentNode(node)) { // Handle $fa, $fs, $fn
      return this.visitSpecialVariableAssignment(node);
    }
    if (isIfNode(node)) {
      return this.visitIfNode(node);
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
    const variableName = node.variable.name;
    console.log('[DEBUG] Visiting AssignmentNode:', variableName, '=', node.value);
    // Attempt to evaluate the expression if it's an ExpressionNode
    // The parser ensures 'value' is an ExpressionNode for assignments.
    try {
      // Ensure node.value is treated as ExpressionNode for evaluation
      const evaluatedValue = this.expressionEvaluator.evaluate(node.value as ExpressionNode);
      this.currentScope.set(variableName, evaluatedValue); // Update current scope
      console.log(`[DEBUG] Variable '${variableName}' assigned value:`, evaluatedValue, 'in scope:', this.currentScope);
    } catch (error) {
      console.error(`[ERROR] Failed to evaluate or assign variable '${variableName}':`, error);
      // Decide if to throw, or just log and continue. For now, log and continue.
    }
    return null; // Assignments do not produce a mesh directly
  }

  /**
   * Visits a SpecialVariableAssignment and updates the special variables context.
   * These variables ($fa, $fs, $fn) affect the tessellation of subsequent primitives.
   * @param node The SpecialVariableAssignment to visit.
   * @returns Null, as this assignment does not produce a mesh directly.
   */
  public visitSpecialVariableAssignment(node: SpecialVariableAssignment): BABYLON.Mesh | null {
    console.log(`[DEBUG] Visiting SpecialVariableAssignmentNode: ${node.variable} = ${node.value}`);
    // Ensure the value is a number, as $fa, $fs, $fn expect numeric values.
    // The parser should enforce this, but an extra check is good.
    if (typeof node.value !== 'number') {
      console.warn(`[WARN] Special variable ${node.variable} received non-numeric value: ${JSON.stringify(node.value)}. Expected a number. Ignoring assignment.`);
      return null;
    }

    switch (node.variable) {
      case '$fa':
        this.specialVariablesContext.$fa = node.value > 0 ? node.value : 12; // Min value for $fa is typically small but positive
        if (node.value <= 0) console.warn(`[WARN] $fa value ${node.value} is not positive, using default 12.`);
        break;
      case '$fs':
        this.specialVariablesContext.$fs = node.value > 0 ? node.value : 2; // Min value for $fs is typically small but positive
        if (node.value <= 0) console.warn(`[WARN] $fs value ${node.value} is not positive, using default 2.`);
        break;
      case '$fn':
        // $fn must be an integer >= 0. If 0, it's auto-calculated. Store undefined for auto.
        // If positive, it's an explicit segment count.
        this.specialVariablesContext.$fn = node.value > 0 ? Math.round(node.value) : undefined;
        if (node.value < 0) console.warn(`[WARN] $fn value ${node.value} is negative, treating as auto (undefined).`);
        else if (node.value > 0 && node.value !== Math.round(node.value)) console.warn(`[WARN] $fn value ${node.value} is not an integer, rounded to ${Math.round(node.value)}.`);
        else if (node.value === 0) this.specialVariablesContext.$fn = undefined; // Explicitly $fn=0 means auto
        break;
      default:
        // This case should ideally not be reached if the parser only allows valid special variables ($fa, $fs, $fn).
        console.warn(`[WARN] Encountered an unknown or unhandled special variable: ${node.variable}. Ignoring assignment.`);
        break;
    }
    console.log('[DEBUG] Updated specialVariablesContext:', this.specialVariablesContext);
    return null; // This operation does not produce a mesh.
  }

  /**
   * Visits an IfNode and processes its conditional logic.
   * Evaluates the condition and visits either the 'then' or 'else' branch.
   * @param node The IfNode to visit.
   * @returns A Babylon.js mesh from the executed branch, or null.
   */
  protected visitIfNode(node: IfNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting IfNode', node);

    const conditionValue = this.expressionEvaluator.evaluate(node.condition);
    console.log(`[DEBUG] IfNode condition '${node.condition.type}' evaluated to:`, conditionValue);

    if (typeof conditionValue !== 'boolean') {
      const valueStr = typeof conditionValue === 'object' && conditionValue !== null
        ? JSON.stringify(conditionValue)
        : String(conditionValue);
      console.warn(`[WARN] IfNode condition did not evaluate to a boolean. Got: ${typeof conditionValue} (${valueStr}). Assuming false.`);
      // OpenSCAD treats non-boolean conditions as false, except for numbers (0 is false, non-zero is true)
      // For simplicity here, non-booleans other than numbers could be treated as false or an error.
      // Let's refine this based on OpenSCAD's exact behavior for various types if needed.
      if (typeof conditionValue === 'number') {
        if (conditionValue !== 0) {
          console.log('[DEBUG] Condition (number) is non-zero, executing thenBranch.');
          return this.visitBranch(node.thenBranch);
        } else {
          console.log('[DEBUG] Condition (number) is zero, attempting elseBranch.');
          return node.elseBranch ? this.visitBranch(node.elseBranch) : null;
        }
      }
      // Default for other non-boolean types: execute else branch or return null
      console.log('[DEBUG] Condition (non-boolean, non-number) is false, attempting elseBranch.');
      return node.elseBranch ? this.visitBranch(node.elseBranch) : null;
    }

    if (conditionValue) {
      console.log('[DEBUG] Condition is true, executing thenBranch.');
      return this.visitBranch(node.thenBranch);
    } else {
      console.log('[DEBUG] Condition is false, attempting elseBranch.');
      return node.elseBranch ? this.visitBranch(node.elseBranch) : null;
    }
  }

  /**
   * Visits a branch (array of AST nodes) and returns the first mesh found,
   * or combines multiple meshes if needed.
   * @param branch Array of AST nodes to visit
   * @returns A Babylon.js mesh or null
   */
  private visitBranch(branch: ReadonlyArray<ASTNode>): BABYLON.Mesh | null { // Added ReadonlyArray
    if (!branch || branch.length === 0) {
      return null;
    }

    const meshes: BABYLON.Mesh[] = [];
    for (const node of branch) {
      const mesh = this.visit(node);
      if (mesh) {
        meshes.push(mesh);
      }
    }

    if (meshes.length === 0) {
      return null;
    } else if (meshes.length === 1) {
      const firstMesh = meshes[0];
      return firstMesh ?? null;
    } else {
      // Multiple meshes - union them together
      console.log(`[DEBUG] Branch produced ${meshes.length} meshes, combining with union`);
      const unionNode: UnionNode = {
        type: 'union',
        children: [],
        location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 0, offset: 0 } }
      };
      return this.performCSGUnion(meshes, unionNode);
    }
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

    const newScope: Map<string, ParameterValue> = new Map<string, ParameterValue>(); // Explicitly type newScope

    // Map formal parameters to actual arguments
    // Assuming moduleDefinition.parameters and node.args are ReadonlyArray from parser types or should be treated so
    for (const formalParam of (moduleDefinition.parameters as ReadonlyArray<{name: string, defaultValue?: ExpressionNode}>)) {
      const actualArg = (node.args as ReadonlyArray<{name?: IdentifierNode | string, value: ExpressionNode}>).find((arg) => {
        const argName = typeof arg.name === 'string' ? arg.name : arg.name?.name;
        return argName === formalParam.name;
      });

      let paramValue: ParameterValue | undefined;

      if (actualArg) {
        // If an actual argument is provided, evaluate its value
        paramValue = this.expressionEvaluator.evaluate(actualArg.value);
      } else if (formalParam.defaultValue) {
        // If no actual argument, use the formal parameter's default value
        paramValue = this.expressionEvaluator.evaluate(formalParam.defaultValue);
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
      // Assuming moduleDefinition.body is ReadonlyArray from parser types or should be treated so
      for (const childNode of (moduleDefinition.body as ReadonlyArray<ASTNode>)) {
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
        const firstChildMesh = childMeshes[0];
        resultMesh = firstChildMesh ?? null;
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


  private _calculateTessellationParameters(
    node: SphereNode | CylinderNode,
    characteristicDimension: number, // e.g., radius for sphere/cylinder
    isSphere: boolean = false
  ): TessellationOptions {
    const options: TessellationOptions = {};
    const minSegments = 3; // OpenSCAD minimum is 3
    const defaultSegments = 32; // A reasonable default if nothing else is specified

    // Extract tessellation parameters directly from the node
    // Note: Property names might be different, using safe access
    const nodeWithParams = node as { $fn?: number; fn?: number; $fa?: number; fa?: number; $fs?: number; fs?: number };
    const fnFromParams = nodeWithParams.$fn ?? nodeWithParams.fn;
    const faFromParams = nodeWithParams.$fa ?? nodeWithParams.fa;
    const fsFromParams = nodeWithParams.$fs ?? nodeWithParams.fs;

    const fn = fnFromParams !== undefined && fnFromParams > 0 ? Math.round(fnFromParams) :
             this.specialVariablesContext.$fn;
    const fa = faFromParams !== undefined && faFromParams > 0 ? faFromParams :
             this.specialVariablesContext.$fa;
    const fs = fsFromParams !== undefined && fsFromParams > 0 ? fsFromParams :
             this.specialVariablesContext.$fs;

    if (fn !== undefined && fn > 0) {
      options.segments = Math.max(minSegments, fn);
    } else if (fa !== undefined && fa > 0) {
      options.segments = Math.max(minSegments, Math.round(360 / fa));
    } else if (fs !== undefined && fs > 0 && characteristicDimension > 0) {
      options.segments = Math.max(minSegments, Math.round((characteristicDimension * 2 * Math.PI) / fs));
    } else {
      options.segments = defaultSegments;
    }

    if (isSphere) {
      options.rings = Math.max(Math.round(minSegments / 2), Math.round(options.segments / 2)); // Often half of segments for spheres
    }
    
    console.log(`[DEBUG] Tessellation calculated for dim ${characteristicDimension}: segments=${options.segments}, rings=${options.rings} (fn=${fn}, fa=${fa}, fs=${fs}, p_fn=${fnFromParams}, p_fa=${faFromParams}, p_fs=${fsFromParams})`);
    return options;
  }

  protected visitSphere(node: SphereNode): BABYLON.Mesh {
    console.log('[INIT] Visiting SphereNode', node);

    const radiusResult = extractSphereRadius(node);
    if (!radiusResult.success) {
      console.warn(`[WARN] Failed to extract sphere radius: ${radiusResult.error}. Using default radius 1.`);
      // For default, calculate tessellation based on default radius 1
      const tessellationParams = this._calculateTessellationParameters(node, 1, true);
      return this.createSphere(1, tessellationParams, node);
    }

    const radius = radiusResult.value;
    console.log(`[DEBUG] Creating sphere with radius: ${radius}`);
    const tessellationParams = this._calculateTessellationParameters(node, radius, true);
    return this.createSphere(radius, tessellationParams, node);
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
    const center = node.center ?? false; // Default to false if not specified

    if (!paramsResult.success) {
      console.warn(`[WARN] Failed to extract cylinder params: ${paramsResult.error}. Using default params.`);
      // For default, calculate tessellation based on default radius 1
      const babylonParamsForCreate = { height: 1, radiusTop: 1, radiusBottom: 1 };
      const tessellationParams = this._calculateTessellationParameters(node, 1, false); // Use r=1 for default
      return this.createCylinder(babylonParamsForCreate, center, tessellationParams, node);
    }

    const extractedParams = paramsResult.value; // { radius: number; height: number }

    // For now, use the same radius for top and bottom (simple cylinder)
    // TODO: Add support for cones (r1, r2) in the future
    const radius = extractedParams.radius;
    const height = extractedParams.height;

    const babylonParams = {
      height: height,
      radiusTop: radius,
      radiusBottom: radius
    };

    // Use radius as the characteristic dimension for tessellation calculation
    const characteristicRadius = radius;
    const tessellationParams = this._calculateTessellationParameters(node, characteristicRadius, false);
    
    console.log(`[DEBUG] Creating cylinder with Babylon params:`, babylonParams, `center: ${center}`);
    return this.createCylinder(babylonParams, center, tessellationParams, node);
  }

  // ============================================================================
  // 2D PRIMITIVE VISITOR METHODS
  // ============================================================================

  /**
   * Visits a CircleNode and creates a Babylon.js 2D circle mesh.
   * Uses the extractCircleRadius utility for safe parameter extraction.
   * @param node The CircleNode to visit.
   * @returns A Babylon.js mesh representing the 2D circle.
   */
  protected visitCircle(node: CircleNode): BABYLON.Mesh {
    console.log('[INIT] Visiting CircleNode', node);

    const radiusResult = extractCircleRadius(node);
    if (!radiusResult.success) {
      console.warn(`[WARN] Failed to extract circle radius: ${radiusResult.error}. Using default radius 1.`);
      return this.createCircle(1, node);
    }

    const radius = radiusResult.value;
    console.log(`[DEBUG] Creating circle with radius: ${radius}`);
    return this.createCircle(radius, node);
  }

  /**
   * Visits a SquareNode and creates a Babylon.js 2D square/rectangle mesh.
   * Uses the extractSquareSize utility for safe parameter extraction.
   * @param node The SquareNode to visit.
   * @returns A Babylon.js mesh representing the 2D square/rectangle.
   */
  protected visitSquare(node: SquareNode): BABYLON.Mesh {
    console.log('[INIT] Visiting SquareNode', node);

    const sizeResult = extractSquareSize(node);
    if (!sizeResult.success) {
      console.warn(`[WARN] Failed to extract square size: ${sizeResult.error}. Using default size [1, 1].`);
      return this.createSquare([1, 1], node.center ?? false, node);
    }

    const size = sizeResult.value;
    const center = node.center ?? false;
    console.log(`[DEBUG] Creating square with size: [${size.join(', ')}], center: ${center}`);
    return this.createSquare(size, center, node);
  }

  /**
   * Visits a PolygonNode and creates a Babylon.js 2D polygon mesh.
   * Uses the extractPolygonPoints utility for safe parameter extraction.
   * @param node The PolygonNode to visit.
   * @returns A Babylon.js mesh representing the 2D polygon.
   */
  protected visitPolygon(node: PolygonNode): BABYLON.Mesh {
    console.log('[INIT] Visiting PolygonNode', node);

    const pointsResult = extractPolygonPoints(node);
    if (!pointsResult.success) {
      console.warn(`[WARN] Failed to extract polygon points: ${pointsResult.error}. Creating default triangle.`);
      // Create a default triangle
      const defaultPoints: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [0.5, 1]];
      return this.createPolygon(defaultPoints, node);
    }

    const points = pointsResult.value;
    console.log(`[DEBUG] Creating polygon with ${points.length} points`);
    return this.createPolygon(points, node);
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
      const firstChildMesh = childMeshes[0];
      return firstChildMesh ?? null;
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
      const firstMesh = childMeshes[0];
      return childMeshes.length === 1 && firstMesh ? firstMesh : null;
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
      const firstMesh = childMeshes[0];
      return childMeshes.length === 1 && firstMesh ? firstMesh : null;
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
      const firstChild = node.children[0];
      return firstChild ? this.applyTranslation(firstChild, translation, node) : null;
    }

    const translation = translationResult.value;
    console.log(`[DEBUG] Applying translation: [${translation.join(', ')}]`);
    const firstChild = node.children[0];
    return firstChild ? this.applyTranslation(firstChild, translation, node) : null;
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
      const firstChild = node.children[0];
      return firstChild ? this.applyScale(firstChild, scale, node) : null;
    }
    const scale = scaleResult.value;
    const firstChild = node.children[0];
    return firstChild ? this.applyScale(firstChild, scale, node) : null;
  }

  /**
   * Applies scaling to a child node.
   */
  private applyScale(
    childNode: ASTNode,
    scale: readonly [number, number, number],
    _node: ScaleNode
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

  /**
   * Visits a RotateNode and applies rotation to its child.
   * @param node The RotateNode to visit.
   * @returns A Babylon.js mesh with rotation applied, or null.
   */
  protected visitRotate(node: RotateNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting RotateNode', node);

    if (!node.children || node.children.length === 0) {
      console.warn('[WARN] Rotate has no children.');
      return null;
    }

    // Extract rotation parameters
    const rotationResult = this.extractRotationParameters(node);
    if (!rotationResult.success) {
      console.warn(`[WARN] Failed to extract rotation parameters: ${rotationResult.error}`);
      // Use zero rotation as fallback
      const rotation = [0, 0, 0] as const;
      const firstChild = node.children[0];
      return firstChild ? this.applyRotation(firstChild, rotation, node) : null;
    }

    const rotation = rotationResult.value;
    console.log(`[DEBUG] Applying rotation: [${rotation.join(', ')}] degrees`);
    const firstChild = node.children[0];
    return firstChild ? this.applyRotation(firstChild, rotation, node) : null;
  }

  /**
   * Extracts rotation parameters from a RotateNode.
   * Handles both Euler angles and axis-angle rotation.
   */
  private extractRotationParameters(node: RotateNode): { success: true; value: readonly [number, number, number] } | { success: false, error: string } {
    try {
      // Case 1: Euler angles - 'a' is a Vector3D [x, y, z]
      if (Array.isArray(node.a)) {
        if (node.a.length === 3) {
          return { success: true, value: [node.a[0], node.a[1], node.a[2]] as const };
        } else {
          return { success: false, error: `Invalid Euler angles array length: ${node.a.length}, expected 3` };
        }
      }

      // Case 2: Axis-angle rotation - 'a' is a number (angle) and 'v' is the axis
      if (typeof node.a === 'number') {
        if (node.v && Array.isArray(node.v) && node.v.length === 3) {
          // Convert axis-angle to Euler angles (simplified approach)
          // For now, we'll apply the rotation around the specified axis
          const angle = node.a;
          const axis = node.v;

          // Determine which axis has the highest component and apply rotation there
          const absX = Math.abs(axis[0]);
          const absY = Math.abs(axis[1]);
          const absZ = Math.abs(axis[2]);

          if (absX >= absY && absX >= absZ) {
            // Primarily X-axis rotation
            return { success: true, value: [angle * Math.sign(axis[0]), 0, 0] as const };
          } else if (absY >= absX && absY >= absZ) {
            // Primarily Y-axis rotation
            return { success: true, value: [0, angle * Math.sign(axis[1]), 0] as const };
          } else {
            // Primarily Z-axis rotation
            return { success: true, value: [0, 0, angle * Math.sign(axis[2])] as const };
          }
        } else {
          // Single angle without axis - assume Z-axis rotation (OpenSCAD default)
          return { success: true, value: [0, 0, node.a] as const };
        }
      }

      return { success: false, error: `Invalid rotation parameter type: ${typeof node.a}` };
    } catch (error) {
      return { success: false, error: `Error extracting rotation parameters: ${error}` };
    }
  }

  /**
   * Applies rotation to a child node.
   */
  private applyRotation(
    childNode: ASTNode,
    rotation: readonly [number, number, number],
    _node: RotateNode
  ): BABYLON.Mesh | null {
    const childMesh = this.visit(childNode);
    if (!childMesh) {
      console.warn('[WARN] Rotate has no valid child mesh.');
      return null;
    }

    // Convert degrees to radians and apply rotation
    const rotationRadians = [
      (rotation[0] * Math.PI) / 180,
      (rotation[1] * Math.PI) / 180,
      (rotation[2] * Math.PI) / 180
    ];

    childMesh.rotation = new BABYLON.Vector3(rotationRadians[0], rotationRadians[1], rotationRadians[2]);
    console.log(`[DEBUG] Applied rotation to mesh: ${childMesh.name}, rotation: [${rotation.join(', ')}] degrees`);
    return childMesh;
  }

  /**
   * Visits a MirrorNode and applies mirroring to its child.
   * @param node The MirrorNode to visit.
   * @returns A Babylon.js mesh with mirroring applied, or null.
   */
  protected visitMirror(node: MirrorNode): BABYLON.Mesh | null {
    console.log('[INIT] Visiting MirrorNode', node);

    if (!node.children || node.children.length === 0) {
      console.warn('[WARN] Mirror has no children.');
      return null;
    }

    // Extract mirror normal vector
    const mirrorResult = this.extractMirrorParameters(node);
    if (!mirrorResult.success) {
      console.warn(`[WARN] Failed to extract mirror parameters: ${mirrorResult.error}`);
      // Use default X-axis mirror as fallback
      const normal = [1, 0, 0] as const;
      const firstChild = node.children[0];
      return firstChild ? this.applyMirror(firstChild, normal, node) : null;
    }

    const normal = mirrorResult.value;
    console.log(`[DEBUG] Applying mirror with normal: [${normal.join(', ')}]`);
    const firstChild = node.children[0];
    return firstChild ? this.applyMirror(firstChild, normal, node) : null;
  }

  /**
   * Extracts mirror normal vector from a MirrorNode.
   */
  private extractMirrorParameters(node: MirrorNode): { success: true; value: readonly [number, number, number] } | { success: false, error: string } {
    try {
      if (!node.v) {
        return { success: false, error: 'Mirror node missing normal vector (v)' };
      }

      if (!Array.isArray(node.v) || node.v.length !== 3) {
        return { success: false, error: `Invalid mirror normal vector: expected [x,y,z], got ${JSON.stringify(node.v)}` };
      }

      const [x, y, z] = node.v;
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        return { success: false, error: `Mirror normal vector contains non-numeric values: [${x}, ${y}, ${z}]` };
      }

      // Check for zero vector (invalid)
      if (x === 0 && y === 0 && z === 0) {
        return { success: false, error: 'Mirror normal vector cannot be zero vector [0,0,0]' };
      }

      return { success: true, value: [x, y, z] as const };
    } catch (error) {
      return { success: false, error: `Error extracting mirror parameters: ${error}` };
    }
  }

  /**
   * Applies mirroring to a child node using reflection matrix.
   * Mirror always works around the origin (0,0,0) with the given normal vector.
   */
  private applyMirror(
    childNode: ASTNode,
    normal: readonly [number, number, number],
    _node: MirrorNode
  ): BABYLON.Mesh | null {
    const childMesh = this.visit(childNode);
    if (!childMesh) {
      console.warn('[WARN] Mirror has no valid child mesh.');
      return null;
    }

    // Normalize the normal vector
    const [nx, ny, nz] = normal;
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const nnx = nx / length;
    const nny = ny / length;
    const nnz = nz / length;

    // Create reflection matrix for mirroring across plane with given normal
    // Formula: I - 2 * n * n^T where n is the unit normal vector

    // Reflection matrix components
    const m11 = 1 - 2 * nnx * nnx;
    const m12 = -2 * nnx * nny;
    const m13 = -2 * nnx * nnz;
    const m21 = -2 * nny * nnx;
    const m22 = 1 - 2 * nny * nny;
    const m23 = -2 * nny * nnz;
    const m31 = -2 * nnz * nnx;
    const m32 = -2 * nnz * nny;
    const m33 = 1 - 2 * nnz * nnz;

    // Create Babylon.js transformation matrix
    const reflectionMatrix = BABYLON.Matrix.FromValues(
      m11, m12, m13, 0,
      m21, m22, m23, 0,
      m31, m32, m33, 0,
      0,   0,   0,   1
    );

    // Apply the reflection matrix to the mesh
    childMesh.setPreTransformMatrix(reflectionMatrix);

    // Note: Mirroring can flip face normals, so we might need to flip them back
    // For now, we'll let Babylon.js handle this automatically

    console.log(`[DEBUG] Applied mirror transformation to mesh: ${childMesh.name}, normal: [${normal.join(', ')}]`);
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
  private createSphere(radius: number, tessOptions: TessellationOptions, node: SphereNode): BABYLON.Mesh {


    console.log(`[DEBUG] Creating sphere: r=${radius}, segments=${tessOptions.segments ?? 32}, rings=${tessOptions.rings ?? (tessOptions.segments ? Math.max(2, Math.round(tessOptions.segments / 2)) : 16)}`);

    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `sphere_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        diameter: radius * 2,
        segments: tessOptions.segments ?? 32
        // Note: Babylon's 'segments' for CreateSphere controls both latitude and longitude divisions
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
    tessOptions: TessellationOptions,
    node: CylinderNode
  ): BABYLON.Mesh {
    const cylinder = BABYLON.MeshBuilder.CreateCylinder(
      `cylinder_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        height: params.height,
        diameterTop: params.radiusTop * 2,
        diameterBottom: params.radiusBottom * 2,
        tessellation: tessOptions.segments ?? 32, // Use calculated segments
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
      const firstMesh = meshes[0];
      if (!firstMesh) {
        console.error('[ERROR] No meshes available for union operation');
        return BABYLON.MeshBuilder.CreateBox('union_error', { size: 1 }, this.scene);
      }
      return firstMesh;
    }

    // Use mock CSG2 if available
    const globalWithMock = globalThis as { __MOCK_CSG2__?: typeof BABYLON.CSG2 };
    const CSG2Class = globalWithMock.__MOCK_CSG2__ ?? BABYLON.CSG2;
    const firstMesh = meshes[0];
    if (!firstMesh) {
      console.error('[ERROR] No meshes available for union operation');
      // Create a simple fallback box mesh
      return BABYLON.MeshBuilder.CreateBox('union_error', { size: 1 }, this.scene);
    }
    let baseCsg = CSG2Class.FromMesh(firstMesh);

    for (let i = 1; i < meshes.length; i++) {
      const currentMesh = meshes[i];
      if (!currentMesh) {
        console.warn(`[WARN] Mesh at index ${i} is undefined, skipping`);
        continue;
      }
      const childCsg = CSG2Class.FromMesh(currentMesh);
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
    const firstMesh = meshes[0];
    if (!firstMesh) {
      console.error('[ERROR] No meshes available for difference operation');
      return BABYLON.MeshBuilder.CreateBox('difference_error', { size: 1 }, this.scene);
    }

    if (!this.isCSG2Ready()) {
      console.warn('[WARN] CSG2 not available, returning first mesh for difference');
      return firstMesh;
    }

    // Use mock CSG2 if available
    const globalWithMock = globalThis as { __MOCK_CSG2__?: typeof BABYLON.CSG2 };
    const CSG2Class = globalWithMock.__MOCK_CSG2__ ?? BABYLON.CSG2;
    let baseCsg = CSG2Class.FromMesh(firstMesh);

    for (let i = 1; i < meshes.length; i++) {
      const currentMesh = meshes[i];
      if (!currentMesh) {
        console.warn(`[WARN] Mesh at index ${i} is undefined, skipping`);
        continue;
      }
      const childCsg = CSG2Class.FromMesh(currentMesh);
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
    const firstMesh = meshes[0];
    if (!firstMesh) {
      console.error('[ERROR] No meshes available for intersection operation');
      return BABYLON.MeshBuilder.CreateBox('intersection_error', { size: 1 }, this.scene);
    }

    if (!this.isCSG2Ready()) {
      console.warn('[WARN] CSG2 not available, returning first mesh for intersection');
      return firstMesh;
    }

    // Use mock CSG2 if available
    const globalWithMock = globalThis as { __MOCK_CSG2__?: typeof BABYLON.CSG2 };
    const CSG2Class = globalWithMock.__MOCK_CSG2__ ?? BABYLON.CSG2;
    let baseCsg = CSG2Class.FromMesh(firstMesh);

    for (let i = 1; i < meshes.length; i++) {
      const currentMesh = meshes[i];
      if (!currentMesh) {
        console.warn(`[WARN] Mesh at index ${i} is undefined, skipping`);
        continue;
      }
      const childCsg = CSG2Class.FromMesh(currentMesh);
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
    _node: TranslateNode
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

  // ============================================================================
  // 2D PRIMITIVE HELPER METHODS
  // ============================================================================

  /**
   * Creates a Babylon.js 2D circle mesh using GroundBuilder.
   * @param radius The radius of the circle
   * @param node The CircleNode for naming and location
   * @returns A Babylon.js mesh representing the 2D circle
   */
  private createCircle(radius: number, node: CircleNode): BABYLON.Mesh {
    // Create a circular ground mesh using disc geometry
    const circle = BABYLON.MeshBuilder.CreateDisc(
      `circle_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        radius: radius,
        tessellation: 32 // Number of segments around the circle
      },
      this.scene
    );

    // Add a default material for visibility
    if (!circle.material) {
      const material = new BABYLON.StandardMaterial(`${circle.name}_material`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.3); // Yellow-ish color for 2D shapes
      material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      circle.material = material;
    }

    console.log(`[DEBUG] Created circle mesh: ${circle.name} with radius ${radius}`);
    return circle;
  }

  /**
   * Creates a Babylon.js 2D square/rectangle mesh using GroundBuilder.
   * @param size The size [width, height] of the square/rectangle
   * @param center Whether to center the square at the origin
   * @param node The SquareNode for naming and location
   * @returns A Babylon.js mesh representing the 2D square/rectangle
   */
  private createSquare(size: readonly [number, number], center: boolean, node: SquareNode): BABYLON.Mesh {
    const square = BABYLON.MeshBuilder.CreateGround(
      `square_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
      {
        width: size[0],
        height: size[1]
      },
      this.scene
    );

    // OpenSCAD's default is center: false, placing one corner at the origin.
    // Babylon's CreateGround defaults to center: true.
    if (!center) {
      square.position = new BABYLON.Vector3(size[0] / 2, 0, size[1] / 2);
    }

    // Add a default material for visibility
    if (!square.material) {
      const material = new BABYLON.StandardMaterial(`${square.name}_material`, this.scene);
      material.diffuseColor = new BABYLON.Color3(0.7, 0.9, 0.3); // Light green color for 2D shapes
      material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      square.material = material;
    }

    console.log(`[DEBUG] Created square mesh: ${square.name} with size [${size.join(', ')}], center: ${center}`);
    return square;
  }

  /**
   * Creates a Babylon.js 2D polygon mesh from a set of points.
   * @param points Array of 2D points defining the polygon
   * @param node The PolygonNode for naming and location
   * @returns A Babylon.js mesh representing the 2D polygon
   */
  private createPolygon(points: readonly (readonly [number, number])[], node: PolygonNode): BABYLON.Mesh {
    try {
      // Convert 2D points to Vector3 (with z=0 for 2D)
      const vector3Points = points.map(point => new BABYLON.Vector3(point[0], 0, point[1]));

      // Try to create polygon using ExtrudePolygon with minimal depth for 2D appearance
      const polygon = BABYLON.MeshBuilder.ExtrudePolygon(
        `polygon_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        {
          shape: vector3Points,
          depth: 0.001 // Very small depth to create a 2D-like appearance
        },
        this.scene
      );

      // Add a default material for visibility
      if (!polygon.material) {
        const material = new BABYLON.StandardMaterial(`${polygon.name}_material`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.9); // Light blue color for 2D shapes
        material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        polygon.material = material;
      }

      console.log(`[DEBUG] Created polygon mesh: ${polygon.name} with ${points.length} points`);
      return polygon;
    } catch (error) {
      console.warn(`[WARN] Failed to create polygon with ExtrudePolygon: ${error}. Creating fallback ground mesh.`);

      // Fallback: Create a simple ground mesh as a placeholder
      const fallbackPolygon = BABYLON.MeshBuilder.CreateGround(
        `polygon_fallback_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`,
        {
          width: 2,
          height: 2
        },
        this.scene
      );

      // Add a default material for visibility
      if (!fallbackPolygon.material) {
        const material = new BABYLON.StandardMaterial(`${fallbackPolygon.name}_material`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.9); // Light blue color for 2D shapes
        material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        fallbackPolygon.material = material;
      }

      console.log(`[DEBUG] Created fallback polygon mesh: ${fallbackPolygon.name}`);
      return fallbackPolygon;
    }
  }
}
