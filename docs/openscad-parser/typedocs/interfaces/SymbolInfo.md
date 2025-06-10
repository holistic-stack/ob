[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: SymbolInfo

Defined in: [ide-support/symbol-provider/symbol-types.ts:16](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L16)

Represents information about a symbol in the OpenSCAD code.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `string` | The name of the symbol (e.g., variable name, function name, module name). | [ide-support/symbol-provider/symbol-types.ts:18](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L18) |
| <a id="kind"></a> `kind` | `"function"` \| `"variable"` \| `"module"` \| `"parameter"` \| `"constant"` | The kind of the symbol. | [ide-support/symbol-provider/symbol-types.ts:20](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L20) |
| <a id="loc"></a> `loc` | [`SourceLocation`](SourceLocation.md) | The general location of the entire symbol definition (e.g., the whole function or module block). | [ide-support/symbol-provider/symbol-types.ts:22](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L22) |
| <a id="nameloc"></a> `nameLoc?` | [`SourceLocation`](SourceLocation.md) | Optional: The specific location of the symbol's name identifier. | [ide-support/symbol-provider/symbol-types.ts:24](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L24) |
| <a id="scope"></a> `scope?` | `string` | The scope in which the symbol is defined (e.g., module name for parameters or local variables). | [ide-support/symbol-provider/symbol-types.ts:26](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L26) |
| <a id="parameters"></a> `parameters?` | [`Parameter`](Parameter.md)[] | For functions or modules, the list of parameters they accept. | [ide-support/symbol-provider/symbol-types.ts:28](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L28) |
| <a id="value"></a> `value?` | `any` | For constants or variables with evaluated expressions, their value. | [ide-support/symbol-provider/symbol-types.ts:30](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L30) |
| <a id="documentation"></a> `documentation?` | `string` | Optional documentation string for the symbol. | [ide-support/symbol-provider/symbol-types.ts:32](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/symbol-provider/symbol-types.ts#L32) |
