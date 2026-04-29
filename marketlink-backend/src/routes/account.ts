import type { FastifyPluginAsync } from 'fastify';
import { getUserFromRequest } from '../lib/session';
import { prisma } from '../lib/prisma';

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
      expert,
      provider: expert,
    };
  });
};

export default accountRoutes;
