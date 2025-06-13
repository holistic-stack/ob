import { test, expect } from '@playwright/experimental-ct-react';

function MinimalComponent() {
  return <div data-testid="minimal">Hello World</div>;
}

test('minimal test', async ({ mount }) => {
  const component = await mount(<MinimalComponent />);
  await expect(component.getByTestId('minimal')).toBeVisible();
});
