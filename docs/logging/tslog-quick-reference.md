# tslog Quick Reference

## Setup

```typescript
import { createLogger } from '../../../shared/services/logger.service';
const logger = createLogger('ComponentName');
```

## Basic Usage

```typescript
// Initialization
logger.init('Component initialized successfully');

// Debug information
logger.debug('Processing data', { count: 42 });

// General information
logger.info('Operation completed');

// Warnings
logger.warn('Performance warning detected');

// Errors
logger.error('Operation failed', error);

// Completion
logger.end('Component cleanup completed');
```

## Migration Patterns

| Old | New |
|-----|-----|
| `console.log('[DEBUG][Component]', msg)` | `logger.debug(msg)` |
| `console.error('[ERROR][Component]', msg)` | `logger.error(msg)` |
| `console.warn('[WARN][Component]', msg)` | `logger.warn(msg)` |
| `console.info('[INFO][Component]', msg)` | `logger.info(msg)` |

## Configuration

```typescript
// Custom configuration
const logger = createLogger('ComponentName', {
  minLevel: 2,           // INFO and above only
  pretty: false,         // JSON output
  hideLogPosition: true  // Hide file positions
});
```

## Environment Behavior

- **Development**: Pretty formatting, all levels, file positions
- **Production**: JSON output, optimized performance, no file positions

## Best Practices

✅ **Do:**
- Use descriptive component names
- Include structured data as additional arguments
- Maintain consistent naming conventions
- Keep console.log in test files

❌ **Don't:**
- Include manual [TAG][ComponentName] prefixes
- Use string concatenation for structured data
- Replace console.log in dev-tools or workers
- Use console.log in production code

## Performance

- **Render Target**: <16ms maintained
- **Bundle Size**: Included in utils chunk
- **Production**: Optimized with hideLogPositionForProduction

## Files

- **Service**: `src/shared/services/logger.service.ts`
- **Tests**: `src/shared/services/logger.service.test.ts`
- **Config**: `vite.config.ts`
- **Docs**: `docs/logging/tslog-integration.md`
