# How to: Add a Parser Visitor

1) Identify AST node type
- src/features/openscad-parser/ast/ast-types.ts

2) Create visitor
- src/features/openscad-parser/ast/visitors/<feature>/<feature>.ts
- Follow base-ast-visitor.ts pattern; pure, typed

3) Extract parameters
- src/features/openscad-parser/ast/extractors/<name>-extractor.ts

4) Wire into composite
- src/features/openscad-parser/ast/visitors/composite-visitor.ts

5) Tests
- Co-locate: <feature>.test.ts
- Use real parser; avoid mocks

Do
- Discriminated unions for node variants
- Return Result<T,E> for failures

Don’t
- Don’t throw for expected parse errors; use recovery strategies

