import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test, type APIRequestContext, type BrowserContext } from '@playwright/test';

const BASE_URL = process.env.ML_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'marketlink-backend');
const PROVIDER_PASSWORD = 'password123';

type ProviderFixture = {
  email: string;
  requestId: string;
};

function ensureProviderFixture(): ProviderFixture {
  const script = `
const fs = require('fs');
const path = require('path');
const envText = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
for (const line of envText.split(/\\r?\\n/)) {
  const match = line.match(/^\\s*DATABASE_URL\\s*=\\s*['\\"]?(.+?)['\\"]?\\s*$/);
  if (match) process.env.DATABASE_URL = match[1];
}
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const expert = await prisma.expert.findFirst({
    where: { slug: 'windy-city-growth' },
    select: {
      owner: { select: { id: true, email: true } },
      conversations: {
        take: 1,
        orderBy: { updatedAt: 'desc' },
        select: { requestId: true },
      },
    },
  });

  if (!expert?.owner?.id || !expert.owner.email) {
    throw new Error('Provider fixture is missing its owner account.');
  }

  if (!expert.conversations.length) {
    throw new Error('Provider fixture is missing an accepted conversation.');
  }

  await prisma.user.update({
    where: { id: expert.owner.id },
    data: {
      passwordHash: await bcrypt.hash(${JSON.stringify(PROVIDER_PASSWORD)}, 10),
      mustChangePassword: false,
      isDisabled: false,
    },
  });

  process.stdout.write(JSON.stringify({
    email: expert.owner.email,
    requestId: expert.conversations[0].requestId,
  }));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
`;

  return JSON.parse(
    execFileSync('node', ['-e', script], {
      cwd: BACKEND_DIR,
      encoding: 'utf8',
    }),
  ) as ProviderFixture;
}

async function createProviderSession(request: APIRequestContext, context: BrowserContext, email: string) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email,
      password: PROVIDER_PASSWORD,
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

test('provider can open chat from an accepted request', async ({ page, request }) => {
  const fixture = ensureProviderFixture();

  await createProviderSession(request, page.context(), fixture.email);
  await page.goto(`${BASE_URL}/dashboard/requests/view?id=${encodeURIComponent(fixture.requestId)}`);

  const openChatLink = page.getByRole('link', { name: 'Open chat' }).first();
  await expect(openChatLink).toBeVisible();
  await expect(openChatLink).toHaveAttribute('href', /\/dashboard\/messages\?proposalId=/);

  const href = await openChatLink.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(new URL(href || '', BASE_URL).toString());

  await expect(page).toHaveURL(/\/dashboard\/messages/);
  await expect(page.getByRole('heading', { name: 'Provider chat inbox' })).toBeVisible();
  await expect(page.getByText('Accepted conversations').locator('xpath=ancestor::aside[1]')).toHaveClass(/overflow-hidden/);
});
