import { CustomerRequestIntakeMode, CustomerRequestStatus } from '@prisma/client';
import { prisma } from './prisma';
import { lookupZipLocation, type ZipLookupResult } from './geocoding';

export type RequestMatchReason = 'within_radius' | 'same_zip' | 'same_city' | 'serves_nationwide' | 'remote_friendly';

export type ProviderExpertForMatching = {
  id: string;
  city: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  remoteFriendly: boolean;
  servesNationwide: boolean;
  services: string[];
  updatedAt?: Date | null;
};

export type RequestForProviderMatching = {
  id: string;
  title: string;
  description: string;
  intakeMode: CustomerRequestIntakeMode;
  marketingSubjectId: string | null;
  serviceTokens: string[];
  zip: string | null;
  radiusMiles: number | null;
  budgetLabel: string | null;
  timelineLabel: string | null;
  status: CustomerRequestStatus;
  requesterName: string;
  requesterBusinessName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProviderRequestMatch = {
  primaryReason: RequestMatchReason;
  reasons: RequestMatchReason[];
  matchedServiceTokens: string[];
  distanceMiles?: number;
  requestLocation: {
    zip: string;
    city: string | null;
    state: string | null;
    source: 'zip_lookup' | 'zip_only';
  };
};

export type CachedProviderMatchedRequest = {
  request: RequestForProviderMatching;
  match: ProviderRequestMatch;
};

const providerMatchedRequestCache = new Map<
  string,
  {
    activeRequestFingerprint: string;
    rows: CachedProviderMatchedRequest[];
  }
>();

function normalizeCity(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function normalizeState(value: string | null | undefined) {
  return String(value || '').trim().toUpperCase();
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMiles(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusMiles = 3958.7613;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusMiles * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildProviderCacheKey(expert: ProviderExpertForMatching) {
  const updatedAt = expert.updatedAt instanceof Date ? expert.updatedAt.getTime() : 0;
  return `${expert.id}:${updatedAt}`;
}

async function getActiveRequestFingerprint() {
  if (typeof prisma.customerRequest.aggregate !== 'function') {
    return `fallback:${Date.now()}`;
  }

  const aggregate = await prisma.customerRequest.aggregate({
    where: {
      status: CustomerRequestStatus.ACTIVE,
    },
    _count: {
      _all: true,
    },
    _max: {
      updatedAt: true,
    },
  });

  const total = aggregate?._count?._all || 0;
  const maxUpdatedAt = aggregate?._max?.updatedAt instanceof Date ? aggregate._max.updatedAt.getTime() : 0;
  return `${total}:${maxUpdatedAt}`;
}

async function preloadRequestLocations(requests: RequestForProviderMatching[]) {
  const uniqueZips = Array.from(new Set(requests.map((request) => String(request.zip || '').trim()).filter(Boolean)));
  const locationEntries = await Promise.all(
    uniqueZips.map(async (zip) => [zip, await lookupZipLocation({ zip })] as const),
  );

  return new Map<string, ZipLookupResult>(locationEntries);
}

function buildProviderMatchForRequest(
  expert: ProviderExpertForMatching,
  request: RequestForProviderMatching,
  locationLookup: ZipLookupResult | null,
): ProviderRequestMatch | null {
  if (!request.zip) return null;

  const requestCity = locationLookup?.ok ? locationLookup.city : null;
  const requestState = locationLookup?.ok ? locationLookup.state : null;
  const requestZip = locationLookup?.ok ? locationLookup.zip : request.zip;

  if (request.intakeMode === CustomerRequestIntakeMode.UNSURE) {
    if (!locationLookup?.ok || request.radiusMiles === null) return null;
    if (typeof expert.latitude !== 'number' || typeof expert.longitude !== 'number') return null;

    const distanceMiles = Number(
      haversineMiles(locationLookup.latitude, locationLookup.longitude, expert.latitude, expert.longitude).toFixed(1),
    );
    if (distanceMiles > request.radiusMiles) return null;

    return {
      primaryReason: 'within_radius',
      reasons: ['within_radius'],
      matchedServiceTokens: [],
      distanceMiles,
      requestLocation: {
        zip: requestZip,
        city: requestCity,
        state: requestState,
        source: 'zip_lookup',
      },
    };
  }

  if (request.serviceTokens.length === 0) return null;

  const matchedServiceTokens = expert.services.filter((token) => request.serviceTokens.includes(token));
  if (!matchedServiceTokens.length) return null;

  const sameZip = Boolean(expert.zip && expert.zip.trim() === requestZip);
  const sameCity =
    Boolean(requestCity && requestState) &&
    normalizeCity(expert.city) === normalizeCity(requestCity) &&
    normalizeState(expert.state) === normalizeState(requestState);

  const reasons: RequestMatchReason[] = [];
  if (sameZip) reasons.push('same_zip');
  else if (sameCity) reasons.push('same_city');
  else if (expert.servesNationwide) reasons.push('serves_nationwide');
  else if (expert.remoteFriendly) reasons.push('remote_friendly');

  if (!reasons.length) return null;

  return {
    primaryReason: reasons[0],
    reasons,
    matchedServiceTokens,
    requestLocation: {
      zip: requestZip,
      city: requestCity,
      state: requestState,
      source: locationLookup?.ok ? 'zip_lookup' : 'zip_only',
    },
  };
}

async function buildProviderMatchedRequests(expert: ProviderExpertForMatching) {
  const requests = await prisma.customerRequest.findMany({
    where: {
      status: CustomerRequestStatus.ACTIVE,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      intakeMode: true,
      marketingSubjectId: true,
      serviceTokens: true,
      zip: true,
      radiusMiles: true,
      budgetLabel: true,
      timelineLabel: true,
      status: true,
      requesterName: true,
      requesterBusinessName: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 100,
  });

  const requestLocations = await preloadRequestLocations(requests);
  const rows = requests
    .map((request) => {
      const locationLookup = request.zip ? requestLocations.get(request.zip) || null : null;
      const match = buildProviderMatchForRequest(expert, request, locationLookup);
      if (!match) return null;

      return {
        request,
        match,
      } satisfies CachedProviderMatchedRequest;
    })
    .filter((row): row is CachedProviderMatchedRequest => Boolean(row));

  return rows;
}

export async function getCachedProviderMatchedRequests(expert: ProviderExpertForMatching) {
  const cacheKey = buildProviderCacheKey(expert);
  const activeRequestFingerprint = await getActiveRequestFingerprint();
  const cached = providerMatchedRequestCache.get(cacheKey);

  if (cached && cached.activeRequestFingerprint === activeRequestFingerprint) {
    return cached.rows;
  }

  const rows = await buildProviderMatchedRequests(expert);
  providerMatchedRequestCache.set(cacheKey, {
    activeRequestFingerprint,
    rows,
  });

  return rows;
}

export async function getCachedProviderMatchedRequestById(expert: ProviderExpertForMatching, requestId: string) {
  const rows = await getCachedProviderMatchedRequests(expert);
  return rows.find((row) => row.request.id === requestId) || null;
}
