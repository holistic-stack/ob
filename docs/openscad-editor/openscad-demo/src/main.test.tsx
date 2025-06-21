import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from './main';

/**
 * @file Test suite for the main App component
 * Tests the root application component that renders the ASTDemo
 *
 * Following the project's "no mocks" principle - using real components
 * with proper lifecycle management for OpenSCAD parser instances.
 */

describe('App Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Setup test environment before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup after each test
    if (container) {
      container.remove();
    }
    document.body.innerHTML = '';
  });

  it('should render without crashing', () => {
    const result = render(<App />);
    container = result.container;

    // The App component should render successfully
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeTruthy();
  });

  it('should have proper React component structure', () => {
    const result = render(<App />);
    container = result.container;

    // Verify the component renders a single child element
    expect(container.children).toHaveLength(1);
    expect(container.firstChild).toBeTruthy();
  });

  it('should be a functional component', () => {
    // Verify App is a function (functional component)
    expect(typeof App).toBe('function');
    expect(App.name).toBe('App');
  });

  it('should render content in the DOM', () => {
    const result = render(<App />);
    container = result.container;

    // The component should render some content
    // Even if Monaco Editor takes time to load, there should be some DOM structure
    expect(container.innerHTML).not.toBe('');
  });
});
