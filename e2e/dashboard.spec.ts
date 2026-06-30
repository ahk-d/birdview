import { test, expect } from '@playwright/test';

test('dashboard loads with seeded modules', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Birdview', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: "Today's Tasks" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Urgent' })).toBeVisible();
});

test('quick add a task', async ({ page }) => {
  await page.goto('/');
  const input = page.getByPlaceholder('Quick add task…');
  await input.fill('Write e2e test');
  await input.press('Enter');
  await expect(page.getByText('Write e2e test')).toBeVisible();
});

test('command palette opens with the search box', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByPlaceholder(/Search everything/)).toBeVisible();
});
