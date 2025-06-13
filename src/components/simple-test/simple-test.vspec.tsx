/**
 * @file Simple Test Component - Playwright Component Test
 * 
 * Basic Playwright component test to verify setup
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { SimpleTest } from './simple-test';

test.describe('Simple Test Component', () => {
  
  test('should render with default message', async ({ mount }) => {
    const component = await mount(<SimpleTest />);
    
    await expect(component).toBeVisible();
    await expect(component.locator('[data-testid="message"]')).toContainText('Hello World');
  });

  test('should render with custom message', async ({ mount }) => {
    const component = await mount(<SimpleTest message="Custom Message" />);
    
    await expect(component).toBeVisible();
    await expect(component.locator('[data-testid="message"]')).toContainText('Custom Message');
  });

});
