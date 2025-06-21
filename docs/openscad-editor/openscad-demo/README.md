# OpenSCAD Demo Application

[![Build Status](https://github.com/user/openscad-tree-sitter/workflows/CI/badge.svg)](https://github.com/user/openscad-tree-sitter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An interactive web application that demonstrates the capabilities of the OpenSCAD Tree-sitter Parser. This demo provides a comprehensive playground for testing parsing features, exploring AST generation, and experimenting with OpenSCAD code in real-time.

## 🎯 Overview

The OpenSCAD Demo is a full-featured web application built with modern web technologies that showcases all aspects of the OpenSCAD parsing ecosystem. It serves as both a demonstration tool and a practical testing environment for developers working with OpenSCAD code.

### Key Features

- **🎨 Interactive Code Editor**: Monaco editor with full OpenSCAD language support
- **🌳 Real-time AST Visualization**: Live AST tree display with syntax highlighting
- **🔍 Parse Tree Explorer**: Detailed Tree-sitter CST inspection
- **⚡ Expression Evaluator**: Interactive expression evaluation with results
- **🚨 Error Reporting**: Comprehensive error display with suggestions
- **📊 Performance Metrics**: Real-time parsing performance statistics
- **🎯 Example Gallery**: Curated collection of OpenSCAD examples
- **🔧 Configuration Panel**: Adjustable parser and editor settings
- **🔄 Feature Comparison Panel**: Side-by-side editor comparison with performance metrics
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices

### Demo Sections

#### Code Editor
- Full-featured Monaco editor with OpenSCAD syntax highlighting
- Real-time error highlighting and IntelliSense
- Code formatting and auto-completion
- Multiple theme options

#### AST Explorer
- Interactive tree view of generated AST
- Node type filtering and search
- Expandable/collapsible tree structure
- JSON export functionality

#### Parse Tree Viewer
- Raw Tree-sitter CST visualization
- Node inspection with detailed information
- Error node highlighting
- Tree navigation controls

#### Expression Evaluator
- Interactive expression evaluation
- Variable assignment and management
- Built-in function testing
- Mathematical expression visualization

#### Performance Dashboard
- Parse time measurements
- Memory usage tracking
- File size impact analysis
- Incremental parsing metrics

## 🚀 Quick Start

### Online Demo

Visit the live demo at: [https://openscad-parser-demo.netlify.app](https://openscad-parser-demo.netlify.app)

### Local Development

```bash
# Clone the repository
git clone https://github.com/user/openscad-tree-sitter.git
cd openscad-tree-sitter

# Install dependencies
pnpm install

# Start the demo application
pnpm dev:demo

# Or run from the demo package directory
cd packages/openscad-demo
pnpm dev
```

The demo will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the demo application
pnpm build:demo

# Preview the production build
pnpm preview:demo

# Or from the demo package directory
cd packages/openscad-demo
pnpm build
pnpm preview
```

## 🏗 Architecture

The demo application is built with modern web technologies:

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Tailwind CSS for styling
- **Code Editor**: Monaco Editor with OpenSCAD language support
- **State Management**: Zustand for application state
- **Routing**: React Router for navigation
- **Icons**: Lucide React for consistent iconography

### Project Structure

```
packages/openscad-demo/
├── src/
│   ├── components/          # React components
│   │   ├── editor/         # Editor-related components
│   │   ├── ast/            # AST visualization components
│   │   ├── examples/       # Example gallery components
│   │   ├── performance/    # Performance monitoring components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── examples/           # OpenSCAD example files
├── public/                 # Static assets
├── dist/                   # Built application (generated)
└── docs/                   # Demo documentation
```

## 🎨 User Interface

### Main Layout

The demo features a responsive layout with multiple panels:

```typescript
interface DemoLayout {
  header: {
    title: string;
    navigation: NavigationItem[];
    themeToggle: boolean;
  };
  
  sidebar: {
    exampleGallery: ExampleItem[];
    configurationPanel: ConfigOptions;
    performanceMetrics: PerformanceData;
  };
  
  mainContent: {
    codeEditor: MonacoEditor;
    outputPanels: OutputPanel[];
  };
  
  footer: {
    links: FooterLink[];
    version: string;
  };
}
```

### Code Editor Panel

```typescript
interface EditorPanel {
  // Monaco editor with OpenSCAD support
  editor: {
    language: 'openscad';
    theme: 'openscad-light' | 'openscad-dark';
    features: {
      syntaxHighlighting: boolean;
      errorHighlighting: boolean;
      autoCompletion: boolean;
      codeFormatting: boolean;
    };
  };
  
  // Toolbar actions
  toolbar: {
    actions: [
      'format-code',
      'clear-editor',
      'load-example',
      'export-code',
      'share-link'
    ];
  };
  
  // Status bar
  statusBar: {
    lineCount: number;
    characterCount: number;
    parseStatus: 'success' | 'error' | 'parsing';
    parseTime: number;
  };
}
```

### AST Visualization Panel

```typescript
interface ASTPanel {
  // Tree view component
  treeView: {
    nodes: ASTNode[];
    expandedNodes: Set<string>;
    selectedNode: ASTNode | null;
    filterOptions: {
      nodeTypes: string[];
      searchQuery: string;
    };
  };
  
  // Node details
  nodeDetails: {
    type: string;
    properties: Record<string, any>;
    location: SourceLocation;
    children: ASTNode[];
  };
  
  // Export options
  exportOptions: {
    formats: ['json', 'yaml', 'xml'];
    includeLocations: boolean;
    prettyPrint: boolean;
  };
}
```

## 🔧 Configuration Options

### Parser Configuration

```typescript
interface ParserConfig {
  // Parsing options
  parsing: {
    enableIncrementalParsing: boolean;
    maxParseDepth: number;
    errorRecoveryStrategy: 'strict' | 'lenient' | 'aggressive';
  };
  
  // Expression evaluation
  expressions: {
    enableEvaluation: boolean;
    maxEvaluationDepth: number;
    timeoutMs: number;
  };
  
  // Error handling
  errors: {
    showSyntaxErrors: boolean;
    showSemanticErrors: boolean;
    showWarnings: boolean;
    maxErrorCount: number;
  };
  
  // Performance
  performance: {
    enableProfiling: boolean;
    trackMemoryUsage: boolean;
    debounceMs: number;
  };
}
```

### Editor Configuration

```typescript
interface EditorConfig {
  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
  };
  
  // Behavior
  behavior: {
    autoSave: boolean;
    autoFormat: boolean;
    wordWrap: boolean;
    showMinimap: boolean;
  };
  
  // IntelliSense
  intellisense: {
    enableAutoCompletion: boolean;
    enableParameterHints: boolean;
    enableHoverInfo: boolean;
    suggestionDelay: number;
  };
}
```

## 📚 Example Gallery

The demo includes a comprehensive collection of OpenSCAD examples:

### Basic Examples

```typescript
const basicExamples = [
  {
    name: 'Hello Cube',
    description: 'Simple cube primitive',
    code: 'cube(10);',
    category: 'primitives'
  },
  {
    name: 'Colored Sphere',
    description: 'Sphere with color transformation',
    code: 'color("red") sphere(5);',
    category: 'transformations'
  }
];
```

### Intermediate Examples

```typescript
const intermediateExamples = [
  {
    name: 'Parametric Module',
    description: 'Module with parameters and default values',
    code: `
      module house(width = 10, height = 15) {
        cube([width, width, height]);
        translate([0, 0, height]) {
          rotate([0, 45, 0]) cube([width*1.4, width, 2]);
        }
      }
      house(20, 25);
    `,
    category: 'modules'
  }
];
```

### Advanced Examples

```typescript
const advancedExamples = [
  {
    name: 'Recursive Tree',
    description: 'Recursive module creating a fractal tree',
    code: `
      module tree(size, levels) {
        if (levels > 0) {
          cylinder(h = size, r1 = size/10, r2 = size/20);
          translate([0, 0, size]) {
            for (angle = [0:45:359]) {
              rotate([20, 0, angle]) {
                tree(size * 0.6, levels - 1);
              }
            }
          }
        }
      }
      tree(50, 4);
    `,
    category: 'advanced'
  }
];
```

### Real-world Examples

The demo includes complex real-world examples from the `examples/real-world/` directory:

- **Architectural Model**: Building structures with windows and doors
- **Mechanical Gearbox**: Functional gear system with precise measurements
- **Mathematical Surfaces**: Complex mathematical shapes and surfaces

## 🧪 Testing Features

### Comprehensive Test Suite

The demo includes both unit tests and E2E tests:

```bash
# Run unit tests
nx test openscad-demo

# Run E2E tests
nx e2e openscad-demo

# Run specific E2E test
nx e2e openscad-demo --grep="Feature Comparison Panel"

# Run all quality checks
nx test openscad-demo && nx typecheck openscad-demo && nx lint openscad-demo
```

### Interactive Testing

The demo provides several testing features:

```typescript
interface TestingFeatures {
  // Code validation
  validation: {
    syntaxCheck: () => ValidationResult;
    semanticCheck: () => ValidationResult;
    performanceTest: () => PerformanceResult;
  };
  
  // Expression testing
  expressions: {
    evaluateExpression: (expr: string) => EvaluationResult;
    testBuiltinFunctions: () => FunctionTestResult[];
    validateVariables: () => VariableValidationResult;
  };
  
  // Parser testing
  parser: {
    parseCode: (code: string) => ParseResult;
    compareASTs: (code1: string, code2: string) => ComparisonResult;
    benchmarkParsing: (codes: string[]) => BenchmarkResult;
  };
}
```

### Performance Testing

```typescript
interface PerformanceTest {
  // Parsing performance
  parsing: {
    measureParseTime: (code: string) => number;
    measureMemoryUsage: (code: string) => number;
    testIncrementalParsing: (edits: Edit[]) => PerformanceMetrics;
  };
  
  // Editor performance
  editor: {
    measureTypingLatency: () => number;
    measureScrollPerformance: () => number;
    measureSyntaxHighlightingTime: () => number;
  };
  
  // Overall metrics
  overall: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}
```

## 📊 Analytics and Metrics

### Usage Analytics

The demo tracks usage patterns to improve the parser:

```typescript
interface Analytics {
  // User interactions
  interactions: {
    codeEdits: number;
    exampleLoads: number;
    configChanges: number;
    errorEncounters: number;
  };
  
  // Performance metrics
  performance: {
    averageParseTime: number;
    peakMemoryUsage: number;
    errorRate: number;
    successRate: number;
  };
  
  // Feature usage
  features: {
    astExplorer: number;
    expressionEvaluator: number;
    errorReporting: number;
    codeFormatting: number;
  };
}
```

## 🚀 Deployment

### Netlify Deployment

The demo is automatically deployed to Netlify on every push to the main branch:

```yaml
# netlify.toml
[build]
  base = "packages/openscad-demo"
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
  PNPM_VERSION = "10"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Manual Deployment

```bash
# Build for production
pnpm build:demo

# Deploy to your hosting provider
# The built files will be in packages/openscad-demo/dist/
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/openscad-demo/package.json ./packages/openscad-demo/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/openscad-demo ./packages/openscad-demo

# Build the application
RUN pnpm build:demo

# Serve with nginx
FROM nginx:alpine
COPY --from=0 /app/packages/openscad-demo/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

We welcome contributions to improve the demo! Please see our [Contributing Guidelines](../../docs/how-to-guides.md#contributing-to-the-demo) for details on:

- Setting up the development environment
- Adding new examples
- Improving UI/UX
- Adding new features
- Testing requirements

### Development Workflow

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Build for production
pnpm build
```

### Adding New Examples

```typescript
// Add to src/examples/index.ts
export const newExample: ExampleItem = {
  id: 'new-example',
  name: 'New Example',
  description: 'Description of the new example',
  category: 'category',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  code: `
    // OpenSCAD code here
  `,
  tags: ['tag1', 'tag2'],
  author: 'Your Name',
  dateAdded: '2024-01-01'
};
```

## 📚 Documentation

- [User Guide](./docs/user-guide.md): How to use the demo application
- [Developer Guide](./docs/developer-guide.md): Technical implementation details
- [API Reference](./docs/api-reference.md): Component and hook documentation
- [Deployment Guide](./docs/deployment.md): How to deploy the demo

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔗 Related Projects

- **[@openscad/parser](../openscad-parser)**: TypeScript parser with AST generation
- **[@openscad/tree-sitter-openscad](../tree-sitter-openscad)**: Tree-sitter grammar
- **[@openscad/editor](../openscad-editor)**: Monaco editor integration

---

**Part of the [OpenSCAD Tree-sitter Parser](../../README.md) monorepo**