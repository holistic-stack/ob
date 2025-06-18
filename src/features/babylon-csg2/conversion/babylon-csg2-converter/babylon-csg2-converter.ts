/**
 * @file Core OpenSCAD to Babylon.js CSG2 Pipeline Converter
 * 
 * Implements the complete pipeline: OpenSCAD Code → AST → CSG2 Operations → Babylon.js Scene
 * Uses the corrected CSG2 API with proper synchronous operations and Manifold integration.
 * 
 * Key Pipeline Flow:
 * 1. Parse OpenSCAD code using @holistic-stack/openscad-parser
 * 2. Convert AST nodes to Babylon.js primitive meshes 
 * 3. Apply CSG2 boolean operations (union, subtract, intersect)
 * 4. Generate final Babylon.js scene with optimized meshes
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import * as BABYLON from '@babylonjs/core';
import type {
  ASTNode,
  CubeNode,
  SphereNode,
  CylinderNode,
  UnionNode,
  DifferenceNode,
  IntersectionNode,
  TranslateNode,
  ScaleNode,
  RotateNode,
  MirrorNode
} from '@holistic-stack/openscad-parser';
import { parseOpenSCADCode, type Result } from '../../openscad/utils/parser-resource-manager';
import {
  isCubeNode,
  isSphereNode,
  isCylinderNode,
  isUnionNode,
  isDifferenceNode,
  isIntersectionNode,
  isTranslateNode,
  isScaleNode,
  isRotateNode,
  isMirrorNode,
  extractCubeSize,
  extractSphereRadius,
  extractCylinderParams,
  extractTranslationVector
} from '../../openscad/utils/ast-type-guards';
import { initializeCSG2ForBrowser } from '../../lib/initializers/csg2-browser-initializer/csg2-browser-initializer';

/**
 * Configuration for CSG2 conversion process
 */
export interface CSG2ConverterConfig {
  /** Enable debug logging */
  readonly enableLogging?: boolean;
  /** Rebuild normals after CSG operations */
  readonly rebuildNormals?: boolean;
  /** Center mesh after CSG operations */
  readonly centerMesh?: boolean;
  /** Default material for generated meshes */
  readonly defaultMaterial?: BABYLON.Material;
}

/**
 * Result of CSG2 conversion operation
 */
export type CSG2ConversionResult = Result<BABYLON.Mesh[], string>;

/**
 * Core OpenSCAD to Babylon.js CSG2 Pipeline Converter
 * 
 * Provides the complete implementation of the pipeline with:
 * - Functional programming patterns (Result types, immutability)
 * - Proper CSG2 API usage (synchronous operations)
 * - Comprehensive error handling and logging
 * - Resource management and cleanup
 * 
 * Usage:
 * ```typescript
 * const converter = new BabylonCSG2Converter(scene);
 * await converter.initialize(); // Initialize CSG2 once
 * 
 * const result = await converter.convertOpenSCAD(openscadCode);
 * if (result.success) {
 *   // result.value contains Babylon.js meshes
 * }
 * ```
 */
export class BabylonCSG2Converter {
  private readonly scene: BABYLON.Scene;
  private readonly config: CSG2ConverterConfig;
  private readonly logger: Console;
  private isCSG2Initialized = false;

  constructor(scene: BABYLON.Scene, config: CSG2ConverterConfig = {}) {
    this.scene = scene;
    this.config = Object.freeze({
      enableLogging: false,
      rebuildNormals: true,
      centerMesh: true,
      ...config
    });
    this.logger = console;
  }

  /**
   * Initialize CSG2 system (required once per application)
   * Must be called before any CSG2 operations
   * Uses Node.js compatible initialization method
   */
  async initialize(): Promise<Result<void, string>> {
    if (this.isCSG2Initialized) {
      return { success: true, value: undefined };
    }

    try {
      this.log('[INIT] Initializing CSG2 system...');

      // Initialize CSG2 using browser-compatible method
      const result = await initializeCSG2ForBrowser({
        enableLogging: this.config.enableLogging ?? false,
        timeout: 15000 // 15 second timeout for CSG2 initialization
      });

      if (result.success) {
        this.isCSG2Initialized = true;
        this.log(`[INIT] CSG2 system initialized successfully using ${result.method}`);
        return { success: true, value: undefined };
      } else {
        const message = `CSG2 initialization failed: ${result.error}`;
        this.log(`[ERROR] ${message}`);
        return { success: false, error: message };
      }
    } catch (error) {
      const message = `CSG2 initialization failed: ${error instanceof Error ? error.message : String(error)}`;
      this.log(`[ERROR] ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * Convert OpenSCAD source code to Babylon.js meshes
   * 
   * @param openscadCode - OpenSCAD source code to convert
   * @returns Result containing generated meshes or error
   */
  async convertOpenSCAD(openscadCode: string): Promise<CSG2ConversionResult> {
    this.log('[INIT] Starting OpenSCAD to Babylon.js conversion...');

    // Ensure CSG2 is initialized
    if (!this.isCSG2Initialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult as CSG2ConversionResult;
      }
    }

    // Parse OpenSCAD code to AST
    this.log('[DEBUG] Parsing OpenSCAD code...');
    this.log(`[DEBUG] OpenSCAD code to parse: ${openscadCode}`);
    const parseResult = await parseOpenSCADCode(openscadCode, {
      enableLogging: true // Always enable logging for debugging
    });

    if (!parseResult.success) {
      const errorMessage = `OpenSCAD parsing failed: ${parseResult.error}`;
      this.log(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    // Convert AST to meshes
    this.log(`[DEBUG] Converting ${parseResult.value.length} AST nodes to meshes...`);
    const conversionResult = this.convertASTNodes(parseResult.value);

    if (!conversionResult.success) {
      const errorMessage = `AST conversion failed: ${conversionResult.error}`;
      this.log(`[ERROR] ${errorMessage}`);
      return conversionResult;
    }

    this.log(`[END] Successfully converted OpenSCAD to ${conversionResult.value.length} Babylon.js meshes`);
    return conversionResult;
  }

  /**
   * Convert array of AST nodes to Babylon.js meshes
   * 
   * @param nodes - AST nodes to convert
   * @returns Result containing converted meshes
   */
  private convertASTNodes(nodes: ReadonlyArray<ASTNode>): CSG2ConversionResult {
    try {
      const meshes: BABYLON.Mesh[] = [];

      for (const node of nodes) {
        this.log(`[DEBUG] Processing AST node: ${node.type}`);
        
        const meshResult = this.convertSingleNode(node);
        if (meshResult.success && meshResult.value) {
          meshes.push(meshResult.value);
        } else if (!meshResult.success) {
          const errorMessage = `Failed to convert node ${node.type}: ${meshResult.error}`;
          this.log(`[WARN] ${errorMessage}`);
        }
      }

      return { success: true, value: meshes };
    } catch (error) {
      const message = `AST conversion failed: ${error instanceof Error ? error.message : String(error)}`;
      return { success: false, error: message };
    }
  }

  /**
   * Convert a single AST node to a Babylon.js mesh
   * 
   * @param node - AST node to convert
   * @returns Result containing converted mesh or null
   */
  private convertSingleNode(node: ASTNode): Result<BABYLON.Mesh | null, string> {
    try {
      // Use type guards to narrow down the node type and call the appropriate handler
      // These type guards ensure type safety by checking the node.type property
      
      // Primitive shapes
      if (isCubeNode(node)) {
        return this.createCube(node);
      }
      if (isSphereNode(node)) {
        return this.createSphere(node);
      }
      if (isCylinderNode(node)) {
        return this.createCylinder(node);
      }

      // CSG operations (these are the complex ones requiring CSG2)
      if (isUnionNode(node)) {
        return this.createUnion(node);
      }
      if (isDifferenceNode(node)) {
        return this.createDifference(node);
      }
      if (isIntersectionNode(node)) {
        return this.createIntersection(node);
      }

      // Transformations (these wrap other operations)
      if (isTranslateNode(node)) {
        return this.createTranslate(node);
      }
      if (isScaleNode(node)) {
        return this.createScale(node);
      }
      if (isRotateNode(node)) {
        return this.createRotate(node);
      }
      if (isMirrorNode(node)) {
        return this.createMirror(node);
      }

      // Unsupported node type
      this.log(`[WARN] Unsupported AST node type: ${node.type}`);
      return { success: true, value: null };
    } catch (error) {
      const message = `Node conversion failed: ${error instanceof Error ? error.message : String(error)}`;
      return { success: false, error: message };
    }
  }

  // === PRIMITIVE SHAPE CREATORS ===

  /**
   * Create Babylon.js box mesh from CubeNode
   */
  private createCube(node: CubeNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating cube from CubeNode`);

    const sizeResult = extractCubeSize(node);
    const dimensions = sizeResult.success ? sizeResult.value : [1, 1, 1] as const;
    const [width, height, depth] = dimensions;

    const mesh = BABYLON.MeshBuilder.CreateBox(
      this.generateMeshName(node, 'cube'),
      { width, height, depth, updatable: false },
      this.scene
    );

    this.applyDefaultMaterial(mesh);
    this.log(`[DEBUG] Created cube with dimensions [${width}, ${height}, ${depth}]`);
    
    return { success: true, value: mesh };
  }

  /**
   * Create Babylon.js sphere mesh from SphereNode
   */
  private createSphere(node: SphereNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating sphere from SphereNode`);

    const radiusResult = extractSphereRadius(node);
    const radius = radiusResult.success ? radiusResult.value : 1;

    const mesh = BABYLON.MeshBuilder.CreateSphere(
      this.generateMeshName(node, 'sphere'),
      { diameter: radius * 2, updatable: false },
      this.scene
    );

    this.applyDefaultMaterial(mesh);
    this.log(`[DEBUG] Created sphere with radius ${radius}`);
    
    return { success: true, value: mesh };
  }

  /**
   * Create Babylon.js cylinder mesh from CylinderNode
   */
  private createCylinder(node: CylinderNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating cylinder from CylinderNode`);

    const paramsResult = extractCylinderParams(node);
    if (!paramsResult.success) {
      const errorMessage = `Failed to extract cylinder parameters: ${paramsResult.error}`;
      return { success: false, error: errorMessage };
    }
    
    const { height, radius } = paramsResult.value;

    const mesh = BABYLON.MeshBuilder.CreateCylinder(
      this.generateMeshName(node, 'cylinder'),
      { 
        height, 
        diameterTop: radius * 2, 
        diameterBottom: radius * 2, 
        updatable: false 
      },
      this.scene
    );

    this.applyDefaultMaterial(mesh);
    this.log(`[DEBUG] Created cylinder with height ${height}, radius ${radius}`);
    
    return { success: true, value: mesh };
  }

  // === CSG OPERATIONS ===

  /**
   * Create union of child meshes using CSG2
   */
  private createUnion(node: UnionNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating union from UnionNode with ${node.children.length} children`);
    
    return this.performCSGOperation(node.children, 'union', (csg1, csg2) => csg1.add(csg2));
  }

  /**
   * Create difference of child meshes using CSG2
   */
  private createDifference(node: DifferenceNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating difference from DifferenceNode with ${node.children.length} children`);
    
    return this.performCSGOperation(node.children, 'difference', (csg1, csg2) => csg1.subtract(csg2));
  }

  /**
   * Create intersection of child meshes using CSG2
   */
  private createIntersection(node: IntersectionNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating intersection from IntersectionNode with ${node.children.length} children`);
    
    return this.performCSGOperation(node.children, 'intersection', (csg1, csg2) => csg1.intersect(csg2));
  }

  /**
   * Generic CSG operation performer
   * 
   * @param children - Child AST nodes to process
   * @param operationName - Name for logging
   * @param operation - CSG2 operation function
   * @returns Result containing final mesh
   */
  private performCSGOperation(
    children: ReadonlyArray<ASTNode>,
    operationName: string,
    operation: (csg1: BABYLON.CSG2, csg2: BABYLON.CSG2) => BABYLON.CSG2
  ): Result<BABYLON.Mesh, string> {
    if (children.length === 0) {
      return { success: false, error: `${operationName} requires at least one child` };
    }

    try {
      // Convert all children to meshes
      const childMeshes: BABYLON.Mesh[] = [];
      
      for (const child of children) {
        const childResult = this.convertSingleNode(child);
        if (childResult.success && childResult.value) {
          childMeshes.push(childResult.value);
        } else if (!childResult.success) {
          const errorMessage = `Child conversion failed: ${childResult.error}`;
          return { success: false, error: errorMessage };
        }
      }

      if (childMeshes.length === 0) {
        return { success: false, error: `No valid children found for ${operationName}` };
      }

      if (childMeshes.length === 1) {
        // Single child, no CSG operation needed
        const firstMesh = childMeshes[0];
        if (!firstMesh) {
          return { success: false, error: `First mesh is undefined` };
        }
        return { success: true, value: firstMesh };
      }

      // Perform CSG operations (all synchronous!)
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        return { success: false, error: `First mesh is undefined` };
      }
      
      let resultCSG = BABYLON.CSG2.FromMesh(firstMesh);
      
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          return { success: false, error: `Mesh at index ${i} is undefined` };
        }
        const nextCSG = BABYLON.CSG2.FromMesh(nextMesh);
        resultCSG = operation(resultCSG, nextCSG);
      }

      // Convert back to mesh
      const finalMesh = resultCSG.toMesh(
        this.generateMeshName({ type: operationName } as ASTNode, operationName),
        this.scene,
        {
          rebuildNormals: this.config.rebuildNormals ?? true,
          centerMesh: this.config.centerMesh ?? true
        }
      );

      // Clean up intermediate meshes
      childMeshes.forEach(mesh => mesh.dispose());

      this.applyDefaultMaterial(finalMesh);
      this.log(`[DEBUG] Completed ${operationName} operation`);
      
      return { success: true, value: finalMesh };
    } catch (error) {
      const message = `${operationName} operation failed: ${error instanceof Error ? error.message : String(error)}`;
      return { success: false, error: message };
    }
  }

  // === TRANSFORMATION OPERATIONS ===

  /**
   * Apply translation to child mesh
   */
  private createTranslate(node: TranslateNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating translate from TranslateNode`);

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Translate requires at least one child' };
    }

    // Get first child safely
    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Translate child is undefined' };
    }

    // Convert child to mesh
    const childResult = this.convertSingleNode(firstChild);
    if (!childResult.success) {
      const errorMessage = `Translate child conversion failed: ${childResult.error}`;
      return { success: false, error: errorMessage };
    }
    
    if (!childResult.value) {
      return { success: false, error: 'Translate child conversion produced no mesh' };
    }

    // Extract translation vector using the existing utility
    const translationResult = extractTranslationVector(node);
    const translation = translationResult.success ? translationResult.value : [0, 0, 0] as const;
    const [x, y, z] = translation;

    // Apply translation
    childResult.value.position.set(x, y, z);
    
    this.log(`[DEBUG] Applied translation [${x}, ${y}, ${z}]`);
    return { success: true, value: childResult.value };
  }

  /**
   * Apply scaling to child mesh
   */
  private createScale(node: ScaleNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating scale from ScaleNode`);

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Scale requires at least one child' };
    }

    // Get first child safely
    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Scale child is undefined' };
    }

    // Convert child to mesh
    const childResult = this.convertSingleNode(firstChild);
    if (!childResult.success) {
      const errorMessage = `Scale child conversion failed: ${childResult.error}`;
      return { success: false, error: errorMessage };
    }
    
    if (!childResult.value) {
      return { success: false, error: 'Scale child conversion produced no mesh' };
    }

    // Extract scale vector from node.v
    const scale = node.v || [1, 1, 1];
    const scaleVector = Array.isArray(scale) ? scale : [scale, scale, scale];
    const [x, y, z] = scaleVector;

    // Apply scaling
    childResult.value.scaling.set(x, y, z);
    
    this.log(`[DEBUG] Applied scaling [${x}, ${y}, ${z}]`);
    return { success: true, value: childResult.value };
  }

  /**
   * Apply rotation to child mesh
   */
  private createRotate(node: RotateNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating rotate from RotateNode`);

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Rotate requires at least one child' };
    }

    // Get first child safely
    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Rotate child is undefined' };
    }

    // Convert child to mesh
    const childResult = this.convertSingleNode(firstChild);
    if (!childResult.success) {
      const errorMessage = `Rotate child conversion failed: ${childResult.error}`;
      return { success: false, error: errorMessage };
    }
    
    if (!childResult.value) {
      return { success: false, error: 'Rotate child conversion produced no mesh' };
    }

    // Extract rotation from node.a (can be number or Vector3D)
    let rotation: [number, number, number];
    if (typeof node.a === 'number') {
      // Single angle rotation around Z-axis
      rotation = [0, 0, node.a];
    } else {
      // Vector3D rotation
      rotation = node.a as [number, number, number];
    }
    
    // Convert from degrees to radians
    const [x, y, z] = rotation.map((deg: number) => deg * Math.PI / 180) as [number, number, number];

    // Apply rotation
    childResult.value.rotation.set(x, y, z);
    
    this.log(`[DEBUG] Applied rotation [${x}, ${y}, ${z}] radians`);
    return { success: true, value: childResult.value };
  }

  /**
   * Apply mirror transformation to child mesh
   */
  private createMirror(node: MirrorNode): Result<BABYLON.Mesh, string> {
    this.log(`[DEBUG] Creating mirror from MirrorNode`);

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Mirror requires at least one child' };
    }

    // Get first child safely
    const firstChild = node.children[0];
    if (!firstChild) {
      return { success: false, error: 'Mirror child is undefined' };
    }

    // Convert child to mesh
    const childResult = this.convertSingleNode(firstChild);
    if (!childResult.success) {
      const errorMessage = `Mirror child conversion failed: ${childResult.error}`;
      return { success: false, error: errorMessage };
    }

    if (!childResult.value) {
      return { success: false, error: 'Mirror child conversion produced no mesh' };
    }

    // Extract mirror normal vector from node.v
    const normal = node.v || [1, 0, 0]; // Default to X-axis mirror
    const [nx, ny, nz] = normal;

    // Normalize the normal vector
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length === 0) {
      return { success: false, error: 'Mirror normal vector cannot be zero' };
    }

    const nnx = nx / length;
    const nny = ny / length;
    const nnz = nz / length;

    // Create reflection matrix for mirroring across plane with given normal
    // Formula: I - 2 * n * n^T where n is the unit normal vector
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
    childResult.value.setPreTransformMatrix(reflectionMatrix);

    this.log(`[DEBUG] Applied mirror transformation with normal [${nx}, ${ny}, ${nz}]`);
    return { success: true, value: childResult.value };
  }

  // === UTILITY METHODS ===

  /**
   * Generate unique mesh name from AST node
   */
  private generateMeshName(node: ASTNode, prefix: string): string {
    const line = node.location?.start.line ?? 0;
    const column = node.location?.start.column ?? 0;
    return `${prefix}_${line}_${column}_${Date.now()}`;
  }

  /**
   * Apply default material to mesh if configured
   */
  private applyDefaultMaterial(mesh: BABYLON.Mesh): void {
    if (this.config.defaultMaterial) {
      mesh.material = this.config.defaultMaterial;
    }
  }

  /**
   * Log message if logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      this.logger.log(message);
    }
  }

  /**
   * Clean up resources used by this converter
   */
  public dispose(): void {
    this.log('[DEBUG] Disposing BabylonCSG2Converter');
    // Add any necessary cleanup here
  }
}

/**
 * Factory function for creating BabylonCSG2Converter instances
 * 
 * @param scene - Babylon.js scene
 * @param config - Optional converter configuration
 * @returns New converter instance
 */
export function createBabylonCSG2Converter(
  scene: BABYLON.Scene, 
  config?: CSG2ConverterConfig
): BabylonCSG2Converter {
  return new BabylonCSG2Converter(scene, config);
}

/**
 * Convenience function for one-shot OpenSCAD conversion
 * 
 * @param openscadCode - OpenSCAD source code
 * @param scene - Babylon.js scene
 * @param config - Optional converter configuration
 * @returns Promise resolving to conversion result
 */
export async function convertOpenSCADToBabylon(
  openscadCode: string,
  scene: BABYLON.Scene,
  config?: CSG2ConverterConfig
): Promise<CSG2ConversionResult> {
  const converter = createBabylonCSG2Converter(scene, config);
  try {
    await converter.initialize();
    return await converter.convertOpenSCAD(openscadCode);
  } finally {
    converter.dispose();
  }
}
