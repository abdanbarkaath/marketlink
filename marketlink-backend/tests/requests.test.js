require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');

const sessionModule = require('../src/lib/session');
const prismaModule = require('../src/lib/prisma');
const requestsRoutes = require('../src/routes/requests').default;

function buildFastify() {
  const fastify = Fastify();
  return fastify.register(cookie, { secret: 'test-secret' }).then(() => fastify.register(requestsRoutes)).then(() => fastify);
}

test('POST /requests rejects non-customer users', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  sessionModule.getUserFromRequest = async () => ({
    id: 'provider_user_1',
    email: 'provider@example.com',
    role: 'provider',
  });

  try {
    const response = await fastify.inject({
      method: 'POST',
      url: '/requests',
      payload: {
        title: 'Need more local leads',
        description: 'Looking for help with paid ads and landing pages.',
        marketingSubjectId: 'paid-ads-lead-generation',
        serviceTokens: ['paid-ads', 'google-ads'],
        zip: '60559',
      },
    });

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error, 'Only customers can create requests.');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    await fastify.close();
  }
});

test('POST /requests validates required request fields', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalCustomerProfile = prismaModule.prisma.customerProfile;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_1',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.customerProfile = {
    findUnique: async () => ({
      id: 'customer_profile_1',
      name: 'Jamie Rivera',
      businessName: 'Westmont Dental',
    }),
  };

  try {
    const response = await fastify.inject({
      method: 'POST',
      url: '/requests',
      payload: {
        title: '',
        description: '',
        marketingSubjectId: '',
        serviceTokens: [],
        zip: '6055',
      },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error, 'title is required');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.customerProfile = originalCustomerProfile;
    await fastify.close();
  }
});

test('POST /requests creates a customer request for the signed-in customer', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalCustomerProfile = prismaModule.prisma.customerProfile;
  const originalCustomerRequest = prismaModule.prisma.customerRequest;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_2',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.customerProfile = {
    findUnique: async () => ({
      id: 'customer_profile_2',
      name: 'Jamie Rivera',
      businessName: 'Westmont Dental',
    }),
  };

  prismaModule.prisma.customerRequest = {
    create: async ({ data }) => ({
      id: 'request_1',
      customerUserId: data.customerUserId,
      customerProfileId: data.customerProfileId,
      requesterName: data.requesterName,
      requesterBusinessName: data.requesterBusinessName,
      title: data.title,
      description: data.description,
      marketingSubjectId: data.marketingSubjectId,
      serviceTokens: data.serviceTokens,
      zip: data.zip,
      budgetLabel: data.budgetLabel,
      timelineLabel: data.timelineLabel,
      status: data.status,
      createdAt: new Date('2026-05-25T15:00:00.000Z'),
      updatedAt: new Date('2026-05-25T15:00:00.000Z'),
    }),
  };

  try {
    const response = await fastify.inject({
      method: 'POST',
      url: '/requests',
      payload: {
        title: 'Need help launching local Google Ads',
        description: 'Need a local specialist to set up search campaigns for a dental office.',
        marketingSubjectId: 'paid-ads-lead-generation',
        serviceTokens: ['paid-ads', 'google-ads', 'lead-generation'],
        zip: '60559',
        budgetLabel: '$2k-$5k',
        timelineLabel: 'This month',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(body.request.id, 'request_1');
    assert.equal(body.request.requesterName, 'Jamie Rivera');
    assert.equal(body.request.requesterBusinessName, 'Westmont Dental');
    assert.equal(body.request.status, 'ACTIVE');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.customerProfile = originalCustomerProfile;
    prismaModule.prisma.customerRequest = originalCustomerRequest;
    await fastify.close();
  }
});

test('GET /requests lists only the signed-in customer requests', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalCustomerRequest = prismaModule.prisma.customerRequest;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_3',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.customerRequest = {
    findMany: async ({ where }) => {
      assert.equal(where.customerUserId, 'customer_user_3');
      return [
        {
          id: 'request_2',
          title: 'Need local SEO help',
          marketingSubjectId: 'local-search-seo',
          serviceTokens: ['seo', 'local-seo'],
          zip: '60601',
          status: 'ACTIVE',
          createdAt: new Date('2026-05-24T15:00:00.000Z'),
          updatedAt: new Date('2026-05-24T15:00:00.000Z'),
        },
      ];
    },
  };

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/requests',
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].id, 'request_2');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.customerRequest = originalCustomerRequest;
    await fastify.close();
  }
});

test('GET /requests/:id only returns a request owned by the signed-in customer', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalCustomerRequest = prismaModule.prisma.customerRequest;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_4',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.customerRequest = {
    findFirst: async ({ where }) => {
      assert.equal(where.id, 'request_3');
      assert.equal(where.customerUserId, 'customer_user_4');
      return {
        id: 'request_3',
        title: 'Need creator support for a restaurant launch',
        description: 'Looking for local creators who can visit and post.',
        marketingSubjectId: 'creator-influencer-marketing',
        serviceTokens: ['creator-marketing', 'local-influencer'],
        zip: '60614',
        budgetLabel: '$1k-$2k',
        timelineLabel: 'Next 30 days',
        status: 'ACTIVE',
        requesterName: 'Jamie Rivera',
        requesterBusinessName: 'Westmont Dental',
        createdAt: new Date('2026-05-23T15:00:00.000Z'),
        updatedAt: new Date('2026-05-23T15:00:00.000Z'),
      };
    },
  };

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/requests/request_3',
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(body.request.id, 'request_3');
    assert.equal(body.request.marketingSubjectId, 'creator-influencer-marketing');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.customerRequest = originalCustomerRequest;
    await fastify.close();
  }
});
