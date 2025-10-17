// Server-only helper to call the backend API while forwarding the session cookie.
import 'server-only';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Server-side fetch to backend, forwarding the 'session' cookie.
 * Use only in Server Components / server actions.
 */
export async function apiFetch(path: string, init?: RequestInit) {
  // Some Next typings expose cookies() as Promise<...> — await to satisfy TS.
  const cookieStore = await cookies();
  const sess = cookieStore.get('session');

  const headers = new Headers(init?.headers as HeadersInit);
  headers.set('Accept', 'application/json');

  // Forward session cookie if present
  if (sess?.value) {
    headers.append('cookie', `session=${sess.value}`);
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

/** Convenience: fetch and parse JSON, throwing on non-2xx. */
export async function apiJSON<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (data && (data.error || data.message)) || `Request failed: ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}
