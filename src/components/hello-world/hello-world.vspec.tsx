/**
 * @file Hello World Component Tests
 * 
 * Playwright experimental component tests for HelloWorld component.
 * Demonstrates visual testing, interaction testing, and screenshot regression.
 * 
 * Uses @playwright/experimental-ct-react v1.53.0
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { HelloWorld } from './hello-world';

test.describe('HelloWorld Component', () => {
  
  test('should render with default props', async ({ mount }) => {
    console.log('[INIT] Testing HelloWorld with default props');
    
    const component = await mount(<HelloWorld />);
    
    console.log('[DEBUG] Component mounted successfully');
    
    // Test default text content
    await expect(component.getByTestId('hello-message')).toContainText('Hello, World!');
    
    // Test button is visible
    await expect(component.getByTestId('hello-button')).toBeVisible();
    await expect(component.getByTestId('hello-button')).toContainText('Click me! (0)');
    
    console.log('[END] Default props test completed successfully');
  });

  test('should render with custom name', async ({ mount }) => {
    console.log('[INIT] Testing HelloWorld with custom name');
    
    const component = await mount(<HelloWorld name="Playwright" />);
    
    console.log('[DEBUG] Component with custom name mounted');
    
    await expect(component.getByTestId('hello-message')).toContainText('Hello, Playwright!');
    
    console.log('[END] Custom name test completed successfully');
  });

  test('should render with custom message', async ({ mount }) => {
    console.log('[INIT] Testing HelloWorld with custom message');
    
    const customMessage = 'Welcome to Playwright Component Testing!';
    const component = await mount(<HelloWorld message={customMessage} />);
    
    console.log('[DEBUG] Component with custom message mounted');
    
    await expect(component.getByTestId('hello-message')).toContainText(customMessage);
    
    console.log('[END] Custom message test completed successfully');
  });

  test('should handle button clicks and update counter', async ({ mount }) => {
    console.log('[INIT] Testing button click functionality');
    
    const component = await mount(<HelloWorld />);
    const button = component.getByTestId('hello-button');
    
    console.log('[DEBUG] Testing initial state');
    await expect(button).toContainText('Click me! (0)');
    
    // Click button once
    console.log('[DEBUG] Clicking button first time');
    await button.click();
    await expect(button).toContainText('Click me! (1)');
    await expect(component.getByTestId('click-counter')).toContainText('Button clicked 1 time');
    
    // Click button again
    console.log('[DEBUG] Clicking button second time');
    await button.click();
    await expect(button).toContainText('Click me! (2)');
    await expect(component.getByTestId('click-counter')).toContainText('Button clicked 2 times');
    
    console.log('[END] Button click test completed successfully');
  });

  test('should call onClick handler when provided', async ({ mount }) => {
    console.log('[INIT] Testing onClick handler');
    
    let clickCount = 0;
    const handleClick = () => {
      clickCount++;
      console.log(`[DEBUG] onClick handler called, count: ${clickCount}`);
    };
    
    const component = await mount(<HelloWorld onClick={handleClick} />);
    const button = component.getByTestId('hello-button');
    
    // Click button and verify handler was called
    await button.click();
    await expect.poll(() => clickCount).toBe(1);
    
    await button.click();
    await expect.poll(() => clickCount).toBe(2);
    
    console.log('[END] onClick handler test completed successfully');
  });

  test('should hide button when showButton is false', async ({ mount }) => {
    console.log('[INIT] Testing hidden button');
    
    const component = await mount(<HelloWorld showButton={false} />);
    
    console.log('[DEBUG] Component with hidden button mounted');
    
    await expect(component.getByTestId('hello-message')).toBeVisible();
    await expect(component.getByTestId('hello-button')).not.toBeVisible();
    
    console.log('[END] Hidden button test completed successfully');
  });

  test('should apply custom className', async ({ mount }) => {
    console.log('[INIT] Testing custom className');

    const component = await mount(<HelloWorld className="custom-class" />);

    console.log('[DEBUG] Component with custom class mounted');

    // The component itself is the div with data-testid="hello-world"
    await expect(component).toHaveClass(/custom-class/);

    console.log('[END] Custom className test completed successfully');
  });

  test('visual regression - default appearance', async ({ mount }) => {
    console.log('[INIT] Testing visual regression - default appearance');
    
    const component = await mount(<HelloWorld />);
    
    console.log('[DEBUG] Taking screenshot for visual regression');
    
    // Take screenshot for visual regression testing
    await expect(component).toHaveScreenshot('hello-world-default.png');
    
    console.log('[END] Visual regression test completed successfully');
  });

  test('visual regression - after button click', async ({ mount }) => {
    console.log('[INIT] Testing visual regression - after button click');
    
    const component = await mount(<HelloWorld />);
    const button = component.getByTestId('hello-button');
    
    // Click button to show counter
    console.log('[DEBUG] Clicking button for visual state change');
    await button.click();
    
    // Wait for counter to appear
    await expect(component.getByTestId('click-counter')).toBeVisible();
    
    console.log('[DEBUG] Taking screenshot after button click');
    
    // Take screenshot of the updated state
    await expect(component).toHaveScreenshot('hello-world-clicked.png');
    
    console.log('[END] Visual regression after click test completed successfully');
  });

  test('visual regression - custom message', async ({ mount }) => {
    console.log('[INIT] Testing visual regression - custom message');
    
    const component = await mount(
      <HelloWorld message="Custom Message for Visual Testing!" />
    );
    
    console.log('[DEBUG] Taking screenshot with custom message');
    
    await expect(component).toHaveScreenshot('hello-world-custom-message.png');
    
    console.log('[END] Visual regression custom message test completed successfully');
  });

});
