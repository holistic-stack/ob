
Use DRY and SRP principles;

read and keep the files bellow updated: 
docs\ui-components-library.md 
docs\liquid-glass-design-system.md 
docs\liquid-glass-component-guidelines.md
docs\typescript-guidelines.md
---

MUST USE TDD, DRY, KISS and SRP principles;
MUST read and keep update the tasks management files tasks/current-context.md, tasks/PROGRESS.md and tasks/TODO.md;

IMPORTANT RULE THAT MUST BE FOLLOWED, do small incremental changes and:
- Execute development workflows using Desktop Commander MCP
- RUN tests, typescript checks and lint;
- Must create e2e tests for features using  latest playwirght best practices features with playwright;
- When debugging code or tests add logs checkpoints such:
	- [INIT] starting something;
	- [DEBUG] the value now is something;
	- [DEBUG] loading something;
	- [ERROR]something got wrong, details: (...erro details);
	- [WARN] something needs attention (...warn details);
	- [END] successfully executed something;

- ALWAYS search online for update context information and REASON MULTIPLE APPROACH, focus in the typescript best practices docs/typescript-guidelines.md, focus on tree sitter best practices, avoid tree sitter grammar pitfalls, also follow DRY, SRP and KISS principles, each lesson learning, common issues, mistake that you found that can be avoid(e.g. types wrong import and soon), recurrent issues fixed anything that aid developer in the future save/remove/update it in docs/lesson-learned.md;
- remember the current year is JUNE 2025;
- watch or invalid stand alone invalid openscad syntax;
- MUST read and keep update the tasks management files tasks/current-context.md, tasks/PROGRESS.md and tasks/TODO.md;
- MUST keep the README.MD, and project features documentation files docs\project-guidelines.md, docs\lesson-learned.md, docs/*.md;
- MUST add documentation comments in the edited files explaining the reason behind the edit, remove old comments if you refactored the previous edit; 
- Follow best typescripts patterns in docs\typescript-guidelines.md; 
---

## Coding Best Practices

### General Principles
- DO NOT USE MOCKS for OpenscadParser;
- Implement changes incrementally with files under 500 lines
- Follow TDD with small changes and avoid mocks in tests
- No `any` types in TypeScript; use kebab-case for filenames
- Apply Single Responsibility Principle (SRP)
- Prioritize readability over clever code
- Follow best typescripts patterns in docs\typescript-guidelines.md;
ALWAYS USE DRY and KISS rules and algoritm improvements, split the code in smaller and manageable code, reason multiple options of improvements;
use SRP of solid for any function and utils, use TDD approach;
search in the web for more context;
do not use __tests__ folder, use:
EACH SRP file must have its own folder and the its tests should be in the same folder, e.g. of file structure:

```jsx
new-srp-file/
├── new-srp-file-with-single-small-test-files-example/
│   ├── new-srp-file.ts
│   └── new-srp-file.test.ts
└── new-srp-file-with-muiltiple-small-test-files-example/
    ├── new-srp-file.ts
    ├── new-srp-file-[similar-scenario1].test.ts
    ├── new-srp-file-[similar-scenario2].test.ts
    ├── ...
    └── new-srp-file-[similar-scenarioX].test.ts
```

### TypeScript Best Practices
- Use strict mode and explicit type annotations
- Leverage advanced types (unions, intersections, generics)
- Prefer interfaces for APIs and readonly for immutable data
- Use type guards instead of type assertions
- Utilize utility types and discriminated unions

### Functional Programming
- Write pure functions without side effects
- Enforce immutability and use higher-order functions
- Compose functions and use declarative programming
- Handle nullable values with option/maybe types
- Use Either/Result types for error handling


### Testing with Vitest

do not use mocks for openscadParser, use real parser:
```

describe("OpenSCADParser", () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new OpenscadParser();

    // Initialize the parser
    await parser.init();
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });
});
```

### Error Handling
- Use structured error handling with specific types
- Provide meaningful error messages with context
- Handle edge cases explicitly and validate input data
- Use try/catch blocks only when necessary

### Performance
- Optimize for readability first, then performance
- Profile to identify actual bottlenecks
- Use appropriate data structures and memoization
- Minimize DOM manipulations and optimize 3D operations

## Documentation Best Practices
- Add JSDoc comments to all code elements with descriptions and examples
- Use `@example` tag and `@file` tag for module descriptions
- Document why code works a certain way, not just what it does
- Include architectural decisions, limitations, and edge cases
- Use diagrams for complex relationships and "before/after" sections
- Keep documentation close to code and provide thorough examples

## Code Review Guidelines
- Check adherence to standards, test coverage, and documentation
- Look for security vulnerabilities and performance issues
- Verify proper typing, error handling, and functional principles
- Identify refactoring opportunities for better code quality
- Provide constructive feedback focused on code, not developer

## Continuous Integration
- Ensure all code passes tests, linting, and type checking
- Use feature branches and maintain clean commit history



IMPORTANT THIS PROJECT IS typescript first,(NO JS ALLOWED), features include:

Feature	Description
Composability	Construct highly maintainable, readable, and flexible software through the use of small, reusable building blocks.
Resource Safety	Safely manage acquisition and release of resources, even when your program fails.
Type Safety	Leverage the TypeScript type system to the fullest with focus on type inference and type safety.
Error Handling	Handle errors in a structured and reliable manner using built-in error handling capabilities.
Asynchronicity	Write code that looks the same, whether it is synchronous or asynchronous.
Observability	With full tracing capabilities, you can easily debug and monitor the execution of your app.

