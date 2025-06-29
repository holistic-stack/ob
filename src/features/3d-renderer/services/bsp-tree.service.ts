/**
 * BSP Tree Service
 * 
 * Service for Binary Space Partitioning tree operations
 * extracted from Node.ts utility class following bulletproof-react service patterns.
 */

import type { 
  BSPNodeData, 
  PolygonData, 
  PlaneData 
} from '../types/geometry.types';
import { 
  clonePolygon, 
  splitPolygonByPlane,
  isValidPolygon 
} from '../utils/geometry-utils';
import { success, error } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

/**
 * BSP Tree Node implementation
 * Extracted from Node.ts utility class
 */
export class BSPTreeNode implements BSPNodeData {
  public polygons: PolygonData[] = [];
  public plane?: PlaneData;
  public front?: BSPTreeNode;
  public back?: BSPTreeNode;

  constructor(polygons?: PolygonData[]) {
    console.log('[INIT][BSPTreeNode] Creating BSP tree node');
    
    if (polygons) {
      const buildResult = this.build(polygons);
      if (!buildResult.success) {
        console.error('[ERROR][BSPTreeNode] Failed to build BSP tree:', buildResult.error);
      }
    }
  }

  /**
   * Clone this BSP tree node
   */
  clone(): BSPTreeNode {
    console.log('[DEBUG][BSPTreeNode] Cloning BSP tree node');

    const node = new BSPTreeNode();
    if (this.plane) {
      node.plane = {
        normal: this.plane.normal.clone(),
        w: this.plane.w
      };
    }
    if (this.front) {
      node.front = this.front.clone();
    }
    if (this.back) {
      node.back = this.back.clone();
    }
    node.polygons = this.polygons.map(clonePolygon);

    return node;
  }

  /**
   * Invert this BSP tree (convert solid space to empty space and vice versa)
   */
  invert(): Result<void, string> {
    console.log('[DEBUG][BSPTreeNode] Inverting BSP tree');
    
    try {
      // Flip all polygons
      for (let i = 0; i < this.polygons.length; i++) {
        const polygon = this.polygons[i];
        if (!polygon?.vertices || !polygon?.plane) {
          continue;
        }
        
        this.polygons[i] = {
          ...polygon,
          vertices: polygon.vertices.slice().reverse().map(v => ({
            ...v,
            normal: v.normal.clone().negate()
          })),
          plane: {
            ...polygon.plane,
            normal: polygon.plane.normal.clone().negate(),
            w: -polygon.plane.w
          },
          shared: polygon.shared ?? null
        };
      }

      // Flip plane
      if (this.plane) {
        this.plane = {
          normal: this.plane.normal.clone().negate(),
          w: -this.plane.w
        };
      }

      // Recursively invert children
      if (this.front) {
        const frontResult = this.front.invert();
        if (!frontResult.success) return frontResult;
      }
      
      if (this.back) {
        const backResult = this.back.invert();
        if (!backResult.success) return backResult;
      }

      // Swap front and back
      const temp = this.front;
      if (this.back) {
        this.front = this.back;
      } else {
        delete (this as Record<string, unknown>).front;
      }
      if (temp) {
        this.back = temp;
      } else {
        delete (this as Record<string, unknown>).back;
      }

      return success(undefined);
    } catch (err) {
      const errorMessage = `BSP tree inversion failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeNode]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Remove all polygons that are inside this BSP tree
   */
  clipPolygons(polygons: PolygonData[]): Result<PolygonData[], string> {
    console.log(`[DEBUG][BSPTreeNode] Clipping ${polygons.length} polygons`);
    
    try {
      if (!this.plane) {
        return success([...polygons]);
      }

      let front: PolygonData[] = [];
      let back: PolygonData[] = [];

      for (const polygon of polygons) {
        if (!isValidPolygon(polygon)) {
          console.warn('[WARN][BSPTreeNode] Skipping invalid polygon during clipping');
          continue;
        }

        const splitResult = splitPolygonByPlane(polygon, this.plane);
        front = front.concat(splitResult.coplanarFront, splitResult.front);
        back = back.concat(splitResult.coplanarBack, splitResult.back);
      }

      if (this.front) {
        const frontClipResult = this.front.clipPolygons(front);
        if (!frontClipResult.success) return frontClipResult;
        front = frontClipResult.data;
      }

      if (this.back) {
        const backClipResult = this.back.clipPolygons(back);
        if (!backClipResult.success) return backClipResult;
        back = backClipResult.data;
      } else {
        back = [];
      }

      return success(front.concat(back));
    } catch (err) {
      const errorMessage = `Polygon clipping failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeNode]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Remove all polygons in this BSP tree that are inside the other BSP tree
   */
  clipTo(bsp: BSPTreeNode): Result<void, string> {
    console.log('[DEBUG][BSPTreeNode] Clipping to another BSP tree');
    
    try {
      const clipResult = bsp.clipPolygons(this.polygons);
      if (!clipResult.success) return clipResult;
      
      this.polygons = clipResult.data;

      if (this.front) {
        const frontResult = this.front.clipTo(bsp);
        if (!frontResult.success) return error(`Front clipTo failed: ${frontResult.error}`);
      }

      if (this.back) {
        const backResult = this.back.clipTo(bsp);
        if (!backResult.success) return error(`Back clipTo failed: ${backResult.error}`);
      }

      return success(undefined);
    } catch (err) {
      const errorMessage = `BSP tree clipping failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeNode]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Return all polygons in this BSP tree
   */
  allPolygons(): PolygonData[] {
    let polygons = [...this.polygons];
    
    if (this.front) {
      polygons = polygons.concat(this.front.allPolygons());
    }
    
    if (this.back) {
      polygons = polygons.concat(this.back.allPolygons());
    }
    
    return polygons;
  }

  /**
   * Build a BSP tree from a list of polygons
   */
  build(polygons: PolygonData[]): Result<void, string> {
    console.log(`[DEBUG][BSPTreeNode] Building BSP tree from ${polygons.length} polygons`);
    
    try {
      if (polygons.length === 0) {
        return success(undefined);
      }

      // Validate polygons
      const validPolygons = polygons.filter(isValidPolygon);
      if (validPolygons.length !== polygons.length) {
        console.warn(`[WARN][BSPTreeNode] Filtered out ${polygons.length - validPolygons.length} invalid polygons`);
      }

      if (validPolygons.length === 0) {
        return success(undefined);
      }

      // Use first polygon's plane if we don't have one
      if (!this.plane && validPolygons[0]) {
        this.plane = { ...validPolygons[0].plane };
      }

      const front: PolygonData[] = [];
      const back: PolygonData[] = [];

      for (const polygon of validPolygons) {
        if (!this.plane) {
          console.warn('[BSPTreeNode] No plane defined for split operation');
          continue;
        }
        
        const splitResult = splitPolygonByPlane(polygon, this.plane);
        
        this.polygons = this.polygons.concat(
          splitResult.coplanarFront,
          splitResult.coplanarBack
        );
        front.push(...splitResult.front);
        back.push(...splitResult.back);
      }

      if (front.length > 0) {
        if (!this.front) {
          this.front = new BSPTreeNode();
        }
        const frontBuildResult = this.front.build(front);
        if (!frontBuildResult.success) return frontBuildResult;
      }

      if (back.length > 0) {
        if (!this.back) {
          this.back = new BSPTreeNode();
        }
        const backBuildResult = this.back.build(back);
        if (!backBuildResult.success) return backBuildResult;
      }

      console.log('[DEBUG][BSPTreeNode] BSP tree build completed successfully');
      return success(undefined);
    } catch (err) {
      const errorMessage = `BSP tree build failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeNode]', errorMessage);
      return error(errorMessage);
    }
  }
}

/**
 * BSP Tree Service
 * Service wrapper for BSP tree operations
 */
export class BSPTreeService {
  constructor() {
    console.log('[INIT][BSPTreeService] Initializing BSP tree service');
  }

  /**
   * Create a new BSP tree from polygons
   */
  createBSPTree(polygons: PolygonData[]): Result<BSPTreeNode, string> {
    console.log(`[DEBUG][BSPTreeService] Creating BSP tree from ${polygons.length} polygons`);
    
    try {
      const node = new BSPTreeNode(polygons);
      return success(node);
    } catch (err) {
      const errorMessage = `BSP tree creation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform union operation on two BSP trees
   */
  union(treeA: BSPTreeNode, treeB: BSPTreeNode): Result<BSPTreeNode, string> {
    console.log('[DEBUG][BSPTreeService] Performing BSP tree union');
    
    try {
      const a = treeA.clone();
      const b = treeB.clone();
      
      const aClipResult = a.clipTo(b);
      if (!aClipResult.success) return error(`Union failed during A.clipTo(B): ${aClipResult.error}`);
      
      const bClipResult = b.clipTo(a);
      if (!bClipResult.success) return error(`Union failed during B.clipTo(A): ${bClipResult.error}`);
      
      const bInvertResult = b.invert();
      if (!bInvertResult.success) return error(`Union failed during B.invert(): ${bInvertResult.error}`);
      
      const bClipResult2 = b.clipTo(a);
      if (!bClipResult2.success) return error(`Union failed during B.clipTo(A) after invert: ${bClipResult2.error}`);
      
      const bInvertResult2 = b.invert();
      if (!bInvertResult2.success) return error(`Union failed during final B.invert(): ${bInvertResult2.error}`);
      
      const buildResult = a.build(b.allPolygons());
      if (!buildResult.success) return error(`Union failed during A.build(B.allPolygons()): ${buildResult.error}`);
      
      return success(a);
    } catch (err) {
      const errorMessage = `BSP tree union failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform subtraction operation on two BSP trees
   */
  subtract(treeA: BSPTreeNode, treeB: BSPTreeNode): Result<BSPTreeNode, string> {
    console.log('[DEBUG][BSPTreeService] Performing BSP tree subtraction');
    
    try {
      const a = treeA.clone();
      const b = treeB.clone();
      
      const aInvertResult = a.invert();
      if (!aInvertResult.success) return error(`Subtract failed during A.invert(): ${aInvertResult.error}`);
      
      const aClipResult = a.clipTo(b);
      if (!aClipResult.success) return error(`Subtract failed during A.clipTo(B): ${aClipResult.error}`);
      
      const bClipResult = b.clipTo(a);
      if (!bClipResult.success) return error(`Subtract failed during B.clipTo(A): ${bClipResult.error}`);
      
      const bInvertResult = b.invert();
      if (!bInvertResult.success) return error(`Subtract failed during B.invert(): ${bInvertResult.error}`);
      
      const bClipResult2 = b.clipTo(a);
      if (!bClipResult2.success) return error(`Subtract failed during B.clipTo(A) after invert: ${bClipResult2.error}`);
      
      const bInvertResult2 = b.invert();
      if (!bInvertResult2.success) return error(`Subtract failed during final B.invert(): ${bInvertResult2.error}`);
      
      const buildResult = a.build(b.allPolygons());
      if (!buildResult.success) return error(`Subtract failed during A.build(B.allPolygons()): ${buildResult.error}`);
      
      const aInvertResult2 = a.invert();
      if (!aInvertResult2.success) return error(`Subtract failed during final A.invert(): ${aInvertResult2.error}`);
      
      return success(a);
    } catch (err) {
      const errorMessage = `BSP tree subtraction failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeService]', errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform intersection operation on two BSP trees
   */
  intersect(treeA: BSPTreeNode, treeB: BSPTreeNode): Result<BSPTreeNode, string> {
    console.log('[DEBUG][BSPTreeService] Performing BSP tree intersection');
    
    try {
      const a = treeA.clone();
      const b = treeB.clone();
      
      const aInvertResult = a.invert();
      if (!aInvertResult.success) return error(`Intersect failed during A.invert(): ${aInvertResult.error}`);
      
      const bClipResult = b.clipTo(a);
      if (!bClipResult.success) return error(`Intersect failed during B.clipTo(A): ${bClipResult.error}`);
      
      const bInvertResult = b.invert();
      if (!bInvertResult.success) return error(`Intersect failed during B.invert(): ${bInvertResult.error}`);
      
      const aClipResult = a.clipTo(b);
      if (!aClipResult.success) return error(`Intersect failed during A.clipTo(B): ${aClipResult.error}`);
      
      const bClipResult2 = b.clipTo(a);
      if (!bClipResult2.success) return error(`Intersect failed during B.clipTo(A) after invert: ${bClipResult2.error}`);
      
      const buildResult = a.build(b.allPolygons());
      if (!buildResult.success) return error(`Intersect failed during A.build(B.allPolygons()): ${buildResult.error}`);
      
      const aInvertResult2 = a.invert();
      if (!aInvertResult2.success) return error(`Intersect failed during final A.invert(): ${aInvertResult2.error}`);
      
      return success(a);
    } catch (err) {
      const errorMessage = `BSP tree intersection failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[ERROR][BSPTreeService]', errorMessage);
      return error(errorMessage);
    }
  }
}
