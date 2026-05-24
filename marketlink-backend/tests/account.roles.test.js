require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');

const sessionModule = require('../src/lib/session');
const prismaModule = require('../src/lib/prisma');
const accountRoutes = require('../src/routes/account').default;

test('GET /me/summary keeps provider expert data and compatibility alias intact', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(accountRoutes);

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalFindFirstExpert = prismaModule.prisma.expert.findFirst;

  sessionModule.getUserFromRequest = async () => ({
    id: 'provider_user_1',
    email: 'provider@example.com',
    role: 'provider',
  });

  prismaModule.prisma.expert.findFirst = async () => ({
    id: 'expert_1',
    slug: 'provider-profile',
    businessName: 'Provider Profile',
    expertType: 'agency',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    streetAddress: '123 Main St',
    locationPrecision: 'exact',
    tagline: 'Local growth partner',
    shortDescription: 'Short summary',
    overview: 'Overview',
    websiteUrl: 'https://example.com',
    phone: '555-111-2222',
    linkedinUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    creatorPlatforms: [],
    creatorAudienceSize: null,
    creatorProofSummary: null,
    foundedYear: 2020,
    hourlyRateMin: 100,
    hourlyRateMax: 150,
    minProjectBudget: 5000,
    currencyCode: 'USD',
    languages: [],
    industries: [],
    clientSizes: [],
    specialties: [],
    remoteFriendly: true,
    servesNationwide: false,
    responseTimeHours: 24,
    logo: null,
    services: ['ads'],
    status: 'active',
    disabledReason: null,
    projects: [],
    clients: [],
    media: [],
  });

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/me/summary',
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.equal(body.user.role, 'provider');
    assert.equal(body.customer, null);
    assert.equal(body.expert.id, 'expert_1');
    assert.equal(body.provider.id, 'expert_1');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.expert.findFirst = originalFindFirstExpert;
    await fastify.close();
  }
});

test('GET /me/summary keeps admin accounts out of customer and provider data', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(accountRoutes);

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalFindFirstExpert = prismaModule.prisma.expert.findFirst;

  sessionModule.getUserFromRequest = async () => ({
    id: 'admin_user_1',
    email: 'admin@example.com',
    role: 'admin',
  });

  prismaModule.prisma.expert.findFirst = async () => null;

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/me/summary',
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.equal(body.user.role, 'admin');
    assert.equal(body.customer, null);
    assert.equal(body.expert, null);
    assert.equal(body.provider, null);
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.expert.findFirst = originalFindFirstExpert;
    await fastify.close();
  }
});

test('PUT /me/customer-profile rejects provider accounts', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(accountRoutes);

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;

  sessionModule.getUserFromRequest = async () => ({
    id: 'provider_user_2',
    email: 'provider@example.com',
    role: 'provider',
  });

  try {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/me/customer-profile',
      payload: {
        name: 'Jamie Rivera',
      },
    });

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error, 'Only customers can update customer profiles.');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    await fastify.close();
  }
});
