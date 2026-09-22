import { fetchWithTimeout } from "@/lib/http";

export type GooglePlaceSummary = {
  id: string;
  displayName: string;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: string | null;
  googleMapsUri: string | null;
};

export type GooglePlaceDetails = GooglePlaceSummary & {
  internationalPhoneNumber: string | null;
  nationalPhoneNumber: string | null;
  websiteUri: string | null;
  businessStatus: string | null;
};

function apiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  return key;
}

function placeName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const text = (value as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

export async function searchGooglePlaces(input: {
  query: string;
  homeBase?: string | null;
  maxResults?: number;
}) {
  const query = [input.query.trim(), input.homeBase?.trim()]
    .filter(Boolean)
    .join(" near ");
  if (!query) throw new Error("A place search query is required.");

  const response = await fetchWithTimeout(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey(),
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.rating",
          "places.userRatingCount",
          "places.priceLevel",
          "places.googleMapsUri",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: Math.max(1, Math.min(input.maxResults ?? 5, 10)),
      }),
    },
  );

  const payload = await response.json().catch(() => ({})) as {
    places?: Array<Record<string, unknown>>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Google Places search failed.");
  }

  return (payload.places ?? []).map((place): GooglePlaceSummary => {
    const location =
      place.location && typeof place.location === "object"
        ? place.location as { latitude?: unknown; longitude?: unknown }
        : {};
    return {
      id: typeof place.id === "string" ? place.id : "",
      displayName: placeName(place.displayName),
      formattedAddress:
        typeof place.formattedAddress === "string" ? place.formattedAddress : null,
      latitude: typeof location.latitude === "number" ? location.latitude : null,
      longitude: typeof location.longitude === "number" ? location.longitude : null,
      rating: typeof place.rating === "number" ? place.rating : null,
      userRatingCount:
        typeof place.userRatingCount === "number" ? place.userRatingCount : null,
      priceLevel: typeof place.priceLevel === "string" ? place.priceLevel : null,
      googleMapsUri:
        typeof place.googleMapsUri === "string" ? place.googleMapsUri : null,
    };
  }).filter((place) => place.id && place.displayName);
}

export async function getGooglePlaceDetails(placeId: string) {
  const response = await fetchWithTimeout(
    "https://places.googleapis.com/v1/places/" + encodeURIComponent(placeId),
    {
      headers: {
        "X-Goog-Api-Key": apiKey(),
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "rating",
          "userRatingCount",
          "priceLevel",
          "googleMapsUri",
          "internationalPhoneNumber",
          "nationalPhoneNumber",
          "websiteUri",
          "businessStatus",
        ].join(","),
      },
    },
  );

  const place = await response.json().catch(() => ({})) as Record<string, unknown> & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(place.error?.message ?? "Google Place details failed.");
  }

  const location =
    place.location && typeof place.location === "object"
      ? place.location as { latitude?: unknown; longitude?: unknown }
      : {};

  return {
    id: typeof place.id === "string" ? place.id : placeId,
    displayName: placeName(place.displayName),
    formattedAddress:
      typeof place.formattedAddress === "string" ? place.formattedAddress : null,
    latitude: typeof location.latitude === "number" ? location.latitude : null,
    longitude: typeof location.longitude === "number" ? location.longitude : null,
    rating: typeof place.rating === "number" ? place.rating : null,
    userRatingCount:
      typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    priceLevel: typeof place.priceLevel === "string" ? place.priceLevel : null,
    googleMapsUri:
      typeof place.googleMapsUri === "string" ? place.googleMapsUri : null,
    internationalPhoneNumber:
      typeof place.internationalPhoneNumber === "string"
        ? place.internationalPhoneNumber
        : null,
    nationalPhoneNumber:
      typeof place.nationalPhoneNumber === "string" ? place.nationalPhoneNumber : null,
    websiteUri: typeof place.websiteUri === "string" ? place.websiteUri : null,
    businessStatus:
      typeof place.businessStatus === "string" ? place.businessStatus : null,
  } satisfies GooglePlaceDetails;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function resolveNamedGooglePlace(input: {
  query: string;
  homeBase?: string | null;
}) {
  const results = await searchGooglePlaces({
    query: input.query,
    homeBase: input.homeBase,
    maxResults: 5,
  });
  if (!results.length) return { resolved: null, candidates: [] };

  const normalizedQuery = normalize(input.query);
  const exact = results.find((place) => {
    const name = normalize(place.displayName);
    return name.length >= 4 && normalizedQuery.includes(name);
  });

  if (!exact) {
    return {
      resolved: null,
      candidates: results.map((place) => ({
        id: place.id,
        name: place.displayName,
        address: place.formattedAddress,
        mapsUrl: place.googleMapsUri,
      })),
    };
  }

  return {
    resolved: await getGooglePlaceDetails(exact.id),
    candidates: results.map((place) => ({
      id: place.id,
      name: place.displayName,
      address: place.formattedAddress,
      mapsUrl: place.googleMapsUri,
    })),
  };
}
