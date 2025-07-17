/**
 * @file Shared services barrel export
 *
 * Centralized export for all shared services following bulletproof-react architecture.
 * Services provide reusable business logic and external integrations.
 */

export type {
  BrowserCapabilities,
  FeatureDetectionError,
  FeatureSupport,
} from './feature-detection';
export {
  FeatureDetectionService,
  FeatureSupportLevel,
} from './feature-detection';
export type { ComponentLogger, LoggerConfig, TsLogLevel } from './logger.service';
export { createLogger, logger } from './logger.service';
export type {
  ExecutionOptions,
  HistoryState,
  Operation,
  OperationResult,
} from './operation-history';
export { OperationHistoryService } from './operation-history';
export type {
  ErrorEvent,
  PerformanceEvent,
  SystemEvent,
  TelemetryConfig,
  TelemetryEvent,
  UserEvent,
} from './telemetry';
export { TelemetryService } from './telemetry';
export type { UserErrorMessage } from './user-error-handler';
export {
  ErrorCategory,
  UserErrorHandlerService,
} from './user-error-handler';
