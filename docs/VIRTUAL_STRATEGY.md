# Anchor Virtual — Commercial Strategy

## Executive thesis

Anchor Virtual should not be sold as an LMS attendance tracker. Texas already has state-backed attendance tooling and major LMS vendors expose attendance/engagement data. The durable product is a policy-aware evidence, exception-resolution, and audit-defense layer that sits across the LMS, SIS, synchronous classroom tools, and student-support workflow.

The promise:

> Every virtual attendance record is supported by defensible evidence, every unsupported record becomes an actionable exception before the day closes, and recurring disengagement becomes a real intervention rather than a surveillance score.

## Texas market distinction

Texas virtual models do not share one funding formula.

### Full-time virtual/hybrid programs

Programs operating within an existing campus take attendance daily under the school system-approved instructional plan. Valid evidence can include LMS progress, teacher-student interaction, or assignment completion/turn-in. Funding is intended to be comparable to the same program delivered in person, subject to state rules and attendance reporting.

Commercial implication: attendance evidence quality, daily exceptions, intervention, and audit support can directly protect reporting accuracy and funding.

### Full-time virtual/hybrid campuses

Chapter 30B uses enrolled full-time-equivalent students multiplied by the host district/charter's non-virtual attendance rate for ADA calculation. Therefore, a product that claims each virtual student's daily attendance directly increases campus ADA would be wrong.

Commercial implication: value comes from enrollment retention, authorization/compliance, engagement, intervention, audit integrity, and preventing students from disengaging or withdrawing—not from attaching a dollar value to each daily virtual record.

## Product modules

### 1. Evidence Ledger

Ingest and normalize evidence from approved sources:
- LMS progress
- assignment submissions
- teacher-student interactions
- synchronous session records where permitted
- SIS enrollment/schedule data
- manual supporting evidence with reviewer attribution

For every attendance determination preserve:
- source event
- timestamp
- applicable policy/rule
- adjudication result
- override reason if any
- user/reviewer
- downstream SIS record reference

### 2. Day-Close Exception Queue

Before attendance is finalized, surface students whose records are unsupported or contradictory.

Examples:
- no qualifying evidence yet
- teacher interaction exists but is not linked
- assignment submitted outside local policy window
- conflicting LMS/SIS enrollment
- three-day engagement decline

The system routes the smallest appropriate action instead of creating another dashboard.

### 3. Virtual ResolutionOS

If missing evidence reflects true disengagement rather than a data issue, open a student-support case.

Possible barriers:
- device/connectivity
- work/caregiving
- course pacing overwhelm
- lack of adult support
- disability/accommodation issue
- housing instability
- schedule conflict
- mental/behavioral health barrier
- unclear expectations

ResolutionOS then manages owner, commitment, due date, intervention verification, and follow-up.

### 4. Audit Vault

Produce a defensible attendance packet by date, student, course, campus, or audit sample containing the evidence and rule applied.

The system should never invent evidence, retroactively manufacture activity, or silently override an unsupported attendance record.

### 5. Chapter 30B Launch Readiness

For Texas districts/charters launching programs or campuses, track:
- board approval
- instructional plan
- attendance policy
- operational-minute requirements
- course certification/list deadlines
- staffing/leadership requirements
- professional development
- authorization artifacts
- engagement and performance metrics
- stakeholder feedback
- implementation milestones

This is a high-value implementation wedge but should lead into recurring software rather than becoming a consulting-only business.

### 6. Virtual Evidence Analytics

Executive metrics:
- percent of attendance records with complete supporting evidence
- exceptions per 1,000 student-days
- median time to exception resolution
- percent resolved without teacher manual work
- recurring disengagement cases
- interventions completed
- subsequent attendance/engagement recovery
- withdrawals/retention
- audit adjustments
- staff minutes spent on attendance reconciliation

## Ideal customer profile

### First target
Texas districts and charter networks operating or launching full-time virtual/hybrid programs with approximately 500–5,000 virtual students.

Characteristics:
- Canvas, Schoology, Google Classroom, or another LMS
- PowerSchool, Infinite Campus, Skyward, or another SIS
- fragmented attendance evidence
- PEIMS/attendance staff spending time reconciling systems
- student-support team responsible for virtual engagement
- executive interest in Chapter 30B growth

Why not start with the largest national virtual operators:
- they often have proprietary systems
- long procurement cycles
- higher integration complexity
- sophisticated compliance teams

Why not start with tiny programs:
- limited annual contract value
- insufficient workflow complexity to justify deep integration

## Buyers

Economic buyer:
- CFO/CBO
- COO/Chief Schools Officer
- Superintendent/Deputy Superintendent

Operational buyer/champion:
- Virtual Academy Executive Director
- PEIMS Director
- Attendance Director
- Student Services leader

Technical approver:
- CIO/CTO
- SIS/LMS administrator
- privacy/security/legal

## Pricing hypotheses

These are hypotheses to validate in customer discovery.

### Anchor Virtual Core
- $10–$18 per virtual student/year
- $30,000 annual minimum
- includes evidence ledger, exception queue, audit vault, policy configuration, and executive reporting

### Implementation/integrations
- $15,000–$40,000 one-time depending on LMS/SIS complexity

### Chapter 30B Launch Readiness
- $40,000–$100,000 implementation package
- should include software configuration and operating artifacts, not application-writing alone

### Managed Virtual Operations
- $50,000–$200,000+ annually depending on student count and case volume
- attendance exception follow-up
- family/student outreach
- evidence reconciliation
- ResolutionOS navigation

### Performance fees
Do not use a percentage-of-ADA model as the default.

Reasons:
- funding formulas differ by virtual model
- attribution can be disputed
- contingent-fee procurement may be restricted
- it can create incentives to overstate attendance

A success fee may be tested only where recovered funding is independently verifiable, legally permissible, and based on corrected eligible records rather than speculative future attendance improvement.

## Buyer ROI example

Illustrative virtual program:
- 2,400 students
- Texas Basic Allotment planning input: $6,215

One attendance percentage point equals about 24 ADA and roughly $149,160 of gross Basic-Allotment scenario value before weights and other FSP adjustments.

This is not a guaranteed cash increase. The stronger ROI case combines:
- funding/reporting accuracy
- staff hours saved
- fewer unsupported attendance records
- reduced audit exposure
- faster student re-engagement
- lower withdrawal/churn risk

## Go-to-market

### Offer 1 — Virtual Attendance Evidence Audit
30-day diagnostic:
- map LMS/SIS data flow
- sample 100–500 attendance records
- calculate evidence completeness
- identify manual reconciliation work
- identify unsupported/contradictory records
- measure staff time
- map current intervention workflow
- classify Chapter 30B model correctly

Deliverable: evidence-gap map + implementation plan + pilot economics.

### Offer 2 — 8–12 week pilot
Implement:
- one LMS
- one SIS
- evidence ledger
- day-close exception queue
- virtual ResolutionOS
- audit export

Measure:
- evidence completeness
- manual minutes saved
- exception resolution time
- attendance corrections
- engagement recovery

### Offer 3 — annual deployment
Expand across virtual programs/campuses with managed operations and authorization/compliance modules as needed.

## Distribution opportunities

### Texas Virtual and Hybrid Program Accelerator
Texas is actively funding virtual/hybrid program and campus development. Anchor should pursue state-approved-provider and implementation-partner pathways where available.

### SIS/LMS partnerships
Anchor should integrate rather than replace:
- Canvas
- Schoology
- Google Classroom
- PowerSchool
- Infinite Campus
- Skyward
- Microsoft Teams / Zoom / Class where used

### Virtual program design firms
Implementation/authorization consultancies can use Anchor as the operating system after launch.

## Stress test

### Hypothesis: sell LMS attendance automation
Verdict: reject as primary wedge.
Reason: state-backed Texas ClassApps and existing LMS capabilities already cover much of this surface area.

### Hypothesis: sell a percentage of ADA improvement
Verdict: reject as primary pricing model.
Reason: Texas full-time virtual campuses do not use virtual daily attendance in the same way as programs; attribution and compliance risk are too high.

### Hypothesis: sell audit-grade evidence + exception resolution
Verdict: strongest recurring wedge.
Reason: requires cross-system integration, policy logic, workflow, audit history, and intervention—harder for a single LMS feature to replace.

### Hypothesis: sell Chapter 30B authorization consulting
Verdict: use as acquisition wedge, not standalone company.
Reason: urgent, grant-supported, high-value, but one-time and vulnerable to policy cycles.

### Hypothesis: build a national virtual-attendance rules engine immediately
Verdict: delay.
Reason: GAO has documented substantial variation across states. Start with Texas, validate the operating model, then add states one at a time with explicit policy/version control.

### Hypothesis: engagement surveillance
Verdict: reject.
Do not build keystroke monitoring, always-on cameras, facial recognition, hidden focus scores, or punitive automated decisions. They create trust, privacy, and false-positive risk without being necessary to satisfy the product promise.

## Defensibility

Long-term moat:

`state rule + local policy + evidence source + attendance decision + exception workflow + intervention + subsequent outcome`

Over time Anchor can learn:
- which evidence gaps are data problems vs true disengagement
- which intervention works for which barrier
- how quickly an exception must be resolved to prevent a missed day/withdrawal
- which program designs produce the strongest retention and attendance outcomes

This is more defensible than another attendance dashboard because the dataset captures both the compliance decision and the operational response.

## Kill criteria

Do not scale Anchor Virtual if pilots show:
- schools already have reliable evidence with negligible manual burden
- Anchor cannot reduce reconciliation workload materially
- integrations are too expensive relative to ACV
- administrators do not value audit traceability
- interventions do not improve engagement or attendance
- the product encourages over-reporting or weakens trust

## Immediate product objective

The MVP must answer, every day:

1. Which virtual attendance records are already defensible?
2. Which records are unsupported or contradictory?
3. What exact action can resolve each exception before close?
4. Which exceptions represent true student disengagement?
5. Did the intervention improve subsequent attendance/engagement?
6. Can the school reproduce the evidence and decision later in an audit?
