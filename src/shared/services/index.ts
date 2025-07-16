/**
 * @file Shared services barrel export
 *
 * Centralized export for all shared services following bulletproof-react architecture.
 * Services provide reusable business logic and external integrations.
 */

export type { ComponentLogger, LoggerConfig, TsLogLevel } from './logger.service';
export { createLogger, logger } from './logger.service';

export {
  FeatureDetectionService,
  FeatureSupportLevel,
} from './feature-detection';
export type {
  BrowserCapabilities,
  FeatureSupport,
  FeatureDetectionError,
} from './feature-detection';

export {
  UserErrorHandlerService,
  ErrorCategory,
} from './user-error-handler';
export type {
  UserErrorMessage,
} from './user-error-handler';

export { OperationHistoryService } from './operation-history';
export type {
  Operation,
  OperationResult,
  HistoryState,
  ExecutionOptions,
} from './operation-history';

export { TelemetryService } from './telemetry';
export type {
  TelemetryConfig,
  TelemetryEvent,
  ErrorEvent,
  PerformanceEvent,
  UserEvent,
  SystemEvent,
} from './telemetry';
