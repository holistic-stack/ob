[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Type Alias: ASTNode

```ts
type ASTNode = 
  | ExpressionNode
  | LiteralNode
  | VariableNode
  | FunctionCallNode
  | TranslateNode
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
  | IfNode
  | ForLoopNode
  | LetNode
  | EachNode
  | AssertStatementNode
  | EchoStatementNode
  | AssignStatementNode
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
  | ModuleDefinitionNode
  | ModuleInstantiationNode
  | FunctionDefinitionNode
  | AssignmentNode
  | SpecialVariableAssignment
  | ChildrenNode
  | IdentifierNode
  | VectorExpressionNode
  | IndexExpressionNode
  | RangeExpressionNode
  | LetExpressionNode
  | ListComprehensionExpressionNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | ConditionalExpressionNode
  | ErrorNode;
```

Defined in: [openscad-parser/ast/ast-types.ts:1016](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L1016)
