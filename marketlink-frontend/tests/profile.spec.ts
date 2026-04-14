import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PROVIDER_EMAIL = process.env.ML_PROVIDER_EMAIL || '';
const PROVIDER_PASSWORD = process.env.ML_PROVIDER_PASSWORD || '';

async function loginAsProvider(page: any) {
  if (!PROVIDER_EMAIL || !PROVIDER_PASSWORD) {
    throw new Error('Missing ML_PROVIDER_EMAIL or ML_PROVIDER_PASSWORD env vars.');
  }

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(PROVIDER_EMAIL);
  await page.getByLabel('Password').fill(PROVIDER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.beforeEach(async ({ page }) => {
  await loginAsProvider(page);
  await page.goto(`${BASE_URL}/dashboard/profile`);
  await expect(page.getByRole('heading', { name: 'Edit profile' })).toBeVisible();
});

test('shows core profile fields', async ({ page }) => {
  await expect(page.getByPlaceholder('One line summary for cards')).toBeVisible();
  await expect(page.getByPlaceholder('Describe your agency, focus areas, and approach.')).toBeVisible();
  await expect(page.getByPlaceholder('https://...').first()).toBeVisible();
  await expect(page.getByPlaceholder('(555) 123-4567')).toBeVisible();
});

test('shows pricing fields', async ({ page }) => {
  await expect(page.getByText('Pricing')).toBeVisible();
  await expect(page.getByPlaceholder('e.g. 75')).toBeVisible();
  await expect(page.getByPlaceholder('e.g. 150')).toBeVisible();
  await expect(page.getByPlaceholder('e.g. 5000')).toBeVisible();
  await expect(page.getByPlaceholder('USD')).toBeVisible();
});

test('shows classification fields and toggles', async ({ page }) => {
  await expect(page.getByPlaceholder('english, spanish')).toBeVisible();
  await expect(page.getByPlaceholder('healthcare, retail')).toBeVisible();
  await expect(page.getByPlaceholder('smb, enterprise')).toBeVisible();
  await expect(page.getByPlaceholder('lead gen, ecommerce')).toBeVisible();
  await expect(page.getByLabel('Remote friendly')).toBeVisible();
  await expect(page.getByLabel('Serves nationwide')).toBeVisible();
  await expect(page.getByPlaceholder('e.g. 24')).toBeVisible();
});
