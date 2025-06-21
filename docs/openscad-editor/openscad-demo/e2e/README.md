# OpenSCAD Demo E2E Tests

End-to-end tests for the OpenSCAD Demo application with comprehensive debugging capabilities.

## Overview

This test suite provides comprehensive e2e testing for the OpenSCAD Demo application with advanced debugging features including:

- **Console output interception** - All console messages (log, warn, error, info, debug)
- **Page error monitoring** - Uncaught JavaScript exceptions and errors
- **Network request logging** - All HTTP requests, responses, and failures
- **Monaco Editor testing** - Real editor interactions without mocks
- **OpenSCAD parser testing** - Real parsing with actual tree-sitter instances

## Test Structure

```
e2e/
├── fixtures/
│   └── debug.fixture.ts          # Debug fixtures with console interception
├── utils/
│   └── monaco-helpers.ts         # Monaco Editor interaction utilities
├── example.e2e.ts               # Basic application functionality tests
├── openscad-parser.e2e.ts       # OpenSCAD parser-specific tests
└── README.md                    # This file
```

## Running Tests

### Basic Test Execution

```bash
# Run all e2e tests (Chromium only)
nx e2e openscad-demo

# Run specific test file
nx e2e openscad-demo --grep "Basic Functionality"

# Run with UI mode for interactive debugging
nx e2e openscad-demo --ui
```

### Debug Mode

Enable detailed console output and logging:

```bash
# Enable debug logging
DEBUG_E2E=true nx e2e openscad-demo

# Run in headed mode with debug logging
DEBUG_E2E=true nx e2e openscad-demo --headed

# Run with slow motion for visual debugging
DEBUG_E2E=true nx e2e openscad-demo --headed --slow-mo=1000
```

### CI Mode

```bash
# CI mode automatically enables debug logging
CI=true nx e2e openscad-demo
```

## Debug Features

### Console Output Interception

All console messages are automatically captured and logged:

```typescript
// Example debug output
🖥️  [CONSOLE LOG] 2025-01-XX: Monaco Editor initialized
🖥️  [CONSOLE WARN] 2025-01-XX: Performance warning: Large AST
❌ [PAGE ERROR] 2025-01-XX: TypeError: Cannot read property 'parse'
```

### Network Monitoring

All network requests are tracked:

```typescript
// Example network logs
🌐 [REQUEST] 2025-01-XX: GET /tree-sitter-openscad.wasm (document)
📥 [RESPONSE] 2025-01-XX: 200 /tree-sitter-openscad.wasm
💥 [REQUEST FAILED] 2025-01-XX: GET /missing-file.js - net::ERR_FAILED
```

### Test Attachments

Debug information is automatically attached to test reports:

- `console-logs.json` - All console messages with timestamps
- `page-errors.json` - JavaScript errors and exceptions
- `network-logs.json` - Network request/response details

## Monaco Editor Testing

The `MonacoEditorHelper` class provides utilities for testing Monaco Editor:

```typescript
import { MonacoEditorHelper } from './utils/monaco-helpers';

test('Monaco Editor test', async ({ page }) => {
  const monacoHelper = new MonacoEditorHelper(page);
  
  // Wait for editor to be ready
  await monacoHelper.waitForEditorReady();
  
  // Set content
  await monacoHelper.setEditorContent('cube([10, 10, 10]);');
  
  // Get content
  const content = await monacoHelper.getEditorContent();
  
  // Check syntax highlighting
  const hasSyntax = await monacoHelper.hasSyntaxHighlighting();
  
  // Get syntax errors
  const markers = await monacoHelper.getEditorMarkers();
});
```

## OpenSCAD Parser Testing

Tests use real OpenSCAD parser instances (no mocks):

```typescript
test('Parser test', async ({ debugLogs }) => {
  // Set OpenSCAD code
  await monacoHelper.setEditorContent(`
    cube([10, 10, 10]);
    sphere(r = 5);
  `);
  
  // Check parsing logs
  const parsingLogs = debugLogs.consoleLogs.filter(log => 
    log.message.includes('parse')
  );
  
  // Verify no parsing errors
  const parseErrors = debugLogs.pageErrors.filter(error => 
    error.message.includes('syntax')
  );
  
  expect(parseErrors).toHaveLength(0);
});
```

## Best Practices

### 1. Use Debug Fixtures

Always import from the debug fixture to get console interception:

```typescript
import { test, expect } from './fixtures/debug.fixture';
```

### 2. Monitor Console Output

Check debug logs for insights into application behavior:

```typescript
test('My test', async ({ debugLogs }) => {
  // Your test code...
  
  console.log(`Console logs: ${debugLogs.consoleLogs.length}`);
  console.log(`Page errors: ${debugLogs.pageErrors.length}`);
  console.log(`Network requests: ${debugLogs.networkLogs.length}`);
});
```

### 3. Wait for Editor Initialization

Always wait for Monaco Editor to be ready:

```typescript
const monacoHelper = new MonacoEditorHelper(page);
await monacoHelper.waitForEditorReady();
```

### 4. Use Real Interactions

Avoid mocks and use real user interactions:

```typescript
// Good: Real editor interaction
await monacoHelper.setEditorContent(code);

// Avoid: Mocking editor behavior
// mockEditor.setValue(code);
```

### 5. Check for Errors

Always verify no unexpected errors occurred:

```typescript
const criticalErrors = debugLogs.pageErrors.filter(error => 
  !error.message.includes('known-harmless-warning')
);
expect(criticalErrors).toHaveLength(0);
```

## Troubleshooting

### Common Issues

1. **Monaco Editor not ready**: Ensure `waitForEditorReady()` is called
2. **WASM loading failures**: Check network logs for WASM file requests
3. **Parser errors**: Review console logs for tree-sitter initialization
4. **Timeout issues**: Increase timeouts for complex operations

### Debug Commands

```bash
# Run with maximum debugging
DEBUG_E2E=true nx e2e openscad-demo --headed --slow-mo=2000 --debug

# Generate trace files
nx e2e openscad-demo --trace=on

# Run with browser DevTools open
nx e2e openscad-demo --headed --devtools
```

### Environment Variables

- `DEBUG_E2E=true` - Enable detailed console logging
- `CI=true` - Enable CI mode with automatic debug logging
- `PWDEBUG=1` - Enable Playwright inspector
- `PLAYWRIGHT_SLOW_MO=1000` - Add delay between actions

## Configuration

The tests are configured for Chromium only with optimized settings:

```typescript
// playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: { 
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
      launchOptions: {
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-sandbox',
        ],
      },
    },
  },
]
```

## Contributing

When adding new tests:

1. Use the `*.e2e.ts` suffix for all test files
2. Import from `./fixtures/debug.fixture` for console interception
3. Use `MonacoEditorHelper` for editor interactions
4. Add appropriate debug logging and error checking
5. Follow the "no mocks" principle for OpenSCAD parser testing
