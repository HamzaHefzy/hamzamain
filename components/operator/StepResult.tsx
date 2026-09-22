type Json = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : null;
}

function number(value: unknown) {
  return typeof value === "number" ? value : null;
}

function hostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export default function StepResult({
  provider,
  response,
}: {
  provider: string | null;
  response: Json;
}) {
  const webResults = Array.isArray(response.results)
    ? response.results.filter((item): item is Json => Boolean(item && typeof item === "object"))
    : [];
  const places = Array.isArray(response.places)
    ? response.places.filter((item): item is Json => Boolean(item && typeof item === "object"))
    : [];
  const transcript = text(response.transcript);

  if ((provider === "brave-search" || provider === "web-search") && webResults.length) {
    return (
      <div className="step-result-list">
        {webResults.slice(0, 6).map((item, index) => {
          const url = text(item.url);
          return (
            <article className="step-result-card web" key={url ?? index}>
              <div>
                <span className="step-result-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{text(item.title) ?? "Web result"}</strong>
                  {text(item.description) ? <p>{text(item.description)}</p> : null}
                  {url ? <small>{hostname(url)}</small> : null}
                </div>
              </div>
              {url ? <a href={url} target="_blank" rel="noreferrer">Open ↗</a> : null}
            </article>
          );
        })}
      </div>
    );
  }

  if (provider === "google-places" && places.length) {
    return (
      <div className="step-result-list">
        {places.slice(0, 5).map((place, index) => {
          const phone =
            text(place.internationalPhoneNumber) ??
            text(place.nationalPhoneNumber);
          const maps = text(place.googleMapsUri);
          const website = text(place.websiteUri);
          return (
            <article className="step-result-card place" key={text(place.id) ?? index}>
              <div>
                <span className="step-result-pin">●</span>
                <div>
                  <strong>{text(place.displayName) ?? "Place"}</strong>
                  {text(place.formattedAddress) ? <p>{text(place.formattedAddress)}</p> : null}
                  <small>
                    {number(place.rating) ? number(place.rating)?.toFixed(1) + " ★" : "No rating"}
                    {number(place.userRatingCount) ? " · " + number(place.userRatingCount) + " reviews" : ""}
                    {phone ? " · " + phone : ""}
                  </small>
                </div>
              </div>
              <div className="step-result-actions">
                {phone ? <a href={"tel:" + phone}>Call</a> : null}
                {website ? <a href={website} target="_blank" rel="noreferrer">Site</a> : null}
                {maps ? <a href={maps} target="_blank" rel="noreferrer">Maps</a> : null}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  if ((provider === "vapi" || provider === "voice-agent" || provider === "twilio") && transcript) {
    return (
      <div className="step-call-result">
        <div className="step-call-head">
          <span>☎</span>
          <div>
            <strong>Call transcript</strong>
            <small>Returned by the voice provider when the call ended</small>
          </div>
        </div>
        <p>{transcript}</p>
      </div>
    );
  }

  return null;
}
