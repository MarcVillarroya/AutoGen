import { test, expect } from '@playwright/test';
test('test', async ({ page }) => {
  await page.goto('https://example.com/');
  await page.getByRole('heading', { name: 'Example Domain' }).click();
  await page.getByText('This domain is for use in').click();
  await page.getByRole('link', { name: 'More information...' }).click();
  await page.getByRole('link', { name: 'Homepage' }).click();
});