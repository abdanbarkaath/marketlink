require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');
const bcrypt = require('bcryptjs');

const prismaModule = require('../src/lib/prisma');
const sessionModule = require('../src/lib/session');
const authRoutes = require('../src/routes/auth').default;

for (const role of ['provider', 'admin']) {
  test(`POST /auth/login preserves ${role} role in the auth response`, async () => {
    const fastify = Fastify();
    await fastify.register(cookie, { secret: 'test-secret' });
    await fastify.register(authRoutes);

    const originalFindUnique = prismaModule.prisma.user.findUnique;
    const originalCreateSessionForUser = sessionModule.createSessionForUser;
    const originalSetSessionCookie = sessionModule.setSessionCookie;

    let cookieToken = null;
    const passwordHash = await bcrypt.hash('password123', 10);

    prismaModule.prisma.user.findUnique = async () => ({
      id: `${role}_user_1`,
      email: `${role}@example.com`,
      role,
      passwordHash,
      mustChangePassword: role === 'provider',
      isDisabled: false,
    });

    sessionModule.createSessionForUser = async () => ({
      sessionToken: `session_${role}_1`,
      expiresAt: 123456789,
    });

    sessionModule.setSessionCookie = (reply, token) => {
      cookieToken = token;
      reply.header('set-cookie', `session=${token}`);
    };

    try {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: `${role}@example.com`,
          password: 'password123',
        },
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.ok, true);
      assert.equal(body.user.role, role);
      assert.equal(cookieToken, `session_${role}_1`);
    } finally {
      prismaModule.prisma.user.findUnique = originalFindUnique;
      sessionModule.createSessionForUser = originalCreateSessionForUser;
      sessionModule.setSessionCookie = originalSetSessionCookie;
      await fastify.close();
    }
  });
}
