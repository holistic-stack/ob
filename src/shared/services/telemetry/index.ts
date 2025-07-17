/**
 * @file Telemetry Service
 *
 * Comprehensive telemetry collection for production monitoring including
 * error tracking, performance metrics, user interactions, and system health.
 */

export type {
  ErrorEvent,
  PerformanceEvent,
  SystemEvent,
  TelemetryConfig,
  TelemetryEvent,
  UserEvent,
} from './telemetry.service';
export { TelemetryService } from './telemetry.service';
