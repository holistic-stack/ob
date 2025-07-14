/**
 * @file BabylonJS CSG2 Service Exports
 *
 * Exports for the BabylonJS CSG2 service.
 */

export { BabylonCSG2Service } from './babylon-csg2-service';

// Re-export types from babylon-csg.types
export type {
  CSGOperationConfig as CSG2Config,
  CSGServiceState as CSG2State,
  CSGError as CSG2Error,
  CSGUnionResult as CSG2OperationResult,
  CSGUnionResult as CSG2InitResult,
  CSGUnionResult as CSG2DisposeResult,
} from '../../types/babylon-csg.types';

// Re-export enums and constants
export { CSGErrorCode as CSG2ErrorCode, DEFAULT_CSG_CONFIG as DEFAULT_CSG2_CONFIG } from '../../types/babylon-csg.types';
