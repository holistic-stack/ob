/**
 * @file UI Components Demo Page
 * 
 * Comprehensive demonstration of all shared UI components.
 * Shows different variants, states, and usage patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState } from 'react';
import { Button, ButtonGroup, Icon, LoadingSpinner } from '../index';
import type { ButtonVariant, ButtonSize, IconName, LoadingSpinnerVariant } from '../index';
import './ui-components-demo.css';

/**
 * UI Components Demo component
 */
export const UIComponentsDemo: React.FC = () => {
  console.log('[INIT] Rendering UIComponentsDemo');

  // State for interactive examples
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ButtonVariant>('primary');
  const [selectedSize, setSelectedSize] = useState<ButtonSize>('medium');
  const [selectedSpinner, setSelectedSpinner] = useState<LoadingSpinnerVariant>('circle');

  /**
   * Handle async button click simulation
   */
  const handleAsyncAction = async () => {
    console.log('[DEBUG] Starting async action');
    setIsLoading(true);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[DEBUG] Async action completed');
    } catch (error) {
      console.error('[ERROR] Async action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle button click with feedback
   */
  const handleButtonClick = (action: string) => {
    console.log(`[DEBUG] Button clicked: ${action}`);
    // In a real app, this would trigger actual functionality
  };

  return (
    <div className="ui-demo">
      <div className="ui-demo__container">
        <header className="ui-demo__header">
          <h1 className="ui-demo__title">
            <Icon name="cube" size="lg" className="ui-demo__title-icon" />
            UI Components Library Demo
          </h1>
          <p className="ui-demo__description">
            Comprehensive demonstration of shared UI components with different variants, 
            states, and interactive examples.
          </p>
        </header>

        {/* Button Variants Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="settings" size="md" />
            Button Variants
          </h2>
          
          <div className="ui-demo__grid">
            <div className="ui-demo__card">
              <h3>Primary Actions</h3>
              <div className="ui-demo__button-group">
                <Button variant="primary" onClick={() => handleButtonClick('save')}>
                  Save Changes
                </Button>
                <Button variant="primary" leftIcon="plus" onClick={() => handleButtonClick('create')}>
                  Create New
                </Button>
                <Button variant="primary" rightIcon="arrow-right" onClick={() => handleButtonClick('continue')}>
                  Continue
                </Button>
              </div>
            </div>

            <div className="ui-demo__card">
              <h3>Secondary Actions</h3>
              <div className="ui-demo__button-group">
                <Button variant="secondary" onClick={() => handleButtonClick('cancel')}>
                  Cancel
                </Button>
                <Button variant="secondary" leftIcon="edit" onClick={() => handleButtonClick('edit')}>
                  Edit
                </Button>
                <Button variant="secondary" rightIcon="download" onClick={() => handleButtonClick('export')}>
                  Export
                </Button>
              </div>
            </div>

            <div className="ui-demo__card">
              <h3>Destructive Actions</h3>
              <div className="ui-demo__button-group">
                <Button variant="danger" onClick={() => handleButtonClick('delete')}>
                  Delete
                </Button>
                <Button variant="danger" leftIcon="delete" onClick={() => handleButtonClick('remove')}>
                  Remove Item
                </Button>
                <Button variant="danger" rightIcon="x" onClick={() => handleButtonClick('clear')}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="ui-demo__card">
              <h3>Subtle Actions</h3>
              <div className="ui-demo__button-group">
                <Button variant="ghost" onClick={() => handleButtonClick('more')}>
                  More Options
                </Button>
                <Button variant="link" onClick={() => handleButtonClick('learn')}>
                  Learn More
                </Button>
                <Button variant="ghost" leftIcon="help" onClick={() => handleButtonClick('help')}>
                  Help
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Button Sizes Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="scale" size="md" />
            Button Sizes
          </h2>
          
          <div className="ui-demo__size-demo">
            <Button size="small" onClick={() => handleButtonClick('small')}>
              Small Button
            </Button>
            <Button size="medium" onClick={() => handleButtonClick('medium')}>
              Medium Button
            </Button>
            <Button size="large" onClick={() => handleButtonClick('large')}>
              Large Button
            </Button>
          </div>
        </section>

        {/* Button States Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="debug" size="md" />
            Button States
          </h2>
          
          <div className="ui-demo__states-demo">
            <Button onClick={() => handleButtonClick('normal')}>
              Normal State
            </Button>
            <Button loading={isLoading} onClick={handleAsyncAction}>
              {isLoading ? 'Processing...' : 'Async Action'}
            </Button>
            <Button disabled onClick={() => handleButtonClick('disabled')}>
              Disabled State
            </Button>
            <Button fullWidth onClick={() => handleButtonClick('fullwidth')}>
              Full Width Button
            </Button>
          </div>
        </section>

        {/* Button Groups Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="menu" size="md" />
            Button Groups
          </h2>
          
          <div className="ui-demo__groups-demo">
            <ButtonGroup>
              <Button variant="secondary" onClick={() => handleButtonClick('left')}>
                Left
              </Button>
              <Button variant="secondary" onClick={() => handleButtonClick('center')}>
                Center
              </Button>
              <Button variant="secondary" onClick={() => handleButtonClick('right')}>
                Right
              </Button>
            </ButtonGroup>

            <ButtonGroup>
              <Button variant="primary" leftIcon="save" onClick={() => handleButtonClick('save')}>
                Save
              </Button>
              <Button variant="secondary" leftIcon="copy" onClick={() => handleButtonClick('copy')}>
                Copy
              </Button>
              <Button variant="danger" leftIcon="delete" onClick={() => handleButtonClick('delete')}>
                Delete
              </Button>
            </ButtonGroup>
          </div>
        </section>

        {/* Icons Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="star" size="md" />
            Icon Library
          </h2>
          
          <div className="ui-demo__icons-grid">
            {/* Navigation Icons */}
            <div className="ui-demo__icon-category">
              <h4>Navigation</h4>
              <div className="ui-demo__icon-list">
                <Icon name="arrow-left" size="lg" />
                <Icon name="arrow-right" size="lg" />
                <Icon name="chevron-up" size="lg" />
                <Icon name="chevron-down" size="lg" />
              </div>
            </div>

            {/* Action Icons */}
            <div className="ui-demo__icon-category">
              <h4>Actions</h4>
              <div className="ui-demo__icon-list">
                <Icon name="plus" size="lg" color="success" />
                <Icon name="edit" size="lg" color="primary" />
                <Icon name="delete" size="lg" color="error" />
                <Icon name="save" size="lg" color="primary" />
              </div>
            </div>

            {/* 3D Icons */}
            <div className="ui-demo__icon-category">
              <h4>3D/Babylon</h4>
              <div className="ui-demo__icon-list">
                <Icon name="cube" size="lg" />
                <Icon name="sphere" size="lg" />
                <Icon name="wireframe" size="lg" />
                <Icon name="camera" size="lg" />
              </div>
            </div>

            {/* Status Icons */}
            <div className="ui-demo__icon-category">
              <h4>Status</h4>
              <div className="ui-demo__icon-list">
                <Icon name="check" size="lg" color="success" />
                <Icon name="warning" size="lg" color="warning" />
                <Icon name="error" size="lg" color="error" />
                <Icon name="info" size="lg" color="primary" />
              </div>
            </div>
          </div>
        </section>

        {/* Loading Spinners Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="refresh" size="md" />
            Loading Spinners
          </h2>
          
          <div className="ui-demo__spinners-demo">
            <div className="ui-demo__spinner-category">
              <h4>Variants</h4>
              <div className="ui-demo__spinner-list">
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="dots" size="large" />
                  <span>Dots</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="bars" size="large" />
                  <span>Bars</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="large" />
                  <span>Circle</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="pulse" size="large" />
                  <span>Pulse</span>
                </div>
              </div>
            </div>

            <div className="ui-demo__spinner-category">
              <h4>Sizes</h4>
              <div className="ui-demo__spinner-list">
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="small" />
                  <span>Small</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="medium" />
                  <span>Medium</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="large" />
                  <span>Large</span>
                </div>
              </div>
            </div>

            <div className="ui-demo__spinner-category">
              <h4>Colors</h4>
              <div className="ui-demo__spinner-list">
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="large" color="#3b82f6" />
                  <span>Blue</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="large" color="#10b981" />
                  <span>Green</span>
                </div>
                <div className="ui-demo__spinner-item">
                  <LoadingSpinner variant="circle" size="large" color="#ef4444" />
                  <span>Red</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Controls Section */}
        <section className="ui-demo__section">
          <h2 className="ui-demo__section-title">
            <Icon name="settings" size="md" />
            Interactive Controls
          </h2>
          
          <div className="ui-demo__controls">
            <div className="ui-demo__control-group">
              <label>Button Variant:</label>
              <ButtonGroup>
                {(['primary', 'secondary', 'danger', 'ghost'] as ButtonVariant[]).map(variant => (
                  <Button
                    key={variant}
                    variant={selectedVariant === variant ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            <div className="ui-demo__control-group">
              <label>Button Size:</label>
              <ButtonGroup>
                {(['small', 'medium', 'large'] as ButtonSize[]).map(size => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            <div className="ui-demo__preview">
              <h4>Preview:</h4>
              <Button
                variant={selectedVariant}
                size={selectedSize}
                leftIcon="star"
                onClick={() => handleButtonClick('preview')}
              >
                Preview Button
              </Button>
            </div>
          </div>
        </section>

        <footer className="ui-demo__footer">
          <p>
            <Icon name="check" size="sm" color="success" />
            UI Components Library - Phase 7.1 Complete
          </p>
          <p>
            Built with React 19, TypeScript 5.8, and modern CSS patterns
          </p>
        </footer>
      </div>
    </div>
  );
};

export default UIComponentsDemo;
