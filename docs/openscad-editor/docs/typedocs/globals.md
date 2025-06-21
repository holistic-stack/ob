[**OpenSCAD Parser API Documentation v0.1.0**](README.md)

***

# OpenSCAD Parser API Documentation v0.1.0

## File

Main entry point for the OpenSCAD Parser library

This module exports all public APIs for parsing OpenSCAD code, including:
- Enhanced parser with AST generation
- Error handling utilities
- AST node types and utilities
- IDE support features

## Since

0.1.0

## Classes

### Core

| Class | Description |
| ------ | ------ |
| [NodeLocation](classes/NodeLocation.md) | Represents a location range within source code, providing both line/column and character offset information for precise positioning. |

### Other

| Class | Description |
| ------ | ------ |
| [OpenSCADPositionUtilities](classes/OpenSCADPositionUtilities.md) | Defines the contract for position utilities service. This service provides position-based operations on AST nodes. |
| [OpenSCADSymbolProvider](classes/OpenSCADSymbolProvider.md) | Defines the contract for a symbol provider service. This service is responsible for extracting symbol information from an AST. |
| [EnhancedOpenscadParser](classes/EnhancedOpenscadParser.md) | Enhanced OpenSCAD parser with AST generation capabilities and error handling. |
| [ErrorHandler](classes/ErrorHandler.md) | Central error error-handling for managing errors and recovery in the OpenSCAD parser. |
| [SimpleErrorHandler](classes/SimpleErrorHandler.md) | Simple error handler implementation providing lightweight error management. |

## Interfaces

### Core

| Interface | Description |
| ------ | ------ |
| [BaseNode](interfaces/BaseNode.md) | Base interface for all AST nodes in the OpenSCAD parser. |
| [SourceLocation](interfaces/SourceLocation.md) | Represents a source code location range with start and end positions. |
| [Position](interfaces/Position.md) | Represents a specific position in the source code. |
| [ErrorNode](interfaces/ErrorNode.md) | Represents a parsing error encountered during AST construction. This node is used when a visitor cannot successfully convert a CST node into a valid AST node due to structural issues, missing parts, or unparsable sub-expressions. |

### Other

| Interface | Description |
| ------ | ------ |
| [SourceRange](interfaces/SourceRange.md) | Represents a range in the source code with start and end positions. |
| [HoverInfo](interfaces/HoverInfo.md) | Represents hover information for a symbol or node. |
| [CompletionContext](interfaces/CompletionContext.md) | Represents the context for code completion at a specific position. |
| [PositionUtilities](interfaces/PositionUtilities.md) | Defines the contract for position utilities service. This service provides position-based operations on AST nodes. |
| [SymbolInfo](interfaces/SymbolInfo.md) | Represents information about a symbol in the OpenSCAD code. |
| [SymbolProvider](interfaces/SymbolProvider.md) | Defines the contract for a symbol provider service. This service is responsible for extracting symbol information from an AST. |
| [Value](interfaces/Value.md) | Represents a value type used in argument extraction |
| [VectorValue](interfaces/VectorValue.md) | Represents a vector value |
| [RangeValue](interfaces/RangeValue.md) | Represents a range value |
| [Parameter](interfaces/Parameter.md) | Represents a parameter with an optional name |
| [ExpressionNode](interfaces/ExpressionNode.md) | Base interface for expression nodes |
| [IdentifierExpressionNode](interfaces/IdentifierExpressionNode.md) | Represents an identifier expression, e.g., a variable name. |
| [LiteralNode](interfaces/LiteralNode.md) | Represents a literal value (number, string, boolean) |
| [VariableNode](interfaces/VariableNode.md) | Represents a variable reference |
| [FunctionCallNode](interfaces/FunctionCallNode.md) | Represents a function call |
| [TranslateNode](interfaces/TranslateNode.md) | Represents a translate node |
| [RotateNode](interfaces/RotateNode.md) | Represents a rotate node |
| [ScaleNode](interfaces/ScaleNode.md) | Represents a scale node |
| [MirrorNode](interfaces/MirrorNode.md) | Represents a mirror node |
| [MultmatrixNode](interfaces/MultmatrixNode.md) | Represents a multmatrix node |
| [ColorNode](interfaces/ColorNode.md) | Represents a color node |
| [UnionNode](interfaces/UnionNode.md) | Represents a union node |
| [DifferenceNode](interfaces/DifferenceNode.md) | Represents a difference node |
| [IntersectionNode](interfaces/IntersectionNode.md) | Represents an intersection node |
| [HullNode](interfaces/HullNode.md) | Represents a hull node |
| [MinkowskiNode](interfaces/MinkowskiNode.md) | Represents a minkowski node |
| [CubeNode](interfaces/CubeNode.md) | Represents a cube primitive |
| [SphereNode](interfaces/SphereNode.md) | Represents a sphere primitive |
| [CylinderNode](interfaces/CylinderNode.md) | Represents a cylinder primitive |
| [PolyhedronNode](interfaces/PolyhedronNode.md) | Represents a polyhedron primitive |
| [PolygonNode](interfaces/PolygonNode.md) | Represents a 2D polygon |
| [CircleNode](interfaces/CircleNode.md) | Represents a 2D circle |
| [SquareNode](interfaces/SquareNode.md) | Represents a 2D square |
| [TextNode](interfaces/TextNode.md) | Represents a text node |
| [LinearExtrudeNode](interfaces/LinearExtrudeNode.md) | Represents a linear_extrude node |
| [RotateExtrudeNode](interfaces/RotateExtrudeNode.md) | Represents a rotate_extrude node |
| [OffsetNode](interfaces/OffsetNode.md) | Represents an offset node |
| [ResizeNode](interfaces/ResizeNode.md) | Represents a resize node |
| [IfNode](interfaces/IfNode.md) | Represents an if statement |
| [ForLoopVariable](interfaces/ForLoopVariable.md) | Represents a for loop variable with its range |
| [ForLoopNode](interfaces/ForLoopNode.md) | Represents a for loop |
| [LetNode](interfaces/LetNode.md) | Represents a let expression |
| [EachNode](interfaces/EachNode.md) | Represents an each statement |
| [AssertStatementNode](interfaces/AssertStatementNode.md) | Represents an assert statement in OpenSCAD |
| [~~AssignStatementNode~~](interfaces/AssignStatementNode.md) | Represents an assign statement for variable scoping (deprecated in OpenSCAD). |
| [ArrayExpressionNode](interfaces/ArrayExpressionNode.md) | Represents an array expression |
| [EachExpressionNode](interfaces/EachExpressionNode.md) | Represents an each expression |
| [LiteralExpressionNode](interfaces/LiteralExpressionNode.md) | Represents a literal expression (number, string, boolean) |
| [SpecialVariableAssignment](interfaces/SpecialVariableAssignment.md) | Represents a special variable assignment |
| [ModuleDefinitionNode](interfaces/ModuleDefinitionNode.md) | Represents a module definition |
| [ModuleParameter](interfaces/ModuleParameter.md) | Represents a module parameter |
| [ModuleInstantiationNode](interfaces/ModuleInstantiationNode.md) | Represents a module instantiation |
| [FunctionDefinitionNode](interfaces/FunctionDefinitionNode.md) | Represents a function definition |
| [AssignmentNode](interfaces/AssignmentNode.md) | Represents a variable assignment |
| [ChildrenNode](interfaces/ChildrenNode.md) | Represents a children() call in a module |
| [IdentifierNode](interfaces/IdentifierNode.md) | Represents an identifier (variable reference) |
| [VectorExpressionNode](interfaces/VectorExpressionNode.md) | Represents a vector expression [x, y, z] |
| [IndexExpressionNode](interfaces/IndexExpressionNode.md) | Represents an index expression (e.g., array[index]) |
| [AccessorExpressionNode](interfaces/AccessorExpressionNode.md) | Represents an accessor expression (e.g., object.property) |
| [RangeExpressionNode](interfaces/RangeExpressionNode.md) | Represents a range expression [start:end] or [start:step:end] |
| [LetExpressionNode](interfaces/LetExpressionNode.md) | Represents a let expression let(assignments) expression |
| [ListComprehensionExpressionNode](interfaces/ListComprehensionExpressionNode.md) | Represents a list comprehension expression [for (var = range) expression] |
| [BinaryExpressionNode](interfaces/BinaryExpressionNode.md) | Represents a binary expression (e.g., a + b) |
| [UnaryExpressionNode](interfaces/UnaryExpressionNode.md) | Represents a unary expression (e.g., -a, !b) |
| [ConditionalExpressionNode](interfaces/ConditionalExpressionNode.md) | Represents a conditional expression (ternary operator: condition ? then : else) |
| [ExtractedNamedArgument](interfaces/ExtractedNamedArgument.md) | - |
| [IErrorHandler](interfaces/IErrorHandler.md) | Simple error handler interface defining the minimal contract for error handling. |

### Statements

| Interface | Description |
| ------ | ------ |
| [EchoStatementNode](interfaces/EchoStatementNode.md) | Represents an echo statement for debugging and output |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [Vector3D](type-aliases/Vector3D.md) | Represents a 3D vector [x, y, z] |
| [Vector2D](type-aliases/Vector2D.md) | Represents a 2D vector [x, y] |
| [Vector4D](type-aliases/Vector4D.md) | Represents a 4D vector [x, y, z, w] |
| [ParameterValue](type-aliases/ParameterValue.md) | Represents a parameter value which can be a literal or an expression |
| [SpecialVariable](type-aliases/SpecialVariable.md) | Special variables in OpenSCAD |
| [BinaryOperator](type-aliases/BinaryOperator.md) | Binary operators in OpenSCAD |
| [UnaryOperator](type-aliases/UnaryOperator.md) | Unary operators in OpenSCAD |
| [StatementNode](type-aliases/StatementNode.md) | Union type of all possible AST nodes that can function as a statement in a block. This includes control flow statements, assignments, module instantiations, definitions, and geometry-producing operations. |
| [ASTNode](type-aliases/ASTNode.md) | - |
| [ExtractedParameter](type-aliases/ExtractedParameter.md) | - |

## Functions

### Extractors

| Function | Description |
| ------ | ------ |
| [extractArguments](functions/extractArguments.md) | Extracts function arguments from Tree-sitter CST nodes and converts them to AST parameters. |

### Location Conversion

| Function | Description |
| ------ | ------ |
| [pointToPosition](functions/pointToPosition.md) | Converts a Tree-sitter Point object to an AST Position object. |

### Location Extraction

| Function | Description |
| ------ | ------ |
| [getLocation](functions/getLocation.md) | Extracts complete source location information from a Tree-sitter node. |

### Node Information

| Function | Description |
| ------ | ------ |
| [getFunctionName](functions/getFunctionName.md) | Extracts the function name from a module instantiation node. |

### Other

| Function | Description |
| ------ | ------ |
| [printNodeStructure](functions/printNodeStructure.md) | Print the structure of a tree-sitter node for debugging purposes. |
| [extractVariableName](functions/extractVariableName.md) | Extract variable name from an identifier node |
| [isValidVariableName](functions/isValidVariableName.md) | Check if a variable name is valid according to OpenSCAD rules |
| [getSpecialVariables](functions/getSpecialVariables.md) | Get the list of built-in OpenSCAD special variables |
| [isBuiltinSpecialVariable](functions/isBuiltinSpecialVariable.md) | Check if a variable is a built-in special variable |

### Tree Traversal

| Function | Description |
| ------ | ------ |
| [findDescendantOfType](functions/findDescendantOfType.md) | Finds the first descendant node of a specific type using depth-first search. |
| [findAllDescendantsOfType](functions/findAllDescendantsOfType.md) | Finds all descendant nodes of a specific type using depth-first search. |
| [findAncestorOfType](functions/findAncestorOfType.md) | Finds the first ancestor node of a specific type by traversing up the tree. |

### Value Extraction

| Function | Description |
| ------ | ------ |
| [extractParameterValue](functions/extractParameterValue.md) | Extracts values from Tree-sitter CST nodes and converts them to typed ParameterValue objects. |

### Variable Detection

| Function | Description |
| ------ | ------ |
| [isSpecialVariable](functions/isSpecialVariable.md) | Determines if a Tree-sitter node represents a special OpenSCAD variable. |

### Vector Extraction

| Function | Description |
| ------ | ------ |
| [extractVector](functions/extractVector.md) | Extracts a vector (2D or 3D) from various Tree-sitter node types. |
