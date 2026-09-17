# Anchor Virtual — Attendance Recovery Operating Model

## Executive thesis

Virtual non-attendance is not one problem. A student can miss required live instruction because of a forgotten schedule, device failure, household responsibilities, academic avoidance, weak belonging, an unsustainable schedule, or a mismatch between the student's needs and the virtual model. A generic reminder treats all of those causes as if they were the same.

Anchor should own the operating loop between the first sign of a likely miss and verified return to instructional participation:

**Prevent → Detect → Ask → Route → Resolve → Verify → Learn**

The product is not designed to force synchronous seat time when the approved instructional plan permits another valid participation path. Its goal is to recover qualifying instructional participation while preserving the evidence required by policy.

## Product: Show-Up Engine

### 1. Prevent the avoidable miss

Before a required live session:

- Put the session into a single student-facing schedule.
- Send a concise reminder with a one-tap join action.
- Use the student's preferred permitted channel.
- Escalate reminders only when prior behavior indicates that a reminder is useful.
- Avoid guardian notification by default for students and situations where local policy does not require it.

This solves friction and routine failures. It is intentionally low-cost and low-intrusion.

### 2. Detect non-participation quickly

The system listens only to instructional and administrative systems that the school already uses, such as:

- required synchronous-session participation;
- LMS progress;
- teacher-student instructional interactions;
- assignment completion;
- approved alternative evidence.

No webcam attention scoring, keystroke logging, browser surveillance, or device-level behavioral monitoring.

### 3. Ask one useful question after a miss

Within minutes of a required session miss, send a short check-in such as:

> What stopped you from joining today?
>
> Technology / I forgot / Too far behind / Work or caregiving / Schedule problem / I don't want to attend / Something else

The purpose is not to excuse the absence automatically. The answer determines the smallest useful intervention.

### 4. Route by barrier

| Barrier | First response | Human owner when unresolved | Example approved fallback |
| --- | --- | --- | --- |
| Technology/access | Live tech support | Tech navigator | Teacher interaction or offline work if policy permits |
| Routine/forgot | One-tap join + calendar | Attendance navigator | Same-day approved asynchronous participation |
| Academic overwhelm | Minimum viable catch-up plan | Teacher + success coach | Teacher interaction + approved instructional work |
| Work/caregiving | Redesign participation window | Success coach | Alternate schedule/asynchronous path if permitted |
| Motivation/belonging | Five-minute same-day adult check-in | Consistent success coach | Small-group or one-to-one connection |
| Schedule mismatch | Move to sustainable section/window | Counselor/scheduler | Alternate section or permitted asynchronous path |
| Unknown/no response | One-question check-in | Attendance navigator | Human barrier discovery |

### 5. Escalate based on transparent rules

Anchor should not use a black-box behavioral risk score. The first production version should use transparent routing rules based on observable instructional indicators such as:

- consecutive missed required sessions;
- recent attendance percentage;
- declining assignment/participation trend;
- whether the student responded to the previous outreach;
- a known barrier already reported by the student/family.

Routing levels:

**Prevent** — remove friction before the next class.

**Recover today** — resolve the barrier or connect the student to an approved same-day participation pathway before day close.

**Human rescue** — repeated misses or failed outreach create one named adult owner with a same-day service-level agreement.

### 6. Human rescue should be short, specific, and accountable

The assigned adult does not simply 'mentor' the student indefinitely. They own a short recovery plan:

1. make direct contact;
2. identify the current barrier;
3. agree on the next participation event;
4. remove or route the barrier;
5. verify that participation occurred;
6. stay assigned until the routine is stable.

If the intervention repeatedly fails, the system should trigger a structural review of schedule, workload, supports, and modality fit rather than increasing the volume of reminders.

## Why this is different from ordinary messaging software

Messaging is one intervention inside the operating system. The defensible product is the orchestration layer that knows:

- which event was missed;
- whether another valid participation pathway exists;
- what barrier was reported;
- which intervention is appropriate;
- who owns the intervention;
- whether it was completed;
- whether the student actually returned;
- which interventions have produced incremental attendance gains for similar operational situations.

## Evidence informing the product

The product direction is deliberately narrower than claims that all attendance interventions work equally well.

- A 2025 study pooling six randomized field trials across more than 78,000 students found that personalized attendance information reduced absences by 1.9%, supporting low-cost personalized messaging as a Tier 1 tactic.
- U.S. Department of Education resources emphasize root-cause analysis, student/family engagement, and multi-tiered supports rather than one universal intervention.
- GAO reporting on virtual learning identified lack of adult assistance, competing demands, disengagement, technology access, and difficulty understanding lessons as attendance/learning barriers. GAO also reported that one-to-one check-ins were viewed as helpful in some settings.
- Research with parents of K-12 online students identifies focus, pacing, motivation, organization, live-session availability, teacher feedback, home schedules, technology barriers, and parent role clarity as recurring engagement challenges.
- Mentoring evidence is mixed: some attendance initiatives report positive results, while a large randomized Check & Connect evaluation found no statistically significant positive findings on the reviewed outcomes. Therefore Anchor should reserve human mentoring for cases that fail lower-cost interventions and rigorously measure its incremental effect.

## Pilot design

A product team should not declare success because the dashboard shows more outreach.

Primary outcomes:

- same-day participation recovery rate;
- next-required-session attendance;
- seven-day attendance rate;
- consecutive-miss recurrence;
- successful human-contact rate;
- time from miss to useful intervention;
- time from miss to recovered participation;
- assignment/course progress after recovery;
- withdrawal/retention rate;
- student/family opt-out and complaint rate;
- staff minutes per recovered instructional day.

### Evaluation

Where operationally and ethically feasible, use randomized or stepped-wedge rollout for low-risk interventions such as reminder timing, message framing, and automated barrier check-ins. Compare higher-touch interventions using matched or staged cohorts when randomization is impractical.

The product should learn intervention lift, not merely correlations.

## Kill criteria

The Show-Up Engine should be changed or stopped if a pilot shows any of the following:

1. no credible improvement in same-day or seven-day participation;
2. staff workload rises materially without additional recovered instructional time;
3. notification opt-outs or complaints indicate message fatigue;
4. the system increases recorded attendance without corresponding instructional participation or course progress;
5. schools use routing levels for punishment rather than support;
6. protected characteristics or invasive surveillance become inputs to student prioritization;
7. students are forced into live-seat-time requirements that are not part of the approved instructional model;
8. repeated intervention failure is treated as a student-compliance problem instead of triggering a schedule/modality review.

## Commercial packaging

### Virtual Core

Evidence ledger, attendance adjudication, Show-Up Engine, policy-aware approved fallback routes, and dashboards.

Indicative pricing hypothesis: **$12–$20 per virtual student per year with a $30,000 minimum**, depending on integration complexity and support requirements.

### Virtual Recovery Operations

Optional managed service in which trained attendance navigators work the human-rescue queue under district policy. This creates higher ACV and gives Anchor more control over implementation quality.

Indicative annual service range: **$50,000–$200,000+**, determined by enrollment, intervention volume, hours of coverage, language support, and required service levels.

### Value story

For Texas full-time virtual programs where daily participation drives reported attendance, attendance improvement can have a direct funding relationship subject to the program's actual FSP circumstances. For full-time virtual campuses, the Chapter 30B funding calculation differs, so the product should sell primarily on engagement, retention, auditability, operating efficiency, and educational outcomes rather than claiming a direct per-student attendance-dollar recovery.

## Data model required for production

- `instructional_events`
- `student_schedules`
- `participation_signals`
- `missed_required_events`
- `barrier_responses`
- `intervention_assignments`
- `intervention_actions`
- `approved_fallback_paths`
- `return_commitments`
- `participation_verifications`
- `student_contact_preferences`
- `guardian_contact_rules`
- `intervention_experiments`
- `intervention_outcomes`

Every automated routing decision should be explainable from the source fields and policy version used.

## Immediate build order

1. SIS schedule adapter and live-session event model.
2. LMS/video-conference participation adapter.
3. Notification service with one-click join links and rate limits.
4. One-question barrier check-in.
5. Transparent routing engine (implemented in prototype as `lib/show-up.ts`).
6. Staff recovery queue and SLA tracking.
7. Approved asynchronous fallback configuration.
8. Return-verification loop.
9. Experiment assignment and outcome measurement.
10. Managed navigator console.

The core operating metric should be **incremental instructional participation recovered per 100 targeted students**, supported by staff time per recovered day and student/family experience metrics.
