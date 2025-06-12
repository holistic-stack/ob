/**
 * Babylon.js Scene Debugging Tool
 * Based on community debugging tools from Babylon.js forum
 * Helps identify mesh visibility issues, camera problems, and scene state
 */

import * as BABYLON from '@babylonjs/core';

export interface SceneDebugInfo {
  readonly meshes: {
    readonly total: number;
    readonly visible: number;
    readonly enabled: number;
    readonly ready: number;
    readonly withGeometry: number;
    readonly withMaterial: number;
    readonly details: ReadonlyArray<MeshDebugInfo>;
  };
  readonly camera: {
    readonly type: string;
    readonly position: string;
    readonly target: string;
    readonly radius?: number;
    readonly alpha?: number;
    readonly beta?: number;
    readonly isReady: boolean;
  };
  readonly lights: {
    readonly total: number;
    readonly enabled: number;
    readonly details: ReadonlyArray<LightDebugInfo>;
  };
  readonly scene: {
    readonly isReady: boolean;
    readonly isDisposed: boolean;
    readonly activeCamera: boolean;
    readonly activeMeshes: number;
    readonly totalVertices: number;
    readonly totalIndices: number;
  };
  readonly rendering: {
    readonly isRenderingEnabled: boolean;
    readonly lastFrameTime: number;
    readonly fps: number;
  };
}

export interface MeshDebugInfo {
  readonly name: string;
  readonly id: string;
  readonly isVisible: boolean;
  readonly isEnabled: boolean;
  readonly isReady: boolean;
  readonly hasGeometry: boolean;
  readonly hasMaterial: boolean;
  readonly vertices: number;
  readonly indices: number;
  readonly position: string;
  readonly scaling: string;
  readonly rotation: string;
  readonly boundingBox: {
    readonly min: string;
    readonly max: string;
    readonly center: string;
    readonly size: string;
  };
  readonly material?: {
    readonly name: string;
    readonly type: string;
    readonly isReady: boolean;
    readonly diffuseColor?: string;
    readonly emissiveColor?: string;
    readonly specularColor?: string;
    readonly backFaceCulling?: boolean;
    readonly wireframe?: boolean;
  };
}

export interface LightDebugInfo {
  readonly name: string;
  readonly type: string;
  readonly isEnabled: boolean;
  readonly intensity: number;
  readonly position?: string;
  readonly direction?: string;
  readonly diffuse?: string;
  readonly specular?: string;
}

/**
 * Comprehensive scene debugging utility
 */
export class SceneDebugger {
  private scene: BABYLON.Scene;
  private engine: BABYLON.Engine;

  constructor(scene: BABYLON.Scene, engine: BABYLON.Engine) {
    this.scene = scene;
    this.engine = engine;
  }

  /**
   * Get comprehensive debug information about the scene
   */
  getDebugInfo(): SceneDebugInfo {
    console.log('[DEBUG] 🔍 Collecting scene debug information...');

    const meshes = this.scene.meshes;
    const camera = this.scene.activeCamera;
    const lights = this.scene.lights;

    // Mesh analysis
    const meshDetails = meshes.map(mesh => this.getMeshDebugInfo(mesh));
    const visibleMeshes = meshes.filter(mesh => mesh.isVisible).length;
    const enabledMeshes = meshes.filter(mesh => mesh.isEnabled()).length;
    const readyMeshes = meshes.filter(mesh => mesh.isReady()).length;
    const meshesWithGeometry = meshes.filter(mesh => mesh.geometry !== null).length;
    const meshesWithMaterial = meshes.filter(mesh => mesh.material !== null).length;

    // Camera analysis
    const cameraInfo = this.getCameraDebugInfo(camera);

    // Light analysis
    const lightDetails = lights.map(light => this.getLightDebugInfo(light));
    const enabledLights = lights.filter(light => light.isEnabled()).length;

    // Scene analysis
    const activeMeshes = this.scene.getActiveMeshes();
    const totalVertices = this.scene.totalVerticesPerfCounter?.current || 0;
    const totalIndices = this.scene.totalActiveIndicesPerfCounter?.current || 0;

    // Rendering analysis
    const fps = this.engine.getFps();
    const lastFrameTime = this.engine.getDeltaTime();

    const debugInfo: SceneDebugInfo = {
      meshes: {
        total: meshes.length,
        visible: visibleMeshes,
        enabled: enabledMeshes,
        ready: readyMeshes,
        withGeometry: meshesWithGeometry,
        withMaterial: meshesWithMaterial,
        details: meshDetails
      },
      camera: cameraInfo,
      lights: {
        total: lights.length,
        enabled: enabledLights,
        details: lightDetails
      },
      scene: {
        isReady: this.scene.isReady(),
        isDisposed: this.scene.isDisposed,
        activeCamera: camera !== null,
        activeMeshes: activeMeshes.length,
        totalVertices,
        totalIndices
      },
      rendering: {
        isRenderingEnabled: !this.engine.isDisposed,
        lastFrameTime,
        fps
      }
    };

    console.log('[DEBUG] 📊 Scene debug info collected:', debugInfo);
    return debugInfo;
  }

  /**
   * Get detailed information about a specific mesh
   */
  private getMeshDebugInfo(mesh: BABYLON.AbstractMesh): MeshDebugInfo {
    const boundingInfo = mesh.getBoundingInfo();
    const boundingBox = boundingInfo.boundingBox;

    const meshInfo: MeshDebugInfo = {
      name: mesh.name,
      id: mesh.id,
      isVisible: mesh.isVisible,
      isEnabled: mesh.isEnabled(),
      isReady: mesh.isReady(),
      hasGeometry: mesh.geometry !== null,
      hasMaterial: mesh.material !== null,
      vertices: mesh.getTotalVertices(),
      indices: mesh.getTotalIndices(),
      position: mesh.position.toString(),
      scaling: mesh.scaling.toString(),
      rotation: mesh.rotation.toString(),
      boundingBox: {
        min: boundingBox.minimum.toString(),
        max: boundingBox.maximum.toString(),
        center: boundingBox.center.toString(),
        size: boundingBox.extendSize.toString()
      }
    };

    // Add material information if available
    if (mesh.material) {
      const material = mesh.material as BABYLON.StandardMaterial;
      const materialInfo = {
        name: material.name,
        type: material.getClassName(),
        isReady: material.isReady(),
        diffuseColor: material.diffuseColor?.toString(),
        emissiveColor: material.emissiveColor?.toString(),
        specularColor: material.specularColor?.toString(),
        backFaceCulling: material.backFaceCulling,
        wireframe: material.wireframe
      };
      (meshInfo as any).material = materialInfo;
    }

    return meshInfo;
  }

  /**
   * Get detailed information about the camera
   */
  private getCameraDebugInfo(camera: BABYLON.Camera | null): SceneDebugInfo['camera'] {
    if (!camera) {
      return {
        type: 'None',
        position: 'N/A',
        target: 'N/A',
        isReady: false
      };
    }

    let cameraInfo: SceneDebugInfo['camera'] = {
      type: camera.getClassName(),
      position: camera.position.toString(),
      target: 'N/A',
      isReady: camera.isReady()
    };

    // Add ArcRotateCamera specific information
    if (camera instanceof BABYLON.ArcRotateCamera) {
      cameraInfo = {
        ...cameraInfo,
        target: camera.target.toString(),
        radius: camera.radius,
        alpha: camera.alpha,
        beta: camera.beta
      };
    }

    return cameraInfo;
  }

  /**
   * Get detailed information about a light
   */
  private getLightDebugInfo(light: BABYLON.Light): LightDebugInfo {
    let lightInfo: LightDebugInfo = {
      name: light.name,
      type: light.getClassName(),
      isEnabled: light.isEnabled(),
      intensity: light.intensity
    };

    // Add position for point lights
    if (light instanceof BABYLON.PointLight) {
      lightInfo = {
        ...lightInfo,
        position: light.position.toString()
      };
    }

    // Add direction for directional lights
    if (light instanceof BABYLON.DirectionalLight) {
      lightInfo = {
        ...lightInfo,
        direction: light.direction.toString()
      };
    }

    // Add color information
    lightInfo = {
      ...lightInfo,
      diffuse: light.diffuse.toString(),
      specular: light.specular.toString()
    };

    return lightInfo;
  }

  /**
   * Log comprehensive debug information to console
   */
  logDebugInfo(): void {
    const debugInfo = this.getDebugInfo();

    console.group('[DEBUG] 🔍 Babylon.js Scene Debug Report');
    
    console.group('📦 Meshes');
    console.log(`Total: ${debugInfo.meshes.total}`);
    console.log(`Visible: ${debugInfo.meshes.visible}/${debugInfo.meshes.total}`);
    console.log(`Enabled: ${debugInfo.meshes.enabled}/${debugInfo.meshes.total}`);
    console.log(`Ready: ${debugInfo.meshes.ready}/${debugInfo.meshes.total}`);
    console.log(`With Geometry: ${debugInfo.meshes.withGeometry}/${debugInfo.meshes.total}`);
    console.log(`With Material: ${debugInfo.meshes.withMaterial}/${debugInfo.meshes.total}`);
    
    debugInfo.meshes.details.forEach(mesh => {
      console.group(`🔸 Mesh: ${mesh.name}`);
      console.log(`Visible: ${mesh.isVisible}, Enabled: ${mesh.isEnabled}, Ready: ${mesh.isReady}`);
      console.log(`Geometry: ${mesh.hasGeometry}, Material: ${mesh.hasMaterial}`);
      console.log(`Vertices: ${mesh.vertices}, Indices: ${mesh.indices}`);
      console.log(`Position: ${mesh.position}`);
      console.log(`Bounding Box Center: ${mesh.boundingBox.center}`);
      console.log(`Bounding Box Size: ${mesh.boundingBox.size}`);
      if (mesh.material) {
        console.log(`Material: ${mesh.material.name} (${mesh.material.type})`);
        console.log(`Material Ready: ${mesh.material.isReady}`);
      }
      console.groupEnd();
    });
    console.groupEnd();

    console.group('📷 Camera');
    console.log(`Type: ${debugInfo.camera.type}`);
    console.log(`Position: ${debugInfo.camera.position}`);
    console.log(`Target: ${debugInfo.camera.target}`);
    if (debugInfo.camera.radius !== undefined) {
      console.log(`Radius: ${debugInfo.camera.radius}`);
      console.log(`Alpha: ${debugInfo.camera.alpha}, Beta: ${debugInfo.camera.beta}`);
    }
    console.log(`Ready: ${debugInfo.camera.isReady}`);
    console.groupEnd();

    console.group('💡 Lights');
    console.log(`Total: ${debugInfo.lights.total}, Enabled: ${debugInfo.lights.enabled}`);
    debugInfo.lights.details.forEach(light => {
      console.log(`${light.name} (${light.type}): Intensity ${light.intensity}, Enabled: ${light.isEnabled}`);
    });
    console.groupEnd();

    console.group('🎬 Scene');
    console.log(`Ready: ${debugInfo.scene.isReady}, Disposed: ${debugInfo.scene.isDisposed}`);
    console.log(`Active Camera: ${debugInfo.scene.activeCamera}`);
    console.log(`Active Meshes: ${debugInfo.scene.activeMeshes}`);
    console.log(`Total Vertices: ${debugInfo.scene.totalVertices}`);
    console.log(`Total Indices: ${debugInfo.scene.totalIndices}`);
    console.groupEnd();

    console.group('🎮 Rendering');
    console.log(`Enabled: ${debugInfo.rendering.isRenderingEnabled}`);
    console.log(`FPS: ${debugInfo.rendering.fps.toFixed(1)}`);
    console.log(`Frame Time: ${debugInfo.rendering.lastFrameTime.toFixed(2)}ms`);
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Check for common visibility issues and provide suggestions
   */
  diagnoseVisibilityIssues(): string[] {
    const debugInfo = this.getDebugInfo();
    const issues: string[] = [];

    // Check if there are any meshes
    if (debugInfo.meshes.total === 0) {
      issues.push('❌ No meshes found in scene');
    }

    // Check if meshes are visible
    if (debugInfo.meshes.visible === 0 && debugInfo.meshes.total > 0) {
      issues.push('❌ All meshes are invisible (isVisible = false)');
    }

    // Check if meshes are enabled
    if (debugInfo.meshes.enabled === 0 && debugInfo.meshes.total > 0) {
      issues.push('❌ All meshes are disabled (isEnabled = false)');
    }

    // Check if meshes have geometry
    if (debugInfo.meshes.withGeometry === 0 && debugInfo.meshes.total > 0) {
      issues.push('❌ No meshes have geometry');
    }

    // Check if meshes have materials
    if (debugInfo.meshes.withMaterial === 0 && debugInfo.meshes.total > 0) {
      issues.push('⚠️ No meshes have materials (may appear black)');
    }

    // Check camera
    if (!debugInfo.scene.activeCamera) {
      issues.push('❌ No active camera in scene');
    }

    // Check lights
    if (debugInfo.lights.enabled === 0) {
      issues.push('⚠️ No enabled lights (meshes may appear black)');
    }

    // Check if scene is ready
    if (!debugInfo.scene.isReady) {
      issues.push('⚠️ Scene is not ready');
    }

    // Check camera positioning for ArcRotateCamera
    if (debugInfo.camera.type === 'ArcRotateCamera' && debugInfo.camera.radius !== undefined) {
      if (debugInfo.camera.radius < 1) {
        issues.push('⚠️ Camera too close to target (radius < 1)');
      }
      if (debugInfo.camera.radius > 1000) {
        issues.push('⚠️ Camera too far from target (radius > 1000)');
      }
    }

    return issues;
  }
}

/**
 * Create and use scene debugger
 */
export function debugScene(scene: BABYLON.Scene, engine: BABYLON.Engine): SceneDebugger {
  return new SceneDebugger(scene, engine);
}

/**
 * Quick debug function for immediate scene analysis
 */
export function quickDebugScene(scene: BABYLON.Scene, engine: BABYLON.Engine): void {
  const sceneDebugger = new SceneDebugger(scene, engine);
  sceneDebugger.logDebugInfo();

  const issues = sceneDebugger.diagnoseVisibilityIssues();
  if (issues.length > 0) {
    console.group('[DEBUG] 🚨 Potential Issues Found');
    issues.forEach(issue => console.log(issue));
    console.groupEnd();
  } else {
    console.log('[DEBUG] ✅ No obvious visibility issues detected');
  }
}
