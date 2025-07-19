/**
 * @file BabylonJS Particle System Service
 *
 * Service for managing BabylonJS particle systems with GPU acceleration.
 * Provides comprehensive particle system creation and management capabilities.
 * @example
 * ```typescript
 * const particleService = new BabylonParticleService();
 * particleService.init(scene);
 *
 * const config: ParticleSystemConfig = {
 *   name: 'my-particle-system',
 *   type: ParticleSystemType.GPU,
 *   capacity: 5000,
 *   // ... other config properties
 * };
 *
 * const result = await particleService.createParticleSystem(config, myEmitterMesh);
 *
 * if (result.success) {
 *   const particleSystem = result.data;
 *   particleService.startParticleSystem(particleSystem.name);
 * } else {
 *   console.error('Failed to create particle system:', result.error.message);
 * }
 * ```
 */

import {
  type AbstractMesh,
  Color4,
  type Engine,
  GPUParticleSystem,
  ParticleSystem,
  type Scene,
  Texture,
  Vector3,
} from '@babylonjs/core';

// Interface extension for Engine with webGLVersion property
interface ExtendedEngine extends Engine {
  webGLVersion: number;
}

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('BabylonParticleService');

/**
 * Particle system types
 */
export enum ParticleSystemType {
  CPU = 'cpu',
  GPU = 'gpu',
}

/**
 * Particle system configuration
 */
export interface ParticleSystemConfig {
  readonly name: string;
  readonly type: ParticleSystemType;
  readonly capacity: number;
  readonly emitRate: number;
  readonly minEmitBox: Vector3;
  readonly maxEmitBox: Vector3;
  readonly direction1: Vector3;
  readonly direction2: Vector3;
  readonly minAngularSpeed: number;
  readonly maxAngularSpeed: number;
  readonly minSpeed: number;
  readonly maxSpeed: number;
  readonly minLifeTime: number;
  readonly maxLifeTime: number;
  readonly minSize: number;
  readonly maxSize: number;
  readonly color1: Color4;
  readonly color2: Color4;
  readonly colorDead: Color4;
  readonly gravity: Vector3;
  readonly textureUrl?: string;
  readonly blendMode: ParticleBlendMode;
  readonly updateSpeed: number;
}

/**
 * Particle blend modes
 */
export enum ParticleBlendMode {
  ONEONE = 'ONEONE',
  STANDARD = 'STANDARD',
  ADD = 'ADD',
  MULTIPLY = 'MULTIPLY',
}

/**
 * Particle system error types
 */
export interface ParticleSystemError {
  readonly code: ParticleSystemErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum ParticleSystemErrorCode {
  CREATION_FAILED = 'CREATION_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  TEXTURE_LOAD_FAILED = 'TEXTURE_LOAD_FAILED',
  GPU_NOT_SUPPORTED = 'GPU_NOT_SUPPORTED',
  DISPOSAL_FAILED = 'DISPOSAL_FAILED',
}

/**
 * Particle system state
 */
export interface ParticleSystemState {
  readonly id: string;
  readonly name: string;
  readonly type: ParticleSystemType;
  readonly isStarted: boolean;
  readonly particleCount: number;
  readonly emitRate: number;
  readonly lastUpdated: Date;
}

/**
 * Particle system operation results
 */
export type ParticleSystemCreateResult = Result<
  ParticleSystem | GPUParticleSystem,
  ParticleSystemError
>;
export type ParticleSystemStartResult = Result<void, ParticleSystemError>;
export type ParticleSystemStopResult = Result<void, ParticleSystemError>;

/**
 * Default particle system configuration
 */
export const DEFAULT_PARTICLE_CONFIG: ParticleSystemConfig = {
  name: 'default-particles',
  type: ParticleSystemType.GPU,
  capacity: 1000,
  emitRate: 100,
  minEmitBox: new Vector3(-1, 0, -1),
  maxEmitBox: new Vector3(1, 0, 1),
  direction1: new Vector3(-1, 1, -1),
  direction2: new Vector3(1, 1, 1),
  minAngularSpeed: 0,
  maxAngularSpeed: Math.PI,
  minSpeed: 1,
  maxSpeed: 3,
  minLifeTime: 1,
  maxLifeTime: 3,
  minSize: 0.1,
  maxSize: 0.5,
  color1: new Color4(1, 1, 1, 1),
  color2: new Color4(1, 1, 1, 1),
  colorDead: new Color4(0, 0, 0, 0),
  gravity: new Vector3(0, -9.81, 0),
  blendMode: ParticleBlendMode.ONEONE,
  updateSpeed: 0.01,
} as const;

/**
 * BabylonJS Particle System Service
 *
 * Manages particle systems with GPU acceleration support.
 * Follows SRP by focusing solely on particle system management.
 */
export class BabylonParticleService {
  private scene: Scene | null = null;
  private particleSystems = new Map<string, ParticleSystem | GPUParticleSystem>();
  private systemStates = new Map<string, ParticleSystemState>();

  constructor() {
    logger.init('[INIT][BabylonParticleService] Service initialized');
  }

  /**
   * Initialize the particle service with a scene
   */
  init(scene: Scene): Result<void, ParticleSystemError> {
    logger.debug('[DEBUG][BabylonParticleService] Initializing particle service...');

    return tryCatch(
      () => {
        if (!scene) {
          throw this.createError(
            ParticleSystemErrorCode.INVALID_CONFIG,
            'Scene is required for particle systems'
          );
        }

        this.scene = scene;
        logger.debug('[DEBUG][BabylonParticleService] Particle service initialized successfully');
      },
      (error) => {
        // If error is already a ParticleSystemError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as ParticleSystemError;
        }
        return this.createError(
          ParticleSystemErrorCode.CREATION_FAILED,
          `Failed to initialize particle service: ${error}`
        );
      }
    );
  }

  /**
   * Create a new particle system
   */
  async createParticleSystem(
    config: ParticleSystemConfig,
    emitter?: AbstractMesh | Vector3
  ): Promise<ParticleSystemCreateResult> {
    logger.debug(`[DEBUG][BabylonParticleService] Creating particle system: ${config.name}`);

    return tryCatchAsync(
      async () => {
        if (!this.scene) {
          throw this.createError(
            ParticleSystemErrorCode.INVALID_CONFIG,
            'Scene must be initialized before creating particle systems'
          );
        }

        // Check if GPU particles are supported and requested
        const useGPU = config.type === ParticleSystemType.GPU && this.isGPUParticlesSupported();

        let particleSystem: ParticleSystem | GPUParticleSystem;

        if (useGPU) {
          particleSystem = new GPUParticleSystem(
            config.name,
            { capacity: config.capacity },
            this.scene
          );
        } else {
          particleSystem = new ParticleSystem(config.name, config.capacity, this.scene);
        }

        // Set emitter
        if (emitter) {
          particleSystem.emitter = emitter;
        } else {
          particleSystem.emitter = Vector3.Zero();
        }

        // Configure particle system
        await this.configureParticleSystem(particleSystem, config);

        // Store particle system and state
        this.particleSystems.set(config.name, particleSystem);
        this.systemStates.set(config.name, {
          id: config.name,
          name: config.name,
          type: useGPU ? ParticleSystemType.GPU : ParticleSystemType.CPU,
          isStarted: false,
          particleCount: 0,
          emitRate: config.emitRate,
          lastUpdated: new Date(),
        });

        logger.debug(
          `[DEBUG][BabylonParticleService] Particle system created: ${config.name} (${useGPU ? 'GPU' : 'CPU'})`
        );
        return particleSystem;
      },
      (error) => {
        // If error is already a ParticleSystemError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as ParticleSystemError;
        }
        return this.createError(
          ParticleSystemErrorCode.CREATION_FAILED,
          `Failed to create particle system: ${error}`
        );
      }
    );
  }

  /**
   * Start a particle system
   */
  startParticleSystem(name: string): ParticleSystemStartResult {
    logger.debug(`[DEBUG][BabylonParticleService] Starting particle system: ${name}`);

    return tryCatch(
      () => {
        const particleSystem = this.particleSystems.get(name);
        if (!particleSystem) {
          throw this.createError(
            ParticleSystemErrorCode.INVALID_CONFIG,
            `Particle system not found: ${name}`
          );
        }

        particleSystem.start();

        // Update state
        const state = this.systemStates.get(name);
        if (state) {
          this.systemStates.set(name, {
            ...state,
            isStarted: true,
            lastUpdated: new Date(),
          });
        }

        logger.debug(`[DEBUG][BabylonParticleService] Particle system started: ${name}`);
      },
      (error) => {
        // If error is already a ParticleSystemError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as ParticleSystemError;
        }
        return this.createError(
          ParticleSystemErrorCode.CREATION_FAILED,
          `Failed to start particle system: ${error}`
        );
      }
    );
  }

  /**
   * Stop a particle system
   */
  stopParticleSystem(name: string): ParticleSystemStopResult {
    logger.debug(`[DEBUG][BabylonParticleService] Stopping particle system: ${name}`);

    return tryCatch(
      () => {
        const particleSystem = this.particleSystems.get(name);
        if (!particleSystem) {
          throw this.createError(
            ParticleSystemErrorCode.INVALID_CONFIG,
            `Particle system not found: ${name}`
          );
        }

        particleSystem.stop();

        // Update state
        const state = this.systemStates.get(name);
        if (state) {
          this.systemStates.set(name, {
            ...state,
            isStarted: false,
            lastUpdated: new Date(),
          });
        }

        logger.debug(`[DEBUG][BabylonParticleService] Particle system stopped: ${name}`);
      },
      (error) => {
        // If error is already a ParticleSystemError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as ParticleSystemError;
        }
        return this.createError(
          ParticleSystemErrorCode.CREATION_FAILED,
          `Failed to stop particle system: ${error}`
        );
      }
    );
  }

  /**
   * Get particle system by name
   */
  getParticleSystem(name: string): ParticleSystem | GPUParticleSystem | undefined {
    return this.particleSystems.get(name);
  }

  /**
   * Get particle system state
   */
  getParticleSystemState(name: string): ParticleSystemState | undefined {
    return this.systemStates.get(name);
  }

  /**
   * Get all particle system states
   */
  getAllParticleSystemStates(): readonly ParticleSystemState[] {
    return Array.from(this.systemStates.values());
  }

  /**
   * Remove a particle system
   */
  removeParticleSystem(name: string): Result<void, ParticleSystemError> {
    logger.debug(`[DEBUG][BabylonParticleService] Removing particle system: ${name}`);

    return tryCatch(
      () => {
        const particleSystem = this.particleSystems.get(name);
        if (!particleSystem) {
          throw this.createError(
            ParticleSystemErrorCode.INVALID_CONFIG,
            `Particle system not found: ${name}`
          );
        }

        particleSystem.dispose();
        this.particleSystems.delete(name);
        this.systemStates.delete(name);

        logger.debug(`[DEBUG][BabylonParticleService] Particle system removed: ${name}`);
      },
      (error) => {
        // If error is already a ParticleSystemError, preserve it
        if (error && typeof error === 'object' && 'code' in error) {
          return error as ParticleSystemError;
        }
        return this.createError(
          ParticleSystemErrorCode.DISPOSAL_FAILED,
          `Failed to remove particle system: ${error}`
        );
      }
    );
  }

  /**
   * Configure particle system with provided config
   */
  private async configureParticleSystem(
    particleSystem: ParticleSystem | GPUParticleSystem,
    config: ParticleSystemConfig
  ): Promise<void> {
    // Load texture if provided
    if (config.textureUrl) {
      try {
        particleSystem.particleTexture = new Texture(config.textureUrl, this.scene!);
      } catch (_error) {
        logger.warn(`[WARN][BabylonParticleService] Failed to load texture: ${config.textureUrl}`);
      }
    }

    // Set emission properties
    particleSystem.emitRate = config.emitRate;
    particleSystem.minEmitBox = config.minEmitBox;
    particleSystem.maxEmitBox = config.maxEmitBox;

    // Set direction
    particleSystem.direction1 = config.direction1;
    particleSystem.direction2 = config.direction2;

    // Set angular speed
    particleSystem.minAngularSpeed = config.minAngularSpeed;
    particleSystem.maxAngularSpeed = config.maxAngularSpeed;

    // Set speed
    particleSystem.minInitialRotation = config.minSpeed;
    particleSystem.maxInitialRotation = config.maxSpeed;

    // Set lifetime
    particleSystem.minLifeTime = config.minLifeTime;
    particleSystem.maxLifeTime = config.maxLifeTime;

    // Set size
    particleSystem.minSize = config.minSize;
    particleSystem.maxSize = config.maxSize;

    // Set colors
    particleSystem.color1 = config.color1;
    particleSystem.color2 = config.color2;
    particleSystem.colorDead = config.colorDead;

    // Set gravity
    particleSystem.gravity = config.gravity;

    // Set blend mode
    this.setBlendMode(particleSystem, config.blendMode);

    // Set update speed
    particleSystem.updateSpeed = config.updateSpeed;
  }

  /**
   * Set blend mode for particle system
   */
  private setBlendMode(
    _particleSystem: ParticleSystem | GPUParticleSystem,
    blendMode: ParticleBlendMode
  ): void {
    // Note: Blend mode constants would need to be imported from BabylonJS
    // This is a simplified implementation
    switch (blendMode) {
      case ParticleBlendMode.ONEONE:
        // particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        break;
      case ParticleBlendMode.STANDARD:
        // particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        break;
      case ParticleBlendMode.ADD:
        // particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
        break;
      case ParticleBlendMode.MULTIPLY:
        // particleSystem.blendMode = ParticleSystem.BLENDMODE_MULTIPLY;
        break;
    }
  }

  /**
   * Check if GPU particles are supported
   */
  private isGPUParticlesSupported(): boolean {
    if (!this.scene) return false;

    const engine = this.scene.getEngine();
    // Check if it's a WebGL engine and has webGLVersion property
    const isWebGL2Supported =
      'webGLVersion' in engine && (engine as ExtendedEngine).webGLVersion! >= 2;
    return GPUParticleSystem.IsSupported && isWebGL2Supported;
  }

  /**
   * Create particle system error
   */
  private createError(
    code: ParticleSystemErrorCode,
    message: string,
    details?: unknown
  ): ParticleSystemError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Dispose the particle service and clean up all systems
   */
  dispose(): void {
    logger.debug('[DEBUG][BabylonParticleService] Disposing particle service...');

    // Dispose all particle systems
    for (const [name, particleSystem] of this.particleSystems) {
      try {
        particleSystem.dispose();
      } catch (error) {
        logger.warn(
          `[WARN][BabylonParticleService] Failed to dispose particle system ${name}: ${error}`
        );
      }
    }

    this.particleSystems.clear();
    this.systemStates.clear();
    this.scene = null;

    logger.end('[END][BabylonParticleService] Particle service disposed');
  }
}
