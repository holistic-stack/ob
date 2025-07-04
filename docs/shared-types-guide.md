# Shared Types System Guide

This guide explains the new shared types system that eliminates duplication and ensures consistent type usage across all features in the OpenSCAD 3D visualization application.

## Overview

The shared types system provides:
- **Consistent AST node interfaces** across parser, renderer, and other AST-consuming modules
- **Standardized operation result patterns** with rich metadata and error handling
- **Type-safe utilities** for common operations and transformations
- **Single Responsibility Principle (SRP) alignment** by separating concerns into focused type modules

## Module Structure

```
src/shared/types/
├── index.ts              # Central export point
├── ast.types.ts          # AST node interfaces and utilities
├── operations.types.ts   # Operation results and metadata
├── result.types.ts       # Basic result types and error handling
├── functional.types.ts   # Functional programming utilities
├── common.types.ts       # Application-wide common types
└── utils.ts             # Type utilities and helpers
```

## AST Types (`ast.types.ts`)

### Core Interfaces

All AST nodes now extend `CoreNode`:

```typescript
import { CoreNode, ParentNode, BaseExpressionNode } from '@/shared/types';

// All nodes have consistent structure
interface MyCustomNode extends CoreNode {
  type: 'my_custom';
  // ... custom properties
}

// Nodes with children extend ParentNode
interface ContainerNode extends ParentNode {
  type: 'container';
  children: ReadonlyArray<CoreNode>;
}

// Expression nodes extend BaseExpressionNode
interface MyExpressionNode extends BaseExpressionNode {
  expressionType: 'my_expression';
  value: string;
}
```

### Node Metadata

Rich metadata tracking for optimization and debugging:

```typescript
import { NodeMetadata, nodeUtils } from '@/shared/types';

// Create metadata for a node
const metadata: NodeMetadata = nodeUtils.createMetadata(
  nodeUtils.generateNodeId(),
  nodeUtils.createNodeType('cube'),
  {
    depth: 2,
    complexity: 10,
    isOptimized: true
  }
);
```

### Traversal and Queries

Type-safe node traversal:

```typescript
import { nodeUtils } from '@/shared/types';

// Find all cube nodes in an AST
const cubeNodes = nodeUtils.findNodes(rootNode, (node): node is CubeNode => 
  node.type === 'cube'
);

// Get children safely
const children = nodeUtils.getChildren(someNode);

// Check node types
if (nodeUtils.isExpression(node)) {
  console.log('Expression type:', node.expressionType);
}
```

## Operation Types (`operations.types.ts`)

### Enhanced Results

Replace basic `Result<T, E>` with rich `OperationResult<T, E>`:

```typescript
import { OperationResult, operationUtils } from '@/shared/types';

// Old way
function parseCode(code: string): Result<ASTNode[], string> {
  // ...
}

// New way
function parseCode(code: string): OperationResult<ASTNode[], OperationError> {
  const operationId = operationUtils.generateOperationId();
  const metadata = operationUtils.createMetadata(
    operationId,
    operationUtils.createOperationType('parse')
  );

  try {
    const ast = performParsing(code);
    return operationUtils.createSuccess(ast, metadata);
  } catch (error) {
    const operationError = operationUtils.createOperationError(
      'PARSE_ERROR',
      error.message,
      { recoverable: true }
    );
    return operationUtils.createError(operationError, metadata);
  }
}
```

### Operation Metadata

Track detailed operation information:

```typescript
import { OperationMetadata, OperationMetrics } from '@/shared/types';

interface MyOperationMetrics extends OperationMetrics {
  linesProcessed: number;
  nodesGenerated: number;
}

const metadata: OperationMetadata = {
  id: operationUtils.generateOperationId(),
  type: operationUtils.createOperationType('parse'),
  status: 'running',
  priority: 'high',
  startTime: new Date(),
  retryCount: 0,
  maxRetries: 3,
  tags: ['parsing', 'ast'],
  context: { userId: 'user123' }
};
```

### Batch Operations

Handle multiple operations with consistent patterns:

```typescript
import { BatchOperation, OperationScheduler } from '@/shared/types';

const batchOperations: BatchOperation<string, ASTNode[], OperationError>[] = [
  {
    id: operationUtils.generateOperationId(),
    input: 'cube(10);',
    operation: (code) => parseCode(code),
    timeout: 5000
  },
  // ... more operations
];

const scheduler: OperationScheduler = getScheduler();
const results = await scheduler.scheduleBatch(batchOperations);
```

## Utilities (`utils.ts`)

### Node Utilities

```typescript
import { nodeUtils } from '@/shared/types';

// Generate unique IDs
const nodeId = nodeUtils.generateNodeId();

// Type checking
if (nodeUtils.hasChildren(node)) {
  const children = nodeUtils.getChildren(node);
}

// Calculate metrics
const depth = nodeUtils.calculateDepth(node, rootNode);
const descendants = nodeUtils.countDescendants(node);
```

### Operation Utilities

```typescript
import { operationUtils } from '@/shared/types';

// Working with operation results
const result = await someOperation();

if (operationUtils.isSuccess(result)) {
  const data = operationUtils.getData(result);
  const metadata = operationUtils.getMetadata(result);
} else {
  const error = operationUtils.getError(result);
  console.error('Operation failed:', error.message);
}
```

### Validation Utilities

```typescript
import { validationUtils } from '@/shared/types';

// Validate node structure
const nodeErrors = validationUtils.validateNode(someNode);
if (nodeErrors.length > 0) {
  console.error('Node validation errors:', nodeErrors);
}

// Validate operation metadata
const metadataErrors = validationUtils.validateOperationMetadata(metadata);
```

## Migration Guide

### From Basic Result Types

**Before:**
```typescript
function renderMesh(node: ASTNode): Result<THREE.Mesh, string> {
  try {
    const mesh = createMesh(node);
    return { success: true, data: mesh };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**After:**
```typescript
import { OperationResult, operationUtils } from '@/shared/types';

function renderMesh(node: CoreNode): OperationResult<THREE.Mesh, OperationError> {
  const operationId = operationUtils.generateOperationId();
  const metadata = operationUtils.createMetadata(
    operationId,
    operationUtils.createOperationType('render')
  );

  try {
    const mesh = createMesh(node);
    return operationUtils.createSuccess(mesh, metadata);
  } catch (error) {
    const operationError = operationUtils.createOperationError(
      'RENDER_ERROR',
      error.message,
      { recoverable: false, stack: error.stack }
    );
    return operationUtils.createError(operationError, metadata);
  }
}
```

### From Custom Node Interfaces

**Before:**
```typescript
// Duplicated in multiple files
interface MyNode {
  type: string;
  location?: { start: Position; end: Position };
  // ... custom properties
}
```

**After:**
```typescript
import { CoreNode } from '@/shared/types';

interface MyNode extends CoreNode {
  // type and location are inherited
  // ... only custom properties
}
```

### From Manual Error Handling

**Before:**
```typescript
interface ParseError {
  message: string;
  line?: number;
  code?: string;
}

function parse(code: string): Result<ASTNode[], ParseError> {
  // Manual error creation
}
```

**After:**
```typescript
import { OperationResult, OperationError, operationUtils } from '@/shared/types';

function parse(code: string): OperationResult<CoreNode[], OperationError> {
  // Standardized error handling with rich metadata
}
```

## Best Practices

### 1. Always Use Shared Types

```typescript
// ✅ Good - Use shared types
import { CoreNode, OperationResult } from '@/shared/types';

// ❌ Bad - Define custom types that duplicate functionality
interface MyNode { type: string; /* ... */ }
```

### 2. Include Operation Metadata

```typescript
// ✅ Good - Rich metadata
const result = operationUtils.createSuccess(data, metadata, metrics);

// ❌ Bad - Basic result without context
return { success: true, data };
```

### 3. Use Type Guards

```typescript
// ✅ Good - Type-safe checking
if (nodeUtils.isExpression(node)) {
  // TypeScript knows node is BaseExpressionNode
}

// ❌ Bad - Manual type checking
if (node.type === 'expression') {
  // TypeScript doesn't know the specific type
}
```

### 4. Leverage Utilities

```typescript
// ✅ Good - Use provided utilities
const nodeId = nodeUtils.generateNodeId();

// ❌ Bad - Manual ID generation
const nodeId = `node_${Math.random()}`;
```

## Error Handling Patterns

### Recoverable vs Non-Recoverable Errors

```typescript
// Recoverable error - parsing can be retried
const parseError = operationUtils.createOperationError(
  'SYNTAX_ERROR',
  'Missing semicolon',
  { recoverable: true, retryAfter: 100 }
);

// Non-recoverable error - system failure
const systemError = operationUtils.createOperationError(
  'OUT_OF_MEMORY',
  'Insufficient memory to complete operation',
  { recoverable: false }
);
```

### Error Chaining

```typescript
const rootCause = operationUtils.createOperationError(
  'NETWORK_ERROR',
  'Connection timeout'
);

const wrappedError = operationUtils.createOperationError(
  'PARSE_ERROR',
  'Failed to fetch and parse remote module',
  { cause: rootCause }
);
```

## Performance Considerations

### 1. Metadata Collection

Only collect detailed metadata when needed:

```typescript
const config = {
  metrics: {
    enabled: process.env.NODE_ENV !== 'production',
    detailLevel: 'basic'
  }
};
```

### 2. Batch Operations

Use batch operations for multiple related tasks:

```typescript
// ✅ Good - Batch related operations
const results = await scheduler.scheduleBatch(operations);

// ❌ Bad - Individual operations
const results = await Promise.all(operations.map(op => scheduler.schedule(op)));
```

### 3. Node Traversal

Use efficient traversal patterns:

```typescript
// ✅ Good - Single traversal with multiple predicates
const results = nodeUtils.findNodes(root, node => 
  node.type === 'cube' || node.type === 'sphere'
);

// ❌ Bad - Multiple traversals
const cubes = nodeUtils.findNodes(root, node => node.type === 'cube');
const spheres = nodeUtils.findNodes(root, node => node.type === 'sphere');
```

## Testing with Shared Types

### Mock Utilities

```typescript
import { nodeUtils, operationUtils } from '@/shared/types';

// Mock node creation
const mockNode = {
  type: 'cube',
  id: nodeUtils.generateNodeId(),
  location: locationUtils.createLocation(
    locationUtils.createPosition(0, 0, 0),
    locationUtils.createPosition(0, 10, 10)
  )
} as CoreNode;

// Mock operation results
const mockSuccess = operationUtils.createSuccess(
  mockData,
  operationUtils.createMetadata(
    operationUtils.generateOperationId(),
    operationUtils.createOperationType('test')
  )
);
```

### Type Assertions

```typescript
// Type-safe testing
expect(nodeUtils.isExpression(result)).toBe(true);
expect(operationUtils.isSuccess(operationResult)).toBe(true);
```

This shared types system ensures consistency, reduces duplication, and provides rich metadata for debugging and optimization across the entire application.
