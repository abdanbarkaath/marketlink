import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ML_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ML_ADMIN_PASSWORD || '';

async function loginAsAdmin(page: any) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing ML_ADMIN_EMAIL or ML_ADMIN_PASSWORD env vars.');
  }

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard\/admin/);
}

test('admin can open dashboard', async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole('heading', { name: 'Admin Overview' })).toBeVisible();
});

test('admin can invite a user', async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'Invite user' }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin\/invite/);

  const email = `playwright+${Date.now()}@example.com`;
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Role').selectOption('provider');
  await page.getByRole('button', { name: 'Send invite' }).click();

  await expect(page.getByText('Invite created.')).toBeVisible();
  await expect(page.getByText('Temp password:')).toBeVisible();
});

test('admin can reset a provider password', async ({ page }) => {
  await loginAsAdmin(page);

  const editLink = page.getByRole('link', { name: 'Edit' }).first();
  await editLink.click();

  await expect(page).toHaveURL(/\/dashboard\/admin\/providers\//);
  await page.getByRole('button', { name: 'Reset password' }).click();

  await expect(page.getByText('Temp password:')).toBeVisible();
});
