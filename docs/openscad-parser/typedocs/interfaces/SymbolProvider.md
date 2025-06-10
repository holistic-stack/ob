[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: SymbolProvider

Defined in: [ide-support/symbol-provider/symbol-types.ts:39](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L39)

Defines the contract for a symbol provider service.
This service is responsible for extracting symbol information from an AST.

## Methods

### getSymbols()

```ts
getSymbols(ast: ASTNode[]): SymbolInfo[];
```

Defined in: [ide-support/symbol-provider/symbol-types.ts:45](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L45)

Retrieves all symbols defined in the given Abstract Syntax Tree (AST).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] | An array of AST nodes representing the parsed OpenSCAD document. |

#### Returns

[`SymbolInfo`](SymbolInfo.md)[]

An array of SymbolInfo objects.

***

### getSymbolAtPosition()

```ts
getSymbolAtPosition(ast: ASTNode[], position: Position): null | SymbolInfo;
```

Defined in: [ide-support/symbol-provider/symbol-types.ts:53](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L53)

Retrieves the symbol defined at a specific position in the source code.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] | An array of AST nodes representing the parsed OpenSCAD document. |
| `position` | [`Position`](Position.md) | The position (line and column) in the source code. |

#### Returns

`null` \| [`SymbolInfo`](SymbolInfo.md)

A SymbolInfo object if a symbol is found at the position, otherwise null.
