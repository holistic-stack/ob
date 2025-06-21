[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: extractParameterValue()

```ts
function extractParameterValue(node: Node): ParameterValue;
```

Defined in: [openscad-parser/ast/extractors/value-extractor.ts:370](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/extractors/value-extractor.ts#L370)

Extracts values from Tree-sitter CST nodes and converts them to typed ParameterValue objects.

This is the core value extraction function that handles the conversion of Tree-sitter
syntax nodes into typed values suitable for AST generation. It supports all OpenSCAD
primitive types and handles various expression hierarchies through recursive extraction.

Supported value types:
- Numbers: integers and floating-point values
- Strings: quoted string literals with proper unescaping
- Booleans: true/false literals and identifiers
- Vectors: array literals like [1, 2, 3]
- Variables: identifier references
- Expressions: nested expression hierarchies

The function handles Tree-sitter's expression hierarchy by recursively unwrapping
expression nodes until it reaches concrete values. It also provides fallback
mechanisms for complex expressions that may require evaluation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to extract value from |

## Returns

[`ParameterValue`](../type-aliases/ParameterValue.md)

The extracted value as a ParameterValue, or undefined if extraction fails

## Examples

```typescript
import { extractValue } from './value-extractor';

// Extract number
const num = extractValue(numberNode); // Returns: 42

// Extract string
const str = extractValue(stringNode); // Returns: "hello world"

// Extract boolean
const bool = extractValue(booleanNode); // Returns: true
```

```typescript
// Extract vector
const vector = extractValue(arrayLiteralNode); // Returns: [1, 2, 3]

// Extract variable reference
const variable = extractValue(identifierNode);
// Returns: { type: 'expression', expressionType: 'variable', name: 'myVar' }
```

```typescript
// Tree-sitter creates nested expression nodes like:
// expression -> conditional_expression -> logical_or_expression -> ... -> number

const value = extractValue(expressionNode);
// Automatically unwraps the hierarchy to extract the final value
```

## Since

0.1.0
