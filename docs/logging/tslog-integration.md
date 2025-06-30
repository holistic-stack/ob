# tslog Integration Guide

## Overview

This document provides comprehensive guidance for using tslog v4.9.3 as the centralized logging solution for the OpenSCAD 3D visualization project. The integration maintains existing logging patterns while providing enhanced capabilities for debugging, performance monitoring, and production logging.

## Quick Start

### Basic Usage

```typescript
import { createLogger } from '../../../shared/services/logger.service';

const logger = createLogger('ComponentName');

// Replace console.log('[DEBUG][ComponentName]', message)
logger.debug('Processing data', { count: 42 });

// Replace console.error('[ERROR][ComponentName]', message)
logger.error('Operation failed', error);

// Replace console.warn('[WARN][ComponentName]', message)
logger.warn('Performance warning detected');
```

### Available Log Methods

- `logger.init()` - Component initialization messages
- `logger.debug()` - Debug information and detailed tracing
- `logger.info()` - General information messages
- `logger.warn()` - Warning messages for potential issues
- `logger.error()` - Error messages and exception handling
- `logger.end()` - Component cleanup and completion messages

## Migration from console.log

### Pattern Replacement

| Old Pattern | New Pattern |
|-------------|-------------|
| `console.log('[DEBUG][ComponentName]', message)` | `logger.debug(message)` |
| `console.error('[ERROR][ComponentName]', message)` | `logger.error(message)` |
| `console.warn('[WARN][ComponentName]', message)` | `logger.warn(message)` |
| `console.info('[INFO][ComponentName]', message)` | `logger.info(message)` |

### Migration Steps

1. **Import the logger service**:
   ```typescript
   import { createLogger } from '../../../shared/services/logger.service';
   ```

2. **Create component-specific logger**:
   ```typescript
   const logger = createLogger('ComponentName');
   ```

3. **Replace console statements**:
   - Remove manual `[TAG][ComponentName]` prefixes
   - Use appropriate logger method
   - Preserve message content and additional arguments

### Examples

**Before:**
```typescript
console.log('[DEBUG][Store] Processing AST with', ast.length, 'nodes');
console.error('[ERROR][Store] Render failed:', errorMessage);
```

**After:**
```typescript
const logger = createLogger('Store');
logger.debug('Processing AST with', ast.length, 'nodes');
logger.error('Render failed:', errorMessage);
```

## Configuration

### Environment-Specific Behavior

**Development Mode:**
- Pretty formatting with colors
- All log levels displayed
- File position information included
- Optimized for readability

**Production Mode:**
- JSON formatting for log aggregation
- `hideLogPositionForProduction` enabled
- Optimized for performance
- Structured output for monitoring

### Custom Configuration

```typescript
import { createLogger } from '../../../shared/services/logger.service';

// Custom logger with specific configuration
const logger = createLogger('ComponentName', {
  minLevel: 2, // Only show INFO and above
  pretty: false, // Force JSON output
  hideLogPosition: true, // Hide file positions
});
```

## Performance Considerations

### Production Optimization

- tslog automatically optimizes for production builds
- `hideLogPositionForProduction` reduces overhead
- Structured JSON output for efficient processing
- Minimal performance impact on render times

### Development Features

- Rich formatting with colors and timestamps
- File position information for debugging
- Stack trace support for errors
- Structured data logging

## Integration with Existing Architecture

### Bulletproof-React Alignment

- Logger service located in `src/shared/services/`
- Follows single responsibility principle
- Provides typed interfaces
- Co-located with other shared services

### TDD Methodology Support

- Comprehensive test coverage in `logger.service.test.ts`
- Real implementation testing (no mocks)
- Performance testing for render targets
- Integration testing with existing patterns

### Error Handling Integration

```typescript
import { createLogger } from '../../../shared/services/logger.service';
import type { Result } from '../../../shared/types/result.types';

const logger = createLogger('ServiceName');

function processData(data: unknown[]): Result<ProcessedData, string> {
  logger.debug('Processing data', { count: data.length });
  
  try {
    const result = performProcessing(data);
    logger.info('Processing completed successfully');
    return { success: true, data: result };
  } catch (error) {
    logger.error('Processing failed', error);
    return { success: false, error: error.message };
  }
}
```

## Best Practices

### Component Naming

- Use descriptive component names that match the service/component purpose
- Maintain consistent naming conventions across the application
- Examples: `'Store'`, `'MonacoEditor'`, `'R3FRenderer'`, `'ASTParser'`

### Message Formatting

- Use clear, descriptive messages
- Include relevant context data as additional arguments
- Avoid redundant information already provided by tslog

### Structured Logging

```typescript
// Good: Structured data with context
logger.debug('AST parsing completed', {
  nodeCount: ast.length,
  parseTime: `${duration}ms`,
  hasErrors: errors.length > 0
});

// Avoid: String concatenation
logger.debug(`AST parsing completed with ${ast.length} nodes in ${duration}ms`);
```

## Vite Integration

### Build Configuration

tslog is properly integrated with Vite 6.0.0:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['tslog'], // Pre-bundled for faster dev startup
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          utils: ['zustand', 'clsx', 'class-variance-authority', 'tslog'],
        },
      },
    },
  },
});
```

### ESM Compatibility

- Full ESM support with Vite 6.0.0
- Tree-shaking enabled for optimal bundle size
- No additional configuration required

## Testing

### Test File Exceptions

Keep `console.log` in test files for debugging:

```typescript
// In test files, this is acceptable
describe('Component Tests', () => {
  it('should work correctly', () => {
    console.log('[DEBUG][Test] Running test scenario');
    // Test implementation
  });
});
```

### Logger Service Testing

```typescript
import { createLogger } from './logger.service';

describe('Logger Integration', () => {
  it('should maintain existing patterns', () => {
    const logger = createLogger('TestComponent');
    logger.debug('Test message');
    
    // Verify tslog output contains expected patterns
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG][TestComponent]')
    );
  });
});
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure correct import path from shared services
2. **Pattern Mismatch**: Verify component name matches expected format
3. **Performance Impact**: Check production configuration is enabled

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const logger = createLogger('ComponentName', {
  minLevel: 0, // Show all log levels
  pretty: true, // Enable pretty formatting
});
```

## Reference

- **Main Implementation**: `src/shared/services/logger.service.ts`
- **Test Examples**: `src/shared/services/logger.service.test.ts`
- **Vite Configuration**: `vite.config.ts`
- **Official Documentation**: [tslog GitHub](https://github.com/fullstack-build/tslog)
- **Project Guidelines**: `.augment-guidelines` (tslog-integration section)
