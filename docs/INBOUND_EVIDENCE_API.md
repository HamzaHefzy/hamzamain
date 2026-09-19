# Anchor Inbound Virtual Evidence API

The Inbound Virtual Evidence API lets an approved district, virtual school, LMS, or integration pipeline submit instructional-participation evidence to Anchor without sharing a platform password.

The caller submits evidence. Anchor determines whether that evidence qualifies under the organization's active attendance policy for the evidence date.

## Endpoint

POST /api/inbound/v1/virtual-evidence

The API is server-to-server. Do not embed an Anchor API key in browser JavaScript, a mobile app, or student-facing code.

## Authentication

Create a key in Integrations → Inbound evidence API.

Send it as a Bearer token:

~~~http
Authorization: Bearer ank_live_...
Content-Type: application/json
~~~

The plaintext key is shown only once. Anchor stores a SHA-256 hash and a short non-secret prefix. Keys are organization-scoped, revocable, optionally expiring, and currently limited to the virtual_evidence:write scope.

If a key is exposed, revoke it and issue a new one.

## Request limits

- Maximum request size: 1 MB
- Maximum events per request: 500
- Maximum 60 requests per minute per API key
- metadata must be 8 KB or smaller per event
- minutes must be a whole number from 0 through 1440, or null
- occurredAt may not be more than 15 minutes in the future

## Payload

~~~json
{
  "events": [
    {
      "studentExternalId": "S10002",
      "date": "2026-09-19",
      "evidenceType": "lms_progress",
      "occurredAt": "2026-09-19T14:10:00-05:00",
      "source": "district-lms",
      "sourceRef": "activity-884921",
      "minutes": 24,
      "metadata": {
        "courseExternalId": "ALG-1"
      }
    }
  ]
}
~~~

### Fields

studentExternalId must match an active student in a virtual, virtual-campus, or hybrid campus.

date is the school date to which the evidence belongs, in YYYY-MM-DD format.

evidenceType must be one of:

- lms_progress
- teacher_interaction
- assignment_submission
- live_session
- approved_offline_work
- other

occurredAt is the timestamp at which the instructional activity occurred.

source identifies the upstream system. Keep it stable, for example canvas-prod or district-engagement-service.

sourceRef is the upstream idempotency identifier for this evidence event. The pair of organization + source + sourceRef must represent one immutable event.

minutes is the instructional duration when the active policy requires duration.

metadata is optional integration context. Do not include secrets or unnecessary sensitive student information.

## Policy evaluation

Anchor resolves the attendance policy effective on the supplied evidence date, then evaluates the evidence server-side.

The upstream system cannot send qualifies=true, present=true, or otherwise decide attendance status.

If evidence qualifies, Anchor may create or update a daily virtual_policy attendance record. It will not overwrite an official SIS attendance record. A record is automatically changed by virtual evidence only when the existing daily record belongs to Anchor's virtual_policy source or is still unresolved.

## Idempotency

Clients should retry network failures using the exact same source and sourceRef.

If Anchor already has the exact same student/date/type/timestamp/minutes event, the result is duplicate and no second evidence record is created.

If a caller reuses the same sourceRef for different evidence, the event is rejected. Generate a new source reference for a genuinely new event.

## Response

Anchor returns HTTP 200 for a syntactically valid batch even when individual events are rejected. Inspect the per-event results.

~~~json
{
  "ok": true,
  "organization": "Example Virtual School",
  "total": 1,
  "accepted": 1,
  "duplicates": 0,
  "rejected": 0,
  "results": [
    {
      "index": 0,
      "sourceRef": "activity-884921",
      "status": "accepted",
      "qualifies": true,
      "attendanceDecision": "present",
      "evidenceId": "..."
    }
  ]
}
~~~

attendanceDecision of evidence_recorded means the evidence was stored but did not independently satisfy the active policy.

A status of rejected includes an event-specific error. One rejected event does not discard other valid events in the same request.

## HTTP errors

- 400 — malformed JSON or invalid batch schema
- 401 — invalid, expired, revoked, or insufficiently scoped API key
- 413 — request exceeds 1 MB
- 429 — per-key rate limit exceeded
- 500 — unexpected server failure

Responses include X-Anchor-API-Version: 1 on the authenticated API path.

## Retry guidance

For HTTP 429, honor Retry-After.

For HTTP 500 or network failures, retry with exponential backoff and the same sourceRef values.

For HTTP 400, correct the payload before retrying.

For per-event rejected results in an HTTP 200 batch, correct only those rejected events. Do not assign a new sourceRef merely to bypass a conflicting idempotency error; first determine which upstream event is authoritative.

## Security operations

- Use one key per production integration whenever practical.
- Give keys clear names such as Canvas production.
- Set expirations when the customer's credential-rotation policy requires them.
- Revoke a key immediately when an integration is retired or a secret is exposed.
- Store the key in the upstream system's secret manager.
- Never send an Anchor API key by email, spreadsheet, ticket comment, or client-side code.
- Review last-used timestamps in the Integrations workspace.

The API key grants evidence write access only. It does not grant student-record reads, case access, financial access, user administration, or official attendance mutation.
