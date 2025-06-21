/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ConsolePanel } from './console-panel';
import type { ConsoleMessage } from './console-panel';

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

const mockMessages: ConsoleMessage[] = [
  {
    id: '1',
    type: 'info',
    message: 'Application started',
    timestamp: new Date('2023-01-01T10:00:00Z'),
  },
  {
    id: '2',
    type: 'error',
    message: 'Failed to load module',
    timestamp: new Date('2023-01-01T10:01:00Z'),
  },
  {
    id: '3',
    type: 'warning',
    message: 'Deprecated function used',
    timestamp: new Date('2023-01-01T10:02:00Z'),
  },
];

describe('ConsolePanel', () => {
  it('should render with messages', () => {
    render(
      <ConsolePanel messages={mockMessages} />
    );
    
    expect(screen.getByText('Application started')).toBeInTheDocument();
    expect(screen.getByText('Failed to load module')).toBeInTheDocument();
    expect(screen.getByText('Deprecated function used')).toBeInTheDocument();
  });

  it('should apply glass morphism classes', () => {
    render(
      <ConsolePanel 
        messages={mockMessages} 
        data-testid="console-panel" 
      />
    );
    
    const panel = screen.getByTestId('console-panel');
    expect(panel).toHaveClass('bg-black/20');
    expect(panel).toHaveClass('backdrop-blur-sm');
    expect(panel).toHaveClass('border-white/50');
  });

  it('should show different message types with appropriate styling', () => {
    render(
      <ConsolePanel messages={mockMessages} />
    );
    
    const infoMessage = screen.getByText('Application started').closest('div');
    const errorMessage = screen.getByText('Failed to load module').closest('div');
    const warningMessage = screen.getByText('Deprecated function used').closest('div');
    
    expect(infoMessage).toHaveClass('text-blue-400');
    expect(errorMessage).toHaveClass('text-red-400');
    expect(warningMessage).toHaveClass('text-yellow-400');
  });

  it('should handle clear console action', () => {
    const onClear = vi.fn();
    render(
      <ConsolePanel 
        messages={mockMessages} 
        onClear={onClear}
        showControls
      />
    );
    
    const clearButton = screen.getByRole('button', { name: /clear console/i });
    fireEvent.click(clearButton);
    
    expect(onClear).toHaveBeenCalled();
  });

  it('should support filtering by message type', () => {
    render(
      <ConsolePanel 
        messages={mockMessages} 
        filter="error"
      />
    );
    
    expect(screen.getByText('Failed to load module')).toBeInTheDocument();
    expect(screen.queryByText('Application started')).not.toBeInTheDocument();
    expect(screen.queryByText('Deprecated function used')).not.toBeInTheDocument();
  });

  it('should show timestamps when enabled', () => {
    render(
      <ConsolePanel
        messages={mockMessages}
        showTimestamps
      />
    );

    // Check that timestamps are displayed (they will be formatted based on locale)
    const timestampElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
    expect(timestampElements).toHaveLength(3);
  });

  it('should auto-scroll to bottom when new messages arrive', () => {
    const { rerender } = render(
      <ConsolePanel messages={mockMessages.slice(0, 2)} autoScroll />
    );
    
    const newMessage: ConsoleMessage = {
      id: '4',
      type: 'info',
      message: 'New message',
      timestamp: new Date(),
    };
    
    rerender(
      <ConsolePanel messages={[...mockMessages.slice(0, 2), newMessage]} autoScroll />
    );
    
    expect(screen.getByText('New message')).toBeInTheDocument();
  });

  it('should support custom height', () => {
    render(
      <ConsolePanel 
        messages={mockMessages} 
        height={200}
        data-testid="console-panel"
      />
    );
    
    const panel = screen.getByTestId('console-panel');
    expect(panel).toHaveStyle({ height: '200px' });
  });

  it('should be accessible', () => {
    render(
      <ConsolePanel 
        messages={mockMessages} 
        aria-label="Console Output"
      />
    );
    
    const panel = screen.getByRole('log');
    expect(panel).toHaveAttribute('aria-label', 'Console Output');
  });
});
