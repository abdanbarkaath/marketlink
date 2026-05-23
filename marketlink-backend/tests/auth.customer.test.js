require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');

const prismaModule = require('../src/lib/prisma');
const sessionModule = require('../src/lib/session');
const authRoutes = require('../src/routes/auth').default;

test('POST /auth/signup creates a customer account and session', async () => {
  const fastify = Fastify();
  await fastify.register(cookie, { secret: 'test-secret' });
  await fastify.register(authRoutes);

  const originalFindUnique = prismaModule.prisma.user.findUnique;
  const originalCreate = prismaModule.prisma.user.create;
  const originalCreateSessionForUser = sessionModule.createSessionForUser;
  const originalSetSessionCookie = sessionModule.setSessionCookie;

  let cookieToken = null;

  prismaModule.prisma.user.findUnique = async () => null;
  prismaModule.prisma.user.create = async ({ data }) => ({
    id: 'user_customer_signup_1',
    email: data.email,
    role: data.role,
    mustChangePassword: data.mustChangePassword,
  });
  sessionModule.createSessionForUser = async () => ({
    sessionToken: 'session_customer_signup_1',
    expiresAt: 123456789,
  });
  sessionModule.setSessionCookie = (reply, token) => {
    cookieToken = token;
    reply.header('set-cookie', `session=${token}`);
  };

  try {
    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        name: 'Jamie Rivera',
        email: 'customer@example.com',
        password: 'password123',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(body.user.role, 'customer');
    assert.equal(body.user.mustChangePassword, false);
    assert.equal(cookieToken, 'session_customer_signup_1');
  } finally {
    prismaModule.prisma.user.findUnique = originalFindUnique;
    prismaModule.prisma.user.create = originalCreate;
    sessionModule.createSessionForUser = originalCreateSessionForUser;
    sessionModule.setSessionCookie = originalSetSessionCookie;
    await fastify.close();
  }
});
