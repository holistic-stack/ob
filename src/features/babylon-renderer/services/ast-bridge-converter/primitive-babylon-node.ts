/**
 * @file Primitive BabylonJS Node Implementation
 *
 * Implements BabylonJS mesh generation for OpenSCAD primitive types including
 * 3D primitives (cube, sphere, cylinder, polyhedron) and 2D primitives (circle, square, polygon).
 * Provides OpenSCAD-compatible parameter handling and global variables integration.
 *
 * @example
 * ```typescript
 * // Create a sphere primitive with OpenSCAD globals
 * const sphereNode = new PrimitiveBabylonNode(
 *   'sphere-1',
 *   scene,
 *   sphereASTNode,
 *   openscadGlobals,
 *   sourceLocation
 * );
 * const result = await sphereNode.generateMesh();
 * ```
 */

import type { AbstractMesh, Scene, Vector3 } from '@babylonjs/core';
import {
  Vector3 as BabylonVector3,
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  VertexData,
} from '@babylonjs/core';
import earcut from 'earcut';
import {
  calculateFragments,
  OPENSCAD_FALLBACK,
  OPENSCAD_GLOBALS,
} from '../../../../shared/constants/openscad-globals/openscad-globals.constants';
import { createLogger } from '../../../../shared/services/logger.service';
import { tryCatch } from '../../../../shared/utils/functional/result';

import type {
  ASTNode,
  CircleNode,
  CubeNode,
  CylinderNode,
  PolygonNode,
  PolyhedronNode,
  SourceLocation,
  SphereNode,
  SquareNode,
} from '../../../openscad-parser/ast/ast-types';
import type { OpenSCADGlobalsState } from '../../../store/slices/openscad-globals-slice/openscad-globals-slice.types';
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
  private readonly openscadGlobals: OpenSCADGlobalsState;

  constructor(
    name: string,
    scene: Scene | null,
    originalOpenscadNode: ASTNode,
    openscadGlobals: OpenSCADGlobalsState,
    sourceLocation?: SourceLocation
  ) {
    super(
      name,
      scene,
      PrimitiveBabylonNode.mapPrimitiveTypeToNodeType(originalOpenscadNode.type),
      originalOpenscadNode,
      sourceLocation
    );

    this.primitiveType = originalOpenscadNode.type;
    this.parameters = this.extractParameters(originalOpenscadNode);
    this.openscadGlobals = openscadGlobals;
  }

  /**
   * Map OpenSCAD primitive type to BabylonJS node type
   */
  private static mapPrimitiveTypeToNodeType(primitiveType: string): BabylonJSNodeType {
    switch (primitiveType) {
      case 'cube':
        return BabylonJSNodeType.Cube;
      case 'sphere':
        return BabylonJSNodeType.Sphere;
      case 'cylinder':
        return BabylonJSNodeType.Cylinder;
      case 'polyhedron':
        return BabylonJSNodeType.Polyhedron;
      case 'circle':
        return BabylonJSNodeType.Circle;
      case 'square':
        return BabylonJSNodeType.Square;
      case 'polygon':
        return BabylonJSNodeType.Polygon;
      default:
        return BabylonJSNodeType.Cube; // Default fallback
    }
  }

  /**
   * Generate proper BabylonJS mesh for the primitive type
   */
  async generateMesh(): Promise<NodeGenerationResult> {
    try {
      if (!this.scene) {
        throw this.createError('NO_SCENE', 'Scene is required for mesh generation');
      }

      const mesh = await this.createPrimitiveMesh();

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

      // Apply default material for visibility
      const defaultMaterial = new StandardMaterial(`${this.name}_default_material`, this.scene);
      defaultMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8); // Light gray (OpenSCAD default)
      defaultMaterial.specularColor = new Color3(0.2, 0.2, 0.2); // Low specular for matte finish
      mesh.material = defaultMaterial;

      logger.debug(`[GENERATE] Applied default material to ${this.primitiveType} mesh: ${mesh.id}`);

      return { success: true, data: mesh };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: this.createError(
          'MESH_GENERATION_FAILED',
          `Failed to generate ${this.primitiveType} mesh: ${errorMessage}`
        ),
      };
    }
  }

  /**
   * Create the appropriate primitive mesh based on type
   */
  private async createPrimitiveMesh(): Promise<AbstractMesh> {
    const scene = this.scene;
    if (!scene) {
      throw new Error('Scene is required');
    }

    switch (this.primitiveType) {
      case 'cube':
        return await this.createCubeMesh(scene);
      case 'sphere':
        return await this.createSphereMesh(scene);
      case 'cylinder':
        return await this.createCylinderMesh(scene);
      case 'polyhedron':
        return this.createPolyhedronMesh(scene);
      case 'circle':
        return this.createCircleMesh(scene);
      case 'square':
        return this.createSquareMesh(scene);
      case 'polygon':
        return this.createPolygonMesh(scene);
      default:
        throw new Error(`Unsupported primitive type: ${this.primitiveType}`);
    }
  }

  /**
   * Create cube mesh with OpenSCAD-compatible parameters using new geometry builder
   */
  private async createCubeMesh(scene: Scene): Promise<AbstractMesh> {
    const size = this.extractCubeSize();
    const center = this.extractCubeCenter();

    // Use the new OpenSCAD geometry builder instead of BabylonJS built-in
    try {
      // Import the geometry builder services with correct paths
      const { CubeGeneratorService } = await import(
        '@/features/openscad-geometry-builder/services/primitive-generators/3d-primitives/cube-generator'
      );
      const { BabylonMeshBuilderService } = await import(
        '@/features/openscad-geometry-builder/services/geometry-bridge/babylon-mesh-builder'
      );

      // Create services
      const cubeGenerator = new CubeGeneratorService();
      const meshBuilder = new BabylonMeshBuilderService();

      // Generate cube geometry using OpenSCAD-compatible algorithm
      const cubeResult = cubeGenerator.generateCubeFromParameters({
        size,
        center,
      });

      if (!cubeResult.success) {
        throw new Error(`Cube generation failed: ${cubeResult.error.message}`);
      }

      // Convert to BabylonJS mesh
      const meshResult = meshBuilder.createPolyhedronMesh(cubeResult.data, scene, this.name);

      if (!meshResult.success) {
        throw new Error(`Mesh creation failed: ${meshResult.error.message}`);
      }

      logger.debug(
        `[CUBE_SUCCESS] Generated cube using OpenSCAD Geometry Builder: ${meshResult.data.getTotalVertices()} vertices`
      );
      return meshResult.data;
    } catch (error) {
      // Fallback to old method if new geometry builder fails
      logger.warn(`[CUBE_FALLBACK] Using BabylonJS built-in cube due to error: ${error}`);

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
  }

  /**
   * Create sphere mesh with OpenSCAD-compatible parameters using new geometry builder
   *
   * @param scene - BabylonJS scene for mesh creation
   * @returns AbstractMesh representing the sphere
   *
   * @example
   * ```typescript
   * const sphere = await this.createSphereMesh(scene);
   * // Creates sphere with radius and tessellation based on OpenSCAD globals
   * ```
   */
  private async createSphereMesh(scene: Scene): Promise<AbstractMesh> {
    const sphereNode = this.originalOpenscadNode as SphereNode;

    // Extract sphere parameters safely
    const radius = this.extractSphereRadius();

    // Get local tessellation parameters from the sphere node (safely handle undefined)
    const localFn = sphereNode.$fn;
    const localFa = sphereNode.$fa;
    const localFs = sphereNode.$fs;

    // Resolve parameters using OpenSCAD inheritance rules
    const { fn, fa, fs } = this.resolveTessellationParameters(localFn, localFa, localFs);

    // Use the new OpenSCAD geometry builder instead of BabylonJS built-in
    try {
      // Import the geometry builder services with correct paths
      const { SphereGeneratorService } = await import(
        '@/features/openscad-geometry-builder/services/primitive-generators/3d-primitives/sphere-generator'
      );
      const { FragmentCalculatorService } = await import(
        '@/features/openscad-geometry-builder/services/fragment-calculator'
      );
      const { BabylonMeshBuilderService } = await import(
        '@/features/openscad-geometry-builder/services/geometry-bridge/babylon-mesh-builder'
      );

      // Create services
      const fragmentCalculator = new FragmentCalculatorService();
      const sphereGenerator = new SphereGeneratorService(fragmentCalculator);
      const meshBuilder = new BabylonMeshBuilderService();

      // Generate sphere geometry using OpenSCAD-compatible algorithm
      const sphereResult = sphereGenerator.generateSphereFromParameters({
        radius,
        fn,
        fa,
        fs,
      });

      if (!sphereResult.success) {
        throw new Error(`Sphere generation failed: ${sphereResult.error.message}`);
      }

      // Convert to BabylonJS mesh
      const meshResult = meshBuilder.createPolyhedronMesh(sphereResult.data, scene, this.name);

      if (!meshResult.success) {
        throw new Error(`Mesh creation failed: ${meshResult.error.message}`);
      }

      logger.debug(
        `[SPHERE_SUCCESS] Generated sphere using OpenSCAD Geometry Builder: ${meshResult.data.getTotalVertices()} vertices`
      );
      return meshResult.data;
    } catch (error) {
      // Fallback to old method if new geometry builder fails
      logger.warn(`[SPHERE_FALLBACK] Using BabylonJS built-in sphere due to error: ${error}`);

      const segments = this.extractSphereSegments();
      const sphere = MeshBuilder.CreateSphere(
        this.name,
        {
          diameter: radius * 2,
          segments: segments,
        },
        scene
      );

      // Apply flat shading to make angular edges visible for low-poly spheres
      if (segments <= OPENSCAD_FALLBACK.FLAT_SHADING_THRESHOLD) {
        sphere.convertToFlatShadedMesh();
      }

      return sphere;
    }
  }

  /**
   * Create cylinder mesh with OpenSCAD-compatible parameters using new geometry builder
   */
  private async createCylinderMesh(scene: Scene): Promise<AbstractMesh> {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;

    // Extract cylinder parameters
    const height = this.extractCylinderHeight();
    const radius = this.extractCylinderRadius();
    const center = this.extractCylinderCenter();

    // Get local tessellation parameters from the cylinder node
    const localFn = cylinderNode.$fn;
    const localFa = cylinderNode.$fa;
    const localFs = cylinderNode.$fs;

    // Resolve parameters using OpenSCAD inheritance rules
    const { fn, fa, fs } = this.resolveTessellationParameters(localFn, localFa, localFs);

    // Use the new OpenSCAD geometry builder instead of BabylonJS built-in
    try {
      // Import the geometry builder services with correct paths
      const { CylinderGeneratorService } = await import(
        '@/features/openscad-geometry-builder/services/primitive-generators/3d-primitives/cylinder-generator'
      );
      const { FragmentCalculatorService } = await import(
        '@/features/openscad-geometry-builder/services/fragment-calculator'
      );
      const { BabylonMeshBuilderService } = await import(
        '@/features/openscad-geometry-builder/services/geometry-bridge/babylon-mesh-builder'
      );

      // Create services
      const fragmentCalculator = new FragmentCalculatorService();
      const cylinderGenerator = new CylinderGeneratorService(fragmentCalculator);
      const meshBuilder = new BabylonMeshBuilderService();

      // Generate cylinder geometry using OpenSCAD-compatible algorithm
      const cylinderResult = cylinderGenerator.generateCylinderFromParameters({
        height,
        r1: radius,
        r2: radius,
        center,
        fn,
        fa,
        fs,
      });

      if (!cylinderResult.success) {
        throw new Error(`Cylinder generation failed: ${cylinderResult.error.message}`);
      }

      // Convert to BabylonJS mesh
      const meshResult = meshBuilder.createPolyhedronMesh(cylinderResult.data, scene, this.name);

      if (!meshResult.success) {
        throw new Error(`Mesh creation failed: ${meshResult.error.message}`);
      }

      logger.debug(
        `[CYLINDER_SUCCESS] Generated cylinder using OpenSCAD Geometry Builder: ${meshResult.data.getTotalVertices()} vertices`
      );
      return meshResult.data;
    } catch (error) {
      // Fallback to old method if new geometry builder fails
      logger.warn(`[CYLINDER_FALLBACK] Using BabylonJS built-in cylinder due to error: ${error}`);

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
  }

  /**
   * Create polyhedron mesh with OpenSCAD-compatible parameters
   *
   * Currently creates a tetrahedron placeholder. Full polyhedron implementation
   * with custom points and faces requires additional BabylonJS mesh construction.
   *
   * @param scene - BabylonJS scene for mesh creation
   * @returns AbstractMesh representing a basic polyhedron (tetrahedron)
   */
  private createPolyhedronMesh(scene: Scene): AbstractMesh {
    // Create a simple tetrahedron as placeholder for polyhedron functionality
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
   * Create circle mesh using BabylonJS CreateDisc
   *
   * Uses native BabylonJS disc creation for optimal visibility and performance.
   * Supports OpenSCAD global variables ($fn, $fa, $fs) for tessellation control.
   *
   * @param scene - BabylonJS scene for mesh creation
   * @returns AbstractMesh representing the 2D circle as a flat disc
   *
   * @example
   * ```typescript
   * // Creates a circle with 5 segments (pentagon) when $fn = 5
   * const circle = this.createCircleMesh(scene);
   * ```
   */
  private createCircleMesh(scene: Scene): AbstractMesh {
    const radius = this.extractCircleRadius();
    const segments = this.extractCircleSegments();

    // Create disc mesh using BabylonJS native CreateDisc
    const mesh = MeshBuilder.CreateDisc(
      this.name,
      {
        radius: radius,
        tessellation: segments,
        sideOrientation: 2, // Double-sided for visibility
      },
      scene
    );

    // Position at Z=0 (2D shape in 3D space)
    mesh.position.z = 0;

    return mesh;
  }

  /**
   * Create square mesh using BabylonJS CreatePlane
   *
   * Uses native BabylonJS plane creation for optimal visibility and performance.
   * Supports both square and rectangular shapes with OpenSCAD-compatible positioning.
   *
   * @param scene - BabylonJS scene for mesh creation
   * @returns AbstractMesh representing the 2D square/rectangle as a flat plane
   *
   * @example
   * ```typescript
   * // Creates a 50x30 rectangle positioned in first quadrant (OpenSCAD default)
   * const square = this.createSquareMesh(scene);
   * ```
   */
  private createSquareMesh(scene: Scene): AbstractMesh {
    const size = this.extractSquareSize();
    const center = this.extractSquareCenter();

    // Create plane mesh using BabylonJS native CreatePlane
    const mesh = MeshBuilder.CreatePlane(
      this.name,
      {
        width: size.x,
        height: size.y,
        sideOrientation: 2, // Double-sided for visibility
      },
      scene
    );

    // Position based on center parameter
    if (center) {
      // Centered at origin (default for CreatePlane)
      mesh.position.set(0, 0, 0);
    } else {
      // OpenSCAD default: positioned in first quadrant
      mesh.position.set(size.x / 2, size.y / 2, 0);
    }

    return mesh;
  }

  /**
   * Create polygon mesh for arbitrary 2D shapes
   *
   * Handles arbitrary polygon shapes from OpenSCAD using CreatePolygon with earcut triangulation.
   * Supports complex polygon shapes with proper triangulation for non-convex polygons.
   *
   * @param scene - BabylonJS scene for mesh creation
   * @returns AbstractMesh representing the 2D polygon as a flat shape
   *
   * @example
   * ```typescript
   * // Creates a polygon from array of [x, y] points
   * const polygon = this.createPolygonMesh(scene);
   * ```
   */
  private createPolygonMesh(scene: Scene): AbstractMesh {
    const points = this.extractPolygonPoints();

    if (points.length < 3) {
      throw new Error(`Polygon must have at least 3 points, got ${points.length}`);
    }

    // Convert points to Vector3 array for BabylonJS polygon creation
    const shape: Vector3[] = points.map((point) => {
      const x = typeof point[0] === 'number' ? point[0] : 0;
      const y = typeof point[1] === 'number' ? point[1] : 0;
      return new BabylonVector3(x, y, 0);
    });

    // Check polygon winding order and ensure it's counter-clockwise for proper triangulation
    const isCounterClockwise = this.isPolygonCounterClockwise(shape);
    if (!isCounterClockwise) {
      shape.reverse();
    }

    // Try to create polygon mesh using BabylonJS built-in triangulation first
    try {
      const mesh = MeshBuilder.CreatePolygon(
        this.name,
        {
          shape: shape,
          sideOrientation: 2, // Double-sided for visibility
        },
        scene
        // No earcut parameter - use BabylonJS built-in triangulation
      );

      // Check if mesh has valid geometry
      if (mesh.getTotalVertices() === 0 || mesh.getTotalIndices() === 0) {
        mesh.dispose();
        throw new Error('Built-in triangulation produced empty mesh');
      }

      // Position at Z=0 (2D shape in 3D space)
      mesh.position.z = 0;
      return mesh;
    } catch (_error) {
      // Built-in triangulation failed, try manual earcut

      // If built-in triangulation fails, try manual earcut triangulation
      try {
        // Convert Vector3 points to flat array for earcut
        const flatCoords: number[] = [];
        for (const point of shape) {
          flatCoords.push(point.x, point.y);
        }

        // Use earcut directly to triangulate
        const triangles = earcut(flatCoords);

        if (triangles.length === 0) {
          throw new Error('Earcut produced no triangles');
        }

        // Create custom mesh from triangulated data
        const mesh = this.createCustomPolygonMesh(shape, triangles, scene);
        mesh.position.z = 0;
        return mesh;
      } catch (_earcutError) {
        // Manual earcut failed, use fallback

        // Final fallback: create a simple disc as placeholder
        const discMesh = MeshBuilder.CreateDisc(
          this.name,
          {
            radius: OPENSCAD_FALLBACK.DEFAULT_RADIUS,
            tessellation: OPENSCAD_FALLBACK.MIN_TESSELLATION,
            sideOrientation: 2,
          },
          scene
        );
        discMesh.position.z = 0;
        return discMesh;
      }
    }
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
      // Handle both number and string (parameter reference) cases
      if (typeof sphereNode.radius === 'number') {
        return sphereNode.radius;
      }
      // For parameter references, we'd need module resolution - use default for now
      logger.warn(`[SPHERE_RADIUS] Parameter reference not resolved: ${sphereNode.radius}`);
      return 1;
    }

    if (sphereNode.diameter !== undefined) {
      // Handle both number and string (parameter reference) cases
      if (typeof sphereNode.diameter === 'number') {
        return sphereNode.diameter / 2;
      }
      // For parameter references, we'd need module resolution - use default for now
      logger.warn(`[SPHERE_DIAMETER] Parameter reference not resolved: ${sphereNode.diameter}`);
      return 1;
    }

    return 1; // Default radius
  }

  /**
   * Resolve tessellation parameters following OpenSCAD inheritance rules.
   * Implements the precedence: local parameters → global variables → OpenSCAD defaults
   *
   * @param localFn - Local $fn parameter from primitive (undefined if not specified)
   * @param localFa - Local $fa parameter from primitive (undefined if not specified)
   * @param localFs - Local $fs parameter from primitive (undefined if not specified)
   * @returns Resolved tessellation parameters with proper inheritance
   */
  private resolveTessellationParameters(
    localFn?: number,
    localFa?: number,
    localFs?: number
  ): { fn: number; fa: number; fs: number } {
    // Safely access openscadGlobals with fallback to defaults
    const globalFn = this.openscadGlobals?.$fn;
    const globalFa = this.openscadGlobals?.$fa;
    const globalFs = this.openscadGlobals?.$fs;

    // Apply OpenSCAD inheritance rules: local → global → defaults
    const resolvedFn = localFn ?? globalFn ?? OPENSCAD_GLOBALS.DEFAULT_FN;
    const resolvedFa = localFa ?? globalFa ?? OPENSCAD_GLOBALS.DEFAULT_FA;
    const resolvedFs = localFs ?? globalFs ?? OPENSCAD_GLOBALS.DEFAULT_FS;

    logger.debug(
      `[RESOLVE_TESSELLATION] Local: $fn=${localFn}, $fa=${localFa}, $fs=${localFs} | ` +
        `Global: $fn=${globalFn}, $fa=${globalFa}, $fs=${globalFs} | ` +
        `Resolved: $fn=${resolvedFn}, $fa=${resolvedFa}, $fs=${resolvedFs}`
    );

    return { fn: resolvedFn, fa: resolvedFa, fs: resolvedFs };
  }

  /**
   * Extract sphere segments for tessellation using OpenSCAD global variable inheritance
   */
  private extractSphereSegments(): number {
    const sphereNode = this.originalOpenscadNode as SphereNode;
    const radius = this.extractSphereRadius();

    // Get local tessellation parameters from the sphere node
    const localFn = sphereNode.$fn;
    const localFa = sphereNode.$fa;
    const localFs = sphereNode.$fs;

    // Resolve parameters using OpenSCAD inheritance rules
    const { fn, fa, fs } = this.resolveTessellationParameters(localFn, localFa, localFs);

    // Use the centralized fragment calculation function
    const finalFragments = calculateFragments(radius, fn, fa, fs);

    logger.debug(
      `[EXTRACT_SPHERE_SEGMENTS] Sphere segments calculated: ${finalFragments} ` +
        `(radius=${radius}, $fn=${fn}, $fa=${fa}, $fs=${fs})`
    );

    return finalFragments;
  }

  /**
   * Extract cylinder height from parameters
   */
  private extractCylinderHeight(): number {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;
    const height = cylinderNode.h;

    if (height !== undefined) {
      if (typeof height === 'number') {
        return height;
      }
      // For parameter references, we'd need module resolution - use default for now
      logger.warn(`[CYLINDER_HEIGHT] Parameter reference not resolved: ${height}`);
    }

    return 1; // Default height
  }

  /**
   * Extract cylinder radius from parameters
   */
  private extractCylinderRadius(): number {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;

    if (cylinderNode.r !== undefined) {
      if (typeof cylinderNode.r === 'number') {
        return cylinderNode.r;
      }
      // For parameter references, we'd need module resolution - use default for now
      logger.warn(`[CYLINDER_RADIUS] Parameter reference not resolved: ${cylinderNode.r}`);
      return 1;
    }

    if (cylinderNode.d !== undefined) {
      if (typeof cylinderNode.d === 'number') {
        return cylinderNode.d / 2;
      }
      // For parameter references, we'd need module resolution - use default for now
      logger.warn(`[CYLINDER_DIAMETER] Parameter reference not resolved: ${cylinderNode.d}`);
      return 1;
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
   * Extract cylinder segments for tessellation using OpenSCAD global variable inheritance
   */
  private extractCylinderSegments(): number {
    const cylinderNode = this.originalOpenscadNode as CylinderNode;
    const radius = this.extractCylinderRadius();

    // Get local tessellation parameters from the cylinder node
    const localFn = cylinderNode.$fn;
    const localFa = cylinderNode.$fa;
    const localFs = cylinderNode.$fs;

    // Resolve parameters using OpenSCAD inheritance rules
    const { fn, fa, fs } = this.resolveTessellationParameters(localFn, localFa, localFs);

    // Use the centralized fragment calculation function
    const finalFragments = calculateFragments(radius, fn, fa, fs);

    logger.debug(
      `[EXTRACT_CYLINDER_SEGMENTS] Cylinder segments calculated: ${finalFragments} ` +
        `(radius=${radius}, $fn=${fn}, $fa=${fa}, $fs=${fs})`
    );

    return finalFragments;
  }

  /**
   * Extract circle radius from parameters
   */
  private extractCircleRadius(): number {
    const circleNode = this.originalOpenscadNode as CircleNode;

    if (circleNode.r !== undefined) {
      return circleNode.r;
    }

    if (circleNode.d !== undefined) {
      return circleNode.d / 2;
    }

    return 1; // Default radius
  }

  /**
   * Extract circle segments for tessellation using OpenSCAD global variable inheritance
   */
  private extractCircleSegments(): number {
    const circleNode = this.originalOpenscadNode as CircleNode;
    const radius = this.extractCircleRadius();

    // Get local tessellation parameters from the circle node
    const localFn = circleNode.$fn;
    const localFa = circleNode.$fa;
    const localFs = circleNode.$fs;

    // Resolve parameters using OpenSCAD inheritance rules
    const { fn, fa, fs } = this.resolveTessellationParameters(localFn, localFa, localFs);

    // Use the centralized fragment calculation function
    const finalFragments = calculateFragments(radius, fn, fa, fs);

    logger.debug(
      `[EXTRACT_CIRCLE_SEGMENTS] Circle segments calculated: ${finalFragments} ` +
        `(radius=${radius}, $fn=${fn}, $fa=${fa}, $fs=${fs})`
    );

    return finalFragments;
  }

  /**
   * Extract square size from parameters
   */
  private extractSquareSize(): Vector3 {
    const squareNode = this.originalOpenscadNode as SquareNode;
    const size = squareNode.size;

    if (Array.isArray(size) && size.length >= 2) {
      return {
        x: typeof size[0] === 'number' ? size[0] : 1,
        y: typeof size[1] === 'number' ? size[1] : 1,
        z: 0, // 2D shape has no depth
      } as Vector3;
    }

    if (typeof size === 'number') {
      return { x: size, y: size, z: 0 } as Vector3;
    }

    return { x: 1, y: 1, z: 0 } as Vector3; // Default size
  }

  /**
   * Extract square center parameter
   */
  private extractSquareCenter(): boolean {
    const squareNode = this.originalOpenscadNode as SquareNode;
    return squareNode.center ?? false; // OpenSCAD default is false
  }

  /**
   * Extract polygon points from parameters
   */
  private extractPolygonPoints(): number[][] {
    const polygonNode = this.originalOpenscadNode as PolygonNode;
    return polygonNode.points ?? []; // Default empty points
  }

  /**
   * Check if polygon vertices are in counter-clockwise order
   * Uses the shoelace formula to determine winding order
   */
  private isPolygonCounterClockwise(vertices: Vector3[]): boolean {
    if (vertices.length < 3) return true; // Not enough points to determine

    let sum = 0;
    for (let i = 0; i < vertices.length; i++) {
      const current = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      if (current && next) {
        sum += (next.x - current.x) * (next.y + current.y);
      }
    }

    // If sum is negative, polygon is counter-clockwise
    return sum < 0;
  }

  /**
   * Create custom polygon mesh from earcut triangulation with double-sided rendering
   *
   * Creates a truly double-sided polygon by duplicating vertices and triangles
   * for both front and back faces with proper normals for visibility from all angles.
   */
  private createCustomPolygonMesh(
    vertices: Vector3[],
    triangles: number[],
    scene: Scene
  ): AbstractMesh {
    const vertexCount = vertices.length;

    // Create vertex data arrays for double-sided mesh
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    // Add front face vertices (original vertices)
    for (const vertex of vertices) {
      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(0, 0, 1); // Normal pointing up (Z+) for front face
    }

    // Add back face vertices (same positions, different normals)
    for (const vertex of vertices) {
      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(0, 0, -1); // Normal pointing down (Z-) for back face
    }

    // Add front face triangle indices (original winding order)
    for (let i = 0; i < triangles.length; i++) {
      const triangleIndex = triangles[i];
      if (triangleIndex !== undefined) {
        indices.push(triangleIndex);
      }
    }

    // Add back face triangle indices (reversed winding order for proper culling)
    for (let i = triangles.length - 1; i >= 0; i -= 3) {
      // Reverse triangle winding order for back face
      const idx1 = triangles[i - 2];
      const idx2 = triangles[i - 1];
      const idx3 = triangles[i];

      if (idx1 !== undefined && idx2 !== undefined && idx3 !== undefined) {
        // Add vertex offset for back face vertices and reverse order
        indices.push(idx1 + vertexCount, idx3 + vertexCount, idx2 + vertexCount);
      }
    }

    // Create mesh and apply vertex data
    const mesh = new Mesh(this.name, scene);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;

    vertexData.applyToMesh(mesh);

    return mesh;
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
      case 'circle': {
        const circleNode = node as CircleNode;
        params.radius = circleNode.r;
        params.diameter = circleNode.d;
        params.fn = circleNode.$fn;
        params.fa = circleNode.$fa;
        params.fs = circleNode.$fs;
        break;
      }
      case 'square': {
        const squareNode = node as SquareNode;
        params.size = squareNode.size;
        params.center = squareNode.center;
        break;
      }
      case 'polygon': {
        const polygonNode = node as PolygonNode;
        params.points = polygonNode.points;
        params.paths = polygonNode.paths;
        params.convexity = polygonNode.convexity;
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
      case 'circle': {
        const radius = this.extractCircleRadius();
        if (radius <= 0) {
          throw new Error('Circle radius must be positive');
        }
        break;
      }
      case 'square': {
        const size = this.extractSquareSize();
        if (size.x <= 0 || size.y <= 0) {
          throw new Error('Square dimensions must be positive');
        }
        break;
      }
      case 'polygon': {
        const points = this.extractPolygonPoints();
        if (points.length < 3) {
          throw new Error('Polygon must have at least 3 points');
        }
        break;
      }
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
      this.openscadGlobals,
      this.sourceLocation
    );

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
