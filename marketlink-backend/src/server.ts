// src/server.ts
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit'; // 👈 add this

import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import providersRoutes from './routes/providers';

async function start() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? 'dev-secret',
  });

  // 👇 register rate-limit plugin, but don't enable globally
  await fastify.register(rateLimit, { global: false });

  fastify.get('/health', async () => ({
    ok: true,
    service: 'marketlink-backend',
    time: new Date().toISOString(),
  }));

  await fastify.register(authRoutes);
  await fastify.register(accountRoutes);
  await fastify.register(providersRoutes);

  const port = Number(process.env.PORT || 4000);
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`API running on http://localhost:${port}`);
}

start();
