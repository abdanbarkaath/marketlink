// src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import providersRoutes from './routes/providers';

async function start() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, { origin: 'http://localhost:3000', credentials: true });
  await fastify.register(cookie, { secret: process.env.SESSION_SECRET || 'dev-secret' });

  fastify.get('/health', async () => ({ ok: true, service: 'marketlink-backend', time: new Date().toISOString() }));

  await fastify.register(authRoutes);
  await fastify.register(accountRoutes);
  await fastify.register(providersRoutes);

  const port = Number(process.env.PORT || 4000);
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`API running on http://localhost:${port}`);
}

start();
