import { Parser, Query, Tree, Node as TSNode, type QueryMatch } from 'web-tree-sitter';
import * as path from 'path';
import * as fs from 'fs/promises';

// Type definitions for OpenSCAD specific nodes
// Type alias for tree-sitter Node
type OpenSCADNode = TSNode;

export interface QueryResult {
  patternIndex: number;
  captures: Array<{
    name: string;
    node: TSNode;
    text: string;
    start: { row: number; column: number };
    end: { row: number; column: number };
  }>;
}

export class QueryManager {
  private queryCache: Map<string, Query> = new Map();
  private parser: Parser;
  private language: any; // Tree-sitter Language
  private queryDir: string;
  private tree?: Tree;

  constructor(parser: Parser, language: any, queryDir: string) {
    this.parser = parser;
    this.language = language;
    this.queryDir = queryDir;
  }

  /**
   * Parse source code and store the syntax tree
   */
  public parse(source: string): Tree {
    const tree = this.parser.parse(source);
    if (!tree) {
      throw new Error('Failed to parse source code');
    }
    this.tree = tree;
    return tree;
  }

  /**
   * Get the root node of the parsed tree
   */
  public getRootNode(): TSNode | null {
    return this.tree?.rootNode || null;
  }

  /**
   * Load and compile a query from a file
   */
  public async loadQuery(name: string): Promise<Query> {
    if (this.queryCache.has(name)) {
      return this.queryCache.get(name)!;
    }

    try {
      const queryPath = path.join(this.queryDir, `${name}.scm`);
      const querySource = await fs.readFile(queryPath, 'utf-8');
      const query = new Query(this.language, querySource);
      this.queryCache.set(name, query);
      return query;
    } catch (error) {
      throw new Error(
        `Failed to load query '${name}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Execute a query on the current tree
   */
  public queryTree(queryName: string): QueryResult[] {
    if (!this.tree) {
      throw new Error('No tree parsed. Call parse() first.');
    }
    return this.queryNode(queryName, this.tree.rootNode);
  }

  /**
   * Execute a query on a specific node
   */
  public queryNode(queryName: string, node: TSNode): QueryResult[] {
    const query = this.queryCache.get(queryName);
    if (!query) {
      throw new Error(
        `Query '${queryName}' not loaded. Call loadQuery() first.`
      );
    }

    const matches = query.matches(node);
    return matches.map(match => this.processQueryMatch(match, query));
  }

  /**
   * Find all module definitions in the current tree
   */
  public async findModuleDefinitions(): Promise<TSNode[]> {
    await this.loadQuery('highlights');
    const results = this.queryTree('highlights');
    return results
      .filter(result =>
        result.captures.some(c => c.name === 'module_definition')
      )
      .map(result => result.captures.find(c => c.name === 'module_name')?.node)
      .filter((node): node is OpenSCADNode => node !== undefined);
  }

  /**
   * Find all function definitions in the current tree
   */
  public async findFunctionDefinitions(): Promise<TSNode[]> {
    await this.loadQuery('highlights');
    const results = this.queryTree('highlights');
    return results
      .filter(result =>
        result.captures.some(c => c.name === 'function_definition')
      )
      .map(
        result => result.captures.find(c => c.name === 'function_name')?.node
      )
      .filter((node): node is OpenSCADNode => node !== undefined);
  }

  /**
   * Find all include and use statements in the current tree
   */
  public async findDependencies(): Promise<
    { file: string; type: 'include' | 'use' }[]
  > {
    await this.loadQuery('dependencies');
    const results = this.queryTree('dependencies');

    const dependencies: { file: string; type: 'include' | 'use' }[] = [];

    for (const result of results) {
      const includeMatch = result.captures.find(c => c.name === 'include');
      const useMatch = result.captures.find(c => c.name === 'use');
      const fileMatch = result.captures.find(c => c.name === 'file_path');

      if (includeMatch && fileMatch?.node.text) {
        dependencies.push({
          file: fileMatch.node.text.replace(/^["']|["']$/g, ''),
          type: 'include',
        });
      } else if (useMatch && fileMatch?.node.text) {
        dependencies.push({
          file: fileMatch.node.text.replace(/^["']|["']$/g, ''),
          type: 'use',
        });
      }
    }

    return dependencies;
  }

  /**
   * Find all nodes of a specific type in the current tree
   */
  public findAllNodesOfType(type: string | string[]): TSNode[] {
    if (!this.tree) {
      throw new Error('No tree parsed. Call parse() first.');
    }

    const types = Array.isArray(type) ? type : [type];
    const nodes: TSNode[] = [];

    const visit = (node: TSNode): void => {
      if (types.includes(node.type)) {
        nodes.push(node);
      }

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          visit(child);
        }
      }
    };

    visit(this.tree.rootNode);
    return nodes;
  }

  /**
   * Find the first node of a specific type in the current tree
   */
  public findFirstNodeOfType(type: string | string[]): TSNode | null {
    if (!this.tree) {
      throw new Error('No tree parsed. Call parse() first.');
    }

    const types = Array.isArray(type) ? type : [type];

    const find = (node: TSNode): TSNode | null => {
      if (types.includes(node.type)) {
        return node;
      }

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          const found = find(child);
          if (found) return found;
        }
      }

      return null;
    };

    return find(this.tree.rootNode);
  }

  /**
   * Check if a node has an ancestor of a specific type
   */
  public hasAncestorOfType(
    node: TSNode,
    ancestorType: string | string[]
  ): boolean {
    const types = Array.isArray(ancestorType) ? ancestorType : [ancestorType];
    let current = node.parent;

    while (current) {
      if (types.includes(current.type)) {
        return true;
      }
      current = current.parent;
    }

    return false;
  }

  /**
   * Get the text of a node, including any trailing semicolon if present
   */
  public getNodeTextWithSemicolon(node: TSNode, source: string): string {
    let text = node.text;

    // Check if there's a semicolon immediately after the node
    if (node.endIndex < source.length && source[node.endIndex] === ';') {
      text += ';';
    }

    return text;
  }

  /**
   * Get the full text of the node including all its children
   */
  public getNodeFullText(node: TSNode, source: string): string {
    return source.slice(node.startIndex, node.endIndex);
  }

  /**
   * Get the location of a node in the source code
   */
  public getNodeLocation(node: TSNode): {
    start: { line: number; column: number; index: number };
    end: { line: number; column: number; index: number };
  } {
    return {
      start: {
        line: node.startPosition.row + 1,
        column: node.startPosition.column,
        index: node.startIndex,
      },
      end: {
        line: node.endPosition.row + 1,
        column: node.endPosition.column,
        index: node.endIndex,
      },
    };
  }

  /**
   * Process a query match into a more usable format
   */
  private processQueryMatch(match: QueryMatch, _query: Query): QueryResult {
    const captures = match.captures.map((capture, index) => {
      // Use the index as a fallback name if we can't determine the capture name

      return {
        name: `capture_${index}`, // Use the index as a fallback name if we can't determine the capture name
        node: capture.node,
        text: capture.node.text,
        start: capture.node.startPosition,
        end: capture.node.endPosition,
      };
    });

    return {
      patternIndex: match.patternIndex,
      captures,
    };
  }

  /**
   * Get all captures with a specific name from query results
   */
  public static getCapturesByName(
    results: QueryResult[],
    name: string | string[]
  ): Array<{
    node: TSNode;
    text: string;
    start: { row: number; column: number };
    end: { row: number; column: number };
  }> {
    const names = Array.isArray(name) ? name : [name];
    const captures: Array<{
      node: TSNode;
      text: string;
      start: { row: number; column: number };
      end: { row: number; column: number };
    }> = [];

    for (const result of results) {
      for (const capture of result.captures) {
        if (names.includes(capture.name)) {
          captures.push({
            node: capture.node,
            text: capture.text,
            start: capture.node.startPosition,
            end: capture.node.endPosition,
          });
        }
      }
    }

    return captures;
  }

  /**
   * Get the source code for a range
   */
  public getSourceForRange(start: number, end: number, source: string): string {
    return source.slice(start, end);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.queryCache.clear();
    delete (this as any).tree;
  }
}
