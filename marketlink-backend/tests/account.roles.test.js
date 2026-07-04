require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');

const sessionModule = require('../src/lib/session');
const prismaModule = require('../src/lib/prisma');
const geocodingModule = require('../src/lib/geocoding');
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

test('GET /me/provider-stats returns lightweight provider dashboard counts', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(accountRoutes);

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalFindFirstExpert = prismaModule.prisma.expert.findFirst;
  const originalInquiry = prismaModule.prisma.inquiry;
  const originalConversation = prismaModule.prisma.conversation;
  const originalCustomerRequest = prismaModule.prisma.customerRequest;
  const originalProposal = prismaModule.prisma.proposal;
  const originalLookupZipLocation = geocodingModule.lookupZipLocation;

  sessionModule.getUserFromRequest = async () => ({
    id: 'provider_user_stats_1',
    email: 'provider@example.com',
    role: 'provider',
  });

  prismaModule.prisma.expert.findFirst = async ({ where }) => {
    assert.equal(where.userId, 'provider_user_stats_1');
    return {
      id: 'expert_stats_1',
      city: 'Westmont',
      state: 'IL',
      zip: '60559',
      latitude: 41.79,
      longitude: -87.98,
      remoteFriendly: true,
      servesNationwide: true,
      services: ['google-ads', 'paid-search'],
      updatedAt: new Date('2026-07-03T10:00:00.000Z'),
    };
  };

  prismaModule.prisma.inquiry = {
    count: async ({ where }) => {
      if (where.status === 'NEW') return 2;
      assert.deepEqual(where, { expertId: 'expert_stats_1' });
      return 5;
    },
  };

  prismaModule.prisma.conversation = {
    count: async ({ where }) => {
      assert.deepEqual(where, { expertId: 'expert_stats_1' });
      return 3;
    },
  };

  prismaModule.prisma.customerRequest = {
    aggregate: async ({ where }) => {
      assert.equal(where.status, 'ACTIVE');
      return {
        _count: { _all: 1 },
        _max: { updatedAt: new Date('2026-07-03T09:00:00.000Z') },
      };
    },
    findMany: async () => [
      {
        id: 'request_stats_1',
        title: 'Need Google Ads help',
        description: 'Looking for a paid search expert.',
        intakeMode: 'SPECIFIC',
        marketingSubjectId: 'paid-ads-lead-generation',
        serviceTokens: ['google-ads', 'paid-search'],
        zip: '60559',
        radiusMiles: null,
        budgetLabel: '$2k-$5k',
        timelineLabel: 'This month',
        status: 'ACTIVE',
        requesterName: 'Jamie Rivera',
        requesterBusinessName: 'Westmont Dental',
        createdAt: new Date('2026-07-03T09:00:00.000Z'),
        updatedAt: new Date('2026-07-03T09:00:00.000Z'),
      },
    ],
  };

  prismaModule.prisma.proposal = {
    findMany: async ({ where }) => {
      assert.equal(where.expertId, 'expert_stats_1');
      assert.deepEqual(where.requestId.in, ['request_stats_1']);
      return [
        {
          requestId: 'request_stats_1',
          status: 'PENDING',
        },
      ];
    },
  };

  geocodingModule.lookupZipLocation = async () => ({
    ok: true,
    city: 'Westmont',
    state: 'IL',
    zip: '60559',
    latitude: 41.79,
    longitude: -87.98,
    geocodedAt: new Date('2026-07-03T09:00:00.000Z'),
    geocodeProvider: 'geoapify',
  });

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/me/provider-stats',
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.stats, {
      inquiryCount: 5,
      newInquiryCount: 2,
      matchedRequestCount: 1,
      needsProposalCount: 0,
      pendingProposalCount: 1,
      acceptedProposalCount: 0,
      conversationCount: 3,
    });
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.expert.findFirst = originalFindFirstExpert;
    prismaModule.prisma.inquiry = originalInquiry;
    prismaModule.prisma.conversation = originalConversation;
    prismaModule.prisma.customerRequest = originalCustomerRequest;
    prismaModule.prisma.proposal = originalProposal;
    geocodingModule.lookupZipLocation = originalLookupZipLocation;
    await fastify.close();
  }
});
