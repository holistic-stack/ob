[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Class: NodeLocation

Defined in: [node-location.ts:57](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L57)

Represents a location range within source code, providing both line/column
and character offset information for precise positioning.

This class is used throughout the parser to track the exact location of AST nodes
in the original source code, enabling features like:
- Precise error reporting with line and column numbers
- Syntax highlighting in editors
- Go-to-definition functionality
- Incremental parsing optimizations

The location information includes both human-readable line/column positions
(1-based for lines, 0-based for columns) and zero-based character offsets
for efficient string operations.

## Examples

```typescript
const location = new NodeLocation(
  { row: 1, column: 0 },    // Start at line 1, column 0
  { row: 1, column: 4 },    // End at line 1, column 4
  0,                        // Character offset 0
  4                         // Character offset 4
);

// Represents the token "cube" at the beginning of line 1
console.log(`Token spans ${location.endIndex - location.startIndex} characters`);
```

```typescript
import { NodeLocation } from '@openscad/parser';

function createLocationFromNode(node: TreeSitter.SyntaxNode): NodeLocation {
  return new NodeLocation(
    { row: node.startPosition.row, column: node.startPosition.column },
    { row: node.endPosition.row, column: node.endPosition.column },
    node.startIndex,
    node.endIndex
  );
}
```

## Since

0.1.0

## Constructors

### Constructor

```ts
new NodeLocation(
   startPosition: {
  row: number;
  column: number;
}, 
   endPosition: {
  row: number;
  column: number;
}, 
   startIndex: number, 
   endIndex: number): NodeLocation;
```

Defined in: [node-location.ts:86](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L86)

Creates a new NodeLocation instance representing a range in source code.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `startPosition` | \{ `row`: `number`; `column`: `number`; \} | Starting position with row (1-based) and column (0-based) |
| `startPosition.row` | `number` | - |
| `startPosition.column` | `number` | - |
| `endPosition` | \{ `row`: `number`; `column`: `number`; \} | Ending position with row (1-based) and column (0-based) |
| `endPosition.row` | `number` | - |
| `endPosition.column` | `number` | - |
| `startIndex` | `number` | Zero-based character offset from start of source |
| `endIndex` | `number` | Zero-based character offset from start of source (exclusive) |

#### Returns

`NodeLocation`

#### Examples

```typescript
const location = new NodeLocation(
  { row: 1, column: 5 },
  { row: 1, column: 10 },
  5,
  10
);
```

```typescript
const multiLineLocation = new NodeLocation(
  { row: 1, column: 0 },
  { row: 3, column: 1 },
  0,
  25
);
```

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="startposition"></a> `startPosition` | `readonly` | \{ `row`: `number`; `column`: `number`; \} | Starting position with 1-based row and 0-based column | [node-location.ts:88](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L88) |
| `startPosition.row` | `public` | `number` | - | [node-location.ts:88](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L88) |
| `startPosition.column` | `public` | `number` | - | [node-location.ts:88](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L88) |
| <a id="endposition"></a> `endPosition` | `readonly` | \{ `row`: `number`; `column`: `number`; \} | Ending position with 1-based row and 0-based column | [node-location.ts:90](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L90) |
| `endPosition.row` | `public` | `number` | - | [node-location.ts:90](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L90) |
| `endPosition.column` | `public` | `number` | - | [node-location.ts:90](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L90) |
| <a id="startindex"></a> `startIndex` | `readonly` | `number` | Zero-based character offset from start of source (inclusive) | [node-location.ts:92](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L92) |
| <a id="endindex"></a> `endIndex` | `readonly` | `number` | Zero-based character offset from start of source (exclusive) | [node-location.ts:94](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L94) |

## Accessors

### length

#### Get Signature

```ts
get length(): number;
```

Defined in: [node-location.ts:114](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L114)

Gets the length of the text span represented by this location.

##### Example

```typescript
const location = new NodeLocation(
  { row: 1, column: 0 },
  { row: 1, column: 4 },
  0,
  4
);

console.log(location.length); // 4
```

##### Returns

`number`

The number of characters between start and end indices

## Methods

### isPoint()

```ts
isPoint(): boolean;
```

Defined in: [node-location.ts:135](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L135)

Checks if this location represents a single point (zero-length range).

#### Returns

`boolean`

True if start and end positions are identical

#### Example

```typescript
const point = new NodeLocation(
  { row: 1, column: 5 },
  { row: 1, column: 5 },
  5,
  5
);

console.log(point.isPoint()); // true
```

***

### isMultiLine()

```ts
isMultiLine(): boolean;
```

Defined in: [node-location.ts:164](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L164)

Checks if this location spans multiple lines.

#### Returns

`boolean`

True if the location spans more than one line

#### Example

```typescript
const singleLine = new NodeLocation(
  { row: 1, column: 0 },
  { row: 1, column: 10 },
  0,
  10
);

const multiLine = new NodeLocation(
  { row: 1, column: 0 },
  { row: 3, column: 5 },
  0,
  25
);

console.log(singleLine.isMultiLine()); // false
console.log(multiLine.isMultiLine());  // true
```

***

### contains()

```ts
contains(other: NodeLocation): boolean;
```

Defined in: [node-location.ts:194](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L194)

Checks if this location contains another location.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | `NodeLocation` | The location to check for containment |

#### Returns

`boolean`

True if this location completely contains the other location

#### Example

```typescript
const outer = new NodeLocation(
  { row: 1, column: 0 },
  { row: 1, column: 20 },
  0,
  20
);

const inner = new NodeLocation(
  { row: 1, column: 5 },
  { row: 1, column: 10 },
  5,
  10
);

console.log(outer.contains(inner)); // true
console.log(inner.contains(outer)); // false
```

***

### overlaps()

```ts
overlaps(other: NodeLocation): boolean;
```

Defined in: [node-location.ts:226](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L226)

Checks if this location overlaps with another location.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `other` | `NodeLocation` | The location to check for overlap |

#### Returns

`boolean`

True if the locations have any overlapping characters

#### Example

```typescript
const loc1 = new NodeLocation(
  { row: 1, column: 0 },
  { row: 1, column: 10 },
  0,
  10
);

const loc2 = new NodeLocation(
  { row: 1, column: 5 },
  { row: 1, column: 15 },
  5,
  15
);

console.log(loc1.overlaps(loc2)); // true
```

***

### toString()

```ts
toString(): string;
```

Defined in: [node-location.ts:251](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/node-location.ts#L251)

Creates a string representation of this location for debugging.

#### Returns

`string`

A human-readable string describing the location

#### Example

```typescript
const location = new NodeLocation(
  { row: 1, column: 5 },
  { row: 1, column: 10 },
  5,
  10
);

console.log(location.toString());
// "1:5-1:10 (5-10)"
```
