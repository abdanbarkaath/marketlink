// Server-only helper to call the backend API while forwarding the session cookie.
import 'server-only';
import { headers } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function getServerApiHeaders(init?: HeadersInit) {
  const requestHeaders = await headers();
  const forwardedHeaders = new Headers(init);
  const cookieHeader = requestHeaders.get('cookie');

  if (cookieHeader) {
    forwardedHeaders.set('cookie', cookieHeader);
  }

  return forwardedHeaders;
}

/**
 * Server-side fetch to backend while forwarding the raw incoming cookie header.
 * Use only in Server Components / server actions.
 */
export async function apiFetch(path: string, init?: RequestInit) {
  const requestHeaders = await getServerApiHeaders(init?.headers as HeadersInit);
  requestHeaders.set('Accept', 'application/json');

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: requestHeaders,
    cache: 'no-store',
  });
}

/** Convenience: fetch and parse JSON, throwing on non-2xx. */
export async function apiJSON<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (data && (data.error || data.message)) || `Request failed: ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}
