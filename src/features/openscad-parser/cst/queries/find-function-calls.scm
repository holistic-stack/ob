; Find all function calls
(call_expression
  function: (identifier) @function_name
  arguments: (arguments) @arguments
) @function_call

; Find function calls with specific names
(call_expression
  function: (identifier) @name
  (#match? @name "^(cube|sphere|cylinder|polyhedron)$")
) @primitive_call

; Find function definitions
(function_definition
  name: (identifier) @function_name
  parameters: (parameters) @parameters
  body: (_) @function_body
) @function_definition

; Find module definitions
(module_definition
  name: (identifier) @module_name
  parameters: (parameters) @parameters
  body: (_) @module_body
) @module_definition

; Find variable assignments
(assignment_expression
  left: (identifier) @variable_name
  right: (_) @value
) @variable_assignment

; Find includes and uses
(include_statement
  (string_literal) @file_path
) @include_statement

(use_statement
  (string_literal) @file_path
) @use_statement
