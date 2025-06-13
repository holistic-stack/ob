/**
 * @file Simple Test Component
 * 
 * A simple React component for testing Playwright CT setup
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';

export interface SimpleTestProps {
  message?: string;
}

export function SimpleTest({ message = 'Hello World' }: SimpleTestProps): React.JSX.Element {
  return (
    <div data-testid="simple-test">
      <h1>Simple Test Component</h1>
      <p data-testid="message">{message}</p>
    </div>
  );
}
