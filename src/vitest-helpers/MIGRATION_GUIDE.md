# Migration Guide: Using createTestParser() for OpenSCAD Parser Tests

## Overview
All OpenSCAD parser tests should now use the `createTestParser()` utility function instead of directly instantiating `new OpenscadParser()`. This ensures proper cleanup and memory management.

## Migration Steps

### 1. Add Import
Replace:
```ts
import { OpenscadParser } from './openscad-parser';
```

With:
```ts
import { OpenscadParser } from './openscad-parser';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
```

### 2. Replace Constructor Calls
Replace:
```ts
parser = new OpenscadParser();
```

With:
```ts
parser = createTestParser();
```

### 3. Remove Manual Cleanup
Remove or comment out manual cleanup code:
```ts
afterEach(() => {
  parser.dispose(); // This is now handled automatically
});
```

Should become:
```ts
// Note: cleanup is now handled automatically by the test utility
```

## Examples

### Before Migration
```ts
import { OpenscadParser } from './openscad-parser';

describe('My Test', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should work', () => {
    // test code
  });
});
```

### After Migration
```ts
import { OpenscadParser } from './openscad-parser';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';

describe('My Test', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = createTestParser();
    await parser.init();
  });

  // Note: cleanup is now handled automatically by the test utility

  it('should work', () => {
    // test code
  });
});
```

## Benefits
- Automatic cleanup prevents memory leaks
- Centralized parser lifecycle management
- Automatic garbage collection triggers
- Consistent test setup across the codebase

## Files Updated
- `src/features/openscad-parser/openscad-parser.test.ts` ✅
- `src/features/openscad-parser/debug-cst.test.ts` ✅
- All other test files using `new OpenscadParser()` need to be updated

## Search Pattern
To find files that need migration, search for:
```
new OpenscadParser\(\)
```

These should all be replaced with `createTestParser()` and the import should be added.
