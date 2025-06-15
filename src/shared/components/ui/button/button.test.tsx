/**
 * @file Button Component Tests
 * 
 * Comprehensive test suite for the Button component following TDD principles.
 * Tests cover functionality, accessibility, variants, states, and edge cases.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Button, ButtonGroup } from './button';

describe('Button Component', () => {
  beforeEach(() => {
    console.log('[INIT] Starting Button component test');
  });

  describe('Basic Rendering', () => {
    it('should render button with text content', () => {
      console.log('[DEBUG] Testing basic button rendering');
      
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
      
      console.log('[DEBUG] Basic button rendering test passed');
    });

    it('should render with custom test id', () => {
      console.log('[DEBUG] Testing button with test id');
      
      render(<Button data-testid="custom-button">Test</Button>);
      
      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
      
      console.log('[DEBUG] Button test id test passed');
    });

    it('should apply custom className', () => {
      console.log('[DEBUG] Testing button with custom className');
      
      render(<Button className="custom-class">Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('button');
      
      console.log('[DEBUG] Button className test passed');
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      console.log('[DEBUG] Testing default primary variant');
      
      render(<Button>Primary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--primary');
      
      console.log('[DEBUG] Primary variant test passed');
    });

    it('should render secondary variant', () => {
      console.log('[DEBUG] Testing secondary variant');
      
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--secondary');
      
      console.log('[DEBUG] Secondary variant test passed');
    });

    it('should render danger variant', () => {
      console.log('[DEBUG] Testing danger variant');
      
      render(<Button variant="danger">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--danger');
      
      console.log('[DEBUG] Danger variant test passed');
    });

    it('should render ghost variant', () => {
      console.log('[DEBUG] Testing ghost variant');
      
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--ghost');
      
      console.log('[DEBUG] Ghost variant test passed');
    });

    it('should render link variant', () => {
      console.log('[DEBUG] Testing link variant');
      
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--link');
      
      console.log('[DEBUG] Link variant test passed');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      console.log('[DEBUG] Testing default medium size');
      
      render(<Button>Medium</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--medium');
      
      console.log('[DEBUG] Medium size test passed');
    });

    it('should render small size', () => {
      console.log('[DEBUG] Testing small size');
      
      render(<Button size="small">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--small');
      
      console.log('[DEBUG] Small size test passed');
    });

    it('should render large size', () => {
      console.log('[DEBUG] Testing large size');
      
      render(<Button size="large">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--large');
      
      console.log('[DEBUG] Large size test passed');
    });
  });

  describe('States', () => {
    it('should handle disabled state', () => {
      console.log('[DEBUG] Testing disabled state');
      
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('button--disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      
      console.log('[DEBUG] Disabled state test passed');
    });

    it('should handle loading state', () => {
      console.log('[DEBUG] Testing loading state');
      
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('button--loading');
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      // Should show loading spinner
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeInTheDocument();
      
      console.log('[DEBUG] Loading state test passed');
    });

    it('should handle full width', () => {
      console.log('[DEBUG] Testing full width');
      
      render(<Button fullWidth>Full Width</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--full-width');
      
      console.log('[DEBUG] Full width test passed');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', async () => {
      console.log('[DEBUG] Testing onClick handler');
      
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
      
      console.log('[DEBUG] onClick handler test passed');
    });

    it('should not call onClick when disabled', async () => {
      console.log('[DEBUG] Testing disabled onClick');
      
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      
      console.log('[DEBUG] Disabled onClick test passed');
    });

    it('should not call onClick when loading', async () => {
      console.log('[DEBUG] Testing loading onClick');
      
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
      
      console.log('[DEBUG] Loading onClick test passed');
    });

    it('should handle async onClick', async () => {
      console.log('[DEBUG] Testing async onClick');
      
      const asyncHandler = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      
      render(<Button onClick={asyncHandler}>Async</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      await waitFor(() => {
        expect(asyncHandler).toHaveBeenCalledTimes(1);
      });
      
      console.log('[DEBUG] Async onClick test passed');
    });

    it('should handle onClick errors', async () => {
      console.log('[DEBUG] Testing onClick error handling');
      
      const errorHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const user = userEvent.setup();
      
      render(<Button onClick={errorHandler}>Error</Button>);
      
      const button = screen.getByRole('button');
      
      // Should throw error for error boundaries to catch
      await expect(user.click(button)).rejects.toThrow('Test error');
      
      console.log('[DEBUG] onClick error handling test passed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing ARIA attributes');
      
      render(<Button loading disabled>Accessible</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      
      console.log('[DEBUG] ARIA attributes test passed');
    });

    it('should support keyboard navigation', async () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
      
      console.log('[DEBUG] Keyboard navigation test passed');
    });
  });

  describe('ButtonGroup', () => {
    it('should render button group', () => {
      console.log('[DEBUG] Testing ButtonGroup rendering');
      
      render(
        <ButtonGroup data-testid="button-group">
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </ButtonGroup>
      );
      
      const group = screen.getByTestId('button-group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveClass('button-group');
      expect(group).toHaveAttribute('role', 'group');
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      
      console.log('[DEBUG] ButtonGroup rendering test passed');
    });
  });
});
