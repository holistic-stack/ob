/**
 * @file Loading Spinner Component Tests
 * 
 * Comprehensive test suite for the LoadingSpinner component following TDD principles.
 * Tests cover functionality, variants, sizes, and accessibility.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner Component', () => {
  beforeEach(() => {
    console.log('[INIT] Starting LoadingSpinner component test');
  });

  describe('Basic Rendering', () => {
    it('should render loading spinner with default props', () => {
      console.log('[DEBUG] Testing basic spinner rendering');
      
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      
      console.log('[DEBUG] Basic spinner rendering test passed');
    });

    it('should render with custom test id', () => {
      console.log('[DEBUG] Testing spinner with test id');
      
      render(<LoadingSpinner data-testid="custom-spinner" />);
      
      const spinner = screen.getByTestId('custom-spinner');
      expect(spinner).toBeInTheDocument();
      
      console.log('[DEBUG] Spinner test id test passed');
    });

    it('should apply custom className', () => {
      console.log('[DEBUG] Testing spinner with custom className');
      
      render(<LoadingSpinner className="custom-class" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
      expect(spinner).toHaveClass('loading-spinner');
      
      console.log('[DEBUG] Spinner className test passed');
    });
  });

  describe('Variants', () => {
    it('should render circle variant by default', () => {
      console.log('[DEBUG] Testing default circle variant');
      
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--circle');
      
      console.log('[DEBUG] Circle variant test passed');
    });

    it('should render dots variant', () => {
      console.log('[DEBUG] Testing dots variant');
      
      render(<LoadingSpinner variant="dots" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--dots');
      
      console.log('[DEBUG] Dots variant test passed');
    });

    it('should render bars variant', () => {
      console.log('[DEBUG] Testing bars variant');
      
      render(<LoadingSpinner variant="bars" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--bars');
      
      console.log('[DEBUG] Bars variant test passed');
    });

    it('should render pulse variant', () => {
      console.log('[DEBUG] Testing pulse variant');
      
      render(<LoadingSpinner variant="pulse" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--pulse');
      
      console.log('[DEBUG] Pulse variant test passed');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      console.log('[DEBUG] Testing default medium size');
      
      render(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--medium');
      
      console.log('[DEBUG] Medium size test passed');
    });

    it('should render small size', () => {
      console.log('[DEBUG] Testing small size');
      
      render(<LoadingSpinner size="small" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--small');
      
      console.log('[DEBUG] Small size test passed');
    });

    it('should render large size', () => {
      console.log('[DEBUG] Testing large size');
      
      render(<LoadingSpinner size="large" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--large');
      
      console.log('[DEBUG] Large size test passed');
    });
  });

  describe('Custom Properties', () => {
    it('should apply custom color', () => {
      console.log('[DEBUG] Testing custom color');
      
      render(<LoadingSpinner color="#ff0000" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle('--spinner-color: #ff0000');
      
      console.log('[DEBUG] Custom color test passed');
    });

    it('should render with custom aria-label', () => {
      console.log('[DEBUG] Testing custom aria-label');
      
      render(<LoadingSpinner aria-label="Processing data" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Processing data');
      
      // Should also have screen reader text
      expect(screen.getByText('Processing data')).toBeInTheDocument();
      
      console.log('[DEBUG] Custom aria-label test passed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing ARIA attributes');
      
      render(<LoadingSpinner aria-label="Loading content" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading content');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      
      console.log('[DEBUG] ARIA attributes test passed');
    });

    it('should include screen reader text', () => {
      console.log('[DEBUG] Testing screen reader text');
      
      render(<LoadingSpinner aria-label="Loading data" />);
      
      // Screen reader text should be present but visually hidden
      const srText = screen.getByText('Loading data');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('loading-spinner__sr-only');
      
      console.log('[DEBUG] Screen reader text test passed');
    });
  });

  describe('Variant-Specific Elements', () => {
    it('should render dots elements for dots variant', () => {
      console.log('[DEBUG] Testing dots variant elements');
      
      const { container } = render(<LoadingSpinner variant="dots" />);
      
      const dotsContainer = container.querySelector('.loading-spinner__dots');
      expect(dotsContainer).toBeInTheDocument();
      
      const dots = container.querySelectorAll('.loading-spinner__dot');
      expect(dots).toHaveLength(3);
      
      console.log('[DEBUG] Dots variant elements test passed');
    });

    it('should render bars elements for bars variant', () => {
      console.log('[DEBUG] Testing bars variant elements');
      
      const { container } = render(<LoadingSpinner variant="bars" />);
      
      const barsContainer = container.querySelector('.loading-spinner__bars');
      expect(barsContainer).toBeInTheDocument();
      
      const bars = container.querySelectorAll('.loading-spinner__bar');
      expect(bars).toHaveLength(3);
      
      console.log('[DEBUG] Bars variant elements test passed');
    });

    it('should render SVG for circle variant', () => {
      console.log('[DEBUG] Testing circle variant SVG');
      
      const { container } = render(<LoadingSpinner variant="circle" />);
      
      const circleContainer = container.querySelector('.loading-spinner__circle');
      expect(circleContainer).toBeInTheDocument();
      
      const svg = container.querySelector('.loading-spinner__svg');
      expect(svg).toBeInTheDocument();
      
      const circlePath = container.querySelector('.loading-spinner__circle-path');
      expect(circlePath).toBeInTheDocument();
      
      console.log('[DEBUG] Circle variant SVG test passed');
    });

    it('should render pulse element for pulse variant', () => {
      console.log('[DEBUG] Testing pulse variant element');
      
      const { container } = render(<LoadingSpinner variant="pulse" />);
      
      const pulseContainer = container.querySelector('.loading-spinner__pulse');
      expect(pulseContainer).toBeInTheDocument();
      
      const pulseCircle = container.querySelector('.loading-spinner__pulse-circle');
      expect(pulseCircle).toBeInTheDocument();
      
      console.log('[DEBUG] Pulse variant element test passed');
    });
  });
});
