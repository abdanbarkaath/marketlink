type ExpertLocationInput = {
  streetAddress?: string | null;
  city: string;
  state: string;
  zip?: string | null;
};

type SearchCenterInput = {
  zip: string;
};

type AutocompleteType = 'city' | 'state' | 'postcode' | 'address';

type GeocodeSuccess = {
  ok: true;
  latitude: number;
  longitude: number;
  geocodedAt: Date;
  geocodeProvider: 'geoapify';
};

type ZipLookupSuccess = GeocodeSuccess & {
  city: string;
  state: string;
  zip: string;
};

type GeocodeFailureReason = 'missing-config' | 'bad-status' | 'bad-response' | 'not-found' | 'network';

type GeocodeFailure = {
  ok: false;
  error: GeocodeFailureReason;
  status?: number;
};

export type GeocodeResult = GeocodeSuccess | GeocodeFailure;
export type ZipLookupResult = ZipLookupSuccess | GeocodeFailure;

export type LocationAutocompleteSuggestion = {
  label: string;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  zip: string | null;
  latitude: number;
  longitude: number;
  resultType: string | null;
};

export type LocationAutocompleteResult =
  | {
      ok: true;
      suggestions: LocationAutocompleteSuggestion[];
    }
  | GeocodeFailure;

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '';
const GEOAPIFY_BASE_URL = process.env.GEOAPIFY_BASE_URL || 'https://api.geoapify.com';

function buildExpertLocationText({ streetAddress, city, state, zip }: ExpertLocationInput) {
  const street = String(streetAddress || '').trim();
  const cityState = `${city}, ${state}`;
  const base = street ? `${street}, ${cityState}` : cityState;
  return zip ? `${base} ${zip}, United States` : `${base}, United States`;
}

function buildSearchCenterText({ zip }: SearchCenterInput) {
  return `${zip}, United States`;
}

export function hasGeocodingConfig() {
  return Boolean(GEOAPIFY_API_KEY);
}

function normalizeAutocompleteType(type: AutocompleteType) {
  if (type === 'address') return null;
  if (type === 'postcode') return 'postcode';
  return type;
}

function dedupeSuggestions(type: AutocompleteType, suggestions: LocationAutocompleteSuggestion[]) {
  const seen = new Set<string>();
  const output: LocationAutocompleteSuggestion[] = [];

  for (const suggestion of suggestions) {
    const key =
      type === 'city'
        ? `${String(suggestion.city || '').trim().toLowerCase()}|${String(suggestion.stateCode || suggestion.state || '')
            .trim()
            .toLowerCase()}`
        : type === 'state'
        ? `${String(suggestion.stateCode || suggestion.state || '').trim().toLowerCase()}`
        : type === 'postcode'
        ? `${String(suggestion.zip || '').trim()}`
        : `${String(suggestion.label || '').trim().toLowerCase()}`;

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(suggestion);
  }

  return output;
}

function isAllowedAddressSuggestion(suggestion: LocationAutocompleteSuggestion) {
  const { resultType, city, stateCode, zip } = suggestion;
  const normalized = String(resultType || '').trim().toLowerCase();
  if (!city || !stateCode || !zip) {
    return false;
  }

  return (
    normalized !== 'city' &&
    normalized !== 'state' &&
    normalized !== 'postcode' &&
    normalized !== 'country' &&
    normalized !== 'county' &&
    normalized !== 'suburb' &&
    normalized !== 'district' &&
    normalized !== 'neighbourhood' &&
    normalized !== 'neighborhood'
  );
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

async function geocodeStructuredSearchText(text: string): Promise<ZipLookupResult> {
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
      | {
          results?: Array<{
            lat?: number | string;
            lon?: number | string;
            city?: string | null;
            state?: string | null;
            state_code?: string | null;
            postcode?: string | null;
          }>;
        }
      | null;

    const first = body?.results?.[0];
    const latitude = Number(first?.lat);
    const longitude = Number(first?.lon);
    const city = String(first?.city || '').trim();
    const state = String(first?.state_code || first?.state || '').trim().toUpperCase();
    const zip = String(first?.postcode || '').trim();

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !city || !state || !zip) {
      return { ok: false, error: body?.results?.length ? 'bad-response' : 'not-found' };
    }

    return {
      ok: true,
      latitude,
      longitude,
      city,
      state,
      zip,
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

export async function lookupZipLocation(input: SearchCenterInput): Promise<ZipLookupResult> {
  return geocodeStructuredSearchText(buildSearchCenterText(input));
}

export async function autocompleteLocation(text: string, type: AutocompleteType): Promise<LocationAutocompleteResult> {
  if (!hasGeocodingConfig()) {
    return { ok: false, error: 'missing-config' };
  }

  const query = text.trim();
  if (!query) {
    return { ok: true, suggestions: [] };
  }

  const url = new URL('/v1/geocode/autocomplete', GEOAPIFY_BASE_URL);
  url.searchParams.set('text', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '8');
  url.searchParams.set('filter', 'countrycode:us');
  const normalizedType = normalizeAutocompleteType(type);
  if (normalizedType) {
    url.searchParams.set('type', normalizedType);
  }
  url.searchParams.set('apiKey', GEOAPIFY_API_KEY);

  try {
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) {
      return { ok: false, error: 'bad-status', status: res.status };
    }

    const body = (await res.json().catch(() => null)) as
      | {
          results?: Array<{
            formatted?: string | null;
            city?: string | null;
            state?: string | null;
            state_code?: string | null;
            postcode?: string | null;
            lat?: number | string;
            lon?: number | string;
            result_type?: string | null;
          }>;
        }
      | null;

    const suggestions = (body?.results || [])
      .map((item) => {
        const latitude = Number(item.lat);
        const longitude = Number(item.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        return {
          label: String(item.formatted || '').trim(),
          city: item.city ? String(item.city).trim() : null,
          state: item.state ? String(item.state).trim() : null,
          stateCode: item.state_code ? String(item.state_code).trim().toUpperCase() : null,
          zip: item.postcode ? String(item.postcode).trim() : null,
          latitude,
          longitude,
          resultType: item.result_type ? String(item.result_type).trim() : null,
        } satisfies LocationAutocompleteSuggestion;
      })
      .filter((item): item is LocationAutocompleteSuggestion => Boolean(item?.label))
      .filter((item) => (type === 'address' ? isAllowedAddressSuggestion(item) : true));

    return { ok: true, suggestions: dedupeSuggestions(type, suggestions) };
  } catch {
    return { ok: false, error: 'network' };
  }
}
