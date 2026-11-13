import { expect, test } from '@playwright/test';

const baseUrl = process.env.ML_TEST_BASE_URL || 'http://localhost:3000';

test('agency can retry an edit without replacing saved services or work', async ({ page }, testInfo) => {
  const expert = {
    slug: 'example-agency', businessName: 'Example Agency', expertType: 'agency',
    city: 'Chicago', state: 'IL', status: 'active', locationPrecision: 'approximate',
    services: ['seo', 'legacy-service'], projects: [{ id: 'project', title: 'An anonymous case study' }],
  };
  const payloads: unknown[] = [];
  await page.route('**/me/summary', (route) => route.fulfill({ json: { user: { role: 'provider' }, expert } }));
  await page.route('**/location/autocomplete?*', (route) => route.fulfill({ json: { suggestions: [] } }));
  await page.route('**/experts', (route) => {
    payloads.push(route.request().postDataJSON());
    return payloads.length === 1
      ? route.fulfill({ status: 500, json: { error: 'Please try again.' } })
      : route.fulfill({ json: { ok: true, expert } });
  });

  await page.goto(baseUrl + '/dashboard/profile');
  await expect(page.getByRole('heading', { name: 'Edit profile' })).toBeVisible();
  await expect(page.getByLabel('Public location')).toHaveValue('approximate');
  await expect(page.getByLabel('Remove Legacy Service')).toBeVisible();
  const description = page.getByPlaceholder('One line summary for cards');
  await description.fill('Local marketing for small businesses');
  const save = page.getByRole('button', { name: 'Save changes' }).first();
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Please try again.' })).toBeFocused();
  await expect(description).toHaveValue('Local marketing for small businesses');
  await page.screenshot({ path: testInfo.outputPath('save-error.png'), fullPage: false });
  await save.click();
  await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeVisible();
  expect(payloads).toEqual([
    { shortDescription: 'Local marketing for small businesses' },
    { shortDescription: 'Local marketing for small businesses' },
  ]);
});

test('service picker works with the keyboard and keeps a saved legacy token', async ({ page }) => {
  const expert = {
    slug: 'example-agency', businessName: 'Example Agency', expertType: 'agency',
    city: 'Chicago', state: 'IL', locationPrecision: 'approximate', services: ['legacy-service'],
  };
  await page.route('**/me/summary', (route) => route.fulfill({ json: { user: { role: 'provider' }, expert } }));
  let savedServices: string[] = [];
  await page.route('**/experts', (route) => {
    savedServices = route.request().postDataJSON().services;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto(baseUrl + '/dashboard/profile');
  const areas = page.getByRole('combobox', { name: 'Marketing areas' });
  await areas.fill('seo');
  await areas.press('ArrowDown');
  await areas.press('Enter');
  const help = page.getByRole('combobox', { name: 'Specific help' });
  await help.focus();
  await help.press('ArrowDown');
  await help.press('Enter');
  await expect(page.getByText('1 selected · up to 5', { exact: true })).toBeVisible();
  await expect(page.getByText('1 selected · up to 10', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeVisible();
  expect(savedServices).toContain('legacy-service');
  expect(savedServices.length).toBeGreaterThan(1);
  expert.services = savedServices;
  await page.reload();
  await expect(page.getByText('1 selected · up to 5', { exact: true })).toBeVisible();
  await expect(page.getByText('1 selected · up to 10', { exact: true })).toBeVisible();
});

test('location suggestions are keyboard accessible and changed client work needs confirmation', async ({ page }, testInfo) => {
  const expert = {
    slug: 'example-agency', businessName: 'Example Agency', expertType: 'agency',
    city: 'Chicago', state: 'IL', status: 'active', locationPrecision: 'approximate', services: ['seo'],
  };
  await page.route('**/me/summary', (route) => route.fulfill({ json: { user: { role: 'provider' }, expert } }));
  await page.route('**/location/autocomplete?*', (route) => route.fulfill({
    json: { suggestions: [{ label: '12 Example Street', city: 'Chicago', stateCode: 'IL', zip: '60601' }] },
  }));
  const payloads: unknown[] = [];
  await page.route('**/experts', (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto(baseUrl + '/dashboard/profile');
  const address = page.getByRole('combobox', { name: 'Business address (optional)' });
  await address.fill('12 Example');
  await expect(page.getByRole('option', { name: '12 Example Street' })).toBeVisible();
  await address.press('ArrowDown');
  await address.press('Enter');
  await expect(address).toHaveValue('12 Example Street');
  await page.getByLabel('Public location').selectOption('private');
  const addClient = page.getByRole('button', { name: 'Add client', exact: true });
  if (!(await addClient.isVisible())) await page.getByRole('button', { name: /Featured clients/ }).click();
  await addClient.click();
  await page.getByPlaceholder('Acme Health').fill('Approved Client');
  const save = page.getByRole('button', { name: 'Save changes' }).first();
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Confirm permission' })).toBeVisible();
  expect(payloads).toEqual([]);
  const confirmation = page.getByRole('checkbox', { name: /I confirm this work/ });
  await confirmation.check();
  await page.screenshot({ path: testInfo.outputPath('confirmation.png') });
  await save.click();
  await expect(page.getByRole('status').filter({ hasText: 'Profile saved.' })).toBeVisible();
  expect(payloads).toEqual([expect.objectContaining({
    locationPrecision: 'private', confirmPublicWork: true,
    clients: [expect.objectContaining({ name: 'Approved Client' })],
  })]);
});

test('service picker enforces independent area and help limits', async ({ page }) => {
  await page.route('**/me/summary', (route) => route.fulfill({
    json: {
      user: { role: 'provider' },
      expert: {
        slug: 'example-agency', businessName: 'Example Agency', expertType: 'agency',
        city: 'Chicago', state: 'IL', locationPrecision: 'approximate', services: [],
      },
    },
  }));
  await page.goto(baseUrl + '/dashboard/profile');
  const areas = page.getByRole('combobox', { name: 'Marketing areas' });
  for (let index = 0; index < 5; index += 1) {
    await areas.press('ArrowDown');
    await areas.press('Enter');
  }
  await expect(areas).toBeDisabled();

  const help = page.getByRole('combobox', { name: 'Specific help' });
  for (let index = 0; index < 10; index += 1) {
    await help.press('ArrowDown');
    await help.press('Enter');
  }
  await expect(help).toBeDisabled();
  await expect(page.getByText('5 selected · up to 5', { exact: true })).toBeVisible();
  await expect(page.getByText('10 selected · up to 10', { exact: true })).toBeVisible();
});

test('both service menus reopen on the next click or tap after a selection', async ({ page, hasTouch }) => {
  await page.route('**/me/summary', (route) => route.fulfill({
    json: {
      user: { role: 'provider' },
      expert: {
        slug: 'example-agency', businessName: 'Example Agency', expertType: 'agency',
        city: 'Chicago', state: 'IL', locationPrecision: 'approximate', services: [],
      },
    },
  }));
  await page.goto(baseUrl + '/dashboard/profile');
  for (const name of ['Marketing areas', 'Specific help']) {
    const input = page.getByRole('combobox', { name });
    for (let count = 0; count < 2; count += 1) {
      if (hasTouch) await input.tap();
      else await input.click();
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      const option = page.getByRole('listbox').getByRole('option').first();
      if (hasTouch) await option.tap();
      else await option.click();
      await expect(input).toHaveAttribute('aria-expanded', 'false');
    }
  }
  await expect(page.getByText('2 selected · up to 5', { exact: true })).toBeVisible();
  await expect(page.getByText('2 selected · up to 10', { exact: true })).toBeVisible();
});
