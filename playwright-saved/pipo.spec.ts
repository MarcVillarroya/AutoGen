import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://example.com/');
  await page.getByText('This domain is for use in').click();
  await page.getByRole('heading', { name: 'Example Domain' }).click();
});