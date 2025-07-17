/**
 * @file Camera Controls Component Tests
 *
 * Tests for the camera controls UI component that provides
 * camera navigation and view preset functionality.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BabylonSceneService } from '../../services/babylon-scene-service';
import { CameraControls } from './camera-controls';

// Mock the logger
vi.mock('../../../../shared/services/logger.service', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('CameraControls', () => {
  let mockSceneService: BabylonSceneService;

  beforeEach(() => {
    mockSceneService = {
      setView: vi.fn().mockResolvedValue({ success: true, data: undefined }),
      frameAll: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    } as any;
  });

  describe('rendering', () => {
    it('should render camera controls when scene service is provided', () => {
      render(<CameraControls sceneService={mockSceneService} />);

      expect(screen.getByRole('button', { name: /frame all/i })).toBeInTheDocument();
      expect(screen.getByText('View Presets')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /front/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iso/i })).toBeInTheDocument();
    });

    it('should not render when scene service is null', () => {
      const { container } = render(<CameraControls sceneService={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <CameraControls sceneService={mockSceneService} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('frame all functionality', () => {
    it('should call frameAll when frame all button is clicked', async () => {
      render(<CameraControls sceneService={mockSceneService} />);

      const frameAllButton = screen.getByRole('button', { name: /frame all/i });
      fireEvent.click(frameAllButton);

      await waitFor(() => {
        expect(mockSceneService.frameAll).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle frameAll errors gracefully', async () => {
      mockSceneService.frameAll = vi.fn().mockResolvedValue({
        success: false,
        error: { message: 'Frame all failed' },
      });

      render(<CameraControls sceneService={mockSceneService} />);

      const frameAllButton = screen.getByRole('button', { name: /frame all/i });
      fireEvent.click(frameAllButton);

      await waitFor(() => {
        expect(mockSceneService.frameAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('view presets functionality', () => {
    it('should call setView when view preset buttons are clicked', async () => {
      render(<CameraControls sceneService={mockSceneService} />);

      const frontButton = screen.getByRole('button', { name: /front/i });
      fireEvent.click(frontButton);

      await waitFor(() => {
        expect(mockSceneService.setView).toHaveBeenCalledWith('front');
      });
    });
  });
});
