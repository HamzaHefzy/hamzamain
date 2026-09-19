# Anchor Security Baseline

Anchor handles student education records and should be deployed as a FERPA-aware system.

## Production requirements
- Dedicated PostgreSQL database with encryption at rest and encrypted backups.
- HTTPS only; terminate TLS at the hosting provider.
- Set a 32+ character random AUTH_SECRET.
- Set a separate 32-byte base64 INTEGRATION_ENCRYPTION_KEY.
- Never commit SIS/LMS tokens or district credentials.
- Use least-privilege roles and organization-scoped queries.
- Retain audit logs for administrative, attendance, import, integration, and case mutations.
- Restrict database/network access to the application and approved operators.
- Establish district-specific retention/deletion terms before production student data is ingested.
- Complete DPA/FERPA and security reviews before a district launch.

## Product guardrails
Student support prioritization cannot use student-level funding value. Anchor does not require webcam, keystroke, or continuous-device surveillance for attendance decisions.
