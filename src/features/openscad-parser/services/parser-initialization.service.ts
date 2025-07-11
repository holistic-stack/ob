/**
 * Parser Initialization Service
 *
 * Handles proper initialization of the OpenSCAD parser with singleton pattern,
 * preventing multiple initialization calls and ensuring thread-safe initialization.
 *
 * This service addresses the potential import hang issues by:
 * 1. Ensuring parser is initialized only once
 * 2. Providing proper error handling and recovery
 * 3. Managing WASM loading with timeout protection
 * 4. Offering initialization status checking
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { OpenscadParser } from '../openscad-parser.js';

const logger = createLogger('ParserInitializationService');

/**
 * Parser initialization state
 */
type InitializationState = 'not-initialized' | 'initializing' | 'initialized' | 'failed';

/**
 * Parser initialization configuration
 */
interface ParserInitConfig {
  wasmPath?: string;
  treeSitterWasmPath?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Default configuration for parser initialization
 */
const DEFAULT_CONFIG: Required<ParserInitConfig> = {
  wasmPath: './tree-sitter-openscad.wasm',
  treeSitterWasmPath: './tree-sitter.wasm',
  timeoutMs: 10000, // 10 second timeout
  retryAttempts: 3,
  retryDelayMs: 1000,
};

/**
 * Singleton parser initialization service
 */
class ParserInitializationService {
  private static instance: ParserInitializationService | null = null;
  private parser: OpenscadParser | null = null;
  private state: InitializationState = 'not-initialized';
  private initializationPromise: Promise<Result<OpenscadParser, string>> | null = null;
  private config: Required<ParserInitConfig>;

  private constructor(config: ParserInitConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.init('Parser initialization service created');
  }

  /**
   * Get singleton instance of the parser initialization service
   */
  public static getInstance(config?: ParserInitConfig): ParserInitializationService {
    if (!ParserInitializationService.instance) {
      ParserInitializationService.instance = new ParserInitializationService(config);
    }
    return ParserInitializationService.instance;
  }

  /**
   * Get the current initialization state
   */
  public getState(): InitializationState {
    return this.state;
  }

  /**
   * Check if parser is ready for use
   */
  public isReady(): boolean {
    return this.state === 'initialized' && this.parser !== null;
  }

  /**
   * Get the initialized parser instance
   */
  public getParser(): OpenscadParser | null {
    return this.parser;
  }

  /**
   * Initialize the parser with proper error handling and timeout protection
   */
  public async initialize(
    config?: Partial<ParserInitConfig>
  ): Promise<Result<OpenscadParser, string>> {
    // If already initialized, return the existing parser
    if (this.state === 'initialized' && this.parser) {
      logger.debug('Parser already initialized, returning existing instance');
      return { success: true, data: this.parser };
    }

    // If currently initializing, return the existing promise
    if (this.state === 'initializing' && this.initializationPromise) {
      logger.debug('Parser initialization in progress, waiting for completion');
      return this.initializationPromise;
    }

    // Update configuration if provided
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start initialization
    this.state = 'initializing';
    logger.init('Starting parser initialization');

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual parser initialization with retry logic
   */
  private async performInitialization(): Promise<Result<OpenscadParser, string>> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        logger.debug(`Parser initialization attempt ${attempt}/${this.config.retryAttempts}`);

        // Create new parser instance
        const parser = new OpenscadParser();

        // Initialize with timeout protection
        const initResult = await this.initializeWithTimeout(parser);

        if (initResult.success) {
          this.parser = parser;
          this.state = 'initialized';
          logger.init('Parser initialization completed successfully');
          return { success: true, data: parser };
        } else {
          lastError = initResult.error;
          logger.warn(`Parser initialization attempt ${attempt} failed: ${lastError}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        logger.warn(`Parser initialization attempt ${attempt} threw error: ${lastError}`);
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.config.retryAttempts) {
        logger.debug(`Waiting ${this.config.retryDelayMs}ms before retry`);
        await this.delay(this.config.retryDelayMs);
      }
    }

    // All attempts failed
    this.state = 'failed';
    const errorMessage = `Parser initialization failed after ${this.config.retryAttempts} attempts. Last error: ${lastError}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  /**
   * Initialize parser with timeout protection
   */
  private async initializeWithTimeout(parser: OpenscadParser): Promise<Result<void, string>> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: `Parser initialization timed out after ${this.config.timeoutMs}ms`,
        });
      }, this.config.timeoutMs);

      parser
        .init(this.config.wasmPath, this.config.treeSitterWasmPath)
        .then(() => {
          clearTimeout(timeoutId);
          resolve({ success: true, data: undefined });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          const errorMessage = error instanceof Error ? error.message : String(error);
          resolve({ success: false, error: errorMessage });
        });
    });
  }

  /**
   * Reset the parser initialization state (for testing or recovery)
   */
  public reset(): void {
    logger.debug('Resetting parser initialization service');

    if (this.parser) {
      try {
        this.parser.dispose();
      } catch (error) {
        logger.warn('Error disposing parser during reset:', error);
      }
    }

    this.parser = null;
    this.state = 'not-initialized';
    this.initializationPromise = null;
  }

  /**
   * Dispose of the parser and clean up resources
   */
  public dispose(): void {
    logger.debug('Disposing parser initialization service');
    this.reset();
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Get the singleton parser initialization service instance
 */
export const getParserInitializationService = (
  config?: ParserInitConfig
): ParserInitializationService => {
  return ParserInitializationService.getInstance(config);
};

/**
 * Initialize the parser with proper error handling
 * This is the main function that should be used throughout the application
 */
export const initializeParser = async (
  config?: ParserInitConfig
): Promise<Result<OpenscadParser, string>> => {
  const service = getParserInitializationService();
  return service.initialize(config);
};

/**
 * Get the initialized parser instance
 * Returns null if parser is not initialized
 */
export const getInitializedParser = (): OpenscadParser | null => {
  const service = getParserInitializationService();
  return service.getParser();
};

/**
 * Check if parser is ready for use
 */
export const isParserReady = (): boolean => {
  const service = getParserInitializationService();
  return service.isReady();
};

/**
 * Get current parser initialization state
 */
export const getParserState = (): InitializationState => {
  const service = getParserInitializationService();
  return service.getState();
};

export type { ParserInitConfig, InitializationState };

// Export the class for testing purposes
export { ParserInitializationService };
