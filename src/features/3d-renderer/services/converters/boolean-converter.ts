import type {
  ASTNode,
  DifferenceNode,
  IntersectionNode,
  UnionNode,
} from '@holistic-stack/openscad-parser';
import * as THREE from 'three';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import { CSGCoreService } from '../csg-core.service';

/**
 * Convert union node to mesh by processing children and performing CSG union
 */
export const convertUnionNode = async (
  node: UnionNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][BooleanConverter] Converting union node:`, node);
    console.log(`[DEBUG][BooleanConverter] Union node children count:`, node.children?.length || 0);

    if (node.children && node.children.length > 0) {
      console.log(
        `[DEBUG][BooleanConverter] Union node children types:`,
        node.children.map((child) => child.type)
      );
    }

    if (!node.children || node.children.length === 0) {
      console.warn(
        `[WARN][BooleanConverter] Union node has no children, creating placeholder mesh`
      );
      console.log(
        `[DEBUG][BooleanConverter] This indicates AST restructuring may not be working correctly`
      );
      // Create a simple cube as placeholder when no children
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0); // Ensure placeholder is at origin
      return mesh;
    }

    // Convert all children to meshes
    const childMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) {
        throw new Error(`Union child ${i} is undefined`);
      }
      console.log(
        `[DEBUG][BooleanConverter] Converting union child ${i + 1}/${node.children.length}: ${child.type}`
      );

      const childResult = await convertASTNodeToMesh(child, material);
      if (!childResult.success) {
        throw new Error(`Failed to convert union child ${i}: ${childResult.error}`);
      }
      childMeshes.push(childResult.data);
    }

    // Perform CSG union operation
    if (childMeshes.length === 1) {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First child mesh is undefined');
      }
      console.log(`[DEBUG][BooleanConverter] Union has single child, returning as-is`);
      return firstMesh;
    }

    console.log(`[DEBUG][BooleanConverter] Performing CSG union on ${childMeshes.length} meshes`);

    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First mesh for CSG union is undefined');
      }

      // Ensure matrices are updated
      firstMesh.updateMatrix();

      let resultMesh = firstMesh;
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          throw new Error(`Mesh ${i} for CSG union is undefined`);
        }
        nextMesh.updateMatrix();

        console.log(
          `[DEBUG][BooleanConverter] Performing union operation ${i}/${childMeshes.length - 1}`
        );
        // Use the correct three-csg-ts API
        const unionResult = await CSGCoreService.union(resultMesh, nextMesh);
        if (!unionResult.success) {
          throw new Error(`Union operation failed: ${unionResult.error}`);
        }
        resultMesh = unionResult.data;
      }

      resultMesh.material = material;

      console.log(
        `[DEBUG][BooleanConverter] CSG union completed successfully with actual combined geometry`
      );
      return resultMesh;
    } catch (csgError) {
      console.error(`[ERROR][BooleanConverter] CSG union failed:`, csgError);
      throw new Error(
        `CSG union operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`
      );
    }
  });
};

/**
 * Convert intersection node to mesh by processing children and performing CSG intersection
 */
export const convertIntersectionNode = async (
  node: IntersectionNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][BooleanConverter] Converting intersection node:`, node);
    console.log(
      `[DEBUG][BooleanConverter] Intersection node children count:`,
      node.children?.length || 0
    );

    if (node.children && node.children.length > 0) {
      console.log(
        `[DEBUG][BooleanConverter] Intersection node children types:`,
        node.children.map((child) => child.type)
      );
    }

    if (!node.children || node.children.length === 0) {
      console.warn(
        `[WARN][BooleanConverter] Intersection node has no children, creating placeholder mesh`
      );
      console.log(
        `[DEBUG][BooleanConverter] This indicates AST restructuring may not be working correctly`
      );
      // Create a simple sphere as placeholder when no children
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0); // Ensure placeholder is at origin
      return mesh;
    }

    // Convert all children to meshes
    const childMeshes: THREE.Mesh[] = [];
    for (const child of node.children) {
      const childResult = await convertASTNodeToMesh(child, material);
      if (!childResult.success) {
        throw new Error(`Failed to convert intersection child: ${childResult.error}`);
      }
      childMeshes.push(childResult.data);
    }

    // Perform CSG intersection operation
    if (childMeshes.length === 1) {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First child mesh is undefined');
      }
      return firstMesh;
    }

    console.log(
      `[DEBUG][BooleanConverter] Performing CSG intersection on ${childMeshes.length} meshes`
    );

    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First mesh for CSG intersection is undefined');
      }

      // Ensure matrices are updated
      firstMesh.updateMatrix();

      let resultMesh = firstMesh;
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          throw new Error(`Mesh ${i} for CSG intersection is undefined`);
        }
        nextMesh.updateMatrix();

        // Use the correct three-csg-ts API
        const intersectResult = await CSGCoreService.intersect(resultMesh, nextMesh);
        if (!intersectResult.success) {
          throw new Error(`Intersect operation failed: ${intersectResult.error}`);
        }
        resultMesh = intersectResult.data;
      }

      resultMesh.material = material;

      console.log(`[DEBUG][BooleanConverter] CSG intersection completed successfully`);
      return resultMesh;
    } catch (csgError) {
      console.error(`[ERROR][BooleanConverter] CSG intersection failed:`, csgError);
      throw new Error(
        `CSG intersection operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`
      );
    }
  });
};

/**
 * Convert difference node to mesh by processing children and performing CSG difference
 */
export const convertDifferenceNode = async (
  node: DifferenceNode,
  material: THREE.Material,
  convertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>
): Promise<Result<THREE.Mesh, string>> => {
  return tryCatchAsync(async () => {
    console.log(`[DEBUG][BooleanConverter] Converting difference node:`, node);

    if (!node.children || node.children.length === 0) {
      console.log(`[DEBUG][BooleanConverter] Difference node has no children, creating empty mesh`);
      // For now, create a simple cylinder as placeholder when no children
      const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    }

    // Convert all children to meshes
    const childMeshes: THREE.Mesh[] = [];
    for (const child of node.children) {
      const childResult = await convertASTNodeToMesh(child, material);
      if (!childResult.success) {
        throw new Error(`Failed to convert difference child: ${childResult.error}`);
      }
      childMeshes.push(childResult.data);
    }

    // Perform CSG difference operation (first mesh minus all others)
    if (childMeshes.length === 1) {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First child mesh is undefined');
      }
      return firstMesh;
    }

    console.log(
      `[DEBUG][BooleanConverter] Performing CSG difference on ${childMeshes.length} meshes`
    );

    try {
      const firstMesh = childMeshes[0];
      if (!firstMesh) {
        throw new Error('First mesh for CSG difference is undefined');
      }

      // Ensure matrices are updated
      firstMesh.updateMatrix();

      let resultMesh = firstMesh;
      for (let i = 1; i < childMeshes.length; i++) {
        const nextMesh = childMeshes[i];
        if (!nextMesh) {
          throw new Error(`Mesh ${i} for CSG difference is undefined`);
        }
        nextMesh.updateMatrix();

        // Use the correct three-csg-ts API
        const subtractResult = await CSGCoreService.subtract(resultMesh, nextMesh);
        if (!subtractResult.success) {
          throw new Error(`Subtract operation failed: ${subtractResult.error}`);
        }
        resultMesh = subtractResult.data;
      }

      resultMesh.material = material;

      console.log(`[DEBUG][BooleanConverter] CSG difference completed successfully`);
      return resultMesh;
    } catch (csgError) {
      console.error(`[ERROR][BooleanConverter] CSG difference failed:`, csgError);
      throw new Error(
        `CSG difference operation failed: ${csgError instanceof Error ? csgError.message : String(csgError)}`
      );
    }
  });
};
