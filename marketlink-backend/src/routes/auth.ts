import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { WEB_BASE, createMagicToken, consumeMagicToken, createSessionForUser, setSessionCookie, getUserFromRequest, deleteCurrentSession } from '../lib/session';
import { sendMagicLinkEmail } from '../lib/mailer';

// Auth mode: invite (prod default) | selfserve (dev)
type AuthMode = 'invite' | 'selfserve';
const AUTH_MODE: AuthMode = (process.env.AUTH_MODE?.toLowerCase() as AuthMode) === 'selfserve' ? 'selfserve' : 'invite';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/magic-link
   * Rate limited: 5 requests / 60s per IP
   * - invite: only existing users get a link (prevents enumeration; SAFE_OK always)
   * - selfserve: upsert user, then send link (still SAFE_OK)
   */
  fastify.route({
    method: 'POST',
    url: '/auth/magic-link',
    config: { rateLimit: { max: 5, timeWindow: '60 seconds' } },
    handler: async (req, reply) => {
      const { email } = (req.body || {}) as { email?: string };
      const SAFE_OK = () => reply.send({ ok: true });

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return SAFE_OK();

      if (AUTH_MODE === 'invite') {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          fastify.log.info({ email, authMode: AUTH_MODE }, 'magic-link.invite.unknown');
          return SAFE_OK();
        }
        const { token, expiresAt } = createMagicToken(email);
        const verifyUrl = `${WEB_BASE}/login/verify?token=${token}`;
        try {
          await sendMagicLinkEmail(email, verifyUrl);
        } catch (err) {
          req.log.error({ err }, 'magic-link email send failed');
        }
        fastify.log.info({ email, verifyUrl, expiresAt, authMode: AUTH_MODE }, 'magic-link.invite.sent');
        return SAFE_OK();
      }

      // selfserve: create if missing, then send
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
      });
      const { token, expiresAt } = createMagicToken(user.email);
      const verifyUrl = `${WEB_BASE}/login/verify?token=${token}`;
      try {
        await sendMagicLinkEmail(user.email, verifyUrl);
      } catch (err) {
        req.log.error({ err }, 'magic-link email send failed');
      }
      fastify.log.info({ email: user.email, verifyUrl, expiresAt, authMode: AUTH_MODE }, 'magic-link.selfserve.sent');
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

    const { sessionToken, expiresAt } = await createSessionForUser(user.id); // DB-backed
    setSessionCookie(reply, sessionToken); // signed httpOnly cookie

    return reply.send({ ok: true, user: { id: user.id, email: user.email, role: user.role }, expiresAt });
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
