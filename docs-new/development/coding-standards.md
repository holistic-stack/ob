# Coding Standards

General principles
- TDD first with small, incremental changes
- No mocks except for external I/O operations
- Files under 500 lines; split into SRP units
- DRY and KISS; prioritize readability over cleverness
- Centralize constants and configuration

TypeScript (5.8+)
- Strict mode; zero any
- Prefer interfaces for APIs; readonly for immutable data
- Use unions, generics, discriminated unions; avoid type assertions
- Employ type guards and utility types

Functional programming
- Prefer pure functions and immutability
- Compose functions; avoid hidden side effects
- Use Result/Either for error handling

Error handling
- Structured errors with specific codes/messages
- Validate inputs; handle edge cases explicitly
- Use try/catch sparingly; prefer Result branches

Performance
- Optimize for clarity first; then profile
- Use appropriate data structures; memoize when needed
- Minimize heavy 3D operations in critical paths
