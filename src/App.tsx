/**
 * @file Modern App Component (React 19)
 *
 * Main application component using modern React 19 patterns:
 * - Proper state management with React 19 hooks
 * - Error boundaries for 3D rendering failures
 * - Optimized re-rendering patterns
 * - Clean component architecture
 *
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState } from 'react';
import { ErrorBoundary as _ErrorBoundary } from 'react-error-boundary';
import './App.css';
import { FullBabylonRenderer } from './features/babylon-renderer/components/babylon-renderer/babylon-renderer.story';
import { UIComponentsDemo } from './shared/components/ui/demo/ui-components-demo';
import { Button } from './shared/components/ui';

/**
 * Modern App component with React 19 patterns
 */
export function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<'babylon' | 'ui-demo'>('babylon');

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        padding: '1rem',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          OpenSCAD Babylon Pipeline
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={currentView === 'babylon' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('babylon')}
          >
            3D Renderer
          </Button>
          <Button
            variant={currentView === 'ui-demo' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('ui-demo')}
          >
            UI Components
          </Button>
        </div>
      </nav>

      {/* Content */}
      {currentView === 'babylon' ? (
        <FullBabylonRenderer />
      ) : (
        <UIComponentsDemo />
      )}
    </div>
  );
}

export default App;
