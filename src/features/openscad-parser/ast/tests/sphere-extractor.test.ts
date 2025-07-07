import type { Node as TSNode } from 'web-tree-sitter';

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
let currentTree: unknown = null; // Track current tree for cleanup

describe('Sphere Extractor', () => {
  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    // Clean up the current tree if it exists
    if (currentTree) {
      try {
        (currentTree as { delete(): void }).delete();
      } catch (_error) {
        // Ignore cleanup errors
      }
      currentTree = null;
    }

    // Dispose the parser
    if (parser) {
      parser.dispose();
    }
  });

  const parseToSyntaxNode = (code: string): TSNode | null => {
    // Clean up previous tree
    if (currentTree) {
      try {
        (currentTree as { delete(): void }).delete();
      } catch (_error) {
        // Ignore cleanup errors
      }
    }

    currentTree = parser.parseCST(code);
    // Assuming the structure is source_file -> statement -> module_instantiation
    const moduleInstantiationNode = currentTree?.rootNode?.child(0)?.child(0);
    // console.log('Module Instantiation Node:', moduleInstantiationNode?.toString());
    return moduleInstantiationNode || null;
  };

  describe('extractSphereNode', () => {
    it('should extract sphere with radius parameter', () => {
      const code = 'sphere(10);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(10);
      expect(result?.diameter).toBeUndefined();
    });

    it('should extract sphere with named radius parameter', () => {
      const code = 'sphere(r=15);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(15);
      expect(result?.diameter).toBeUndefined();
    });

    it('should extract sphere with diameter parameter', () => {
      const code = 'sphere(d=20);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.diameter).toBe(20);
      expect(result?.radius).toBe(10); // radius should be half the diameter
    });

    it('should extract sphere with $fn parameter', () => {
      const code = 'sphere(r=10, $fn=100);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(10);
      expect(result?.fn).toBe(100);
    });

    it('should extract sphere with $fa parameter', () => {
      const code = 'sphere(r=10, $fa=5);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(10);
      expect(result?.fa).toBe(5);
    });

    it('should extract sphere with $fs parameter', () => {
      const code = 'sphere(r=10, $fs=0.1);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(10);
      expect(result?.fs).toBe(0.1);
    });

    it('should extract sphere with multiple resolution parameters', () => {
      const code = 'sphere(r=10, $fn=100, $fa=5, $fs=0.1);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(10);
      expect(result?.fn).toBe(100);
      expect(result?.fa).toBe(5);
      expect(result?.fs).toBe(0.1);
    });

    it('should extract sphere with default radius when no parameters are provided', () => {
      const code = 'sphere();';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.radius).toBe(1);
    });

    it('should prioritize diameter over radius when both are provided', () => {
      const code = 'sphere(r=10, d=30);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractSphereNode(node);

      expect(result).toBeDefined();
      expect(result?.type).toBe('sphere');
      expect(result?.diameter).toBe(30);
      expect(result?.radius).toBe(15); // radius should be calculated from diameter
    });
  });
});
