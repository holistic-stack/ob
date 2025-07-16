# BabylonJS Renderer API Documentation

## Overview

The BabylonJS Renderer provides comprehensive 3D rendering capabilities for OpenSCAD models. It converts AST nodes into BabylonJS meshes, handles CSG operations, and manages the 3D scene with selection, export, and interaction features.

## Core Services

### `ASTBridgeConverter`

Converts OpenSCAD AST nodes into BabylonJS-compatible representations.

#### Constructor

```typescript
constructor(scene: Scene)
```

Creates a new AST converter for the specified BabylonJS scene.

**Parameters:**
- `scene: Scene` - The BabylonJS scene to render into

#### Methods

##### `initialize(): Promise<Result<void, ConversionError>>`

Initializes the converter with required dependencies and CSG libraries.

**Example:**
```typescript
const converter = new ASTBridgeConverter(scene);
const result = await converter.initialize();

if (result.success) {
  console.log('Converter ready');
} else {
  console.error('Initialization failed:', result.error.message);
}
```

---

##### `convertAST(nodes: readonly ASTNode[]): Promise<Result<BabylonNode[], ConversionError>>`

Converts an array of AST nodes into BabylonJS-compatible node representations.

**Parameters:**
- `nodes: readonly ASTNode[]` - Array of AST nodes to convert

**Returns:**
- `Promise<Result<BabylonNode[], ConversionError>>` - Success with BabylonJS nodes or conversion error

**Example:**
```typescript
const astNodes = parser.parseASTWithResult('cube([2, 2, 2]);').data;
const result = await converter.convertAST(astNodes);

if (result.success) {
  const babylonNodes = result.data;
  console.log('Converted nodes:', babylonNodes);
} else {
  console.error('Conversion failed:', result.error.message);
}
```

---

##### `dispose(): void`

Cleans up converter resources and disposes of internal state.

### `SelectionService`

Manages 3D object selection, highlighting, and interaction.

#### Constructor

```typescript
constructor(scene: Scene, config?: Partial<SelectionConfig>)
```

Creates a new selection service for the specified scene.

**Parameters:**
- `scene: Scene` - The BabylonJS scene
- `config?: Partial<SelectionConfig>` - Optional configuration

#### Methods

##### `initialize(): Promise<Result<void, SelectionError>>`

Initializes the selection service with event handlers and highlighting.

**Example:**
```typescript
const selectionService = new SelectionService(scene);
await selectionService.initialize();
```

---

##### `selectMesh(mesh: AbstractMesh, options?: SelectionOptions): Result<void, SelectionError>`

Selects a mesh with optional configuration.

**Parameters:**
- `mesh: AbstractMesh` - The mesh to select
- `options?: SelectionOptions` - Selection options

**Example:**
```typescript
const result = selectionService.selectMesh(cubeMesh, {
  addToSelection: true,
  triggerEvents: true
});

if (result.success) {
  console.log('Mesh selected');
} else {
  console.error('Selection failed:', result.error.message);
}
```

---

##### `getSelectedMeshes(): readonly AbstractMesh[]`

Returns currently selected meshes.

**Example:**
```typescript
const selected = selectionService.getSelectedMeshes();
console.log(`${selected.length} meshes selected`);
```

---

##### `clearSelection(): Result<void, SelectionError>`

Clears all current selections.

**Example:**
```typescript
selectionService.clearSelection();
```

### `ExportService`

Handles 3D model export to various formats.

#### Constructor

```typescript
constructor(scene: Scene, progressService?: ProgressService)
```

Creates a new export service for the specified scene.

#### Methods

##### `exportMeshes(meshes: readonly AbstractMesh[], config: ExportConfig, onProgress?: ExportProgressCallback): Promise<Result<ExportResult, ExportError>>`

Exports selected meshes to the specified format.

**Parameters:**
- `meshes: readonly AbstractMesh[]` - Meshes to export
- `config: ExportConfig` - Export configuration
- `onProgress?: ExportProgressCallback` - Progress callback

**Example:**
```typescript
const config: ExportConfig = {
  format: 'stl',
  filename: 'my-model.stl',
  binary: true,
  quality: 'high'
};

const result = await exportService.exportMeshes(selectedMeshes, config, (progress) => {
  console.log(`Export progress: ${progress}%`);
});

if (result.success) {
  console.log('Export completed:', result.data.filename);
} else {
  console.error('Export failed:', result.error.message);
}
```

---

##### `getSupportedFormats(): readonly ExportFormat[]`

Returns list of supported export formats.

**Example:**
```typescript
const formats = exportService.getSupportedFormats();
console.log('Supported formats:', formats); // ['stl', '3mf', 'gltf', 'glb']
```

## React Hooks

### `useSelection(scene: Scene | null): UseSelectionReturn`

React hook for managing 3D object selection.

**Parameters:**
- `scene: Scene | null` - BabylonJS scene

**Returns:**
- `UseSelectionReturn` - Selection state and methods

**Example:**
```typescript
function SelectionComponent({ scene }: { scene: Scene }) {
  const {
    selectedMeshes,
    selectedMeshInfos,
    hoveredMesh,
    clearSelection,
    isMultiSelection
  } = useSelection(scene);

  return (
    <div>
      <p>{selectedMeshes.length} objects selected</p>
      <button onClick={clearSelection}>Clear Selection</button>
    </div>
  );
}
```

### `useExport(scene: Scene | null): UseExportReturn`

React hook for managing 3D model export.

**Example:**
```typescript
function ExportComponent({ scene }: { scene: Scene }) {
  const {
    exportMeshes,
    exportScene,
    isExporting,
    exportProgress,
    getSupportedFormats
  } = useExport(scene);

  const handleExport = async () => {
    const config = {
      format: 'stl' as const,
      filename: 'model.stl'
    };
    
    await exportMeshes(selectedMeshes, config);
  };

  return (
    <div>
      <button onClick={handleExport} disabled={isExporting}>
        Export STL
      </button>
      {isExporting && <p>Progress: {exportProgress}%</p>}
    </div>
  );
}
```

## React Components

### `SelectionInfo`

Component for displaying information about selected objects.

**Props:**
```typescript
interface SelectionInfoProps {
  readonly scene: Scene | null;
  readonly selectedMeshes?: readonly AbstractMesh[];
  readonly showMetadata?: boolean;
  readonly showStatistics?: boolean;
  readonly showBoundingBox?: boolean;
  readonly onClearSelection?: () => void;
  readonly onSelectMesh?: (mesh: AbstractMesh) => void;
}
```

**Example:**
```typescript
<SelectionInfo 
  scene={scene}
  selectedMeshes={selectedMeshes}
  showMetadata={true}
  showBoundingBox={true}
  onClearSelection={() => console.log('Selection cleared')}
/>
```

### `ExportDialog`

Component for configuring and initiating 3D model exports.

**Props:**
```typescript
interface ExportDialogProps {
  readonly scene: Scene | null;
  readonly selectedMeshes?: readonly AbstractMesh[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onExportComplete?: (result: ExportResult) => void;
  readonly onExportError?: (error: string) => void;
}
```

**Example:**
```typescript
<ExportDialog 
  scene={scene}
  selectedMeshes={selectedMeshes}
  isOpen={showExportDialog}
  onClose={() => setShowExportDialog(false)}
  onExportComplete={(result) => {
    console.log('Export completed:', result.filename);
    setShowExportDialog(false);
  }}
/>
```

## Type Definitions

### `BabylonNode`

Represents a converted AST node ready for BabylonJS rendering.

```typescript
interface BabylonNode {
  readonly type: string;
  readonly metadata?: {
    readonly openscadType?: string;
    readonly parameters?: Record<string, unknown>;
    readonly transform?: string;
    readonly operation?: string;
  };
}
```

### `SelectionConfig`

Configuration for selection behavior.

```typescript
interface SelectionConfig {
  readonly mode: 'single' | 'multi';
  readonly enableHover: boolean;
  readonly highlightType: 'outline' | 'wireframe';
  readonly highlightColor: Color3;
  readonly hoverColor: Color3;
  readonly maxSelections?: number;
}
```

### `ExportConfig`

Configuration for export operations.

```typescript
interface ExportConfig {
  readonly format: 'stl' | '3mf' | 'gltf' | 'glb';
  readonly filename: string;
  readonly quality?: 'low' | 'medium' | 'high' | 'ultra';
  readonly binary?: boolean;
  readonly includeTextures?: boolean;
  readonly includeAnimations?: boolean;
  readonly precision?: number;
}
```

## Usage Patterns

### Complete Pipeline

```typescript
import { OpenscadParser } from './openscad-parser';
import { ASTBridgeConverter } from './babylon-renderer';

async function renderOpenSCAD(code: string, scene: Scene) {
  // Parse OpenSCAD code
  const parser = new OpenscadParser();
  await parser.init();
  
  const parseResult = parser.parseASTWithResult(code);
  if (!parseResult.success) {
    throw new Error(`Parse failed: ${parseResult.error.message}`);
  }
  
  // Convert to BabylonJS
  const converter = new ASTBridgeConverter(scene);
  await converter.initialize();
  
  const convertResult = await converter.convertAST(parseResult.data);
  if (!convertResult.success) {
    throw new Error(`Conversion failed: ${convertResult.error.message}`);
  }
  
  // Cleanup
  parser.dispose();
  converter.dispose();
  
  return convertResult.data;
}
```

### Selection and Export Workflow

```typescript
function useCADWorkflow(scene: Scene) {
  const { selectedMeshes, selectMesh, clearSelection } = useSelection(scene);
  const { exportMeshes, isExporting } = useExport(scene);
  
  const handleExport = async () => {
    if (selectedMeshes.length === 0) {
      alert('No objects selected');
      return;
    }
    
    const config = {
      format: 'stl' as const,
      filename: 'selected-objects.stl',
      binary: true
    };
    
    const result = await exportMeshes(selectedMeshes, config);
    if (result.success) {
      console.log('Export completed');
    } else {
      console.error('Export failed:', result.error.message);
    }
  };
  
  return { selectedMeshes, selectMesh, clearSelection, handleExport, isExporting };
}
```

## Performance Considerations

- **Scene Management**: Dispose of unused meshes to prevent memory leaks
- **Selection**: Use efficient picking algorithms for large scenes
- **Export**: Large models may require progress tracking and chunking
- **CSG Operations**: Complex boolean operations can be computationally expensive

## Error Handling

All services use Result types for comprehensive error handling:

```typescript
if (result.success) {
  // Handle success case
  const data = result.data;
} else {
  // Handle error case
  const error = result.error;
  console.error(`${error.code}: ${error.message}`);
}
```
