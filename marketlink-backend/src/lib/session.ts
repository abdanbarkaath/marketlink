import crypto from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@prisma/client';
import { prisma } from './prisma';

/** ===== Magic-link tokens (dev/in-memory) ===== */
export type MagicToken = { email: string; token: string; expiresAt: number; used: boolean };
export const magicTokens = new Map<string, MagicToken>(); // token -> record

/** ===== Sessions (dev/in-memory) ===== */
export type Session = { userId: string; expiresAt: number };
export const sessionStore = new Map<string, Session>(); // sessionToken -> session

/** ===== Config (envs) ===== */
export const WEB_BASE = process.env.WEB_URL || 'http://localhost:3000';
export const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Create and store a magic-link token for an email (dev/log delivery). */
export function createMagicToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + MAGIC_TOKEN_TTL_MS;
  magicTokens.set(token, { email, token, expiresAt, used: false });
  return { token, expiresAt };
}

/** Verify & consume a magic-link token. Returns email if valid; otherwise null. */
export function consumeMagicToken(token: string): { email: string } | null {
  const rec = magicTokens.get(token);
  if (!rec) return null;
  if (rec.used) return null;
  if (Date.now() > rec.expiresAt) return null;
  rec.used = true;
  magicTokens.set(token, rec);
  return { email: rec.email };
}

/** Create a session for a userId and store it. Returns token+expiresAt. */
export function createSessionForUser(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessionStore.set(sessionToken, { userId, expiresAt });
  return { sessionToken, expiresAt };
}

/** Set the signed, httpOnly session cookie on the reply. */
export function setSessionCookie(reply: FastifyReply, sessionToken: string, ttlMs = SESSION_TTL_MS) {
  // fastify-cookie must be registered in the server before routes
  reply.setCookie('session', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true behind HTTPS in prod
    path: '/',
    maxAge: Math.floor(ttlMs / 1000),
    signed: true,
  });
}

/** Clear/expire the session cookie (helper for /auth/logout later). */
export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie('session', { path: '/' });
}

/** Read a valid session from the signed cookie. Returns session or null. */
export function getSessionFromRequest(fastify: FastifyInstance, req: FastifyRequest): Session | null {
  const raw = (req.cookies as any)?.session;
  if (!raw) return null;

  const { valid, value } = fastify.unsignCookie(raw);
  if (!valid) return null;

  const sess = sessionStore.get(value);
  if (!sess) return null;
  if (Date.now() > sess.expiresAt) return null;

  return sess;
}

/** Get the logged-in User from the session cookie (or null if unauthenticated). */
export async function getUserFromRequest(fastify: FastifyInstance, req: FastifyRequest): Promise<User | null> {
  const sess = getSessionFromRequest(fastify, req);
  if (!sess) return null;
  const user = await prisma.user.findUnique({ where: { id: sess.userId } });
  return user ?? null;
}
