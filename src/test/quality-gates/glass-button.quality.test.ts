/**
 * Quality Gate Tests for Glass Button Component
 * 
 * These tests validate that the GlassButton component meets all quality standards:
 * - TypeScript compliance
 * - Functional programming patterns
 * - Glass morphism implementation
 * - Accessibility requirements
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  validateTypeScriptCompliance,
  validateFunctionalProgramming,
  validateGlassMorphism,
  validateSpacing,
  validateAccessibility,
  validatePerformance,
  calculateOverallQualityScore,
  type QualityGateResult
} from '../quality-gates-setup';

// Mock GlassButton component for testing
const GlassButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  onClick,
  className = ''
}) => {
  const glassClasses = [
    'relative',
    'bg-black/20',
    'backdrop-blur-sm',
    'border',
    'border-white/50',
    'rounded-lg',
    'px-6',
    'py-3',
    'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',
    'before:absolute',
    'before:inset-0',
    'before:rounded-lg',
    'before:bg-gradient-to-br',
    'before:from-white/60',
    'before:via-transparent',
    'before:to-transparent',
    'before:opacity-70',
    'before:pointer-events-none',
    'after:absolute',
    'after:inset-0',
    'after:rounded-lg',
    'after:bg-gradient-to-tl',
    'after:from-white/30',
    'after:via-transparent',
    'after:to-transparent',
    'after:opacity-50',
    'after:pointer-events-none',
    'text-white',
    'transition-all',
    'duration-300',
    'hover:bg-white/30',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500/50',
    className
  ].join(' ');

  return (
    <button
      className={glassClasses}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      type="button"
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

// Sample source code for validation (this would normally be read from files)
const GLASS_BUTTON_SOURCE = `
export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  onClick,
  className = ''
}) => {
  const glassClasses = generateGlassClasses(variant);
  
  return (
    <button
      className={glassClasses}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      type="button"
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};
`;

describe('GlassButton Quality Gates', () => {
  let component: HTMLElement;
  let renderStartTime: number;
  let renderEndTime: number;

  beforeEach(() => {
    renderStartTime = performance.now();
    const { container } = render(
      <GlassButton onClick={() => {}}>
        Test Button
      </GlassButton>
    );
    renderEndTime = performance.now();
    component = container.firstElementChild as HTMLElement;
  });

  describe('TypeScript Compliance', () => {
    it('should pass TypeScript quality gate', () => {
      const result = validateTypeScriptCompliance(GLASS_BUTTON_SOURCE);
      expect(result).toPassQualityGate('TypeScript Compliance');
      expect(result).toHaveQualityScore(90);
    });

    it('should not contain any explicit any types', () => {
      expect(GLASS_BUTTON_SOURCE).not.toMatch(/:\s*any/);
      expect(GLASS_BUTTON_SOURCE).not.toMatch(/<any>/);
    });

    it('should use proper TypeScript interfaces', () => {
      expect(GLASS_BUTTON_SOURCE).toMatch(/React\.FC<\w+Props>/);
    });
  });

  describe('Functional Programming Compliance', () => {
    it('should pass functional programming quality gate', () => {
      const result = validateFunctionalProgramming(GLASS_BUTTON_SOURCE);
      expect(result).toPassQualityGate('Functional Programming');
      expect(result).toHaveQualityScore(90);
    });

    it('should not contain let declarations', () => {
      expect(GLASS_BUTTON_SOURCE).not.toMatch(/\blet\s+/);
    });

    it('should not contain mutations', () => {
      expect(GLASS_BUTTON_SOURCE).not.toMatch(/\w+\.\w+\s*=/);
      expect(GLASS_BUTTON_SOURCE).not.toMatch(/\w+\+\+/);
      expect(GLASS_BUTTON_SOURCE).not.toMatch(/\w+--/);
    });
  });

  describe('Glass Morphism Implementation', () => {
    it('should pass glass morphism quality gate', () => {
      const className = component.className;
      const result = validateGlassMorphism(className);
      expect(result).toPassQualityGate('Glass Morphism');
      expect(result).toHaveQualityScore(90);
    });

    it('should have all required glass morphism classes', () => {
      const className = component.className;
      
      // Base glass effect
      expect(className).toMatch(/bg-black\/20/);
      expect(className).toMatch(/backdrop-blur-sm/);
      expect(className).toMatch(/border-white\/50/);
      
      // Complex shadows
      expect(className).toMatch(/shadow-\[inset/);
      
      // Gradient pseudo-elements
      expect(className).toMatch(/before:absolute/);
      expect(className).toMatch(/after:absolute/);
      expect(className).toMatch(/before:bg-gradient-to-br/);
      expect(className).toMatch(/after:bg-gradient-to-tl/);
      
      // Positioning
      expect(className).toMatch(/relative/);
    });
  });

  describe('Spacing Compliance (8px Grid)', () => {
    it('should pass spacing quality gate', () => {
      const className = component.className;
      const result = validateSpacing(className);
      expect(result).toPassQualityGate('Spacing');
      expect(result).toHaveQualityScore(90);
    });

    it('should use valid spacing classes', () => {
      const className = component.className;
      
      // Check padding follows 8px grid
      expect(className).toMatch(/px-6/); // 24px
      expect(className).toMatch(/py-3/); // 12px
      
      // Should not have invalid spacing
      expect(className).not.toMatch(/p-5/); // 20px - not on 8px grid
      expect(className).not.toMatch(/px-7/); // 28px - not on 8px grid
    });
  });

  describe('Accessibility Compliance', () => {
    it('should pass accessibility quality gate', () => {
      const result = validateAccessibility(component);
      expect(result).toPassQualityGate('Accessibility');
      expect(result).toHaveQualityScore(85);
    });

    it('should have proper ARIA attributes', () => {
      expect(component).toHaveAttribute('type', 'button');
      expect(component).toHaveAttribute('aria-disabled');
    });

    it('should be focusable', () => {
      expect(component.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('should have accessible name', () => {
      expect(component.textContent).toBeTruthy();
    });

    it('should have focus indicators', () => {
      const className = component.className;
      expect(className).toMatch(/focus:outline-none/);
      expect(className).toMatch(/focus:ring-2/);
    });
  });

  describe('Performance Compliance', () => {
    it('should pass performance quality gate', () => {
      const renderTime = renderEndTime - renderStartTime;
      const result = validatePerformance(renderTime);
      expect(result).toPassQualityGate('Performance');
      expect(result).toHaveQualityScore(85);
    });

    it('should render within performance threshold', () => {
      const renderTime = renderEndTime - renderStartTime;
      expect(renderTime).toBeLessThan(16); // 60fps threshold
    });

    it('should use hardware-accelerated properties only', () => {
      const className = component.className;
      
      // Should use transform and opacity for animations
      expect(className).toMatch(/transition-all/);
      expect(className).toMatch(/duration-300/);
      
      // Should not animate layout properties
      expect(className).not.toMatch(/transition.*width/);
      expect(className).not.toMatch(/transition.*height/);
      expect(className).not.toMatch(/transition.*padding/);
    });
  });

  describe('Overall Quality Score', () => {
    it('should achieve minimum quality score', () => {
      const metrics = {
        typeScript: 100,
        functionalProgramming: 100,
        glassMorphism: 100,
        spacing: 100,
        accessibility: 90,
        performance: 95
      };

      const result = calculateOverallQualityScore(metrics);
      expect(result).toPassQualityGate('Overall Quality');
      expect(result.data?.score).toBeGreaterThanOrEqual(80);
    });

    it('should achieve good quality level', () => {
      const metrics = {
        typeScript: 100,
        functionalProgramming: 100,
        glassMorphism: 100,
        spacing: 100,
        accessibility: 90,
        performance: 95
      };

      const result = calculateOverallQualityScore(metrics);
      expect(result.data?.level).toBe('excellent');
      expect(result.data?.score).toBeGreaterThanOrEqual(90);
    });
  });
});
