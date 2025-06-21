[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: SourceRange

Defined in: [ide-support/position-utilities/position-types.ts:16](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L16)

Represents a range in the source code with start and end positions.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="start"></a> `start` | [`Position`](Position.md) | The starting position of the range. | [ide-support/position-utilities/position-types.ts:18](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L18) |
| <a id="end"></a> `end` | [`Position`](Position.md) | The ending position of the range (exclusive). | [ide-support/position-utilities/position-types.ts:20](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L20) |
| <a id="text"></a> `text?` | `string` | Optional text content of the range. | [ide-support/position-utilities/position-types.ts:22](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/ide-support/position-utilities/position-types.ts#L22) |
