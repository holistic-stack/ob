/**
 * BSP Tree Service
 *
 * Service for Binary Space Partitioning tree operations
 * extracted from Node.ts utility class following bulletproof-react service patterns.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import type { BSPNodeData, PlaneData, PolygonData } from '../types/geometry.types.js';
import { clonePolygon, isValidPolygon, splitPolygonByPlane } from '../utils/geometry-utils.js';

/**
 * Configuration for BSP tree operations to prevent stack overflow
 */
const BSP_CONFIG = {
  MAX_RECURSION_DEPTH: 50,
  MAX_POLYGONS_PER_NODE: 1000,
  MAX_CLIP_ITERATIONS: 100,
} as const;

const bspNodeLogger = createLogger('BSPTreeNode');
const bspServiceLogger = createLogger('BSPTreeService');

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
    bspNodeLogger.init('Creating BSP tree node');

    if (polygons) {
      const buildResult = this.build(polygons);
      if (!buildResult.success) {
        bspNodeLogger.error('Failed to build BSP tree:', buildResult.error);
      }
    }
  }

  /**
   * Clone this BSP tree node
   */
  clone(): BSPTreeNode {
    bspNodeLogger.debug('Cloning BSP tree node');

    const node = new BSPTreeNode();
    if (this.plane) {
      node.plane = {
        normal: this.plane.normal.clone(),
        w: this.plane.w,
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
    bspNodeLogger.debug('Inverting BSP tree');

    try {
      // Flip all polygons
      for (let i = 0; i < this.polygons.length; i++) {
        const polygon = this.polygons[i];
        if (!polygon?.vertices || !polygon?.plane) {
          continue;
        }

        this.polygons[i] = {
          ...polygon,
          vertices: polygon.vertices
            .slice()
            .reverse()
            .map((v) => ({
              ...v,
              normal: v.normal.clone().negate(),
            })),
          plane: {
            ...polygon.plane,
            normal: polygon.plane.normal.clone().negate(),
            w: -polygon.plane.w,
          },
          shared: polygon.shared ?? null,
        };
      }

      // Flip plane
      if (this.plane) {
        this.plane = {
          normal: this.plane.normal.clone().negate(),
          w: -this.plane.w,
        };
      }

      // Use iterative approach for children to prevent stack overflow
      const stack: BSPTreeNode[] = [];
      if (this.front) stack.push(this.front);
      if (this.back) stack.push(this.back);

      while (stack.length > 0) {
        const node = stack.pop();
        if (!node) continue;

        // Process this node's polygons
        for (let i = 0; i < node.polygons.length; i++) {
          const polygon = node.polygons[i];
          if (!polygon?.vertices || !polygon?.plane) {
            continue;
          }

          node.polygons[i] = {
            ...polygon,
            vertices: polygon.vertices
              .slice()
              .reverse()
              .map((v) => ({
                ...v,
                normal: v.normal.clone().negate(),
              })),
            plane: {
              ...polygon.plane,
              normal: polygon.plane.normal.clone().negate(),
              w: -polygon.plane.w,
            },
            shared: polygon.shared ?? null,
          };
        }

        // Flip plane
        if (node.plane) {
          node.plane = {
            normal: node.plane.normal.clone().negate(),
            w: -node.plane.w,
          };
        }

        // Add children to stack
        if (node.front) stack.push(node.front);
        if (node.back) stack.push(node.back);

        // Swap front and back for this node (using type assertion for readonly properties)
        const temp = node.front;
        (node as unknown as { front?: BSPTreeNode | undefined; back?: BSPTreeNode | undefined }).front = node.back;
        (node as unknown as { front?: BSPTreeNode | undefined; back?: BSPTreeNode | undefined }).back = temp;
      }

      // Swap front and back (using type assertion for readonly properties)
      const temp = this.front;
      (this as unknown as { front?: BSPTreeNode | undefined; back?: BSPTreeNode | undefined }).front = this.back;
      (this as unknown as { front?: BSPTreeNode | undefined; back?: BSPTreeNode | undefined }).back = temp;

      return success(undefined);
    } catch (err) {
      const errorMessage = `BSP tree inversion failed: ${err instanceof Error ? err.message : String(err)}`;
      bspNodeLogger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Remove all polygons that are inside this BSP tree
   */
  clipPolygons(polygons: PolygonData[], depth: number = 0): Result<PolygonData[], string> {
    bspNodeLogger.debug(`Clipping ${polygons.length} polygons at depth ${depth}`);

    try {
      // Prevent stack overflow with recursion depth limit
      if (depth > BSP_CONFIG.MAX_RECURSION_DEPTH) {
        bspNodeLogger.warn(
          `Recursion depth limit reached (${BSP_CONFIG.MAX_RECURSION_DEPTH}), returning original polygons`
        );
        return success([...polygons]);
      }

      // Handle large polygon sets iteratively to prevent memory issues
      if (polygons.length > BSP_CONFIG.MAX_POLYGONS_PER_NODE) {
        bspNodeLogger.warn(`Large polygon set (${polygons.length}), processing in chunks`);
        return this.clipPolygonsIteratively(polygons, depth);
      }

      if (!this.plane) {
        return success([...polygons]);
      }

      let front: PolygonData[] = [];
      let back: PolygonData[] = [];

      for (const polygon of polygons) {
        if (!isValidPolygon(polygon)) {
          bspNodeLogger.warn('Skipping invalid polygon during clipping');
          continue;
        }

        const splitResult = splitPolygonByPlane(polygon, this.plane);
        front = front.concat(splitResult.coplanarFront, splitResult.front);
        back = back.concat(splitResult.coplanarBack, splitResult.back);
      }

      if (this.front) {
        const frontClipResult = this.front.clipPolygons(front, depth + 1);
        if (!frontClipResult.success) return frontClipResult;
        front = frontClipResult.data;
      }

      if (this.back) {
        const backClipResult = this.back.clipPolygons(back, depth + 1);
        if (!backClipResult.success) return backClipResult;
        back = backClipResult.data;
      } else {
        back = [];
      }

      return success(front.concat(back));
    } catch (err) {
      const errorMessage = `Polygon clipping failed at depth ${depth}: ${err instanceof Error ? err.message : String(err)}`;
      bspNodeLogger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Process large polygon sets iteratively to prevent stack overflow
   */
  private clipPolygonsIteratively(
    polygons: PolygonData[],
    depth: number
  ): Result<PolygonData[], string> {
    const chunkSize = Math.floor(BSP_CONFIG.MAX_POLYGONS_PER_NODE / 2);
    const results: PolygonData[] = [];

    for (let i = 0; i < polygons.length; i += chunkSize) {
      const chunk = polygons.slice(i, i + chunkSize);
      const chunkResult = this.clipPolygons(chunk, depth);

      if (!chunkResult.success) {
        return chunkResult;
      }

      results.push(...chunkResult.data);
    }

    return success(results);
  }

  /**
   * Remove all polygons in this BSP tree that are inside the other BSP tree
   */
  clipTo(bsp: BSPTreeNode, depth: number = 0): Result<void, string> {
    bspNodeLogger.debug(`Clipping to another BSP tree at depth ${depth}`);

    try {
      // Prevent stack overflow with recursion depth limit
      if (depth > BSP_CONFIG.MAX_RECURSION_DEPTH) {
        bspNodeLogger.warn(
          `ClipTo recursion depth limit reached (${BSP_CONFIG.MAX_RECURSION_DEPTH}), stopping recursion`
        );
        return success(undefined);
      }

      const clipResult = bsp.clipPolygons(this.polygons);
      if (!clipResult.success) return error(`ClipPolygons failed: ${clipResult.error}`);

      this.polygons = clipResult.data;

      // Use iterative approach for deep trees
      if (depth > BSP_CONFIG.MAX_RECURSION_DEPTH / 2) {
        return this.clipToIteratively(bsp, depth);
      }

      if (this.front) {
        const frontResult = this.front.clipTo(bsp, depth + 1);
        if (!frontResult.success)
          return error(`Front clipTo failed at depth ${depth}: ${frontResult.error}`);
      }

      if (this.back) {
        const backResult = this.back.clipTo(bsp, depth + 1);
        if (!backResult.success)
          return error(`Back clipTo failed at depth ${depth}: ${backResult.error}`);
      }

      return success(undefined);
    } catch (err) {
      const errorMessage = `BSP tree clipping failed at depth ${depth}: ${err instanceof Error ? err.message : String(err)}`;
      bspNodeLogger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Iterative clipTo implementation to prevent stack overflow
   */
  private clipToIteratively(bsp: BSPTreeNode, startDepth: number): Result<void, string> {
    const stack: Array<{ node: BSPTreeNode; depth: number }> = [];

    if (this.front) stack.push({ node: this.front, depth: startDepth + 1 });
    if (this.back) stack.push({ node: this.back, depth: startDepth + 1 });

    let iterations = 0;
    while (stack.length > 0 && iterations < BSP_CONFIG.MAX_CLIP_ITERATIONS) {
      const { node, depth } = stack.pop()!;
      iterations++;

      const clipResult = bsp.clipPolygons(node.polygons);
      if (!clipResult.success) {
        return error(`Iterative clipTo failed at iteration ${iterations}: ${clipResult.error}`);
      }

      node.polygons = clipResult.data;

      // Add children to stack if within depth limits
      if (depth < BSP_CONFIG.MAX_RECURSION_DEPTH) {
        if (node.front) stack.push({ node: node.front, depth: depth + 1 });
        if (node.back) stack.push({ node: node.back, depth: depth + 1 });
      }
    }

    if (iterations >= BSP_CONFIG.MAX_CLIP_ITERATIONS) {
      bspNodeLogger.warn(`ClipTo iteration limit reached (${BSP_CONFIG.MAX_CLIP_ITERATIONS})`);
    }

    return success(undefined);
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
    bspNodeLogger.debug(`Building BSP tree from ${polygons.length} polygons`);

    try {
      if (polygons.length === 0) {
        return success(undefined);
      }

      // Validate polygons
      const validPolygons = polygons.filter(isValidPolygon);
      if (validPolygons.length !== polygons.length) {
        bspNodeLogger.warn(
          `Filtered out ${polygons.length - validPolygons.length} invalid polygons`
        );
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
          bspNodeLogger.warn('No plane defined for split operation');
          continue;
        }

        const splitResult = splitPolygonByPlane(polygon, this.plane);

        this.polygons = this.polygons.concat(splitResult.coplanarFront, splitResult.coplanarBack);
        front.push(...splitResult.front);
        back.push(...splitResult.back);
      }

      if (front.length > 0) {
        this.front ??= new BSPTreeNode();
        const frontBuildResult = this.front.build(front);
        if (!frontBuildResult.success) return frontBuildResult;
      }

      if (back.length > 0) {
        this.back ??= new BSPTreeNode();
        if (this.back) {
          this.back ??= new BSPTreeNode();
          const backBuildResult = this.back.build(back);
          if (!backBuildResult.success) return backBuildResult;
        }
      }

      bspNodeLogger.debug('BSP tree build completed successfully');
      return success(undefined);
    } catch (err) {
      const errorMessage = `BSP tree build failed: ${err instanceof Error ? err.message : String(err)}`;
      bspNodeLogger.error(errorMessage);
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
    bspServiceLogger.init('Initializing BSP tree service');
  }

  /**
   * Create a new BSP tree from polygons
   */
  createBSPTree(polygons: PolygonData[]): Result<BSPTreeNode, string> {
    bspServiceLogger.debug(`Creating BSP tree from ${polygons.length} polygons`);

    try {
      const node = new BSPTreeNode(polygons);
      return success(node);
    } catch (err) {
      const errorMessage = `BSP tree creation failed: ${err instanceof Error ? err.message : String(err)}`;
      bspServiceLogger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform union operation on two BSP trees
   */
  union(treeA: BSPTreeNode, treeB: BSPTreeNode): Result<BSPTreeNode, string> {
    bspServiceLogger.debug('Performing BSP tree union');

    try {
      const a = treeA.clone();
      const b = treeB.clone();

      const aClipResult = a.clipTo(b);
      if (!aClipResult.success)
        return error(`Union failed during A.clipTo(B): ${aClipResult.error}`);

      const bClipResult = b.clipTo(a);
      if (!bClipResult.success)
        return error(`Union failed during B.clipTo(A): ${bClipResult.error}`);

      const bInvertResult = b.invert();
      if (!bInvertResult.success)
        return error(`Union failed during B.invert(): ${bInvertResult.error}`);

      const bClipResult2 = b.clipTo(a);
      if (!bClipResult2.success)
        return error(`Union failed during B.clipTo(A) after invert: ${bClipResult2.error}`);

      const bInvertResult2 = b.invert();
      if (!bInvertResult2.success)
        return error(`Union failed during final B.invert(): ${bInvertResult2.error}`);

      const buildResult = a.build(b.allPolygons());
      if (!buildResult.success)
        return error(`Union failed during A.build(B.allPolygons()): ${buildResult.error}`);

      return success(a);
    } catch (err) {
      const errorMessage = `BSP tree union failed: ${err instanceof Error ? err.message : String(err)}`;
      bspServiceLogger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform subtraction operation on two BSP trees
   */
  subtract(treeA: BSPTreeNode, treeB: BSPTreeNode): Result<BSPTreeNode, string> {
    bspServiceLogger.debug('Performing BSP tree subtraction');

    try {
      const a = treeA.clone();
      const b = treeB.clone();

      const aInvertResult = a.invert();
      if (!aInvertResult.success)
        return error(`Subtract failed during A.invert(): ${aInvertResult.error}`);

      const aClipResult = a.clipTo(b);
      if (!aClipResult.success)
        return error(`Subtract failed during A.clipTo(B): ${aClipResult.error}`);

      const bClipResult = b.clipTo(a);
      if (!bClipResult.success)
        return error(`Subtract failed during B.clipTo(A): ${bClipResult.error}`);

      const bInvertResult = b.invert();
      if (!bInvertResult.success)
        return error(`Subtract failed during B.invert(): ${bInvertResult.error}`);

      const bClipResult2 = b.clipTo(a);
      if (!bClipResult2.success)
        return error(`Subtract failed during B.clipTo(A) after invert: ${bClipResult2.error}`);

      const bInvertResult2 = b.invert();
      if (!bInvertResult2.success)
        return error(`Subtract failed during final B.invert(): ${bInvertResult2.error}`);

      const buildResult = a.build(b.allPolygons());
      if (!buildResult.success)
        return error(`Subtract failed during A.build(B.allPolygons()): ${buildResult.error}`);

      const aInvertResult2 = a.invert();
      if (!aInvertResult2.success)
        return error(`Subtract failed during final A.invert(): ${aInvertResult2.error}`);

      return success(a);
    } catch (err) {
      const errorMessage = `BSP tree subtraction failed: ${err instanceof Error ? err.message : String(err)}`;
      bspServiceLogger.error(errorMessage);
      return error(errorMessage);
    }
  }

  /**
   * Perform intersection operation on two BSP trees
   */
  intersect(treeA: BSPTreeNode, treeB: BSPTreeNode): Result<BSPTreeNode, string> {
    bspServiceLogger.debug('Performing BSP tree intersection');

    try {
      const a = treeA.clone();
      const b = treeB.clone();

      const aInvertResult = a.invert();
      if (!aInvertResult.success)
        return error(`Intersect failed during A.invert(): ${aInvertResult.error}`);

      const bClipResult = b.clipTo(a);
      if (!bClipResult.success)
        return error(`Intersect failed during B.clipTo(A): ${bClipResult.error}`);

      const bInvertResult = b.invert();
      if (!bInvertResult.success)
        return error(`Intersect failed during B.invert(): ${bInvertResult.error}`);

      const aClipResult = a.clipTo(b);
      if (!aClipResult.success)
        return error(`Intersect failed during A.clipTo(B): ${aClipResult.error}`);

      const bClipResult2 = b.clipTo(a);
      if (!bClipResult2.success)
        return error(`Intersect failed during B.clipTo(A) after invert: ${bClipResult2.error}`);

      const buildResult = a.build(b.allPolygons());
      if (!buildResult.success)
        return error(`Intersect failed during A.build(B.allPolygons()): ${buildResult.error}`);

      const aInvertResult2 = a.invert();
      if (!aInvertResult2.success)
        return error(`Intersect failed during final A.invert(): ${aInvertResult2.error}`);

      return success(a);
    } catch (err) {
      const errorMessage = `BSP tree intersection failed: ${err instanceof Error ? err.message : String(err)}`;
      bspServiceLogger.error(errorMessage);
      return error(errorMessage);
    }
  }
}
