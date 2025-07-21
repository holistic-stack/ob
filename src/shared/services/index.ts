/**
 * @file Shared services barrel export
 *
 * Centralized export for all shared services following bulletproof-react architecture.
 * Services provide reusable business logic and external integrations.
 */

export type { ComponentLogger, LoggerConfig, TsLogLevel } from './logger.service';
export { createLogger, logger } from './logger.service';
