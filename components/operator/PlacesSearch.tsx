"use client";

import { FormEvent, useState } from "react";

type Place = {
  id: string;
  displayName: string;
  formattedAddress: string | null;
  rating: number | null;
  userRatingCount: number | null;
  internationalPhoneNumber?: string | null;
  nationalPhoneNumber?: string | null;
  websiteUri?: string | null;
  googleMapsUri: string | null;
};

export default function PlacesSearch() {
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const q = String(form.get("q") ?? "").trim();

    try {
      const response = await fetch(
        "/api/operator/places/search?q=" +
        encodeURIComponent(q) +
        "&includeContact=1",
      );
      const payload = await response.json() as { results?: Place[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to search places.");
      setResults(payload.results ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to search places.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="operator-places-search" onSubmit={submit}>
        <input
          name="q"
          required
          minLength={2}
          maxLength={300}
          placeholder="Dentist, sushi, Duke Urgent Care, mechanic near Ninth Street…"
        />
        <button type="submit" disabled={busy}>
          {busy ? "Searching…" : "Search Google Maps"}
        </button>
      </form>
      {error ? <div className="operator-error">{error}</div> : null}

      <div className="operator-place-results">
        {results.map((place) => {
          const phone =
            place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null;
          return (
            <article key={place.id}>
              <div>
                <strong>{place.displayName}</strong>
                <span>{place.formattedAddress ?? "Address unavailable"}</span>
                <small>
                  {place.rating ? place.rating.toFixed(1) + " ★" : "No rating"}
                  {place.userRatingCount ? " · " + place.userRatingCount + " reviews" : ""}
                  {phone ? " · " + phone : ""}
                </small>
              </div>
              <div className="operator-inline-actions">
                {phone ? <a href={"tel:" + phone}>Call</a> : null}
                {place.websiteUri ? <a href={place.websiteUri} target="_blank" rel="noreferrer">Website</a> : null}
                {place.googleMapsUri ? <a href={place.googleMapsUri} target="_blank" rel="noreferrer">Maps</a> : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
