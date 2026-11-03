import { test, expect, type Page, type Locator } from '@playwright/test';

test.use({ channel: 'msedge' });
const baseURL = process.env.ML_BASE_URL || 'http://localhost:3000';

async function expectContainedModal(page: Page, modal: Locator, centered = true) {
  await expect(modal).toBeVisible();
  const bounds = await modal.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  if (centered) {
    expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(10);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThan(2);
  }
  expect(await page.locator('html').evaluate((node) => getComputedStyle(node).overflow)).toBe('hidden');
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 640 }, { width: 390, height: 844 }]) {
  test(`dialogs stay contained and scroll correctly at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${baseURL}/experts`);
    const opener = page.getByRole('button', { name: 'All marketing services', exact: true });
    await opener.click();
    const picker = page.getByRole('dialog', { name: 'All marketing services', exact: true });
    await expectContainedModal(page, picker, viewport.width > 700);
    const list = picker.locator('.service-groups');
    expect(await list.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await list.evaluate((node) => { node.scrollTop = node.scrollHeight; });
    const footer = await picker.locator('.picker-footer').boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(viewport.height + 1);
    await expect(picker.getByRole('button', { name: 'Close service picker' })).toBeInViewport();
    await expect(picker.getByRole('button', { name: 'Apply services', exact: true })).toBeInViewport();
    expect(await picker.evaluate((node) => node.scrollHeight <= node.clientHeight + 1)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    expect(await page.locator('html').evaluate((node) => getComputedStyle(node).overflow)).not.toBe('hidden');

    await page.getByRole('button', { name: 'How pricing works' }).click();
    await expectContainedModal(page, page.getByRole('dialog', { name: 'How agency pricing works' }));
    await page.keyboard.press('Escape');
    const comparisons = page.getByTestId('expert-result-card').getByRole('checkbox');
    await comparisons.nth(0).check(); await comparisons.nth(1).check();
    await page.getByRole('button', { name: 'Compare teams', exact: true }).click();
    await expectContainedModal(page, page.getByRole('dialog', { name: 'Compare marketing teams' }));
    await page.keyboard.press('Escape');

    await page.goto(baseURL);
    await page.getByRole('button', { name: /^Explore example:/ }).first().click();
    await expectContainedModal(page, page.getByRole('dialog'));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
}
