import type { FastifyPluginAsync } from 'fastify';
import { getUserFromRequest } from '../lib/session';
import { prisma } from '../lib/prisma';
import { getCachedProviderMatchedRequests } from '../lib/requestMatching';

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /me  → basic identity (id, email, role)
  fastify.get('/me', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
  });

  // GET /me/summary → user + owned expert (with provider alias for compatibility)
  fastify.get('/me/summary', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });

    if (user.role === 'customer') {
      const [customer, activeRequestCount, pendingProposalCount, conversationCount] = await Promise.all([
        prisma.customerProfile.findUnique({
          where: { userId: user.id },
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        }),
        prisma.customerRequest.count({
          where: {
            customerUserId: user.id,
            status: 'ACTIVE',
          },
        }),
        prisma.proposal.count({
          where: {
            request: {
              customerUserId: user.id,
            },
            status: 'PENDING',
          },
        }),
        prisma.conversation.count({
          where: {
            customerUserId: user.id,
          },
        }),
      ]);

      return {
        ok: true,
        user: { id: user.id, email: user.email, role: user.role },
        customer,
        customerStats: {
          activeRequestCount,
          pendingProposalCount,
          conversationCount,
        },
        expert: null,
        provider: null,
      };
    }

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        businessName: true,
        expertType: true,
        city: true,
        state: true,
        zip: true,
        streetAddress: true,
        locationPrecision: true,
        tagline: true,
        shortDescription: true,
        overview: true,
        websiteUrl: true,
        phone: true,
        linkedinUrl: true,
        instagramUrl: true,
        facebookUrl: true,
        creatorPlatforms: true,
        creatorAudienceSize: true,
        creatorProofSummary: true,
        foundedYear: true,
        hourlyRateMin: true,
        hourlyRateMax: true,
        minProjectBudget: true,
        currencyCode: true,
        languages: true,
        industries: true,
        clientSizes: true,
        specialties: true,
        remoteFriendly: true,
        servesNationwide: true,
        responseTimeHours: true,
        logo: true,
        services: true,
        status: true,
        disabledReason: true,
        projects: {
          select: {
            id: true,
            title: true,
            summary: true,
            challenge: true,
            solution: true,
            results: true,
            services: true,
            projectBudget: true,
            startedAt: true,
            completedAt: true,
            isFeatured: true,
            coverImageUrl: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        clients: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            websiteUrl: true,
            isFeatured: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            altText: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return {
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
      customer: null,
      customerStats: null,
      expert,
      provider: expert,
    };
  });

  fastify.get('/me/provider-stats', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'provider') return reply.code(403).send({ error: 'Only providers can view provider stats.' });

    const expert = await prisma.expert.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        city: true,
        state: true,
        zip: true,
        latitude: true,
        longitude: true,
        remoteFriendly: true,
        servesNationwide: true,
        services: true,
        updatedAt: true,
      },
    });

    if (!expert) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const [inquiryCount, newInquiryCount, conversationCount, matchedRows] = await Promise.all([
      prisma.inquiry.count({
        where: {
          expertId: expert.id,
        },
      }),
      prisma.inquiry.count({
        where: {
          expertId: expert.id,
          status: 'NEW',
        },
      }),
      prisma.conversation.count({
        where: {
          expertId: expert.id,
        },
      }),
      getCachedProviderMatchedRequests(expert),
    ]);

    const proposals = matchedRows.length
      ? await prisma.proposal.findMany({
          where: {
            expertId: expert.id,
            requestId: {
              in: matchedRows.map((row) => row.request.id),
            },
          },
          select: {
            requestId: true,
            status: true,
          },
        })
      : [];

    const proposalStatusByRequestId = new Map(proposals.map((proposal) => [proposal.requestId, proposal.status]));
    const pendingProposalCount = proposals.filter((proposal) => proposal.status === 'PENDING').length;
    const acceptedProposalCount = proposals.filter((proposal) => proposal.status === 'ACCEPTED').length;
    const needsProposalCount = matchedRows.filter((row) => !proposalStatusByRequestId.has(row.request.id)).length;

    return reply.send({
      ok: true,
      stats: {
        inquiryCount,
        newInquiryCount,
        matchedRequestCount: matchedRows.length,
        needsProposalCount,
        pendingProposalCount,
        acceptedProposalCount,
        conversationCount,
      },
    });
  });

  fastify.put('/me/customer-profile', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer') return reply.code(403).send({ error: 'Only customers can update customer profiles.' });

    const { name, businessName } = (req.body || {}) as { name?: string; businessName?: string | null };

    const cleanName = String(name || '').trim();
    const cleanBusinessName = typeof businessName === 'string' ? businessName.trim() || null : null;

    if (!cleanName) {
      return reply.code(400).send({ error: 'Name is required.' });
    }

    const customer = await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        name: cleanName,
        businessName: cleanBusinessName,
      },
      create: {
        userId: user.id,
        name: cleanName,
        businessName: cleanBusinessName,
      },
      select: {
        id: true,
        name: true,
        businessName: true,
      },
    });

    return reply.send({
      ok: true,
      customer,
    });
  });
};

export default accountRoutes;
