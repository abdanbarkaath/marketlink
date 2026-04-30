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
      name: 'Find local marketing experts near you.',
    }),
  ).toBeVisible();
});

test('shows supporting intro copy', async ({ page }) => {
  await expect(page.getByText('Find and compare local experts for the marketing help your business needs.')).toBeVisible();
});

test('browse local experts link is visible', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Browse local experts' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/experts');
});

test('desktop hero shows problem-first discovery choices', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL);

  await expect(page.getByTestId('desktop-problem-panel')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose a starting point' })).toBeVisible();
  const panel = page.getByTestId('desktop-problem-panel');
  await expect(panel.getByTestId('desktop-problem-link')).toHaveCount(3);
  await expect(panel.getByText("People can't find my business")).toBeVisible();
  await expect(panel.getByText('I need more calls or bookings')).toBeVisible();
  await expect(panel.getByText('My website is not helping')).toBeVisible();
});

test('desktop hero keeps the left side focused on one action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL);

  await expect(page.getByTestId('desktop-buyer-flow')).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Search by service' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse local experts' })).toBeVisible();
});

test('desktop hero explains the product with a vertical checklist', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL);

  const checklist = page.getByTestId('desktop-product-checklist');
  await expect(checklist).toBeVisible();
  await expect(checklist.getByTestId('desktop-product-checklist-item')).toHaveCount(3);
  await expect(checklist.getByText('Find local experts')).toBeVisible();
  await expect(checklist.getByText('Compare best fits')).toBeVisible();
  await expect(checklist.getByText('Get real results')).toBeVisible();
  await expect(checklist.getByTestId('desktop-product-checklist-icon')).toHaveCount(3);
  const resultIcon = checklist.getByTestId('desktop-product-checklist-item').filter({ hasText: 'Get real results' }).getByTestId('desktop-product-checklist-icon');
  await expect(resultIcon).toContainText('100');
  await expect(resultIcon).not.toHaveClass(/.*bg-slate-950.*/);
});

test('desktop keeps problem choices inside the hero starting point panel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL);

  await expect(page.getByTestId('desktop-problem-section')).not.toBeVisible();
  await expect(page.getByText('What do you need help fixing first?')).not.toBeVisible();
  const panel = page.getByTestId('desktop-problem-panel');
  await expect(panel.getByTestId('desktop-problem-link')).toHaveCount(3);
});

test('renders 8 service path cards', async ({ page }) => {
  await expect(page.getByTestId('service-path-card')).toHaveCount(8);
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
  const link = page.getByTestId('service-path-card').filter({ hasText: 'Run local ads' });
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

test.describe('mobile problem-first discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
  });

  test('shows compact problem cards before the full service grid', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Choose a starting point' })).toBeVisible();
    await expect(page.getByTestId('mobile-problem-card')).toHaveCount(4);
    const mobileCards = page.getByTestId('mobile-problem-card');
    await expect(mobileCards.filter({ hasText: "People can't find my business" })).toBeVisible();
    await expect(mobileCards.filter({ hasText: 'I need more calls or bookings' })).toBeVisible();
    await expect(mobileCards.filter({ hasText: 'My website is not helping' })).toBeVisible();
    await expect(mobileCards.filter({ hasText: "I'm not sure what I need" })).toBeVisible();
  });

  test('problem cards route mobile users into expert filters', async ({ page }) => {
    const link = page.getByRole('link', { name: /People can't find my business/i });
    await expect(link).toHaveAttribute('href', '/experts?service=seo%2Cweb%2Cads&match=any&problem=cant-find-business');
  });

  test('hides the heavy how-it-works panel from the mobile hero', async ({ page }) => {
    await expect(page.getByTestId('hero-how-it-works-panel')).not.toBeVisible();
  });
});
