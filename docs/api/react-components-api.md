# React Components API Documentation

## Overview

The React Components API provides a comprehensive set of components and hooks for building OpenSCAD-based 3D applications. These components handle 3D rendering, user interaction, progress tracking, and export functionality with full TypeScript support.

## Core Components

### `BabylonCanvas`

Main 3D rendering canvas component that displays OpenSCAD models.

**Props:**
```typescript
interface BabylonCanvasProps {
  readonly openscadCode?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onRenderError?: (error: Error) => void;
  readonly enableSelection?: boolean;
  readonly enableExport?: boolean;
  readonly className?: string;
  readonly 'data-testid'?: string;
}
```

**Example:**
```typescript
function CADViewer() {
  const [code, setCode] = useState('cube([2, 2, 2]);');
  const [scene, setScene] = useState<Scene | null>(null);

  return (
    <BabylonCanvas
      openscadCode={code}
      width="100%"
      height="600px"
      onSceneReady={setScene}
      onRenderError={(error) => console.error('Render error:', error)}
      enableSelection={true}
      enableExport={true}
      className="cad-canvas"
    />
  );
}
```

### `SelectionInfo`

Displays detailed information about selected 3D objects.

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
  readonly className?: string;
  readonly 'data-testid'?: string;
}
```

**Example:**
```typescript
function SelectionPanel({ scene }: { scene: Scene | null }) {
  const { selectedMeshes, clearSelection } = useSelection(scene);

  return (
    <SelectionInfo
      scene={scene}
      selectedMeshes={selectedMeshes}
      showMetadata={true}
      showBoundingBox={true}
      showStatistics={true}
      onClearSelection={clearSelection}
      onSelectMesh={(mesh) => console.log('Focus on mesh:', mesh.name)}
      className="selection-panel"
    />
  );
}
```

### `ExportDialog`

Modal dialog for configuring and initiating 3D model exports.

**Props:**
```typescript
interface ExportDialogProps {
  readonly scene: Scene | null;
  readonly selectedMeshes?: readonly AbstractMesh[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onExportComplete?: (result: ExportResult) => void;
  readonly onExportError?: (error: string) => void;
  readonly className?: string;
  readonly 'data-testid'?: string;
}
```

**Example:**
```typescript
function ExportControls({ scene }: { scene: Scene | null }) {
  const [showDialog, setShowDialog] = useState(false);
  const { selectedMeshes } = useSelection(scene);

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Export Model
      </button>
      
      <ExportDialog
        scene={scene}
        selectedMeshes={selectedMeshes}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onExportComplete={(result) => {
          console.log('Export completed:', result.filename);
          setShowDialog(false);
        }}
        onExportError={(error) => {
          console.error('Export failed:', error);
        }}
      />
    </>
  );
}
```

### `ProgressBar`

Displays progress for long-running operations like parsing or export.

**Props:**
```typescript
interface ProgressBarProps {
  readonly current: number;
  readonly total: number;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly color?: 'blue' | 'green' | 'red' | 'yellow';
  readonly showPercentage?: boolean;
  readonly showTimeRemaining?: boolean;
  readonly message?: string;
  readonly className?: string;
  readonly 'data-testid'?: string;
}
```

**Example:**
```typescript
function OperationProgress() {
  const { isExporting, exportProgress, exportMessage } = useExport(scene);

  if (!isExporting) return null;

  return (
    <ProgressBar
      current={exportProgress}
      total={100}
      size="md"
      color="blue"
      showPercentage={true}
      message={exportMessage || 'Exporting...'}
      className="export-progress"
    />
  );
}
```

## React Hooks

### `useSelection(scene: Scene | null): UseSelectionReturn`

Hook for managing 3D object selection state and operations.

**Returns:**
```typescript
interface UseSelectionReturn {
  readonly selectedMeshes: readonly AbstractMesh[];
  readonly selectedMeshInfos: readonly SelectedMeshInfo[];
  readonly hoveredMesh: AbstractMesh | null;
  readonly clearSelection: () => void;
  readonly selectMesh: (mesh: AbstractMesh, options?: SelectionOptions) => void;
  readonly deselectMesh: (mesh: AbstractMesh) => void;
  readonly isMultiSelection: boolean;
  readonly selectionMode: SelectionMode;
}
```

**Example:**
```typescript
function SelectionControls({ scene }: { scene: Scene | null }) {
  const {
    selectedMeshes,
    hoveredMesh,
    clearSelection,
    selectMesh,
    isMultiSelection,
    selectionMode
  } = useSelection(scene);

  return (
    <div>
      <p>Selection Mode: {selectionMode}</p>
      <p>Selected: {selectedMeshes.length} objects</p>
      {hoveredMesh && <p>Hovering: {hoveredMesh.name}</p>}
      
      <button onClick={clearSelection}>Clear Selection</button>
      
      {selectedMeshes.map((mesh, index) => (
        <div key={mesh.id}>
          <span>{mesh.name}</span>
          <button onClick={() => selectMesh(mesh)}>Focus</button>
        </div>
      ))}
    </div>
  );
}
```

### `useExport(scene: Scene | null): UseExportReturn`

Hook for managing 3D model export operations.

**Returns:**
```typescript
interface UseExportReturn {
  readonly exportMeshes: (meshes: readonly AbstractMesh[], config: ExportConfig) => Promise<ExportResult>;
  readonly exportScene: (config: ExportConfig) => Promise<ExportResult>;
  readonly isExporting: boolean;
  readonly exportProgress: number;
  readonly exportMessage: string | null;
  readonly lastExportResult: ExportResult | null;
  readonly getSupportedFormats: () => readonly ExportFormat[];
  readonly getDefaultConfig: (format: ExportFormat) => ExportConfig;
  readonly cancelExport: () => void;
}
```

**Example:**
```typescript
function ExportControls({ scene }: { scene: Scene | null }) {
  const {
    exportMeshes,
    exportScene,
    isExporting,
    exportProgress,
    getSupportedFormats,
    getDefaultConfig
  } = useExport(scene);

  const { selectedMeshes } = useSelection(scene);

  const handleQuickExport = async (format: ExportFormat) => {
    const config = getDefaultConfig(format);
    
    if (selectedMeshes.length > 0) {
      await exportMeshes(selectedMeshes, config);
    } else {
      await exportScene(config);
    }
  };

  return (
    <div>
      <h3>Quick Export</h3>
      {getSupportedFormats().map(format => (
        <button
          key={format}
          onClick={() => handleQuickExport(format)}
          disabled={isExporting}
        >
          Export {format.toUpperCase()}
        </button>
      ))}
      
      {isExporting && (
        <div>
          <p>Exporting... {exportProgress}%</p>
          <ProgressBar current={exportProgress} total={100} />
        </div>
      )}
    </div>
  );
}
```

### `useProgress(operationId?: string): UseProgressReturn`

Hook for tracking progress of long-running operations.

**Returns:**
```typescript
interface UseProgressReturn {
  readonly operations: readonly ProgressOperation[];
  readonly activeOperations: readonly ProgressOperation[];
  readonly getOperation: (id: string) => ProgressOperation | null;
  readonly startOperation: (config: ProgressConfig) => string;
  readonly updateProgress: (id: string, update: ProgressUpdate) => void;
  readonly completeOperation: (id: string, message?: string) => void;
  readonly cancelOperation: (id: string) => void;
}
```

**Example:**
```typescript
function OperationTracker() {
  const { activeOperations, cancelOperation } = useProgress();

  return (
    <div>
      <h3>Active Operations</h3>
      {activeOperations.map(op => (
        <div key={op.id}>
          <p>{op.title}: {op.current}/{op.total}</p>
          <ProgressBar current={op.current} total={op.total} />
          {op.cancellable && (
            <button onClick={() => cancelOperation(op.id)}>
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### `useOpenSCADParser(): UseOpenSCADParserReturn`

Hook for managing OpenSCAD parsing operations.

**Returns:**
```typescript
interface UseOpenSCADParserReturn {
  readonly parseCode: (code: string) => Promise<ASTNode[]>;
  readonly isParsing: boolean;
  readonly lastParseResult: ASTNode[] | null;
  readonly lastParseError: ParseError | null;
  readonly parseTime: number | null;
}
```

**Example:**
```typescript
function CodeEditor() {
  const [code, setCode] = useState('cube([1, 1, 1]);');
  const { parseCode, isParsing, lastParseError, parseTime } = useOpenSCADParser();

  const handleCodeChange = useCallback(
    debounce(async (newCode: string) => {
      await parseCode(newCode);
    }, 300),
    [parseCode]
  );

  useEffect(() => {
    handleCodeChange(code);
  }, [code, handleCodeChange]);

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={isParsing}
      />
      
      {isParsing && <p>Parsing...</p>}
      {lastParseError && (
        <p style={{ color: 'red' }}>
          Parse Error: {lastParseError.message}
        </p>
      )}
      {parseTime && <p>Parse time: {parseTime}ms</p>}
    </div>
  );
}
```

## Utility Hooks

### `useSelectionStats(scene: Scene | null)`

Hook for selection statistics and analytics.

**Example:**
```typescript
function SelectionStats({ scene }: { scene: Scene | null }) {
  const stats = useSelectionStats(scene);

  return (
    <div>
      <p>Selected: {stats.selectedCount}</p>
      <p>Mode: {stats.selectionMode}</p>
      <p>Multi-selection: {stats.isMultiSelection ? 'Yes' : 'No'}</p>
      {stats.lastSelectionTime && (
        <p>Last selected: {stats.lastSelectionTime.toLocaleTimeString()}</p>
      )}
    </div>
  );
}
```

### `useQuickExport(scene: Scene | null)`

Hook for quick export operations with predefined configurations.

**Example:**
```typescript
function QuickExportButtons({ scene }: { scene: Scene | null }) {
  const { exportSTL, exportGLTF, exportSceneSTL } = useQuickExport(scene);
  const { selectedMeshes } = useSelection(scene);

  return (
    <div>
      <button onClick={() => exportSTL(selectedMeshes)}>
        Export STL
      </button>
      <button onClick={() => exportGLTF(selectedMeshes)}>
        Export GLTF
      </button>
      <button onClick={() => exportSceneSTL()}>
        Export Scene as STL
      </button>
    </div>
  );
}
```

## Component Composition Patterns

### Complete CAD Application

```typescript
function CADApplication() {
  const [openscadCode, setOpenscadCode] = useState('cube([2, 2, 2]);');
  const [scene, setScene] = useState<Scene | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <div className="cad-app">
      <div className="editor-panel">
        <CodeEditor
          value={openscadCode}
          onChange={setOpenscadCode}
          language="openscad"
        />
      </div>
      
      <div className="viewer-panel">
        <BabylonCanvas
          openscadCode={openscadCode}
          onSceneReady={setScene}
          enableSelection={true}
          enableExport={true}
        />
      </div>
      
      <div className="info-panel">
        <SelectionInfo
          scene={scene}
          showMetadata={true}
          showBoundingBox={true}
        />
        
        <button onClick={() => setShowExportDialog(true)}>
          Export Model
        </button>
      </div>
      
      <ExportDialog
        scene={scene}
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
```

### Error Boundary Integration

```typescript
function CADErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="error-boundary">
          <h2>3D Rendering Error</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>Try Again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Performance Considerations

- **Memoization**: Use `React.memo` for expensive components
- **Debouncing**: Debounce code changes to avoid excessive parsing
- **Lazy Loading**: Load 3D components only when needed
- **Scene Management**: Properly dispose of BabylonJS resources

## Accessibility

All components support:
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: ARIA labels and descriptions
- **Focus Management**: Proper focus handling
- **Color Contrast**: WCAG 2.1 AA compliance
