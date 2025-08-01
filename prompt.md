TASK: fix biome lint issues and typescript issues;
 
for more system context:
--- 
# Project guidelines and context
docs\typescript-guidelines.md
docs\openscad-babylon-architecture.md
docs\bulletproof-react-structure.md
tasks\refactory-architecture.md 

.trae/documents/api-reference.md
.trae/documents/architecture-overview.md
.trae/documents/coding-patterns.md
.trae/documents/development-workflow.md
.trae/documents/feature-guide.md
.trae/rules/project_rules.md

## Coding Best Practices 
IMPORTANT ALWAYS run `pnpm type-check` and `pnpm biome:fix` after each incremental change to AVOID CREATE NEW compilation errors and Biome violations;
 
### General Principles 
- DO NOT USE MOCKS for OpenscadParser; 
- Implement changes incrementally with files under 500 lines 
- Follow TDD with small changes and avoid mocks in tests 
- No `any` types in TypeScript; use kebab-case for filenames 
- Apply Single Responsibility Principle (SRP) 
- Prioritize readability over clever code
- Follow best typescripts patterns in docs\typescript-guidelines.md; 
KEEP updated docs\openscad-babylon-architecture.md,docs\typescript-guidelines.md and docs\bulletproof-react-structure.md with the changes and project progress; 
ALWAYS USE DRY and KISS rules and algoritm improvements, split the code in smaller and manageable code, reason multiple options of improvements; 
use SRP of solid for any function and utils, use TDD approach; 
search in the web for more context; 
MUST avoid biome lint issues and typescript issues; 
Follow bulletproof-react architecture patterns;  
Maintain zero TypeScript compilation errors and zero Biome violations;
BabylonJs, Openscad parser MUST be react agnostic/independent using functional programming and SRP; 
do not use __tests__ folder, use: 
EACH SRP file must have its own folder and the its tests should be in the same folder, e.g. of file structure: 
Must have global variables centralized in single constants file, to increase reusability and managebility of the project configuration;;
All configuration files must be centralize to increase reusability and managebility of the project configuration;
Before name, services, classes variables etc, think about the naming, it must be self explanatory and easy to understand its proporse; 
 
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
- IMPORTANT!!!!! Add JSDoc comments to all code elements with descriptions and examples 
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

 