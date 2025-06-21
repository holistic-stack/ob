[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: PositionUtilities

Defined in: [ide-support/position-utilities/position-types.ts:87](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L87)

Defines the contract for position utilities service.
This service provides position-based operations on AST nodes.

## Methods

### findNodeAt()

```ts
findNodeAt(ast: ASTNode[], position: Position): null | ASTNode;
```

Defined in: [ide-support/position-utilities/position-types.ts:94](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L94)

Finds the AST node at a specific position in the source code.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] | An array of AST nodes representing the parsed OpenSCAD document. |
| `position` | [`Position`](Position.md) | The position (line and column) in the source code. |

#### Returns

`null` \| [`ASTNode`](../type-aliases/ASTNode.md)

The AST node at the position, or null if none found.

***

### getNodeRange()

```ts
getNodeRange(node: ASTNode): SourceRange;
```

Defined in: [ide-support/position-utilities/position-types.ts:101](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L101)

Gets the source range for an AST node.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | [`ASTNode`](../type-aliases/ASTNode.md) | The AST node to get the range for. |

#### Returns

[`SourceRange`](SourceRange.md)

The source range of the node.

***

### getHoverInfo()

```ts
getHoverInfo(node: ASTNode): null | HoverInfo;
```

Defined in: [ide-support/position-utilities/position-types.ts:108](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L108)

Gets hover information for an AST node.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | [`ASTNode`](../type-aliases/ASTNode.md) | The AST node to get hover information for. |

#### Returns

`null` \| [`HoverInfo`](HoverInfo.md)

Hover information for the node, or null if not available.

***

### getCompletionContext()

```ts
getCompletionContext(ast: ASTNode[], position: Position): CompletionContext;
```

Defined in: [ide-support/position-utilities/position-types.ts:116](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L116)

Gets the completion context at a specific position.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] | An array of AST nodes representing the parsed OpenSCAD document. |
| `position` | [`Position`](Position.md) | The position (line and column) in the source code. |

#### Returns

[`CompletionContext`](CompletionContext.md)

The completion context at the position.

***

### isPositionInRange()

```ts
isPositionInRange(position: Position, range: SourceRange): boolean;
```

Defined in: [ide-support/position-utilities/position-types.ts:124](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L124)

Checks if a position is within a source range.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `position` | [`Position`](Position.md) | The position to check. |
| `range` | [`SourceRange`](SourceRange.md) | The range to check against. |

#### Returns

`boolean`

True if the position is within the range.

***

### findNodesContaining()

```ts
findNodesContaining(ast: ASTNode[], position: Position): ASTNode[];
```

Defined in: [ide-support/position-utilities/position-types.ts:132](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L132)

Finds all nodes that contain a specific position.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ast` | [`ASTNode`](../type-aliases/ASTNode.md)[] | An array of AST nodes representing the parsed OpenSCAD document. |
| `position` | [`Position`](Position.md) | The position to search for. |

#### Returns

[`ASTNode`](../type-aliases/ASTNode.md)[]

An array of nodes that contain the position, ordered from outermost to innermost.
