import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { OpenscadParser } from '../features/openscad-parser/openscad-parser';
import { convertASTNodeToCSG, setSourceCodeForExtraction, clearSourceCodeForExtraction } from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter';
import type { ASTNode } from '../features/openscad-parser/core/ast-types';

describe('Fuzzy Cube Sizing', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    parserService = new OpenscadParser();
    await parserService.init();
  });

  it('should produce two cubes of the same size under fuzzy testing', () => {
    fc.assert(
      fc.property(fc.double({ min: 1, max: 100 }), (size) => {
        const code = `cube(${size}, center=true);translate([10,10,0])cube(${size}, center=true);`;
        setSourceCodeForExtraction(code);

        const ast = parserService.parseAST(code);
        expect(ast).toBeDefined();
        expect(ast.length).toBe(2);

        const firstNode = ast[0] as ASTNode;
        const secondNode = ast[1] as ASTNode;

        const result1 = convertASTNodeToCSG(firstNode, 0);
        const result2 = convertASTNodeToCSG(secondNode, 1);

        clearSourceCodeForExtraction();

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        if (!result1.success || !result2.success) return false;

        const mesh1 = result1.data.mesh as THREE.Mesh;
        const mesh2 = result2.data.mesh as THREE.Mesh;

        const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;
        const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;

        const widthDiff = Math.abs(params1.width - params2.width);
        const heightDiff = Math.abs(params1.height - params2.height);
        const depthDiff = Math.abs(params1.depth - params2.depth);
        const tolerance = 1e-9;

                console.log('Fuzzy test iteration with size:', size);
        console.log('Mesh 1 (standalone) dimensions:', params1);
        console.log('Mesh 2 (translated) dimensions:', params2);

        const widthDiff = Math.abs(params1.width - params2.width);
        const heightDiff = Math.abs(params1.height - params2.height);
        const depthDiff = Math.abs(params1.depth - params2.depth);

        console.log('Dimension differences:', { widthDiff, heightDiff, depthDiff });

        const areEqual = widthDiff < tolerance && heightDiff < tolerance && depthDiff < tolerance;

        if (!areEqual) {
          console.log('Fuzzy test failed with code:', code);
        }

        expect(areEqual).toBe(true);
      })
    );
  });
});