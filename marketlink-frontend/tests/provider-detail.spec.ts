import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const PROVIDER_SLUG = 'windy-city-growth';

test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/providers/${PROVIDER_SLUG}`);
});

test('shows case studies section', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Case studies' })).toBeVisible();
  await expect(page.getByText('Regional clinic paid search rebuild')).toBeVisible();
});

test('shows featured clients section', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Featured clients' })).toBeVisible();
  await expect(page.getByText('Northside Dental Group')).toBeVisible();
});

test('shows media gallery section', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Media gallery' })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(3);
  await expect(page.getByText('Video walkthrough of campaign reporting and lead flow improvements')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open website' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open on Instagram' })).toBeVisible();
});
