import type { FastifyPluginAsync } from 'fastify';
import { getUserFromRequest } from '../lib/session';
import { prisma } from '../lib/prisma';

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /me  → basic identity (id, email, role)
  fastify.get('/me', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
  });

  // GET /me/summary → user + owned provider (if any)
  fastify.get('/me/summary', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    const provider = await prisma.provider.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        businessName: true,
        city: true,
        state: true,
        zip: true,
        tagline: true,
        logo: true,
        services: true,
        status: true,
        disabledReason: true,
      },
    });

    return {
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
      provider,
    };
  });
};

export default accountRoutes;
