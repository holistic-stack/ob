/**
 * Quality Gates Test Setup
 * 
 * This file sets up the testing environment for quality gate validation,
 * including utilities for validating TypeScript compliance, functional
 * programming patterns, glass morphism implementation, and accessibility.
 */

import '@testing-library/jest-dom';
import { expect } from 'vitest';

// Quality gate validation utilities
export interface QualityGateResult<T = void> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly score?: number;
}

// TypeScript validation utilities
export function validateTypeScriptCompliance(sourceCode: string): QualityGateResult {
  // Check for any types
  if (sourceCode.includes(': any') || sourceCode.includes('<any>')) {
    return {
      success: false,
      error: 'TypeScript compliance failed: explicit any types found'
    };
  }

  // Check for non-null assertions without proper guards
  const nonNullAssertions = sourceCode.match(/!\s*[.;]/g);
  if (nonNullAssertions && nonNullAssertions.length > 0) {
    return {
      success: false,
      error: 'TypeScript compliance failed: unsafe non-null assertions found'
    };
  }

  return { success: true, score: 100 };
}

// Functional programming validation utilities
export function validateFunctionalProgramming(sourceCode: string): QualityGateResult {
  // Check for let declarations (should use const)
  if (sourceCode.includes('let ')) {
    return {
      success: false,
      error: 'Functional programming violation: let declarations found (use const)'
    };
  }

  // Check for mutations
  const mutationPatterns = [
    /\w+\.\w+\s*=\s*/, // object.property = value
    /\w+\[\w+\]\s*=\s*/, // object[key] = value
    /\w+\+\+/, // increment
    /\w+--/, // decrement
    /\w+\s*\+=/, // compound assignment
    /\w+\s*-=/, // compound assignment
  ];

  for (const pattern of mutationPatterns) {
    if (pattern.test(sourceCode)) {
      return {
        success: false,
        error: `Functional programming violation: mutation pattern found: ${pattern.source}`
      };
    }
  }

  return { success: true, score: 100 };
}

// Glass morphism validation utilities
export function validateGlassMorphism(className: string): QualityGateResult {
  const requiredPatterns = [
    /bg-black\/20/, // Base transparency
    /backdrop-blur-sm/, // Backdrop filter
    /border-white\/50/, // Glass edge
    /shadow-\[inset/, // Complex shadows
    /before:absolute/, // Primary gradient
    /after:absolute/, // Secondary gradient
    /relative/, // Positioning context
  ];

  const missingPatterns: string[] = [];

  for (const pattern of requiredPatterns) {
    if (!pattern.test(className)) {
      missingPatterns.push(pattern.source);
    }
  }

  if (missingPatterns.length > 0) {
    return {
      success: false,
      error: `Glass morphism validation failed: missing patterns: ${missingPatterns.join(', ')}`,
      score: Math.max(0, 100 - (missingPatterns.length * 15))
    };
  }

  return { success: true, score: 100 };
}

// Spacing validation utilities (8px grid system)
export function validateSpacing(className: string): QualityGateResult {
  const validSpacingPattern = /^(p|px|py|m|mx|my|gap|space-[xy])-([1-9]|1[0-2])$/;
  const spacingClasses = className.split(' ').filter(cls => 
    cls.match(/^(p|px|py|m|mx|my|gap|space-[xy])-/)
  );

  const invalidSpacing = spacingClasses.filter(cls => !validSpacingPattern.test(cls));

  if (invalidSpacing.length > 0) {
    return {
      success: false,
      error: `Spacing validation failed: invalid spacing classes: ${invalidSpacing.join(', ')}`,
      score: Math.max(0, 100 - (invalidSpacing.length * 20))
    };
  }

  return { success: true, score: 100 };
}

// Accessibility validation utilities
export function validateAccessibility(element: HTMLElement): QualityGateResult {
  const issues: string[] = [];

  // Check for interactive elements without proper ARIA
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    if (!element.hasAttribute('aria-label') && !element.textContent?.trim()) {
      issues.push('Interactive element missing accessible name');
    }

    if (element.hasAttribute('disabled') && !element.hasAttribute('aria-disabled')) {
      issues.push('Disabled element missing aria-disabled attribute');
    }
  }

  // Check for proper focus management
  if (element.tabIndex < 0 && element.getAttribute('role') === 'button') {
    issues.push('Interactive element not focusable');
  }

  // Check for color contrast (simplified check)
  const styles = getComputedStyle(element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;

  if (backgroundColor.includes('rgba') && color.includes('rgba')) {
    // This is a simplified check - in real implementation, you'd calculate actual contrast
    const bgOpacity = parseFloat(backgroundColor.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)?.[1] || '1');
    if (bgOpacity < 0.3) {
      issues.push('Potential color contrast issue with transparent background');
    }
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: `Accessibility validation failed: ${issues.join(', ')}`,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  return { success: true, score: 100 };
}

// Performance validation utilities
export function validatePerformance(renderTime: number, bundleSize?: number): QualityGateResult {
  const issues: string[] = [];
  let score = 100;

  // Check render time (should be < 16ms for 60fps)
  if (renderTime > 16) {
    issues.push(`Render time ${renderTime}ms exceeds 16ms threshold`);
    score -= 30;
  }

  // Check bundle size (should be < 10KB gzipped)
  if (bundleSize && bundleSize > 10240) {
    issues.push(`Bundle size ${bundleSize} bytes exceeds 10KB threshold`);
    score -= 20;
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: `Performance validation failed: ${issues.join(', ')}`,
      score: Math.max(0, score)
    };
  }

  return { success: true, score: 100 };
}

// Overall quality score calculation
export function calculateOverallQualityScore(metrics: {
  typeScript: number;
  functionalProgramming: number;
  glassMorphism: number;
  spacing: number;
  accessibility: number;
  performance: number;
}): QualityGateResult<{ score: number; level: string }> {
  const weights = {
    typeScript: 0.2,
    functionalProgramming: 0.15,
    glassMorphism: 0.2,
    spacing: 0.1,
    accessibility: 0.2,
    performance: 0.15
  };

  const score = Object.entries(metrics).reduce((total, [key, value]) => {
    const weight = weights[key as keyof typeof weights];
    return total + (value * weight);
  }, 0);

  const level = score >= 95 ? 'excellent' :
               score >= 90 ? 'good' :
               score >= 80 ? 'acceptable' : 'poor';

  if (score < 80) {
    return {
      success: false,
      error: `Quality score ${score.toFixed(1)} below minimum threshold of 80`,
      data: { score, level }
    };
  }

  return {
    success: true,
    data: { score, level }
  };
}

// Custom matchers for quality gates
expect.extend({
  toPassQualityGate(received: QualityGateResult, gateName: string) {
    const pass = received.success;
    
    if (pass) {
      return {
        message: () => `Expected ${gateName} quality gate to fail, but it passed`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${gateName} quality gate to pass, but it failed: ${received.error}`,
        pass: false
      };
    }
  },

  toHaveQualityScore(received: QualityGateResult, expectedScore: number) {
    const actualScore = received.score || 0;
    const pass = actualScore >= expectedScore;

    if (pass) {
      return {
        message: () => `Expected quality score to be below ${expectedScore}, but got ${actualScore}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected quality score to be at least ${expectedScore}, but got ${actualScore}`,
        pass: false
      };
    }
  }
});

// Extend expect types
declare module 'vitest' {
  interface Assertion<T = any> {
    toPassQualityGate(gateName: string): T;
    toHaveQualityScore(expectedScore: number): T;
  }
}
