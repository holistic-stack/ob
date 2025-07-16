/**
 * @file Feature Detection Service
 * 
 * Comprehensive feature detection and capability checking for graceful
 * degradation in production environments.
 */

export { FeatureDetectionService, FeatureSupportLevel } from './feature-detection.service';
export type {
  BrowserCapabilities,
  FeatureSupport,
  FeatureDetectionError,
} from './feature-detection.service';
