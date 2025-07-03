import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { ExpressionVisitor } from './expression-visitor.js';
import { ErrorHandler } from '../../error-handling/index.js';

describe('ExpressionVisitor Debug', () => {
  let parser: EnhancedOpenscadParser;
  let errorHandler: ErrorHandler;
  let _visitor: ExpressionVisitor;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
    _visitor = new ExpressionVisitor('', errorHandler);
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should debug the CST structure of a binary expression', async () => {
    const code = '1 + 2;';
    const tree = parser.parseCST(code);
    expect(tree).not.toBeNull();

    // Log the structure of the tree
    console.log('Root node type:', tree!.rootNode.type);
    console.log('Root node text:', tree!.rootNode.text);
    console.log('Root node child count:', tree!.rootNode.childCount);

    // Log the structure of each child
    for (let i = 0; i < tree!.rootNode.childCount; i++) {
      const child = tree!.rootNode.child(i);
      if (!child) continue;

      console.log(`Child ${i} type:`, child.type);
      console.log(`Child ${i} text:`, child.text);
      console.log(`Child ${i} child count:`, child.childCount);

      // Log the structure of each grandchild
      for (let j = 0; j < child.childCount; j++) {
        const grandchild = child.child(j);
        if (!grandchild) continue;

        console.log(`Grandchild ${i}.${j} type:`, grandchild.type);
        console.log(`Grandchild ${i}.${j} text:`, grandchild.text);
        console.log(`Grandchild ${i}.${j} child count:`, grandchild.childCount);
      }
    }
  });

  it('should debug the CST structure of an assignment statement', async () => {
    const code = 'a = 1 + 2;';
    const tree = parser.parseCST(code);
    expect(tree).not.toBeNull();

    // Log the structure of the tree
    console.log('Root node type:', tree!.rootNode.type);
    console.log('Root node text:', tree!.rootNode.text);
    console.log('Root node child count:', tree!.rootNode.childCount);

    // Log the structure of each child
    for (let i = 0; i < tree!.rootNode.childCount; i++) {
      const child = tree!.rootNode.child(i);
      if (!child) continue;

      console.log(`Child ${i} type:`, child.type);
      console.log(`Child ${i} text:`, child.text);
      console.log(`Child ${i} child count:`, child.childCount);

      // Log the structure of each grandchild
      for (let j = 0; j < child.childCount; j++) {
        const grandchild = child.child(j);
        if (!grandchild) continue;

        console.log(`Grandchild ${i}.${j} type:`, grandchild.type);
        console.log(`Grandchild ${i}.${j} text:`, grandchild.text);
        console.log(`Grandchild ${i}.${j} child count:`, grandchild.childCount);

        // Log the structure of each great-grandchild
        for (let k = 0; k < grandchild.childCount; k++) {
          const greatGrandchild = grandchild.child(k);
          if (!greatGrandchild) continue;

          console.log(
            `Great-grandchild ${i}.${j}.${k} type:`,
            greatGrandchild.type
          );
          console.log(
            `Great-grandchild ${i}.${j}.${k} text:`,
            greatGrandchild.text
          );
          console.log(
            `Great-grandchild ${i}.${j}.${k} child count:`,
            greatGrandchild.childCount
          );
        }
      }
    }
  });
});
