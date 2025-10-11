import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import crypto from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Allow requests from the Next.js app (dev)
fastify.register(cors, {
  origin: true, // or ["http://localhost:3000"]
  credentials: true,
});

// Cookies: sign httpOnly session cookies
fastify.register(cookie, {
  secret: process.env.SESSION_SECRET || 'dev-secret', // set a real secret in prod
});

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

// ====== MAGIC LINK (REQUEST) ======
type MagicToken = { email: string; token: string; expiresAt: number; used: boolean };
const magicTokens = new Map<string, MagicToken>(); // token -> record

const WEB_BASE = process.env.WEB_URL || 'http://localhost:3000';

fastify.post('/auth/magic-link', async (req, reply) => {
  const { email } = (req.body || {}) as { email?: string };

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return reply.code(400).send({ error: 'Valid email is required' });
  }

  // Ensure a User exists (idempotent)
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: 'provider' },
  });

  // Create a one-time token (15 min)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000;
  magicTokens.set(token, { email, token, expiresAt, used: false });

  const verifyUrl = `${WEB_BASE}/login/verify?token=${token}`;
  fastify.log.info({ email, verifyUrl, expiresAt }, 'magic-link.dev');

  return reply.send({ ok: true });
});

// ====== MAGIC LINK (VERIFY) ======
// Simple in-memory session store for dev
type Session = { userId: string; expiresAt: number };
const sessionStore = new Map<string, Session>(); // sessionToken -> { userId, expiresAt }

fastify.post('/auth/verify', async (req, reply) => {
  const { token } = (req.body || {}) as { token?: string };
  if (!token) return reply.code(400).send({ error: 'Missing token' });

  const record = magicTokens.get(token);
  if (!record) return reply.code(400).send({ error: 'Invalid token' });
  if (record.used) return reply.code(400).send({ error: 'Token already used' });
  if (Date.now() > record.expiresAt) return reply.code(400).send({ error: 'Token expired' });

  // Mark token as used
  record.used = true;
  magicTokens.set(token, record);

  // Find user by email (was created in /auth/magic-link)
  const user = await prisma.user.findUnique({ where: { email: record.email } });
  if (!user) return reply.code(400).send({ error: 'User not found' });

  // Create a session token (7 days)
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessionStore.set(sessionToken, { userId: user.id, expiresAt });

  // Set httpOnly cookie on the API domain (localhost:4000)
  reply.setCookie('session', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true behind HTTPS in prod
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    signed: true,
  });

  return reply.send({ ok: true });
});

// WHO AM I (dev helper)
fastify.get('/auth/me', async (req, reply) => {
  const raw = req.cookies?.session;
  if (!raw) return reply.code(401).send({ error: 'No session' });

  const { valid, value } = fastify.unsignCookie(raw);
  if (!valid) return reply.code(401).send({ error: 'Invalid signature' });

  const sess = sessionStore.get(value);
  if (!sess || Date.now() > sess.expiresAt) {
    return reply.code(401).send({ error: 'Expired session' });
  }

  const user = await prisma.user.findUnique({ where: { id: sess.userId } });
  if (!user) return reply.code(401).send({ error: 'User not found' });

  return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
});

// MAIN: Start the server
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
