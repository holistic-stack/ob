/**
 * @file Main React application entry point
 *
 * Entry point for the OpenSCAD 3D visualization application with Zustand-centric architecture.
 * Provides a complete interface for the pipeline:
 * OpenSCAD code → Monaco Editor → Zustand Store → @holistic-stack/openscad-parser:parseAST → Three.js CSG → React Three Fiber scene
 *
 * Features:
 * - React 19 + TypeScript 5.8 + Vite 6.0
 * - Monaco Editor with OpenSCAD syntax highlighting
 * - Three.js rendering with React Three Fiber
 * - Zustand state management with 300ms debouncing
 * - Apple Liquid Glass design system
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';

console.log('[INIT][Main] Starting OpenSCAD 3D Visualization Application');
console.log('[DEBUG][Main] React version:', React.version);
console.log('[DEBUG][Main] Environment:', import.meta.env.MODE);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[ERROR][Main] Root element not found');
  throw new Error('Root element not found');
}

console.log('[DEBUG][Main] Creating React root');
const root = ReactDOM.createRoot(rootElement);

console.log('[DEBUG][Main] Rendering application');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[INIT][Main] Application initialized successfully');
