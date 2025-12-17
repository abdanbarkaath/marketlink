import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { createSessionForUser, setSessionCookie, getUserFromRequest, deleteCurrentSession } from '../lib/session';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/login
   * Body: { email, password }
   * - Validates credentials, creates DB session, sets signed httpOnly cookie.
   */
  fastify.post('/auth/login', async (req, reply) => {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };

    const cleanEmail = String(email || '')
      .trim()
      .toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
      return reply.code(400).send({ ok: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        mustChangePassword: true,
        isDisabled: true,
      },
    });

    // Avoid user enumeration
    if (!user || !user.passwordHash) {
      return reply.code(401).send({ ok: false, message: 'Invalid email or password.' });
    }

    if (user.isDisabled) {
      return reply.code(403).send({ ok: false, message: 'Account disabled.' });
    }

    const ok = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!ok) {
      return reply.code(401).send({ ok: false, message: 'Invalid email or password.' });
    }

    const { sessionToken, expiresAt } = await createSessionForUser(user.id);
    setSessionCookie(reply, sessionToken);

    return reply.send({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      expiresAt,
    });
  });

  /**
   * GET /auth/me
   * - Returns the logged-in user from the signed session cookie.
   */
  fastify.get('/auth/me', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        // include if your getUserFromRequest returns these fields
        mustChangePassword: (user as any).mustChangePassword,
        isDisabled: (user as any).isDisabled,
      },
    };
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
