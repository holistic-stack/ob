[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: CompletionContext

Defined in: [ide-support/position-utilities/position-types.ts:60](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L60)

Represents the context for code completion at a specific position.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | \| `"expression"` \| `"function_call"` \| `"assignment"` \| `"statement"` \| `"parameter"` \| `"module_call"` \| `"unknown"` | The type of completion context. | [ide-support/position-utilities/position-types.ts:62](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L62) |
| <a id="availablesymbols"></a> `availableSymbols` | [`SymbolInfo`](SymbolInfo.md)[] | Available symbols in the current scope. | [ide-support/position-utilities/position-types.ts:64](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L64) |
| <a id="expectedtype"></a> `expectedType?` | `string` | Expected type for the completion (if known). | [ide-support/position-utilities/position-types.ts:66](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L66) |
| <a id="parameterindex"></a> `parameterIndex?` | `number` | Parameter index if inside a function/module call. | [ide-support/position-utilities/position-types.ts:68](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L68) |
| <a id="node"></a> `node?` | [`ASTNode`](../type-aliases/ASTNode.md) | The AST node at the completion position. | [ide-support/position-utilities/position-types.ts:70](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L70) |
| <a id="parentnode"></a> `parentNode?` | [`ASTNode`](../type-aliases/ASTNode.md) | The parent node context. | [ide-support/position-utilities/position-types.ts:72](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L72) |
| <a id="instring"></a> `inString?` | `boolean` | Whether we're inside a string literal. | [ide-support/position-utilities/position-types.ts:74](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L74) |
| <a id="incomment"></a> `inComment?` | `boolean` | Whether we're inside a comment. | [ide-support/position-utilities/position-types.ts:76](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L76) |
| <a id="lineprefix"></a> `linePrefix?` | `string` | The current line content up to the cursor. | [ide-support/position-utilities/position-types.ts:78](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L78) |
| <a id="wordatcursor"></a> `wordAtCursor?` | `string` | The word being typed (if any). | [ide-support/position-utilities/position-types.ts:80](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L80) |
