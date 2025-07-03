/**
 * @file Centralized logging service using tslog
 *
 * Provides a unified logging interface that maintains existing [INIT]/[DEBUG]/[ERROR]/[WARN]/[END][ComponentName]
 * patterns while leveraging tslog's enhanced capabilities for better debugging and performance.
 *
 * Features:
 * - Maintains backward compatibility with existing logging patterns
 * - Performance optimization for production builds
 * - TypeScript-native logging with structured output
 * - Customizable log levels and formatting
 * - Component-specific logger creation
 *
 * @author OpenSCAD 3D Visualization Team
 * @version 1.0.0
 */

import { type ILogObj, Logger } from 'tslog';

/**
 * Log levels matching existing patterns (tslog specific)
 */
export type TsLogLevel = 'SILLY' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  /** Component name for logging context */
  name?: string;
  /** Minimum log level to display */
  minLevel?: number;
  /** Enable pretty formatting (default: true in development) */
  pretty?: boolean;
  /** Hide log position for production performance */
  hideLogPosition?: boolean;
}

/**
 * Component-specific logger interface maintaining existing patterns
 */
export interface ComponentLogger {
  /** Log initialization messages [INIT][ComponentName] */
  init: (message: string, ...args: unknown[]) => void;
  /** Log debug messages [DEBUG][ComponentName] */
  debug: (message: string, ...args: unknown[]) => void;
  /** Log info messages [INFO][ComponentName] */
  info: (message: string, ...args: unknown[]) => void;
  /** Log warning messages [WARN][ComponentName] */
  warn: (message: string, ...args: unknown[]) => void;
  /** Log error messages [ERROR][ComponentName] */
  error: (message: string, ...args: unknown[]) => void;
  /** Log end/completion messages [END][ComponentName] */
  end: (message: string, ...args: unknown[]) => void;
}

/**
 * Default logger configuration optimized for the OpenSCAD 3D visualization project
 */
const defaultConfig: LoggerConfig = {
  name: 'OpenSCAD',
  minLevel: 4, // Show INFO logs and above (INFO, WARN, ERROR, FATAL)
  pretty: import.meta.env.MODE !== 'production',
  hideLogPosition: import.meta.env.MODE === 'production',
};

/**
 * Create tslog instance with custom configuration
 */
function createTslogInstance(config: LoggerConfig): Logger<ILogObj> {
  return new Logger<ILogObj>({
    name: config.name ?? 'Logger',
    minLevel: config.minLevel ?? 0,
    type: config.pretty ? 'pretty' : 'json',
    hideLogPositionForProduction: config.hideLogPosition ?? false,
    prettyLogTemplate:
      '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{filePathWithLine}}{{nameWithDelimiterPrefix}}]\t',
    prettyLogStyles: {
      logLevelName: {
        '*': ['bold', 'black', 'bgWhiteBright', 'dim'],
        SILLY: ['bold', 'white'],
        TRACE: ['bold', 'whiteBright'],
        DEBUG: ['bold', 'green'],
        INFO: ['bold', 'blue'],
        WARN: ['bold', 'yellow'],
        ERROR: ['bold', 'red'],
        FATAL: ['bold', 'redBright'],
      },
      dateIsoStr: 'white',
      filePathWithLine: 'white',
      name: ['white', 'bold'],
      nameWithDelimiterPrefix: ['white', 'bold'],
    },
    prettyErrorTemplate: '\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}',
    prettyErrorStackTemplate: '  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}',
  });
}

/**
 * Create a component-specific logger that maintains existing patterns
 */
export function createLogger(
  componentName: string,
  config: Partial<LoggerConfig> = {}
): ComponentLogger {
  const loggerConfig: LoggerConfig = {
    ...defaultConfig,
    ...config,
    name: componentName,
  };

  const tslogInstance = createTslogInstance(loggerConfig);

  return {
    init: (message: string, ...args: unknown[]) => {
      tslogInstance.info(`[INIT][${componentName}] ${message}`, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
      tslogInstance.debug(`[DEBUG][${componentName}] ${message}`, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      tslogInstance.info(`[INFO][${componentName}] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      tslogInstance.warn(`[WARN][${componentName}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      tslogInstance.error(`[ERROR][${componentName}] ${message}`, ...args);
    },
    end: (message: string, ...args: unknown[]) => {
      tslogInstance.info(`[END][${componentName}] ${message}`, ...args);
    },
  };
}

/**
 * Default application logger instance
 */
export const logger = createLogger('OpenSCAD');
