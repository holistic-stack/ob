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
- Prefer kebab-case filenames and co-located tests (feature-srp-folder/my-file.ts + my-file.test.ts)

Functional programming
- Prefer pure functions and immutability
- Compose functions; avoid hidden side effects
- Use Result/Either for error handling

Error handling
- Structured errors with specific codes/messages
- Validate inputs; handle edge cases explicitly
- Use try/catch sparingly; prefer Result branches
- No Babylon fallbacks: geometry operations must use Geometry Builder or throw explicit errors

Performance
- Optimize for clarity first; then profile
- Use appropriate data structures; memoize when needed
- Minimize heavy 3D operations in critical paths

Examples

Result type usage
```ts
// Prefer explicit Result<T,E> instead of throwing for expected failures
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

interface ParseError { readonly code: 'PARSE_FAILED'; readonly message: string; }

export function parseOpenSCAD(code: string): Result<{ ast: unknown }, ParseError> {
  if (code.trim() === '') {
    return { success: false, error: { code: 'PARSE_FAILED', message: 'Empty source' } };
  }
  // ...call parser service (real implementation)
  return { success: true, data: { ast: {} } };
}
```

Type guards and readonly data
```ts
interface Vector3 { readonly x: number; readonly y: number; readonly z: number }

function isVector3(value: unknown): value is Vector3 {
  return (
    typeof value === 'object' && value !== null &&
    typeof (value as any).x === 'number' &&
    typeof (value as any).y === 'number' &&
    typeof (value as any).z === 'number'
  );
}
```

Small SRP utilities (co-located tests)
```ts
// src/shared/utils/performance/compute-average.ts
export const computeAverage = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

// src/shared/utils/performance/compute-average.test.ts
import { describe, it, expect } from 'vitest';
import { computeAverage } from './compute-average';

describe('computeAverage', () => {
  it('returns 0 for empty list', () => {
    expect(computeAverage([])).toBe(0);
  });
  it('computes mean', () => {
    expect(computeAverage([1, 2, 3])).toBe(2);
  });
});
```
