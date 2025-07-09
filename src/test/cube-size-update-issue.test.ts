/**
 * @file Test for Cube Size Update Issue in Translated Geometries
 *
 * This test reproduces the issue where changing the cube size in a translate statement
 * like `translate([10,10,0])cube(15, center=true)` doesn't update the rendered cube size.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createLogger } from '../shared/services/logger.service';
import type { ASTNode } from '../features/openscad-parser/core/ast-types';
import { OpenscadParser } from '../features/openscad-parser/openscad-parser';
import {
  convertASTNodeToCSG,
  setSourceCodeForExtraction,
  clearSourceCodeForExtraction,
} from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter';

const logger = createLogger('CubeSizeUpdateIssueTest');

describe('Cube Size Update Issue in Translated Geometries', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up cube size update issue test');
    parserService = new OpenscadParser();
    await parserService.init();
  });

  it('should update cube size when changed in translated geometry', async () => {
    // Test the specific case mentioned by the user
    const initialCode = 'cube(5, center=true);translate([10,10,0])cube(15, center=true);';
    const updatedCode = 'cube(5, center=true);translate([10,10,0])cube(20, center=true);';

    // Parse initial code
    setSourceCodeForExtraction(initialCode);
    const initialAST = parserService.parseAST(initialCode);
    expect(initialAST).toBeDefined();
    expect(initialAST.length).toBe(2);

    const firstNode = initialAST[0] as ASTNode;
    const secondNode = initialAST[1] as ASTNode;

    logger.debug('Initial AST - First node:', {
      type: firstNode.type,
      size: 'size' in firstNode ? firstNode.size : 'N/A'
    });
    logger.debug('Initial AST - Second node:', {
      type: secondNode.type,
      children: 'children' in secondNode ? secondNode.children?.length : 'N/A'
    });

    // Convert initial nodes
    const initialResult1 = await convertASTNodeToCSG(firstNode, 0);
    const initialResult2 = await convertASTNodeToCSG(secondNode, 1);
    clearSourceCodeForExtraction();

    expect(initialResult1.success).toBe(true);
    expect(initialResult2.success).toBe(true);

    if (!initialResult1.success || !initialResult2.success) return;

    const initialMesh1 = initialResult1.data.mesh as THREE.Mesh;
    const initialMesh2 = initialResult2.data.mesh as THREE.Mesh;

    // Verify initial sizes
    expect(initialMesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(initialMesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);

    const initialParams1 = (initialMesh1.geometry as THREE.BoxGeometry).parameters;
    const initialParams2 = (initialMesh2.geometry as THREE.BoxGeometry).parameters;

    logger.debug('Initial mesh sizes:', {
      mesh1: { width: initialParams1.width, height: initialParams1.height, depth: initialParams1.depth },
      mesh2: { width: initialParams2.width, height: initialParams2.height, depth: initialParams2.depth }
    });

    // First cube should be size 5
    expect(initialParams1.width).toBe(5);
    expect(initialParams1.height).toBe(5);
    expect(initialParams1.depth).toBe(5);

    // Second cube should be size 15 (this might fail due to the bug)
    expect(initialParams2.width).toBe(15);
    expect(initialParams2.height).toBe(15);
    expect(initialParams2.depth).toBe(15);

    // Now test with updated code
    setSourceCodeForExtraction(updatedCode);
    const updatedAST = parserService.parseAST(updatedCode);
    expect(updatedAST).toBeDefined();
    expect(updatedAST.length).toBe(2);

    const updatedFirstNode = updatedAST[0] as ASTNode;
    const updatedSecondNode = updatedAST[1] as ASTNode;

    logger.debug('Updated AST - First node:', {
      type: updatedFirstNode.type,
      size: 'size' in updatedFirstNode ? updatedFirstNode.size : 'N/A'
    });
    logger.debug('Updated AST - Second node:', {
      type: updatedSecondNode.type,
      children: 'children' in updatedSecondNode ? updatedSecondNode.children?.length : 'N/A'
    });

    // Convert updated nodes
    const updatedResult1 = await convertASTNodeToCSG(updatedFirstNode, 0);
    const updatedResult2 = await convertASTNodeToCSG(updatedSecondNode, 1);
    clearSourceCodeForExtraction();

    expect(updatedResult1.success).toBe(true);
    expect(updatedResult2.success).toBe(true);

    if (!updatedResult1.success || !updatedResult2.success) return;

    const updatedMesh1 = updatedResult1.data.mesh as THREE.Mesh;
    const updatedMesh2 = updatedResult2.data.mesh as THREE.Mesh;

    // Verify updated sizes
    expect(updatedMesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(updatedMesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);

    const updatedParams1 = (updatedMesh1.geometry as THREE.BoxGeometry).parameters;
    const updatedParams2 = (updatedMesh2.geometry as THREE.BoxGeometry).parameters;

    logger.debug('Updated mesh sizes:', {
      mesh1: { width: updatedParams1.width, height: updatedParams1.height, depth: updatedParams1.depth },
      mesh2: { width: updatedParams2.width, height: updatedParams2.height, depth: updatedParams2.depth }
    });

    // First cube should still be size 5
    expect(updatedParams1.width).toBe(5);
    expect(updatedParams1.height).toBe(5);
    expect(updatedParams1.depth).toBe(5);

    // Second cube should now be size 20 (this is the key test)
    expect(updatedParams2.width).toBe(20);
    expect(updatedParams2.height).toBe(20);
    expect(updatedParams2.depth).toBe(20);

    logger.debug('✅ Cube size update test passed - translated cube size updated correctly');
  });

  it('should handle multiple size updates in sequence', async () => {
    const sizes = [10, 15, 25, 30];
    
    for (const size of sizes) {
      const code = `cube(5, center=true);translate([10,10,0])cube(${size}, center=true);`;
      
      setSourceCodeForExtraction(code);
      const ast = parserService.parseAST(code);
      expect(ast).toBeDefined();
      expect(ast.length).toBe(2);

      const secondNode = ast[1] as ASTNode;
      const result = await convertASTNodeToCSG(secondNode, 1);
      clearSourceCodeForExtraction();

      expect(result.success).toBe(true);
      if (!result.success) continue;

      const mesh = result.data.mesh as THREE.Mesh;
      expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);

      const params = (mesh.geometry as THREE.BoxGeometry).parameters;
      
      logger.debug(`Size ${size} test:`, {
        expected: size,
        actual: { width: params.width, height: params.height, depth: params.depth }
      });

      expect(params.width).toBe(size);
      expect(params.height).toBe(size);
      expect(params.depth).toBe(size);
    }

    logger.debug('✅ Multiple size updates test passed');
  });

  it('should handle vector cube sizes in translated geometries', async () => {
    const code1 = 'cube([5,10,15], center=true);translate([10,10,0])cube([20,25,30], center=true);';
    const code2 = 'cube([5,10,15], center=true);translate([10,10,0])cube([35,40,45], center=true);';

    // Test initial vector sizes
    setSourceCodeForExtraction(code1);
    const ast1 = parserService.parseAST(code1);
    expect(ast1).toBeDefined();
    expect(ast1.length).toBe(2);

    const result1 = await convertASTNodeToCSG(ast1[1] as ASTNode, 1);
    clearSourceCodeForExtraction();

    expect(result1.success).toBe(true);
    if (!result1.success) return;

    const mesh1 = result1.data.mesh as THREE.Mesh;
    const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;

    logger.debug('Vector cube test 1:', {
      expected: [20, 25, 30],
      actual: [params1.width, params1.height, params1.depth]
    });

    // Test updated vector sizes
    setSourceCodeForExtraction(code2);
    const ast2 = parserService.parseAST(code2);
    expect(ast2).toBeDefined();
    expect(ast2.length).toBe(2);

    const result2 = await convertASTNodeToCSG(ast2[1] as ASTNode, 1);
    clearSourceCodeForExtraction();

    expect(result2.success).toBe(true);
    if (!result2.success) return;

    const mesh2 = result2.data.mesh as THREE.Mesh;
    const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;

    logger.debug('Vector cube test 2:', {
      expected: [35, 40, 45],
      actual: [params2.width, params2.height, params2.depth]
    });

    // The vector sizes should update correctly
    expect(params2.width).toBe(35);
    expect(params2.height).toBe(40);
    expect(params2.depth).toBe(45);

    logger.debug('✅ Vector cube sizes test passed');
  });
});
