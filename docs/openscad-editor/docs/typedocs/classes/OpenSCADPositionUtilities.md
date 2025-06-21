[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Class: OpenSCADPositionUtilities

Defined in: [ide-support/position-utilities/position-utilities.ts:25](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L25)

Defines the contract for position utilities service.
This service provides position-based operations on AST nodes.

## Implements

- [`PositionUtilities`](../interfaces/PositionUtilities.md)

## Constructors

### Constructor

```ts
new OpenSCADPositionUtilities(symbolProvider?: SymbolProvider): OpenSCADPositionUtilities;
```

Defined in: [ide-support/position-utilities/position-utilities.ts:29](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L29)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `symbolProvider?` | [`SymbolProvider`](../interfaces/SymbolProvider.md) |

#### Returns

`OpenSCADPositionUtilities`

## Methods

### findNodeAt()

```ts
findNodeAt(ast: ASTNode[], position: Position): null | ASTNode;
```

Defined in: [ide-support/position-utilities/position-utilities.ts:42](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L42)

Finds the AST node at a specific position in the source code.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] |
| `position` | [`Position`](../interfaces/Position.md) |

#### Returns

`null` \| [`ASTNode`](../type-aliases/ASTNode.md)

#### Implementation of

[`PositionUtilities`](../interfaces/PositionUtilities.md).[`findNodeAt`](../interfaces/PositionUtilities.md#findnodeat)

***

### getNodeRange()

```ts
getNodeRange(node: ASTNode): SourceRange;
```

Defined in: [ide-support/position-utilities/position-utilities.ts:75](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L75)

Gets the source range for an AST node.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `node` | [`ASTNode`](../type-aliases/ASTNode.md) |

#### Returns

[`SourceRange`](../interfaces/SourceRange.md)

#### Implementation of

[`PositionUtilities`](../interfaces/PositionUtilities.md).[`getNodeRange`](../interfaces/PositionUtilities.md#getnoderange)

***

### getHoverInfo()

```ts
getHoverInfo(node: ASTNode): null | HoverInfo;
```

Defined in: [ide-support/position-utilities/position-utilities.ts:110](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L110)

Gets hover information for an AST node.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `node` | [`ASTNode`](../type-aliases/ASTNode.md) |

#### Returns

`null` \| [`HoverInfo`](../interfaces/HoverInfo.md)

#### Implementation of

[`PositionUtilities`](../interfaces/PositionUtilities.md).[`getHoverInfo`](../interfaces/PositionUtilities.md#gethoverinfo)

***

### getCompletionContext()

```ts
getCompletionContext(ast: ASTNode[], position: Position): CompletionContext;
```

Defined in: [ide-support/position-utilities/position-utilities.ts:228](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L228)

Gets the completion context at a specific position.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] |
| `position` | [`Position`](../interfaces/Position.md) |

#### Returns

[`CompletionContext`](../interfaces/CompletionContext.md)

#### Implementation of

[`PositionUtilities`](../interfaces/PositionUtilities.md).[`getCompletionContext`](../interfaces/PositionUtilities.md#getcompletioncontext)

***

### isPositionInRange()

```ts
isPositionInRange(position: Position, range: SourceRange): boolean;
```

Defined in: [ide-support/position-utilities/position-utilities.ts:286](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L286)

Checks if a position is within a source range.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `position` | [`Position`](../interfaces/Position.md) |
| `range` | [`SourceRange`](../interfaces/SourceRange.md) |

#### Returns

`boolean`

#### Implementation of

[`PositionUtilities`](../interfaces/PositionUtilities.md).[`isPositionInRange`](../interfaces/PositionUtilities.md#ispositioninrange)

***

### findNodesContaining()

```ts
findNodesContaining(ast: ASTNode[], position: Position): ASTNode[];
```

Defined in: [ide-support/position-utilities/position-utilities.ts:298](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-utilities.ts#L298)

Finds all nodes that contain a specific position.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] |
| `position` | [`Position`](../interfaces/Position.md) |

#### Returns

[`ASTNode`](../type-aliases/ASTNode.md)[]

#### Implementation of

[`PositionUtilities`](../interfaces/PositionUtilities.md).[`findNodesContaining`](../interfaces/PositionUtilities.md#findnodescontaining)
