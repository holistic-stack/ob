/**
 * @file useR3FEngine Hook Tests
 * 
 * TDD tests for the useR3FEngine hook following React 19 best practices
 * and functional programming principles. Tests equivalent to useBabylonEngine hook tests.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import * as THREE from 'three';
import { useR3FEngine } from './use-r3f-engine';
import type { R3FEngineConfig } from '../../types/r3f-types';

// Mock the R3F engine service
vi.mock('../../services/engine-service/r3f-engine-service', () => ({
  createR3FEngineService: vi.fn(() => ({
    createRenderer: vi.fn((canvas, config) => ({
      success: true,
      data: {
        domElement: canvas || document.createElement('canvas'),
        setSize: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        getContext: vi.fn(() => ({
          getExtension: vi.fn(),
          getParameter: vi.fn(),
          getSupportedExtensions: vi.fn(() => [])
        })),
        shadowMap: { enabled: false, type: THREE.PCFSoftShadowMap },
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace
      }
    })),
    disposeRenderer: vi.fn(),
    handleResize: vi.fn(),
    setupErrorHandlers: vi.fn()
  }))
}));

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
});

describe('useR3FEngine', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    console.log('[DEBUG] Setting up useR3FEngine test');
    
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up useR3FEngine test');
    cleanup();
    vi.clearAllMocks();
  });

  it('should initialize with null renderer when no canvas provided', () => {
    console.log('[DEBUG] Testing hook initialization with no canvas');
    
    const { result } = renderHook(() => useR3FEngine(null));
    
    expect(result.current.renderer).toBeNull();
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.dispose).toBe('function');
  });

  it('should create renderer when canvas is provided', () => {
    console.log('[DEBUG] Testing hook with canvas provided');
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.renderer).toBeDefined();
    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should create renderer with custom configuration', () => {
    console.log('[DEBUG] Testing hook with custom config');
    
    const config: R3FEngineConfig = {
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power'
    };
    
    const { result } = renderHook(() => useR3FEngine(canvas, config));
    
    expect(result.current.renderer).toBeDefined();
    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should setup resize handler when renderer is created', () => {
    console.log('[DEBUG] Testing resize handler setup');
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.isReady).toBe(true);
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle renderer creation failure', () => {
    console.log('[DEBUG] Testing renderer creation failure');
    
    // Mock the service to return failure
    const { createR3FEngineService } = require('../../services/engine-service/r3f-engine-service');
    createR3FEngineService.mockReturnValue({
      createRenderer: vi.fn(() => ({
        success: false,
        error: 'Renderer creation failed'
      })),
      disposeRenderer: vi.fn(),
      handleResize: vi.fn(),
      setupErrorHandlers: vi.fn()
    });
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.renderer).toBeNull();
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBe('Renderer creation failed');
  });

  it('should update when canvas changes', () => {
    console.log('[DEBUG] Testing canvas change handling');
    
    const { result, rerender } = renderHook(
      ({ canvas }) => useR3FEngine(canvas),
      { initialProps: { canvas } }
    );
    
    expect(result.current.isReady).toBe(true);
    
    // Change canvas
    const newCanvas = document.createElement('canvas');
    rerender({ canvas: newCanvas });
    
    expect(result.current.isReady).toBe(true);
  });

  it('should update when configuration changes', () => {
    console.log('[DEBUG] Testing configuration change handling');
    
    const initialConfig: R3FEngineConfig = { antialias: true };
    
    const { result, rerender } = renderHook(
      ({ config }) => useR3FEngine(canvas, config),
      { initialProps: { config: initialConfig } }
    );
    
    expect(result.current.isReady).toBe(true);
    
    // Change configuration
    const newConfig: R3FEngineConfig = { antialias: false, alpha: true };
    rerender({ config: newConfig });
    
    expect(result.current.isReady).toBe(true);
  });

  it('should dispose renderer on unmount', () => {
    console.log('[DEBUG] Testing renderer disposal on unmount');
    
    const { result, unmount } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.isReady).toBe(true);
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle manual disposal', () => {
    console.log('[DEBUG] Testing manual disposal');
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.isReady).toBe(true);
    
    // Call dispose manually
    result.current.dispose();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should handle resize events', () => {
    console.log('[DEBUG] Testing resize event handling');
    
    const { createR3FEngineService } = require('../../services/engine-service/r3f-engine-service');
    const mockHandleResize = vi.fn();
    
    createR3FEngineService.mockReturnValue({
      createRenderer: vi.fn(() => ({
        success: true,
        data: {
          domElement: canvas,
          setSize: vi.fn(),
          dispose: vi.fn()
        }
      })),
      disposeRenderer: vi.fn(),
      handleResize: mockHandleResize,
      setupErrorHandlers: vi.fn()
    });
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.isReady).toBe(true);
    
    // Simulate resize event
    const resizeHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'resize'
    )?.[1];
    
    if (resizeHandler) {
      resizeHandler();
      expect(mockHandleResize).toHaveBeenCalled();
    }
  });

  it('should setup error handlers', () => {
    console.log('[DEBUG] Testing error handlers setup');
    
    const { createR3FEngineService } = require('../../services/engine-service/r3f-engine-service');
    const mockSetupErrorHandlers = vi.fn();
    
    createR3FEngineService.mockReturnValue({
      createRenderer: vi.fn(() => ({
        success: true,
        data: {
          domElement: canvas,
          setSize: vi.fn(),
          dispose: vi.fn()
        }
      })),
      disposeRenderer: vi.fn(),
      handleResize: vi.fn(),
      setupErrorHandlers: mockSetupErrorHandlers
    });
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.isReady).toBe(true);
    expect(mockSetupErrorHandlers).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should handle context lost and restored events', () => {
    console.log('[DEBUG] Testing context lost/restored handling');
    
    const { createR3FEngineService } = require('../../services/engine-service/r3f-engine-service');
    let onContextLost: (() => void) | undefined;
    let onContextRestored: (() => void) | undefined;
    
    createR3FEngineService.mockReturnValue({
      createRenderer: vi.fn(() => ({
        success: true,
        data: {
          domElement: canvas,
          setSize: vi.fn(),
          dispose: vi.fn()
        }
      })),
      disposeRenderer: vi.fn(),
      handleResize: vi.fn(),
      setupErrorHandlers: vi.fn((renderer, lost, restored) => {
        onContextLost = lost;
        onContextRestored = restored;
      })
    });
    
    const { result } = renderHook(() => useR3FEngine(canvas));
    
    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();
    
    // Simulate context lost
    if (onContextLost) {
      onContextLost();
      expect(result.current.error).toBe('WebGL context lost');
    }
    
    // Simulate context restored
    if (onContextRestored) {
      onContextRestored();
      expect(result.current.error).toBeNull();
    }
  });
});
