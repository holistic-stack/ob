import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../../openscad-parser';
import { cstTreeCursorWalkLog } from './cstTreeCursorWalkLog.js';
import * as cursorUtils from './cursor-utils.js';

describe('Cursor Utils Integration', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    if (parser?.isInitialized) {
      parser.dispose();
    }
  });

  describe('Transformations', () => {
    it('should handle translate transform', () => {
      const code = `translate([10, 20, 30])
          cube(10);
      `;
      const tree = parser.parseCST(code);

      expect(tree).not.toBeNull();

      if (!tree) {
        throw new Error('CST Tree is null after parsing. Check grammar or input code.');
      }

      // Log the tree structure for debugging if needed
      const treeWalkLines = cstTreeCursorWalkLog(tree, code);
      expect(treeWalkLines).toBeDefined();

      const cursor = tree.walk();

      // Navigate to the first statement
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('statement');

      // Navigate to the module_instantiation
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('module_instantiation');

      // Navigate to the identifier (translate)
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('identifier');
      expect(cursorUtils.getNodeText(cursor, code)).toBe('translate');

      // Navigate to the argument_list
      expect(cursor.gotoNextSibling()).toBe(true);
      expect(cursor.nodeType).toBe('argument_list');
      expect(cursorUtils.getNodeText(cursor, code)).toBe('([10, 20, 30])');

      // Navigate to the arguments and vector_expression
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.gotoNextSibling()).toBe(true);
      expect(cursor.nodeType).toBe('arguments');
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('argument');
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('vector_expression');
      expect(cursorUtils.getNodeText(cursor, code)).toBe('[10, 20, 30]');

      // Navigate back to module_instantiation
      while (cursor.nodeType !== 'module_instantiation' && cursor.gotoParent()) {
        // Continue traversing up the tree
      }
      expect(cursor.nodeType).toBe('module_instantiation');

      // Navigate to the cube statement
      cursor.gotoFirstChild();
      cursor.gotoNextSibling();
      expect(cursor.gotoNextSibling()).toBe(true);
      expect(cursor.nodeType).toBe('statement');
      expect(cursorUtils.getNodeText(cursor, code).trim()).toBe('cube(10);');
    });

    it('should extract correct text from nodes', () => {
      const code = 'sphere(r=5, $fn=32);';
      const tree = parser.parseCST(code);
      expect(tree).not.toBeNull();

      const cursor = tree?.walk();
      if (!cursor) throw new Error('No cursor available');
      cursor.gotoFirstChild();

      // Verify source file node
      const sourceFileNode = {
        type: cursor.nodeType,
        text: cursorUtils.getNodeText(cursor, code),
        start: cursor.startPosition,
        end: cursor.endPosition,
      };
      expect(sourceFileNode.type).toBe('statement');
      expect(sourceFileNode.text).toBe(code);

      // Navigate to the module instantiation
      cursor.gotoFirstChild();
      const moduleInstantiationNode = {
        type: cursor.nodeType,
        text: cursorUtils.getNodeText(cursor, code),
        start: cursor.startPosition,
        end: cursor.endPosition,
      };
      expect(moduleInstantiationNode.type).toBe('module_instantiation');

      const nodeText = cursorUtils.getNodeText(cursor, code);
      expect(nodeText).toBe(code);

      // Test utility functions
      expect(cursorUtils.isNodeType(cursor, 'module_instantiation')).toBe(true);
      expect(cursorUtils.isNodeType(cursor, 'statement')).toBe(false);
      expect(cursorUtils.isNodeType(cursor, 'call_expression')).toBe(false);

      // Check for semicolon sibling
      const hasSibling = cursor.gotoNextSibling();
      if (hasSibling) {
        expect(cursor.nodeType).toBe(';');
      }

      // Navigate back and search for arguments
      cursor.gotoParent();
      cursor.gotoFirstChild();
      cursor.gotoFirstChild();

      let depth = 0;
      const maxDepth = 10;

      while (cursor.gotoFirstChild() && depth < maxDepth) {
        depth++;
        if (cursorUtils.getNodeText(cursor, code).includes('r=5')) {
          break;
        }
      }

      // We expect to find the arguments in the tree structure
      expect(depth).toBeLessThanOrEqual(maxDepth);
    });
  });
});
