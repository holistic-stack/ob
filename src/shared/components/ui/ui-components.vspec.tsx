/**
 * @file UI Components Playwright Tests
 * 
 * Playwright component tests for the shared UI components library.
 * Tests visual rendering, interactions, and accessibility.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TestComponents } from './test-components';
import { Button } from './button/button';
import { Icon } from './icon/icon';
import { LoadingSpinner } from './loading-spinner/loading-spinner';

test.describe('UI Components Library', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up UI Components Playwright test environment');
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      } else if (msg.text().includes('[DEBUG]') || msg.text().includes('[ERROR]') || msg.text().includes('[WARN]')) {
        console.log(`[BROWSER] ${msg.text()}`);
      }
    });
  });

  test.describe('Complete UI Components Integration', () => {
    
    test('should render all UI components together', async ({ mount, page }) => {
      console.log('[DEBUG] Testing complete UI components integration');
      
      const component = await mount(<TestComponents />);
      
      // Wait for component to initialize
      await page.waitForTimeout(1000);
      
      // Verify main container
      await expect(component.getByText('UI Components Test')).toBeVisible();
      
      // Verify buttons are present
      await expect(component.getByRole('button', { name: 'Primary Button' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Secondary Button' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Danger Button' })).toBeVisible();
      
      // Verify different button sizes
      await expect(component.getByRole('button', { name: 'Small' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Medium' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Large' })).toBeVisible();
      
      // Verify button states
      await expect(component.getByRole('button', { name: 'Loading Button' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Disabled Button' })).toBeDisabled();
      
      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('ui-components-integration.png');
    });

    test('should handle button interactions', async ({ mount, page }) => {
      console.log('[DEBUG] Testing button interactions');
      
      const component = await mount(<TestComponents />);
      
      // Wait for component to initialize
      await page.waitForTimeout(1000);
      
      // Test primary button click
      const primaryButton = component.getByRole('button', { name: 'Primary Button' });
      await primaryButton.click();
      
      // Test button with icon click
      const addButton = component.getByRole('button', { name: 'Add Item' });
      await addButton.click();
      
      // Verify disabled button cannot be clicked
      const disabledButton = component.getByRole('button', { name: 'Disabled Button' });
      await expect(disabledButton).toBeDisabled();
      
      // Take screenshot after interactions
      await expect(component).toHaveScreenshot('ui-components-interactions.png');
    });
  });

  test.describe('Individual Component Tests', () => {
    
    test('should render Button component variants', async ({ mount, page }) => {
      console.log('[DEBUG] Testing Button component variants');
      
      const component = await mount(
        <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      );
      
      // Verify all button variants are visible
      await expect(component.getByRole('button', { name: 'Primary' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Secondary' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Danger' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Ghost' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Link' })).toBeVisible();
      
      // Take screenshot of button variants
      await expect(component).toHaveScreenshot('button-variants.png');
    });

    test('should render Button component sizes', async ({ mount, page }) => {
      console.log('[DEBUG] Testing Button component sizes');
      
      const component = await mount(
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '20px' }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>
      );
      
      // Verify all button sizes are visible
      await expect(component.getByRole('button', { name: 'Small' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Medium' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Large' })).toBeVisible();
      
      // Take screenshot of button sizes
      await expect(component).toHaveScreenshot('button-sizes.png');
    });

    test('should render Button component states', async ({ mount, page }) => {
      console.log('[DEBUG] Testing Button component states');
      
      const component = await mount(
        <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      );
      
      // Verify button states
      await expect(component.getByRole('button', { name: 'Normal' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Loading' })).toBeVisible();
      await expect(component.getByRole('button', { name: 'Disabled' })).toBeDisabled();
      
      // Verify loading spinner is present
      await expect(component.getByLabelText('Loading')).toBeVisible();
      
      // Take screenshot of button states
      await expect(component).toHaveScreenshot('button-states.png');
    });

    test('should render Icon component variants', async ({ mount, page }) => {
      console.log('[DEBUG] Testing Icon component variants');
      
      const component = await mount(
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '20px' }}>
          <Icon name="cube" size="sm" />
          <Icon name="sphere" size="md" />
          <Icon name="cylinder" size="lg" />
          <Icon name="wireframe" size="xl" />
          <Icon name="check" color="success" />
          <Icon name="warning" color="warning" />
          <Icon name="error" color="error" />
        </div>
      );
      
      // Icons should be present (they don't have text content, so we check the container)
      await expect(component).toBeVisible();
      
      // Take screenshot of icon variants
      await expect(component).toHaveScreenshot('icon-variants.png');
    });

    test('should render LoadingSpinner component variants', async ({ mount, page }) => {
      console.log('[DEBUG] Testing LoadingSpinner component variants');
      
      const component = await mount(
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '20px' }}>
          <LoadingSpinner variant="dots" size="small" />
          <LoadingSpinner variant="bars" size="medium" />
          <LoadingSpinner variant="circle" size="large" />
          <LoadingSpinner variant="pulse" size="medium" />
        </div>
      );
      
      // Verify loading spinners are present
      const spinners = component.getByRole('status');
      await expect(spinners.first()).toBeVisible();
      
      // Take screenshot of spinner variants
      await expect(component).toHaveScreenshot('loading-spinner-variants.png');
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should adapt to different viewport sizes', async ({ mount, page }) => {
      console.log('[DEBUG] Testing responsive design');
      
      const component = await mount(<TestComponents />);
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(component).toHaveScreenshot('ui-components-desktop.png');
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(component).toHaveScreenshot('ui-components-tablet.png');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(component).toHaveScreenshot('ui-components-mobile.png');
    });
  });

  test.describe('Accessibility', () => {
    
    test('should support keyboard navigation', async ({ mount, page }) => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      const component = await mount(
        <div style={{ padding: '20px' }}>
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <Button>Third Button</Button>
        </div>
      );
      
      // Tab through buttons
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Take screenshot showing focus states
      await expect(component).toHaveScreenshot('ui-components-keyboard-navigation.png');
    });
  });
});
