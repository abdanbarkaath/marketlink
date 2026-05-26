import type { FastifyPluginAsync } from 'fastify';
import { CustomerRequestStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';

const ZIP_RE = /^\d{5}$/;

function asCleanString(input: unknown) {
  return String(input || '').trim();
}

function asServiceTokens(input: unknown) {
  if (!Array.isArray(input)) return [];

  return Array.from(
    new Set(
      input
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

const requestsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/requests', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can create requests.' });

    const body = (req.body || {}) as {
      title?: unknown;
      description?: unknown;
      marketingSubjectId?: unknown;
      serviceTokens?: unknown;
      zip?: unknown;
      budgetLabel?: unknown;
      timelineLabel?: unknown;
    };

    const title = asCleanString(body.title);
    const description = asCleanString(body.description);
    const marketingSubjectId = asCleanString(body.marketingSubjectId);
    const serviceTokens = asServiceTokens(body.serviceTokens);
    const zip = asCleanString(body.zip);
    const budgetLabel = asCleanString(body.budgetLabel) || null;
    const timelineLabel = asCleanString(body.timelineLabel) || null;

    if (!title) return reply.code(400).send({ ok: false, error: 'title is required' });
    if (!description) return reply.code(400).send({ ok: false, error: 'description is required' });
    if (!marketingSubjectId) return reply.code(400).send({ ok: false, error: 'marketingSubjectId is required' });
    if (serviceTokens.length === 0) return reply.code(400).send({ ok: false, error: 'serviceTokens must include at least one item' });
    if (!zip || !ZIP_RE.test(zip)) return reply.code(400).send({ ok: false, error: 'zip must be a valid 5-digit ZIP code' });

    if (title.length > 140) return reply.code(400).send({ ok: false, error: 'title is too long' });
    if (description.length > 4000) return reply.code(400).send({ ok: false, error: 'description is too long' });
    if (marketingSubjectId.length > 80) return reply.code(400).send({ ok: false, error: 'marketingSubjectId is too long' });
    if (serviceTokens.length > 12) return reply.code(400).send({ ok: false, error: 'serviceTokens cannot exceed 12 items' });
    if (serviceTokens.some((token) => token.length > 80)) return reply.code(400).send({ ok: false, error: 'serviceTokens contains an item that is too long' });
    if (budgetLabel && budgetLabel.length > 80) return reply.code(400).send({ ok: false, error: 'budgetLabel is too long' });
    if (timelineLabel && timelineLabel.length > 80) return reply.code(400).send({ ok: false, error: 'timelineLabel is too long' });

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        businessName: true,
      },
    });

    if (!customerProfile?.name?.trim()) {
      return reply.code(400).send({ ok: false, error: 'Complete your customer profile before creating a request.' });
    }

    const created = await prisma.customerRequest.create({
      data: {
        customerUserId: user.id,
        customerProfileId: customerProfile.id,
        requesterName: customerProfile.name.trim(),
        requesterBusinessName: customerProfile.businessName?.trim() || null,
        title,
        description,
        marketingSubjectId,
        serviceTokens,
        zip,
        budgetLabel,
        timelineLabel,
        status: CustomerRequestStatus.ACTIVE,
      },
      select: {
        id: true,
        customerUserId: true,
        customerProfileId: true,
        requesterName: true,
        requesterBusinessName: true,
        title: true,
        description: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        budgetLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    req.log.info({ requestId: created.id, customerUserId: user.id }, 'customer-request.created');
    return reply.code(201).send({ ok: true, request: created });
  });

  fastify.get('/requests', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can view requests.' });

    const rows = await prisma.customerRequest.findMany({
      where: { customerUserId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 100,
    });

    return reply.send({ ok: true, data: rows });
  });

  fastify.get('/requests/:id', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can view requests.' });

    const { id } = (req.params || {}) as { id?: string };
    if (!id) return reply.code(400).send({ ok: false, error: 'Missing request id' });

    const request = await prisma.customerRequest.findFirst({
      where: {
        id,
        customerUserId: user.id,
      },
      select: {
        id: true,
        requesterName: true,
        requesterBusinessName: true,
        title: true,
        description: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        budgetLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!request) return reply.code(404).send({ ok: false, error: 'Request not found' });

    return reply.send({ ok: true, request });
  });
};

export default requestsRoutes;
