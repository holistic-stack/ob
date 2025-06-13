/**
 * @file Playwright Console Debugger Utility
 * 
 * Comprehensive console debugging utility for @playwright/experimental-ct-react component tests.
 * Captures and formats browser console output for debugging OpenSCAD to Babylon.js pipeline.
 * 
 * Features:
 * - Console message filtering by type (log, warn, error, debug)
 * - Structured logging with timestamps and context
 * - Test-specific console message collection
 * - Enhanced debugging output formatting
 * - Memory-safe listener management
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { Page, ConsoleMessage } from '@playwright/test';

/**
 * Console message types for filtering
 */
export type ConsoleMessageType = 'log' | 'debug' | 'info' | 'warn' | 'error' | 'assert' | 'clear' | 'count' | 'countReset' | 'dir' | 'dirxml' | 'endGroup' | 'group' | 'groupCollapsed' | 'profile' | 'profileEnd' | 'startGroup' | 'table' | 'time' | 'timeEnd' | 'timeLog' | 'timeStamp' | 'trace';

/**
 * Captured console message with metadata
 */
export interface CapturedConsoleMessage {
  type: ConsoleMessageType;
  text: string;
  timestamp: Date;
  location?: string;
  args?: string[];
}

/**
 * Console debugger configuration options
 */
export interface ConsoleDebuggerOptions {
  /** Filter messages by type (default: all types) */
  filterTypes?: ConsoleMessageType[];
  /** Include timestamp in output (default: true) */
  includeTimestamp?: boolean;
  /** Include location information (default: true) */
  includeLocation?: boolean;
  /** Maximum number of messages to store (default: 1000) */
  maxMessages?: number;
  /** Enable verbose output to Node.js console (default: true) */
  enableVerboseOutput?: boolean;
  /** Prefix for console output (default: '[BROWSER]') */
  outputPrefix?: string;
}

/**
 * Default configuration for console debugger
 */
const DEFAULT_OPTIONS: Required<ConsoleDebuggerOptions> = {
  filterTypes: ['log', 'debug', 'info', 'warn', 'error'],
  includeTimestamp: true,
  includeLocation: true,
  maxMessages: 1000,
  enableVerboseOutput: true,
  outputPrefix: '[BROWSER]'
};

/**
 * Console debugger class for capturing and managing browser console output
 */
export class PlaywrightConsoleDebugger {
  private messages: CapturedConsoleMessage[] = [];
  private listener: ((message: ConsoleMessage) => void) | null = null;
  private options: Required<ConsoleDebuggerOptions>;
  private isActive = false;

  constructor(options: ConsoleDebuggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start capturing console messages from the page
   */
  public startCapturing(page: Page): void {
    if (this.isActive) {
      console.warn('[CONSOLE-DEBUGGER] Already capturing console messages');
      return;
    }

    console.log(`[CONSOLE-DEBUGGER] Starting console capture with filter: [${this.options.filterTypes.join(', ')}]`);

    this.listener = (message: ConsoleMessage) => {
      this.handleConsoleMessage(message);
    };

    page.on('console', this.listener);
    this.isActive = true;
  }

  /**
   * Stop capturing console messages and clean up listener
   */
  public stopCapturing(page: Page): void {
    if (!this.isActive || !this.listener) {
      console.warn('[CONSOLE-DEBUGGER] No active console capture to stop');
      return;
    }

    page.removeListener('console', this.listener);
    this.listener = null;
    this.isActive = false;

    console.log(`[CONSOLE-DEBUGGER] Stopped console capture. Total messages captured: ${this.messages.length}`);
  }

  /**
   * Handle incoming console message
   */
  private handleConsoleMessage(message: ConsoleMessage): void {
    const messageType = message.type() as ConsoleMessageType;

    // Filter by message type
    if (!this.options.filterTypes.includes(messageType)) {
      return;
    }

    const location = message.location()?.url;
    const capturedMessage: CapturedConsoleMessage = {
      type: messageType,
      text: message.text(),
      timestamp: new Date(),
      ...(location && { location }),
      args: message.args().map(arg => String(arg))
    };

    // Add to messages array with size limit
    this.messages.push(capturedMessage);
    if (this.messages.length > this.options.maxMessages) {
      this.messages.shift(); // Remove oldest message
    }

    // Output to Node.js console if verbose mode enabled
    if (this.options.enableVerboseOutput) {
      this.outputMessage(capturedMessage);
    }
  }

  /**
   * Format and output message to Node.js console
   */
  private outputMessage(message: CapturedConsoleMessage): void {
    const timestamp = this.options.includeTimestamp 
      ? `[${message.timestamp.toISOString()}]` 
      : '';
    
    const location = this.options.includeLocation && message.location 
      ? `[${message.location}]` 
      : '';

    const prefix = `${this.options.outputPrefix}${timestamp}${location}`;
    const typeUpper = message.type.toUpperCase();

    // Use appropriate console method based on message type
    switch (message.type) {
      case 'error':
        console.error(`${prefix}[${typeUpper}] ${message.text}`);
        break;
      case 'warn':
        console.warn(`${prefix}[${typeUpper}] ${message.text}`);
        break;
      case 'debug':
        console.debug(`${prefix}[${typeUpper}] ${message.text}`);
        break;
      default:
        console.log(`${prefix}[${typeUpper}] ${message.text}`);
    }
  }

  /**
   * Get all captured messages
   */
  public getMessages(): CapturedConsoleMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages filtered by type
   */
  public getMessagesByType(type: ConsoleMessageType): CapturedConsoleMessage[] {
    return this.messages.filter(msg => msg.type === type);
  }

  /**
   * Get error messages only
   */
  public getErrorMessages(): CapturedConsoleMessage[] {
    return this.getMessagesByType('error');
  }

  /**
   * Get warning messages only
   */
  public getWarningMessages(): CapturedConsoleMessage[] {
    return this.getMessagesByType('warn');
  }

  /**
   * Check if any error messages were captured
   */
  public hasErrors(): boolean {
    return this.getErrorMessages().length > 0;
  }

  /**
   * Check if any warning messages were captured
   */
  public hasWarnings(): boolean {
    return this.getWarningMessages().length > 0;
  }

  /**
   * Clear all captured messages
   */
  public clearMessages(): void {
    this.messages = [];
    console.log('[CONSOLE-DEBUGGER] Cleared all captured messages');
  }

  /**
   * Get summary of captured messages
   */
  public getSummary(): { [key in ConsoleMessageType]?: number } {
    const summary: { [key in ConsoleMessageType]?: number } = {};
    
    for (const message of this.messages) {
      summary[message.type] = (summary[message.type] ?? 0) + 1;
    }

    return summary;
  }

  /**
   * Print summary to console
   */
  public printSummary(): void {
    const summary = this.getSummary();
    console.log('[CONSOLE-DEBUGGER] Message Summary:');
    
    for (const [type, count] of Object.entries(summary)) {
      console.log(`  ${type}: ${count}`);
    }
    
    console.log(`  Total: ${this.messages.length}`);
  }

  /**
   * Export messages as JSON for external analysis
   */
  public exportMessages(): string {
    return JSON.stringify(this.messages, null, 2);
  }

  /**
   * Check if debugger is currently active
   */
  public isCapturing(): boolean {
    return this.isActive;
  }
}

/**
 * Create a console debugger instance with default OpenSCAD pipeline settings
 */
export function createOpenSCADConsoleDebugger(): PlaywrightConsoleDebugger {
  return new PlaywrightConsoleDebugger({
    filterTypes: ['log', 'debug', 'info', 'warn', 'error'],
    includeTimestamp: true,
    includeLocation: false, // Disable location for cleaner output
    maxMessages: 500,
    enableVerboseOutput: true,
    outputPrefix: '[OPENSCAD-PIPELINE]'
  });
}

/**
 * Create a console debugger instance for Babylon.js debugging
 */
export function createBabylonConsoleDebugger(): PlaywrightConsoleDebugger {
  return new PlaywrightConsoleDebugger({
    filterTypes: ['log', 'debug', 'warn', 'error'],
    includeTimestamp: true,
    includeLocation: false,
    maxMessages: 300,
    enableVerboseOutput: true,
    outputPrefix: '[BABYLON-DEBUG]'
  });
}
