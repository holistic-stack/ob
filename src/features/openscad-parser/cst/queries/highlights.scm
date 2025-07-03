; Syntax highlighting for OpenSCAD

; Keywords
["module" "function" "if" "else" "for" "let" "each" "assign" "assert" "echo"] @keyword

; Built-in modules and functions
(module_definition
  name: (identifier) @function)

(function_definition
  name: (identifier) @function)

; Built-in functions and modules
(call_expression
  function: (identifier) @function.builtin
  (#match? @function.builtin "^(union|difference|intersection|circle|square|polygon|text|import|projection|sphere|cube|cylinder|polyhedron|linear_extrude|rotate_extrude|surface|translate|rotate|scale|resize|mirror|multmatrix|color|offset|hull|minkowski|render|import_stl|import_dxf|import_off)$"))

; Special variables
((identifier) @variable.builtin
  (#match? @variable.builtin "^(\$fn|\$fs|\$fa|\$t|\$vpr|\$vpt|\$vpd|\$preview)$"))

; Variables
(assignment_expression
  left: (identifier) @variable)

; Numbers
(number) @number
(float) @number.float

; Strings
(string_literal) @string

; Boolean
(boolean) @boolean

; Comments
(comment) @comment

; Operators
["+" "-" "*" "/" "%" "^" "!" "&&" "||" "<" ">" "<=" ">=" "==" "!=" "?" ":"] @operator

; Punctuation
["(" ")" "{" "}" "[" "]"] @punctuation.bracket
[";" "," "."] @punctuation.delimiter
