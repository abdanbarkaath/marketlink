import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test('problem-context desktop results keep filters in a side rail', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/experts?service=seo%2Cweb%2Cads&match=any&problem=cant-find-business`);

  await expect(page.getByTestId('problem-context-panel')).toBeVisible();
  const filterRail = page.getByTestId('desktop-filter-rail');
  await expect(filterRail).toBeVisible();
  await expect(filterRail.getByLabel('City')).toBeVisible();
  await expect(filterRail.getByRole('textbox', { name: 'Service' })).toBeVisible();
  await expect(filterRail.getByLabel('Service match')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Expert results' })).toBeVisible();

  const resultsList = page.getByTestId('expert-results-list');
  await expect(resultsList).toBeVisible();
  await expect(page.getByTestId('expert-result-card').first()).toBeVisible();
  const columnCount = await resultsList.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
  expect(columnCount).toBe(1);
});
