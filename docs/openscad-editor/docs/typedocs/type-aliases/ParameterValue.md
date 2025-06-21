[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Type Alias: ParameterValue

```ts
type ParameterValue = 
  | number
  | boolean
  | string
  | Vector2D
  | Vector3D
  | ExpressionNode
  | ErrorNode
  | null
  | undefined;
```

Defined in: [openscad-parser/ast/ast-types.ts:251](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L251)

Represents a parameter value which can be a literal or an expression
