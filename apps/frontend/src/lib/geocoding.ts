/**
 * Geocoding helpers. Centralizes Nominatim (OpenStreetMap) lookups so components
 * don't do inline `fetch()`. Used outside an `<APIProvider>` context where the
 * Google Maps SDK isn't available.
 *
 * Inside `@vis.gl/react-google-maps` contexts, prefer the Google Geocoding SDK
 * via `useMapsLibrary('geocoding')` — higher quality for Turkey addresses and
 * returns structured `address_components`.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export interface NominatimAddress {
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  district?: string;
  city?: string;
  town?: string;
  village?: string;
}

export interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
}

export interface NominatimSearchResult {
  display_name?: string;
  type?: string;
  lat: string;
  lon: string;
}

/**
 * Reverse-geocode a lat/lng into a human-readable place name via Nominatim.
 * Returns null on failure; callers should fall back to "lat, lng" display.
 */
export async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
  acceptLanguage: string = 'tr,en',
): Promise<NominatimReverseResponse | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': acceptLanguage } },
    );
    if (!res.ok) return null;
    return await res.json() as NominatimReverseResponse;
  } catch {
    return null;
  }
}

/**
 * Forward-search Nominatim for a query string. Returns up to `limit` results.
 * Empty array on failure.
 */
export async function searchGeocodeNominatim(
  query: string,
  limit: number = 5,
  acceptLanguage: string = 'tr,en',
): Promise<NominatimSearchResult[]> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`,
      { headers: { 'Accept-Language': acceptLanguage } },
    );
    if (!res.ok) return [];
    return await res.json() as NominatimSearchResult[];
  } catch {
    return [];
  }
}

/**
 * Extract a short human-readable place name from a Nominatim reverse-geocode
 * response (neighbourhood → suburb → quarter → district → city → town → first
 * segment of display_name).
 */
export function nominatimDisplayName(
  res: NominatimReverseResponse | null,
  fallback: string,
): string {
  if (!res) return fallback;
  const a = res.address ?? {};
  return (
    a.neighbourhood
    || a.suburb
    || a.quarter
    || a.district
    || a.city
    || a.town
    || a.village
    || res.display_name?.split(',')[0]
    || fallback
  );
}

/**
 * Format a Nominatim reverse-geocode response as "City › District › Neighbourhood",
 * including only the parts that are actually present. Returns null if no usable
 * parts are found (caller should fall back to raw coordinates).
 */
export function formatNominatimAddress(
  res: NominatimReverseResponse | null,
): string | null {
  if (!res) return null;
  const a = res.address ?? {};
  const city         = a.city || a.town || a.village || null;
  const district     = a.district || null;
  const neighbourhood = a.neighbourhood || a.suburb || a.quarter || null;
  const parts = [city, district, neighbourhood].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' › ') : null;
}
