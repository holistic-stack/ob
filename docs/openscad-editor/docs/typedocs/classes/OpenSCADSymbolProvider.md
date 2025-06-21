[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Class: OpenSCADSymbolProvider

Defined in: [ide-support/symbol-provider/symbol-provider.ts:39](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-provider.ts#L39)

Defines the contract for a symbol provider service.
This service is responsible for extracting symbol information from an AST.

## Implements

- [`SymbolProvider`](../interfaces/SymbolProvider.md)

## Constructors

### Constructor

```ts
new OpenSCADSymbolProvider(parser: EnhancedOpenscadParser, errorHandler?: SimpleErrorHandler): OpenSCADSymbolProvider;
```

Defined in: [ide-support/symbol-provider/symbol-provider.ts:44](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-provider.ts#L44)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `parser` | [`EnhancedOpenscadParser`](EnhancedOpenscadParser.md) |
| `errorHandler?` | [`SimpleErrorHandler`](SimpleErrorHandler.md) |

#### Returns

`OpenSCADSymbolProvider`

## Methods

### getSymbols()

```ts
getSymbols(ast: ASTNode[]): SymbolInfo[];
```

Defined in: [ide-support/symbol-provider/symbol-provider.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-provider.ts#L58)

Retrieves all symbols defined in the given Abstract Syntax Tree (AST).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] |

#### Returns

[`SymbolInfo`](../interfaces/SymbolInfo.md)[]

#### Implementation of

[`SymbolProvider`](../interfaces/SymbolProvider.md).[`getSymbols`](../interfaces/SymbolProvider.md#getsymbols)

***

### getSymbolAtPosition()

```ts
getSymbolAtPosition(ast: ASTNode[], position: Position): null | SymbolInfo;
```

Defined in: [ide-support/symbol-provider/symbol-provider.ts:277](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-provider.ts#L277)

Retrieves the symbol defined at a specific position in the source code.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] |
| `position` | [`Position`](../interfaces/Position.md) |

#### Returns

`null` \| [`SymbolInfo`](../interfaces/SymbolInfo.md)

#### Implementation of

[`SymbolProvider`](../interfaces/SymbolProvider.md).[`getSymbolAtPosition`](../interfaces/SymbolProvider.md#getsymbolatposition)
