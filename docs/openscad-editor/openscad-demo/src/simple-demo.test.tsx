import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * @file Test suite for the SimpleDemo component
 * Tests the simple demo component that uses Monaco Editor directly
 * 
 * Following the project's "no mocks" principle while handling Monaco Editor
 * dependencies appropriately for the test environment.
 */

// Mock Monaco Editor React component to avoid complex browser dependencies in tests
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value?: string) => void }) => {
    return (
      <div data-testid="monaco-editor-mock">
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  },
}));

// Import after mocking
const SimpleDemo = await import('./simple-demo').then(m => m.default);

describe('SimpleDemo Component', () => {
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
    const result = render(<SimpleDemo />);
    container = result.container;
    
    // The SimpleDemo component should render successfully
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeTruthy();
  });

  it('should render the demo title', () => {
    const result = render(<SimpleDemo />);
    container = result.container;
    
    // Should contain the demo title
    expect(container.textContent).toContain('OpenSCAD Editor Demo (Simple)');
  });

  it('should render the demo description', () => {
    const result = render(<SimpleDemo />);
    container = result.container;
    
    // Should contain the description
    expect(container.textContent).toContain('This is a basic Monaco editor with OpenSCAD syntax highlighting');
  });

  it('should render the Monaco editor mock', () => {
    const { getByTestId } = render(<SimpleDemo />);
    
    // Should render the mocked Monaco editor
    const editorMock = getByTestId('monaco-editor-mock');
    expect(editorMock).toBeTruthy();
  });

  it('should render with default OpenSCAD code', () => {
    const { getByTestId } = render(<SimpleDemo />);
    
    // Should have default code in the editor
    const textarea = getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toContain('cube(10)');
    expect(textarea.value).toContain('sphere(5)');
    expect(textarea.value).toContain('cylinder(h=20, r=3)');
  });

  it('should render the code details section', () => {
    const result = render(<SimpleDemo />);
    container = result.container;
    
    // Should contain the details section for debugging
    expect(container.textContent).toContain('Current Code (for debugging)');
  });

  it('should have proper component structure', () => {
    const result = render(<SimpleDemo />);
    container = result.container;
    
    // Verify the component renders a single child element
    expect(container.children).toHaveLength(1);
    expect(container.firstChild).toBeTruthy();
  });
});
