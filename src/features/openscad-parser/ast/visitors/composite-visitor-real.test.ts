import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { Node as TSNode } from 'web-tree-sitter';

describe('Real Parser Integration Tests', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    // Create a new parser instance for each test
    parser = new EnhancedOpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  describe('Core parsing functionality', () => {
    it('should parse a simple cube and return CST', () => {
      const code = 'cube(10);';
      const tree = parser.parse(code);

      expect(tree).toBeDefined();
      expect(tree).not.toBeNull();

      const rootNode = tree!.rootNode;
      expect(rootNode.type).toBe('source_file');
      expect(rootNode.childCount).toBeGreaterThan(0);
    });

    it('should parse OpenSCAD code and return valid tree structure', () => {
      const code = 'sphere(5);';
      const tree = parser.parse(code);

      expect(tree).toBeDefined();
      expect(tree).not.toBeNull();

      const rootNode = tree!.rootNode;
      expect(rootNode.type).toBe('source_file');

      // Find statement nodes
      function findStatements(node: TSNode): TSNode[] {
        const statements: TSNode[] = [];
        if (node.type === 'statement') {
          statements.push(node);
        }
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child) {
            statements.push(...findStatements(child));
          }
        }
        return statements;
      }

      const statements = findStatements(rootNode);
      expect(statements.length).toBeGreaterThan(0);
    });

    it('should parse code with multiple statements', () => {
      const code = `
        cube(10);
        sphere(5);
        cylinder(h=10, r=5);
      `;
      const tree = parser.parse(code);

      expect(tree).toBeDefined();
      expect(tree).not.toBeNull();

      const rootNode = tree!.rootNode;
      expect(rootNode.type).toBe('source_file');

      // Count statement nodes
      function countStatements(node: TSNode): number {
        let count = 0;
        if (node.type === 'statement') {
          count++;
        }
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child) {
            count += countStatements(child);
          }
        }
        return count;
      }

      const statementCount = countStatements(rootNode);
      expect(statementCount).toBeGreaterThanOrEqual(3);
    });
  });
});
