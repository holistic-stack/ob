/**
 * @file debug-parameter-extraction.test.ts
 * @description Debug test for parameter value extraction pipeline
 * This test isolates the parameter binding issue to identify where numeric values are lost
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SimpleErrorHandler } from '@/features/openscad-parser';
import type { ASTNode } from '../../ast/ast-types';
import { OpenscadParser } from '../../openscad-parser';
import { ModuleRegistry } from '../module-registry/module-registry';
import { ModuleResolver } from './module-resolver';

describe('Debug: Parameter Value Extraction', () => {
  let parser: OpenscadParser;
  let errorHandler: SimpleErrorHandler;
  let registry: ModuleRegistry;
  let resolver: ModuleResolver;

  beforeEach(async () => {
    errorHandler = new SimpleErrorHandler();
    parser = new OpenscadParser(errorHandler);
    await parser.init();

    registry = new ModuleRegistry();
    resolver = new ModuleResolver(registry);
  });

  afterEach(() => {
    if (parser) {
      parser.dispose();
    }
  });

  it('should extract numeric literal correctly from simple module', async () => {
    // Simplest possible test case
    const openscadCode = `
module simple(size=5) {
    sphere(size);
}
simple();
    `;

    console.log('\n=== PARSING SIMPLE MODULE ===');
    const ast: ASTNode[] = parser.parseAST(openscadCode);

    console.log('AST nodes:', ast.length);
    for (let i = 0; i < ast.length; i++) {
      console.log(`Node ${i}:`, JSON.stringify(ast[i], null, 2));
    }

    expect(ast).toBeDefined();
    expect(Array.isArray(ast)).toBe(true);
    expect(ast.length).toBeGreaterThan(0);

    // Find the module definition
    const moduleNode = ast.find((node) => node.type === 'module_definition');
    expect(moduleNode).toBeDefined();

    console.log('\n=== MODULE DEFINITION ===');
    console.log('Module node:', JSON.stringify(moduleNode, null, 2));

    // Check the parameter definition
    const moduleDefNode = moduleNode as any;
    expect(moduleDefNode.parameters).toBeDefined();
    expect(Array.isArray(moduleDefNode.parameters)).toBe(true);
    expect(moduleDefNode.parameters.length).toBe(1);

    const sizeParam = moduleDefNode.parameters[0];
    console.log('\n=== PARAMETER DEFINITION ===');
    console.log('Size parameter:', JSON.stringify(sizeParam, null, 2));

    expect(sizeParam.name).toBe('size');
    expect(sizeParam.defaultValue).toBeDefined();

    // This is where we expect to see the numeric value 5
    console.log('\n=== DEFAULT VALUE ANALYSIS ===');
    console.log('Default value type:', typeof sizeParam.defaultValue);
    console.log('Default value:', sizeParam.defaultValue);

    if (typeof sizeParam.defaultValue === 'object' && sizeParam.defaultValue !== null) {
      console.log('Default value structure:', JSON.stringify(sizeParam.defaultValue, null, 2));

      // Check if it's an expression node
      if ('type' in sizeParam.defaultValue && sizeParam.defaultValue.type === 'expression') {
        const expr = sizeParam.defaultValue as any;
        console.log('Expression type:', expr.expressionType);
        console.log('Expression value:', expr.value);
        console.log('Expression value type:', typeof expr.value);

        // This should be 5, not an empty string
        expect(expr.expressionType).toBe('literal');
        expect(expr.value).toBe(5); // This is likely failing
      }
    }

    console.log('\n=== RESOLVING MODULE ===');
    const result = resolver.resolveAST(ast);

    console.log('Resolution result:', result.success);
    if (!result.success) {
      console.log('Resolution error:', result.error);
    }

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Expected result to be successful');
    }

    expect(result.data).toBeDefined();
    const resolvedNodes = result.data;
    console.log('Resolved nodes count:', resolvedNodes.length);

    for (let i = 0; i < resolvedNodes.length; i++) {
      console.log(`Resolved node ${i}:`, JSON.stringify(resolvedNodes[i], null, 2));
    }

    // Find the sphere node
    const sphereNode = resolvedNodes.find((node) => node.type === 'sphere') as any;
    expect(sphereNode).toBeDefined();

    console.log('\n=== SPHERE NODE ANALYSIS ===');
    console.log('Sphere node:', JSON.stringify(sphereNode, null, 2));
    console.log('Sphere radius:', sphereNode.radius);
    console.log('Sphere radius type:', typeof sphereNode.radius);

    // This should be 5 (number), not an expression object
    expect(sphereNode.radius).toBe(5);
  });

  it('should extract multiple numeric parameters correctly', async () => {
    const openscadCode = `
module multi(a=1, b=2, c=3) {
    translate([a,b,c]) sphere(1);
}
multi();
    `;

    console.log('\n=== PARSING MULTI-PARAMETER MODULE ===');
    const ast: ASTNode[] = parser.parseAST(openscadCode);

    const moduleNode = ast.find((node) => node.type === 'module_definition') as any;
    expect(moduleNode).toBeDefined();

    console.log('Module parameters:', JSON.stringify(moduleNode.parameters, null, 2));

    expect(moduleNode.parameters.length).toBe(3);

    // Check each parameter's default value
    const expectedValues = [1, 2, 3];
    for (let i = 0; i < 3; i++) {
      const param = moduleNode.parameters[i];
      console.log(`Parameter ${i} (${param.name}):`, JSON.stringify(param.defaultValue, null, 2));

      if (
        typeof param.defaultValue === 'object' &&
        param.defaultValue !== null &&
        'value' in param.defaultValue
      ) {
        expect(param.defaultValue.value).toBe(expectedValues[i]);
      } else {
        expect(param.defaultValue).toBe(expectedValues[i]);
      }
    }

    const result = resolver.resolveAST(ast);
    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Expected result to be successful');
    }

    expect(result.data).toBeDefined();
    const resolvedNodes = result.data;
    const translateNode = resolvedNodes.find((node) => node.type === 'translate') as any;
    expect(translateNode).toBeDefined();

    console.log('Translate vector:', translateNode.v);
    expect(translateNode.v).toEqual([1, 2, 3]);
  });
});
