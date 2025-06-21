# AST Types

This document provides comprehensive documentation for all Abstract Syntax Tree (AST) node types in the OpenSCAD Parser library.

## Overview

The OpenSCAD Parser generates strongly-typed AST nodes that represent different OpenSCAD language constructs. All AST nodes extend the base `ASTNode` interface and provide specific properties for their respective operations.

## Base Types

### BaseNode

Fundamental base interface for all AST nodes in the OpenSCAD parser. All specific AST node types (e.g., `CubeNode`, `TranslateNode`) extend `BaseNode`.

```typescript
interface BaseNode {
  type: string;
  location?: SourceLocation;
}
```

**Properties:**
- `type`: String identifier for the node type (e.g., 'cube', 'translate').
- `location` (optional): An object detailing the node's position in the source code. See `SourceLocation`.

### SourceLocation

Represents a source code location range with start and end positions, and optionally the original text snippet.

```typescript
interface SourceLocation {
  start: Position;
  end: Position;
  text?: string; // The original source code text for this node
}
```

**Properties:**
- `start`: The starting `Position` of the node.
- `end`: The ending `Position` of the node (exclusive).
- `text` (optional): The original source code text that this location represents.

### Position

Represents a specific point in the source code, using line, column, and byte offset.

```typescript
interface Position {
  line: number;   // 0-based line number
  column: number; // 0-based column number
  offset: number; // 0-based byte offset from the start of the file
}
```

**Properties:**
- `line`: 0-based line number in the source file.
- `column`: 0-based column number on the line.
- `offset`: 0-based byte offset from the beginning of the source file.

### ASTNode (Union Type)

For convenience, the library also exports a comprehensive union type named `ASTNode`. This type represents any possible node that can appear in the Abstract Syntax Tree.

```typescript
// Conceptual representation (the actual union is very large)
type ASTNode = CubeNode | SphereNode | TranslateNode | BinaryExpressionNode | ... | ErrorNode;
```

When working with nodes from the parser, you will typically receive objects whose types are specific (e.g., `CubeNode`) but can be assigned to the `ASTNode` union type. Type guards are provided to narrow down `ASTNode` to a specific type (see [Type Guards](#type-guards) section).

### ErrorNode

Represents a parsing error encountered during AST construction. This node is used when a visitor cannot successfully convert a CST node into a valid AST node due to structural issues, missing parts, or unparsable sub-expressions. `ErrorNode` extends `BaseNode` and its `type` property is always `'error'`.

```typescript
interface ErrorNode extends BaseNode {
  type: 'error';
  errorCode: string;
  message: string;
  originalNodeType?: string;
  cstNodeText?: string;
  cause?: ErrorNode;
}
```

**Properties:**
- `errorCode`: A string code identifying the type of error (e.g., `'MISSING_CHILD_NODE'`, `'UNPARSABLE_EXPRESSION'`).
- `message`: A human-readable message describing the error.
- `originalNodeType` (optional): The type of the Concrete Syntax Tree (CST) node that failed to parse (e.g., `'range_expression'`).
- `cstNodeText` (optional): The text content of the problematic CST node.
- `cause` (optional): An underlying `ErrorNode` that may have caused this error, allowing for nested error details.
- `location` (inherited from `BaseNode`): Should point to the problematic section in the source code.

**Note:** The `ASTNode` union type includes `ErrorNode`, so any part of the tree that might fail to parse could potentially be an `ErrorNode`.

## Utility Types for Parameters and Values

These types are commonly used in the properties of other AST nodes, especially for representing arguments and parameters.

### ParameterValue

Represents the various types of values that can be assigned to parameters in module/function definitions (as default values) or passed as arguments during calls.

```typescript
// As defined in ast-types.ts
type ParameterValue =
  | number
  | boolean
  | string
  | Vector2D  // Typically [number, number]
  | Vector3D  // Typically [number, number, number]
  | ExpressionNode // Covers variables, literals, operations, etc.
  | ErrorNode      // If the parameter value could not be parsed
  | null
  | undefined;
```

**Details:**
- Primitive JavaScript types: `number`, `boolean`, `string`.
- Vector types: `Vector2D` and `Vector3D` (see below for their definitions as array-of-number types).
- `ExpressionNode`: Represents any valid OpenSCAD expression. This is a broad category that includes:
  - `LiteralNode`: For explicit literal values (e.g., `5`, `'hello'`, `true`).
  - `VariableNode`: For references to variables (e.g., `my_var`).
  - `BinaryExpressionNode`: For operations like `5 * 2`.
  - `FunctionCallNode`: For results of function calls like `cos(90)`.
  - And other expression types.
- `ErrorNode`: If the parser encountered an issue resolving the parameter's value.
- `null` / `undefined`: Can represent unassigned or explicitly null values in some contexts, though less common in typical OpenSCAD parameter passing.

This comprehensive type allows parameters to be highly dynamic. For example:
- `module_name(param = 10);` (primitive `number`)
- `module_name(param = [1,2]);` (`Vector2D`)
- `module_name(param = my_variable);` (`ExpressionNode` of `VariableNode` subtype)
- `module_name(param = another_var * 2 + func_call());` (complex `ExpressionNode`)

Refer to specific `ExpressionNode` subtypes for more details on how expressions are structured.

### Vector3D

A type alias representing a 3-dimensional vector, typically used for coordinates or sizes.

```typescript
type Vector3D = [number, number, number];
```

**Example:** `[10, 20, 30]` could represent a point or a size along X, Y, and Z axes.

### Parameter

Represents a single argument passed to a module or function call, or a parameter in a definition. It consists of an optional name and a value.

```typescript
interface Parameter {
  name?: string;          // The name of the parameter (e.g., 'size' in size=10). Undefined for positional arguments.
  value: ParameterValue;  // The value of the parameter.
}
```

**Properties:**
- `name` (optional): A string representing the parameter's name. This is used for named arguments (e.g., `cube(size=10)`). For positional arguments (e.g., `cube(10)`), `name` will be `undefined`.
- `value`: The actual value of the parameter, which can be any of the types defined in `ParameterValue`.

**Usage Context:**
- In `ModuleInstantiationNode.args`: Represents arguments passed when calling a module.
- In `FunctionCallNode.args`: Represents arguments passed when calling a function.
- In `ModuleDefinitionNode.parameters` and `FunctionDefinitionNode.parameters`: Here, `Parameter` is effectively `ModuleParameter` which has a mandatory `name` and an optional `defaultValue` of type `ParameterValue`. The `Parameter` interface shown here is more general for call arguments.

### Vector2D

A type alias representing a 2-dimensional vector, typically used for coordinates or sizes in 2D contexts.

```typescript
type Vector2D = [number, number];
```

**Example:** `[10, 20]` could represent a point or a size along X and Y axes.

## Primitive Nodes

### CubeNode

Represents a `cube()` primitive. Extends `BaseNode`.

```typescript
interface CubeNode extends BaseNode {
  type: 'cube';
  size: ParameterValue;
  center?: boolean; // Optional, defaults to false if not specified
}
```

**Properties:**
- `type`: Always `'cube'`.
- `size`: The dimensions of the cube. This can be a single numeric value (for a cube with equal sides), a 3-element vector `[x, y, z]`, a variable, or an expression that evaluates to a number or vector. See `ParameterValue`.
- `center` (optional): A boolean indicating whether the cube is centered at the origin. If omitted, OpenSCAD defaults this to `false`.

**Example:**
```typescript
// For: cube(10);
// The 'size' property (a ParameterValue) would be a LiteralNode:
{
  type: 'cube',
  size: { type: 'literal', value: 10 }, // ParameterValue as LiteralNode
  center: false // Assuming OpenSCAD default if not specified
}

// For: cube([10, 20, 30], center=true);
// The 'size' property would be a LiteralNode containing a vector:
{
  type: 'cube',
  size: { type: 'literal', value: [10, 20, 30] }, // ParameterValue as LiteralNode with vector
  center: true
}

// For: cube(my_var, center=false);
// The 'size' property would be a VariableNode:
{
  type: 'cube',
  size: { type: 'variable', name: 'my_var' }, // ParameterValue as VariableNode
  center: false
}
```

### SphereNode

Represents a `sphere()` primitive. Extends `BaseNode`.

In OpenSCAD, a sphere can be defined by its radius (`r`) or its diameter (`d`). Typically, only one of `r` or `d` is provided. The special variables `$fa`, `$fs`, and `$fn` control the smoothness of the curve.

```typescript
interface SphereNode extends BaseNode {
  type: 'sphere';
  r?: number;     // Radius of the sphere
  d?: number;     // Diameter of the sphere
  $fa?: number;   // Minimum angle for a fragment (degrees)
  $fs?: number;   // Minimum size of a fragment (mm)
  $fn?: number;   // Fixed number of fragments
}
```

**Properties:**
- `type`: Always `'sphere'`.
- `r` (optional): A `number` specifying the radius of the sphere. If `d` is also specified, `r` usually takes precedence or behavior might be OpenSCAD version-dependent (typically, providing both is not standard).
- `d` (optional): A `number` specifying the diameter of the sphere.
- `$fa` (optional): A `number` for the minimum angle (in degrees) for a fragment. Overrides `$fn` if set to a non-zero value and `$fs` is zero.
- `$fs` (optional): A `number` for the minimum size (in mm) of a fragment. Overrides `$fn` and `$fa` if set to a non-zero value.
- `$fn` (optional): A `number` for the fixed number of fragments to use for the sphere. If `0` (or undefined and other `$fX` are not set), OpenSCAD uses a default resolution. Higher values produce smoother spheres but increase complexity.

**Note on Resolution Parameters (`$fa`, `$fs`, `$fn`):**
These properties on the `SphereNode` directly reflect the values if they are provided as arguments to the `sphere()` call (e.g., `sphere(r=10, $fn=100);`). If not provided as arguments, their values are typically inherited from the global OpenSCAD environment or defaults, and might not be explicitly present on the node unless the parser sets defaults.

**Example:**
```typescript
// For: sphere(r=10, $fn=50);
// AST Node:
{
  type: 'sphere',
  r: 10,
  $fn: 50,
  location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 19, offset: 19 } } // Example location
}

// For: sphere(d=20);
// AST Node:
{
  type: 'sphere',
  d: 20,
  location: { start: { line: 1, column: 0, offset: 20 }, end: { line: 1, column: 12, offset: 32 } } // Example location
}

// For: sphere(5); // Positional argument implies radius
// AST Node:
{
  type: 'sphere',
  r: 5,
  location: { start: { line: 2, column: 0, offset: 33 }, end: { line: 2, column: 9, offset: 42 } } // Example location
}
```

### CylinderNode

Represents a `cylinder()` primitive. Extends `BaseNode`.

OpenSCAD's `cylinder` can be defined with various combinations of height, radii (r, r1, r2), or diameters (d, d1, d2).

```typescript
interface CylinderNode extends BaseNode {
  type: 'cylinder';
  h: number;          // Height of the cylinder
  r?: number;         // Radius (used if r1 and r2 are equal, or if only one radius is specified)
  r1?: number;        // Radius of the bottom end (for cones/tapered cylinders)
  r2?: number;        // Radius of the top end (for cones/tapered cylinders)
  d?: number;         // Diameter (used if d1 and d2 are equal, or if only one diameter is specified)
  d1?: number;        // Diameter of the bottom end
  d2?: number;        // Diameter of the top end
  center?: boolean;   // Optional, true if centered on the Z-axis. Defaults to false.
  $fa?: number;       // Optional: minimum angle for a fragment (degrees)
  $fs?: number;       // Optional: minimum size of a fragment (mm)
  $fn?: number;       // Optional: fixed number of fragments
}
```

**Properties:**
- `type`: Always `'cylinder'`.
- `h`: A `number` specifying the height of the cylinder.
- `r` (optional): A `number` specifying the radius for both ends of the cylinder. If `r1` and `r2` are not provided, `r` defines a cylinder with equal radii. If `d` is also provided, `r` usually takes precedence for radius definition.
- `r1` (optional): A `number` for the radius of the bottom end. Used with `r2` for tapered cylinders (cones).
- `r2` (optional): A `number` for the radius of the top end. Used with `r1` for tapered cylinders (cones).
- `d` (optional): A `number` specifying the diameter for both ends. If `d1` and `d2` are not provided, `d` defines a cylinder with equal diameters. If `r` is also provided, `r` parameters generally take precedence.
- `d1` (optional): A `number` for the diameter of the bottom end.
- `d2` (optional): A `number` for the diameter of the top end.
- `center` (optional): A `boolean` indicating whether the cylinder is centered along the Z-axis. Defaults to `false` if not specified.
- `$fa` (optional): A `number` for the minimum angle (in degrees) for a fragment. See `SphereNode` for behavior.
- `$fs` (optional): A `number` for the minimum size (in mm) of a fragment. See `SphereNode` for behavior.
- `$fn` (optional): A `number` for the fixed number of fragments. See `SphereNode` for behavior.

**Note:** Typically, you provide `h` and one of (`r`), (`r1`, `r2`), (`d`), or (`d1`, `d2`).

**Example:**
```typescript
// For: cylinder(h=10, r=5, center=true);
// AST Node:
{
  type: 'cylinder',
  h: 10,
  r: 5,
  center: true,
  location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 30, offset: 30 } } // Example location
}

// For: cylinder(h=20, r1=8, r2=12, $fn=50);
// AST Node:
{
  type: 'cylinder',
  h: 20,
  r1: 8,
  r2: 12,
  $fn: 50,
  // center would be undefined (meaning false by OpenSCAD default)
  location: { start: { line: 1, column: 0, offset: 31 }, end: { line: 1, column: 37, offset: 68 } } // Example location
}

// For: cylinder(15, d1=10, d2=5); // Positional height
// AST Node:
{
  type: 'cylinder',
  h: 15,
  d1: 10,
  d2: 5,
  location: { start: { line: 2, column: 0, offset: 69 }, end: { line: 2, column: 26, offset: 95 } } // Example location
}
```

**Note on Variable Arguments:** If arguments like `r2` or `$fn` are provided as variables (e.g., `cylinder(h=10, r2=my_variable)`) or complex expressions, their resolved numeric values would appear on the `CylinderNode` if the parser can determine them. If not directly resolvable to a `number` for the `CylinderNode`'s specific properties, those properties might be `undefined` on this specific node. The containing `ModuleInstantiationNode` would capture the original `ExpressionNode` (e.g., `VariableNode`) as the argument.

Represents a `polyhedron()` primitive. Extends `BaseNode`.

```typescript
interface PolyhedronNode extends BaseNode {
  type: 'polyhedron';
  points: Vector3D[]; // Array of 3D points
  faces: number[][];  // Array of face definitions (indices into points array)
  convexity?: number; // Optional convexity parameter
}
```

**Properties:**
- `type`: Always `'polyhedron'`.
- `points`: An array of `Vector3D` arrays, where each `Vector3D` is a point `[x, y, z]` defining a vertex of the polyhedron.
- `faces`: An array of arrays, where each inner array lists the 0-indexed indices of the points in the `points` array that form a face.
- `convexity` (optional): A number used by OpenSCAD's preview renderer to help with displaying concave shapes correctly. It specifies the maximum number of faces a ray intersecting the object can pass through.

## 2D Primitive Nodes

### SquareNode

Represents a `square()` 2D primitive. Extends `BaseNode`.

```typescript
interface SquareNode extends BaseNode {
  type: 'square';
  size: number | Vector2D; // Single number for equal sides, or [width, height]
  center?: boolean;        // Optional, true if centered. Defaults to false.
}
```

**Properties:**
- `type`: Always `'square'`.
- `size`: The dimensions of the square. This can be a single numeric value (for a square with equal sides) or a `Vector2D` `[width, height]`.
- `center` (optional): A boolean indicating whether the square is centered at the origin. If omitted, OpenSCAD defaults this to `false`.

**Example:**
```typescript
// For: square(10);
{
  type: 'square',
  size: 10,
  // center would be undefined (false by default)
}

// For: square([10, 20], center=true);
{
  type: 'square',
  size: [10, 20], // This is a Vector2D
  center: true
}
```

### CircleNode

Represents a `circle()` 2D primitive. Extends `BaseNode`.

A circle can be defined by its radius (`r`) or diameter (`d`).

```typescript
interface CircleNode extends BaseNode {
  type: 'circle';
  r?: number;       // Optional: radius of the circle
  d?: number;       // Optional: diameter of the circle
  $fa?: number;     // Optional: minimum angle for a fragment (degrees)
  $fs?: number;     // Optional: minimum size of a fragment (mm)
  $fn?: number;     // Optional: fixed number of fragments
}
```

**Properties:**
- `type`: Always `'circle'`.
- `r` (optional): A `number` specifying the radius of the circle.
- `d` (optional): A `number` specifying the diameter of the circle.
- `$fa` (optional): A `number` for the minimum angle (in degrees) for a fragment. See `SphereNode` for behavior.
- `$fs` (optional): A `number` for the minimum size (in mm) of a fragment. See `SphereNode` for behavior.
- `$fn` (optional): A `number` for the fixed number of fragments. See `SphereNode` for behavior.

**Example:**
```typescript
// For: circle(10); // Positional argument implies radius
// AST Node:
{
  type: 'circle',
  r: 10,
  location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 10, offset: 10 } } // Example location
}

// For: circle(d=20, $fn=50);
// AST Node:
{
  type: 'circle',
  d: 20,
  $fn: 50,
  location: { start: { line: 1, column: 0, offset: 11 }, end: { line: 1, column: 21, offset: 32 } } // Example location
}
```

**Note on Variable Arguments:** Similar to `CylinderNode`, if arguments are variables or complex expressions, their resolved numeric values appear on `CircleNode` if determinable by the parser. Otherwise, properties might be `undefined`, and the `ModuleInstantiationNode` holds the original expression.

### PolygonNode

Represents a `polygon()` 2D primitive. Extends `BaseNode`.

```typescript
interface PolygonNode extends BaseNode {
  type: 'polygon';
  points: Vector2D[];    // Array of 2D points defining the vertices
  paths?: number[][];   // Optional: Defines multiple sub-polygons or holes
  convexity?: number;   // Optional: Hint for rendering complex polygons
}
```

**Properties:**
- `type`: Always `'polygon'`.
- `points`: An array of `Vector2D` (where each `Vector2D` is a `[number, number]` array representing a point `[x, y]`) defining the vertices of the polygon.
- `paths` (optional): An array of arrays, where each inner array lists the 0-indexed indices of the points in the `points` array that form a distinct path (loop). If omitted, all points are assumed to form a single path in their given order. Used for polygons with holes or multiple disjoint parts.
- `convexity` (optional): A number used by OpenSCAD's preview renderer to help with displaying concave shapes correctly. It specifies the maximum number of times a ray intersecting the 2D projection of the polygon can cross an edge.

**Example:**
```typescript
// For: polygon(points=[[0,0],[10,0],[5,10]]);
{
  type: 'polygon',
  points: [[0,0],[10,0],[5,10]] // Each inner array is a Vector2D
}

// For: polygon(points=[[0,0],[100,0],[100,100],[0,100]], paths=[[0,1,2,3]]);
// (Explicitly defining a single path)
{
  type: 'polygon',
  points: [[0,0],[100,0],[100,100],[0,100]],
  paths: [[0,1,2,3]]
}
```

### TextNode

Represents a `text()` 2D/3D primitive. Extends `BaseNode`.

This node generates text geometry.

```typescript
interface TextNode extends BaseNode {
  type: 'text';
  text: string;                   // The text string to render
  size?: number;                  // Optional: Font size in millimeters
  font?: string;                  // Optional: Font name
  halign?: 'left' | 'center' | 'right'; // Optional: Horizontal alignment
  valign?: 'top' | 'center' | 'baseline' | 'bottom'; // Optional: Vertical alignment
  spacing?: number;               // Optional: Factor to adjust character spacing
  direction?: 'ltr' | 'rtl' | 'ttb' | 'btt'; // Optional: Text direction (left-to-right, right-to-left, top-to-bottom, bottom-to-top)
  language?: string;              // Optional: Language code (e.g., "en")
  script?: string;                // Optional: Script code (e.g., "Latn")
  $fn?: number;                   // Optional: Fixed number of fragments for curves in text (similar to circle/sphere)
}
```

**Properties:**
- `type`: Always `'text'`.
- `text`: A `string` containing the characters to be rendered.
- `size` (optional): A `number` specifying the font size. Typically in millimeters, but interpretation can depend on context.
- `font` (optional): A `string` specifying the font name (e.g., "Liberation Sans"). Font availability depends on the system OpenSCAD is running on.
- `halign` (optional): A `string` literal: `'left'`, `'center'`, or `'right'`. Defines the horizontal alignment of the text relative to its origin.
- `valign` (optional): A `string` literal: `'top'`, `'center'`, `'baseline'`, or `'bottom'`. Defines the vertical alignment of the text relative to its origin.
- `spacing` (optional): A `number` that acts as a factor to adjust the default spacing between characters. `1.0` is default spacing.
- `direction` (optional): A `string` literal: `'ltr'` (left-to-right), `'rtl'` (right-to-left), `'ttb'` (top-to-bottom), or `'btt'` (bottom-to-top). Defines the direction of text flow.
- `language` (optional): A `string` representing the language code (e.g., "en", "ja") which can affect font selection or text rendering features.
- `script` (optional): A `string` representing the script code (e.g., "Latn", "Cyrl") which can also influence font selection and rendering.
- `$fn` (optional): A `number` controlling the smoothness of any curves in the character glyphs, similar to its use in `circle()` or `sphere()`.

**Example:**
```typescript
// For: text("Hello", size=10, font="Arial", halign="center");
// AST Node:
{
  type: 'text',
  text: "Hello",
  size: 10,
  font: "Arial",
  halign: "center",
  location: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 48, offset: 48 } } // Example location
}
```

**Note on Variable Arguments:** If arguments like `size` or `font` are provided as variables or complex expressions, their resolved values (e.g., `string` for `text`, `number` for `size`) would appear on the `TextNode` if the parser can determine them. If not directly resolvable to the expected type for the `TextNode`'s specific properties, those properties might be `undefined` or default. The containing `ModuleInstantiationNode` would capture the original `ExpressionNode`.

## Transform Nodes

### TranslateNode

Represents a `translate()` transformation. Extends `BaseNode`.

This node moves its child elements by a given vector.

```typescript
interface TranslateNode extends BaseNode {
  type: 'translate';
  v: Vector2D | Vector3D; // The translation vector (2D or 3D)
  children: ASTNode[];     // Child nodes to be translated
}
```

**Properties:**
- `type`: Always `'translate'`.
- `v`: The translation vector. This can be a `Vector2D` `[x, y]` or a `Vector3D` `[x, y, z]`. See `Vector2D` and `Vector3D`.
- `children`: An array of `ASTNode` elements that are affected by this translation.

**Example:**
```typescript
// For: translate([10,20,30]) cube(5);
{
  type: 'translate',
  v: [10,20,30], // Vector3D
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 5 } /* ... other cube props ... */ 
    }
  ]
}

// For: translate([5, -5]) square(10);
{
  type: 'translate',
  v: [5, -5], // Vector2D
  children: [
    { 
      type: 'square', 
      size: 10 /* ... other square props ... */ 
    }
  ]
}
```

### RotateNode

Represents a `rotate()` transformation. Extends `BaseNode`.

This node rotates its child elements. Rotation can be specified as Euler angles, or as an angle around a specific axis.

```typescript
interface RotateNode extends BaseNode {
  type: 'rotate';
  // Represents the 'a' parameter in OpenSCAD's rotate().
  // Can be a single angle (number) for Z-axis rotation, or if 'v' is also given.
  // Can be a Vector3D for Euler angles [X, Y, Z].
  a: number | Vector3D;
  // Optional 'v' parameter in OpenSCAD's rotate(a, v).
  // Specifies the axis of rotation if 'a' is a single angle.
  v?: Vector3D;
  children: ASTNode[]; // Child nodes to be rotated
}
```

**Properties:**
- `type`: Always `'rotate'`.
- `a`: The primary rotation parameter. This can be a `number` (angle for Z-axis rotation, or if `v` is specified to define an axis) or a `Vector3D` (Euler angles `[X, Y, Z]` in degrees).
- `v` (optional): A `Vector3D` specifying the axis of rotation. Used when `a` is a single angle.
- `children`: An array of `ASTNode` elements that are affected by this rotation.

**Example:**
```typescript
// For: rotate([0,0,90]) cube(5); // Euler angles for rotation
// AST Node:
{
  type: 'rotate',
  a: [0,0,90], // Vector3D representing Euler angles
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 5 } /* ... other cube props ... */ 
    }
  ]
}

// For: rotate(a=45, v=[0,1,0]) cylinder(h=10, r=2);
// AST Node:
{
  type: 'rotate',
  a: 45,          // number representing the angle
  v: [0,1,0],     // Vector3D representing the axis of rotation
  children: [
    { 
      type: 'cylinder', 
      h: 10, // CylinderNode.h is number
      r: 2,  // CylinderNode.r is number (assuming r is used for r1 or r)
      location: { /*...*/ }
    }
  ]
}

// For: rotate(my_angle_vector_var) sphere(d=10); 
// Assuming my_angle_vector_var resolves to [30,0,0]
// AST Node:
{
  type: 'rotate',
  a: [30,0,0], // Example of 'a' as a resolved Vector3D
  // v would be undefined
  children: [
    { 
      type: 'sphere', 
      d: 10, // SphereNode.d is number
      location: { /*...*/ }
    }
  ]
}
```

**Note on Variable Arguments:** If the arguments `a` or `v` in the OpenSCAD source are variables (e.g., `rotate(my_angle_var)`) or complex expressions, their resolved `number` or `Vector3D` values would appear on the `RotateNode` if the parser can determine them. If not directly resolvable, the properties might be `undefined` (if optional) or an error might be associated with the node. The containing `ModuleInstantiationNode` would capture the original `ExpressionNode` for `a` and `v`.

### ScaleNode

Represents a `scale()` transformation. Extends `BaseNode`.

This node scales its child elements by a given vector.

```typescript
interface ScaleNode extends BaseNode {
  type: 'scale';
  v: Vector3D;           // The scaling vector (always 3D)
  children: ASTNode[];   // Child nodes to be scaled
}
```

**Properties:**
- `type`: Always `'scale'`.
- `v`: A `Vector3D` `[xScale, yScale, zScale]` representing the scaling factors. OpenSCAD's `scale()` module can accept a scalar or a 2D vector, which are then promoted to a 3D vector (e.g., `scale(s)` becomes `scale([s,s,s])`; `scale([x,y])` becomes `scale([x,y,1])`). This `ScaleNode` stores the resolved `Vector3D`.
- `children`: An array of `ASTNode` elements that are affected by this scaling.

**Example:**
```typescript
// For: scale([2,1,0.5]) cube(5);
// AST Node:
{
  type: 'scale',
  v: [2,1,0.5], // Vector3D
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 5 } /* ... other cube props ... */ 
    }
  ]
}

// For: scale(my_scale_vector_var) sphere(d=10);
// Assuming my_scale_vector_var resolves to [1, 2, 0.5]
// AST Node:
{
  type: 'scale',
  v: [1, 2, 0.5], // Example of 'v' as a resolved Vector3D
  children: [
    { 
      type: 'sphere', 
      d: 10, // SphereNode.d is number
      location: { /*...*/ }
    }
  ]
}
```

**Note on Variable Arguments:** If the `v` argument in the OpenSCAD source is a variable (e.g., `scale(my_vector_var)`) or a complex expression, its resolved `Vector3D` value would appear on the `ScaleNode` if the parser can determine it (including promoting scalars or 2D vectors). If not directly resolvable, the `v` property might be `undefined` or an error might be associated. The containing `ModuleInstantiationNode` would capture the original `ExpressionNode`.

### ResizeNode

Represents a `resize()` transformation. Extends `BaseNode`.

This node resizes its child elements to fit within the given `newsize` dimensions. The `auto` parameter controls whether each axis is scaled automatically or fixed.

```typescript
interface ResizeNode extends BaseNode {
  type: 'resize';
  newsize: Vector3D;                 // Target dimensions [x, y, z]
  auto: [boolean, boolean, boolean]; // Auto-scale flags for [x, y, z] axes
  children: ASTNode[];              // Child nodes to be resized
}
```

**Properties:**
- `type`: Always `'resize'`.
- `newsize`: A `Vector3D` `[x, y, z]` specifying the target dimensions. Values of `0` for a dimension mean that dimension is not resized (unless its corresponding `auto` flag is true).
- `auto`: An array of three booleans `[autoX, autoY, autoZ]`. If `auto[i]` is `true`, the i-th axis is scaled automatically to maintain the object's aspect ratio based on other constrained axes. If `false`, the i-th axis is scaled to match `newsize[i]` (unless `newsize[i]` is 0).
- `children`: An array of `ASTNode` elements that are affected by this resizing.

**Example:**
```typescript
// For: resize(newsize=[20,30,0], auto=[false,false,true]) cube(10);
// Resizes to new_x=20, new_y=30. Z-axis is scaled proportionally as newsize[2]=0 and auto[2]=true.
// AST Node:
{
  type: 'resize',
  newsize: [20,30,0], // Vector3D
  auto: [false, false, true],
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 10 } /* ... other cube props ... */ 
    }
  ]
}

// For: resize(newsize=target_dims_var, auto=true) some_object();
// Assuming target_dims_var resolves to [50,50,50] and auto=true is parsed to [true,true,true]
// AST Node:
{
  type: 'resize',
  newsize: [50,50,50], // Example of 'newsize' as a resolved Vector3D
  auto: [true, true, true],
  children: [
    { 
      type: 'module_call', 
      name: 'some_object', 
      params: [], 
      location: { /*...*/ }
      // ... other ModuleCallNode props ...
    }
  ]
}
```

**Note on Variable Arguments:** If the `newsize` or `auto` arguments in the OpenSCAD source are variables or complex expressions, their resolved values (`Vector3D` for `newsize`, `[boolean,boolean,boolean]` for `auto`) would appear on the `ResizeNode` if the parser can determine them. If not directly resolvable, the properties might be `undefined` (if optional, though these are mandatory) or an error might be associated. The containing `ModuleInstantiationNode` would capture the original `ExpressionNode`s.

### MirrorNode

Represents a `mirror()` transformation. Extends `BaseNode`.

This node mirrors its child elements across a plane defined by a normal vector.

```typescript
interface MirrorNode extends BaseNode {
  type: 'mirror';
  v: Vector3D;           // The normal vector of the mirror plane
  children: ASTNode[];   // Child nodes to be mirrored
}
```

**Properties:**
- `type`: Always `'mirror'`.
- `v`: A `Vector3D` `[x, y, z]` representing the normal vector of the plane of reflection. The plane passes through the origin.
- `children`: An array of `ASTNode` elements that are affected by this mirroring operation.

**Example:**
```typescript
// For: mirror([1,0,0]) cube(5);
// Mirrors the cube across the YZ plane (normal vector is along X-axis)
// AST Node:
{
  type: 'mirror',
  v: [1,0,0], // Vector3D
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 5 } /* ... other cube props ... */ 
    }
  ]
}

// For: mirror(mirror_plane_normal_var) some_object();
// Assuming mirror_plane_normal_var resolves to [0,1,0]
// AST Node:
{
  type: 'mirror',
  v: [0,1,0], // Example of 'v' as a resolved Vector3D
  children: [
    { 
      type: 'module_call', 
      name: 'some_object', 
      params: [], 
      location: { /*...*/ }
      // ... other ModuleCallNode props ...
    }
  ]
}
```

**Note on Variable Arguments:** If the `v` argument in the OpenSCAD source is a variable (e.g., `mirror(my_normal_var)`) or a complex expression, its resolved `Vector3D` value would appear on the `MirrorNode` if the parser can determine it. If not directly resolvable, the `v` property might be `undefined` or an error might be associated. The containing `ModuleInstantiationNode` would capture the original `ExpressionNode`.

## CSG Nodes

### UnionNode

Represents a `union()` boolean operation. Extends `BaseNode`.

This node combines all its child geometries into a single object.

```typescript
interface UnionNode extends BaseNode {
  type: 'union';
  children: ASTNode[]; // An array of child nodes to be combined
}
```

**Properties:**
- `type`: Always `'union'`.
- `children`: An array of `ASTNode` elements whose geometries are to be combined.

**Example:**
```typescript
// For: union() { cube(10); sphere(5); }
{
  type: 'union',
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 10 } /* ... other cube props ... */ 
    },
    { 
      type: 'sphere', 
      r: 5, // SphereNode.r is number
      location: { /*...*/ } 
    }
  ]
}
```

### DifferenceNode

Represents a `difference()` boolean operation. Extends `BaseNode`.

This node subtracts the geometry of the second and subsequent child elements from the first child element.

```typescript
interface DifferenceNode extends BaseNode {
  type: 'difference';
  children: ASTNode[]; // An array of child nodes. First is positive, others are subtracted.
}
```

**Properties:**
- `type`: Always `'difference'`.
- `children`: An array of `ASTNode` elements. The geometry of the first child is the base from which the geometries of all subsequent children are subtracted.

**Example:**
```typescript
// For: difference() { cube(10); translate([5,5,5]) sphere(5); }
{
  type: 'difference',
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 10 } /* ... other cube props ... */ 
    },
    {
      type: 'translate',
      v: [5,5,5], // TranslateNode.v is Vector3D
      children: [
        { 
          type: 'sphere', 
          r: 5, // SphereNode.r is number
          location: { /*...*/ } 
        }
      ],
      location: { /*...*/ }
    }
  ]
}
```

### IntersectionNode

Represents an `intersection()` boolean operation. Extends `BaseNode`.

This node computes the geometric intersection of all its child elements, resulting in the volume that is common to all children.

```typescript
interface IntersectionNode extends BaseNode {
  type: 'intersection';
  children: ASTNode[]; // An array of child nodes whose intersection is computed.
}
```

**Properties:**
- `type`: Always `'intersection'`.
- `children`: An array of `ASTNode` elements. The resulting geometry is the volume common to all child geometries.

**Example:**
```typescript
// For: intersection() { cube(10); translate([5,5,5]) sphere(8); }
// The result is the part of the cube that overlaps with the translated sphere.
{
  type: 'intersection',
  children: [
    { 
      type: 'cube', 
      size: { type: 'literal', value: 10 } /* ... other cube props ... */ 
    },
    {
      type: 'translate',
      v: [5,5,5], // TranslateNode.v is Vector3D
      children: [
        { 
          type: 'sphere', 
          r: 8, // SphereNode.r is number
          location: { /*...*/ } 
        }
      ],
      location: { /*...*/ }
    }
  ]
}
```

## Expression Nodes

### IdentifierNode

Represents a variable reference. Extends `ExpressionNode`.

```typescript
interface IdentifierNode extends BaseNode {
  type: 'expression';            // Inherited from ExpressionNode
  expressionType: 'identifier';    // Discriminates variable identifiers
  name: string;                  // The name of the variable
}
```

**Properties:**
- `type`: Always `'expression'`.
- `expressionType`: Always `'identifier'`.
- `name`: The identifier string.

**TypeScript AST Example:**
```typescript
// Corresponds to: size;
{
  type: 'expression',
  expressionType: 'identifier',
  name: 'size',
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 4, line: 1, column: 5 } }
}
```

**Original OpenSCAD Example:**
```openscad
size;
```

### VariableNode

Represents a reference to a variable. Extends `ExpressionNode`.

This node is used whenever a variable is accessed in an expression or as a parameter value.

```typescript
interface VariableNode extends ExpressionNode {
  expressionType: 'variable'; // Distinguishes it as a variable expression
  name: string;              // The name of the variable
}
```

**Properties:**
- `expressionType`: Always `'variable'`.
- `name`: A string representing the identifier of the variable.

**Context:**
`VariableNode` is a fundamental part of expressions and is included in the `ParameterValue` utility type, allowing variables to be used as arguments to modules and functions.

**Example:**
```typescript
// For an OpenSCAD statement like: size = 10; cube(size);
// The 'size' in cube(size) would be parsed as a VariableNode within the parameters of the CubeNode's ModuleInstantiationNode:
// AST representation of the VariableNode itself:
{
  type: 'expression',        // Inherited from ExpressionNode
  expressionType: 'variable',
  name: 'size',
  location: { start: { offset: 45, line: 3, column: 2 }, end: { offset: 49, line: 3, column: 6 } } // Example location
}
```

### LiteralNode

Represents literal scalar values such as numbers, strings, or booleans. Extends `ExpressionNode`.

Note: Vector literals (e.g., `[1,2,3]`) and array literals are represented by `VectorExpressionNode` (which has `expressionType: 'vector_expression'`, `'vector'`, `'vector2d'`, or `'vector3d'`) or a general `ExpressionNode` with `expressionType: 'array'`, typically containing an `elements` or `items` array of `ExpressionNode`s.

```typescript
interface LiteralNode extends ExpressionNode {
  expressionType: 'literal'; // Distinguishes it as a literal expression
  value: number | string | boolean; // The actual literal value
}
```

**Properties:**
- `expressionType`: Always `'literal'`.
- `value`: The literal value, which can be a `number` (e.g., `10`, `3.14`), a `string` (e.g., `"hello"`), or a `boolean` (e.g., `true`, `false`).

**Context:**
`LiteralNode` is a fundamental part of expressions and is included in the `ParameterValue` utility type, allowing literal values to be used as arguments to modules and functions.

**Example:**
```typescript
// For an OpenSCAD statement like: size = 10;
// The '10' would be parsed as a LiteralNode:
// AST representation of the LiteralNode itself:
{
  type: 'expression',        // Inherited from ExpressionNode
  expressionType: 'literal',
  value: 10,
  location: { start: { offset: 10, line: 1, column: 11 }, end: { offset: 11, line: 1, column: 12 } } // Example location
}

// For: message = "world";
// AST representation of the LiteralNode itself:
{
  type: 'expression',        // Inherited from ExpressionNode
  expressionType: 'literal',
  value: "world",
  location: { start: { offset: 17, line: 1, column: 18 }, end: { offset: 24, line: 1, column: 25 } } // Example location
}

// For: is_active = true;
// AST representation of the LiteralNode itself:
{
  type: 'expression',        // Inherited from ExpressionNode
  expressionType: 'literal',
  value: true,
  location: { start: { offset: 30, line: 1, column: 31 }, end: { offset: 35, line: 1, column: 36 } } // Example location
}
```

### VectorExpressionNode

Represents a vector expression, such as `[1, 2, 3]` or `[a, b*2, c+d]`. Extends `ExpressionNode`.

This node is used for creating vectors (arrays) of values, where each element can be any valid expression.

```typescript
interface VectorExpressionNode extends ExpressionNode {
  expressionType: 'vector_expression' | 'vector' | 'vector2d' | 'vector3d'; // Type of vector/array
  elements?: ExpressionNode[];         // Array of expressions for vector elements
  items?: ExpressionNode[];            // Alternative for elements, often used for general arrays
}
```

**Properties:**
- `expressionType`: A string indicating the type, one of `'vector_expression'`, `'vector'`, `'vector2d'`, or `'vector3d'`. This helps distinguish general arrays from those specifically parsed as 2D/3D vectors.
- `elements` (optional): An array of `ExpressionNode` objects representing the vector's components. 
- `items` (optional): An alternative to `elements`. Typically, a node will have either `elements` or `items` populated if it represents a non-empty vector/array.

**Context:**
`VectorExpressionNode` is a type of `ExpressionNode` and can be part of a `ParameterValue`. It's crucial for defining coordinates, sizes, and other vector-based parameters.

**Example:**
```typescript
// For an OpenSCAD vector literal: [10, 20, 30]
// This would be parsed as a VectorExpressionNode containing LiteralNodes:
// AST representation:
{
  type: 'expression',                  // Inherited from ExpressionNode
  expressionType: 'vector_expression', // Or 'vector', 'vector3d' depending on context
  elements: [
    { 
      type: 'expression', 
      expressionType: 'literal', 
      value: 10, 
      location: { start: { offset: 11, line: 1, column: 12 }, end: { offset: 13, line: 1, column: 14 } } 
    },
    { 
      type: 'expression', 
      expressionType: 'literal', 
      value: 20, 
      location: { start: { offset: 15, line: 1, column: 16 }, end: { offset: 17, line: 1, column: 18 } } 
    },
    { 
      type: 'expression', 
      expressionType: 'literal', 
      value: 30, 
      location: { start: { offset: 19, line: 1, column: 20 }, end: { offset: 21, line: 1, column: 22 } } 
    }
  ],
  location: { start: { offset: 10, line: 1, column: 11 }, end: { offset: 22, line: 1, column: 23 } } // Example location
}

// For a vector with mixed expressions: [a, b + 1, 5 * c]
// (Assuming a, b, c are variables)
{
  type: 'expression',                  // Inherited from ExpressionNode
  expressionType: 'vector_expression', // Or 'vector', 'vector3d' depending on context
  elements: [
    { 
      type: 'expression',
      expressionType: 'variable', 
      name: 'a', 
      location: { start: { offset: 24, line: 1, column: 25 }, end: { offset: 25, line: 1, column: 26 } } 
    },
    { 
      type: 'expression',
      expressionType: 'binary', 
      operator: '+',
      left: { 
        type: 'expression',
        expressionType: 'variable', 
        name: 'b', 
        location: { start: { offset: 27, line: 1, column: 28 }, end: { offset: 28, line: 1, column: 29 } } 
      },
      right: { 
        type: 'expression',
        expressionType: 'literal', 
        value: 1, 
        location: { start: { offset: 31, line: 1, column: 32 }, end: { offset: 32, line: 1, column: 33 } } 
      },
      location: { start: { offset: 27, line: 1, column: 28 }, end: { offset: 33, line: 1, column: 34 } } 
    },
    { 
      type: 'expression',
      expressionType: 'binary', 
      operator: '*',
      left: { 
        type: 'expression',
        expressionType: 'literal', 
        value: 5, 
        location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 36, line: 1, column: 37 } } 
      },
      right: { 
        type: 'expression',
        expressionType: 'variable', 
        name: 'c', 
        location: { start: { offset: 38, line: 1, column: 39 }, end: { offset: 39, line: 1, column: 40 } } 
      },
      location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 40, line: 1, column: 41 } } 
    }
  ],
  location: { start: { offset: 23, line: 1, column: 24 }, end: { offset: 41, line: 1, column: 42 } } // Example location
}
```

### Binary Operations (`ExpressionNode` with `expressionType: 'binary'`)

A binary operation, such as addition (`a + b`), comparison (`x < y`), or logical AND (`c && d`), is represented by an `ExpressionNode` where the `expressionType` property is set to `'binary'`. 

It utilizes the following properties from the `ExpressionNode` interface:

```typescript
// Relevant ExpressionNode properties for binary operations:
interface ExpressionNode extends BaseNode {
  type: 'expression';
  expressionType: 'binary';
  operator: BinaryOperator; // The binary operator (e.g., '+', '*', '==')
  left: ExpressionNode;     // The left-hand side operand
  right: ExpressionNode;    // The right-hand side operand
  // ... other ExpressionNode properties
}

// The defined type for binary operators
export type BinaryOperator =
  | '+' | '-' | '*' | '/' | '%'
  | '==' | '!=' | '<' | '<=' | '>' | '>='
  | '&&' | '||';
```

**Properties for Binary Operations:**
- `type`: Always `'expression'`.
- `expressionType`: Always `'binary'` for binary operations.
- `operator`: A `BinaryOperator` string representing the operation. Possible values are:
  - Arithmetic: `'+'`, `'-'`, `'*'`, `'/'`, `'%'`
  - Comparison: `'=='`, `'!='`, `'<'`, `'<='`, `'>'`, `'>='`
  - Logical: `'&&'`, `'||'`
- `left`: An `ExpressionNode` representing the left operand.
- `right`: An `ExpressionNode` representing the right operand.

**Context:**
Binary expressions are fundamental `ExpressionNode` types and can be part of a `ParameterValue`.

**Example:**
```typescript
// For an OpenSCAD expression: a * (b + 2)
// This would be parsed into nested ExpressionNodes with expressionType: 'binary'.
// The (b + 2) part:
{
  type: 'expression',
  expressionType: 'binary',
  operator: '+',
  left: {
    type: 'expression',
    expressionType: 'variable',
    name: 'b',
    location: { start: { offset: 24, line: 2, column: 10 }, end: { offset: 25, line: 2, column: 11 } }
  },
  right: {
    type: 'expression',
    expressionType: 'literal',
    value: 2,
    location: { start: { offset: 28, line: 2, column: 14 }, end: { offset: 29, line: 2, column: 15 } }
  },
  location: { start: { offset: 22, line: 2, column: 8 }, end: { offset: 31, line: 2, column: 17 } } // For (b + 2)
}

// The full a * (b + 2) expression:
{
  type: 'expression',
  expressionType: 'binary',
  operator: '*',
  left: {
    type: 'expression',
    expressionType: 'variable',
    name: 'a',
    location: { start: { offset: 18, line: 2, column: 1 }, end: { offset: 19, line: 2, column: 2 } }
  },
  right: { // This is the (b + 2) node from above
    type: 'expression',
    expressionType: 'binary',
    operator: '+',
    left: {
      type: 'expression',
      expressionType: 'variable',
      name: 'b',
      location: { start: { offset: 24, line: 2, column: 10 }, end: { offset: 25, line: 2, column: 11 } }
    },
    right: {
      type: 'expression',
      expressionType: 'literal',
      value: 2,
      location: { start: { offset: 28, line: 2, column: 14 }, end: { offset: 29, line: 2, column: 15 } }
    },
    location: { start: { offset: 22, line: 2, column: 8 }, end: { offset: 31, line: 2, column: 17 } } // For (b + 2)
  },
  location: { start: { offset: 18, line: 2, column: 1 }, end: { offset: 31, line: 2, column: 17 } } // For a * (b + 2)
}
```

### RangeExpressionNode

Represents a range expression, such as `[0:2:10]` or `[i_start:i_end]`. Extends `ExpressionNode`.

```typescript
interface RangeExpressionNode extends ExpressionNode {
  expressionType: 'range_expression'; // Distinguishes it as a range expression
  start: ExpressionNode;              // The starting value of the range
  end: ExpressionNode;                // The ending value of the range
  step?: ExpressionNode;             // Optional step value for the range
}
```

**Properties:**
- `expressionType`: Always `'range_expression'`.
- `start`: An `ExpressionNode` representing the start of the range (inclusive).
- `end`: An `ExpressionNode` representing the end of the range (inclusive).
- `step`: An optional `ExpressionNode` representing the increment (or decrement) between values in the range. If omitted, the step defaults to `1` (or `-1` if `start` > `end`).

**Context:**
`RangeExpressionNode` is a type of `ExpressionNode` and can be part of a `ParameterValue` if a range itself is assignable or passable (though typically its evaluation result, a vector, is used).

**Example:**
```typescript
// For an OpenSCAD range: [0:2:10]
// This would be parsed as a RangeExpressionNode containing LiteralNodes:
{
  type: 'expression',
  expressionType: 'range_expression',
  start: {
    type: 'expression',
    expressionType: 'literal',
    value: 0,
    location: { start: { offset: 45, line: 3, column: 2 }, end: { offset: 46, line: 3, column: 3 } }
  },
  step: {
    type: 'expression',
    expressionType: 'literal',
    value: 2,
    location: { start: { offset: 47, line: 3, column: 4 }, end: { offset: 48, line: 3, column: 5 } }
  },
  end: {
    type: 'expression',
    expressionType: 'literal',
    value: 10,
    location: { start: { offset: 49, line: 3, column: 6 }, end: { offset: 51, line: 3, column: 8 } }
  },
  location: { start: { offset: 44, line: 3, column: 1 }, end: { offset: 52, line: 3, column: 9 } }
}

// For a range with variables: [i_start : i_end]
// (Assuming i_start, i_end are variables)
{
  type: 'expression',
  expressionType: 'range_expression',
  start: {
    type: 'expression',
    expressionType: 'variable',
    name: 'i_start',
    location: { start: { offset: 80, line: 5, column: 2 }, end: { offset: 87, line: 5, column: 9 } }
  },
  end: {
    type: 'expression',
    expressionType: 'variable',
    name: 'i_end',
    location: { start: { offset: 90, line: 5, column: 12 }, end: { offset: 95, line: 5, column: 17 } }
  },
  // step would be undefined, defaulting to 1 or -1 based on start/end values
  location: { start: { offset: 79, line: 5, column: 1 }, end: { offset: 96, line: 5, column: 18 } }
}
```

**Integration with ExpressionVisitor:**
Range expressions are fully integrated into the main ExpressionVisitor system and work seamlessly in all contexts including:
- For loops: `for (i = [0:5]) { ... }`
- List comprehensions: `[for (i = [0:2:10]) i*2]`
- Variable assignments: `range = [1:0.5:5];`

## Control Structure Nodes

### ForLoopNode

Represents a `for` loop, which iterates over one or more sets of values, assigning them to variables and executing a block of code for each iteration. Extends `BaseNode`.

OpenSCAD `for` loops can iterate over multiple assignments in parallel, e.g., `for (i = [0:2], j = [9,8])`.

```typescript
// Helper interface for loop variable assignments
interface ForLoopVariable {
  variable: string;                   // The name of the loop variable
  range: ExpressionNode | ErrorNode;  // The expression providing values (e.g., VectorExpressionNode, RangeExpressionNode)
  step?: ExpressionNode | ErrorNode; // Optional step for the range, if applicable (e.g., for C-style for loops if supported, or if range implies it)
}

interface ForLoopNode extends BaseNode {
  type: 'for_loop';
  variables: ForLoopVariable[]; // Array of variable assignments for the loop
  body: ASTNode[];              // The block of statements executed in each iteration
}
```

**Properties:**
- `type`: Always `'for_loop'`.
- `variables`: An array of `ForLoopVariable` objects. Each object defines:
  - `variable`: A string representing the name of the loop variable.
  - `range`: An `ExpressionNode` (typically a `VectorExpressionNode` or `RangeExpressionNode`) or an `ErrorNode` if parsing the range failed. This expression evaluates to the sequence of values the variable will take.
  - `step` (optional): An `ExpressionNode` or `ErrorNode` representing the step value. Note: Standard OpenSCAD `for (i = vector)` loops don't use a separate step variable here; ranges like `[start:step:end]` embed it. This field might be for future C-style loop support or other AST uses.
- `body`: An array of `ASTNode` objects representing the statements within the loop's body.

**Example:**
```typescript
// For an OpenSCAD loop: for (i = [0:1:2], j = ["a", "b", "c"]) cube([i,0,0]);
{
  type: 'for_loop',
  variables: [
    {
      variable: 'i',
      range: {
        type: 'expression',
        expressionType: 'range_expression',
        start: { type: 'expression', expressionType: 'literal', value: 0, location: { start: {offset: 10, line: 1, column: 11}, end: {offset: 11, line: 1, column: 12} } },
        step: { type: 'expression', expressionType: 'literal', value: 1, location: { start: {offset: 12, line: 1, column: 13}, end: {offset: 13, line: 1, column: 14} } },
        end: { type: 'expression', expressionType: 'literal', value: 2, location: { start: {offset: 14, line: 1, column: 15}, end: {offset: 15, line: 1, column: 16} } },
        location: { start: {offset: 9, line: 1, column: 10}, end: {offset: 16, line: 1, column: 17} }
      }
      // Note: ForLoopVariable itself doesn't have a location, it's part of the ForLoopNode structure
    },
    {
      variable: 'j',
      range: {
        type: 'expression',
        expressionType: 'vector_expression',
        location: { start: {offset: 23, line: 1, column: 24}, end: {offset: 38, line: 1, column: 39} },
        elements: [
          { type: 'expression', expressionType: 'literal', value: 'a', location: { start: {offset: 24, line: 1, column: 25}, end: {offset: 27, line: 1, column: 28} } },
          { type: 'expression', expressionType: 'literal', value: 'b', location: { start: {offset: 29, line: 1, column: 30}, end: {offset: 32, line: 1, column: 33} } },
          { type: 'expression', expressionType: 'literal', value: 'c', location: { start: {offset: 34, line: 1, column: 35}, end: {offset: 37, line: 1, column: 38} } }
        ]
      }
    }
  ],
  body: [
    {
      type: 'module_instantiation',
      name: 'cube',
      parameters: [
        {
          name: null, // Unnamed parameter
          value: {
            type: 'expression',
            expressionType: 'vector_expression',
            location: { start: {offset: 46, line: 1, column: 47}, end: {offset: 52, line: 1, column: 53} },
            elements: [
              { type: 'expression', expressionType: 'variable', name: 'i', location: { start: {offset: 48, line: 1, column: 49}, end: {offset: 49, line: 1, column: 50} } },
              { type: 'expression', expressionType: 'literal', value: 0, location: { start: {offset: 50, line: 1, column: 51}, end: {offset: 51, line: 1, column: 52} } },
              { type: 'expression', expressionType: 'literal', value: 0, location: { start: {offset: 52, line: 1, column: 53}, end: {offset: 53, line: 1, column: 54} } }
            ]
          }
        }
      ],
      location: { start: {offset: 40, line: 1, column: 41}, end: {offset: 54, line: 1, column: 55} }
    }
  ],
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 55, line: 1, column: 56} }
}
```

### IfNode

Represents an `if` conditional statement, which executes one block of code if a condition is true, and optionally another block if it is false. Extends `BaseNode`.

```typescript
interface IfNode extends BaseNode {
  type: 'if';
  condition: ExpressionNode;
  thenBranch: ASTNode[];     // Array of statements for the 'then' block
  elseBranch?: ASTNode[];    // Optional array of statements for the 'else' block
}
```

**Properties:**
- `type`: Always `'if'`.
- `condition`: An `ExpressionNode` that evaluates to a boolean. If true, the `thenBranch` is executed.
- `thenBranch`: An array of `ASTNode` objects representing the statements to execute if the `condition` is true.
- `elseBranch` (optional): An array of `ASTNode` objects representing the statements to execute if the `condition` is false. This can be omitted if there is no `else` part.

**Example:**
```typescript
// For an OpenSCAD statement: if (x > 10) { cube(5); } else { sphere(3); }
{
  type: 'if',
  condition: {
    type: 'expression',
    expressionType: 'binary',
    operator: '>',
    left: { type: 'expression', expressionType: 'variable', name: 'x', location: { start: {offset: 5, line: 1, column: 6}, end: {offset: 6, line: 1, column: 7} } },
    right: { type: 'expression', expressionType: 'literal', value: 10, location: { start: {offset: 9, line: 1, column: 10}, end: {offset: 11, line: 1, column: 12} } },
    location: { start: {offset: 5, line: 1, column: 6}, end: {offset: 11, line: 1, column: 12} }
  },
  thenBranch: [
    {
      type: 'module_instantiation',
      name: 'cube',
      parameters: [{ name: null, value: { type: 'expression', expressionType: 'literal', value: 5, location: { start: {offset: 20, line: 1, column: 21}, end: {offset: 21, line: 1, column: 22} } } }],
      location: { start: {offset: 15, line: 1, column: 16}, end: {offset: 22, line: 1, column: 23} }
    }
  ],
  elseBranch: [
    {
      type: 'module_instantiation',
      name: 'sphere',
      parameters: [{ name: 'r', value: { type: 'expression', expressionType: 'literal', value: 3, location: { start: {offset: 38, line: 1, column: 39}, end: {offset: 39, line: 1, column: 40} } } }],
      location: { start: {offset: 30, line: 1, column: 31}, end: {offset: 40, line: 1, column: 41} }
    }
  ],
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 43, line: 1, column: 44} }
}

// If without an else: if (y < 0) color("red") cube(2);
{
  type: 'if',
  condition: {
    type: 'expression',
    expressionType: 'binary',
    operator: '<',
    left: { type: 'expression', expressionType: 'variable', name: 'y', location: { start: {offset: 54, line: 2, column: 6}, end: {offset: 55, line: 2, column: 7} } },
    right: { type: 'expression', expressionType: 'literal', value: 0, location: { start: {offset: 58, line: 2, column: 10}, end: {offset: 59, line: 2, column: 11} } },
    location: { start: {offset: 53, line: 2, column: 5}, end: {offset: 60, line: 2, column: 12} }
  },
  thenBranch: [
    {
      type: 'module_instantiation',
      name: 'color',
      parameters: [{ name: 'c', value: { type: 'expression', expressionType: 'literal', value: 'red', location: { start: {offset: 68, line: 2, column: 20}, end: {offset: 73, line: 2, column: 25} } } }],
      children: [
        {
          type: 'module_instantiation',
          name: 'cube',
          parameters: [{ name: null, value: { type: 'expression', expressionType: 'literal', value: 2, location: { start: {offset: 80, line: 2, column: 32}, end: {offset: 81, line: 2, column: 33} } } }],
          location: { start: {offset: 75, line: 2, column: 27}, end: {offset: 82, line: 2, column: 34} }
        }
      ],
      location: { start: {offset: 62, line: 2, column: 14}, end: {offset: 83, line: 2, column: 35} }
    }
  ],
  // elseBranch would be undefined or an empty array depending on parser implementation for missing else
  location: { start: {offset: 49, line: 2, column: 1}, end: {offset: 83, line: 2, column: 35} }
}
```

### ModuleDefinitionNode

Represents the definition of a module. Extends `BaseNode`.

Modules are reusable blocks of OpenSCAD code that can accept parameters and encapsulate geometry or transformations.

```typescript
// Helper interface for module parameters
interface ModuleParameter {
  name: string;                   // The name of the parameter
  defaultValue?: ParameterValue;  // Optional default value for the parameter
}

// Helper interface for identifiers (like module name)
interface IdentifierNode extends ExpressionNode {
  expressionType: 'identifier';
  name: string;                   // The actual string name of the identifier
}

interface ModuleDefinitionNode extends BaseNode {
  type: 'module_definition';
  name: IdentifierNode;         // The name of the module
  parameters: ModuleParameter[];  // Array of parameters the module accepts
  body: ASTNode[];              // Array of statements constituting the module's body
}
```

**Properties:**
- `type`: Always `'module_definition'`.
- `name`: An `IdentifierNode` representing the module's name. The actual string name can be accessed via `name.name`.
- `parameters`: An array of `ModuleParameter` objects. Each object defines:
  - `name`: A string for the parameter name.
  - `defaultValue` (optional): A `ParameterValue` (which can be an `ExpressionNode`, `LiteralNode`, or `VariableNode`) providing the default value if the parameter is not specified during instantiation.
- `body`: An array of `ASTNode` objects representing the statements within the module's body.

**Example:**
```typescript
// For an OpenSCAD module definition: module my_cube(size = 10, center = false) { cube([size,size,size], center=center); }
{
  type: 'module_definition',
  name: {
    type: 'expression',
    expressionType: 'identifier',
    name: 'my_cube',
    location: { start: { offset: 7, line: 1, column: 8 }, end: { offset: 14, line: 1, column: 15 } }
  },
  parameters: [
    {
      name: 'size',
      defaultValue: { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 22, line: 1, column: 23 }, end: { offset: 24, line: 1, column: 25 } } }
    },
    {
      name: 'center',
      defaultValue: { type: 'expression', expressionType: 'literal', value: false, location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 40, line: 1, column: 41 } } }
    }
  ],
  body: [
    {
      type: 'module_instantiation',
      name: 'cube',
      parameters: [
        {
          name: null, // Unnamed parameter for [size,size,size]
          value: {
            type: 'expression',
            expressionType: 'vector_expression',
            elements: [
              { type: 'expression', expressionType: 'variable', name: 'size', location: { start: { offset: 49, line: 1, column: 50 }, end: { offset: 53, line: 1, column: 54 } } },
              { type: 'expression', expressionType: 'variable', name: 'size', location: { start: { offset: 54, line: 1, column: 55 }, end: { offset: 58, line: 1, column: 59 } } },
              { type: 'expression', expressionType: 'variable', name: 'size', location: { start: { offset: 59, line: 1, column: 60 }, end: { offset: 63, line: 1, column: 64 } } }
            ],
            location: { start: { offset: 48, line: 1, column: 49 }, end: { offset: 64, line: 1, column: 65 } }
          }
        },
        {
          name: 'center',
          value: { type: 'expression', expressionType: 'variable', name: 'center', location: { start: { offset: 73, line: 1, column: 74 }, end: { offset: 79, line: 1, column: 80 } } }
        }
      ],
      location: { start: { offset: 43, line: 1, column: 44 }, end: { offset: 80, line: 1, column: 81 } }
    }
  ],
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 83, line: 1, column: 84 } }
}
```

### FunctionDefinitionNode

Represents a `function` definition in OpenSCAD. Extends `BaseNode`.

```typescript
interface FunctionDefinitionNode extends BaseNode {
  type: 'function_definition';       // Identifier for function definitions
  name: IdentifierNode;             // The function's name
  parameters: ModuleParameter[];    // Array of function parameters
  expression: ExpressionNode;       // The return expression of the function
}
```

**Properties:**
- `type`: Always `'function_definition'`.
- `name`: An `IdentifierNode` representing the function's name.
- `parameters`: An array of `ModuleParameter` objects for each parameter (name and default value).
- `expression`: An `ExpressionNode` representing the function's result expression.

**TypeScript AST Example:**
```typescript
// Corresponds to: function add(a = 1, b = 2) = a + b;
{
  type: 'function_definition',
  name: { type: 'expression', expressionType: 'identifier', name: 'add', location: { start: { offset: 9, line: 1, column: 10 }, end: { offset: 12, line: 1, column: 13 } } },
  parameters: [
    { name: 'a', defaultValue: { type: 'expression', expressionType: 'literal', value: 1, location: { start: { offset: 16, line: 1, column: 17 }, end: { offset: 17, line: 1, column: 18 } } } },
    { name: 'b', defaultValue: { type: 'expression', expressionType: 'literal', value: 2, location: { start: { offset: 21, line: 1, column: 22 }, end: { offset: 22, line: 1, column: 23 } } } }
  ],
  expression: {
    type: 'expression',
    expressionType: 'binary',
    operator: '+',
    left: { type: 'expression', expressionType: 'variable', name: 'a', location: { start: { offset: 27, line: 1, column: 28 }, end: { offset: 28, line: 1, column: 29 } } },
    right: { type: 'expression', expressionType: 'variable', name: 'b', location: { start: { offset: 31, line: 1, column: 32 }, end: { offset: 32, line: 1, column: 33 } } },
    location: { start: { offset: 27, line: 1, column: 28 }, end: { offset: 33, line: 1, column: 34 } }
  },
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 36, line: 1, column: 37 } }
}
```

**Original OpenSCAD Example:**
```openscad
function add(a = 1, b = 2) = a + b;
```

### FunctionCallNode

Represents a function call expression. Extends `BaseNode` (as an `ExpressionNode`).

```typescript
interface FunctionCallNode extends BaseNode {
  type: 'expression';             // Inherited from ExpressionNode
  expressionType: 'function_call';// Discriminates function calls
  functionName: string;           // The name of the function being called
  args: Parameter[];              // Arguments passed to the function
}
```

**Properties:**
- `type`: Always `'expression'` for expression-based nodes.
- `expressionType`: Always `'function_call'`.
- `functionName`: The identifier string for the function call.
- `args`: An array of `Parameter` objects (with optional `name` and `value`) for each argument.

**TypeScript AST Example:**
```typescript
// Corresponds to: sum(1, 2);
{
  type: 'expression',
  expressionType: 'function_call',
  functionName: 'sum',
  args: [
    { name: undefined, value: { type: 'expression', expressionType: 'literal', value: 1, location: { start: {offset: 4, line: 1, column: 5}, end: {offset: 5, line: 1, column: 6} } } },
    { name: undefined, value: { type: 'expression', expressionType: 'literal', value: 2, location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 8, line: 1, column: 9} } } }
  ],
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 9, line: 1, column: 10} }
}
```

**Original OpenSCAD Example:**
```openscad
sum(1, 2);
```

### ModuleInstantiationNode

Represents an instantiation (call) of a module. Extends `BaseNode`.

This node captures the module's name, the arguments passed to it, and any child nodes that form the module's content (e.g., for `union()` or custom modules that act as wrappers).

```typescript
// Helper interface for arguments passed to a module
interface Parameter {
  name?: string;          // Optional name for named arguments (e.g., size=10)
  value: ParameterValue;  // The value of the argument
}

interface ModuleInstantiationNode extends BaseNode {
  type: 'module_instantiation';
  name: string;             // The name of the module being instantiated
  args: Parameter[];        // Array of arguments passed to the module
  children: ASTNode[];      // Child statements/nodes (e.g., for CSG ops or container modules)
}
```

**Properties:**
- `type`: Always `'module_instantiation'`.
- `name`: A string representing the name of the module being called.
- `args`: An array of `Parameter` objects. Each object defines:
  - `name` (optional): A string for the parameter name if it's a named argument. For positional arguments, this is `undefined`.
  - `value`: A `ParameterValue` representing the argument's value. The `ParameterValue` type is defined as: `number | boolean | string | Vector2D | Vector3D | ExpressionNode | ErrorNode | null | undefined`. Typically, for structured values like literals, variables, or complex expressions, this will be an `ExpressionNode`.
- `children`: An array of `ASTNode` objects. These are the children of the module instantiation, common in CSG operations like `union() { ... }` or when a module is designed to process its children.

**Example:**
```typescript
// For an OpenSCAD call: my_module(param1 = 10, 20) { child_cube(); }
// (Assuming my_module is defined, and child_cube is a valid statement)
{
  type: 'module_instantiation',
  name: 'my_module',
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 50, line: 1, column: 51 } },
  args: [
    {
      name: 'param1',
      value: { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 20, line: 1, column: 21 }, end: { offset: 22, line: 1, column: 23 } } }
    },
    {
      // name is undefined for positional argument
      value: { type: 'expression', expressionType: 'literal', value: 20, location: { start: { offset: 25, line: 1, column: 26 }, end: { offset: 27, line: 1, column: 28 } } }
    }
  ],
  children: [
    {
      type: 'module_instantiation', // Assuming child_cube() is another module call
      name: 'child_cube',
      args: [],
      children: [],
      location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 48, line: 1, column: 49 } }
    }
  ]
}

// Example for a built-in like cube: cube(size=[10,10,10], center=true);
{
  type: 'module_instantiation', // Note: Primitives like cube are also parsed as ModuleInstantiationNode
  name: 'cube',
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 40, line: 1, column: 41 } },
  args: [
    {
      name: 'size',
      value: {
        type: 'expression',
        expressionType: 'vector_expression',
        location: { start: { offset: 10, line: 1, column: 11 }, end: { offset: 30, line: 1, column: 31 } },
        elements: [
          { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 11, line: 1, column: 12 }, end: { offset: 13, line: 1, column: 14 } } },
          { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 15, line: 1, column: 16 }, end: { offset: 17, line: 1, column: 18 } } },
          { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 19, line: 1, column: 20 }, end: { offset: 21, line: 1, column: 22 } } }
        ]
      }
    },
    {
      name: 'center',
      value: { type: 'expression', expressionType: 'literal', value: true, location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 39, line: 1, column: 40 } } }
    }
  ],
  children: [] // cube() does not take children in the `cube() { ... }` sense
}
```

## Statement Nodes

### AssertStatementNode

Represents an `assert()` statement for runtime validation.

```typescript
interface AssertStatementNode extends BaseNode {
  type: 'assert';
  condition: ExpressionNode;
  message?: ExpressionNode;
}
```

**Properties:**
- `type`: Always `'assert'`.
- `condition`: An `ExpressionNode` representing the boolean expression to evaluate.
- `message` (optional): An `ExpressionNode` representing the error message to display if the assertion fails.

**TypeScript AST Examples:**

```typescript
// Corresponds to: assert(x > 0);
{
  type: 'assert',
  condition: {
    type: 'expression',
    expressionType: 'binary',
    operator: '>',
    left: { type: 'expression', expressionType: 'variable', name: 'x', location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 8, line: 1, column: 9} } },
    right: { type: 'expression', expressionType: 'literal', value: 0, location: { start: {offset: 11, line: 1, column: 12}, end: {offset: 12, line: 1, column: 13} } },
    location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 12, line: 1, column: 13} }
  },
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 13, line: 1, column: 14} }
}

// Corresponds to: assert(y < 100, "y value out of range");
{
  type: 'assert',
  condition: {
    type: 'expression',
    expressionType: 'binary',
    operator: '<',
    left: { type: 'expression', expressionType: 'variable', name: 'y', location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 8, line: 1, column: 9} } },
    right: { type: 'expression', expressionType: 'literal', value: 100, location: { start: {offset: 11, line: 1, column: 12}, end: {offset: 14, line: 1, column: 15} } },
    location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 14, line: 1, column: 15} }
  },
  message: {
    type: 'expression',
    expressionType: 'literal',
    value: 'y value out of range',
    location: { start: {offset: 17, line: 1, column: 18}, end: {offset: 39, line: 1, column: 40} }
  },
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 40, line: 1, column: 41} }
}
```

**Original OpenSCAD Examples (for context):**
```openscad
assert(x > 0);
assert(y < 100, "y value out of range");
assert(len(points) >= 3, "Need at least 3 points for polygon");
```

### EchoStatementNode

Represents an `echo()` statement for logging and debugging output. Extends `BaseNode`.

```typescript
interface EchoStatementNode extends BaseNode {
  type: 'echo';                      // Identifier for echo statements
  arguments: ExpressionNode[];       // Array of argument expressions
}
```

**Properties:**
- `type`: Always `'echo'`.
- `arguments`: An array of `ExpressionNode` objects representing each argument of the echo statement.

**TypeScript AST Examples:**
```typescript
// Corresponds to: echo();
{
  type: 'echo',
  arguments: [],
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 6, line: 1, column: 7 } }
}

// Corresponds to: echo("Hello", x, 42);
{
  type: 'echo',
  arguments: [
    { type: 'expression', expressionType: 'literal', value: 'Hello', location: { start: { offset: 5, line: 1, column: 6 }, end: { offset: 12, line: 1, column: 13 } } },
    { type: 'expression', expressionType: 'variable', name: 'x',    location: { start: { offset: 14, line: 1, column: 15 }, end: { offset: 15, line: 1, column: 16 } } },
    { type: 'expression', expressionType: 'literal', value:  42,     location: { start: { offset: 18, line: 1, column: 19 }, end: { offset: 20, line: 1, column: 21 } } }
  ],
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 23, line: 1, column: 24 } }
}
```

**Original OpenSCAD Examples (for context):**
```openscad
echo();
echo("Demo", myVar, value * 2);

```

### AssignStatementNode

Represents an `assign()` statement for variable scoping (deprecated in OpenSCAD).

```typescript
interface AssignStatementNode extends BaseNode {
  type: 'assign';
  assignments: AssignmentNode[];
  body: ASTNode;
}

interface AssignmentNode extends BaseNode {
  type: 'assignment';
  variable: IdentifierNode;       // The identifier node for the variable being assigned
  value: ExpressionNode | ParameterValue; // The value assigned to the variable
}
```

**Properties for `AssignStatementNode`:**
- `type`: Always `'assign'`.
- `assignments`: An array of `AssignmentNode` objects, each representing a single variable assignment (e.g., `x = 5`).
- `body`: An `ASTNode` (typically a `BlockStatementNode` or a single statement node) that represents the code block to be executed within the scope of these assignments.

**Properties for `AssignmentNode`:**
- `type`: Always `'assignment'`.
- `variable`: An `IdentifierNode` representing the variable being declared and assigned. This includes the variable's name and its location in the source.
- `value`: An `ExpressionNode` or a `ParameterValue` (e.g., a raw number, boolean, or string literal) representing the value assigned to the variable.

**TypeScript AST Examples:**

```typescript
// Corresponds to: assign(x = 5) cube(x);
{
  type: 'assign',
  assignments: [
    {
      type: 'assignment',
      variable: { type: 'identifier', name: 'x', location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 8, line: 1, column: 9} } },
      value: { type: 'expression', expressionType: 'literal', value: 5, location: { start: {offset: 11, line: 1, column: 12}, end: {offset: 12, line: 1, column: 13} } },
      location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 12, line: 1, column: 13} }
    }
  ],
  body: {
    type: 'module_instantiation',
    name: 'cube',
    parameters: [{ name: null, value: { type: 'expression', expressionType: 'variable', name: 'x', location: { start: {offset: 19, line: 1, column: 20}, end: {offset: 20, line: 1, column: 21} } } }],
    children: [],
    location: { start: {offset: 14, line: 1, column: 15}, end: {offset: 21, line: 1, column: 22} }
  },
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 22, line: 1, column: 23} }
}

// Corresponds to: assign(x = 5, y = 10) cube([x, y, 1]);
{
  type: 'assign',
  assignments: [
    {
      type: 'assignment',
      variable: { type: 'identifier', name: 'x', location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 8, line: 1, column: 9} } },
      value: { type: 'expression', expressionType: 'literal', value: 5, location: { start: {offset: 11, line: 1, column: 12}, end: {offset: 12, line: 1, column: 13} } },
      location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 12, line: 1, column: 13} }
    },
    {
      type: 'assignment',
      variable: { type: 'identifier', name: 'y', location: { start: {offset: 15, line: 1, column: 16}, end: {offset: 16, line: 1, column: 17} } },
      value: { type: 'expression', expressionType: 'literal', value: 10, location: { start: {offset: 19, line: 1, column: 20}, end: {offset: 21, line: 1, column: 22} } },
      location: { start: {offset: 15, line: 1, column: 16}, end: {offset: 21, line: 1, column: 22} }
    }
  ],
  body: {
    type: 'module_instantiation',
    name: 'cube',
    parameters: [
      {
        value: {
          type: 'expression',
          expressionType: 'vector_expression',
          elements: [
            { type: 'expression', expressionType: 'variable', name: 'x', location: { start: {offset: 29, line: 1, column: 30}, end: {offset: 30, line: 1, column: 31} } },
            { type: 'expression', expressionType: 'variable', name: 'y', location: { start: {offset: 32, line: 1, column: 33}, end: {offset: 33, line: 1, column: 34} } },
            { type: 'expression', expressionType: 'literal', value: 1, location: { start: {offset: 35, line: 1, column: 36}, end: {offset: 36, line: 1, column: 37} } }
          ],
          location: { start: {offset: 28, line: 1, column: 29}, end: {offset: 37, line: 1, column: 38} }
        }
      }
    ],
    children: [],
    location: { start: {offset: 23, line: 1, column: 24}, end: {offset: 38, line: 1, column: 39} }
  },
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 39, line: 1, column: 40} }
}
```

**Original OpenSCAD Examples (for context):**
```openscad
assign(x = 5) cube(x);
assign(x = 5, y = 10) cube([x, y, 1]);
assign(r = 10) { sphere(r); translate([r*2, 0, 0]) sphere(r); }
```

**Note:** Assign statements are deprecated in OpenSCAD but still supported for legacy code compatibility.

## Type Guards

The library provides type guards for safe type checking:

```typescript
import { isCubeNode, isSphereNode, isTransformNode } from '@holistic-stack/openscad-parser';

function processNode(node: ASTNode) {
  if (isCubeNode(node)) {
    console.log(`Cube: ${node.size}, centered: ${node.center}`);
  } else if (isSphereNode(node)) {
    console.log(`Sphere with radius: ${node.radius}`);
  } else if (isTransformNode(node)) {
    console.log(`Transform with ${node.children.length} children`);
  }
}
```

## Usage Examples

### Processing AST Nodes

```typescript
function processAST(nodes: ASTNode[]) {
  nodes.forEach(node => {
    switch (node.type) {
      case 'cube':
        const cube = node as CubeNode;
        console.log(`Cube: ${cube.size}, centered: ${cube.center}`);
        break;

      case 'translate':
        const translate = node as TranslateNode;
        console.log(`Translate by [${translate.vector.join(', ')}]`);
        processAST(translate.children); // Process children recursively
        break;

      case 'difference':
        const diff = node as DifferenceNode;
        console.log(`Difference with ${diff.children.length} children`);
        processAST(diff.children);
        break;

      case 'assert':
        const assert = node as AssertStatementNode;
        console.log(`Assert: ${assert.condition}`);
        if (assert.message) {
          console.log(`  Message: ${assert.message}`);
        }
        break;

      case 'assign':
        const assign = node as AssignStatementNode;
        console.log(`Assign: ${assign.assignments.length} assignments`);
        assign.assignments.forEach(assignment => {
          console.log(`  ${assignment.variable} = ${assignment.value}`);
        });
        processAST([assign.body]); // Process body
        break;
    }
  });
}
```

### Type-Safe Node Creation

```typescript
const cubeNode: CubeNode = {
  type: 'cube',
  size: [10, 20, 30],
  center: true
};

const translateNode: TranslateNode = {
  type: 'translate',
  vector: [5, 0, 0],
  children: [cubeNode]
};

```

### EchoStatementNode

Represents an `echo()` statement for logging and debugging output. Extends `BaseNode`.

```typescript
interface EchoStatementNode extends BaseNode {
  type: 'echo';                      // Identifier for echo statements
  arguments: ExpressionNode[];       // Array of argument expressions
}
```

**Properties:**
- `type`: Always `'echo'`.
- `arguments`: An array of `ExpressionNode` objects representing each argument of the echo statement.

**TypeScript AST Examples:**
```typescript
// Corresponds to: echo();
{
  type: 'echo',
  arguments: [],
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 6, line: 1, column: 7 } }
}

// Corresponds to: echo("Hello", x, 42);
{
  type: 'echo',
  arguments: [
    { type: 'expression', expressionType: 'literal', value: 'Hello', location: { start: { offset: 5, line: 1, column: 6 }, end: { offset: 12, line: 1, column: 13 } } },
    { type: 'expression', expressionType: 'variable', name: 'x',    location: { start: { offset: 14, line: 1, column: 15 }, end: { offset: 15, line: 1, column: 16 } } },
    { type: 'expression', expressionType: 'literal', value:  42,     location: { start: { offset: 18, line: 1, column: 19 }, end: { offset: 20, line: 1, column: 21 } } }
  ],
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 23, line: 1, column: 24 } }
}
```

**Original OpenSCAD Examples (for context):**
```openscad
echo();
echo("Demo", myVar, value * 2);

```

### FunctionCallNode

Represents a function call expression. Extends `BaseNode` (as an `ExpressionNode`).

```typescript
interface FunctionCallNode extends BaseNode {
  type: 'expression';             // Inherited from ExpressionNode
  expressionType: 'function_call';// Discriminates function calls
  functionName: string;           // The name of the function being called
  args: Parameter[];              // Arguments passed to the function
}
```

**Properties:**
- `type`: Always `'expression'` for expression-based nodes.
- `expressionType`: Always `'function_call'`.
- `functionName`: The identifier string for the function call.
- `args`: An array of `Parameter` objects (with optional `name` and `value`) for each argument.

**TypeScript AST Example:**
```typescript
// Corresponds to: sum(1, 2);
{
  type: 'expression',
  expressionType: 'function_call',
  functionName: 'sum',
  args: [
    { name: undefined, value: { type: 'expression', expressionType: 'literal', value: 1, location: { start: {offset: 4, line: 1, column: 5}, end: {offset: 5, line: 1, column: 6} } } },
    { name: undefined, value: { type: 'expression', expressionType: 'literal', value: 2, location: { start: {offset: 7, line: 1, column: 8}, end: {offset: 8, line: 1, column: 9} } } }
  ],
  location: { start: {offset: 0, line: 1, column: 1}, end: {offset: 9, line: 1, column: 10} }
}
```

**Original OpenSCAD Example:**
```openscad
sum(1, 2);
```

### ModuleInstantiationNode

Represents an instantiation (call) of a module. Extends `BaseNode`.

This node captures the module's name, the arguments passed to it, and any child nodes that form the module's content (e.g., for `union()` or custom modules that act as wrappers).

```typescript
// Helper interface for arguments passed to a module
interface Parameter {
  name?: string;          // Optional name for named arguments (e.g., size=10)
  value: ParameterValue;  // The value of the argument
}

interface ModuleInstantiationNode extends BaseNode {
  type: 'module_instantiation';
  name: string;             // The name of the module being instantiated
  args: Parameter[];        // Array of arguments passed to the module
  children: ASTNode[];      // Child statements/nodes (e.g., for CSG ops or container modules)
}
```

**Properties:**
- `type`: Always `'module_instantiation'`.
- `name`: A string representing the name of the module being called.
- `args`: An array of `Parameter` objects. Each object defines:
  - `name` (optional): A string for the parameter name if it's a named argument. For positional arguments, this is `undefined`.
  - `value`: A `ParameterValue` representing the argument's value. The `ParameterValue` type is defined as: `number | boolean | string | Vector2D | Vector3D | ExpressionNode | ErrorNode | null | undefined`. Typically, for structured values like literals, variables, or complex expressions, this will be an `ExpressionNode`.
- `children`: An array of `ASTNode` objects. These are the children of the module instantiation, common in CSG operations like `union() { ... }` or when a module is designed to process its children.

**Example:**
```typescript
// For an OpenSCAD call: my_module(param1 = 10, 20) { child_cube(); }
// (Assuming my_module is defined, and child_cube is a valid statement)
{
  type: 'module_instantiation',
  name: 'my_module',
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 50, line: 1, column: 51 } },
  args: [
    {
      name: 'param1',
      value: { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 20, line: 1, column: 21 }, end: { offset: 22, line: 1, column: 23 } } }
    },
    {
      // name is undefined for positional argument
      value: { type: 'expression', expressionType: 'literal', value: 20, location: { start: { offset: 25, line: 1, column: 26 }, end: { offset: 27, line: 1, column: 28 } } }
    }
  ],
  children: [
    {
      type: 'module_instantiation', // Assuming child_cube() is another module call
      name: 'child_cube',
      args: [],
      children: [],
      location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 48, line: 1, column: 49 } }
    }
  ]
}

// Example for a built-in like cube: cube(size=[10,10,10], center=true);
{
  type: 'module_instantiation', // Note: Primitives like cube are also parsed as ModuleInstantiationNode
  name: 'cube',
  location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 40, line: 1, column: 41 } },
  args: [
    {
      name: 'size',
      value: {
        type: 'expression',
        expressionType: 'vector_expression',
        location: { start: { offset: 10, line: 1, column: 11 }, end: { offset: 30, line: 1, column: 31 } },
        elements: [
          { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 11, line: 1, column: 12 }, end: { offset: 13, line: 1, column: 14 } } },
          { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 15, line: 1, column: 16 }, end: { offset: 17, line: 1, column: 18 } } },
          { type: 'expression', expressionType: 'literal', value: 10, location: { start: { offset: 19, line: 1, column: 20 }, end: { offset: 21, line: 1, column: 22 } } }
        ]
      }
    },
    {
      name: 'center',
      value: { type: 'expression', expressionType: 'literal', value: true, location: { start: { offset: 35, line: 1, column: 36 }, end: { offset: 39, line: 1, column: 40 } } }
    }
  ],
  children: [] // cube() does not take children in the `cube() { ... }` sense
}
