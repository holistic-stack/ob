focus to fix `pnpm build` issues; perform batch updates as preference;
after each file update fix all failing tests, biome lint issues and typescript issues;
 
continue Following the Implementation Plan 
Open  tasks/babylon-architecture.md and work through tasks sequentially by priority level. For each task, update its status from "Not Started" to "In Progress" when you begin, then to "Completed" when finished. Always run the validation commands provided in each section to verify your work meets the success criteria before marking tasks complete.  
 
Incremental Progress Tracking 
After completing each task, immediately update the task table in  tasks/babylon-architecture.md with the new status and current date. Document any issues encountered in the "Risk" section by updating the likelihood/impact if risks materialize, and add new risks if discovered. Commit your changes with descriptive messages following the pattern: feat(babylon): complete [task-name] - [brief description]. This creates a clear audit trail and allows rollback to any previous state if needed. 
 
Maintaining Quality Standards 
Before marking any task complete, run the validation checklist provided for that task (type-check, tests, build verification). If validation fails, keep the task status as "In Progress" and document the blocking issues. Update the "Conclusion" section weekly with current progress summary, any scope changes, and next week's priorities. This workflow ensures the plan remains a living document that accurately reflects project state and guides decision-making throughout the implementation. 
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
MUST avoid biome lint issues and typescript issues; 
Follow bulletproof-react architecture patterns;  
Maintain zero TypeScript compilation errors and zero Biome violations; 
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
do not use mocks for Babylon, use NullEngine: 
``` 
import * as BABYLON from "@babylonjs/core"; 
 
describe("Babylon tests", () => { 
  let scene: BABYLON.Scene; 
  let engine: BABYLON.NullEngine; 
  beforeAll(async () => { 
    // Initialize CSG2 
    await initializeCSG2(); 
  }) 
  beforeEach(async () => { 
    // Create a null engine (headless) 
    engine = new BABYLON.NullEngine(); 
 
    // Create a real scene 
    scene = new BABYLON.Scene(engine); 
  }); 
}); 
``` 
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
