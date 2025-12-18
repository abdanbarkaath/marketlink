import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { ProviderStatus } from '@prisma/client';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const inquiriesRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /inquiries (public)
   * Body: { providerSlug, name, email, phone?, message }
   */
  fastify.post('/inquiries', async (req, reply) => {
    const body = (req.body || {}) as {
      providerSlug?: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };
    const providerSlug = String(body.providerSlug || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const message = String(body.message || '').trim();

    if (!providerSlug) return reply.code(400).send({ ok: false, error: 'providerSlug is required' });
    if (!name) return reply.code(400).send({ ok: false, error: 'name is required' });
    if (!email || !isEmail(email)) return reply.code(400).send({ ok: false, error: 'valid email is required' });
    if (!message) return reply.code(400).send({ ok: false, error: 'message is required' });

    // basic length guards
    if (name.length > 100) return reply.code(400).send({ ok: false, error: 'name is too long' });
    if (email.length > 200) return reply.code(400).send({ ok: false, error: 'email is too long' });
    if (phone && phone.length > 40) return reply.code(400).send({ ok: false, error: 'phone is too long' });
    if (message.length > 2000) return reply.code(400).send({ ok: false, error: 'message is too long' });

    // Only allow inquiries to ACTIVE providers (matches public listing rules)
    const provider = await prisma.provider.findFirst({
      where: { slug: providerSlug, status: ProviderStatus.active },
      select: { id: true },
    });

    if (!provider) return reply.code(404).send({ ok: false, error: 'Provider not found' });
    try {
      const created = await prisma.inquiry.create({
        data: {
          providerId: provider.id,
          name,
          email,
          phone: phone || undefined,
          message,
        },
        select: { id: true, createdAt: true },
      });

      req.log.info({ inquiryId: created.id }, 'inquiry.created');
      return reply.code(201).send({ ok: true, inquiry: created });
    } catch (err) {
      req.log.error({ err }, 'inquiry.create_failed');
      return reply.code(500).send({ ok: false, error: 'Failed to create inquiry' });
    }
  });

  /**
   * GET /inquiries (owner-only)
   * Lists inquiries for the provider owned by the logged-in user
   */
  fastify.get('/inquiries', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    const provider = await prisma.provider.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!provider) return reply.code(404).send({ error: "You don't have a provider profile yet." });

    const rows = await prisma.inquiry.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });

    return reply.send({ ok: true, data: rows });
  });
};

export default inquiriesRoutes;
