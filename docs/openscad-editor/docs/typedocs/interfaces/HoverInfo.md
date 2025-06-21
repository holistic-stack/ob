[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: HoverInfo

Defined in: [ide-support/position-utilities/position-types.ts:28](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L28)

Represents hover information for a symbol or node.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="symbol"></a> `symbol?` | [`SymbolInfo`](SymbolInfo.md) | The symbol information if available. | [ide-support/position-utilities/position-types.ts:30](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L30) |
| <a id="node"></a> `node` | [`ASTNode`](../type-aliases/ASTNode.md) | The AST node at the position. | [ide-support/position-utilities/position-types.ts:32](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L32) |
| <a id="range"></a> `range` | [`SourceRange`](SourceRange.md) | The range that the hover information covers. | [ide-support/position-utilities/position-types.ts:34](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L34) |
| <a id="description"></a> `description` | `string` | Human-readable description of the element. | [ide-support/position-utilities/position-types.ts:36](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L36) |
| <a id="documentation"></a> `documentation?` | `string` | Optional documentation string. | [ide-support/position-utilities/position-types.ts:38](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L38) |
| <a id="kind"></a> `kind` | \| `"function"` \| `"expression"` \| `"variable"` \| `"module"` \| `"statement"` \| `"parameter"` \| `"unknown"` | The type of the element (module, function, variable, etc.). | [ide-support/position-utilities/position-types.ts:40](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L40) |
| <a id="context"></a> `context?` | \{ `scope?`: `string`; `parameters?`: \{ `name`: `string`; `type?`: `string`; `description?`: `string`; `defaultValue?`: `string`; \}[]; `returnType?`: `string`; \} | Additional contextual information. | [ide-support/position-utilities/position-types.ts:42](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L42) |
| `context.scope?` | `string` | The scope in which this element is defined. | [ide-support/position-utilities/position-types.ts:44](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L44) |
| `context.parameters?` | \{ `name`: `string`; `type?`: `string`; `description?`: `string`; `defaultValue?`: `string`; \}[] | Parameter information for functions/modules. | [ide-support/position-utilities/position-types.ts:46](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L46) |
| `context.returnType?` | `string` | Return type for functions. | [ide-support/position-utilities/position-types.ts:53](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L53) |
