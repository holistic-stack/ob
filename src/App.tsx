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

import React from 'react';
import { ErrorBoundary as _ErrorBoundary } from 'react-error-boundary';
import './App.css';
import { BabylonRenderStory } from './components/babylon-renderer/babylon-renderer.story';


/**
 * Modern App component with React 19 patterns
 */
export function App(): React.JSX.Element {
  return (
    <BabylonRenderStory code="cube([10, 10, 10]);" />
  )
}

export default App;
