[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Type Alias: StatementNode

```ts
type StatementNode = 
  | IfNode
  | ForLoopNode
  | LetNode
  | EachNode
  | AssertStatementNode
  | EchoStatementNode
  | AssignStatementNode
  | ModuleInstantiationNode
  | ModuleDefinitionNode
  | FunctionDefinitionNode
  | TranslateNode
  | RotateNode
  | ScaleNode
  | MirrorNode
  | MultmatrixNode
  | ColorNode
  | UnionNode
  | DifferenceNode
  | IntersectionNode
  | HullNode
  | MinkowskiNode
  | CubeNode
  | SphereNode
  | CylinderNode
  | PolyhedronNode
  | PolygonNode
  | CircleNode
  | SquareNode
  | TextNode
  | LinearExtrudeNode
  | RotateExtrudeNode
  | OffsetNode
  | ResizeNode
  | ChildrenNode
  | ErrorNode;
```

Defined in: [openscad-parser/ast/ast-types.ts:979](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L979)

Union type of all possible AST nodes that can function as a statement in a block.
This includes control flow statements, assignments, module instantiations,
definitions, and geometry-producing operations.
