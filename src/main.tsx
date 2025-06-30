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
import { createLogger } from './shared/services/logger.service';

const logger = createLogger('Main');

logger.init('Starting OpenSCAD 3D Visualization Application');
logger.debug('React version:', React.version);
logger.debug('Environment:', import.meta.env.MODE);

const rootElement = document.getElementById('root');
if (!rootElement) {
  logger.error('Root element not found');
  throw new Error('Root element not found');
}

logger.debug('Creating React root');
const root = ReactDOM.createRoot(rootElement);

logger.debug('Rendering application');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

logger.init('Application initialized successfully');
