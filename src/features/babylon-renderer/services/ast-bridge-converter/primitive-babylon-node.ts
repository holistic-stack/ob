/**
 * @file Primitive BabylonJS Node Implementation
 *
 * Implements proper BabylonJS mesh generation for OpenSCAD primitive types.
 * Supports cube, sphere, cylinder, and polyhedron with OpenSCAD-compatible parameters.
 */

import type { AbstractMesh, Scene, Vector3 } from '@babylonjs/core';
import { MeshBuilder } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import { tryCatch } from '../../../../shared/utils/functional/result';

import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  PolyhedronNode,
  SourceLocation,
  SphereNode,
} from '../../../openscad-parser/ast/ast-types';
import {
  type BabylonJSError,
  BabylonJSNode,
  BabylonJSNodeType,
  type NodeGenerationResult,
  type NodeValidationResult,
} from '../../types/babylon-ast.types';

const logger = createLogger('PrimitiveBabylonNode');

/**
 * Primitive BabylonJS Node
 *
 * Handles proper mesh generation for OpenSCAD primitive types with
 * accurate parameter mapping and OpenSCAD-compatible behavior.
 */
export class PrimitiveBabylonNode extends BabylonJSNode {
  private readonly primitiveType: string;
  private readonly parameters: Record<string, unknown>;

  constructor(
    name: string,
    scene: Scene | null,
    originalOpenscadNode: ASTNode,
    sourceLocation?: SourceLocation
  ) {
    super(
      name,
      scene,
      BabylonJSNodeType.Cube, // Will be updated based on primitive type
      originalOpenscadNode,
      sourceLocation
    );

    this.primitiveType = originalOpenscadNode.type;
    this.parameters = this.extractParameters(originalOpenscadNode);

    logger.debug(`[INIT] Created primitive BabylonJS node for ${this.primitiveType}`);
  }

  /**
   * Generate proper BabylonJS mesh for the primitive type
   */
  async generateMesh(): Promise<NodeGenerationResult> {
    logger.debug(`[GENERATE] Generating ${this.primitiveType} mesh`);

    return tryCatch(
      () => {
        if (!this.scene) {
          throw this.createError('NO_SCENE', 'Scene is required for mesh generation');
        }

        const mesh = this.createPrimitiveMesh();

        // Set basic properties
        mesh.id = `${this.name}_${Date.now()}`;
        mesh.name = this.name;

        // Add metadata
        mesh.metadata = {
          isPrimitive: true,
          primitiveType: this.primitiveType,
          parameters: this.parameters,
          sourceLocation: this.sourceLocation,
          generatedAt: new Date().toISOString(),
        };

        logger.debug(`[GENERATE] Generated ${this.primitiveType} mesh successfully`);
        return mesh;
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError(
          'MESH_GENERATION_FAILED',
          `Failed to generate ${this.primitiveType} mesh: ${errorMessage}`
        );
      }
    );
  }

  /**
   * Create the appropriate primitive mesh based on type
   */
  private createPrimitiveMesh(): AbstractMesh {
    const scene = this.scene;
    if (!scene) {
      throw new Error('Scene is required');
    }

    switch (this.primitiveType) {
      case 'cube':
        return this.createCubeMesh(scene);
      case 'sphere':
        return this.createSphereMesh(scene);
      case 'cylinder':
        return this.createCylinderMesh(scene);
      case 'polyhedron':
        return this.createPolyhedronMesh(scene);
      default:
        throw new Error(`Unsupported primitive type: ${this.primitiveType}`);
    }
  }

  /**
   * Create cube mesh with OpenSCAD-compatible parameters
   */
  private createCubeMesh(scene: Scene): AbstractMesh {
    const size = this.extractCubeSize();
    const center = this.extractCubeCenter();

    const mesh = MeshBuilder.CreateBox(
      this.name,
      {
        width: size.x,
        height: size.y,
        depth: size.z,
      },
      scene
    );

    // Apply OpenSCAD center behavior
    if (!center) {
      // OpenSCAD default: cube is positioned with one corner at origin
      mesh.position.x = size.x / 2;
      mesh.position.y = size.y / 2;
      mesh.position.z = size.z / 2;
    }
    // If center=true, mesh is already centered at origin (BabylonJS default)

    return mesh;
  }

  /**
   * Create sphere mesh with OpenSCAD-compatible parameters
   */
  private createSphereMesh(scene: Scene): AbstractMesh {
    const radius = this.extractSphereRadius();
    const segments = this.extractSphereSegments();

    return MeshBuilder.CreateSphere(
      this.name,
      {
        diameter: radius * 2,
        segments: segments,
      },
      scene
    );
  }

  /**
   * Create cylinder mesh with OpenSCAD-compatible parameters
   */
  private createCylinderMesh(scene: Scene): AbstractMesh {
    const height = this.extractCylinderHeight();
    const radius = this.extractCylinderRadius();
    const center = this.extractCylinderCenter();
    const segments = this.extractCylinderSegments();

    const mesh = MeshBuilder.CreateCylinder(
      this.name,
      {
        height: height,
        diameterTop: radius * 2,
        diameterBottom: radius * 2,
        tessellation: segments,
      },
      scene
    );

    // Apply OpenSCAD center behavior
    if (!center) {
      // OpenSCAD default: cylinder base at z=0
      mesh.position.z = height / 2;
    }
    // If center=true, mesh is already centered at origin (BabylonJS default)

    return mesh;
  }

  /**
   * Create polyhedron mesh with OpenSCAD-compatible parameters
   */
  private createPolyhedronMesh(scene: Scene): AbstractMesh {
    // For now, create a simple tetrahedron as placeholder
    // TODO: Implement proper polyhedron creation from points and faces
    logger.warn(
      '[WARN] Polyhedron mesh generation not fully implemented, using tetrahedron placeholder'
    );

    return MeshBuilder.CreatePolyhedron(
      this.name,
      {
        type: 0, // Tetrahedron
        size: 1,
      },
      scene
    );
  }

  /**
   * Extract cube size from parameters
   */
  private extractCubeSize(): Vector3 {
    const cubeNode = this.originalOpenscadNode as CubeNode;
    const size = cubeNode.size;

    if (Array.isArray(size) && size.length >= 3) {
      return {
        x: typeof size[0] === 'number' ? size[0] : 1,
        y: typeof size[1] === 'number' ? size[1] : 1,
        z: typeof size[2] === 'number' ? size[2] : 1,
      } as Vector3;
    }

    if (typeof size === 'number') {
      return { x: size, y: size, z: size } as Vector3;
    }

    return { x: 1, y: 1, z: 1 } as Vector3; // Default size
  }

  /**
   * Extract cube center parameter
   */
  private extractCubeCenter(): boolean {
    const cubeNode = this.originalOpenscadNode as CubeNode;
    return cubeNode.center ?? false; // OpenSCAD default is false
  }

  /**
   * Extract sphere radius from parameters
   */
  private extractSphereRadius(): number {
    const sphereNode = this.originalOpenscadNode as SphereNode;

    if (sphereNode.radius !== undefined) {
      return sphereNode.radius;
    }

    if (sphereNode.diameter !== undefined) {
      return sphereNode.diameter / 2;
    }

    return 1; // Default radius
  }

  /**
   * Extract sphere segments for tessellation
   */
  private extractSphereSegments(): number {
    const sphereNode = this.originalOpenscadNode as SphereNode;
    return (sphereNode as SphereNode & { $fn?: number }).$fn ?? 32; // Default segments
  }

  /**
   * Extract cylinder height from parameters
   */
  private extractCylinderHeight(): number {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;
    return cylinderNode.h ?? 1; // Default height
  }

  /**
   * Extract cylinder radius from parameters
   */
  private extractCylinderRadius(): number {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;

    if (cylinderNode.r !== undefined) {
      return cylinderNode.r;
    }

    if (cylinderNode.d !== undefined) {
      return cylinderNode.d / 2;
    }

    return 1; // Default radius
  }

  /**
   * Extract cylinder center parameter
   */
  private extractCylinderCenter(): boolean {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;
    return cylinderNode.center ?? false; // OpenSCAD default is false
  }

  /**
   * Extract cylinder segments for tessellation
   */
  private extractCylinderSegments(): number {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;
    return cylinderNode.$fn ?? 32; // Default segments
  }

  /**
   * Extract parameters from the original OpenSCAD node
   */
  private extractParameters(node: ASTNode): Record<string, unknown> {
    // Extract all relevant parameters based on node type
    const params: Record<string, unknown> = { type: node.type };

    // Add type-specific parameters
    switch (node.type) {
      case 'cube': {
        const cubeNode = node as CubeNode;
        params.size = cubeNode.size;
        params.center = cubeNode.center;
        break;
      }
      case 'sphere': {
        const sphereNode = node as SphereNode;
        params.radius = sphereNode.radius;
        params.diameter = sphereNode.diameter;
        params.fn = (sphereNode as SphereNode & { $fn?: number }).$fn;
        break;
      }
      case 'cylinder': {
        const cylinderNode = node as CylinderNode;
        params.h = cylinderNode.h;
        params.r = cylinderNode.r;
        params.d = cylinderNode.d;
        params.center = cylinderNode.center;
        params.fn = cylinderNode.$fn;
        break;
      }
      case 'polyhedron': {
        const polyhedronNode = node as PolyhedronNode;
        params.points = polyhedronNode.points;
        params.faces = polyhedronNode.faces;
        params.convexity = polyhedronNode.convexity;
        break;
      }
    }

    return params;
  }

  /**
   * Validate the primitive node
   */
  validateNode(): NodeValidationResult {
    return tryCatch(
      () => {
        if (!this.name || this.name.trim() === '') {
          throw this.createError('INVALID_NAME', 'Node name cannot be empty');
        }

        if (!this.primitiveType) {
          throw this.createError('MISSING_PRIMITIVE_TYPE', 'Primitive type is required');
        }

        // Validate type-specific parameters
        this.validatePrimitiveParameters();

        logger.debug(
          `[VALIDATE] Primitive node ${this.name} (${this.primitiveType}) validated successfully`
        );
      },
      (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return this.createError('VALIDATION_FAILED', `Node validation failed: ${errorMessage}`);
      }
    );
  }

  /**
   * Validate primitive-specific parameters
   */
  private validatePrimitiveParameters(): void {
    switch (this.primitiveType) {
      case 'cube':
        // Cube validation logic
        break;
      case 'sphere': {
        const radius = this.extractSphereRadius();
        if (radius <= 0) {
          throw new Error('Sphere radius must be positive');
        }
        break;
      }
      case 'cylinder': {
        const height = this.extractCylinderHeight();
        const cylinderRadius = this.extractCylinderRadius();
        if (height <= 0) {
          throw new Error('Cylinder height must be positive');
        }
        if (cylinderRadius <= 0) {
          throw new Error('Cylinder radius must be positive');
        }
        break;
      }
      case 'polyhedron':
        // Polyhedron validation logic
        break;
    }
  }

  /**
   * Clone the primitive node
   */
  clone(): PrimitiveBabylonNode {
    const clonedNode = new PrimitiveBabylonNode(
      `${this.name}_clone_${Date.now()}`,
      this.scene,
      this.originalOpenscadNode as ASTNode,
      this.sourceLocation
    );

    logger.debug(`[CLONE] Cloned primitive node ${this.name} to ${clonedNode.name}`);
    return clonedNode;
  }

  /**
   * Get debug information specific to primitive nodes
   */
  override getDebugInfo(): Record<string, unknown> {
    return {
      ...super.getDebugInfo(),
      primitiveType: this.primitiveType,
      parameters: this.parameters,
      isPrimitive: true,
    };
  }

  /**
   * Create a BabylonJS error specific to this node
   */
  private createError(code: string, message: string): BabylonJSError {
    return {
      code,
      message,
      nodeType: this.nodeType,
      timestamp: new Date(),
      ...(this.sourceLocation && { sourceLocation: this.sourceLocation }),
    };
  }
}
