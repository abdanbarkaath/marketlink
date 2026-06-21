import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test, type APIRequestContext, type BrowserContext, type Locator } from '@playwright/test';

const BASE_URL = process.env.ML_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'marketlink-backend');
const PROVIDER_PASSWORD = 'password123';

type Fixture = {
  providerEmail: string;
  readProposalId: string;
  unreadBusinessName: string;
};

function ensureUnreadFixture(): Fixture {
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

async function ensureCustomer(email, name, businessName) {
  const passwordHash = await bcrypt.hash('password123', 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      role: 'customer',
      passwordHash,
      mustChangePassword: false,
      isDisabled: false,
      customerProfile: {
        upsert: {
          update: { name, businessName },
          create: { name, businessName },
        },
      },
    },
    create: {
      email,
      role: 'customer',
      passwordHash,
      mustChangePassword: false,
      isDisabled: false,
      customerProfile: {
        create: { name, businessName },
      },
    },
    include: { customerProfile: true },
  });
}

async function ensureRequest(customer, title) {
  const existing = await prisma.customerRequest.findFirst({
    where: { customerUserId: customer.id, title },
  });

  if (existing) return existing;

  return prisma.customerRequest.create({
    data: {
      customerUserId: customer.id,
      customerProfileId: customer.customerProfile.id,
      requesterName: customer.customerProfile.name,
      requesterBusinessName: customer.customerProfile.businessName,
      title,
      description: title + ' description',
      marketingSubjectId: 'paid-ads',
      serviceTokens: ['paid-ads', 'google-ads'],
      zip: '60559',
      budgetLabel: '$4k starter sprint',
      timelineLabel: '2-3 weeks',
      status: 'ACTIVE',
    },
  });
}

(async () => {
  const expert = await prisma.expert.findFirst({
    where: { slug: 'windy-city-growth' },
    select: {
      id: true,
      owner: { select: { id: true, email: true } },
    },
  });

  if (!expert?.owner?.id || !expert.owner.email) {
    throw new Error('Provider fixture is missing its owner account.');
  }

  await prisma.user.update({
    where: { id: expert.owner.id },
    data: {
      passwordHash: await bcrypt.hash('password123', 10),
      mustChangePassword: false,
      isDisabled: false,
    },
  });

  const readCustomer = await ensureCustomer('mm69-read@example.com', 'Read Fixture', 'Read Fixture LLC');
  const unreadCustomer = await ensureCustomer('mm69-unread@example.com', 'Unread Fixture', 'Unread Fixture LLC');

  const readRequest = await ensureRequest(readCustomer, 'MM69 Read Fixture Request');
  const unreadRequest = await ensureRequest(unreadCustomer, 'MM69 Unread Fixture Request');

  const readProposal = await prisma.proposal.upsert({
    where: { requestId_expertId: { requestId: readRequest.id, expertId: expert.id } },
    update: {
      status: 'ACCEPTED',
      message: 'Read fixture proposal',
      priceLabel: '$4k starter sprint',
      timelineLabel: '2-3 weeks',
    },
    create: {
      requestId: readRequest.id,
      expertId: expert.id,
      status: 'ACCEPTED',
      message: 'Read fixture proposal',
      priceLabel: '$4k starter sprint',
      timelineLabel: '2-3 weeks',
    },
  });

  const unreadProposal = await prisma.proposal.upsert({
    where: { requestId_expertId: { requestId: unreadRequest.id, expertId: expert.id } },
    update: {
      status: 'ACCEPTED',
      message: 'Unread fixture proposal',
      priceLabel: '$4k starter sprint',
      timelineLabel: '2-3 weeks',
    },
    create: {
      requestId: unreadRequest.id,
      expertId: expert.id,
      status: 'ACCEPTED',
      message: 'Unread fixture proposal',
      priceLabel: '$4k starter sprint',
      timelineLabel: '2-3 weeks',
    },
  });

  const readConversation = await prisma.conversation.upsert({
    where: { proposalId: readProposal.id },
    update: {
      requestId: readRequest.id,
      customerUserId: readCustomer.id,
      expertId: expert.id,
    },
    create: {
      proposalId: readProposal.id,
      requestId: readRequest.id,
      customerUserId: readCustomer.id,
      expertId: expert.id,
    },
  });

  const unreadConversation = await prisma.conversation.upsert({
    where: { proposalId: unreadProposal.id },
    update: {
      requestId: unreadRequest.id,
      customerUserId: unreadCustomer.id,
      expertId: expert.id,
    },
    create: {
      proposalId: unreadProposal.id,
      requestId: unreadRequest.id,
      customerUserId: unreadCustomer.id,
      expertId: expert.id,
    },
  });

  await prisma.message.deleteMany({ where: { conversationId: { in: [readConversation.id, unreadConversation.id] } } });

  const readCustomerMessageAt = new Date('2026-06-20T17:00:00.000Z');
  const readProviderMessageAt = new Date('2026-06-20T17:10:00.000Z');
  const unreadCustomerMessageAt = new Date('2026-06-20T17:20:00.000Z');

  await prisma.message.createMany({
    data: [
      {
        conversationId: readConversation.id,
        senderUserId: readCustomer.id,
        body: 'Read fixture customer note',
        createdAt: readCustomerMessageAt,
      },
      {
        conversationId: readConversation.id,
        senderUserId: expert.owner.id,
        body: 'Read fixture provider reply',
        createdAt: readProviderMessageAt,
      },
      {
        conversationId: unreadConversation.id,
        senderUserId: unreadCustomer.id,
        body: 'Unread fixture latest customer message',
        createdAt: unreadCustomerMessageAt,
      },
    ],
  });

  await prisma.conversation.update({
    where: { id: readConversation.id },
    data: {
      lastMessageAt: readProviderMessageAt,
      expertLastReadAt: readProviderMessageAt,
      customerLastReadAt: readProviderMessageAt,
    },
  });

  await prisma.conversation.update({
    where: { id: unreadConversation.id },
    data: {
      lastMessageAt: unreadCustomerMessageAt,
      expertLastReadAt: new Date('2026-06-20T17:00:00.000Z'),
      customerLastReadAt: unreadCustomerMessageAt,
    },
  });

  await prisma.conversation.updateMany({
    where: {
      expertId: expert.id,
      NOT: { id: unreadConversation.id },
    },
    data: {
      expertLastReadAt: new Date('2100-01-01T00:00:00.000Z'),
    },
  });

  process.stdout.write(JSON.stringify({
    providerEmail: expert.owner.email,
    readProposalId: readProposal.id,
    unreadBusinessName: 'Unread Fixture LLC',
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
  ) as Fixture;
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

function unreadCard(page: import('@playwright/test').Page, businessName: string): Locator {
  return page.getByRole('button').filter({ hasText: businessName });
}

test('provider inbox shows unread threads and clears them when opened', async ({ page, request }) => {
  const fixture = ensureUnreadFixture();

  await createProviderSession(request, page.context(), fixture.providerEmail);
  await page.goto(`${BASE_URL}/dashboard/messages?proposalId=${encodeURIComponent(fixture.readProposalId)}`);

  const unreadBadges = page.getByRole('button').getByText('Unread', { exact: true });
  await expect(page.getByText(/1 unread/i)).toBeVisible();
  await expect(unreadBadges).toHaveCount(1);

  const unreadThread = unreadCard(page, fixture.unreadBusinessName);
  await expect(unreadThread.getByText('Unread', { exact: true })).toBeVisible();

  await unreadThread.click();

  await expect(unreadThread.getByText('Unread', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/1 unread/i)).toHaveCount(0);
  await expect(unreadBadges).toHaveCount(0);
});
