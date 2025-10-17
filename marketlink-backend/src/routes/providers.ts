import type { FastifyPluginAsync } from 'fastify';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { ProviderStatus } from '@prisma/client';

const providersRoutes: FastifyPluginAsync = async (fastify) => {
  // LIST: GET /providers
  fastify.get('/providers', async (req, reply) => {
    const { name, city, service, minRating, verified } = (req.query || {}) as {
      name?: string;
      city?: string;
      service?: string; // e.g. "seo" or "seo,ads"
      minRating?: string; // e.g. "4.5"
      verified?: string; // "1" | "true"
    };

    const andFilters: Prisma.ProviderWhereInput[] = [];

    // City prefix match (case-insensitive)
    if (city && city.trim()) {
      andFilters.push({ city: { startsWith: city.trim(), mode: 'insensitive' } });
    }

    // Business name contains (case-insensitive)
    if (name && name.trim()) {
      andFilters.push({ businessName: { contains: name.trim(), mode: 'insensitive' } });
    }

    // Services: TEXT[] column (has / hasSome)
    if (service && service.trim()) {
      const tokens = service
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      if (tokens.length === 1) {
        andFilters.push({ services: { has: tokens[0] } });
      } else if (tokens.length > 1) {
        andFilters.push({ services: { hasSome: tokens } });
        // Use hasEvery if you need ALL selected services instead:
        // andFilters.push({ services: { hasEvery: tokens } });
      }
    }

    if (minRating && !Number.isNaN(parseFloat(minRating))) {
      andFilters.push({ rating: { gte: parseFloat(minRating) } });
    }

    if (verified && (verified === '1' || verified.toLowerCase() === 'true')) {
      andFilters.push({ verified: true });
    }

    // Force only active providers in public list
    const baseFilter: Prisma.ProviderWhereInput = { status: ProviderStatus.active };

    const where: Prisma.ProviderWhereInput = andFilters.length ? { AND: [...andFilters, baseFilter] } : baseFilter;

    fastify.log.info({ q: { name, city, service, minRating, verified }, where }, 'providers.query');

    const providers = await prisma.provider.findMany({
      where,
      orderBy: [{ businessName: 'asc' }],
      take: 50,
    });

    fastify.log.info({ count: providers.length }, 'providers.result');
    return providers;
  });

  // DETAIL: GET /providers/:slug
  fastify.get('/providers/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };

    // Public path: only ACTIVE providers are visible
    const active = await prisma.provider.findFirst({
      where: { slug, status: ProviderStatus.active },
      select: {
        id: true,
        slug: true,
        businessName: true,
        email: true,
        tagline: true,
        city: true,
        state: true,
        zip: true,
        services: true,
        rating: true,
        verified: true,
        logo: true,
        status: true, // included for owner banner logic (harmless for active)
        disabledReason: true, // included for owner banner logic (harmless for active)
        createdAt: true,
        updatedAt: true,
      },
    });
    if (active) return reply.send(active);

    // Not active (pending/disabled) — only the OWNER may view
    const nonActive = await prisma.provider.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        businessName: true,
        email: true,
        tagline: true,
        city: true,
        state: true,
        zip: true,
        services: true,
        rating: true,
        verified: true,
        logo: true,
        status: true,
        disabledReason: true,
        createdAt: true,
        updatedAt: true,
        userId: true, // for ownership check
      },
    });
    if (!nonActive) {
      reply.code(404).send({ error: 'Not found' });
      return;
    }

    const user = await getUserFromRequest(fastify, req);
    if (!user || user.id !== nonActive.userId) {
      // Mask existence for non-owners
      reply.code(404).send({ error: 'Not found' });
      return;
    }

    // Owner can view; strip userId before sending
    const { userId, ...ownerVisible } = nonActive;
    return reply.send(ownerVisible);
  });

  // CREATE: POST /providers (owner = logged-in user)
  fastify.post('/providers', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    // One profile per user (current rule)
    const existing = await prisma.provider.findFirst({ where: { userId: user.id } });
    if (existing) return reply.code(409).send({ error: 'You already have a provider profile.' });

    const body = (req.body || {}) as {
      businessName?: string;
      city?: string;
      state?: string;
      zip?: string;
      services?: string[] | string;
      tagline?: string;
      logo?: string;
    };

    const businessName = (body.businessName || '').trim();
    const city = (body.city || '').trim();
    const state = (body.state || '').trim();
    const zip = (body.zip || '').trim() || null;
    const tagline = (body.tagline || '').trim() || null;
    const logo = (body.logo || '').trim() || null;

    if (!businessName) return reply.code(400).send({ error: 'businessName is required' });
    if (!city) return reply.code(400).send({ error: 'city is required' });
    if (!state) return reply.code(400).send({ error: 'state is required' });
    if (state.length < 2) return reply.code(400).send({ error: 'state must be at least 2 characters' });

    // Normalize services
    let services: string[] = [];
    if (Array.isArray(body.services)) {
      services = body.services.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    } else if (typeof body.services === 'string') {
      services = body.services
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    // Generate unique slug from businessName
    const slugify = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const base = slugify(businessName) || `provider-${Date.now()}`;
    let slug = base;
    let i = 2;
    while (await prisma.provider.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    try {
      const provider = await prisma.provider.create({
        data: {
          userId: user.id,
          email: user.email, // unique contact email for owner
          businessName,
          slug,
          tagline,
          city,
          state,
          zip: zip || undefined,
          services,
          logo: logo || undefined,
        },
        select: {
          id: true,
          slug: true,
          businessName: true,
          city: true,
          state: true,
          services: true,
        },
      });
      return reply.code(201).send({ ok: true, provider });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return reply.code(409).send({ error: 'A provider with this email or slug already exists.' });
      }
      req.log.error({ err: e }, 'create-provider.failed');
      return reply.code(500).send({ error: 'Failed to create provider' });
    }
  });

  // UPDATE: PUT /providers (owner-only)
  fastify.put('/providers', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    const provider = await prisma.provider.findFirst({ where: { userId: user.id } });
    if (!provider) return reply.code(404).send({ error: "You don't have a provider profile yet." });

    const body = (req.body || {}) as {
      businessName?: string;
      city?: string;
      state?: string;
      zip?: string;
      services?: string[] | string;
      tagline?: string;
      logo?: string;
    };

    const data: Prisma.ProviderUpdateInput = {};

    if (typeof body.businessName === 'string') {
      const v = body.businessName.trim();
      if (!v) return reply.code(400).send({ error: 'businessName cannot be empty' });
      data.businessName = v;
    }
    if (typeof body.city === 'string') {
      const v = body.city.trim();
      if (!v) return reply.code(400).send({ error: 'city cannot be empty' });
      data.city = v;
    }
    if (typeof body.state === 'string') {
      const v = body.state.trim();
      if (!v) return reply.code(400).send({ error: 'state cannot be empty' });
      data.state = v;
    }
    if (typeof body.zip === 'string') {
      const v = body.zip.trim();
      (data as any).zip = v || null;
    }
    if (typeof body.tagline === 'string') {
      const v = body.tagline.trim();
      (data as any).tagline = v || null;
    }
    if (typeof body.logo === 'string') {
      const v = body.logo.trim();
      (data as any).logo = v || null;
    }
    if (Array.isArray(body.services)) {
      (data as any).services = body.services.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    } else if (typeof body.services === 'string') {
      (data as any).services = body.services
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }

    try {
      const updated = await prisma.provider.update({
        where: { id: provider.id },
        data,
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
        },
      });
      return reply.send({ ok: true, provider: updated });
    } catch (e: any) {
      req.log.error({ err: e }, 'update-provider.failed');
      return reply.code(500).send({ error: 'Failed to update provider' });
    }
  });
};

export default providersRoutes;
