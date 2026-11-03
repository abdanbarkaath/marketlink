import { test, expect } from '@playwright/test';
test.use({ channel: 'msedge' });
const baseURL = process.env.ML_BASE_URL || 'http://localhost:3000';

test('complete service selection survives navigation and supports all matching', async ({ page }) => {
  await page.goto(`${baseURL}/experts`);
  await page.getByRole('button', { name: 'All marketing services', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'All marketing services', exact: true })).toContainText('12 marketing areas · 46 services');
  const search = page.getByRole('searchbox', { name: 'Search all services' });
  await search.fill('photography');
  await page.getByRole('checkbox', { name: /^Photography/ }).check();
  await search.fill('email');
  await page.getByRole('checkbox', { name: /^Email Marketing/ }).check();
  await page.getByRole('button', { name: 'Apply 2 selected services' }).click();
  await expect(page).toHaveURL(/skills=.*photography/);
  await expect(page.getByRole('button', { name: 'Remove Photography filter', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Match services' }).selectOption('all');
  await expect(page).toHaveURL(/match=all/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove Email Marketing filter', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Match services' })).toHaveValue('all');
});

test('real provider comparison and pricing explanations work', async ({ page }) => {
  await page.goto(`${baseURL}/experts`);
  const cards = page.getByTestId('expert-result-card');
  await expect(cards.first()).toBeVisible();
  const names = await cards.locator('h3').allTextContents();
  await cards.nth(0).getByRole('checkbox').check();
  await cards.nth(1).getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Compare teams', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Compare marketing teams' });
  await expect(dialog).toContainText(names[0]);
  await expect(dialog).toContainText(names[1]);
  await expect(dialog.getByRole('row')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'How pricing works' }).click();
  await expect(page.getByRole('dialog', { name: 'How agency pricing works' })).toContainText('Hourly rates are labelled per hour');
});

test('map selection highlights its real provider result', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/experts`);
  const pin = page.locator('.maplibregl-marker button:visible').first();
  await expect(pin).toBeVisible();
  const name = await pin.getAttribute('aria-label');
  await pin.focus(); await pin.press('Enter');
  await expect(page.locator('.agency.selected h3')).toHaveText(name || '');
});

test('mobile service picker supports synonyms, cancellation and map toggle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/experts`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'All marketing services', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search all services' }).fill('instagram ads');
  await page.getByRole('checkbox', { name: /^Facebook & Instagram Ads/ }).check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).not.toHaveURL(/skills=/);
  await page.getByRole('button', { name: 'Show map', exact: true }).click();
  await expect(page.locator('#directory-map')).toBeVisible();
});

test('pagination preserves sorting and page size', async ({ page }) => {
  await page.goto(`${baseURL}/experts?limit=2&sort=name`);
  await expect(page.getByTestId('expert-result-card')).toHaveCount(2);
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  const query = new URL(page.url()).searchParams;
  expect(query.get('sort')).toBe('name'); expect(query.get('limit')).toBe('2');
  await expect(page.getByTestId('expert-result-card')).toHaveCount(2);
});
