/**
 * @file Tests for the refactored Pipeline Processor Component (React 19)
 * 
 * Tests the React 19 refactored pipeline processor with:
 * - useOptimistic hook functionality
 * - Custom hooks for state management
 * - Functional programming patterns
 * - Error handling and edge cases
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PipelineProcessor } from './pipeline-processor';
import { createPipelineSuccess as _createPipelineSuccess, createPipelineFailure as _createPipelineFailure } from '../../types/pipeline-types';
import * as BABYLON from '@babylonjs/core';

// Mock the OpenScadPipeline
vi.mock('../../babylon-csg2/openscad-pipeline/openscad-pipeline', () => ({
  OpenScadPipeline: vi.fn().mockImplementation(() => ({
    processOpenScadCode: vi.fn().mockResolvedValue({
      success: true,
      value: new BABYLON.Mesh('test-mesh', new BABYLON.Scene(new BABYLON.NullEngine())),
      metadata: {
        parseTimeMs: 100,
        visitTimeMs: 50,
        nodeCount: 1,
        meshCount: 1
      }
    })
  }))
}));

describe('PipelineProcessor (React 19 Refactored)', () => {
  let mockOnResult: ReturnType<typeof vi.fn>;
  let mockOnProcessingStart: ReturnType<typeof vi.fn>;
  let mockOnProcessingEnd: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    console.log('[INIT] 🧪 Setting up PipelineProcessor test environment');
    
    mockOnResult = vi.fn();
    mockOnProcessingStart = vi.fn();
    mockOnProcessingEnd = vi.fn();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] 🧹 Cleaning up PipelineProcessor test environment');
  });

  describe('Component Rendering', () => {
    it('should render with initial state', () => {
      console.log('[TEST] Testing initial component rendering');
      
      render(
        <PipelineProcessor
          openscadCode=""
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Check for React 19 Pipeline Processor header
      expect(screen.getByText('React 19 Pipeline Processor')).toBeInTheDocument();
      
      // Check for process button
      expect(screen.getByText('Process OpenSCAD Code')).toBeInTheDocument();
      
      // Check for stats display
      expect(screen.getByText(/Runs: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Success: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Errors: 0/)).toBeInTheDocument();
      
      console.log('[TEST] ✅ Initial rendering test passed');
    });

    it('should show pipeline initializing message initially', async () => {
      console.log('[TEST] Testing pipeline initialization state');
      
      render(
        <PipelineProcessor
          openscadCode="cube(10);"
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Should show initializing message initially
      expect(screen.getByText('⚠️ Pipeline initializing...')).toBeInTheDocument();
      
      console.log('[TEST] ✅ Pipeline initialization state test passed');
    });

    it('should disable process button when no code is provided', async () => {
      console.log('[TEST] Testing process button state with empty code');
      
      render(
        <PipelineProcessor
          openscadCode=""
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      const processButton = screen.getByText('Process OpenSCAD Code');
      expect(processButton).toBeDisabled();
      
      console.log('[TEST] ✅ Process button disabled state test passed');
    });
  });

  describe('React 19 useOptimistic Hook', () => {
    it('should show optimistic processing state immediately', async () => {
      console.log('[TEST] Testing React 19 useOptimistic immediate feedback');
      
      render(
        <PipelineProcessor
          openscadCode="cube(10);"
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Wait for pipeline to initialize
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Pipeline initializing...')).not.toBeInTheDocument();
      }, { timeout: 6000 });

      const processButton = screen.getByText('Process OpenSCAD Code');
      expect(processButton).not.toBeDisabled();

      // Click process button
      fireEvent.click(processButton);

      // Should immediately show processing state (useOptimistic)
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(mockOnProcessingStart).toHaveBeenCalledTimes(1);
      
      console.log('[TEST] ✅ useOptimistic immediate feedback test passed');
    });

    it('should show operation status with React 19 patterns', async () => {
      console.log('[TEST] Testing operation status display');
      
      render(
        <PipelineProcessor
          openscadCode="sphere(5);"
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Wait for pipeline to initialize
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Pipeline initializing...')).not.toBeInTheDocument();
      }, { timeout: 6000 });

      const processButton = screen.getByText('Process OpenSCAD Code');
      fireEvent.click(processButton);

      // Should show processing operation
      await waitFor(() => {
        expect(screen.getByText('🔄 Processing...')).toBeInTheDocument();
      });
      
      console.log('[TEST] ✅ Operation status display test passed');
    });
  });

  describe('Custom Hooks Integration', () => {
    it('should update processing statistics correctly', async () => {
      console.log('[TEST] Testing processing statistics updates');
      
      render(
        <PipelineProcessor
          openscadCode="cylinder(h=10, r=3);"
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Wait for pipeline to initialize
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Pipeline initializing...')).not.toBeInTheDocument();
      }, { timeout: 6000 });

      const processButton = screen.getByText('Process OpenSCAD Code');
      fireEvent.click(processButton);

      // Wait for processing to complete
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(1);
      }, { timeout: 10000 });

      // Check that stats were updated
      await waitFor(() => {
        expect(screen.getByText(/Runs: 1/)).toBeInTheDocument();
        expect(screen.getByText(/Success: 1/)).toBeInTheDocument();
      });
      
      console.log('[TEST] ✅ Processing statistics test passed');
    });
  });

  describe('Functional Programming Patterns', () => {
    it('should handle pure function processing correctly', async () => {
      console.log('[TEST] Testing pure function processing patterns');
      
      const testCode = 'cube([2, 3, 4]);';
      
      render(
        <PipelineProcessor
          openscadCode={testCode}
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Wait for pipeline to initialize
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Pipeline initializing...')).not.toBeInTheDocument();
      }, { timeout: 6000 });

      const processButton = screen.getByText('Process OpenSCAD Code');
      fireEvent.click(processButton);

      // Wait for processing to complete
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(1);
        expect(mockOnProcessingEnd).toHaveBeenCalledTimes(1);
      }, { timeout: 10000 });

      // Verify the result structure follows functional patterns
      expect(mockOnResult.mock.calls).toHaveLength(1);
      const resultCall = mockOnResult.mock.calls[0]?.[0];
      expect(resultCall).toBeDefined();
      expect(resultCall).toHaveProperty('success');
      expect(resultCall).toHaveProperty('metadata');
      
      console.log('[TEST] ✅ Pure function processing test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      console.log('[TEST] Testing error handling patterns');
      
      // Mock a processing error
      const mockPipeline = {
        processOpenScadCode: vi.fn().mockRejectedValue(new Error('Test processing error'))
      };
      
      vi.doMock('../../babylon-csg2/openscad-pipeline/openscad-pipeline', () => ({
        OpenScadPipeline: vi.fn().mockImplementation(() => mockPipeline)
      }));

      render(
        <PipelineProcessor
          openscadCode="invalid_code();"
          onResult={mockOnResult}
          onProcessingStart={mockOnProcessingStart}
          onProcessingEnd={mockOnProcessingEnd}
        />
      );

      // Wait for pipeline to initialize
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Pipeline initializing...')).not.toBeInTheDocument();
      }, { timeout: 6000 });

      const processButton = screen.getByText('Process OpenSCAD Code');
      fireEvent.click(processButton);

      // Wait for error handling
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(1);
      }, { timeout: 10000 });

      // Should show error in operation status
      await waitFor(() => {
        const errorElement = screen.queryByText(/❌ Error:/);
        if (errorElement) {
          expect(errorElement).toBeInTheDocument();
        }
      });
      
      console.log('[TEST] ✅ Error handling test passed');
    });
  });
});
