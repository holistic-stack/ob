/**
 * @file Test Components Integration
 * 
 * Simple test to verify that our UI components can be imported and used together.
 * This helps identify any import or dependency issues.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';
import { Button } from './button/button';
import { Icon } from './icon/icon';
import { LoadingSpinner } from './loading-spinner/loading-spinner';

/**
 * Test component that uses all our UI components
 */
export const TestComponents: React.FC = () => {
  console.log('[INIT] Rendering TestComponents');

  const handleClick = () => {
    console.log('[DEBUG] Button clicked');
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2>UI Components Test</h2>
      
      {/* Button variants */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={handleClick}>
          Primary Button
        </Button>
        <Button variant="secondary" onClick={handleClick}>
          Secondary Button
        </Button>
        <Button variant="danger" onClick={handleClick}>
          Danger Button
        </Button>
        <Button variant="ghost" onClick={handleClick}>
          Ghost Button
        </Button>
        <Button variant="link" onClick={handleClick}>
          Link Button
        </Button>
      </div>

      {/* Button sizes */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button size="small" onClick={handleClick}>
          Small
        </Button>
        <Button size="medium" onClick={handleClick}>
          Medium
        </Button>
        <Button size="large" onClick={handleClick}>
          Large
        </Button>
      </div>

      {/* Button states */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button loading onClick={handleClick}>
          Loading Button
        </Button>
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
        <Button fullWidth onClick={handleClick}>
          Full Width Button
        </Button>
      </div>

      {/* Buttons with icons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button leftIcon="plus" onClick={handleClick}>
          Add Item
        </Button>
        <Button rightIcon="arrow-right" onClick={handleClick}>
          Next
        </Button>
        <Button leftIcon="save" rightIcon="check" onClick={handleClick}>
          Save & Continue
        </Button>
      </div>

      {/* Icons */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Icon name="cube" size="sm" />
        <Icon name="sphere" size="md" />
        <Icon name="cylinder" size="lg" />
        <Icon name="wireframe" size="xl" />
      </div>

      {/* Icon colors */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Icon name="check" color="success" />
        <Icon name="warning" color="warning" />
        <Icon name="error" color="error" />
        <Icon name="info" color="primary" />
      </div>

      {/* Loading spinners */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <LoadingSpinner variant="dots" size="small" />
        <LoadingSpinner variant="bars" size="medium" />
        <LoadingSpinner variant="circle" size="large" />
        <LoadingSpinner variant="pulse" size="medium" />
      </div>

      {/* Loading spinner colors */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <LoadingSpinner variant="circle" color="#ff0000" />
        <LoadingSpinner variant="circle" color="#00ff00" />
        <LoadingSpinner variant="circle" color="#0000ff" />
      </div>
    </div>
  );
};

export default TestComponents;
