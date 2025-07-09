/**
 * @file Debugging Test for Cube Sizing Issue
 *
 * This test file is dedicated to investigating and resolving the issue where two identical
 * `cube(5, center=true)` calls, one of which is translated, render as cubes of different sizes.
 * This test will isolate the parsing and conversion of the problematic OpenSCAD code,
 * allowing for a focused debugging effort.
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

const logger = createLogger('CubeSizingIssueDebugTest');

describe('Debugging Cube Sizing Issue', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up cube sizing debug test');
    parserService = new OpenscadParser();
    await parserService.init();
  });
    
  it('should produce two cubes of the same size', async () => {
    const code = 'cube(5, center=true);translate([10,10,0])cube(5, center=true);';
    logger.debug(`Testing code: "${code}"`);

    // Set the source code for the converter to use
    setSourceCodeForExtraction(code);

    const ast = parserService.parseAST(code);
    expect(ast).toBeDefined();
    expect(ast.length).toBe(2);

    const firstNode = ast[0] as ASTNode;
    const secondNode = ast[1] as ASTNode;

    // Debug: Log the actual AST structure
    logger.debug('First node:', {
      type: firstNode.type,
      size: 'size' in firstNode ? firstNode.size : 'N/A',
      center: 'center' in firstNode ? firstNode.center : 'N/A'
    });
    logger.debug('Second node:', {
      type: secondNode.type,
      v: 'v' in secondNode ? secondNode.v : 'N/A',
      children: 'children' in secondNode ? secondNode.children?.length : 'N/A'
    });

    // Adjust expectations based on actual parser output
    expect(firstNode.type).toBe('cube');
    expect(secondNode.type).toBe('translate');

    // Convert both nodes
    const result1 = await convertASTNodeToCSG(firstNode, 0);
    const result2 = await convertASTNodeToCSG(secondNode, 1);

    // Clear the source code
    clearSourceCodeForExtraction();

    // Check that both conversions were successful
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    if (!result1.success || !result2.success) return;

    const mesh1 = result1.data.mesh as THREE.Mesh;
    const mesh2 = result2.data.mesh as THREE.Mesh;

    // Verify the first cube's properties
    expect(mesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;
    expect(params1.width).toBe(5);
    expect(params1.height).toBe(5);
    expect(params1.depth).toBe(5);

    // Verify the second cube's properties
    // The geometry of the second cube should be a BoxGeometry, not a default sphere or something else
    expect(mesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;
    expect(params2.width).toBe(5);
    expect(params2.height).toBe(5);
    expect(params2.depth).toBe(5);

    // Verify the translation of the second cube
    expect(mesh2.position.x).toBe(10);
    expect(mesh2.position.y).toBe(10);
    expect(mesh2.position.z).toBe(0);

    logger.debug('Test completed: Both cubes have the correct size and transformation.');
  });
});
