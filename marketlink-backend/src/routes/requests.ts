import type { FastifyPluginAsync } from 'fastify';
import { CustomerRequestIntakeMode, CustomerRequestStatus, ExpertStatus, ProposalStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getUserFromRequest } from '../lib/session';
import { lookupZipLocation } from '../lib/geocoding';

const ZIP_RE = /^\d{5}$/;
const MAX_REQUEST_SERVICE_TOKENS = 24;

type RequestMatchReason = 'within_radius' | 'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly';

type DeliveryPreviewInput = {
  id: string;
  intakeMode: CustomerRequestIntakeMode;
  serviceTokens: string[];
  zip: string | null;
  radiusMiles: number | null;
};

type ProviderExpertForMatching = {
  id: string;
  slug: string;
  businessName: string;
  city: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
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
  intakeMode: CustomerRequestIntakeMode;
  marketingSubjectId: string | null;
  serviceTokens: string[];
  zip: string | null;
  radiusMiles: number | null;
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

function asOptionalCleanString(input: unknown) {
  const value = asCleanString(input);
  return value || null;
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

function asRadiusMiles(input: unknown) {
  if (input === null || typeof input === 'undefined' || input === '') return null;
  const value = Number(input);
  if (!Number.isInteger(value)) return null;
  return value;
}

function inferIntakeMode(marketingSubjectId: string | null, serviceTokens: string[]) {
  if (marketingSubjectId || serviceTokens.length > 0) return CustomerRequestIntakeMode.SPECIFIC;
  return CustomerRequestIntakeMode.UNSURE;
}

function normalizeCity(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function normalizeState(value: string | null | undefined) {
  return String(value || '').trim().toUpperCase();
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMiles(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusMiles = 3958.7613;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusMiles * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getReasonWeight(reason: RequestMatchReason) {
  if (reason === 'within_radius') return 500;
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

function isCustomerProposalDecision(status: ProposalStatus) {
  return status === ProposalStatus.ACCEPTED || status === ProposalStatus.DECLINED;
}

async function buildProviderMatchForRequest(expert: ProviderExpertForMatching, request: RequestForProviderMatching) {
  if (!request.zip) return null;

  const locationLookup = await lookupZipLocation({ zip: request.zip });
  const requestCity = locationLookup.ok ? locationLookup.city : null;
  const requestState = locationLookup.ok ? locationLookup.state : null;
  const requestZip = locationLookup.ok ? locationLookup.zip : request.zip;

  if (request.intakeMode === CustomerRequestIntakeMode.UNSURE) {
    if (!locationLookup.ok || request.radiusMiles === null) return null;
    if (typeof expert.latitude !== 'number' || typeof expert.longitude !== 'number') return null;

    const distanceMiles = Number(
      haversineMiles(locationLookup.latitude, locationLookup.longitude, expert.latitude, expert.longitude).toFixed(1),
    );
    if (distanceMiles > request.radiusMiles) return null;

    return {
      primaryReason: 'within_radius' as const,
      reasons: ['within_radius' as const],
      matchedServiceTokens: [],
      distanceMiles,
      requestLocation: {
        zip: requestZip,
        city: requestCity,
        state: requestState,
        source: 'zip_lookup',
      },
    };
  }

  if (request.serviceTokens.length === 0) return null;

  const matchedServiceTokens = expert.services.filter((token) => request.serviceTokens.includes(token));
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
  if (!input.zip) return null;

  const locationLookup = await lookupZipLocation({ zip: input.zip });
  const requestCity = locationLookup.ok ? locationLookup.city : null;
  const requestState = locationLookup.ok ? locationLookup.state : null;
  const requestZip = locationLookup.ok ? locationLookup.zip : input.zip;

  if (input.intakeMode === CustomerRequestIntakeMode.UNSURE) {
    if (!locationLookup.ok || input.radiusMiles === null) return null;
    const radiusMiles = input.radiusMiles;

    const experts = await prisma.expert.findMany({
      where: {
        status: ExpertStatus.active,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        slug: true,
        businessName: true,
        city: true,
        state: true,
        zip: true,
        latitude: true,
        longitude: true,
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
        if (typeof expert.latitude !== 'number' || typeof expert.longitude !== 'number') return null;

        const distanceMiles = Number(
          haversineMiles(locationLookup.latitude, locationLookup.longitude, expert.latitude, expert.longitude).toFixed(1),
        );
        if (distanceMiles > radiusMiles) return null;

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
          matchedServiceTokens: [],
          primaryReason: 'within_radius' as const,
          reasons: ['within_radius' as const],
          distanceMiles,
        };
      })
      .filter((match): match is NonNullable<typeof match> => Boolean(match))
      .sort((a, b) => a.distanceMiles - b.distanceMiles || b.rating - a.rating || a.businessName.localeCompare(b.businessName));

    return {
      requestId: input.id,
      matchingModel: 'zip-radius-v1',
      requestLocation: {
        zip: requestZip,
        city: requestCity,
        state: requestState,
        source: 'zip_lookup',
      },
      notes: ['Unsure requests are delivered only to experts with saved coordinates inside the selected ZIP-centered radius.'],
      totalMatches: matches.length,
      matchedExperts: matches,
    };
  }

  if (input.serviceTokens.length === 0) return null;

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
      latitude: true,
      longitude: true,
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
      subcategoryId?: unknown;
      serviceTokens?: unknown;
      zip?: unknown;
      radiusMiles?: unknown;
      budgetLabel?: unknown;
      timelineLabel?: unknown;
    };

    const title = asCleanString(body.title);
    const description = asCleanString(body.description);
    const marketingSubjectId = asOptionalCleanString(body.marketingSubjectId);
    const subcategoryId = asOptionalCleanString(body.subcategoryId);
    const serviceTokens = asServiceTokens(body.serviceTokens);
    const zip = asOptionalCleanString(body.zip);
    const radiusMiles = asRadiusMiles(body.radiusMiles);
    const budgetLabel = asCleanString(body.budgetLabel) || null;
    const timelineLabel = asCleanString(body.timelineLabel) || null;
    const intakeMode = inferIntakeMode(marketingSubjectId, serviceTokens);

    if (!title) return reply.code(400).send({ ok: false, error: 'title is required' });
    if (!description) return reply.code(400).send({ ok: false, error: 'description is required' });

    if (intakeMode === CustomerRequestIntakeMode.SPECIFIC) {
      if (!marketingSubjectId) {
        return reply.code(400).send({ ok: false, error: 'marketingSubjectId is required when a specific marketing area is selected' });
      }

      if (serviceTokens.length === 0) {
        return reply.code(400).send({
          ok: false,
          error: 'serviceTokens must include at least one item when a specific marketing area is selected',
        });
      }
    } else {
      if (!zip) {
        return reply.code(400).send({ ok: false, error: 'zip is required when no marketing area is selected' });
      }

      if (!ZIP_RE.test(zip)) {
        return reply.code(400).send({ ok: false, error: 'zip must be a valid 5-digit ZIP code' });
      }

      if (radiusMiles === null) {
        return reply.code(400).send({ ok: false, error: 'radiusMiles is required when no marketing area is selected' });
      }

      if (radiusMiles < 1 || radiusMiles > 100) {
        return reply.code(400).send({ ok: false, error: 'radiusMiles must be between 1 and 100' });
      }

      const locationLookup = await lookupZipLocation({ zip });
      if (!locationLookup.ok) {
        return reply.code(400).send({ ok: false, error: 'We could not verify that ZIP code for an unsure request.' });
      }
    }

    if (title.length > 140) return reply.code(400).send({ ok: false, error: 'title is too long' });
    if (description.length > 4000) return reply.code(400).send({ ok: false, error: 'description is too long' });
    if (marketingSubjectId && marketingSubjectId.length > 80) return reply.code(400).send({ ok: false, error: 'marketingSubjectId is too long' });
    if (subcategoryId && subcategoryId.length > 80) return reply.code(400).send({ ok: false, error: 'subcategoryId is too long' });
    if (serviceTokens.length > MAX_REQUEST_SERVICE_TOKENS) {
      return reply.code(400).send({ ok: false, error: `serviceTokens cannot exceed ${MAX_REQUEST_SERVICE_TOKENS} items` });
    }
    if (serviceTokens.some((token) => token.length > 80)) return reply.code(400).send({ ok: false, error: 'serviceTokens contains an item that is too long' });
    if (zip && !ZIP_RE.test(zip)) return reply.code(400).send({ ok: false, error: 'zip must be a valid 5-digit ZIP code' });
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
        intakeMode,
        marketingSubjectId,
        subcategoryId,
        serviceTokens,
        zip,
        radiusMiles,
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
        intakeMode: true,
        marketingSubjectId: true,
        subcategoryId: true,
        serviceTokens: true,
        zip: true,
        radiusMiles: true,
        budgetLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    req.log.info({ requestId: created.id, customerUserId: user.id }, 'customer-request.created');
    const deliveryPreview =
      created.zip
        ? await buildDeliveryPreview({
            id: created.id,
            intakeMode: created.intakeMode,
            serviceTokens: created.serviceTokens,
            zip: created.zip,
            radiusMiles: created.radiusMiles,
          })
        : null;

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
        intakeMode: true,
        marketingSubjectId: true,
        subcategoryId: true,
        serviceTokens: true,
        zip: true,
        radiusMiles: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        proposals: {
          select: {
            status: true,
          },
        },
      },
      take: 100,
    });

    const data = rows.map(({ proposals, ...request }) => ({
      ...request,
      proposalSummary: {
        total: proposals.length,
        pending: proposals.filter((proposal) => proposal.status === ProposalStatus.PENDING).length,
        accepted: proposals.filter((proposal) => proposal.status === ProposalStatus.ACCEPTED).length,
        declined: proposals.filter((proposal) => proposal.status === ProposalStatus.DECLINED).length,
      },
    }));

    return reply.send({ ok: true, data });
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
        intakeMode: true,
        marketingSubjectId: true,
        subcategoryId: true,
        serviceTokens: true,
        zip: true,
        radiusMiles: true,
        budgetLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!request) return reply.code(404).send({ ok: false, error: 'Request not found' });

    const deliveryPreview =
      request.zip
        ? await buildDeliveryPreview({
            id: request.id,
            intakeMode: request.intakeMode,
            serviceTokens: request.serviceTokens,
            zip: request.zip,
            radiusMiles: request.radiusMiles,
          })
        : null;

    const proposals = await prisma.proposal.findMany({
      where: { requestId: request.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        requestId: true,
        expertId: true,
        message: true,
        priceLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        expert: {
          select: {
            id: true,
            slug: true,
            businessName: true,
            expertType: true,
            city: true,
            state: true,
            verified: true,
            rating: true,
          },
        },
      },
    });

    return reply.send({ ok: true, request, deliveryPreview, proposals });
  });

  fastify.get('/proposals', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can view proposals.' });

    const proposals = await prisma.proposal.findMany({
      where: {
        request: {
          customerUserId: user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        requestId: true,
        expertId: true,
        message: true,
        priceLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        request: {
          select: {
            id: true,
            title: true,
            marketingSubjectId: true,
            status: true,
          },
        },
        expert: {
          select: {
            id: true,
            slug: true,
            businessName: true,
            expertType: true,
            city: true,
            state: true,
            verified: true,
            rating: true,
          },
        },
      },
      take: 100,
    });

    return reply.send({ ok: true, data: proposals });
  });

  fastify.patch('/proposals/:id', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can update proposals.' });

    const { id } = (req.params || {}) as { id?: string };
    const body = (req.body || {}) as { status?: ProposalStatus | string };
    const nextStatus = String(body.status || '')
      .trim()
      .toUpperCase() as ProposalStatus;

    if (!id) return reply.code(400).send({ ok: false, error: 'Missing proposal id' });
    if (!Object.values(ProposalStatus).includes(nextStatus) || !isCustomerProposalDecision(nextStatus)) {
      return reply.code(400).send({ ok: false, error: 'status must be ACCEPTED or DECLINED' });
    }

    const existing = await prisma.proposal.findFirst({
      where: {
        id,
        request: {
          customerUserId: user.id,
        },
      },
      select: {
        id: true,
        requestId: true,
        request: {
          select: {
            customerUserId: true,
          },
        },
        status: true,
      },
    });

    if (!existing) return reply.code(404).send({ ok: false, error: 'Proposal not found' });

    if (existing.status !== ProposalStatus.PENDING) {
      return reply.code(409).send({ ok: false, error: `This proposal cannot move from ${existing.status} to ${nextStatus}.` });
    }

    const { updated, conversation } = await prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id },
        data: { status: nextStatus },
        select: {
          id: true,
          requestId: true,
          expertId: true,
          message: true,
          priceLabel: true,
          timelineLabel: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (nextStatus !== ProposalStatus.ACCEPTED) {
        return { updated, conversation: null };
      }

      await tx.proposal.updateMany({
        where: {
          requestId: existing.requestId,
          id: { not: updated.id },
          status: ProposalStatus.PENDING,
        },
        data: { status: ProposalStatus.DECLINED },
      });

      const conversation = await tx.conversation.upsert({
        where: { proposalId: updated.id },
        update: {},
        create: {
          proposalId: updated.id,
          requestId: updated.requestId,
          customerUserId: existing.request.customerUserId,
          expertId: updated.expertId,
        },
        select: {
          id: true,
          proposalId: true,
          requestId: true,
          customerUserId: true,
          expertId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { updated, conversation };
    });

    req.log.info({ proposalId: updated.id, requestId: updated.requestId, status: updated.status, customerUserId: user.id }, 'proposal.updated');
    return reply.send({ ok: true, proposal: updated, conversation });
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
        latitude: true,
        longitude: true,
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
        intakeMode: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        radiusMiles: true,
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
        intakeMode: request.intakeMode,
        marketingSubjectId: request.marketingSubjectId,
        zip: request.zip,
        radiusMiles: request.radiusMiles,
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

    const proposals = matches.length
      ? await prisma.proposal.findMany({
          where: {
            expertId: expert.id,
            requestId: {
              in: matches.map((request) => request.id),
            },
          },
          select: {
            requestId: true,
            status: true,
          },
        })
      : [];
    const proposalStatusByRequestId = new Map(proposals.map((proposal) => [proposal.requestId, proposal.status]));

    return reply.send({
      ok: true,
      data: matches.map((request) => ({
        ...request,
        proposalStatus: proposalStatusByRequestId.get(request.id) || null,
      })),
    });
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
        latitude: true,
        longitude: true,
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
        intakeMode: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        radiusMiles: true,
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

    const proposal = await prisma.proposal.findUnique({
      where: {
        requestId_expertId: {
          requestId: request.id,
          expertId: expert.id,
        },
      },
      select: {
        id: true,
        requestId: true,
        expertId: true,
        message: true,
        priceLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send({
      ok: true,
      request,
      match: {
        primaryReason: match.primaryReason,
        reasons: match.reasons,
        matchedServiceTokens: match.matchedServiceTokens,
        requestLocation: match.requestLocation,
      },
      proposal,
    });
  });

  fastify.post('/provider/requests/:id/proposals', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'provider') return reply.code(403).send({ error: 'Only providers can create proposals.' });

    const { id } = (req.params || {}) as { id?: string };
    const body = (req.body || {}) as {
      message?: unknown;
      priceLabel?: unknown;
      timelineLabel?: unknown;
    };

    const message = asCleanString(body.message);
    const priceLabel = asCleanString(body.priceLabel) || null;
    const timelineLabel = asCleanString(body.timelineLabel) || null;

    if (!id) return reply.code(400).send({ ok: false, error: 'Missing request id' });
    if (!message) return reply.code(400).send({ ok: false, error: 'message is required' });
    if (message.length > 4000) return reply.code(400).send({ ok: false, error: 'message is too long' });
    if (priceLabel && priceLabel.length > 80) return reply.code(400).send({ ok: false, error: 'priceLabel is too long' });
    if (timelineLabel && timelineLabel.length > 80) return reply.code(400).send({ ok: false, error: 'timelineLabel is too long' });

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        businessName: true,
        city: true,
        state: true,
        zip: true,
        latitude: true,
        longitude: true,
        remoteFriendly: true,
        servesNationwide: true,
        services: true,
        verified: true,
        rating: true,
      },
    });

    if (!expert) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const request = await prisma.customerRequest.findFirst({
      where: {
        id,
        status: CustomerRequestStatus.ACTIVE,
      },
      select: {
        id: true,
        title: true,
        description: true,
        intakeMode: true,
        marketingSubjectId: true,
        serviceTokens: true,
        zip: true,
        radiusMiles: true,
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

    const existingProposal = await prisma.proposal.findUnique({
      where: {
        requestId_expertId: {
          requestId: request.id,
          expertId: expert.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProposal) {
      return reply.code(409).send({ ok: false, error: 'You have already submitted a proposal for this request.' });
    }

    const proposal = await prisma.proposal.create({
      data: {
        requestId: request.id,
        expertId: expert.id,
        message,
        priceLabel,
        timelineLabel,
        status: ProposalStatus.PENDING,
      },
      select: {
        id: true,
        requestId: true,
        expertId: true,
        message: true,
        priceLabel: true,
        timelineLabel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    req.log.info({ proposalId: proposal.id, requestId: request.id, expertId: expert.id }, 'proposal.created');
    return reply.code(201).send({ ok: true, proposal });
  });
};

export default requestsRoutes;
