import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

fastify.get('/health', async () => {
  return { ok: true, service: 'marketlink-backend', time: new Date().toISOString() };
});

fastify.get('/providers', async (req, reply) => {
  const { name, city, service, minRating, verified } = (req.query || {}) as {
    name?: string;
    city?: string;
    service?: string;
    minRating?: string;
    verified?: string;
  };

  const andFilters: any[] = [];

  // City prefix match (e.g., "chi" -> Chicago), case-insensitive
  if (city && city.trim()) {
    andFilters.push({
      city: { startsWith: city.trim(), mode: 'insensitive' },
    });
  }

  // Business name contains (e.g., "wind" -> "Windy City Growth"), case-insensitive
  if (name && name.trim()) {
    andFilters.push({
      businessName: { contains: name.trim(), mode: 'insensitive' },
    });
  }

  // Optional filters (only applied if provided)
  if (service && service.trim()) {
    const s = service.trim().toLowerCase();
    andFilters.push({
      OR: [
        // If Provider.services is a string[] column
        { services: { has: s } } as any,
        // If you have a relation to Service[]
        { services: { some: { OR: [{ name: s }, { slug: s }] } } } as any,
      ],
    });
  }

  if (minRating && !Number.isNaN(parseFloat(minRating))) {
    andFilters.push({ rating: { gte: parseFloat(minRating) } });
  }

  if (verified && (verified === '1' || verified.toLowerCase() === 'true')) {
    andFilters.push({ verified: true });
  }

  const where: any = andFilters.length ? { AND: andFilters } : {};

  // LOG what we received + filters we built
  fastify.log.info({ q: { name, city, service, minRating, verified }, where }, 'providers.query');

  // Use a stable default order (createdAt may be null in seed data)
  const providers = await prisma.provider.findMany({
    where,
    orderBy: [{ businessName: 'asc' }],
    take: 50,
  });

  fastify.log.info({ count: providers.length }, 'providers.result');

  return providers;
});

// DETAIL: /providers/:slug  ← NEW
fastify.get('/providers/:slug', async (req, reply) => {
  const { slug } = (req.params || {}) as { slug?: string };
  if (!slug) {
    reply.code(400).send({ error: 'Missing slug' });
    return;
  }

  const provider = await prisma.provider.findUnique({
    where: { slug },
  });

  if (!provider) {
    reply.code(404).send({ error: 'Provider not found' });
    return;
  }

  return provider;
});

const port = Number(process.env.PORT || 4000);

fastify
  .listen({ port, host: '0.0.0.0' })
  .then(() => {
    console.log(`API running on http://localhost:${port}`);
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
