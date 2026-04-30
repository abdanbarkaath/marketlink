import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
});

test('homepage loads', async ({ page }) => {
  await expect(page).toHaveURL(BASE_URL);
});

test('shows main heading', async ({ page }) => {
  await expect(
    page.getByRole('heading', {
      name: 'Find marketers, website builders, and other local experts for your business.',
    }),
  ).toBeVisible();
});

test('shows supporting intro copy', async ({ page }) => {
  await expect(page.getByText('Browse by service, narrow by city, and compare real local experts in one place.')).toBeVisible();
});

test('browse local experts link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Browse local experts' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/experts');
});

test('search by service link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Search by service' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/experts');
});

test('renders 8 service path cards', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8);
});

test('shows Google discovery service path', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 3, name: 'Show up on Google' })).toBeVisible();
  await expect(page.getByText('SEO / local search')).toBeVisible();
});

test('shows social media service path', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 3, name: 'Grow on social media' })).toBeVisible();
  await expect(page.getByText('Social media marketing')).toBeVisible();
});

test('service path cards link to expert filters', async ({ page }) => {
  const link = page.getByRole('link', { name: /Run local ads/i });
  await expect(link).toHaveAttribute('href', '/experts?service=ads');
});

test('shows See experts callouts', async ({ page }) => {
  await expect(page.getByText('See experts')).toHaveCount(8);
});

test('footer directory link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Open directory' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/experts');
});
