import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { AdminActionType, ProviderStatus } from '@prisma/client';

async function requireAdmin(fastify: any, req: FastifyRequest, reply: FastifyReply) {
  const user = await getUserFromRequest(fastify, req);
  if (!user) {
    reply.code(401).send({ error: 'Unauthorized' });
    return null;
  }
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden' });
    return null;
  }
  return user;
}

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /admin/stats
   * Basic provider counters for overview.
   */
  fastify.get('/admin/stats', async (req, reply) => {
    const admin = await requireAdmin(fastify, req, reply);
    if (!admin) return;

    const [total, pending, disabled, verified] = await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { status: ProviderStatus.pending } }),
      prisma.provider.count({ where: { status: ProviderStatus.disabled } }),
      prisma.provider.count({ where: { verified: true } }),
    ]);

    const active = total - pending - disabled;
    return reply.send({
      ok: true,
      providers: { total, active, pending, disabled, verified },
    });
  });

  /**
   * GET /admin/providers?q=&status=&verified=&limit=&offset=
   * List providers with simple filters for the admin table.
   */
  fastify.get('/admin/providers', async (req, reply) => {
    const admin = await requireAdmin(fastify, req, reply);
    if (!admin) return;

    const { q, status, verified, limit, offset } = (req.query ?? {}) as {
      q?: string;
      status?: string;
      verified?: string;
      limit?: string;
      offset?: string;
    };

    const where: any = {};
    if (q) {
      where.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status && ['pending', 'active', 'disabled'].includes(status)) {
      where.status = status as ProviderStatus;
    }
    if (verified === 'true') where.verified = true;
    if (verified === 'false') where.verified = false;

    const take = Math.min(Math.max(parseInt(limit || '50', 10), 1), 100);
    const skip = Math.max(parseInt(offset || '0', 10), 0);

    const [items, count] = await Promise.all([
      prisma.provider.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          businessName: true,
          email: true,
          city: true,
          state: true,
          verified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          slug: true,
          rating: true,
          services: true,
        },
      }),
      prisma.provider.count({ where }),
    ]);

    return reply.send({ ok: true, count, items });
  });

  /**
   * POST /admin/providers/:id/approve
   * -> status = active
   */
  fastify.post('/admin/providers/:id/approve', async (req, reply) => {
    const admin = await requireAdmin(fastify, req, reply);
    if (!admin) return;
    const { id } = req.params as { id: string };

    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    const updated = await prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.active },
    });

    await prisma.adminAction.create({
      data: {
        adminUserId: admin.id,
        providerId: id,
        type: AdminActionType.APPROVE,
        metadata: { from: provider.status, to: 'active' },
      },
    });

    return reply.send({ ok: true, provider: { id: updated.id, status: updated.status } });
  });

  /**
   * POST /admin/providers/:id/verify
   * Body { value?: boolean } ; if omitted -> toggle
   */
  fastify.post('/admin/providers/:id/verify', async (req, reply) => {
    const admin = await requireAdmin(fastify, req, reply);
    if (!admin) return;
    const { id } = req.params as { id: string };
    const { value } = (req.body ?? {}) as { value?: boolean };

    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    const next = typeof value === 'boolean' ? value : !provider.verified;
    const updated = await prisma.provider.update({
      where: { id },
      data: { verified: next },
    });

    await prisma.adminAction.create({
      data: {
        adminUserId: admin.id,
        providerId: id,
        type: next ? AdminActionType.VERIFY_ON : AdminActionType.VERIFY_OFF,
        metadata: { from: provider.verified, to: next },
      },
    });

    return reply.send({ ok: true, provider: { id: updated.id, verified: updated.verified } });
  });

  /**
   * POST /admin/providers/:id/disable
   * Body { reason?: string }
   */
  fastify.post('/admin/providers/:id/disable', async (req, reply) => {
    const admin = await requireAdmin(fastify, req, reply);
    if (!admin) return;
    const { id } = req.params as { id: string };
    const { reason } = (req.body ?? {}) as { reason?: string };

    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    const updated = await prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.disabled, disabledReason: reason || null },
    });

    await prisma.adminAction.create({
      data: {
        adminUserId: admin.id,
        providerId: id,
        type: AdminActionType.DISABLE,
        metadata: { reason: reason || null },
      },
    });

    return reply.send({
      ok: true,
      provider: { id: updated.id, status: updated.status, disabledReason: updated.disabledReason },
    });
  });

  /**
   * POST /admin/providers/:id/enable
   * -> status = active, clear disabledReason
   */
  fastify.post('/admin/providers/:id/enable', async (req, reply) => {
    const admin = await requireAdmin(fastify, req, reply);
    if (!admin) return;
    const { id } = req.params as { id: string };

    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    const updated = await prisma.provider.update({
      where: { id },
      data: { status: ProviderStatus.active, disabledReason: null },
    });

    await prisma.adminAction.create({
      data: {
        adminUserId: admin.id,
        providerId: id,
        type: AdminActionType.ENABLE,
      },
    });

    return reply.send({ ok: true, provider: { id: updated.id, status: updated.status } });
  });
};

export default adminRoutes;
