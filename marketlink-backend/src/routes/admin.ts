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
   */
  fastify.get('/admin/stats', {
    schema: {
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            providers: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                pending: { type: 'number' },
                disabled: { type: 'number' },
                verified: { type: 'number' },
              },
              required: ['total', 'active', 'pending', 'disabled', 'verified'],
            },
          },
          required: ['ok', 'providers'],
        },
      },
    },
    handler: async (req, reply) => {
      const admin = await requireAdmin(fastify, req, reply);
      if (!admin) return;

      const [total, pending, disabled, verified] = await Promise.all([
        prisma.provider.count(),
        prisma.provider.count({ where: { status: ProviderStatus.pending } }),
        prisma.provider.count({ where: { status: ProviderStatus.disabled } }),
        prisma.provider.count({ where: { verified: true } }),
      ]);
      const active = total - pending - disabled;

      reply.send({ ok: true, providers: { total, active, pending, disabled, verified } });
    },
  });

  /**
   * GET /admin/providers?q=&status=&verified=&limit=&offset=
   */
  fastify.get('/admin/providers', {
    schema: {
      tags: ['admin'],
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'active', 'disabled'] },
          verified: { type: 'string', enum: ['true', 'false'] },
          limit: { type: 'string', pattern: '^\\d{1,3}$' }, // keep as string; we parse
          offset: { type: 'string', pattern: '^\\d{1,6}$' },
        },
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            count: { type: 'number' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  businessName: { type: 'string' },
                  email: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  verified: { type: 'boolean' },
                  status: { type: 'string', enum: ['pending', 'active', 'disabled'] },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  slug: { type: 'string' },
                  rating: { type: 'number' },
                  services: { type: 'array', items: { type: 'string' } },
                },
                required: ['id', 'businessName', 'email', 'city', 'state', 'verified', 'status', 'slug', 'createdAt', 'updatedAt', 'rating', 'services'],
              },
            },
          },
          required: ['ok', 'count', 'items'],
        },
      },
    },
    handler: async (req, reply) => {
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

      reply.send({ ok: true, count, items });
    },
  });

  /**
   * POST /admin/providers/:id/approve  -> status = active
   */
  fastify.post('/admin/providers/:id/approve', {
    schema: {
      tags: ['admin'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 10 } },
        required: ['id'],
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            provider: {
              type: 'object',
              properties: { id: { type: 'string' }, status: { type: 'string', enum: ['pending', 'active', 'disabled'] } },
              required: ['id', 'status'],
            },
          },
          required: ['ok', 'provider'],
        },
      },
    },
    handler: async (req, reply) => {
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

      reply.send({ ok: true, provider: { id: updated.id, status: updated.status } });
    },
  });

  /**
   * POST /admin/providers/:id/verify  Body { value?: boolean } ; if omitted -> toggle
   */
  fastify.post('/admin/providers/:id/verify', {
    schema: {
      tags: ['admin'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 10 } },
        required: ['id'],
        additionalProperties: false,
      },
      body: {
        type: 'object',
        properties: { value: { type: 'boolean' } },
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            provider: {
              type: 'object',
              properties: { id: { type: 'string' }, verified: { type: 'boolean' } },
              required: ['id', 'verified'],
            },
          },
          required: ['ok', 'provider'],
        },
      },
    },
    handler: async (req, reply) => {
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

      reply.send({ ok: true, provider: { id: updated.id, verified: updated.verified } });
    },
  });

  /**
   * POST /admin/providers/:id/disable  Body { reason?: string }
   */
  fastify.post('/admin/providers/:id/disable', {
    schema: {
      tags: ['admin'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 10 } },
        required: ['id'],
        additionalProperties: false,
      },
      body: {
        type: 'object',
        properties: { reason: { type: 'string', minLength: 0, maxLength: 200 } },
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            provider: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'active', 'disabled'] },
                disabledReason: { type: ['string', 'null'] },
              },
              required: ['id', 'status', 'disabledReason'],
            },
          },
          required: ['ok', 'provider'],
        },
      },
    },
    handler: async (req, reply) => {
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

      reply.send({
        ok: true,
        provider: { id: updated.id, status: updated.status, disabledReason: updated.disabledReason },
      });
    },
  });

  /**
   * POST /admin/providers/:id/enable
   */
  fastify.post('/admin/providers/:id/enable', {
    schema: {
      tags: ['admin'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', minLength: 10 } },
        required: ['id'],
        additionalProperties: false,
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            provider: {
              type: 'object',
              properties: { id: { type: 'string' }, status: { type: 'string', enum: ['pending', 'active', 'disabled'] } },
              required: ['id', 'status'],
            },
          },
          required: ['ok', 'provider'],
        },
      },
    },
    handler: async (req, reply) => {
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

      reply.send({ ok: true, provider: { id: updated.id, status: updated.status } });
    },
  });
};

export default adminRoutes;
