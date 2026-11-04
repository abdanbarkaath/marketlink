import { expect, test } from '@playwright/test';

test.use({ channel: 'msedge' });
const baseURL = process.env.ML_BASE_URL || 'http://localhost:3000';
const slug = 'profile-design-test';
const provider = {
  id: 'profile-test', slug, businessName: 'Local Growth Team', email: 'agency@example.test',
  expertType: 'agency', status: 'active', verified: true,
  tagline: 'Strategy, search and creative.', shortDescription: 'Marketing for local businesses.',
  overview: 'We bring search and creative work together.',
  city: 'Oak Park', state: 'IL', zip: '60302',
  instagramUrl: 'https://www.instagram.com/example/',
  linkedinUrl: 'https://www.linkedin.com/company/example/', websiteUrl: 'https://example.test',
  services: ['local-seo', 'google-ads'], industries: ['retail'], languages: ['english'],
  minProjectBudget: 1500, hourlyRateMin: 85, hourlyRateMax: 145, currencyCode: 'USD',
  remoteFriendly: true, foundedYear: 2018,
  projects: [{ id: 'project', title: 'Local search launch', summary: 'A search campaign.', services: ['local-seo'], challenge: 'Improve local discovery.', solution: 'Reworked search pages.', results: 'Provider-supplied results.' }],
  clients: [{ id: 'client', name: 'Example client' }],
  reviews: [{ id: 'review', reviewerName: 'Example reviewer', rating: 4.5, body: 'Clear communication.', verified: true }],
  certifications: [{ id: 'credential', title: 'Example certification', issuer: 'Example issuer' }],
};

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`approved profile flow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route(`**/experts/${slug}`, route => route.request().resourceType() === 'fetch'
      ? route.fulfill({ json: provider }) : route.continue());
    await page.route('https://www.instagram.com/**', route => route.abort());
    await page.goto(`${baseURL}/experts/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: provider.businessName })).toBeVisible();
    await expect(page.locator('a[href="#expert-inquiry-form"]')).toHaveCount(1);
    await expect(page.locator('.profile-socials svg')).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'Open on Instagram', exact: true })).toHaveAttribute('href', provider.instagramUrl);
    await page.getByRole('link', { name: 'Services', exact: true }).click();
    await expect(page.locator('#profile-services')).toContainText('Google Ads');
    await page.locator('#profile-work summary').click();
    await expect(page.getByText('Improve local discovery.', { exact: true })).toBeVisible();
    await expect(page.locator('#profile-reviews')).toContainText('Example reviewer');
    await expect(page.locator('#profile-reviews')).toContainText('Example certification');
    await expect(page.locator('.profile-pricing')).toContainText('From $1,500');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();

    let payload: Record<string, unknown> | undefined;
    await page.route('**/inquiries', async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.getByRole('link', { name: `Contact ${provider.businessName}`, exact: true }).click();
    await page.getByLabel('Name *', { exact: true }).fill('Preview visitor');
    await page.getByLabel('Email *', { exact: true }).fill('visitor@example.test');
    await page.getByLabel('Project details *', { exact: true }).fill('I need local search help.');
    await page.getByRole('button', { name: 'Send inquiry', exact: true }).click();
    await expect(page.getByText(/^Inquiry sent\./)).toBeVisible();
    expect(payload).toMatchObject({ expertSlug: slug, name: 'Preview visitor', message: 'I need local search help.' });
  });
}

test('sparse and inactive profiles remain useful without fabricated content', async ({ page }) => {
  await page.route(`**/experts/${slug}`, route => route.request().resourceType() === 'fetch'
    ? route.fulfill({ json: { id: 'sparse', slug, businessName: 'New Expert', status: 'pending', services: [], city: 'Chicago', state: 'IL', locationPrecision: 'approximate' } })
    : route.continue());
  await page.goto(`${baseURL}/experts/${slug}`);
  await expect(page.getByRole('heading', { level: 1, name: 'New Expert' })).toBeVisible();
  await expect(page.locator('a[href="#expert-inquiry-form"]')).toHaveCount(0);
  await expect(page.getByText('No Instagram preview yet', { exact: true })).toBeVisible();
  await expect(page.locator('#profile-services')).toContainText('has not listed services');
  await expect(page.locator('#profile-work')).toContainText('No projects or work samples');
  await expect(page.locator('#profile-reviews')).toContainText('No client reviews');
  await expect(page.locator('.profile-pricing')).toContainText('Ask the provider for a quote');
  await expect(page.getByRole('button', { name: 'Send inquiry', exact: true })).toHaveCount(0);
  await expect(page.locator('.profile-location')).toContainText('Approximate area');
});

test('unavailable media keeps initials and an Instagram recovery link', async ({ page }) => {
  await page.clock.install();
  await page.route(`**/experts/${slug}`, route => route.request().resourceType() === 'fetch'
    ? route.fulfill({ json: { ...provider, instagramUrl: null, logo: 'https://example.test/missing.png', media: [
      { id: 'post-one', type: 'video', url: 'https://www.instagram.com/p/first-post/' },
      { id: 'post-two', type: 'video', url: 'https://www.instagram.com/p/second-post/' },
    ] } }) : route.continue());
  await page.route('https://example.test/missing.png', route => route.abort());
  await page.route('https://www.instagram.com/**', () => {});
  await page.goto(`${baseURL}/experts/${slug}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.profile-logo')).toHaveText('LG');
  await expect(page.getByRole('status')).toContainText('Loading Instagram preview');
  await page.clock.fastForward(8000);
  await expect(page.getByRole('heading', { name: 'Instagram preview unavailable' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open on Instagram', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next Instagram post', exact: true }).click();
  await expect(page.locator('.profile-carousel')).toContainText('2 of 2');
  await expect(page.locator('.profile-instagram-frame')).toHaveAttribute('src', /second-post/);
});

test('saved Instagram account takes priority over post examples', async ({ page }) => {
  await page.route(`**/experts/${slug}`, route => route.request().resourceType() === 'fetch'
    ? route.fulfill({ json: { ...provider, media: [
      { id: 'sample-post', type: 'video', url: 'https://www.instagram.com/p/unrelated-sample/' },
    ] } }) : route.continue());
  await page.route('https://www.instagram.com/**', route => route.abort());
  await page.goto(`${baseURL}/experts/${slug}`);
  await expect(page.locator('blockquote.instagram-media')).toHaveAttribute('data-instgrm-permalink', provider.instagramUrl);
  await expect(page.locator('.profile-instagram-frame')).toHaveCount(0);
  await expect(page.locator('.profile-carousel')).toHaveCount(0);
});
