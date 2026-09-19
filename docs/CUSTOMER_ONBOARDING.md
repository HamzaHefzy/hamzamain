# Customer Onboarding Runbook

## 1. Contract and data boundary

Confirm the customer organization, schools/campuses, approved data sources, named administrators, attendance-accounting policy, data-retention period, and whether SMS/email outreach is authorized.

## 2. Provision the organization

Use npm run org:create with customer-specific organization, timezone, and owner values. The command creates an isolated organization and owner membership. Texas organizations receive the current product default Basic-Allotment assumption, which must still be reviewed by finance before use.

## 3. Configure organization structure

In Settings create each campus and select the correct delivery model:

- in_person
- virtual_program
- virtual_campus
- hybrid

Campus codes must match the codes used by CSV roster imports.

## 4. Configure virtual policy

For virtual/hybrid operations, publish the approved evidence types, minimum qualifying minutes, effective date, and local day-close time. Every update creates a new policy version; do not alter historical records to match a later policy.

## 5. Load data

Recommended order:

1. student roster
2. official attendance
3. virtual participation evidence
4. virtual session schedule/participation

Sample CSVs are in examples/imports.

OneRoster may be configured for roster synchronization. Vendor-specific SIS/LMS adapters other than OneRoster are not represented as live integrations until separately tested.

## 6. Validate operations

Before launch:

- confirm enrollment by campus
- reconcile a sample of official attendance records
- validate at least five virtual evidence decisions against the approved policy
- create and resolve a test ResolutionOS case
- verify commitment audit history
- exercise one missed-session recovery/check-in
- validate role restrictions using finance, attendance, support, and viewer accounts
- review aggregate funding assumptions with the customer's finance owner

## 7. Messaging

Enable Resend and/or Twilio only after the customer approves sender identity, recipients, templates, and contact fields. Anchor falls back to creating operational cases even when automated messaging is not configured.

## 8. Launch

Start the Show-Up scheduled job, enable virtual day-close scheduling, monitor /api/health, and review failed imports/integration errors daily during the launch period.

## 9. Success measures

Track attendance rate and attended student-days, time from signal to first action, time from barrier identification to verified commitment, percent of commitments verified, same-day virtual participation recoveries, unresolved evidence exceptions at day close, staff caseload/overdue work, and aggregate financial planning scenarios where applicable.

Student support is never prioritized by a student's modeled funding value.
