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

test.describe('mobile problem-first discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
  });

  test('shows compact problem cards before the full service grid', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'What do you need help fixing first?' })).toBeVisible();
    await expect(page.getByTestId('mobile-problem-card')).toHaveCount(4);
    await expect(page.getByText("People can't find my business")).toBeVisible();
    await expect(page.getByText('I need more calls or bookings')).toBeVisible();
    await expect(page.getByText('My website is not helping')).toBeVisible();
    await expect(page.getByText("I'm not sure what I need")).toBeVisible();
  });

  test('problem cards route mobile users into expert filters', async ({ page }) => {
    const link = page.getByRole('link', { name: /People can't find my business/i });
    await expect(link).toHaveAttribute('href', '/experts?service=seo%2Cweb%2Cads&match=any');
  });

  test('hides the heavy how-it-works panel from the mobile hero', async ({ page }) => {
    await expect(page.getByTestId('hero-how-it-works-panel')).not.toBeVisible();
  });
});
