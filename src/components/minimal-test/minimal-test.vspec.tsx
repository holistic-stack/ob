import { test, expect } from '@playwright/experimental-ct-react';
import { MinimalComponent } from './minimal-component';

test('minimal test', async ({ mount }) => {
  const component = await mount(<MinimalComponent />);
  await expect(component.getByTestId('minimal')).toBeVisible();
  await expect(component.getByText('Minimal Test Component')).toBeVisible();
  await expect(component.getByText('Hello World')).toBeVisible();
});
