/**
 * CSG Core Service
 * 
 * Core Constructive Solid Geometry service extracted from CSG.ts utility class
 * following bulletproof-react service patterns with dependency injection and Result<T,E> error handling.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Material,
  Matrix3,
  Matrix4,
  Mesh,
  TypedArray,
  Vector3,
} from 'three';
import { NBuf2, NBuf3 } from '../utils/NBuf';
import { Vector } from '../utils/Vector';
import { BSPTreeNode, BSPTreeService } from './bsp-tree.service';
import { MatrixIntegrationService } from './matrix-integration.service';
import { matrixServiceContainer } from './matrix-service-container';
import type {
  PolygonData,
  VertexData,
  CSGData
} from '../types/geometry.types';
import {
  createVertex,
  createPolygon,
  clonePolygon,
  isValidPolygon,
  createPlaneFromPoints,
  splitPolygonByPlane
} from '../utils/geometry-utils';
import { GEOMETRY_CONFIG } from '../config/geometry-config';
import { success, error } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

/**
 * CSG Core Service
 * Enhanced with matrix integration service for robust matrix operations
 */
export class CSGCoreService implements CSGData {
  private _polygons: PolygonData[] = [];
  private bspService: BSPTreeService;
  private matrixIntegration: MatrixIntegrationService;

  constructor(matrixIntegration?: MatrixIntegrationService) {
    console.log('[INIT][CSGCoreService] Initializing enhanced CSG core service');
    this.bspService = new BSPTreeService();
    this.matrixIntegration = matrixIntegration || new MatrixIntegrationService(matrixServiceContainer);
  }

  /**
   * Get polygons (implements CSGData interface)
   */
  get polygons(): PolygonData[] {
    return this._polygons;
  }

  /**
   * Set polygons
   */
  set polygons(value: PolygonData[]) {
    this._polygons = value;
  }

  /**
   * Create CSG from polygons
   */
  static fromPolygons(polygons: PolygonData[]): Result<CSGCoreService, string> {
    console.log(`[DEBUG][CSGCoreService] Creating CSG from ${polygons.length} polygons`);
    
    try {
      const csg = new CSGCoreService();
      const validPolygons = polygons.filter(isValidPolygon);
      
      if (validPolygons.length !== polygons.length) {
        console.warn(`[WARN][CSGCoreService] Filtered out ${polygons.length - validPolygons.length} invalid polygons`);
      }
      
      csg._polygons = validPolygons;
      return success(csg);
    } catch (err) {
      const errorMessage = `Failed to create CSG from polygons: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Create CSG from Three.js BufferGeometry
   */
  static fromGeometry(geom: BufferGeometry, objectIndex?: any): Result<CSGCoreService, string> {
    console.log('[DEBUG][CSGCoreService] Creating CSG from BufferGeometry');
    
    try {
      const polys: PolygonData[] = [];
      const posattr = geom.attributes.position;
      const normalattr = geom.attributes.normal;
      const uvattr = geom.attributes.uv;
      const colorattr = geom.attributes.color;
      const grps = geom.groups;
      let index: TypedArray;

      if (geom.index) {
        index = geom.index.array;
      } else {
        index = new Uint16Array((posattr.array.length / posattr.itemSize) | 0);
        for (let i = 0; i < index.length; i++) index[i] = i;
      }

      const triCount = (index.length / 3) | 0;

      for (let i = 0, pli = 0, l = index.length; i < l; i += 3, pli++) {
        const vertices: VertexData[] = [];
        
        for (let j = 0; j < 3; j++) {
          const vi = index[i + j];
          const vp = vi * 3;
          const vt = vi * 2;
          const x = posattr.array[vp];
          const y = posattr.array[vp + 1];
          const z = posattr.array[vp + 2];
          const nx = normalattr.array[vp];
          const ny = normalattr.array[vp + 1];
          const nz = normalattr.array[vp + 2];
          const u = uvattr?.array[vt] || 0;
          const v = uvattr?.array[vt + 1] || 0;

          const color = colorattr ? new Vector(
            colorattr.array[vp],
            colorattr.array[vp + 1],
            colorattr.array[vp + 2]
          ) : undefined;

          vertices[j] = createVertex(
            new Vector(x, y, z),
            new Vector(nx, ny, nz),
            new Vector(u, v, 0),
            color
          );
        }

        let materialIndex = objectIndex;
        if (objectIndex === undefined && grps && grps.length > 0) {
          for (const grp of grps) {
            if (i >= grp.start && i < grp.start + grp.count) {
              materialIndex = grp.materialIndex;
              break;
            }
          }
        }

        try {
          const polygon = createPolygon(vertices, materialIndex);
          polys.push(polygon);
        } catch (polygonError) {
          console.warn('[WARN][CSGCoreService] Skipping invalid triangle:', polygonError);
        }
      }

      return CSGCoreService.fromPolygons(
        polys.filter(p => Number.isFinite(p.plane.normal.x))
      );
    } catch (err) {
      const errorMessage = `Failed to create CSG from geometry: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Convert CSG to Three.js BufferGeometry with enhanced matrix operations
   */
  static async toGeometry(csg: CSGCoreService, toMatrix: Matrix4): Promise<Result<BufferGeometry, string>> {
    console.log('[DEBUG][CSGCoreService] Converting CSG to BufferGeometry with enhanced matrix operations');

    try {
      let triCount = 0;
      const ps = csg.polygons;

      for (const p of ps) {
        triCount += p.vertices.length - 2;
      }

      if (!GEOMETRY_CONFIG.performance.maxTriangles ||
          triCount > GEOMETRY_CONFIG.performance.maxTriangles) {
        return error(`Triangle count ${triCount} exceeds maximum ${GEOMETRY_CONFIG.performance.maxTriangles}`);
      }

      const geom = new BufferGeometry();
      const vertices = new NBuf3(triCount * 3 * 3);
      const normals = new NBuf3(triCount * 3 * 3);
      const uvs = new NBuf2(triCount * 2 * 3);
      let colors: NBuf3 | undefined;
      const grps: number[][] = [];
      const dgrp: number[] = [];

      for (const p of ps) {
        const pvs = p.vertices;
        const pvlen = pvs.length;
        
        if (p.shared !== undefined) {
          if (!grps[p.shared]) grps[p.shared] = [];
        }
        
        if (pvlen && pvs[0].color !== undefined) {
          if (!colors) colors = new NBuf3(triCount * 3 * 3);
        }
        
        for (let j = 3; j <= pvlen; j++) {
          const grp = p.shared === undefined ? dgrp : grps[p.shared];
          grp.push(vertices.top / 3, vertices.top / 3 + 1, vertices.top / 3 + 2);
          
          vertices.write(pvs[0].pos);
          vertices.write(pvs[j - 2].pos);
          vertices.write(pvs[j - 1].pos);
          
          normals.write(pvs[0].normal);
          normals.write(pvs[j - 2].normal);
          normals.write(pvs[j - 1].normal);
          
          uvs.write(pvs[0].uv);
          uvs.write(pvs[j - 2].uv);
          uvs.write(pvs[j - 1].uv);
          
          if (colors && pvs[0].color) {
            colors.write(pvs[0].color);
            colors.write(pvs[j - 2].color || pvs[0].color);
            colors.write(pvs[j - 1].color || pvs[0].color);
          }
        }
      }

      geom.setAttribute('position', new BufferAttribute(vertices.array, 3));
      geom.setAttribute('normal', new BufferAttribute(normals.array, 3));
      geom.setAttribute('uv', new BufferAttribute(uvs.array, 2));
      
      if (colors) {
        geom.setAttribute('color', new BufferAttribute(colors.array, 3));
      }

      let index: number[] = [];
      if (grps.length) {
        let gbase = 0;
        for (let gi = 0; gi < grps.length; gi++) {
          geom.addGroup(gbase, grps[gi].length, gi);
          index = index.concat(grps[gi]);
          gbase += grps[gi].length;
        }
        geom.addGroup(gbase, dgrp.length, grps.length);
        index = index.concat(dgrp);
        geom.setIndex(index);
      }

      // Use enhanced matrix operations for robust inversion
      const matrixIntegration = new MatrixIntegrationService(matrixServiceContainer);
      const inversionResult = await matrixIntegration.convertMatrix4ToMLMatrix(toMatrix, {
        useValidation: true,
        useTelemetry: true,
        enableSVDFallback: true
      });

      if (!inversionResult.success) {
        return error(`Matrix conversion failed: ${inversionResult.error}`);
      }

      const robustInversionResult = await matrixIntegration.performRobustInversion(
        inversionResult.data.result,
        {
          useValidation: true,
          useTelemetry: true,
          enableSVDFallback: true
        }
      );

      if (!robustInversionResult.success) {
        return error(`Matrix inversion failed: ${robustInversionResult.error}`);
      }

      // Convert back to Three.js Matrix4
      const conversionService = matrixServiceContainer.getConversionService();
      const matrix4Result = await conversionService.convertMLMatrixToMatrix4(
        robustInversionResult.data.result,
        { useCache: true, validateInput: true }
      );

      if (!matrix4Result.success) {
        return error(`Matrix4 conversion failed: ${matrix4Result.error}`);
      }

      const inv = matrix4Result.data.result;
      geom.applyMatrix4(inv);
      geom.computeBoundingSphere();
      geom.computeBoundingBox();

      console.log('[DEBUG][CSGCoreService] Enhanced BufferGeometry conversion completed');
      return success(geom);
    } catch (err) {
      const errorMessage = `Failed to convert CSG to geometry: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Create CSG from Three.js Mesh with enhanced matrix validation
   */
  static async fromMesh(mesh: Mesh, objectIndex?: any): Promise<Result<CSGCoreService, string>> {
    console.log('[DEBUG][CSGCoreService] Creating CSG from Mesh with enhanced matrix validation');

    try {
      // Validate mesh matrix using matrix integration service
      const matrixIntegration = new MatrixIntegrationService(matrixServiceContainer);
      const matrixValidationResult = await matrixIntegration.convertMatrix4ToMLMatrix(mesh.matrix, {
        useValidation: true,
        useTelemetry: true
      });

      if (!matrixValidationResult.success) {
        return error(`Mesh matrix validation failed: ${matrixValidationResult.error}`);
      }

      if (matrixValidationResult.data.validation?.warnings.length) {
        console.warn('[WARN][CSGCoreService] Matrix validation warnings:', matrixValidationResult.data.validation.warnings);
      }

      const csgResult = CSGCoreService.fromGeometry(mesh.geometry, objectIndex);
      if (!csgResult.success) return csgResult;

      const csg = csgResult.data;
      const ttvv0 = new Vector3();
      const tmpm3 = new Matrix3();

      // Use enhanced normal matrix computation
      const normalMatrixResult = await matrixIntegration.computeEnhancedNormalMatrix(mesh.matrix, {
        useValidation: true,
        useTelemetry: true,
        enableSVDFallback: true
      });

      if (normalMatrixResult.success) {
        tmpm3.copy(normalMatrixResult.data.result);
      } else {
        console.warn('[WARN][CSGCoreService] Enhanced normal matrix computation failed, using fallback:', normalMatrixResult.error);
        tmpm3.getNormalMatrix(mesh.matrix);
      }
      
      for (let i = 0; i < csg.polygons.length; i++) {
        const p = csg.polygons[i];
        const transformedVertices: VertexData[] = [];
        
        for (const v of p.vertices) {
          const transformedPos = ttvv0.copy(v.pos.toVector3()).applyMatrix4(mesh.matrix);
          const transformedNormal = ttvv0.copy(v.normal.toVector3()).applyMatrix3(tmpm3);
          
          transformedVertices.push({
            ...v,
            pos: new Vector().copy(transformedPos),
            normal: new Vector().copy(transformedNormal)
          });
        }
        
        csg.polygons[i] = {
          ...p,
          vertices: transformedVertices
        };
      }
      
      return success(csg);
    } catch (err) {
      const errorMessage = `Failed to create CSG from mesh: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Convert CSG to Three.js Mesh with enhanced matrix operations
   */
  static async toMesh(
    csg: CSGCoreService,
    toMatrix: Matrix4,
    toMaterial?: Material | Material[]
  ): Promise<Result<Mesh, string>> {
    console.log('[DEBUG][CSGCoreService] Converting CSG to Mesh with enhanced matrix operations');

    try {
      const geomResult = await CSGCoreService.toGeometry(csg, toMatrix);
      if (!geomResult.success) return geomResult;
      
      const m = new Mesh(geomResult.data, toMaterial);
      m.matrix.copy(toMatrix);
      m.matrix.decompose(m.position, m.quaternion, m.scale);
      m.rotation.setFromQuaternion(m.quaternion);
      m.updateMatrixWorld();
      
      if (GEOMETRY_CONFIG.csg.enableShadows) {
        m.castShadow = true;
      }
      if (GEOMETRY_CONFIG.csg.enableShadowReceiving) {
        m.receiveShadow = true;
      }
      
      return success(m);
    } catch (err) {
      const errorMessage = `Failed to convert CSG to mesh: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Static union operation
   */
  static union(meshA: Mesh, meshB: Mesh): Result<Mesh, string> {
    console.log('[DEBUG][CSGCoreService] Performing static union operation');
    
    try {
      const csgAResult = CSGCoreService.fromMesh(meshA);
      if (!csgAResult.success) return csgAResult;

      const csgBResult = CSGCoreService.fromMesh(meshB);
      if (!csgBResult.success) return csgBResult;

      const unionResult = csgAResult.data.union(csgBResult.data);
      if (!unionResult.success) return unionResult;
      
      return CSGCoreService.toMesh(unionResult.data, meshA.matrix, meshA.material);
    } catch (err) {
      const errorMessage = `Static union failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Static subtract operation
   */
  static subtract(meshA: Mesh, meshB: Mesh): Result<Mesh, string> {
    console.log('[DEBUG][CSGCoreService] Performing static subtract operation');
    
    try {
      const csgAResult = CSGCoreService.fromMesh(meshA);
      if (!csgAResult.success) return csgAResult;

      const csgBResult = CSGCoreService.fromMesh(meshB);
      if (!csgBResult.success) return csgBResult;

      const subtractResult = csgAResult.data.subtract(csgBResult.data);
      if (!subtractResult.success) return subtractResult;
      
      return CSGCoreService.toMesh(subtractResult.data, meshA.matrix, meshA.material);
    } catch (err) {
      const errorMessage = `Static subtract failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Static intersect operation
   */
  static intersect(meshA: Mesh, meshB: Mesh): Result<Mesh, string> {
    console.log('[DEBUG][CSGCoreService] Performing static intersect operation');
    
    try {
      const csgAResult = CSGCoreService.fromMesh(meshA);
      if (!csgAResult.success) return csgAResult;

      const csgBResult = CSGCoreService.fromMesh(meshB);
      if (!csgBResult.success) return csgBResult;

      const intersectResult = csgAResult.data.intersect(csgBResult.data);
      if (!intersectResult.success) return intersectResult;
      
      return CSGCoreService.toMesh(intersectResult.data, meshA.matrix, meshA.material);
    } catch (err) {
      const errorMessage = `Static intersect failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Clone this CSG
   */
  clone(): Result<CSGCoreService, string> {
    console.log('[DEBUG][CSGCoreService] Cloning CSG');

    try {
      const csg = new CSGCoreService();
      csg.polygons = this.polygons
        .map(clonePolygon)
        .filter(p => Number.isFinite(p.plane.w));
      return success(csg);
    } catch (err) {
      const errorMessage = `Failed to clone CSG: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Get all polygons
   */
  toPolygons(): PolygonData[] {
    return [...this.polygons];
  }

  /**
   * Convert this CSG to a Three.js mesh using enhanced matrix operations
   */
  async toMesh(toMatrix?: Matrix4, toMaterial?: Material | Material[]): Promise<Result<Mesh, string>> {
    const matrix = toMatrix || new Matrix4().identity();
    return await CSGCoreService.toMesh(this, matrix, toMaterial);
  }

  /**
   * Convert this CSG to a Three.js geometry using enhanced matrix operations
   */
  async toGeometry(toMatrix?: Matrix4): Promise<Result<BufferGeometry, string>> {
    const matrix = toMatrix || new Matrix4().identity();
    return await CSGCoreService.toGeometry(this, matrix);
  }

  /**
   * Union operation with another CSG
   */
  union(csg: CSGCoreService): Result<CSGCoreService, string> {
    console.log('[DEBUG][CSGCoreService] Performing union operation');

    try {
      const cloneResult = this.clone();
      if (!cloneResult.success) return cloneResult;

      const otherCloneResult = csg.clone();
      if (!otherCloneResult.success) return otherCloneResult;

      const thisTree = new BSPTreeNode(cloneResult.data.polygons);
      const otherTree = new BSPTreeNode(otherCloneResult.data.polygons);

      const unionResult = this.bspService.union(thisTree, otherTree);
      if (!unionResult.success) return unionResult;

      return CSGCoreService.fromPolygons(unionResult.data.allPolygons());
    } catch (err) {
      const errorMessage = `Union operation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Subtract operation with another CSG
   */
  subtract(csg: CSGCoreService): Result<CSGCoreService, string> {
    console.log('[DEBUG][CSGCoreService] Performing subtract operation');

    try {
      const cloneResult = this.clone();
      if (!cloneResult.success) return error(`Failed to clone this CSG: ${cloneResult.error}`);

      const otherCloneResult = csg.clone();
      if (!otherCloneResult.success) return error(`Failed to clone other CSG: ${otherCloneResult.error}`);

      const thisTree = new BSPTreeNode(cloneResult.data.polygons);
      const otherTree = new BSPTreeNode(otherCloneResult.data.polygons);

      const subtractResult = this.bspService.subtract(thisTree, otherTree);
      if (!subtractResult.success) return error(`BSP subtract failed: ${subtractResult.error}`);

      return CSGCoreService.fromPolygons(subtractResult.data.allPolygons());
    } catch (err) {
      const errorMessage = `Subtract operation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Intersect operation with another CSG
   */
  intersect(csg: CSGCoreService): Result<CSGCoreService, string> {
    console.log('[DEBUG][CSGCoreService] Performing intersect operation');

    try {
      const cloneResult = this.clone();
      if (!cloneResult.success) return error(`Failed to clone this CSG: ${cloneResult.error}`);

      const otherCloneResult = csg.clone();
      if (!otherCloneResult.success) return error(`Failed to clone other CSG: ${otherCloneResult.error}`);

      const thisTree = new BSPTreeNode(cloneResult.data.polygons);
      const otherTree = new BSPTreeNode(otherCloneResult.data.polygons);

      const intersectResult = this.bspService.intersect(thisTree, otherTree);
      if (!intersectResult.success) return error(`BSP intersect failed: ${intersectResult.error}`);

      return CSGCoreService.fromPolygons(intersectResult.data.allPolygons());
    } catch (err) {
      const errorMessage = `Intersect operation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Inverse operation (convert solid space to empty space and vice versa)
   */
  inverse(): Result<CSGCoreService, string> {
    console.log('[DEBUG][CSGCoreService] Performing inverse operation');

    try {
      const cloneResult = this.clone();
      if (!cloneResult.success) return error(`Failed to clone CSG: ${cloneResult.error}`);

      const csg = cloneResult.data;

      // Flip all polygons
      for (let i = 0; i < csg.polygons.length; i++) {
        csg.polygons[i] = {
          ...csg.polygons[i],
          vertices: csg.polygons[i].vertices.slice().reverse().map(v => ({
            ...v,
            normal: v.normal.clone().negate()
          })),
          plane: {
            ...csg.polygons[i].plane,
            normal: csg.polygons[i].plane.normal.clone().negate(),
            w: -csg.polygons[i].plane.w
          }
        };
      }

      return success(csg);
    } catch (err) {
      const errorMessage = `Inverse operation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][CSGCoreService]', errorMessage);
      return error(errorMessage);
    }
  }
}

/**
 * Backward compatibility alias
 * @deprecated Use CSGCoreService instead
 */
export const CSG = CSGCoreService;

/**
 * Legacy Vertex class for backward compatibility
 * @deprecated Use VertexData interface and geometry-utils functions instead
 */
export class Vertex {
  public pos: Vector;
  public normal: Vector;
  public uv: Vector;
  public color?: Vector;

  constructor(pos: Vector, normal: Vector, uv: Vector, color?: Vector) {
    this.pos = new Vector().copy(pos);
    this.normal = new Vector().copy(normal);
    this.uv = new Vector().copy(uv);
    this.uv.z = 0;
    this.color = color ? new Vector().copy(color) : undefined;
  }

  clone(): Vertex {
    return new Vertex(this.pos, this.normal, this.uv, this.color);
  }

  flip(): void {
    this.normal.negate();
  }

  interpolate(other: Vertex, t: number): Vertex {
    return new Vertex(
      this.pos.clone().lerp(other.pos, t),
      this.normal.clone().lerp(other.normal, t),
      this.uv.clone().lerp(other.uv, t),
      this.color && other.color ? this.color.clone().lerp(other.color, t) : undefined
    );
  }
}

/**
 * Legacy Plane class for backward compatibility
 * @deprecated Use PlaneData interface and geometry-utils functions instead
 */
export class Plane {
  public static EPSILON = GEOMETRY_CONFIG.precision.epsilon;

  public normal: Vector;
  public w: number;

  constructor(normal: Vector, w: number) {
    this.normal = normal.clone();
    this.w = w;
  }

  clone(): Plane {
    return new Plane(this.normal, this.w);
  }

  flip(): void {
    this.normal.negate();
    this.w = -this.w;
  }

  splitPolygon(
    polygon: Polygon,
    coplanarFront: Polygon[],
    coplanarBack: Polygon[],
    front: Polygon[],
    back: Polygon[]
  ): void {
    const result = splitPolygonByPlane(polygon, this);

    coplanarFront.push(...result.coplanarFront.map(p => new Polygon(
      p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
      p.shared
    )));

    coplanarBack.push(...result.coplanarBack.map(p => new Polygon(
      p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
      p.shared
    )));

    front.push(...result.front.map(p => new Polygon(
      p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
      p.shared
    )));

    back.push(...result.back.map(p => new Polygon(
      p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
      p.shared
    )));
  }

  static fromPoints(a: Vector, b: Vector, c: Vector): Plane {
    const planeData = createPlaneFromPoints(a, b, c);
    return new Plane(planeData.normal, planeData.w);
  }
}

/**
 * Legacy Polygon class for backward compatibility
 * @deprecated Use PolygonData interface and geometry-utils functions instead
 */
export class Polygon {
  public vertices: Vertex[];
  public shared: any;
  public plane: Plane;

  constructor(vertices: Vertex[], shared: any) {
    if (vertices.length < 3) {
      throw new Error('Polygon must have at least 3 vertices');
    }

    this.vertices = vertices.map(v => v.clone());
    this.shared = shared;
    this.plane = Plane.fromPoints(
      vertices[0].pos,
      vertices[1].pos,
      vertices[2].pos
    );
  }

  clone(): Polygon {
    return new Polygon(this.vertices.map(v => v.clone()), this.shared);
  }

  flip(): void {
    this.vertices.reverse().forEach(v => v.flip());
    this.plane.flip();
  }
}

/**
 * Legacy Node class for backward compatibility
 * @deprecated Use BSPTreeNode service instead
 */
export class Node {
  public polygons: Polygon[] = [];
  public plane?: Plane;
  public front?: Node;
  public back?: Node;

  private bspNode: BSPTreeNode;

  constructor(polygons?: Polygon[]) {
    if (polygons) {
      const polygonData = polygons.map(p => ({
        vertices: p.vertices.map(v => ({ pos: v.pos, normal: v.normal, uv: v.uv, color: v.color })),
        shared: p.shared,
        plane: { normal: p.plane.normal, w: p.plane.w }
      }));

      this.bspNode = new BSPTreeNode(polygonData);
      this.syncFromBSPNode();
    } else {
      this.bspNode = new BSPTreeNode();
    }
  }

  private syncFromBSPNode(): void {
    this.polygons = this.bspNode.polygons.map(p => new Polygon(
      p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
      p.shared
    ));

    if (this.bspNode.plane) {
      this.plane = new Plane(this.bspNode.plane.normal, this.bspNode.plane.w);
    }

    if (this.bspNode.front) {
      this.front = new Node();
      this.front.bspNode = this.bspNode.front;
      this.front.syncFromBSPNode();
    }

    if (this.bspNode.back) {
      this.back = new Node();
      this.back.bspNode = this.bspNode.back;
      this.back.syncFromBSPNode();
    }
  }

  clone(): Node {
    const cloned = this.bspNode.clone();
    const node = new Node();
    node.bspNode = cloned;
    node.syncFromBSPNode();
    return node;
  }

  invert(): void {
    const result = this.bspNode.invert();
    if (result.success) {
      this.syncFromBSPNode();
    } else {
      console.error('[ERROR][Node] Invert operation failed:', result.error);
    }
  }

  clipPolygons(polygons: Polygon[]): Polygon[] {
    const polygonData = polygons.map(p => ({
      vertices: p.vertices.map(v => ({ pos: v.pos, normal: v.normal, uv: v.uv, color: v.color })),
      shared: p.shared,
      plane: { normal: p.plane.normal, w: p.plane.w }
    }));

    const result = this.bspNode.clipPolygons(polygonData);
    if (result.success) {
      return result.data.map(p => new Polygon(
        p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
        p.shared
      ));
    } else {
      console.error('[ERROR][Node] ClipPolygons operation failed:', result.error);
      return [];
    }
  }

  clipTo(bsp: Node): void {
    const result = this.bspNode.clipTo(bsp.bspNode);
    if (result.success) {
      this.syncFromBSPNode();
    } else {
      console.error('[ERROR][Node] ClipTo operation failed:', result.error);
    }
  }

  allPolygons(): Polygon[] {
    const polygonData = this.bspNode.allPolygons();
    return polygonData.map(p => new Polygon(
      p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv, v.color)),
      p.shared
    ));
  }

  build(polygons: Polygon[]): void {
    const polygonData = polygons.map(p => ({
      vertices: p.vertices.map(v => ({ pos: v.pos, normal: v.normal, uv: v.uv, color: v.color })),
      shared: p.shared,
      plane: { normal: p.plane.normal, w: p.plane.w }
    }));

    const result = this.bspNode.build(polygonData);
    if (result.success) {
      this.syncFromBSPNode();
    } else {
      console.error('[ERROR][Node] Build operation failed:', result.error);
    }
  }
}
