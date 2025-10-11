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
    const tokens = service
      .split(',') // support comma-separated values (optional)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    if (tokens.length === 1) {
      andFilters.push({ services: { has: tokens[0] } }); // exact match of one service
    } else if (tokens.length > 1) {
      andFilters.push({ services: { hasSome: tokens } }); // match ANY of the services
      // If you need ALL selected services instead, use hasEvery:
      // andFilters.push({ services: { hasEvery: tokens } });
    }
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

// ====== CREATE PROVIDER (ONBOARDING) ======
// Body: { businessName, city, state, zip?, services?: string[] | string, tagline?, logo? }
// Uses the logged-in user (session cookie) as the owner; sets Provider.email = user.email
fastify.post('/providers', async (req, reply) => {
  // ---- 1) Require session (same pattern as /me/summary) ----
  const raw = (req.cookies as any)?.session;
  if (!raw) return reply.code(401).send({ error: 'Not authenticated' });

  const { valid, value } = fastify.unsignCookie(raw);
  if (!valid) return reply.code(401).send({ error: 'Invalid session signature' });

  const sess = sessionStore.get(value);
  if (!sess || Date.now() > sess.expiresAt) {
    return reply.code(401).send({ error: 'Session expired' });
  }

  const user = await prisma.user.findUnique({ where: { id: sess.userId } });
  if (!user) return reply.code(401).send({ error: 'User not found' });

  // Prevent multiple providers per user for now (soft rule)
  const existing = await prisma.provider.findFirst({ where: { userId: user.id } });
  if (existing) {
    return reply.code(409).send({ error: 'You already have a provider profile.' });
  }

  // ---- 2) Parse & validate body ----
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

  // Normalize services: accept string ("seo,ads") or array; store all-lowercase
  let services: string[] = [];
  if (Array.isArray(body.services)) {
    services = body.services.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  } else if (typeof body.services === 'string') {
    services = body.services
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  // ---- 3) Generate a unique slug from businessName ----
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const base = slugify(businessName) || `provider-${Date.now()}`;
  let slug = base;
  let i = 2;
  // ensure uniqueness by appending -2, -3, ...
  while (await prisma.provider.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  // ---- 4) Create the provider (email = user.email; owner = this user) ----
  try {
    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        email: user.email, // unique; ties profile to login email
        businessName,
        slug,
        tagline,
        city,
        state,
        zip: zip || undefined,
        services,
        logo: logo || undefined,
        // rating, verified keep defaults
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
    // Handle unique email/slug collisions gracefully
    if (e?.code === 'P2002') {
      return reply.code(409).send({ error: 'A provider with this email or slug already exists.' });
    }
    req.log.error({ err: e }, 'create-provider.failed');
    return reply.code(500).send({ error: 'Failed to create provider' });
  }
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

// GET /me/summary  → returns logged-in user + their provider (if any)
fastify.get('/me/summary', async (req, reply) => {
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

  const provider = await prisma.provider.findFirst({
    where: { userId: user.id },
    select: { id: true, slug: true, businessName: true, city: true, state: true },
  });

  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role },
    provider, // null if none → dashboard will show onboarding
  };
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
