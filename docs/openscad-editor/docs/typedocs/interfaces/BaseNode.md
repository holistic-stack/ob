[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: BaseNode

Defined in: [openscad-parser/ast/ast-types.ts:49](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L49)

Base interface for all AST nodes in the OpenSCAD parser.

This interface provides the foundation for all AST node types, ensuring
consistent structure and enabling polymorphic operations across different
node types. Every AST node must have a type identifier and may optionally
include source location information.

## Example

```typescript
const cubeNode: CubeNode = {
  type: 'cube',
  size: 10,
  center: false,
  location: {
    start: { line: 1, column: 0, offset: 0 },
    end: { line: 1, column: 8, offset: 8 },
    text: 'cube(10)'
  }
};
```

## Since

0.1.0

## Extended by

- [`ExpressionNode`](ExpressionNode.md)
- [`FunctionCallNode`](FunctionCallNode.md)
- [`TranslateNode`](TranslateNode.md)
- [`RotateNode`](RotateNode.md)
- [`ScaleNode`](ScaleNode.md)
- [`MirrorNode`](MirrorNode.md)
- [`MultmatrixNode`](MultmatrixNode.md)
- [`ColorNode`](ColorNode.md)
- [`UnionNode`](UnionNode.md)
- [`DifferenceNode`](DifferenceNode.md)
- [`IntersectionNode`](IntersectionNode.md)
- [`HullNode`](HullNode.md)
- [`MinkowskiNode`](MinkowskiNode.md)
- [`CubeNode`](CubeNode.md)
- [`SphereNode`](SphereNode.md)
- [`CylinderNode`](CylinderNode.md)
- [`PolyhedronNode`](PolyhedronNode.md)
- [`PolygonNode`](PolygonNode.md)
- [`CircleNode`](CircleNode.md)
- [`SquareNode`](SquareNode.md)
- [`TextNode`](TextNode.md)
- [`LinearExtrudeNode`](LinearExtrudeNode.md)
- [`RotateExtrudeNode`](RotateExtrudeNode.md)
- [`OffsetNode`](OffsetNode.md)
- [`ResizeNode`](ResizeNode.md)
- [`IfNode`](IfNode.md)
- [`ForLoopNode`](ForLoopNode.md)
- [`LetNode`](LetNode.md)
- [`EachNode`](EachNode.md)
- [`AssertStatementNode`](AssertStatementNode.md)
- [`EchoStatementNode`](EchoStatementNode.md)
- [`AssignStatementNode`](AssignStatementNode.md)
- [`SpecialVariableAssignment`](SpecialVariableAssignment.md)
- [`ModuleDefinitionNode`](ModuleDefinitionNode.md)
- [`ModuleInstantiationNode`](ModuleInstantiationNode.md)
- [`FunctionDefinitionNode`](FunctionDefinitionNode.md)
- [`AssignmentNode`](AssignmentNode.md)
- [`ChildrenNode`](ChildrenNode.md)
- [`ErrorNode`](ErrorNode.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="type"></a> `type` | `string` | The type of the node | [openscad-parser/ast/ast-types.ts:53](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L53) |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
