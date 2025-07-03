; Find all include and use statements
(include_statement
  (string_literal) @file_path) @include

(use_statement
  (string_literal) @file_path) @use

; Find module and function definitions
(module_definition
  name: (identifier) @module_name) @module_definition

(function_definition
  name: (identifier) @function_name) @function_definition

; Find module and function calls
(call_expression
  function: (identifier) @function_name
  (#not-match? @function_name "^(union|difference|intersection|circle|square|polygon|text|import|projection|sphere|cube|cylinder|polyhedron|linear_extrude|rotate_extrude|surface|translate|rotate|scale|resize|mirror|multmatrix|color|offset|hull|minkowski|render|import_stl|import_dxf|import_off)$")) @function_call
