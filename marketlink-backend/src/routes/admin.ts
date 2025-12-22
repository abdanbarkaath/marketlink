import type { FastifyPluginAsync } from 'fastify';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { ProviderStatus, InquiryStatus } from '@prisma/client';

const requireAdmin = async (fastify: any, req: any) => {
  const user = await getUserFromRequest(fastify, req);
  if (!user) return { ok: false as const, code: 401 as const, error: 'Not authenticated' };
  if (user.role !== 'admin') return { ok: false as const, code: 403 as const, error: 'Forbidden' };
  return { ok: true as const, user };
};

const parseLimit = (raw: unknown, fallback = 20) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.trunc(n)));
};

const parsePage = (raw: unknown, fallback = 1) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.trunc(n));
};

const asProviderStatus = (v?: string): ProviderStatus | undefined => {
  if (!v) return undefined;
  const s = String(v) as ProviderStatus;
  return Object.values(ProviderStatus).includes(s) ? s : undefined;
};

const adminProviderRowSelect = {
  id: true,
  slug: true,
  businessName: true,
  email: true,
  city: true,
  state: true,
  status: true,
  verified: true,
  disabledReason: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProviderSelect;

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /admin/stats
   * { pendingCount, activeCount, disabledCount, inquiriesNewCount }
   */
  fastify.get('/admin/stats', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const [pendingCount, activeCount, disabledCount, inquiriesNewCount] = await Promise.all([
      prisma.provider.count({ where: { status: ProviderStatus.pending } }),
      prisma.provider.count({ where: { status: ProviderStatus.active } }),
      prisma.provider.count({ where: { status: ProviderStatus.disabled } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
    ]);

    return reply.send({
      pendingCount,
      activeCount,
      disabledCount,
      inquiriesNewCount,
    });
  });

  /**
   * GET /admin/providers?status=pending|active|disabled&page=1&limit=20&query=...
   */
  fastify.get('/admin/providers', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const { status, page, limit, query } = (req.query || {}) as {
      status?: string;
      page?: string;
      limit?: string;
      query?: string;
    };

    const statusVal = status ? asProviderStatus(status) : ProviderStatus.pending;
    if (status && !statusVal) {
      return reply.code(400).send({ error: 'Invalid status filter. Use pending|active|disabled.' });
    }

    const take = parseLimit(limit, 20);
    const pageNum = parsePage(page, 1);
    const skip = (pageNum - 1) * take;

    const q = (query || '').trim();

    const where: Prisma.ProviderWhereInput = {
      status: statusVal,
      ...(q
        ? {
            OR: [{ businessName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.provider.count({ where }),
      prisma.provider.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take,
        select: adminProviderRowSelect,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / take));

    return reply.send({
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages,
        status: statusVal,
        query: q || undefined,
      },
      data: rows,
    });
  });

  /**
   * PATCH /admin/providers/:id
   * body: { status?: "active"|"disabled"|"pending", disabledReason?: string|null, verified?: boolean }
   *
   * Rules:
   * - If status = disabled => disabledReason required (non-empty)
   * - If status != disabled => clear disabledReason
   * - If disabledReason provided without status => only allowed if currently disabled
   */
  fastify.patch('/admin/providers/:id', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const { id } = req.params as { id: string };
    const body = (req.body || {}) as {
      status?: 'active' | 'disabled' | 'pending';
      disabledReason?: string | null;
      verified?: boolean;
    };

    const data: Prisma.ProviderUpdateInput = {};

    // status change (optional)
    if (typeof body.status !== 'undefined') {
      const next = asProviderStatus(body.status);
      if (!next) return reply.code(400).send({ error: 'Invalid status value.' });

      (data as any).status = next;

      if (next === ProviderStatus.disabled) {
        const reason = String(body.disabledReason || '').trim();
        if (!reason) {
          return reply.code(400).send({ error: 'disabledReason is required when disabling a provider.' });
        }
        (data as any).disabledReason = reason;
      } else {
        (data as any).disabledReason = null;
      }
    } else if (typeof body.disabledReason !== 'undefined') {
      // disabledReason without status change: only allowed if currently disabled
      const existing = await prisma.provider.findUnique({ where: { id }, select: { status: true } });
      if (!existing) return reply.code(404).send({ error: 'Provider not found' });

      if (existing.status !== ProviderStatus.disabled) {
        return reply.code(400).send({ error: 'disabledReason can only be set when status is disabled. Provide status="disabled".' });
      }

      const reason = String(body.disabledReason || '').trim() || null;
      (data as any).disabledReason = reason;
    }

    // verified toggle (optional)
    if (typeof body.verified !== 'undefined') {
      (data as any).verified = Boolean(body.verified);
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }

    try {
      const updated = await prisma.provider.update({
        where: { id },
        data,
        select: adminProviderRowSelect,
      });
      return reply.send({ ok: true, provider: updated });
    } catch (e: any) {
      req.log.error({ err: e }, 'admin.patch-provider.failed');
      return reply.code(500).send({ error: 'Failed to update provider' });
    }
  });
};

export default adminRoutes;
