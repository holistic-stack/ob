/**
 * @file Minimal Test Component
 * 
 * A simple component for testing Playwright Component Testing setup.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';

interface MinimalComponentProps {
  message?: string;
}

export function MinimalComponent({ message = "Hello World" }: MinimalComponentProps) {
  return (
    <div data-testid="minimal">
      <h1>Minimal Test Component</h1>
      <p>{message}</p>
    </div>
  );
}

export default MinimalComponent;
