[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Class: EnhancedOpenscadParser

Defined in: [openscad-parser/enhanced-parser.ts:228](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L228)

Enhanced OpenSCAD parser with AST generation capabilities and error handling.

The EnhancedOpenscadParser serves as the main entry point for parsing OpenSCAD code and
generating structured Abstract Syntax Trees (ASTs). It combines Tree-sitter's powerful
parsing capabilities with a visitor-based AST generation system and comprehensive error
handling.

Key features:
- WASM-based Tree-sitter parser for efficient and accurate syntax parsing
- Visitor pattern for transforming Concrete Syntax Trees (CSTs) into semantic ASTs
- Incremental parsing support for editor integration with better performance
- Detailed error reporting with line/column information and formatted messages
- Configurable error handling through the IErrorHandler interface

The parsing process follows these steps:
1. Initialize the parser by loading the OpenSCAD grammar (init)
2. Parse the source code into a CST (parseCST)
3. Transform the CST into an AST (parseAST)
4. Handle any syntax or semantic errors through the error handler

For incremental updates (common in code editors), use the update/updateAST methods
to efficiently update only the changed portions of the syntax tree.

## Example

```typescript
import { EnhancedOpenscadParser, ConsoleErrorHandler } from '@holistic-stack/openscad-parser';

// Setup with custom error handling
const errorHandler = new ConsoleErrorHandler();
const parser = new EnhancedOpenscadParser(errorHandler);

async function parseOpenSCAD() {
  // Initialize the parser with the OpenSCAD grammar
  await parser.init('./path/to/tree-sitter-openscad.wasm');
  
  try {
    // Parse some OpenSCAD code
    const code = 'module test() { cube(10); sphere(5); }';
    
    // Generate the AST
    const ast = parser.parseAST(code);
    
    // Process the AST (e.g., code analysis, transformation)
    console.log(JSON.stringify(ast, null, 2));
    
    // Later, for incremental updates (e.g., in an editor)
    const updatedCode = 'module test() { cube(20); sphere(5); }';
    // Only reparse the changed part (the parameter 10 -> 20)
    const updatedAst = parser.updateAST(
      updatedCode, 
      code.indexOf('10'),  // start index of change
      code.indexOf('10') + 2,  // old end index
      code.indexOf('10') + 2 + 1  // new end index (one digit longer)
    );
  } catch (error) {
    console.error('Parsing failed:', error);
    // Access collected errors
    const errors = errorHandler.getErrors();
    errors.forEach(err => console.error(err));
  } finally {
    // Clean up when done
    parser.dispose();
  }
}
```

## Since

0.1.0

## Constructors

### Constructor

```ts
new EnhancedOpenscadParser(errorHandler?: IErrorHandler): EnhancedOpenscadParser;
```

Defined in: [openscad-parser/enhanced-parser.ts:286](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L286)

Creates a new EnhancedOpenscadParser instance with optional custom error handling.

This constructor initializes the parser with either a custom error handler or the default
SimpleErrorHandler. The error handler is responsible for collecting, formatting, and
reporting errors that occur during parsing or AST generation.

Note that calling the constructor only creates the parser instance but does not load
the OpenSCAD grammar. You must call the `init()` method before attempting to parse any code.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `errorHandler?` | [`IErrorHandler`](../interfaces/IErrorHandler.md) | Optional custom error handler that implements the IErrorHandler interface. If not provided, a SimpleErrorHandler is used by default. |

#### Returns

`EnhancedOpenscadParser`

#### Examples

```typescript
// Create a parser with the default SimpleErrorHandler
const parser = new EnhancedOpenscadParser();
```

```typescript
// Create a custom error handler for specialized error reporting
class CustomErrorHandler implements IErrorHandler {
  private errors: string[] = [];
  
  logInfo(message: string): void {
    console.log(`[INFO] ${message}`);
  }
  
  logWarning(message: string): void {
    console.warn(`[WARNING] ${message}`);
  }
  
  handleError(error: string | Error): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    this.errors.push(errorMessage);
    console.error(`[ERROR] ${errorMessage}`);
  }
  
  getErrors(): string[] {
    return this.errors;
  }
}

// Create a parser with the custom error handler
const errorHandler = new CustomErrorHandler();
const parser = new EnhancedOpenscadParser(errorHandler);
```

#### Since

0.1.0

## Properties

| Property | Modifier | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="isinitialized"></a> `isInitialized` | `public` | `boolean` | `false` | [openscad-parser/enhanced-parser.ts:233](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L233) |

## Methods

### init()

```ts
init(wasmPath: string, treeSitterWasmPath: string): Promise<void>;
```

Defined in: [openscad-parser/enhanced-parser.ts:307](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L307)

Initializes the enhanced OpenSCAD parser by loading the WASM grammar.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `wasmPath` | `string` | `'./tree-sitter-openscad.wasm'` | Path to Tree-sitter WASM binary (default: './tree-sitter-openscad.wasm') |
| `treeSitterWasmPath` | `string` | `'./tree-sitter.wasm'` | - |

#### Returns

`Promise`\<`void`\>

Promise<void> that resolves when initialization completes.

#### Throws

Error if fetching or parser initialization fails.

#### Examples

```ts
const parser = new EnhancedOpenscadParser();
await parser.init();
```

```ts
await parser.init('/custom/path/tree-sitter-openscad.wasm');
```

#### Since

0.1.0

***

### parseCST()

```ts
parseCST(code: string): null | Tree;
```

Defined in: [openscad-parser/enhanced-parser.ts:376](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L376)

Parses the OpenSCAD source string into a Concrete Syntax Tree (CST).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `code` | `string` | OpenSCAD code to parse. |

#### Returns

`null` \| `Tree`

Tree-sitter CST or null.

#### Throws

Error if parser not initialized or parsing fails.

#### Examples

```ts
const tree = parser.parseCST('cube(1);');
```

```ts
try {
  parser.parseCST('invalid code');
} catch (e) { console.error(e); }
```

***

### parseAST()

```ts
parseAST(code: string): ASTNode[];
```

Defined in: [openscad-parser/enhanced-parser.ts:414](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L414)

Parses the OpenSCAD code into an Abstract Syntax Tree (AST) using the visitor pattern.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `code` | `string` | OpenSCAD code to generate AST for. |

#### Returns

[`ASTNode`](../type-aliases/ASTNode.md)[]

Array of ASTNode representing the AST.

#### Throws

Error if AST generation fails.

#### Examples

```ts
const ast = parser.parseAST('cube(1);');
```

```ts
const ast = parser.parseAST('translate([1,1,1]) cube(2);');
```

#### Since

0.1.0

***

### ~~parse()~~

```ts
parse(code: string): null | Tree;
```

Defined in: [openscad-parser/enhanced-parser.ts:456](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L456)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `code` | `string` | OpenSCAD code to parse. |

#### Returns

`null` \| `Tree`

Tree-sitter CST or null.

#### Deprecated

since v0.2.0. Use `parseCST` instead.

Alias for parseCST for backward compatibility.

#### Example

```ts
const tree = parser.parse('cube(1);');
```

***

### update()

```ts
update(
   newCode: string, 
   startIndex: number, 
   oldEndIndex: number, 
   newEndIndex: number): null | Tree;
```

Defined in: [openscad-parser/enhanced-parser.ts:492](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L492)

Updates the parse tree incrementally for better performance when making small edits to code.

Instead of reparsing the entire file, this method updates only the changed portion
of the syntax tree, significantly improving performance for large files.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `newCode` | `string` | The updated OpenSCAD code string |
| `startIndex` | `number` | The byte index where the edit starts in the original code |
| `oldEndIndex` | `number` | The byte index where the edit ends in the original code |
| `newEndIndex` | `number` | The byte index where the edit ends in the new code |

#### Returns

`null` \| `Tree`

Updated Tree-sitter CST or null if incremental update fails

#### Examples

```ts
// Original: "cube(10);"
// Change to: "cube(20);"
const tree = parser.update("cube(20);", 5, 7, 7);
```

```ts
// For more complex edits with position calculations:
const oldCode = "cube([10, 10, 10]);";
const newCode = "cube([20, 10, 10]);";
const startIndex = oldCode.indexOf("10");
const oldEndIndex = startIndex + 2; // "10" is 2 chars
const newEndIndex = startIndex + 2; // "20" is also 2 chars
const tree = parser.update(newCode, startIndex, oldEndIndex, newEndIndex);
```

#### Since

0.2.0

***

### updateAST()

```ts
updateAST(
   newCode: string, 
   startIndex: number, 
   oldEndIndex: number, 
   newEndIndex: number): ASTNode[];
```

Defined in: [openscad-parser/enhanced-parser.ts:562](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L562)

Updates the Abstract Syntax Tree (AST) incrementally for improved performance.

This method first performs an incremental update of the Concrete Syntax Tree (CST)
and then generates a new AST from the updated tree. This approach is much more efficient
than regenerating the entire AST for large files when only small changes are made.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `newCode` | `string` | The updated OpenSCAD code string |
| `startIndex` | `number` | The byte index where the edit starts in the original code |
| `oldEndIndex` | `number` | The byte index where the edit ends in the original code |
| `newEndIndex` | `number` | The byte index where the edit ends in the new code |

#### Returns

[`ASTNode`](../type-aliases/ASTNode.md)[]

Array of updated AST nodes representing the OpenSCAD program

#### Throws

Error if the AST update process fails

#### Examples

```ts
// Original: "cube(10);"
// Changed to: "cube(20);"
const ast = parser.updateAST("cube(20);", 5, 7, 7);
// ast will contain the updated node structure
```

```ts
const oldCode = "cube(10);";
const newCode = "cube(10); sphere(5);";
// Calculate the edit position (append at the end)
const startIndex = oldCode.length;
const oldEndIndex = oldCode.length;
const newEndIndex = newCode.length;

const ast = parser.updateAST(newCode, startIndex, oldEndIndex, newEndIndex);
// ast now contains both the cube and sphere nodes
```

#### Since

0.2.0

***

### dispose()

```ts
dispose(): void;
```

Defined in: [openscad-parser/enhanced-parser.ts:631](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L631)

Releases all resources used by the parser instance.

This method should be called when the parser is no longer needed to prevent memory leaks.
After calling dispose(), the parser cannot be used until init() is called again.

#### Returns

`void`

void

#### Examples

```ts
// Clean up parser resources when done
const parser = new EnhancedOpenscadParser();
await parser.init();

// Use parser...

// When finished:
parser.dispose();
```

```ts
// In a code editor component's cleanup method:
componentWillUnmount() {
  if (this.parser) {
    this.parser.dispose();
    this.parser = null;
  }
}
```

#### Since

0.1.0

***

### getErrorHandler()

```ts
getErrorHandler(): IErrorHandler;
```

Defined in: [openscad-parser/enhanced-parser.ts:681](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/enhanced-parser.ts#L681)

Returns the error handler instance used by this parser.

This can be useful for accessing parser errors or configuring error handling behavior.
The returned error handler follows the IErrorHandler interface and can be used to
retrieve error logs or redirect error output.

#### Returns

[`IErrorHandler`](../interfaces/IErrorHandler.md)

The error handler instance

#### Examples

```ts
const parser = new EnhancedOpenscadParser();
await parser.init();

// After parsing:
const errorHandler = parser.getErrorHandler();
const errors = errorHandler.getErrors(); // If implemented by the error handler
```

```ts
const parser = new EnhancedOpenscadParser();
await parser.init();

// Get errors for display in UI
try {
  parser.parseCST(code);
} catch (e) {
  const errorHandler = parser.getErrorHandler();
  this.displayErrors(errorHandler.getErrors());
}
```

#### Since

0.1.0
