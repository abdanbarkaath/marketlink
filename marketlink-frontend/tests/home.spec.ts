import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
});

test('homepage loads', async ({ page }) => {
  await expect(page).toHaveURL(BASE_URL);
});

test('shows main heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Find local marketing experts' })).toBeVisible();
});

test('shows supporting intro copy', async ({ page }) => {
  await expect(page.getByText('Pick a category to browse verified providers in your area.')).toBeVisible();
});

test('browse all providers link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Browse all providers' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/providers');
});

test('use filters link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Use filters' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/providers');
});

test('renders 8 category headings', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(8);
});

test('shows SEO category card', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 2, name: 'SEO' })).toBeVisible();
});

test('shows Social Media category card', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 2, name: 'Social Media' })).toBeVisible();
});

test('shows View providers callouts', async ({ page }) => {
  await expect(page.getByText('View providers')).toHaveCount(8);
});

test('footer message is visible', async ({ page }) => {
  await expect(page.getByText('Want more control? Use filters on the providers page.')).toBeVisible();
});

test('footer filters link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Go to filters' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/providers');
});
