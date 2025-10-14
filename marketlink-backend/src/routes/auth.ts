import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { WEB_BASE, createMagicToken, consumeMagicToken, createSessionForUser, setSessionCookie, getUserFromRequest, deleteCurrentSession } from '../lib/session';
import { sendMagicLinkEmail } from '../lib/mailer';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/magic-link
   * Rate limited: 5 requests / 60s per IP
   * (invite-only for now)
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

      // Create one-time token and log verify URL (email delivery)
      const { token, expiresAt } = createMagicToken(email);
      const verifyUrl = `${WEB_BASE}/login/verify?token=${token}`;

      await sendMagicLinkEmail(email, verifyUrl);
      fastify.log.info({ email, verifyUrl, expiresAt }, 'magic-link.dev');

      return SAFE_OK();
    },
  });

  /**
   * POST /auth/verify
   * Body: { token }
   * - Consumes magic token, creates DB session, sets signed httpOnly cookie.
   */
  fastify.post('/auth/verify', async (req, reply) => {
    const { token } = (req.body || {}) as { token?: string };
    if (!token) return reply.code(400).send({ error: 'Missing token' });

    const consumed = consumeMagicToken(token);
    if (!consumed) return reply.code(400).send({ error: 'Invalid or expired token' });

    const user = await prisma.user.findUnique({ where: { email: consumed.email } });
    if (!user) return reply.code(400).send({ error: 'User not found' });

    const { sessionToken } = await createSessionForUser(user.id); // DB-backed
    setSessionCookie(reply, sessionToken); // signed httpOnly cookie

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
   * - Deletes the current DB session and clears the cookie.
   */
  fastify.post('/auth/logout', async (req, reply) => {
    await deleteCurrentSession(fastify, req, reply);
    return reply.send({ ok: true });
  });
};

export default authRoutes;
