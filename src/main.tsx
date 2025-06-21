/**
 * @file Main React application entry point
 *
 * Entry point for the OpenSCAD to Babylon.js pipeline application.
 * Provides a complete interface for the pipeline:
 * OpenSCAD code → @holistic-stack/openscad-parser:parseAST → CSG2 Babylon JS → Babylon JS scene
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
