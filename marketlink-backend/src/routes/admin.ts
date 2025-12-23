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

const normalizeSlug = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeServices = (services: unknown): string[] | undefined => {
  if (typeof services === 'undefined') return undefined;
  if (!Array.isArray(services)) return undefined;
  const cleaned = services
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 50);
  // de-dupe
  return Array.from(new Set(cleaned));
};

const adminProviderRowSelect = {
  id: true,
  slug: true,
  businessName: true,
  email: true,
  city: true,
  state: true,
  zip: true,
  tagline: true,
  logo: true,
  services: true,
  notes: true,
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
   * { pendingCount, activeCount, disabledCount, inquiriesNewCount, verifiedCount }
   */
  fastify.get('/admin/stats', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const [pendingCount, activeCount, disabledCount, inquiriesNewCount, verifiedCount] = await Promise.all([
      prisma.provider.count({ where: { status: ProviderStatus.pending } }),
      prisma.provider.count({ where: { status: ProviderStatus.active } }),
      prisma.provider.count({ where: { status: ProviderStatus.disabled } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
      prisma.provider.count({ where: { verified: true } }),
    ]);

    return reply.send({
      pendingCount,
      activeCount,
      disabledCount,
      inquiriesNewCount,
      verifiedCount,
    });
  });

  /**
   * GET /admin/providers
   * Supports:
   *  - status= (optional; if omitted => all)
   *  - query= (optional)
   *  - verified=true|false (optional)
   *  - page, limit
   */
  fastify.get('/admin/providers', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const { status, page, limit, query, verified } = (req.query || {}) as {
      status?: string;
      page?: string;
      limit?: string;
      query?: string;
      verified?: string;
    };

    const statusVal = status ? asProviderStatus(status) : undefined;
    if (status && !statusVal) {
      return reply.code(400).send({ error: 'Invalid status filter. Use pending|active|disabled.' });
    }

    const verifiedVal = typeof verified === 'string' && verified !== '' ? verified === 'true' : undefined;

    const take = parseLimit(limit, 20);
    const pageNum = parsePage(page, 1);
    const skip = (pageNum - 1) * take;

    const q = (query || '').trim();

    const where: Prisma.ProviderWhereInput = {
      ...(typeof statusVal !== 'undefined' ? { status: statusVal } : {}),
      ...(typeof verifiedVal !== 'undefined' ? { verified: verifiedVal } : {}),
      ...(q
        ? {
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
              { state: { contains: q, mode: 'insensitive' } },
              { tagline: { contains: q, mode: 'insensitive' } },
              { notes: { contains: q, mode: 'insensitive' } },
            ],
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
        verified: typeof verifiedVal !== 'undefined' ? verifiedVal : undefined,
      },
      data: rows,
    });
  });

  /**
   * GET /admin/providers/:id
   */
  fastify.get('/admin/providers/:id', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const { id } = req.params as { id: string };
    const provider = await prisma.provider.findUnique({
      where: { id },
      select: adminProviderRowSelect,
    });

    if (!provider) return reply.code(404).send({ error: 'Provider not found' });

    return reply.send({ ok: true, provider });
  });

  /**
   * PATCH /admin/providers/:id
   * Now supports admin edits for:
   *  - status, disabledReason, verified
   *  - businessName, email, slug, city, state, zip, tagline, logo, services, notes
   */
  fastify.patch('/admin/providers/:id', async (req, reply) => {
    const gate = await requireAdmin(fastify, req);
    if (!gate.ok) return reply.code(gate.code).send({ error: gate.error });

    const { id } = req.params as { id: string };
    const body = (req.body || {}) as {
      status?: 'active' | 'disabled' | 'pending';
      disabledReason?: string | null;
      verified?: boolean;

      businessName?: string;
      email?: string;
      slug?: string;
      city?: string;
      state?: string;
      zip?: string | null;
      tagline?: string | null;
      logo?: string | null;
      services?: string[];
      notes?: string | null;
    };

    const data: Prisma.ProviderUpdateInput = {};

    // ---- editable text fields ----
    if (typeof body.businessName !== 'undefined') {
      const v = String(body.businessName).trim();
      if (!v) return reply.code(400).send({ error: 'businessName cannot be empty.' });
      (data as any).businessName = v;
    }

    if (typeof body.email !== 'undefined') {
      const v = String(body.email).trim().toLowerCase();
      if (!isValidEmail(v)) return reply.code(400).send({ error: 'Invalid email.' });
      (data as any).email = v;
    }

    if (typeof body.slug !== 'undefined') {
      const v = normalizeSlug(String(body.slug));
      if (!v) return reply.code(400).send({ error: 'slug cannot be empty.' });
      (data as any).slug = v;
    }

    if (typeof body.city !== 'undefined') {
      const v = String(body.city).trim();
      if (!v) return reply.code(400).send({ error: 'city cannot be empty.' });
      (data as any).city = v;
    }

    if (typeof body.state !== 'undefined') {
      const v = String(body.state).trim();
      if (!v) return reply.code(400).send({ error: 'state cannot be empty.' });
      (data as any).state = v;
    }

    if (typeof body.zip !== 'undefined') {
      const v = String(body.zip ?? '').trim();
      (data as any).zip = v ? v : null;
    }

    if (typeof body.tagline !== 'undefined') {
      const v = String(body.tagline ?? '').trim();
      (data as any).tagline = v ? v : null;
    }

    if (typeof body.logo !== 'undefined') {
      const v = String(body.logo ?? '').trim();
      (data as any).logo = v ? v : null;
    }

    if (typeof body.notes !== 'undefined') {
      const v = String(body.notes ?? '').trim();
      (data as any).notes = v ? v : null;
    }

    if (typeof body.services !== 'undefined') {
      const cleaned = normalizeServices(body.services);
      if (!cleaned) return reply.code(400).send({ error: 'services must be an array of strings.' });
      (data as any).services = cleaned;
    }

    // ---- status + disabledReason rules ----
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
      // Unique constraint errors (email / slug)
      if (e?.code === 'P2002') {
        const target = Array.isArray(e?.meta?.target) ? e.meta.target.join(', ') : 'unique field';
        return reply.code(409).send({ error: `Duplicate value for ${target}.` });
      }

      req.log.error({ err: e }, 'admin.patch-provider.failed');
      return reply.code(500).send({ error: 'Failed to update provider' });
    }
  });
};

export default adminRoutes;
