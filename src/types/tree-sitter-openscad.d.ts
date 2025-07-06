/**
 * @file Type declarations for web-tree-sitter and OpenSCAD WASM
 *
 * TypeScript type declarations for web-tree-sitter WASM integration.
 * Provides proper typing for OpenSCAD language grammar integration.
 */

declare module 'web-tree-sitter' {
  export interface Language {
    readonly name: string;
  }

  // Type alias for compatibility with existing code
  export type Node = SyntaxNode;

  export interface Point {
    readonly row: number;
    readonly column: number;
  }

  export interface Range {
    readonly startPosition: Point;
    readonly endPosition: Point;
    readonly startIndex: number;
    readonly endIndex: number;
  }

  export interface SyntaxNode {
    readonly type: string;
    readonly text: string;
    readonly startPosition: Point;
    readonly endPosition: Point;
    readonly startIndex: number;
    readonly endIndex: number;
    readonly parent: SyntaxNode | null;
    readonly children: SyntaxNode[];
    readonly namedChildren: SyntaxNode[];
    readonly childCount: number;
    readonly namedChildCount: number;
    readonly hasError: boolean;
    readonly isMissing: boolean;
    readonly isNamed: boolean;

    child(index: number): SyntaxNode | null;
    namedChild(index: number): SyntaxNode | null;
    firstChild: SyntaxNode | null;
    lastChild: SyntaxNode | null;
    nextSibling: SyntaxNode | null;
    previousSibling: SyntaxNode | null;
    nextNamedSibling: SyntaxNode | null;
    previousNamedSibling: SyntaxNode | null;
    toString(): string;
  }

  export interface TreeCursor {
    readonly nodeType: string;
    readonly nodeText: string;
    readonly startPosition: Point;
    readonly endPosition: Point;
    readonly startIndex: number;
    readonly endIndex: number;
    readonly currentNode: SyntaxNode;
    readonly currentFieldName: string | null;
    readonly currentDepth: number;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
    gotoFirstChildForIndex(index: number): boolean;
    gotoDescendant(index: number): void;
    reset(node: SyntaxNode): void;
    delete(): void;
  }

  export interface Tree {
    readonly rootNode: SyntaxNode;
    copy(): Tree;
    delete(): void;
    edit(edit: Edit): void;
    walk(): TreeCursor;
  }

  export interface Parser {
    parse(input: string | ((index: number, position?: Point) => string), oldTree?: Tree): Tree;
    setLanguage(language: Language): void;
    getLanguage(): Language | null;
    delete(): void;
  }

  export interface Edit {
    startIndex: number;
    oldEndIndex: number;
    newEndIndex: number;
    startPosition: Point;
    oldEndPosition: Point;
    newEndPosition: Point;
  }

  export namespace TreeSitter {
    export function init(options?: { locateFile?: (file: string) => string }): Promise<void>;
    export const Language: {
      load(path: string): Promise<Language>;
    };
    export const Parser: new () => {
      setLanguage(language: Language): void;
      parse(input: string | Input): Tree;
    };
  }

  export default TreeSitter;

  // Additional type aliases for enhanced parser types
  export type EnhancedOpenscadParser = Parser;
}
