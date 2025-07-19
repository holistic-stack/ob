import type { Tree, Node as TSNode } from 'web-tree-sitter';

// Mock the TSNode for testing
const _createMockNode = (text: string): TSNode => {
  const mockNode = {
    text,
    tree: {
      rootNode: {
        text,
      },
    },
  } as unknown as TSNode;

  return mockNode;
};

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../../openscad-parser';
import { extractSphereNode } from '../extractors/sphere-extractor.js';

let parser: OpenscadParser;
let currentTree: Tree | null = null; // Track current tree for cleanup

describe('Sphere Extractor', () => {
  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    if (currentTree) {
      try {
        (currentTree as { delete(): void }).delete();
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should extract a sphere node with a simple radius', () => {
    const code = 'sphere(r=10);';
    currentTree = parser.parseCST(code);
    // Assuming the structure is source_file -> statement -> module_instantiation
    const moduleInstantiationNode = currentTree?.rootNode?.child(0)?.child(0);
    // console.log('Module Instantiation Node:', moduleInstantiationNode?.toString());

    if (!moduleInstantiationNode) {
      throw new Error('Could not find module instantiation node');
    }

    const sphereNode = extractSphereNode(moduleInstantiationNode);
    expect(sphereNode).toBeDefined();
    expect(sphereNode?.type).toBe('sphere');
    expect(sphereNode?.radius).toBe(10);
  });

  it('should extract a sphere node with a diameter', () => {
    const code = 'sphere(d=20);';
    currentTree = parser.parseCST(code);

    const moduleInstantiationNode = currentTree?.rootNode?.child(0)?.child(0);
    if (!moduleInstantiationNode) {
      throw new Error('Could not find module instantiation node');
    }

    const sphereNode = extractSphereNode(moduleInstantiationNode);
    expect(sphereNode).toBeDefined();
    expect(sphereNode?.type).toBe('sphere');
    expect(sphereNode?.diameter).toBe(20);
  });

  it('should extract a sphere node with $fn', () => {
    const code = 'sphere($fn=100);';
    currentTree = parser.parseCST(code);

    const moduleInstantiationNode = currentTree?.rootNode?.child(0)?.child(0);
    if (!moduleInstantiationNode) {
      throw new Error('Could not find module instantiation node');
    }

    const sphereNode = extractSphereNode(moduleInstantiationNode);
    expect(sphereNode).toBeDefined();
    expect(sphereNode?.type).toBe('sphere');
    expect(sphereNode?.$fn).toBe(100);
  });

  it('should extract a sphere node with no parameters', () => {
    const code = 'sphere();';
    currentTree = parser.parseCST(code);

    const moduleInstantiationNode = currentTree?.rootNode?.child(0)?.child(0);
    if (!moduleInstantiationNode) {
      throw new Error('Could not find module instantiation node');
    }

    const sphereNode = extractSphereNode(moduleInstantiationNode);
    expect(sphereNode).toBeDefined();
    expect(sphereNode?.type).toBe('sphere');
    expect(sphereNode?.radius).toBeDefined();
  });

  it('should return undefined if no sphere node is found', () => {
    const code = 'cube();';
    currentTree = parser.parseCST(code);

    const moduleInstantiationNode = currentTree?.rootNode?.child(0)?.child(0);
    if (!moduleInstantiationNode) {
      throw new Error('Could not find module instantiation node');
    }

    const sphereNode = extractSphereNode(moduleInstantiationNode);
    expect(sphereNode).toBeNull();
  });
});
