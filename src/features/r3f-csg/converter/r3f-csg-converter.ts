/**
 * @file R3F CSG Converter
 * 
 * Comprehensive converter service that handles the complete conversion from OpenSCAD code
 * to React Three Fiber components, providing a high-level API with error handling,
 * performance monitoring, and resource management.
 * 
 * Features:
 * - High-level conversion API from OpenSCAD to R3F components
 * - React component generation with proper JSX structure
 * - Performance monitoring and optimization
 * - Comprehensive error handling and recovery
 * - Resource management and cleanup
 * - Caching and incremental updates
 * - Progress tracking and metrics
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import { createR3FPipelineProcessor } from '../pipeline/processor/r3f-pipeline-processor';
import type {
  Result,
  ProcessingMetrics,
  ProcessingProgress,
  R3FPipelineConfig,
  R3FCSGConverterConfig,
  CanvasConfig,
  SceneConfig,
  ControlsConfig,
  ConversionResult,
  ConverterState,
} from '../types/r3f-csg-types';

export type {
  R3FCSGConverterConfig,
  ConversionResult,
  ConverterState,
  ProcessingProgress,
};

// ============================================================================
// Converter Configuration
// ============================================================================

/**
 * Configuration for the R3F CSG converter
 */

/**
 * Canvas configuration for React Three Fiber
 */

/**
 * Scene configuration
 */

/**
 * Controls configuration
 */

/**
 * Conversion result containing React components and metadata
 */

/**
 * Converter state for tracking conversions
 */

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONVERTER_CONFIG: Required<R3FCSGConverterConfig> = {
  pipelineConfig: {
    enableCaching: true,
    enableOptimization: true,
    enableLogging: true,
    enableProgressTracking: true,
  },
  canvasConfig: {
    width: '100%',
    height: '100%',
    style: {},
    camera: {
      position: [10, 10, 10],
      fov: 75,
      near: 0.1,
      far: 1000,
    },
    shadows: true,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  },
  sceneConfig: {
    backgroundColor: '#2c3e50',
    showAxes: true,
    showGrid: true,
    fog: undefined,
    enableGrid: true,
    enableAxes: true,
    enableStats: false,
  },
  controlsConfig: {
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
    enableOrbitControls: true,
    autoRotate: false,
    autoRotateSpeed: 1,
  },
  enableLogging: true,
  enableCaching: true,
  enableReactComponents: true,
  enablePerformanceMonitoring: true,
  enableProgressTracking: true,
} as const;

// ============================================================================
// R3F CSG Converter Implementation
// ============================================================================

/**
 * React Three Fiber CSG converter
 * 
 * Provides a high-level API for converting OpenSCAD code to React Three Fiber
 * components with comprehensive error handling, performance monitoring, and
 * resource management.
 */
export class R3FCSGConverter {
  private readonly config: Required<R3FCSGConverterConfig>;
  private readonly processor: ReturnType<typeof createR3FPipelineProcessor>;
  private readonly conversionCache = new Map<string, ConversionResult>();
  private readonly disposables: Set<THREE.Object3D> = new Set();
  private state: ConverterState;

  constructor(config: R3FCSGConverterConfig = {}) {
    console.log('[INIT] Creating R3F CSG Converter');
    
    this.config = { ...DEFAULT_CONVERTER_CONFIG, ...config };
    this.processor = createR3FPipelineProcessor(this.config.pipelineConfig);
    
    this.state = {
      isProcessing: false,
      conversionCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F CSG Converter configuration:', this.config);
    }
  }

  /**
   * Convert OpenSCAD code to React Three Fiber components
   */
  public async convertToR3F(
    openscadCode: string,
    onProgress?: (progress: ProcessingProgress) => void,
    onError?: (error: string, stage: string) => void
  ): Promise<ConversionResult> {
    const startTime = performance.now();
    
    if (this.config.enableLogging) {
      console.log('[DEBUG] Starting OpenSCAD to R3F conversion');
    }

    // Update state
    this.state = {
      ...this.state,
      isProcessing: true,
      currentProgress: undefined,
      lastError: undefined
    };

    try {
      // Check cache if enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(openscadCode);
        const cachedResult = this.conversionCache.get(cacheKey);
        if (cachedResult) {
          this.state = {
            ...this.state,
            isProcessing: false,
            cacheHits: this.state.cacheHits + 1
          };
          
          if (this.config.enableLogging) {
            console.log('[DEBUG] Cache hit for OpenSCAD conversion');
          }
          
          return cachedResult;
        }
        
        this.state = {
          ...this.state,
          cacheMisses: this.state.cacheMisses + 1
        };
      }

      // Process through pipeline
      const pipelineResult = await this.processor.processOpenSCAD(
        openscadCode,
        (progress) => {
          this.state = { ...this.state, currentProgress: progress };
          if (onProgress) onProgress(progress);
        },
        onError
      );

      if (!pipelineResult.success) {
        this.state = {
          ...this.state,
          isProcessing: false,
          lastError: pipelineResult.error
        };
        
        return {
          success: false,
          error: pipelineResult.error
        };
      }

      // Generate React components
      const componentResult = this.generateReactComponents(pipelineResult.data);
      
      if (!componentResult.success) {
        this.state = {
          ...this.state,
          isProcessing: false,
          lastError: componentResult.error
        };
        
        return componentResult;
      }

      // Create final result
      const conversionResult: ConversionResult = {
        success: true,
        data: {
          ...componentResult.data!,
          scene: pipelineResult.data.scene,
          camera: pipelineResult.data.camera,
          meshes: pipelineResult.data.meshes,
          metrics: pipelineResult.data.metrics
        }
      };

      // Cache result if enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(openscadCode);
        this.conversionCache.set(cacheKey, conversionResult);
      }

      // Track for disposal
      this.disposables.add(pipelineResult.data.scene);

      // Update state
      const processingTime = performance.now() - startTime;
      this.state = {
        ...this.state,
        isProcessing: false,
        conversionCount: this.state.conversionCount + 1,
        currentProgress: {
          stage: 'complete',
          progress: 100,
          message: `Conversion complete in ${processingTime.toFixed(2)}ms`,
          timeElapsed: processingTime
        }
      };

      if (this.config.enableLogging) {
        console.log('[DEBUG] OpenSCAD to R3F conversion completed successfully');
      }

      return conversionResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      const processingTime = performance.now() - startTime;
      
      this.state = {
        ...this.state,
        isProcessing: false,
        lastError: errorMessage
      };

      if (this.config.enableLogging) {
        console.error('[ERROR] Conversion failed:', errorMessage);
      }

      if (onError) {
        onError(errorMessage, 'conversion');
      }

      return {
        success: false,
        error: `Conversion failed after ${processingTime.toFixed(2)}ms: ${errorMessage}`
      };
    }
  }

  /**
   * Convert OpenSCAD code to JSX string
   */
  public async convertToJSX(
    openscadCode: string,
    componentName: string = 'OpenSCADScene'
  ): Promise<Result<string, string>> {
    try {
      const conversionResult = await this.convertToR3F(openscadCode);
      
      if (!conversionResult.success) {
        return { success: false, error: conversionResult.error! };
      }

      const jsx = this.generateJSXString(componentName, conversionResult.data!);
      
      return { success: true, data: jsx };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JSX generation error';
      return { success: false, error: `JSX generation failed: ${errorMessage}` };
    }
  }

  /**
   * Get converter state
   */
  public getState(): ConverterState {
    return { ...this.state };
  }

  /**
   * Get conversion statistics
   */
  public getStatistics() {
    return {
      conversionCount: this.state.conversionCount,
      cacheHits: this.state.cacheHits,
      cacheMisses: this.state.cacheMisses,
      cacheHitRate: this.state.conversionCount > 0 
        ? (this.state.cacheHits / this.state.conversionCount) * 100 
        : 0,
      cacheSize: this.conversionCache.size,
      isProcessing: this.state.isProcessing
    };
  }

  /**
   * Clear conversion cache
   */
  public clearCache(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG] Clearing conversion cache');
    }

    this.conversionCache.clear();
    
    this.state = {
      ...this.state,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG] Disposing R3F CSG Converter');
    }

    // Dispose processor
    this.processor.dispose();

    // Dispose tracked scenes
    this.disposables.forEach(object => {
      if (object instanceof THREE.Scene) {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        object.clear();
      }
    });

    // Clear caches
    this.clearCache();
    this.disposables.clear();

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F CSG Converter disposed successfully');
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateReactComponents(pipelineData: {
    scene: THREE.Scene;
    camera?: THREE.Camera;
    meshes: THREE.Mesh[];
    metrics: ProcessingMetrics;
  }): Result<{
    CanvasComponent: React.ComponentType<any>;
    SceneComponent: React.ComponentType<any>;
    MeshComponents: React.ComponentType<any>[];
    jsx: string;
  }, string> {
    try {
      if (this.config.enableLogging) {
        console.log('[DEBUG] Generating React components from pipeline data');
      }

      // Generate mesh components
      const MeshComponents = pipelineData.meshes.map((mesh, index) => {
        return React.memo(() => (
          React.createElement('mesh', {
            key: `mesh-${index}`,
            position: [mesh.position.x, mesh.position.y, mesh.position.z],
            rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
            scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z]
          }, [
            React.createElement('primitive', {
              key: 'geometry',
              object: mesh.geometry
            }),
            React.createElement('primitive', {
              key: 'material',
              object: mesh.material
            })
          ])
        ));
      });

      // Generate scene component
      const SceneComponent = React.memo(() => (
        React.createElement(React.Fragment, {}, [
          // Lighting
          React.createElement('ambientLight', {
            key: 'ambient',
            intensity: 0.4
          }),
          React.createElement('directionalLight', {
            key: 'directional',
            position: [10, 10, 5],
            intensity: 1.0,
            castShadow: this.config.canvasConfig?.shadows
          }),
          React.createElement('pointLight', {
            key: 'point',
            position: [-5, 5, 5],
            intensity: 0.5
          }),
          
          // Grid and axes (if enabled)
          ...(this.config.sceneConfig?.enableGrid ? [
            React.createElement(Grid, {
              key: 'grid',
              args: [20, 20],
              cellColor: '#808080',
              sectionColor: '#e0e0e0'
            })
          ] : []),
          
          // Meshes
          ...MeshComponents.map((Component, index) => 
            React.createElement(Component, { key: `mesh-component-${index}` })
          ),
          
          // Controls
          ...(this.config.controlsConfig?.enableOrbitControls
            ? [
                React.createElement(OrbitControls, {
                  key: 'controls',
                  enableZoom: this.config.controlsConfig.enableZoom ?? true,
                  enablePan: this.config.controlsConfig.enablePan ?? true,
                  enableRotate: this.config.controlsConfig.enableRotate ?? true,
                  autoRotate: this.config.controlsConfig.autoRotate ?? false,
                  autoRotateSpeed: this.config.controlsConfig.autoRotateSpeed ?? 2.0,
                }),
              ]
            : []),
          
          // Stats (if enabled)
          ...(this.config.sceneConfig?.enableStats ? [
            React.createElement(Stats, { key: 'stats' })
          ] : [])
        ])
      ));

      // Generate canvas component
      const CanvasComponent = React.memo((props: any) => (
        React.createElement(Canvas, {
          shadows: this.config.canvasConfig?.shadows,
          camera: this.config.canvasConfig?.camera,
          gl: {
            antialias: this.config.canvasConfig?.antialias,
            alpha: this.config.canvasConfig?.alpha,
            preserveDrawingBuffer: this.config.canvasConfig?.preserveDrawingBuffer,
            powerPreference: this.config.canvasConfig?.powerPreference
          },
          style: { width: '100%', height: '100%' },
          ...props
        }, React.createElement(SceneComponent))
      ));

      // Generate JSX string
      const jsx = this.generateJSXString('OpenSCADScene', {
        CanvasComponent,
        SceneComponent,
        MeshComponents,
        scene: pipelineData.scene,
        camera: pipelineData.camera,
        meshes: pipelineData.meshes,
        metrics: pipelineData.metrics,
        jsx: '' // Will be filled by generateJSXString
      });

      if (this.config.enableLogging) {
        console.log('[DEBUG] React components generated successfully');
      }

      return {
        success: true,
        data: {
          CanvasComponent,
          SceneComponent,
          MeshComponents,
          jsx
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown component generation error';
      if (this.config.enableLogging) {
        console.error('[ERROR] React component generation failed:', errorMessage);
      }
      
      return { success: false, error: `Component generation failed: ${errorMessage}` };
    }
  }

  private generateJSXString(componentName: string, data: any): string {
    return `
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';

export const ${componentName} = () => {
  return (
    <Canvas
      shadows={${this.config.canvasConfig?.shadows}}
      camera={{
        position: [${this.config.canvasConfig?.camera?.position?.join(', ')}],
        fov: ${this.config.canvasConfig?.camera?.fov}
      }}
      gl={{
        antialias: ${this.config.canvasConfig?.antialias},
        powerPreference: "${this.config.canvasConfig?.powerPreference}"
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.0} 
        castShadow={${this.config.canvasConfig?.shadows}}
      />
      <pointLight position={[-5, 5, 5]} intensity={0.5} />
      
      ${this.config.sceneConfig?.enableGrid ? `
      {/* Grid */}
      <Grid args={[20, 20]} cellColor="#808080" sectionColor="#e0e0e0" />
      ` : ''}
      
      {/* Generated Meshes */}
      {/* TODO: Add mesh components here */}
      
      ${this.config.controlsConfig?.enableOrbitControls ? `
      {/* Controls */}
      <OrbitControls 
        enableZoom={${this.config.controlsConfig.enableZoom}}
        enablePan={${this.config.controlsConfig.enablePan}}
        enableRotate={${this.config.controlsConfig.enableRotate}}
        autoRotate={${this.config.controlsConfig.autoRotate}}
      />
      ` : ''}
      
      ${this.config.sceneConfig?.enableStats ? `
      {/* Performance Stats */}
      <Stats />
      ` : ''}
    </Canvas>
  );
};

export default ${componentName};
    `.trim();
  }

  private generateCacheKey(openscadCode: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < openscadCode.length; i++) {
      const char = openscadCode.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `r3f_csg_${hash.toString(36)}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new R3F CSG converter instance
 */
export function createR3FCSGConverter(config?: R3FCSGConverterConfig): R3FCSGConverter {
  return new R3FCSGConverter(config);
}

// Default export
export default R3FCSGConverter;
