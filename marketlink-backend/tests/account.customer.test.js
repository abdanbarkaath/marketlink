require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');

const sessionModule = require('../src/lib/session');
const prismaModule = require('../src/lib/prisma');
const accountRoutes = require('../src/routes/account').default;

test('GET /me/summary returns customer profile for customer users', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(accountRoutes);

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalFindFirstExpert = prismaModule.prisma.expert.findFirst;
  const originalCustomerProfile = prismaModule.prisma.customerProfile;

  sessionModule.getUserFromRequest = async () => ({
    id: 'user_customer_1',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.expert.findFirst = async () => null;
  prismaModule.prisma.customerProfile = {
    findUnique: async () => ({
      id: 'customer_profile_1',
      name: 'Jamie Rivera',
      businessName: 'Westmont Dental',
    }),
  };

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/me/summary',
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.equal(body.user.role, 'customer');
    assert.deepEqual(body.customer, {
      id: 'customer_profile_1',
      name: 'Jamie Rivera',
      businessName: 'Westmont Dental',
    });
    assert.equal(body.expert, null);
    assert.equal(body.provider, null);
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.expert.findFirst = originalFindFirstExpert;
    prismaModule.prisma.customerProfile = originalCustomerProfile;
    await fastify.close();
  }
});

test('PUT /me/customer-profile upserts the customer profile for customer users', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(accountRoutes);

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalCustomerProfile = prismaModule.prisma.customerProfile;

  sessionModule.getUserFromRequest = async () => ({
    id: 'user_customer_2',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.customerProfile = {
    upsert: async ({ create, update }) => ({
      id: 'customer_profile_2',
      name: update.name || create.name,
      businessName: update.businessName || create.businessName,
    }),
  };

  try {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/me/customer-profile',
      payload: {
        name: 'Jamie Rivera',
        businessName: 'Westmont Dental',
      },
    });

    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.customer, {
      id: 'customer_profile_2',
      name: 'Jamie Rivera',
      businessName: 'Westmont Dental',
    });
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.customerProfile = originalCustomerProfile;
    await fastify.close();
  }
});
