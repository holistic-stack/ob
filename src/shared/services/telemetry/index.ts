/**
 * @file Telemetry Service
 * 
 * Comprehensive telemetry collection for production monitoring including
 * error tracking, performance metrics, user interactions, and system health.
 */

export { TelemetryService } from './telemetry.service';
export type {
  TelemetryConfig,
  TelemetryEvent,
  ErrorEvent,
  PerformanceEvent,
  UserEvent,
  SystemEvent,
} from './telemetry.service';
