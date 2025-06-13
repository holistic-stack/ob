/**
 * @file Hello World Component
 * 
 * Simple React component for testing Playwright experimental component testing setup.
 * This component demonstrates basic React functionality and visual testing capabilities.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';

export interface HelloWorldProps {
  /** The name to greet */
  name?: string;
  /** Custom message to display */
  message?: string;
  /** Click handler for the button */
  onClick?: () => void;
  /** Whether to show the button */
  showButton?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Hello World component for testing Playwright component testing
 */
export const HelloWorld: React.FC<HelloWorldProps> = ({
  name = 'World',
  message,
  onClick,
  showButton = true,
  className = ''
}) => {
  const [clickCount, setClickCount] = React.useState(0);

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    onClick?.();
  };

  const displayMessage = message || `Hello, ${name}!`;

  return (
    <div 
      className={`hello-world ${className}`}
      style={{
        padding: '20px',
        border: '2px solid #007acc',
        borderRadius: '8px',
        backgroundColor: '#f0f8ff',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto'
      }}
      data-testid="hello-world"
    >
      <h1 
        style={{ 
          color: '#007acc', 
          marginBottom: '16px',
          fontSize: '24px'
        }}
        data-testid="hello-message"
      >
        {displayMessage}
      </h1>
      
      {showButton && (
        <button
          onClick={handleClick}
          style={{
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '10px'
          }}
          data-testid="hello-button"
        >
          Click me! ({clickCount})
        </button>
      )}
      
      {clickCount > 0 && (
        <p 
          style={{ 
            color: '#666', 
            marginTop: '10px',
            fontSize: '14px'
          }}
          data-testid="click-counter"
        >
          Button clicked {clickCount} time{clickCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default HelloWorld;
