/**
 * Parser Resource Manager for OpenSCAD Parser Integration
 * 
 * Provides functional resource management patterns for the EnhancedOpenscadParser
 * with automatic cleanup, error handling, and lifecycle management.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { EnhancedOpenscadParser, SimpleErrorHandler } from '@holistic-stack/openscad-parser';
import type { ASTNode } from '@holistic-stack/openscad-parser';

/**
 * Result type for functional error handling
 * Provides discriminated union for safe error management
 */
export type Result<T, E = Error> = 
  | { readonly success: true; readonly value: T } 
  | { readonly success: false; readonly error: E };

/**
 * Configuration options for parser initialization
 */
export interface ParserConfig {
  /** Path to OpenSCAD WASM grammar file */
  readonly wasmPath?: string;
  /** Path to Tree-sitter WASM file */
  readonly treeSitterWasmPath?: string;
  /** Enable debug logging */
  readonly enableLogging?: boolean;
}

/**
 * Parser Resource Manager
 * 
 * Manages EnhancedOpenscadParser lifecycle with functional patterns:
 * - Automatic resource cleanup
 * - Immutable state management
 * - Pure function composition
 * - Comprehensive error handling
 */
export class ParserResourceManager {
  private parser: EnhancedOpenscadParser | null = null;
  private readonly config: ParserConfig;
  private readonly logger: Console;

  constructor(config: ParserConfig = {}) {
    this.config = Object.freeze({ ...config });
    this.logger = console; // Can be injected for testing
  }

  /**
   * Initialize parser with WASM resources
   * 
   * @returns Result containing initialized parser or error
   */
  private async initializeParser(): Promise<Result<EnhancedOpenscadParser, string>> {
    if (this.config.enableLogging) {
      this.logger.log('[ParserResourceManager] Initializing parser...');
    }

    try {
      // Create error handler for parser
      const errorHandler = new SimpleErrorHandler();
      
      // Create parser instance
      const parser = new EnhancedOpenscadParser(errorHandler);
      
      // Initialize WASM resources
      await parser.init(this.config.wasmPath, this.config.treeSitterWasmPath);
      
      this.parser = parser;
      
      if (this.config.enableLogging) {
        this.logger.log('[ParserResourceManager] Parser initialized successfully');
      }
      
      return { success: true, value: parser };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.config.enableLogging) {
        this.logger.error('[ParserResourceManager] Parser initialization failed:', errorMessage);
      }
      
      return { 
        success: false, 
        error: `Parser initialization failed: ${errorMessage}` 
      };
    }
  }

  /**
   * Dispose parser and clean up resources
   * 
   * @private
   */
  private async disposeParser(): Promise<void> {
    if (this.parser) {
      if (this.config.enableLogging) {
        this.logger.log('[ParserResourceManager] Disposing parser resources...');
      }
      
      try {
        // Clean up WASM resources if dispose method exists
        if (typeof this.parser.dispose === 'function') {
          this.parser.dispose();
        }
      } catch (error) {
        if (this.config.enableLogging) {
          this.logger.warn('[ParserResourceManager] Warning during parser disposal:', error);
        }
      } finally {
        this.parser = null;
      }
    }
  }

  /**
   * Higher-order function for parser resource management
   * 
   * Provides automatic resource cleanup using the functional Resource pattern.
   * Guarantees parser disposal even if the operation throws an error.
   * 
   * @param operation - Function to execute with initialized parser
   * @returns Result containing operation result or error
   */
  async withParser<T>(
    operation: (parser: EnhancedOpenscadParser) => Promise<Result<T, string>>
  ): Promise<Result<T, string>> {
    // Initialize parser
    const initResult = await this.initializeParser();
    if (!initResult.success) {
      return initResult;
    }

    try {
      // Execute operation with initialized parser
      const result = await operation(initResult.value);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.config.enableLogging) {
        this.logger.error('[ParserResourceManager] Operation failed:', errorMessage);
      }
      
      return {
        success: false,
        error: `Parser operation failed: ${errorMessage}`
      };
    } finally {
      // Guaranteed resource cleanup
      await this.disposeParser();
    }
  }

  /**
   * Parse OpenSCAD code to AST with automatic resource management
   * 
   * @param code - OpenSCAD source code to parse
   * @returns Result containing immutable AST or error
   */
  async parseOpenSCAD(code: string): Promise<Result<ReadonlyArray<ASTNode>, string>> {
    if (!code.trim()) {
      return { 
        success: false, 
        error: 'Empty or whitespace-only OpenSCAD code provided' 
      };
    }

    return this.withParser(async (parser) => {
      try {
        // Parse AST using the parser
        const ast = parser.parseAST(code);
        
        if (!Array.isArray(ast)) {
          return { 
            success: false, 
            error: 'Parser returned invalid AST structure' 
          };
        }

        // Return immutable copy of AST
        const immutableAST = Object.freeze([...ast]) as ReadonlyArray<ASTNode>;
        
        if (this.config.enableLogging) {
          this.logger.log(`[ParserResourceManager] Successfully parsed ${immutableAST.length} AST nodes`);
        }
        
        return { success: true, value: immutableAST };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { 
          success: false, 
          error: `AST parsing failed: ${errorMessage}` 
        };
      }
    });
  }

  /**
   * Check if parser is currently initialized
   * 
   * @returns True if parser is active
   */
  isParserActive(): boolean {
    return this.parser !== null;
  }
}

/**
 * Factory function for creating ParserResourceManager instances
 * 
 * @param config - Parser configuration options
 * @returns New ParserResourceManager instance
 */
export function createParserResourceManager(config?: ParserConfig): ParserResourceManager {
  return new ParserResourceManager(config);
}

/**
 * Convenience function for one-off parsing operations
 * 
 * @param code - OpenSCAD source code
 * @param config - Optional parser configuration
 * @returns Result containing parsed AST or error
 */
export async function parseOpenSCADCode(
  code: string, 
  config?: ParserConfig
): Promise<Result<ReadonlyArray<ASTNode>, string>> {
  const manager = createParserResourceManager(config);
  return manager.parseOpenSCAD(code);
}
