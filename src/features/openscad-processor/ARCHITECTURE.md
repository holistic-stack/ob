# OpenSCAD Processor Architecture

## 🏗️ Architectural Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    App.tsx                              ││
│  │  • Uses useOpenSCADProcessor()                          ││
│  │  • Renders UI components                                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FEATURE LAYER                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              features/openscad-processor/               ││
│  │                                                         ││
│  │  ┌──────────────────┐  ┌──────────────────┐            ││
│  │  │      HOOKS       │  │     SERVICES     │            ││
│  │  │                  │  │                  │            ││
│  │  │ • Main Hook      │◄─┤ • PipelineService│            ││
│  │  │ • Initialization │  │ • ProcessingService│          ││
│  │  │ • Stats          │  │                  │            ││
│  │  └──────────────────┘  └──────────────────┘            ││
│  │           │                      │                     ││
│  │           ▼                      ▼                     ││
│  │  ┌──────────────────┐  ┌──────────────────┐            ││
│  │  │      UTILS       │  │      TYPES       │            ││
│  │  │                  │  │                  │            ││
│  │  │ • Stats Calculator│  │ • ProcessingStats│            ││
│  │  │ • Geometry Convert│  │ • ProcessedMesh  │            ││
│  │  │ • Pure Functions │  │ • Interfaces     │            ││
│  │  └──────────────────┘  └──────────────────┘            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SHARED LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                babylon-csg2/                            ││
│  │  • OpenScadPipeline                                     ││
│  │  • Core processing logic                                ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                types/                                   ││
│  │  • PipelineResult                                       ││
│  │  • MeshGeometryData                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
┌─────────────┐    processCode()    ┌──────────────────┐
│   App.tsx   │ ─────────────────► │  Main Hook       │
│             │                    │  useOpenSCAD     │
│   UI State  │ ◄───────────────── │  Processor       │
└─────────────┘    meshes, stats   └──────────────────┘
                                             │
                                             ▼
       ┌─────────────────────────────────────────────────────┐
       │              HOOK COMPOSITION                       │
       │                                                     │
       │  ┌──────────────────┐  ┌─────────────────────────┐  │
       │  │ Initialization   │  │    Processing Stats     │  │
       │  │ Hook             │  │    Hook                 │  │
       │  │                  │  │                         │  │
       │  │ • isReady        │  │ • updateStats()         │  │
       │  │ • error          │  │ • resetStats()          │  │
       │  └──────────────────┘  └─────────────────────────┘  │
       └─────────────────────────────────────────────────────┘
                                             │
                                             ▼
       ┌─────────────────────────────────────────────────────┐
       │                  SERVICES                           │
       │                                                     │
       │  ┌──────────────────┐  ┌─────────────────────────┐  │
       │  │ Pipeline Service │  │  Processing Service     │  │
       │  │                  │  │                         │  │
       │  │ • initialize()   │  │ • processCode()         │  │
       │  │ • getPipeline()  │  │ • validateCode()        │  │
       │  │ • reset()        │  │ • getCodeStats()        │  │
       │  └──────────────────┘  └─────────────────────────┘  │
       └─────────────────────────────────────────────────────┘
                                             │
                                             ▼
       ┌─────────────────────────────────────────────────────┐
       │                PURE FUNCTIONS                       │
       │                                                     │
       │  ┌──────────────────┐  ┌─────────────────────────┐  │
       │  │ Stats Calculator │  │ Geometry Converter      │  │
       │  │                  │  │                         │  │
       │  │ • createStats()  │  │ • convertToMesh()       │  │
       │  │ • updateStats()  │  │ • validateGeometry()    │  │
       │  │ • formatTime()   │  │ • getMeshStats()        │  │
       │  └──────────────────┘  └─────────────────────────┘  │
       └─────────────────────────────────────────────────────┘
```

## 🎯 Dependency Direction (Bulletproof-React)

```
App Layer (src/App.tsx)
    │
    ▼ (imports from)
Feature Layer (src/features/openscad-processor/)
    │
    ▼ (imports from)  
Shared Layer (src/types/, src/babylon-csg2/)
```

## 🧪 Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 E2E TESTS                               ││
│  │         • Full application workflows                    ││
│  │         • User interaction testing                      ││
│  └─────────────────────────────────────────────────────────┘│
│              ┌───────────────────────────────────┐          │
│              │          INTEGRATION TESTS        │          │
│              │   • Hook composition testing      │          │
│              │   • Service integration testing   │          │
│              └───────────────────────────────────┘          │
│      ┌───────────────────────────────────────────────────┐  │
│      │                 UNIT TESTS                        │  │
│      │   • Pure functions (stats, geometry)             │  │ 
│      │   • Service methods (pipeline, processing)       │  │
│      │   • Individual hook logic                        │  │ 
│      └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Benefits Achieved

### 📈 **Maintainability**
- Single Responsibility: Each file has one job
- Easy to locate and fix issues
- Clear module boundaries

### 🧪 **Testability** 
- Pure functions: 100% testable
- Services: Mockable dependencies
- Hooks: Isolated state logic

### ♻️ **Reusability**
- Services: Shareable across features
- Utils: Reusable pure functions  
- Hooks: Composable building blocks

### 🚀 **Performance**
- Tree-shaking friendly
- Code splitting ready
- Optimized re-renders

### 🔍 **Debuggability**
- Clear error boundaries
- Isolated failure points
- Focused logging

## 📚 Architecture Patterns Used

- ✅ **Feature-Driven Development**: Code organized by feature
- ✅ **Service Layer Pattern**: Business logic in services
- ✅ **Pure Function Pattern**: Stateless, predictable functions
- ✅ **Composition over Inheritance**: Hooks compose smaller hooks
- ✅ **Dependency Injection**: Services can be swapped/mocked
- ✅ **Unidirectional Data Flow**: Clear dependency direction
