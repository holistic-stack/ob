import { TreeCursor } from 'web-tree-sitter';

/**
 * Represents a position in the source code.
 */
export interface SourcePosition {
  row: number;
  column: number;
}

/**
 * Represents a range in the source code.
 */
export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

/**
 * Checks if the cursor's current node is of the specified type.
 * @param cursor - The tree-sitter cursor
 * @param type - The expected node type (case-insensitive)
 * @returns True if the current node matches the type
 */
export function isNodeType(cursor: TreeCursor, type: string): boolean {
  try {
    if (!cursor) {
      console.error('Cursor is null or undefined');
      return false;
    }

    // First try nodeType property (for TreeCursor)
    if ('nodeType' in cursor && typeof cursor.nodeType === 'string') {
      const nodeType = cursor.nodeType;
      const result = nodeType.toLowerCase() === type.toLowerCase();
      if (!result) {
        console.log(
          `Node type mismatch. Expected: ${type}, Actual: ${nodeType}`
        );
      }
      return result;
    }

    // If nodeType doesn't exist, try the type property (for SyntaxNode)
    if ('type' in cursor && typeof cursor.type === 'string') {
      const nodeType = cursor.type;
      const result = nodeType.toLowerCase() === type.toLowerCase();
      if (!result) {
        console.log(
          `Node type mismatch. Expected: ${type}, Actual: ${nodeType}`
        );
      }
      return result;
    }

    console.error('Could not determine node type from cursor:', cursor);
    return false;
  } catch (error) {
    console.error('Error in isNodeType:', error);
    return false;
  }
}

/**
 * Gets the source range of the current node.
 * @param cursor - The tree-sitter cursor
 * @returns The source range of the current node
 */
export function getNodeRange(cursor: TreeCursor): SourceRange {
  return {
    start: {
      row: cursor.startPosition.row,
      column: cursor.startPosition.column,
    },
    end: {
      row: cursor.endPosition.row,
      column: cursor.endPosition.column,
    },
  };
}

/**
 * Gets the text of the current node.
 * @param cursor - The tree-sitter cursor
 * @param source - The source code string
 * @returns The text content of the current node
 */
export function getNodeText(cursor: TreeCursor, source: string): string {
  const range = getNodeRange(cursor);
  const lines = source.split('\n');

  // If it's a single line, return the substring directly
  if (range.start.row === range.end.row) {
    const line = lines[range.start.row] || '';
    let text = line.substring(range.start.column, range.end.column);

    // Debug logging
    console.log('getNodeText - Single line node:');
    console.log('- Node type:', cursor.nodeType);
    console.log('- Range:', { start: range.start, end: range.end });
    console.log('- Line length:', line.length);
    console.log('- Extracted text:', JSON.stringify(text));
    console.log(
      '- Next character:',
      line[range.end.column] ? `'${line[range.end.column]}'` : 'end of line'
    );

    // Check if we should include the semicolon
    const isStatement = isNodeType(cursor, 'statement');
    const isExpression = isNodeType(cursor, 'expression_statement');
    const isCall = isNodeType(cursor, 'call_expression');
    const hasSemicolonAfter = line[range.end.column] === ';';

    console.log('Node type checks:', {
      isStatement,
      isExpression,
      isCall,
      hasSemicolonAfter,
    });

    // Include the semicolon if it's a statement/expression/call and there's a semicolon after
    if ((isStatement || isExpression || isCall) && hasSemicolonAfter) {
      console.log('Including semicolon in node text');
      text += ';';
    } else {
      console.log('Not including semicolon in node text');
    }

    console.log('Final text:', JSON.stringify(text));
    return text;
  }

  // For multi-line nodes, collect all the lines
  const result: string[] = [];

  // First line
  const firstLine = lines[range.start.row] || '';
  result.push(firstLine.substring(range.start.column));

  // Middle lines (if any)
  for (let i = range.start.row + 1; i < range.end.row; i++) {
    result.push(lines[i] || '');
  }

  // Last line
  const lastLine = lines[range.end.row] || '';
  let lastLineText = lastLine.substring(0, range.end.column);

  // If this is a statement node, include the semicolon if it's present in the source
  if (
    (isNodeType(cursor, 'statement') ||
      isNodeType(cursor, 'expression_statement')) &&
    lastLine[range.end.column] === ';'
  ) {
    lastLineText += ';';
  }

  result.push(lastLineText);

  return result.join('\n');
}

/**
 * Gets the name of a node, typically used for identifier nodes
 * @param cursor - The tree-sitter cursor
 * @param source - The source code string
 * @returns The name of the node if it's an identifier, or an empty string
 */
export function getNodeName(cursor: TreeCursor, source: string): string {
  // If current node is an identifier, return its text
  if (cursor.nodeType === 'identifier') {
    return getNodeText(cursor, source);
  }

  // Save current depth to restore later
  const startDepth = cursor.currentDepth;
  let result = '';

  // If node has children, try to find an identifier
  if (cursor.gotoFirstChild()) {
    do {
      if (cursor.nodeType === 'identifier') {
        result = getNodeText(cursor, source);
        break;
      }
    } while (cursor.gotoNextSibling());

    // Restore cursor to original depth
    while (cursor.currentDepth > startDepth) {
      cursor.gotoParent();
    }
  }

  return result;
}

/**
 * Finds the first child node of the specified type.
 * @param cursor - The tree-sitter cursor
 * @param type - The node type to find
 * @returns True if a matching child was found
 */
export function findFirstChildOfType(
  cursor: TreeCursor,
  type: string
): boolean {
  if (!cursor.gotoFirstChild()) return false;

  do {
    if (isNodeType(cursor, type)) return true;
  } while (cursor.gotoNextSibling());

  cursor.gotoParent();
  return false;
}

/**
 * Gets all direct children nodes of the current node.
 * @param cursor - The tree-sitter cursor
 * @returns Array of child nodes
 */
export function getChildren(cursor: TreeCursor): any[] {
  const children: any[] = [];

  if (!cursor.gotoFirstChild()) {
    cursor.gotoParent();
    return children;
  }

  do {
    children.push(cursor.currentNode);
  } while (cursor.gotoNextSibling());

  cursor.gotoParent();
  return children;
}
