import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';

const BASE_URL = process.env.ML_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function createCustomerSession(request: APIRequestContext, context: BrowserContext) {
  const email = `playwright-customer+${Date.now()}@example.com`;
  const response = await request.post(`${API_BASE_URL}/auth/signup`, {
    data: {
      name: 'Jamie Rivera',
      email,
      password: 'password123',
    },
  });

  expect(response.ok()).toBeTruthy();

  const setCookie = response.headers()['set-cookie'];
  expect(setCookie).toBeTruthy();

  const match = /session=([^;]+)/.exec(setCookie || '');
  expect(match).toBeTruthy();

  await context.addCookies([
    {
      name: 'session',
      value: match?.[1] || '',
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function openCustomerArea(page: Page, request: APIRequestContext) {
  await createCustomerSession(request, page.context());
  await page.goto(`${BASE_URL}/dashboard/customer`);
  await expect(page).toHaveURL(/\/dashboard\/customer/);
}

test('customer is kept out of provider onboarding route', async ({ page, request }) => {
  await openCustomerArea(page, request);

  await page.goto(`${BASE_URL}/dashboard/onboarding`);
  await expect(page).toHaveURL(/\/dashboard\/customer/);
});
