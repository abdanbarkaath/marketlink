import { expect, test } from '@playwright/test';
test.use({ channel: 'msedge' });
const baseURL = process.env.ML_BASE_URL || 'http://localhost:3000';

test('landing examples explain discovery without loading live listings', async ({ page }) => {
  const providerRequests: string[] = [];
  page.on('request', request => { if (request.url().includes(':4000/experts')) providerRequests.push(request.url()); });
  await page.goto(baseURL);
  await expect(page.locator('#agency-list .agency')).toHaveCount(3);
  await expect(page.locator('.chips input')).toHaveCount(5);
  await expect(page.locator('#agency-list')).toContainText('fictional teams');
  await page.getByRole('button', { name: 'Highlight example Northline Marketing' }).click();
  await expect(page.locator('.explore-results .agency.selected')).toContainText('Northline Marketing');
  await page.getByRole('button', { name: 'Explore example: Northline Marketing', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Fictional sample agency');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(providerRequests).toEqual([]);
});

test('demo expertise stays local while real location and name search are preserved', async ({ page }) => {
  await page.goto(baseURL);
  const seo = page.getByRole('checkbox', { name: 'SEO', exact: true });
  await seo.focus();
  await seo.press('Space');
  await expect(page.locator('#agency-list .agency')).toHaveCount(2);
  await page.locator('input[name="zip"]').fill('60601');
  await page.locator('input[name="name"]').fill('Team');
  await page.route('**/experts?**', route => route.fulfill({ contentType: 'text/html', body: 'Search destination' }));
  await page.getByRole('button', { name: 'Find marketing teams', exact: true }).click();
  await page.waitForURL('**/experts?**');
  const query = new URL(page.url()).searchParams;
  expect(query.get('zip')).toBe('60601');
  expect(query.get('radius')).toBe('10');
  expect(query.get('name')).toBe('Team');
  expect(query.has('service')).toBe(false);
  expect(query.has('skills')).toBe(false);
  expect(query.has('match')).toBe(false);
});

test('blank location opens general browsing', async ({ page }) => {
  await page.goto(baseURL);
  await page.route('**/experts', route => route.fulfill({ contentType: 'text/html', body: 'Directory' }));
  await page.getByRole('button', { name: 'Find marketing teams', exact: true }).click();
  await page.waitForURL('**/experts');
  expect(new URL(page.url()).search).toBe('');
});
