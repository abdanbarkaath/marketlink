import type { Prisma } from '@prisma/client';

export function parseServiceGroups(raw?: string): string[][] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 64) throw new Error('Invalid service groups');
  return value.map((group) => {
    if (!Array.isArray(group) || !group.length || group.length > 50 ||
      group.some((token) => typeof token !== 'string' || !/^[a-z0-9-]{1,80}$/.test(token))) {
      throw new Error('Invalid service tokens');
    }
    return [...new Set(group as string[])];
  });
}

export function groupedServiceFilter(groups: string[][], match: 'any' | 'all'): Prisma.ExpertWhereInput {
  // Synonyms within a service are alternatives; selecting all services joins the groups.
  return match === 'all'
    ? { AND: groups.map((tokens) => ({ services: { hasSome: tokens } })) }
    : { services: { hasSome: [...new Set(groups.flat())] } };
}
