# API Migration Guide

## Overview

This guide covers API changes and migration patterns for OpenSCAD Babylon. Whether you're upgrading between versions or migrating from other libraries, this guide provides detailed information about breaking changes and migration strategies.

## Version Migration

### From v0.x to v1.0

#### Breaking Changes Summary
- Parser API now returns Result types instead of throwing exceptions
- Component props have been renamed for consistency
- Error handling patterns have changed to functional approach
- Hook return types have been updated for better type safety

#### Parser API Changes

**Before (v0.x):**
```typescript
import { OpenSCADParser } from 'openscad-babylon';

try {
  const parser = new OpenSCADParser();
  await parser.initialize();
  const ast = parser.parse(code);
  console.log('Parsed successfully:', ast);
} catch (error) {
  console.error('Parse failed:', error.message);
}
```

**After (v1.0):**
```typescript
import { OpenscadParser } from 'openscad-babylon';

const parser = new OpenscadParser();
await parser.init(); // Renamed method

const result = parser.parseASTWithResult(code); // New Result-based method
if (result.success) {
  console.log('Parsed successfully:', result.data);
} else {
  console.error('Parse failed:', result.error.message);
  // Access to detailed error information
  console.error('Error code:', result.error.code);
  if (result.error.line) {
    console.error('Line:', result.error.line);
  }
}
```

#### Component Prop Changes

**Before (v0.x):**
```typescript
import { OpenSCADViewer } from 'openscad-babylon';

<OpenSCADViewer 
  code="cube([1,1,1]);"
  width={800}
  height={600}
  onError={(error) => console.error(error)}
  onSuccess={(ast) => console.log(ast)}
/>
```

**After (v1.0):**
```typescript
import { BabylonCanvas } from 'openscad-babylon';

<BabylonCanvas 
  openscadCode="cube([1,1,1]);" // Renamed prop
  width={800}
  height={600}
  onRenderError={(error) => console.error(error)} // Renamed prop
  onSceneReady={(scene) => console.log(scene)} // New prop
  enableSelection={true} // New feature
  enableExport={true} // New feature
/>
```

#### Hook Changes

**Before (v0.x):**
```typescript
import { useOpenSCAD } from 'openscad-babylon';

const { parse, ast, error, isLoading } = useOpenSCAD();

// Usage
parse(code);
if (error) {
  console.error('Error:', error);
} else if (ast) {
  console.log('AST:', ast);
}
```

**After (v1.0):**
```typescript
import { useOpenSCADParser } from 'openscad-babylon';

const { 
  parseCode, 
  lastParseResult, 
  lastParseError, 
  isParsing 
} = useOpenSCADParser();

// Usage
await parseCode(code);
if (lastParseError) {
  console.error('Error:', lastParseError.message);
  console.error('Code:', lastParseError.code);
} else if (lastParseResult) {
  console.log('AST:', lastParseResult);
}
```

## Error Handling Migration

### Exception-Based to Result-Based

**Old Pattern (Exceptions):**
```typescript
async function processOpenSCAD(code: string) {
  try {
    const ast = await parseCode(code);
    const mesh = await convertToMesh(ast);
    const exported = await exportMesh(mesh, 'stl');
    return exported;
  } catch (error) {
    console.error('Operation failed:', error.message);
    throw error; // Re-throw for caller
  }
}
```

**New Pattern (Result Types):**
```typescript
async function processOpenSCAD(code: string): Promise<Result<ExportResult, ProcessingError>> {
  const parseResult = await parseCode(code);
  if (!parseResult.success) {
    return parseResult; // Error propagates automatically
  }

  const meshResult = await convertToMesh(parseResult.data);
  if (!meshResult.success) {
    return meshResult;
  }

  const exportResult = await exportMesh(meshResult.data, 'stl');
  return exportResult;
}

// Usage
const result = await processOpenSCAD(code);
if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Failed:', result.error.message);
  // Handle specific error types
  switch (result.error.code) {
    case 'PARSE_FAILED':
      // Handle parse errors
      break;
    case 'CONVERSION_FAILED':
      // Handle conversion errors
      break;
    case 'EXPORT_FAILED':
      // Handle export errors
      break;
  }
}
```

### Functional Composition with Results

**Chain Operations:**
```typescript
import { pipe, map, flatMap } from 'openscad-babylon/utils';

const processCodeFunctional = (code: string) =>
  pipe(
    parseCode(code),
    flatMap(ast => validateAST(ast)),
    flatMap(validAst => convertToMesh(validAst)),
    map(mesh => optimizeMesh(mesh))
  );
```

## Component Migration Patterns

### Selection Integration

**Before (Manual Selection):**
```typescript
function MyViewer() {
  const [selectedMesh, setSelectedMesh] = useState(null);
  
  const handleMeshClick = (mesh) => {
    setSelectedMesh(mesh);
    // Manual highlighting logic
    mesh.material.emissiveColor = new Color3(1, 1, 0);
  };

  return (
    <OpenSCADViewer 
      code={code}
      onMeshClick={handleMeshClick}
    />
  );
}
```

**After (Built-in Selection):**
```typescript
import { BabylonCanvas, SelectionInfo, useSelection } from 'openscad-babylon';

function MyViewer() {
  const [scene, setScene] = useState(null);
  const { selectedMeshes, clearSelection } = useSelection(scene);

  return (
    <div>
      <BabylonCanvas 
        openscadCode={code}
        onSceneReady={setScene}
        enableSelection={true}
      />
      <SelectionInfo 
        scene={scene}
        selectedMeshes={selectedMeshes}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
```

### Export Integration

**Before (Manual Export):**
```typescript
function ExportButton({ scene }) {
  const handleExport = async () => {
    try {
      const meshes = scene.meshes;
      const stlData = await convertToSTL(meshes);
      downloadFile(stlData, 'model.stl');
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  return <button onClick={handleExport}>Export STL</button>;
}
```

**After (Built-in Export):**
```typescript
import { ExportDialog, useExport } from 'openscad-babylon';

function ExportControls({ scene }) {
  const [showDialog, setShowDialog] = useState(false);
  const { exportScene, isExporting } = useExport(scene);

  const handleQuickExport = async () => {
    const result = await exportScene({
      format: 'stl',
      filename: 'model.stl',
      binary: true
    });
    
    if (result.success) {
      console.log('Export completed:', result.data.filename);
    } else {
      console.error('Export failed:', result.error.message);
    }
  };

  return (
    <div>
      <button onClick={handleQuickExport} disabled={isExporting}>
        Quick Export STL
      </button>
      <button onClick={() => setShowDialog(true)}>
        Export Options...
      </button>
      
      <ExportDialog 
        scene={scene}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
```

## TypeScript Migration

### Type Definitions Update

**Before (v0.x):**
```typescript
interface ParseResult {
  ast?: ASTNode[];
  error?: string;
}

interface ViewerProps {
  code: string;
  width?: number;
  height?: number;
  onError?: (error: string) => void;
  onSuccess?: (ast: ASTNode[]) => void;
}
```

**After (v1.0):**
```typescript
// Result types for better error handling
type ParseResult = Result<ASTNode[], ParseError>;

interface ParseError {
  readonly code: 'PARSE_FAILED' | 'INVALID_INPUT' | 'GRAMMAR_ERROR';
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly timestamp: Date;
}

interface BabylonCanvasProps {
  readonly openscadCode?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onRenderError?: (error: RenderError) => void;
  readonly enableSelection?: boolean;
  readonly enableExport?: boolean;
}
```

### Generic Type Updates

**Before (Loose Typing):**
```typescript
function processData(data: any): any {
  // Process data
  return result;
}
```

**After (Strict Typing):**
```typescript
function processData<T, E>(data: T): Result<ProcessedData<T>, ProcessingError<E>> {
  // Type-safe processing
  return success(processedData);
}
```

## Testing Migration

### Test Pattern Updates

**Before (Exception Testing):**
```typescript
describe('OpenSCAD Parser', () => {
  it('should parse valid code', async () => {
    const parser = new OpenSCADParser();
    await parser.initialize();
    
    expect(() => parser.parse('cube([1,1,1]);')).not.toThrow();
  });

  it('should throw on invalid code', async () => {
    const parser = new OpenSCADParser();
    await parser.initialize();
    
    expect(() => parser.parse('invalid')).toThrow();
  });
});
```

**After (Result Testing):**
```typescript
describe('OpenSCAD Parser', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should parse valid code', () => {
    const result = parser.parseASTWithResult('cube([1,1,1]);');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('primitive');
    }
  });

  it('should handle invalid code gracefully', () => {
    const result = parser.parseASTWithResult('invalid');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBeDefined();
      expect(result.error.message).toBeDefined();
    }
  });
});
```

## Automated Migration Tools

### Migration Scripts

**Package.json Scripts:**
```json
{
  "scripts": {
    "migrate:api": "npx @openscad-babylon/migrate api",
    "migrate:components": "npx @openscad-babylon/migrate components",
    "migrate:tests": "npx @openscad-babylon/migrate tests",
    "migrate:all": "npm run migrate:api && npm run migrate:components && npm run migrate:tests"
  }
}
```

### Codemod Transformations

**Transform Component Props:**
```bash
npx @openscad-babylon/codemod transform-props src/
```

**Transform Error Handling:**
```bash
npx @openscad-babylon/codemod transform-error-handling src/
```

**Transform Hook Usage:**
```bash
npx @openscad-babylon/codemod transform-hooks src/
```

## Migration Checklist

### API Migration
- [ ] Update parser method calls to use Result types
- [ ] Rename component props according to new API
- [ ] Update hook usage patterns
- [ ] Migrate error handling to functional patterns
- [ ] Update TypeScript type definitions

### Testing Migration
- [ ] Update test patterns for Result types
- [ ] Migrate to Vitest from Jest (if applicable)
- [ ] Update mock patterns for new APIs
- [ ] Add tests for new error handling patterns

### Performance Migration
- [ ] Profile before and after migration
- [ ] Optimize for new performance characteristics
- [ ] Update performance monitoring
- [ ] Validate memory usage patterns

### Documentation Migration
- [ ] Update code examples in documentation
- [ ] Update API reference documentation
- [ ] Update integration guides
- [ ] Update troubleshooting guides

## Support and Resources

- [API Reference](../api/README.md) - Complete API documentation
- [Migration Tools](https://github.com/openscad-babylon/migration-tools) - Automated migration utilities
- [Community Support](https://github.com/openscad-babylon/discussions) - Migration questions and support
- [Professional Services](mailto:support@openscad-babylon.com) - Enterprise migration assistance
