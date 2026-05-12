type ExpertLocationInput = {
  city: string;
  state: string;
  zip?: string | null;
};

type SearchCenterInput = {
  zip: string;
};

type GeocodeSuccess = {
  ok: true;
  latitude: number;
  longitude: number;
  geocodedAt: Date;
  geocodeProvider: 'geoapify';
};

type GeocodeFailureReason = 'missing-config' | 'bad-status' | 'bad-response' | 'not-found' | 'network';

type GeocodeFailure = {
  ok: false;
  error: GeocodeFailureReason;
  status?: number;
};

export type GeocodeResult = GeocodeSuccess | GeocodeFailure;

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '';
const GEOAPIFY_BASE_URL = process.env.GEOAPIFY_BASE_URL || 'https://api.geoapify.com';

function buildExpertLocationText({ city, state, zip }: ExpertLocationInput) {
  const cityState = `${city}, ${state}`;
  return zip ? `${cityState} ${zip}, United States` : `${cityState}, United States`;
}

function buildSearchCenterText({ zip }: SearchCenterInput) {
  return `${zip}, United States`;
}

export function hasGeocodingConfig() {
  return Boolean(GEOAPIFY_API_KEY);
}

async function geocodeSearchText(text: string): Promise<GeocodeResult> {
  if (!hasGeocodingConfig()) {
    return { ok: false, error: 'missing-config' };
  }

  const url = new URL('/v1/geocode/search', GEOAPIFY_BASE_URL);
  url.searchParams.set('text', text);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('apiKey', GEOAPIFY_API_KEY);

  try {
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) {
      return { ok: false, error: 'bad-status', status: res.status };
    }

    const body = (await res.json().catch(() => null)) as
      | { results?: Array<{ lat?: number | string; lon?: number | string }> }
      | null;

    const first = body?.results?.[0];
    const latitude = Number(first?.lat);
    const longitude = Number(first?.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, error: body?.results?.length ? 'bad-response' : 'not-found' };
    }

    return {
      ok: true,
      latitude,
      longitude,
      geocodedAt: new Date(),
      geocodeProvider: 'geoapify',
    };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function geocodeExpertLocation(input: ExpertLocationInput): Promise<GeocodeResult> {
  return geocodeSearchText(buildExpertLocationText(input));
}

export async function geocodeSearchCenter(input: SearchCenterInput): Promise<GeocodeResult> {
  return geocodeSearchText(buildSearchCenterText(input));
}
