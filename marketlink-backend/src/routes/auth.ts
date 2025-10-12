import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { WEB_BASE, createMagicToken, consumeMagicToken, createSessionForUser, setSessionCookie, getUserFromRequest, clearSessionCookie, sessionStore } from '../lib/session';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/magic-link
   * Rate limited: 5 requests / 60s per IP
   */
  fastify.route({
    method: 'POST',
    url: '/auth/magic-link',
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '60 seconds',
      },
    },
    handler: async (req, reply) => {
      const { email } = (req.body || {}) as { email?: string };

      // Always respond 200 to avoid account enumeration
      const SAFE_OK = () => reply.send({ ok: true });

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return SAFE_OK();
      }

      // Invite/pay-gated: only existing users get a valid link
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return SAFE_OK();

      // Create one-time token and log verify URL (email delivery comes later)
      const { token, expiresAt } = createMagicToken(email);
      const verifyUrl = `${WEB_BASE}/login/verify?token=${token}`;
      fastify.log.info({ email, verifyUrl, expiresAt }, 'magic-link.dev');

      return SAFE_OK();
    },
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

  /**
   * POST /auth/logout
   * - Clears the session cookie and invalidates the server-side session.
   */
  fastify.post('/auth/logout', async (req, reply) => {
    const raw = (req.cookies as any)?.session;
    if (raw) {
      const { valid, value } = fastify.unsignCookie(raw);
      if (valid) {
        sessionStore.delete(value); // invalidate server-side session
      }
    }
    clearSessionCookie(reply); // remove cookie on client
    return reply.send({ ok: true });
  });
};

export default authRoutes;
