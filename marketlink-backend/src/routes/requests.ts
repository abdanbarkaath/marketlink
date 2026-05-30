import type { FastifyPluginAsync } from 'fastify';
import { CustomerRequestStatus, ExpertStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { lookupZipLocation } from '../lib/geocoding';

const ZIP_RE = /^\d{5}$/;

type RequestMatchReason = 'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly';

type DeliveryPreviewInput = {
  id: string;
  serviceTokens: string[];
  zip: string;
};

type ProviderExpertForMatching = {
  id: string;
  slug: string;
  businessName: string;
  city: string;
  state: string;
  zip: string | null;
  remoteFriendly: boolean;
  servesNationwide: boolean;
  services: string[];
  verified: boolean;
  rating: number;
};

type RequestForProviderMatching = {
  id: string;
  title: string;
  description: string;
  marketingSubjectId: string;
  serviceTokens: string[];
  zip: string;
  budgetLabel: string | null;
  timelineLabel: string | null;
  status: CustomerRequestStatus;
  requesterName: string;
  requesterBusinessName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

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

function normalizeCity(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function normalizeState(value: string | null | undefined) {
  return String(value || '').trim().toUpperCase();
}

function getReasonWeight(reason: RequestMatchReason) {
  if (reason === 'same_zip') return 400;
  if (reason === 'same_city') return 300;
  if (reason === 'serves_nationwide') return 200;
  return 100;
}

function canTransitionRequestStatus(current: CustomerRequestStatus, next: CustomerRequestStatus) {
  if (current === next) return true;
  if (current === CustomerRequestStatus.ACTIVE && (next === CustomerRequestStatus.CLOSED || next === CustomerRequestStatus.CANCELLED)) return true;
  if (current === CustomerRequestStatus.CLOSED && next === CustomerRequestStatus.ACTIVE) return true;
  return false;
}

async function buildProviderMatchForRequest(expert: ProviderExpertForMatching, request: RequestForProviderMatching) {
  const matchedServiceTokens = expert.services.filter((token) => request.serviceTokens.includes(token));
  if (!matchedServiceTokens.length) return null;

  const locationLookup = await lookupZipLocation({ zip: request.zip });
  const requestCity = locationLookup.ok ? locationLookup.city : null;
  const requestState = locationLookup.ok ? locationLookup.state : null;
  const requestZip = locationLookup.ok ? locationLookup.zip : request.zip;

  const sameZip = Boolean(expert.zip && expert.zip.trim() === requestZip);
  const sameCity =
    Boolean(requestCity && requestState) &&
    normalizeCity(expert.city) === normalizeCity(requestCity) &&
    normalizeState(expert.state) === normalizeState(requestState);

  const reasons: RequestMatchReason[] = [];
  if (sameZip) reasons.push('same_zip');
  else if (sameCity) reasons.push('same_city');
  else if (expert.servesNationwide) reasons.push('serves_nationwide');
  else if (expert.remoteFriendly) reasons.push('remote_friendly');

  if (!reasons.length) return null;

  return {
    primaryReason: reasons[0],
    reasons,
    matchedServiceTokens,
    requestLocation: {
      zip: requestZip,
      city: requestCity,
      state: requestState,
      source: locationLookup.ok ? 'zip_lookup' : 'zip_only',
    },
  };
}

async function buildDeliveryPreview(input: DeliveryPreviewInput) {
  const locationLookup = await lookupZipLocation({ zip: input.zip });
  const requestCity = locationLookup.ok ? locationLookup.city : null;
  const requestState = locationLookup.ok ? locationLookup.state : null;
  const requestZip = locationLookup.ok ? locationLookup.zip : input.zip;

  const experts = await prisma.expert.findMany({
    where: {
      status: ExpertStatus.active,
      services: { hasSome: input.serviceTokens },
    },
    select: {
      id: true,
      slug: true,
      businessName: true,
      city: true,
      state: true,
      zip: true,
      remoteFriendly: true,
      servesNationwide: true,
      services: true,
      verified: true,
      rating: true,
    },
    take: 200,
  });

  const matches = experts
    .map((expert) => {
      const matchedServiceTokens = expert.services.filter((token) => input.serviceTokens.includes(token));
      if (!matchedServiceTokens.length) return null;

      const sameZip = Boolean(expert.zip && expert.zip.trim() === requestZip);
      const sameCity =
        Boolean(requestCity && requestState) &&
        normalizeCity(expert.city) === normalizeCity(requestCity) &&
        normalizeState(expert.state) === normalizeState(requestState);

      const reasons: RequestMatchReason[] = [];
      if (sameZip) reasons.push('same_zip');
      else if (sameCity) reasons.push('same_city');
      else if (expert.servesNationwide) reasons.push('serves_nationwide');
      else if (expert.remoteFriendly) reasons.push('remote_friendly');

      if (!reasons.length) return null;

      const primaryReason = reasons[0];
      return {
        id: expert.id,
        slug: expert.slug,
        businessName: expert.businessName,
        city: expert.city,
        state: expert.state,
        zip: expert.zip,
        verified: expert.verified,
        rating: expert.rating,
        remoteFriendly: expert.remoteFriendly,
        servesNationwide: expert.servesNationwide,
        matchedServiceTokens,
        primaryReason,
        reasons,
        score: getReasonWeight(primaryReason) + matchedServiceTokens.length,
      };
    })
    .filter((match): match is NonNullable<typeof match> => Boolean(match))
    .sort((a, b) => b.score - a.score || b.rating - a.rating || a.businessName.localeCompare(b.businessName));

  return {
    requestId: input.id,
    matchingModel: 'city-zip-service-v1',
    requestLocation: {
      zip: requestZip,
      city: requestCity,
      state: requestState,
      source: locationLookup.ok ? 'zip_lookup' : 'zip_only',
    },
    notes: [
      'MVP matching uses service tags plus same ZIP, same city, nationwide coverage, or remote-friendly service area.',
      ...(locationLookup.ok ? [] : ['ZIP lookup was unavailable, so locality matching fell back to ZIP-only checks.']),
    ],
    totalMatches: matches.length,
    matchedExperts: matches.map(({ score, ...match }) => match),
  };
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
    const deliveryPreview = await buildDeliveryPreview({
      id: created.id,
      serviceTokens: created.serviceTokens,
      zip: created.zip,
    });

    return reply.code(201).send({ ok: true, request: created, deliveryPreview });
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

    const deliveryPreview = await buildDeliveryPreview({
      id: request.id,
      serviceTokens: request.serviceTokens,
      zip: request.zip,
    });

    return reply.send({ ok: true, request, deliveryPreview });
  });

  fastify.patch('/requests/:id', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can update requests.' });

    const { id } = (req.params || {}) as { id?: string };
    const body = (req.body || {}) as { status?: CustomerRequestStatus | string };
    const nextStatus = String(body.status || '')
      .trim()
      .toUpperCase() as CustomerRequestStatus;

    if (!id) return reply.code(400).send({ ok: false, error: 'Missing request id' });
    if (!Object.values(CustomerRequestStatus).includes(nextStatus)) {
      return reply.code(400).send({ ok: false, error: 'status must be ACTIVE, CLOSED, or CANCELLED' });
    }

    const existing = await prisma.customerRequest.findFirst({
      where: {
        id,
        customerUserId: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) return reply.code(404).send({ ok: false, error: 'Request not found' });

    if (!canTransitionRequestStatus(existing.status, nextStatus)) {
      return reply.code(409).send({
        ok: false,
        error: `This request cannot move from ${existing.status} to ${nextStatus}.`,
      });
    }

    const updated = await prisma.customerRequest.update({
      where: { id },
      data: { status: nextStatus },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    req.log.info({ requestId: updated.id, status: updated.status, customerUserId: user.id }, 'customer-request.updated');
    return reply.send({ ok: true, request: updated });
  });

  fastify.get('/provider/requests', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'provider') return reply.code(403).send({ error: 'Only providers can view matched requests.' });

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        businessName: true,
        city: true,
        state: true,
        zip: true,
        remoteFriendly: true,
        servesNationwide: true,
        services: true,
        verified: true,
        rating: true,
      },
    });

    if (!expert) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const requests = await prisma.customerRequest.findMany({
      where: { status: CustomerRequestStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        budgetLabel: true,
        timelineLabel: true,
        status: true,
        requesterName: true,
        requesterBusinessName: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 100,
    });

    const matches = [];
    for (const request of requests) {
      const match = await buildProviderMatchForRequest(expert, request);
      if (!match) continue;

      matches.push({
        id: request.id,
        title: request.title,
        marketingSubjectId: request.marketingSubjectId,
        zip: request.zip,
        budgetLabel: request.budgetLabel,
        timelineLabel: request.timelineLabel,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        primaryReason: match.primaryReason,
        reasons: match.reasons,
        matchedServiceTokens: match.matchedServiceTokens,
      });
    }

    return reply.send({ ok: true, data: matches });
  });

  fastify.get('/provider/requests/:id', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'provider') return reply.code(403).send({ error: 'Only providers can view matched requests.' });

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        businessName: true,
        city: true,
        state: true,
        zip: true,
        remoteFriendly: true,
        servesNationwide: true,
        services: true,
        verified: true,
        rating: true,
      },
    });

    if (!expert) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const { id } = (req.params || {}) as { id?: string };
    if (!id) return reply.code(400).send({ ok: false, error: 'Missing request id' });

    const request = await prisma.customerRequest.findFirst({
      where: {
        id,
        status: CustomerRequestStatus.ACTIVE,
      },
      select: {
        id: true,
        title: true,
        description: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        budgetLabel: true,
        timelineLabel: true,
        status: true,
        requesterName: true,
        requesterBusinessName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!request) return reply.code(404).send({ ok: false, error: 'Request not found' });

    const match = await buildProviderMatchForRequest(expert, request);
    if (!match) return reply.code(404).send({ ok: false, error: 'Request not found' });

    return reply.send({
      ok: true,
      request,
      match: {
        primaryReason: match.primaryReason,
        reasons: match.reasons,
        matchedServiceTokens: match.matchedServiceTokens,
        requestLocation: match.requestLocation,
      },
    });
  });
};

export default requestsRoutes;
