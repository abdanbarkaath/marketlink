import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { ExpertStatus, InquiryStatus } from '@prisma/client';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const inquiriesRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /inquiries (public)
   * Body: { expertSlug?, providerSlug?, name, email, phone?, message }
   */
  fastify.post('/inquiries', async (req, reply) => {
    const body = (req.body || {}) as {
      expertSlug?: string;
      providerSlug?: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    const expertSlug = String(body.expertSlug || body.providerSlug || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const message = String(body.message || '').trim();

    if (!expertSlug) return reply.code(400).send({ ok: false, error: 'expertSlug is required' });
    if (!name) return reply.code(400).send({ ok: false, error: 'name is required' });
    if (!email || !isEmail(email)) return reply.code(400).send({ ok: false, error: 'valid email is required' });
    if (!message) return reply.code(400).send({ ok: false, error: 'message is required' });

    // basic length guards
    if (name.length > 100) return reply.code(400).send({ ok: false, error: 'name is too long' });
    if (email.length > 200) return reply.code(400).send({ ok: false, error: 'email is too long' });
    if (phone && phone.length > 40) return reply.code(400).send({ ok: false, error: 'phone is too long' });
    if (message.length > 2000) return reply.code(400).send({ ok: false, error: 'message is too long' });

    // Only allow inquiries to ACTIVE experts (matches public listing rules)
    const expert = await prisma.expert.findFirst({
      where: { slug: expertSlug, status: ExpertStatus.active },
      select: { id: true },
    });

    if (!expert) return reply.code(404).send({ ok: false, error: 'Expert not found' });

    try {
      const created = await prisma.inquiry.create({
        data: {
          expertId: expert.id,
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
   * Lists inquiries for the expert owned by the logged-in user
   */
  fastify.get('/inquiries', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!expert) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const rows = await prisma.inquiry.findMany({
      where: { expertId: expert.id },
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

  /**
   * PATCH /inquiries/:id (owner-only)
   * Body: { status: "READ" | "ARCHIVED" }
   */
  fastify.patch('/inquiries/:id', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    const { id } = (req.params || {}) as { id?: string };
    const body = (req.body || {}) as { status?: InquiryStatus | string };

    const nextStatus = String(body.status || '')
      .trim()
      .toUpperCase();

    if (!id) return reply.code(400).send({ ok: false, error: 'Missing inquiry id' });
    if (!['NEW', 'READ', 'ARCHIVED'].includes(nextStatus)) {
      return reply.code(400).send({ ok: false, error: 'status must be NEW, READ, or ARCHIVED' });
    }

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!expert) return reply.code(404).send({ ok: false, error: "You don't have an expert profile yet." });

    const existing = await prisma.inquiry.findFirst({
      where: { id, expertId: expert.id },
      select: { id: true, status: true },
    });

    if (!existing) return reply.code(404).send({ ok: false, error: 'Inquiry not found' });

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status: nextStatus as InquiryStatus },
      select: { id: true, status: true, createdAt: true },
    });

    req.log.info({ inquiryId: updated.id, status: updated.status }, 'inquiry.updated');
    return reply.send({ ok: true, inquiry: updated });
  });
};

export default inquiriesRoutes;
