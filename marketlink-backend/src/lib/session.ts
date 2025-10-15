// lib/session.ts
import crypto from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@prisma/client';
import { prisma } from './prisma';

/** ===== Magic-link tokens (dev/in-memory) ===== */
export type MagicToken = { email: string; token: string; expiresAt: number; used: boolean };
export const magicTokens = new Map<string, MagicToken>(); // token -> record

/** ===== Sessions (DB-backed) =====
 * We keep the exported Session shape the same as before so other code doesn't break.
 * Under the hood we now read/write prisma.session rows.
 */
export type Session = { userId: string; expiresAt: number };

/** ===== Config (envs) ===== */
export const WEB_BASE = process.env.WEB_URL || 'http://localhost:3000';
export const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Prefer SESSION_TTL_DAYS; fall back to legacy SESSION_TTL_MS for compatibility.
function getSessionTtlMs(): number {
  const days = Number(process.env.SESSION_TTL_DAYS);
  if (Number.isFinite(days) && days > 0) return days * 24 * 60 * 60 * 1000;
  const legacy = Number(process.env.SESSION_TTL_MS);
  return Number.isFinite(legacy) && legacy > 0 ? legacy : 7 * 24 * 60 * 60 * 1000;
}
export const SESSION_TTL_MS = getSessionTtlMs();

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

/** ===== Cookie helpers (signed httpOnly, same as before) ===== */
const COOKIE_NAME = 'session';

export function setSessionCookie(reply: FastifyReply, sessionToken: string, ttlMs = SESSION_TTL_MS) {
  reply.setCookie(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // keep false in dev, true in prod
    path: '/',
    maxAge: Math.floor(ttlMs / 1000),
    signed: true,
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}

/** ===== DB-backed session CRUD ===== */

/** Create a session row for a userId. Returns token+expiresAt (ms). */
export async function createSessionForUser(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { id: sessionToken, userId, expiresAt: expires },
  });
  return { sessionToken, expiresAt: expires.getTime() };
}

/** Internal: extract & unsign the cookie value → raw token or null. */
function getRawTokenFromRequest(fastify: FastifyInstance, req: FastifyRequest): string | null {
  const raw = (req.cookies as any)?.[COOKIE_NAME];
  if (!raw) return null;
  const { valid, value } = fastify.unsignCookie(raw);
  if (!valid) return null;
  return typeof value === 'string' ? value : null;
}

/** Read a valid session from the signed cookie via DB. Returns { userId, expiresAt } or null. */
export async function getSessionFromRequest(fastify: FastifyInstance, req: FastifyRequest): Promise<Session | null> {
  const token = getRawTokenFromRequest(fastify, req);
  if (!token) return null;

  const row = await prisma.session.findUnique({ where: { id: token } });
  if (!row) return null;

  const exp = row.expiresAt.getTime();
  if (Date.now() > exp) {
    // Lazy cleanup of expired token
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
    return null;
  }

  return { userId: row.userId, expiresAt: exp };
}

/** Get the logged-in User from the session cookie (or null if unauthenticated). */
export async function getUserFromRequest(fastify: FastifyInstance, req: FastifyRequest): Promise<User | null> {
  const sess = await getSessionFromRequest(fastify, req);
  if (!sess) return null;
  const user = await prisma.user.findUnique({ where: { id: sess.userId } });
  return user ?? null;
}

/** Optional helpers for /auth/logout and logout-all */
export async function deleteCurrentSession(fastify: FastifyInstance, req: FastifyRequest, reply: FastifyReply) {
  const token = getRawTokenFromRequest(fastify, req);
  if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => {});
  }
  clearSessionCookie(reply);
}

export async function deleteAllSessionsForUser(userId: string) {
  const res = await prisma.session.deleteMany({ where: { userId } });
  return res.count;
}

/** Best-effort purge for expired sessions (can be called on boot or via a cron). */
export async function purgeExpiredSessions() {
  const res = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return res.count;
}
