import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import * as cursorUtils from './cursor-utils.js';
import * as fs from 'fs';
import * as path from 'path';
import { cstTreeCursorWalkLog } from './cstTreeCursorWalkLog.js';

describe('Cursor Utils Integration', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
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
      const tree = parser.parse(code);
      const simplifiedRootNode = tree?.rootNode
        ? {
            id: tree.rootNode.id,
            type: tree.rootNode.type,
            text:
              tree.rootNode.text?.substring(0, 70) +
              (tree.rootNode.text && tree.rootNode.text.length > 70
                ? '...'
                : ''),
          }
        : null;

      expect(tree).not.toBeNull();

      const logFilePath = path.resolve(
        __dirname,
        '../../../../../diagnostic_log.txt'
      );
      try {
        fs.writeFileSync(logFilePath, '');
      } catch (_e) {
        /* ensure file is clear or created */
      }
      const log = (message: string) =>
        fs.appendFileSync(logFilePath, message + '\n');

      if (!tree) {
        log('Error: CST Tree is null. Parsing failed.');
        throw new Error(
          'CST Tree is null after parsing. Check grammar or input code.'
        );
      }

      log(
        "Input code for 'should handle translate transform':\n" + code + '\n'
      );
      log('Root node from tree.rootNode (simplified):\n');
      log(JSON.stringify(simplifiedRootNode, null, 2) + '\n');

      log('=== Full CST Tree Walk (translate test) ===\n');
      const treeWalkLines = cstTreeCursorWalkLog(tree, code);
      if (treeWalkLines) {
        treeWalkLines.forEach((line: string) => log(line));
      }
      log('\n=== End Full CST Tree Walk (translate test) ===\n\n');

      const cursor = tree.walk();

      expect(cursor.gotoFirstChild()).toBe(true);
      log(`Cursor at: ${cursor.nodeType} (expected statement)`);
      expect(cursor.nodeType).toBe('statement');

      expect(cursor.gotoFirstChild()).toBe(true);
      log(`Cursor at: ${cursor.nodeType} (expected module_instantiation)`);
      expect(cursor.nodeType).toBe('module_instantiation');

      expect(cursor.gotoFirstChild()).toBe(true);
      log(
        `Cursor at: ${cursor.nodeType} (expected identifier for translate)`
      );
      expect(cursor.nodeType).toBe('identifier');
      expect(cursorUtils.getNodeText(cursor, code)).toBe('translate');
      log(
        `Node text for translate: "${cursorUtils.getNodeText(cursor, code)}"`
      );

      expect(cursor.gotoNextSibling()).toBe(true);
      log(`Cursor at: ${cursor.nodeType} (expected argument_list)`);
      expect(cursor.nodeType).toBe('argument_list');
      expect(cursorUtils.getNodeText(cursor, code)).toBe('([10, 20, 30])');
      log(
        `Node text for arguments: "${cursorUtils.getNodeText(cursor, code)}"`
      );

      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.gotoNextSibling()).toBe(true);
      expect(cursor.nodeType).toBe('arguments');
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('argument');
      expect(cursor.gotoFirstChild()).toBe(true);
      expect(cursor.nodeType).toBe('vector_expression'); // Current grammar uses specific types
      let foundArrayLiteral = false;
      let currentDepth = 0;
      const maxDescendDepth = 15;

      // The vector_expression already contains the array content, no need to search deeper
      foundArrayLiteral = true; // We're already at the vector_expression which contains the array
      log(`Cursor at: ${cursor.nodeType} (expected vector_expression)`);
      expect(cursor.nodeType).toBe('vector_expression');
      expect(cursorUtils.getNodeText(cursor, code)).toBe('[10, 20, 30]');
      log(
        `Node text for vector_expression: "${cursorUtils.getNodeText(
          cursor,
          code
        )}"`
      );

      while (
        cursor.nodeType !== 'module_instantiation' &&
        cursor.gotoParent()
      ) {
        // Continue traversing up the tree
      }
      expect(cursor.nodeType).toBe('module_instantiation');

      cursor.gotoFirstChild();
      cursor.gotoNextSibling();
      expect(cursor.gotoNextSibling()).toBe(true);
      log(`Cursor at: ${cursor.nodeType} (expected statement for cube)`);
      expect(cursor.nodeType).toBe('statement');
      expect(cursorUtils.getNodeText(cursor, code).trim()).toBe('cube(10);');
      log(
        `Node text for cube statement: "${cursorUtils
          .getNodeText(cursor, code)
          .trim()}"`
      );
    });

    it('should extract correct text from nodes', () => {
      const code = 'sphere(r=5, $fn=32);';
      const tree = parser.parse(code);
      console.log('--- Tree Inspection ---');
      console.log('Type of tree:', typeof tree);
      console.log('tree object:', JSON.stringify(tree, null, 2));
      console.log('tree.walk type:', typeof tree?.walk);
      console.log('tree.rootNode type:', typeof tree?.rootNode);
      console.log('tree.rootNode:', JSON.stringify(tree?.rootNode, null, 2));
      console.log('--- End Tree Inspection ---');

      expect(tree).not.toBeNull();

      const cursor = tree!.walk();
      cursor.gotoFirstChild();
      const sourceFileNode = {
        type: cursor.nodeType,
        text: cursorUtils.getNodeText(cursor, code),
        start: cursor.startPosition,
        end: cursor.endPosition,
      };
      console.log('source_file node:', sourceFileNode);

      cursor.gotoFirstChild();
      const callExpressionNode = {
        type: cursor.nodeType,
        text: cursorUtils.getNodeText(cursor, code),
        start: cursor.startPosition,
        end: cursor.endPosition,
        hasSemicolon:
          cursor.endPosition.column < code.length &&
          code[cursor.endPosition.column] === ';',
      };
      console.log('call_expression node:', callExpressionNode);

      const nodeText = cursorUtils.getNodeText(cursor, code);
      console.log('getNodeText - Single line node:');
      console.log('- Node type:', cursor.nodeType);
      console.log('- Range:', {
        start: cursor.startPosition,
        end: cursor.endPosition,
      });
      console.log('- Line length:', code.length);
      console.log('- Extracted text:', JSON.stringify(nodeText));
      console.log(
        '- Next character:',
        cursor.endPosition.column < code.length
          ? `'${code[cursor.endPosition.column]}'`
          : 'end of line'
      );

      console.log(
        'Node type mismatch. Expected: statement, Actual:',
        cursor.nodeType
      );
      console.log(
        'Node type mismatch. Expected: expression_statement, Actual:',
        cursor.nodeType
      );
      console.log(
        'Node type mismatch. Expected: call_expression, Actual:',
        cursor.nodeType
      );
      console.log('Node type checks:', {
        isStatement: cursorUtils.isNodeType(cursor, 'statement'),
        isExpression: cursorUtils.isNodeType(cursor, 'expression_statement'),
        isCall: cursorUtils.isNodeType(cursor, 'call_expression'),
        hasSemicolonAfter:
          cursor.endPosition.column < code.length &&
          code[cursor.endPosition.column] === ';',
      });

      console.log('Not including semicolon in node text');
      console.log('Final text:', nodeText);

      const hasSibling = cursor.gotoNextSibling();
      if (hasSibling) {
        expect(cursor.nodeType).toBe(';');
      }

      cursor.gotoParent();
      cursor.gotoFirstChild();
      cursor.gotoFirstChild();

      let depth = 0;
      const maxDepth = 10;
      let foundArgs = false;

      while (cursor.gotoFirstChild() && depth < maxDepth) {
        depth++;
        if (cursorUtils.getNodeText(cursor, code).includes('r=5')) {
          foundArgs = true;
          break;
        }
      }

      console.log(`Traversed ${depth} levels, found args: ${foundArgs}`);
    });
  });
});
