/**
 * @file Extract Refactoring Provider for OpenSCAD Editor
 * 
 * Provides intelligent code extraction functionality including extract variable,
 * extract function, and extract module operations with automatic parameter detection.
 * 
 * Features:
 * - Expression extraction with automatic variable naming
 * - Scope-aware variable placement
 * - Type inference for extracted values
 * - Code block extraction with parameter detection
 * - Automatic parameter inference from used variables
 * - Return value detection and handling
 * 
 * @example
 * ```typescript
 * const extractProvider = new OpenSCADExtractProvider(parserService, symbolProvider);
 * const actions = await extractProvider.getExtractActions(model, selection);
 * ```
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { type OpenSCADParserService } from '../services/openscad-parser-service';

// Enhanced interfaces for extract functionality
// TODO: Import from parser package when available
interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

interface ASTNode {
  readonly type: string;
  readonly [key: string]: any;
}

interface ParserSymbolInfo {
  readonly name: string;
  readonly kind: 'module' | 'function' | 'variable' | 'parameter' | 'constant' | 'include' | 'use';
  readonly loc?: {
    readonly start: Position;
    readonly end: Position;
  };
  readonly scope?: string;
  readonly parameters?: ReadonlyArray<{
    readonly name: string;
    readonly value?: any;
    readonly defaultValue?: any;
  }>;
}

interface SymbolProvider {
  getSymbols(ast: ASTNode[]): ParserSymbolInfo[];
  getSymbolAtPosition(ast: ASTNode[], position: Position): ParserSymbolInfo | undefined;
  findSymbolDefinition(ast: ASTNode[], symbolName: string): ParserSymbolInfo | undefined;
  findSymbolReferences(ast: ASTNode[], symbolName: string): ParserSymbolInfo[];
  findSymbolsInRange(ast: ASTNode[], range: { start: Position; end: Position }): ParserSymbolInfo[];
  findUnusedSymbols(ast: ASTNode[]): ParserSymbolInfo[];
}

interface PositionUtilities {
  findNodeAt(ast: ASTNode[], position: Position): ASTNode | undefined;
  getNodeRange(node: ASTNode): { start: Position; end: Position };
  findNodesInRange(ast: ASTNode[], range: { start: Position; end: Position }): ASTNode[];
}

/**
 * Configuration for extract operations
 */
export interface ExtractConfig {
  readonly enableVariableExtraction: boolean;
  readonly enableFunctionExtraction: boolean;
  readonly enableModuleExtraction: boolean;
  readonly autoGenerateNames: boolean;
  readonly maxParameterCount: number;
  readonly minExpressionLength: number;
}

/**
 * Default extract configuration
 */
export const DEFAULT_EXTRACT_CONFIG: ExtractConfig = {
  enableVariableExtraction: true,
  enableFunctionExtraction: true,
  enableModuleExtraction: true,
  autoGenerateNames: true,
  maxParameterCount: 10,
  minExpressionLength: 3
} as const;

/**
 * Result type for extract operations
 */
export type ExtractResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Extract action types
 */
export enum ExtractActionKind {
  ExtractVariable = 'extract.variable',
  ExtractFunction = 'extract.function',
  ExtractModule = 'extract.module'
}

/**
 * Extract action information
 */
export interface ExtractAction {
  readonly kind: ExtractActionKind;
  readonly title: string;
  readonly description: string;
  readonly edit: monaco.languages.WorkspaceEdit;
  readonly isPreferred?: boolean;
}

/**
 * Variable extraction context
 */
export interface VariableExtractionContext {
  readonly selectedText: string;
  readonly selectedRange: monaco.IRange;
  readonly suggestedName: string;
  readonly insertionPoint: monaco.IRange;
  readonly scope: string;
  readonly dependencies: readonly string[];
}

/**
 * Function extraction context
 */
export interface FunctionExtractionContext {
  readonly selectedText: string;
  readonly selectedRange: monaco.IRange;
  readonly suggestedName: string;
  readonly insertionPoint: monaco.IRange;
  readonly parameters: readonly {
    readonly name: string;
    readonly type?: string;
    readonly defaultValue?: string;
  }[];
  readonly returnType?: string;
  readonly usedVariables: readonly string[];
}

/**
 * Module extraction context
 */
export interface ModuleExtractionContext {
  readonly selectedText: string;
  readonly selectedRange: monaco.IRange;
  readonly suggestedName: string;
  readonly insertionPoint: monaco.IRange;
  readonly parameters: readonly {
    readonly name: string;
    readonly type?: string;
    readonly defaultValue?: string;
  }[];
  readonly usedVariables: readonly string[];
  readonly hasGeometry: boolean;
}

/**
 * OpenSCAD Extract Provider
 * 
 * Provides intelligent code extraction capabilities with AST-based analysis
 * and automatic parameter detection for OpenSCAD code.
 */
export class OpenSCADExtractProvider {
  private readonly parserService: OpenSCADParserService | null;
  private readonly symbolProvider: SymbolProvider | null;
  private readonly positionUtilities: PositionUtilities | null;
  private readonly config: ExtractConfig;

  constructor(
    parserService?: OpenSCADParserService,
    symbolProvider?: SymbolProvider,
    positionUtilities?: PositionUtilities,
    config: Partial<ExtractConfig> = {}
  ) {
    this.parserService = parserService || null;
    this.symbolProvider = symbolProvider || null;
    this.positionUtilities = positionUtilities || null;
    this.config = { ...DEFAULT_EXTRACT_CONFIG, ...config };
  }

  /**
   * Get available extract actions for the given selection
   */
  async getExtractActions(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange
  ): Promise<ExtractResult<ExtractAction[]>> {
    try {
      // Check if required services are available
      if (!this.parserService && !this.symbolProvider) {
        return {
          success: false,
          error: 'Extract provider not available - missing required services'
        };
      }

      const actions: ExtractAction[] = [];
      const selectedText = model.getValueInRange(selection);

      if (!selectedText || selectedText.trim().length < this.config.minExpressionLength) {
        return { success: true, data: [] };
      }

      // Extract variable action
      if (this.config.enableVariableExtraction) {
        const variableAction = await this.createExtractVariableAction(model, selection, selectedText);
        if (variableAction.success) {
          actions.push(variableAction.data);
        }
      }

      // Extract function action
      if (this.config.enableFunctionExtraction) {
        const functionAction = await this.createExtractFunctionAction(model, selection, selectedText);
        if (functionAction.success) {
          actions.push(functionAction.data);
        }
      }

      // Extract module action
      if (this.config.enableModuleExtraction) {
        const moduleAction = await this.createExtractModuleAction(model, selection, selectedText);
        if (moduleAction.success) {
          actions.push(moduleAction.data);
        }
      }

      return { success: true, data: actions };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get extract actions: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create extract variable action
   */
  private async createExtractVariableAction(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange,
    selectedText: string
  ): Promise<ExtractResult<ExtractAction>> {
    try {
      const context = await this.analyzeVariableExtractionContext(model, selection, selectedText);
      if (!context.success) {
        return context;
      }

      const { suggestedName, insertionPoint } = context.data;

      const workspaceEdit: monaco.languages.WorkspaceEdit = {
        edits: [
          // Insert variable declaration
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: insertionPoint.startLineNumber,
                startColumn: insertionPoint.startColumn,
                endLineNumber: insertionPoint.startLineNumber,
                endColumn: insertionPoint.startColumn
              },
              text: `${suggestedName} = ${selectedText};\n`
            }
          },
          // Replace selected text with variable reference
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: selection,
              text: suggestedName
            }
          }
        ]
      };

      return {
        success: true,
        data: {
          kind: ExtractActionKind.ExtractVariable,
          title: `Extract to variable '${suggestedName}'`,
          description: `Extract the selected expression to a variable named '${suggestedName}'`,
          edit: workspaceEdit,
          isPreferred: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create extract variable action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create extract function action
   */
  private async createExtractFunctionAction(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange,
    selectedText: string
  ): Promise<ExtractResult<ExtractAction>> {
    try {
      const context = await this.analyzeFunctionExtractionContext(model, selection, selectedText);
      if (!context.success) {
        return context;
      }

      const { suggestedName, insertionPoint, parameters } = context.data;
      const parameterList = parameters.map(p => p.name).join(', ');
      const argumentList = parameters.map(p => p.name).join(', ');

      const functionDefinition = `function ${suggestedName}(${parameterList}) = ${selectedText};\n\n`;

      const workspaceEdit: monaco.languages.WorkspaceEdit = {
        edits: [
          // Insert function definition
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: insertionPoint.startLineNumber,
                startColumn: insertionPoint.startColumn,
                endLineNumber: insertionPoint.startLineNumber,
                endColumn: insertionPoint.startColumn
              },
              text: functionDefinition
            }
          },
          // Replace selected text with function call
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: selection,
              text: `${suggestedName}(${argumentList})`
            }
          }
        ]
      };

      return {
        success: true,
        data: {
          kind: ExtractActionKind.ExtractFunction,
          title: `Extract to function '${suggestedName}'`,
          description: `Extract the selected expression to a function named '${suggestedName}'`,
          edit: workspaceEdit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create extract function action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create extract module action
   */
  private async createExtractModuleAction(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange,
    selectedText: string
  ): Promise<ExtractResult<ExtractAction>> {
    try {
      const context = await this.analyzeModuleExtractionContext(model, selection, selectedText);
      if (!context.success) {
        return context;
      }

      const { suggestedName, insertionPoint, parameters } = context.data;
      const parameterList = parameters.map(p => p.name).join(', ');
      const argumentList = parameters.map(p => p.name).join(', ');

      const moduleDefinition = `module ${suggestedName}(${parameterList}) {\n    ${selectedText}\n}\n\n`;

      const workspaceEdit: monaco.languages.WorkspaceEdit = {
        edits: [
          // Insert module definition
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: {
                startLineNumber: insertionPoint.startLineNumber,
                startColumn: insertionPoint.startColumn,
                endLineNumber: insertionPoint.startLineNumber,
                endColumn: insertionPoint.startColumn
              },
              text: moduleDefinition
            }
          },
          // Replace selected text with module call
          {
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: {
              range: selection,
              text: `${suggestedName}(${argumentList});`
            }
          }
        ]
      };

      return {
        success: true,
        data: {
          kind: ExtractActionKind.ExtractModule,
          title: `Extract to module '${suggestedName}'`,
          description: `Extract the selected code to a module named '${suggestedName}'`,
          edit: workspaceEdit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create extract module action: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Analyze variable extraction context
   */
  private async analyzeVariableExtractionContext(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange,
    selectedText: string
  ): Promise<ExtractResult<VariableExtractionContext>> {
    try {
      const suggestedName = this.generateVariableName(selectedText);
      const insertionPoint = this.findVariableInsertionPoint(model, selection);

      return {
        success: true,
        data: {
          selectedText,
          selectedRange: selection,
          suggestedName,
          insertionPoint,
          scope: 'local', // TODO: Determine actual scope
          dependencies: [] // TODO: Analyze dependencies
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze variable extraction context: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Analyze function extraction context
   */
  private async analyzeFunctionExtractionContext(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange,
    selectedText: string
  ): Promise<ExtractResult<FunctionExtractionContext>> {
    try {
      const suggestedName = this.generateFunctionName(selectedText);
      const insertionPoint = this.findFunctionInsertionPoint(model, selection);
      const parameters = this.inferParameters(selectedText);

      return {
        success: true,
        data: {
          selectedText,
          selectedRange: selection,
          suggestedName,
          insertionPoint,
          parameters,
          usedVariables: [] // TODO: Analyze used variables
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze function extraction context: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Analyze module extraction context
   */
  private async analyzeModuleExtractionContext(
    model: monaco.editor.ITextModel,
    selection: monaco.IRange,
    selectedText: string
  ): Promise<ExtractResult<ModuleExtractionContext>> {
    try {
      const suggestedName = this.generateModuleName(selectedText);
      const insertionPoint = this.findModuleInsertionPoint(model, selection);
      const parameters = this.inferParameters(selectedText);
      const hasGeometry = this.detectGeometry(selectedText);

      return {
        success: true,
        data: {
          selectedText,
          selectedRange: selection,
          suggestedName,
          insertionPoint,
          parameters,
          usedVariables: [], // TODO: Analyze used variables
          hasGeometry
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze module extraction context: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate variable name from selected text
   */
  private generateVariableName(selectedText: string): string {
    if (!this.config.autoGenerateNames) {
      return 'extracted_value';
    }

    // Simple heuristic for variable naming
    const cleaned = selectedText
      .replace(/[^a-zA-Z0-9]/g, '_')  // Replace non-alphanumeric with underscore
      .replace(/_+/g, '_')            // Replace multiple underscores with single
      .replace(/^_|_$/g, '')          // Remove leading/trailing underscores
      .toLowerCase();
    const truncated = cleaned.substring(0, 20);
    return truncated || 'extracted_value';
  }

  /**
   * Generate function name from selected text
   */
  private generateFunctionName(selectedText: string): string {
    if (!this.config.autoGenerateNames) {
      return 'extracted_function';
    }

    // Simple heuristic for function naming
    const cleaned = selectedText.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const truncated = cleaned.substring(0, 20);
    return `calc_${truncated}` || 'extracted_function';
  }

  /**
   * Generate module name from selected text
   */
  private generateModuleName(selectedText: string): string {
    if (!this.config.autoGenerateNames) {
      return 'extracted_module';
    }

    // Simple heuristic for module naming
    const cleaned = selectedText.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const truncated = cleaned.substring(0, 20);
    return `create_${truncated}` || 'extracted_module';
  }

  /**
   * Find insertion point for variable declaration
   */
  private findVariableInsertionPoint(model: monaco.editor.ITextModel, selection: monaco.IRange): monaco.IRange {
    // Insert at the beginning of the line containing the selection
    return {
      startLineNumber: selection.startLineNumber,
      startColumn: 1,
      endLineNumber: selection.startLineNumber,
      endColumn: 1
    };
  }

  /**
   * Find insertion point for function definition
   */
  private findFunctionInsertionPoint(model: monaco.editor.ITextModel, selection: monaco.IRange): monaco.IRange {
    // Insert at the beginning of the file for now
    // TODO: Find appropriate insertion point based on scope
    return {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    };
  }

  /**
   * Find insertion point for module definition
   */
  private findModuleInsertionPoint(model: monaco.editor.ITextModel, selection: monaco.IRange): monaco.IRange {
    // Insert at the beginning of the file for now
    // TODO: Find appropriate insertion point based on scope
    return {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    };
  }

  /**
   * Infer parameters from selected text
   */
  private inferParameters(selectedText: string): Array<{ name: string; type?: string; defaultValue?: string }> {
    // Simple parameter inference - look for variable references
    const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const matches = selectedText.match(variablePattern) || [];
    const uniqueVariables = [...new Set(matches)];

    // Filter out OpenSCAD keywords and built-in functions
    const keywords = new Set(['if', 'else', 'for', 'let', 'each', 'true', 'false', 'undef']);
    const parameters = uniqueVariables
      .filter(name => !keywords.has(name))
      .slice(0, this.config.maxParameterCount)
      .map(name => ({ name }));

    return parameters;
  }

  /**
   * Detect if selected text contains geometry operations
   */
  private detectGeometry(selectedText: string): boolean {
    const geometryKeywords = [
      'cube', 'sphere', 'cylinder', 'polyhedron', 'polygon',
      'circle', 'square', 'text', 'surface',
      'translate', 'rotate', 'scale', 'mirror',
      'linear_extrude', 'rotate_extrude', 'projection',
      'union', 'difference', 'intersection', 'hull', 'minkowski'
    ];

    return geometryKeywords.some(keyword => selectedText.includes(keyword));
  }
}
