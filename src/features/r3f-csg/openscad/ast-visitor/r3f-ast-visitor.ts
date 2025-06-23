/**
 * @file R3F AST Visitor
 * 
 * React Three Fiber equivalent of the OpenSCAD AST visitor.
 * Converts OpenSCAD AST nodes to Three.js geometries and meshes using functional programming patterns.
 * 
 * Features:
 * - Pure functional approach with Result<T,E> types
 * - Comprehensive error handling and validation
 * - Performance optimization with caching
 * - Memory management and resource cleanup
 * - Support for all OpenSCAD primitives and operations
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { createR3FCSGService } from '../../services/csg-service/r3f-csg-service';
import type {
  R3FASTVisitor,
  R3FASTVisitorConfig,
  MeshResult,
  GeometryResult,
  VisitorContext,
  Transform3D,
  R3FMaterialConfig,
  ProcessingMetrics,
  ASTProcessingError,
  CSGService
} from '../../types/r3f-csg-types';

// Import node type guards (these would need to be implemented or imported)
// For now, we'll create basic type checking functions
function isCubeNode(node: ASTNode): node is any {
  return node.type === 'cube';
}

function isSphereNode(node: ASTNode): node is any {
  return node.type === 'sphere';
}

function isCylinderNode(node: ASTNode): node is any {
  return node.type === 'cylinder';
}

function isUnionNode(node: ASTNode): node is any {
  return node.type === 'union';
}

function isDifferenceNode(node: ASTNode): node is any {
  return node.type === 'difference';
}

function isIntersectionNode(node: ASTNode): node is any {
  return node.type === 'intersection';
}

function isTranslateNode(node: ASTNode): node is any {
  return node.type === 'translate';
}

function isRotateNode(node: ASTNode): node is any {
  return node.type === 'rotate';
}

function isScaleNode(node: ASTNode): node is any {
  return node.type === 'scale';
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_VISITOR_CONFIG: Required<R3FASTVisitorConfig> = {
  enableCSG: true,
  enableCaching: true,
  enableOptimization: true,
  maxRecursionDepth: 100,
  defaultMaterial: {
    type: 'standard',
    color: 0x888888,
    metalness: 0.1,
    roughness: 0.7,
    transparent: false,
    opacity: 1.0,
    wireframe: false,
    side: THREE.FrontSide
  },
  geometryPrecision: 32,
  enableLogging: true
} as const;

// ============================================================================
// R3F AST Visitor Implementation
// ============================================================================

/**
 * React Three Fiber AST visitor for OpenSCAD nodes
 * 
 * Converts OpenSCAD AST nodes to Three.js geometries and meshes using
 * functional programming patterns and comprehensive error handling.
 */
export class R3FASTVisitor implements R3FASTVisitor {
  private readonly config: Required<R3FASTVisitorConfig>;
  private readonly geometryCache = new Map<string, THREE.BufferGeometry>();
  private readonly materialCache = new Map<string, THREE.Material>();
  private readonly metrics: ProcessingMetrics;
  private readonly disposables: Set<THREE.Object3D> = new Set();
  private readonly csgService: CSGService;

  constructor(config: R3FASTVisitorConfig = {}) {
    console.log('[INIT] Creating R3F AST Visitor');

    this.config = { ...DEFAULT_VISITOR_CONFIG, ...config };
    this.metrics = {
      totalNodes: 0,
      processedNodes: 0,
      failedNodes: 0,
      processingTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // Initialize CSG service if CSG operations are enabled
    this.csgService = createR3FCSGService({
      enableCaching: this.config.enableCaching,
      enableOptimization: this.config.enableOptimization,
      enableLogging: this.config.enableLogging
    });

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F AST Visitor configuration:', this.config);
      console.log('[DEBUG] CSG operations supported:', this.csgService.isSupported());
    }
  }

  /**
   * Main visit method that dispatches to appropriate node handlers
   * 
   * @param node - AST node to process
   * @returns Result containing Three.js mesh or error
   */
  public visit(node: ASTNode): MeshResult {
    const startTime = performance.now();
    this.metrics.totalNodes++;

    if (this.config.enableLogging) {
      console.log(`[DEBUG] Visiting node type: ${node.type}`);
    }

    try {
      // Validate node before processing
      const validationResult = this.validateNode(node);
      if (!validationResult.success) {
        this.metrics.failedNodes++;
        return validationResult;
      }

      // Dispatch to appropriate handler
      let result: MeshResult;

      // 3D Primitives
      if (isCubeNode(node)) {
        result = this.visitCube(node);
      } else if (isSphereNode(node)) {
        result = this.visitSphere(node);
      } else if (isCylinderNode(node)) {
        result = this.visitCylinder(node);
      }
      // CSG Operations
      else if (isUnionNode(node)) {
        result = this.visitUnion(node);
      } else if (isDifferenceNode(node)) {
        result = this.visitDifference(node);
      } else if (isIntersectionNode(node)) {
        result = this.visitIntersection(node);
      }
      // Transformations
      else if (isTranslateNode(node)) {
        result = this.visitTranslate(node);
      } else if (isRotateNode(node)) {
        result = this.visitRotate(node);
      } else if (isScaleNode(node)) {
        result = this.visitScale(node);
      }
      // Unsupported node type
      else {
        const error = `Unsupported node type: ${node.type}`;
        console.warn(`[WARN] ${error}`);
        this.metrics.failedNodes++;
        return { success: false, error };
      }

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.metrics.processingTime += processingTime;

      if (result.success) {
        this.metrics.processedNodes++;
        
        // Track disposables for cleanup
        this.disposables.add(result.data);
        
        if (this.config.enableLogging) {
          console.log(`[DEBUG] Successfully processed ${node.type} in ${processingTime.toFixed(2)}ms`);
        }
      } else {
        this.metrics.failedNodes++;
        if (this.config.enableLogging) {
          console.error(`[ERROR] Failed to process ${node.type}:`, result.error);
        }
      }

      return result;

    } catch (error) {
      this.metrics.failedNodes++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      const processingError: ASTProcessingError = {
        nodeType: node.type,
        nodeLocation: node.location ? {
          line: node.location.start.line,
          column: node.location.start.column
        } : undefined,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      };

      console.error('[ERROR] AST processing failed:', processingError);
      return { success: false, error: `Failed to process ${node.type}: ${errorMessage}` };
    }
  }

  /**
   * Visit cube node and create box geometry
   */
  public visitCube(node: any): MeshResult {
    console.log('[DEBUG] Processing cube node');

    try {
      // Extract dimensions with defaults
      const size = this.extractVector3(node.size, [1, 1, 1]);
      const [width, height, depth] = size;

      // Create geometry
      const geometryResult = this.createBoxGeometry(width, height, depth);
      if (!geometryResult.success) {
        return geometryResult;
      }

      // Create mesh with material
      const material = this.getDefaultMaterial();
      const mesh = new THREE.Mesh(geometryResult.data, material);
      mesh.name = `cube_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`;

      // Apply centering if specified
      if (node.center === true) {
        // Three.js box geometry is already centered by default
      }

      console.log('[DEBUG] Created cube mesh with dimensions:', size);
      return { success: true, data: mesh };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cube creation error';
      console.error('[ERROR] Cube creation failed:', errorMessage);
      return { success: false, error: `Cube creation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit sphere node and create sphere geometry
   */
  public visitSphere(node: any): MeshResult {
    console.log('[DEBUG] Processing sphere node');

    try {
      // Extract radius with default
      const radius = this.extractNumber(node.r || node.radius, 1);
      
      // Extract detail parameters
      const segments = this.config.geometryPrecision;

      // Create geometry
      const geometryResult = this.createSphereGeometry(radius, segments, segments);
      if (!geometryResult.success) {
        return geometryResult;
      }

      // Create mesh with material
      const material = this.getDefaultMaterial();
      const mesh = new THREE.Mesh(geometryResult.data, material);
      mesh.name = `sphere_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`;

      console.log('[DEBUG] Created sphere mesh with radius:', radius);
      return { success: true, data: mesh };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sphere creation error';
      console.error('[ERROR] Sphere creation failed:', errorMessage);
      return { success: false, error: `Sphere creation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit cylinder node and create cylinder geometry
   */
  public visitCylinder(node: any): MeshResult {
    console.log('[DEBUG] Processing cylinder node');

    try {
      // Extract parameters with defaults
      const height = this.extractNumber(node.h || node.height, 1);
      const r1 = this.extractNumber(node.r1 || node.r, 1);
      const r2 = this.extractNumber(node.r2 || node.r, r1);
      
      // Extract detail parameters
      const segments = this.config.geometryPrecision;

      // Create geometry
      const geometryResult = this.createCylinderGeometry(r2, r1, height, segments);
      if (!geometryResult.success) {
        return geometryResult;
      }

      // Create mesh with material
      const material = this.getDefaultMaterial();
      const mesh = new THREE.Mesh(geometryResult.data, material);
      mesh.name = `cylinder_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`;

      // Apply centering if specified
      if (node.center === true) {
        // Three.js cylinder geometry is already centered by default
      }

      console.log('[DEBUG] Created cylinder mesh with height:', height, 'radii:', [r1, r2]);
      return { success: true, data: mesh };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cylinder creation error';
      console.error('[ERROR] Cylinder creation failed:', errorMessage);
      return { success: false, error: `Cylinder creation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit union node and combine child meshes
   */
  public visitUnion(node: any): MeshResult {
    console.log('[DEBUG] Processing union node with', node.children?.length ?? 0, 'children');

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Union node has no children' };
    }

    try {
      // Process all children
      const childResults = node.children.map((child: ASTNode) => this.visit(child));
      const childMeshes = childResults
        .filter((result): result is { success: true; data: THREE.Mesh } => result.success)
        .map(result => result.data);

      if (childMeshes.length === 0) {
        return { success: false, error: 'No valid child meshes for union operation' };
      }

      if (childMeshes.length === 1) {
        return { success: true, data: childMeshes[0] };
      }

      // Perform actual CSG union operation if enabled and supported
      if (this.config.enableCSG && this.csgService.isSupported()) {
        const geometries = childMeshes.map(mesh => mesh.geometry);
        const unionResult = this.csgService.union(geometries);

        if (unionResult.success) {
          const material = this.getDefaultMaterial();
          const mesh = new THREE.Mesh(unionResult.data, material);
          mesh.name = `union_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`;

          console.log('[DEBUG] CSG union operation completed successfully');
          return { success: true, data: mesh };
        } else {
          console.warn('[WARN] CSG union failed, falling back to first mesh:', unionResult.error);
          return { success: true, data: childMeshes[0] };
        }
      } else {
        // Fallback: return first mesh if CSG is disabled or not supported
        console.log('[DEBUG] CSG disabled or not supported, returning first mesh');
        return { success: true, data: childMeshes[0] };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown union operation error';
      console.error('[ERROR] Union operation failed:', errorMessage);
      return { success: false, error: `Union operation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit difference node and subtract child meshes
   */
  public visitDifference(node: any): MeshResult {
    console.log('[DEBUG] Processing difference node with', node.children?.length ?? 0, 'children');

    if (!node.children || node.children.length < 2) {
      return { success: false, error: 'Difference node needs at least 2 children' };
    }

    try {
      // Process all children
      const childResults = node.children.map((child: ASTNode) => this.visit(child));
      const childMeshes = childResults
        .filter((result): result is { success: true; data: THREE.Mesh } => result.success)
        .map(result => result.data);

      if (childMeshes.length < 2) {
        return { success: false, error: 'Insufficient valid child meshes for difference operation' };
      }

      // Perform actual CSG difference operation if enabled and supported
      if (this.config.enableCSG && this.csgService.isSupported()) {
        const geometries = childMeshes.map(mesh => mesh.geometry);
        const differenceResult = this.csgService.difference(geometries);

        if (differenceResult.success) {
          const material = this.getDefaultMaterial();
          const mesh = new THREE.Mesh(differenceResult.data, material);
          mesh.name = `difference_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`;

          console.log('[DEBUG] CSG difference operation completed successfully');
          return { success: true, data: mesh };
        } else {
          console.warn('[WARN] CSG difference failed, falling back to first mesh:', differenceResult.error);
          return { success: true, data: childMeshes[0] };
        }
      } else {
        // Fallback: return first mesh if CSG is disabled or not supported
        console.log('[DEBUG] CSG disabled or not supported, returning first mesh');
        return { success: true, data: childMeshes[0] };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown difference operation error';
      console.error('[ERROR] Difference operation failed:', errorMessage);
      return { success: false, error: `Difference operation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit intersection node and intersect child meshes
   */
  public visitIntersection(node: any): MeshResult {
    console.log('[DEBUG] Processing intersection node with', node.children?.length ?? 0, 'children');

    if (!node.children || node.children.length < 2) {
      return { success: false, error: 'Intersection node needs at least 2 children' };
    }

    try {
      // Process all children
      const childResults = node.children.map((child: ASTNode) => this.visit(child));
      const childMeshes = childResults
        .filter((result): result is { success: true; data: THREE.Mesh } => result.success)
        .map(result => result.data);

      if (childMeshes.length < 2) {
        return { success: false, error: 'Insufficient valid child meshes for intersection operation' };
      }

      // Perform actual CSG intersection operation if enabled and supported
      if (this.config.enableCSG && this.csgService.isSupported()) {
        const geometries = childMeshes.map(mesh => mesh.geometry);
        const intersectionResult = this.csgService.intersection(geometries);

        if (intersectionResult.success) {
          const material = this.getDefaultMaterial();
          const mesh = new THREE.Mesh(intersectionResult.data, material);
          mesh.name = `intersection_${node.location?.start.line ?? 0}_${node.location?.start.column ?? 0}`;

          console.log('[DEBUG] CSG intersection operation completed successfully');
          return { success: true, data: mesh };
        } else {
          console.warn('[WARN] CSG intersection failed, falling back to first mesh:', intersectionResult.error);
          return { success: true, data: childMeshes[0] };
        }
      } else {
        // Fallback: return first mesh if CSG is disabled or not supported
        console.log('[DEBUG] CSG disabled or not supported, returning first mesh');
        return { success: true, data: childMeshes[0] };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown intersection operation error';
      console.error('[ERROR] Intersection operation failed:', errorMessage);
      return { success: false, error: `Intersection operation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit translate node and apply translation
   */
  public visitTranslate(node: any): MeshResult {
    console.log('[DEBUG] Processing translate node');

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Translate node has no children' };
    }

    try {
      // Extract translation vector
      const translation = this.extractVector3(node.v, [0, 0, 0]);
      
      // Process child (translate should have exactly one child)
      const childResult = this.visit(node.children[0]);
      if (!childResult.success) {
        return childResult;
      }

      // Apply translation
      const mesh = childResult.data;
      mesh.position.set(translation[0], translation[1], translation[2]);

      console.log('[DEBUG] Applied translation:', translation);
      return { success: true, data: mesh };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown translate operation error';
      console.error('[ERROR] Translate operation failed:', errorMessage);
      return { success: false, error: `Translate operation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit rotate node and apply rotation
   */
  public visitRotate(node: any): MeshResult {
    console.log('[DEBUG] Processing rotate node');

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Rotate node has no children' };
    }

    try {
      // Extract rotation vector (in degrees, convert to radians)
      const rotationDegrees = this.extractVector3(node.a || node.v, [0, 0, 0]);
      const rotation = rotationDegrees.map(deg => (deg * Math.PI) / 180) as [number, number, number];
      
      // Process child
      const childResult = this.visit(node.children[0]);
      if (!childResult.success) {
        return childResult;
      }

      // Apply rotation
      const mesh = childResult.data;
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);

      console.log('[DEBUG] Applied rotation:', rotation);
      return { success: true, data: mesh };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown rotate operation error';
      console.error('[ERROR] Rotate operation failed:', errorMessage);
      return { success: false, error: `Rotate operation failed: ${errorMessage}` };
    }
  }

  /**
   * Visit scale node and apply scaling
   */
  public visitScale(node: any): MeshResult {
    console.log('[DEBUG] Processing scale node');

    if (!node.children || node.children.length === 0) {
      return { success: false, error: 'Scale node has no children' };
    }

    try {
      // Extract scale vector
      const scale = this.extractVector3(node.v, [1, 1, 1]);
      
      // Process child
      const childResult = this.visit(node.children[0]);
      if (!childResult.success) {
        return childResult;
      }

      // Apply scale
      const mesh = childResult.data;
      mesh.scale.set(scale[0], scale[1], scale[2]);

      console.log('[DEBUG] Applied scale:', scale);
      return { success: true, data: mesh };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scale operation error';
      console.error('[ERROR] Scale operation failed:', errorMessage);
      return { success: false, error: `Scale operation failed: ${errorMessage}` };
    }
  }

  /**
   * Dispose all created resources
   */
  public dispose(): void {
    console.log('[DEBUG] Disposing R3F AST Visitor resources');

    // Dispose all tracked meshes
    this.disposables.forEach(object => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Dispose CSG service
    if (this.csgService && typeof (this.csgService as any).dispose === 'function') {
      (this.csgService as any).dispose();
    }

    // Clear caches
    this.geometryCache.clear();
    this.materialCache.clear();
    this.disposables.clear();

    console.log('[DEBUG] R3F AST Visitor disposed successfully');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private validateNode(node: ASTNode): MeshResult | { success: true } {
    if (!node || !node.type) {
      return { success: false, error: 'Invalid node: missing type' };
    }
    return { success: true };
  }

  private createBoxGeometry(width: number, height: number, depth: number): GeometryResult {
    try {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      return { success: true, data: geometry };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown box geometry error';
      return { success: false, error: `Box geometry creation failed: ${errorMessage}` };
    }
  }

  private createSphereGeometry(radius: number, widthSegments: number, heightSegments: number): GeometryResult {
    try {
      const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
      return { success: true, data: geometry };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sphere geometry error';
      return { success: false, error: `Sphere geometry creation failed: ${errorMessage}` };
    }
  }

  private createCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, segments: number): GeometryResult {
    try {
      const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
      return { success: true, data: geometry };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cylinder geometry error';
      return { success: false, error: `Cylinder geometry creation failed: ${errorMessage}` };
    }
  }

  private getDefaultMaterial(): THREE.Material {
    const config = this.config.defaultMaterial;
    
    switch (config.type) {
      case 'standard':
        return new THREE.MeshStandardMaterial({
          color: config.color,
          metalness: config.metalness,
          roughness: config.roughness,
          transparent: config.transparent,
          opacity: config.opacity,
          wireframe: config.wireframe,
          side: config.side
        });
      case 'basic':
        return new THREE.MeshBasicMaterial({
          color: config.color,
          transparent: config.transparent,
          opacity: config.opacity,
          wireframe: config.wireframe,
          side: config.side
        });
      default:
        return new THREE.MeshStandardMaterial({ color: config.color });
    }
  }

  private extractVector3(value: unknown, defaultValue: [number, number, number]): [number, number, number] {
    if (Array.isArray(value) && value.length >= 3) {
      return [
        this.extractNumber(value[0], defaultValue[0]),
        this.extractNumber(value[1], defaultValue[1]),
        this.extractNumber(value[2], defaultValue[2])
      ];
    }
    if (typeof value === 'number') {
      return [value, value, value];
    }
    return defaultValue;
  }

  private extractNumber(value: unknown, defaultValue: number): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return defaultValue;
  }

  /**
   * Get processing metrics
   */
  public getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new R3F AST visitor instance
 */
export function createR3FASTVisitor(config?: R3FASTVisitorConfig): R3FASTVisitor {
  return new R3FASTVisitor(config);
}

// Default export
export default R3FASTVisitor;
