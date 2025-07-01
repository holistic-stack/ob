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

  export interface Tree {
    readonly rootNode: SyntaxNode;
    copy(): Tree;
    delete(): void;
    edit(edit: Edit): void;
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

  export default class TreeSitter {
    static init(options?: { locateFile?: (file: string) => string }): Promise<void>;
    static Language: {
      load(wasmBytes: Uint8Array): Promise<Language>;
    };
    static Parser: {
      new (): Parser;
      init(options?: { locateFile?: (file: string) => string }): Promise<void>;
    };
  }
}
