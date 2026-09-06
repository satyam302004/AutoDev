import { test, expect } from '@playwright/test';

test('memory page renders without crashing', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.getByRole('button', { name: /MEMORY/i }).click();

  // Wait for memory content to load
  await page.waitForTimeout(2000);

  // Page should not be blank
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
  expect(body!.length).toBeGreaterThan(50);

  // Should show the memory header
  await expect(page.getByText('MEMORY & KNOWLEDGE')).toBeVisible();

  // Should show search input
  await expect(page.getByPlaceholder('Search across all projects...')).toBeVisible();

  // Should show filter tabs
  await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agents' })).toBeVisible();

  // Should have NO runtime errors
  const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
  expect(criticalErrors).toEqual([]);
});

test('memory page renders entries with null quality', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.getByRole('button', { name: /MEMORY/i }).click();
  await page.waitForTimeout(2000);

  // Should show memory entries (the API returns 50 entries, 9 with null quality)
  const entries = page.locator('[style*="cursor: pointer"]');
  const count = await entries.count();
  expect(count).toBeGreaterThan(0);

  // No page errors from null quality
  expect(errors).toEqual([]);
});

test('memory search works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /MEMORY/i }).click();
  await page.waitForTimeout(2000);

  const searchInput = page.getByPlaceholder('Search across all projects...');
  await searchInput.fill('university');
  await searchInput.press('Enter');
  await page.waitForTimeout(1000);

  // Should show results
  const body = await page.textContent('body');
  expect(body).toContain('university');
});

test('memory empty state works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /MEMORY/i }).click();
  await page.waitForTimeout(2000);

  const searchInput = page.getByPlaceholder('Search across all projects...');
  await searchInput.fill('zzzznonexistentzzzz');
  await searchInput.press('Enter');
  await page.waitForTimeout(1000);

  await expect(page.getByText('No results found')).toBeVisible();
});
