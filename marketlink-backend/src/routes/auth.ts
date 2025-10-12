import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { WEB_BASE, createMagicToken, consumeMagicToken, createSessionForUser, setSessionCookie, getUserFromRequest } from '../lib/session';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/magic-link
   * Body: { email }
   *
   * Current policy: issue links **only for existing users** (invite/pay-gated).
   * We still return 200 `{ ok: true }` for unknown emails to avoid enumeration.
   * To switch to self-serve signup during dev, replace findUnique with upsert.
   */
  fastify.post('/auth/magic-link', async (req, reply) => {
    const { email } = (req.body || {}) as { email?: string };

    // Always respond 200 to avoid account enumeration
    const SAFE_OK = () => reply.send({ ok: true });

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return SAFE_OK();
    }

    // Allow only existing users (invite/pay-gated)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Dev note: if you want self-signup, use:
      // await prisma.user.upsert({ where: { email }, update: {}, create: { email, role: 'provider' } });
      return SAFE_OK();
    }

    // Create one-time token and log verify URL (email delivery comes later)
    const { token, expiresAt } = createMagicToken(email);
    const verifyUrl = `${WEB_BASE}/login/verify?token=${token}`;
    fastify.log.info({ email, verifyUrl, expiresAt }, 'magic-link.dev');

    return SAFE_OK();
  });

  /**
   * POST /auth/verify
   * Body: { token }
   * - Consumes magic token, creates session, sets signed httpOnly cookie.
   */
  fastify.post('/auth/verify', async (req, reply) => {
    const { token } = (req.body || {}) as { token?: string };
    if (!token) return reply.code(400).send({ error: 'Missing token' });

    const consumed = consumeMagicToken(token);
    if (!consumed) return reply.code(400).send({ error: 'Invalid or expired token' });

    const user = await prisma.user.findUnique({ where: { email: consumed.email } });
    if (!user) return reply.code(400).send({ error: 'User not found' });

    const { sessionToken } = createSessionForUser(user.id);
    setSessionCookie(reply, sessionToken);

    return reply.send({ ok: true });
  });

  /**
   * GET /auth/me
   * - Returns the logged-in user from the signed session cookie.
   */
  fastify.get('/auth/me', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
  });
};

export default authRoutes;
