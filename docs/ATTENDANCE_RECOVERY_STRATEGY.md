# Anchor Attendance Recovery Strategy

## Executive conclusion

Attendance is not primarily a prediction problem. It is an execution problem with heterogeneous causes.

Anchor should not promise that a dashboard, risk score, or chatbot will make students attend. The product should operate an adaptive recovery system:

1. reduce avoidable friction before class;
2. detect a miss while there is still time to recover the instructional event;
3. escalate quickly from automation to a named adult;
4. identify the barrier;
5. route a barrier-specific intervention;
6. verify that the student actually returned;
7. learn which intervention works for which student/context.

The commercial product is therefore **Attendance Recovery Operations**, with software as the operating system and optional managed human navigation for customers that do not have enough staff capacity.

## What the evidence supports

### 1. Personalized attendance messaging is a real Tier-1 intervention

A large IES randomized evaluation involving roughly 26,000 K-5 students found that adaptive parent text messaging reduced chronic absence. Effects were larger for students with a prior history of high absence, and school-staff outreach outperformed a more automated intensified approach for some high-absence students.

Product implication:

- use automated personalized reminders universally or for broad risk tiers;
- do not keep sending more automation when a student continues to miss;
- escalate persistent absence to school staff or an Anchor navigator.

Sources:
- https://ies.ed.gov/use-work/evaluations/impact-evaluation-parent-messaging-strategies-student-attendance
- https://ies.ed.gov/use-work/resource-library/report/evaluation-report/can-texting-parents-improve-attendance-elementary-school-test-adaptive-messaging-strategy
- https://ies.ed.gov/use-work/resource-library/report/guide/how-text-message-parents-reduce-chronic-absence-using-evidence-based-approach

A separate large randomized experiment with more than 28,000 high-risk K-12 students found personalized information to parents reduced chronic absenteeism by 10% or more in its most effective versions.

Source:
- https://www.nature.com/articles/s41562-018-0328-1

### 2. A named adult can matter for persistent disengagement, but not for every student

A large randomized evaluation of Check & Connect in Chicago found the program reduced absences by 4.2 days (22.9%) for students in grades 5-7, with no detectable effect in grades 1-4.

Product implication:

- do not assign intensive mentoring to the entire population;
- reserve named-adult monitoring for persistent cases where cheap reminders have failed;
- measure effects by age and case type rather than assuming one program works universally.

Sources:
- https://www.nber.org/papers/w27661
- https://ies.ed.gov/ncee/wwc/intervention/312

### 3. Health barriers need health capacity, not better messaging

A quasi-experimental study of school-based telemedicine in three rural North Carolina districts found access reduced chronic absence by 2.5 percentage points and days absent by about 0.8 days.

Product implication:

- Anchor should identify health/access as a barrier and complete a warm handoff into approved school/community health resources;
- Anchor should not pretend an attendance message solves a medical-access problem.

Source:
- https://edworkingpapers.com/ai23-698

### 4. Anxiety-based school avoidance is a specialist pathway

A 2025 systematic review/meta-analysis of cognitive-behavioral interventions for school attendance problems found a medium controlled effect on attendance, while also noting heterogeneity and evidence limitations.

Product implication:

- identify possible anxiety/school-avoidance patterns;
- route to qualified school mental-health/counseling processes;
- support a return plan and attendance verification;
- do not make Anchor a diagnostic or therapy product.

Source:
- https://pubmed.ncbi.nlm.nih.gov/40335864/

### 5. Virtual attendance should borrow from behavior science, but K-12 evidence is thinner

A randomized trial in synchronous online university lectures found an implementation-intention intervention improved lecture attendance and maintenance. Another randomized online-education study found personalized progress reminders improved on-time participation relative to general reminders.

These are not K-12 virtual-school trials, so Anchor should treat them as design hypotheses, not proof of K-12 effectiveness.

Product implication:

- test pre-class implementation intentions such as: "If I am tempted to skip because I am behind, I will join first and ask for the catch-up plan";
- personalize reminders with the exact session, one-click join link, and the student's current next step;
- run district-approved randomized or staggered tests to establish K-12 effects.

Sources:
- https://pubmed.ncbi.nlm.nih.gov/38016670/
- https://pubmed.ncbi.nlm.nih.gov/37831487/

### 6. The overall absenteeism evidence base argues for adaptive treatment, not a single magic intervention

A 2026 systematic review of secondary-school persistent-absence interventions found variable effects and characterized the evidence as weak to moderate overall. A recent meta-analysis similarly found a small average effect with substantial heterogeneity.

Product implication:

- matching interventions to barriers and monitoring implementation fidelity is the strategy;
- the product must learn intervention response by subgroup and context;
- a single generic "attendance intervention" is not credible.

Sources:
- https://pubmed.ncbi.nlm.nih.gov/41601704/
- https://pubmed.ncbi.nlm.nih.gov/42193576/

## The product: Anchor Recovery Desk

### Universal layer

For every scheduled instructional event where the customer authorizes messaging:

- personalized reminder;
- exact session/class name;
- one-click access;
- one simple help path;
- no shame, threats, streaks, or public ranking.

### Live rescue layer

For virtual instruction:

**T-30 to T-10**
- reminder with direct class link;
- optional "I'll be there / I need help" commitment prompt.

**T+5**
- if the student is still scheduled and has not joined, send a join-now rescue message;
- provide a secure barrier check-in link.

**T+10**
- create an urgent live-recovery case;
- a human owner attempts contact while the class is still underway;
- if a customer buys Anchor Resolve, the owner may be an Anchor attendance navigator.

**Same day**
- classify the barrier;
- route a specific action;
- create a commitment, owner, and deadline.

**Next five instructional events**
- verify return;
- reopen/escalate if the student relapses.

### Persistent absence layer

When low-cost recovery repeatedly fails:

- assign a named monitor/navigator;
- maintain a short attendance plan;
- review attendance, coursework, and barriers;
- coordinate with family and school staff;
- measure weekly progress;
- exit the intensive tier when attendance stabilizes.

## Barrier-specific playbooks

### Technology / internet

Goal: restore access before the next instructional event.

Actions:
- device/account troubleshooting;
- connectivity/hotspot workflow;
- direct class link;
- approved fallback participation path if policy permits;
- verify next-session participation.

### Routine / schedule confusion

Goal: convert intention into a repeatable routine.

Actions:
- calendar event with direct link;
- personalized reminder timing;
- implementation-intention plan;
- caregiver notification where appropriate;
- verify next five sessions.

### Academic overwhelm / "too far behind"

Goal: make re-entry psychologically and academically feasible.

Actions:
- teacher-created minimum re-entry plan;
- identify the smallest set of essential work;
- schedule a teacher/tutor check-in;
- explicitly tell the student they should attend before they are fully caught up;
- verify attendance and assignment re-engagement.

### Work / caregiving / schedule conflict

Goal: preserve instruction without pretending the conflict does not exist.

Actions:
- human schedule review;
- school-approved alternate participation path where legally/policy permitted;
- counselor/administrator coordination;
- family/student plan for future conflicts.

### Disengagement / belonging

Goal: give the student a real human connection and a reason to return.

Actions:
- named adult contact;
- short re-engagement conversation;
- identify one near-term class/goal the student values;
- repeat contact across several sessions rather than a one-off message.

### Health

Goal: remove access barriers to care and prevent attendance operations from becoming a medical workflow.

Actions:
- route to approved nurse/health/telehealth process;
- avoid collecting diagnosis details unnecessarily;
- coordinate return/participation plan.

### Anxiety / school avoidance

Goal: route early to qualified support and make return manageable.

Actions:
- counselor/mental-health handoff;
- graduated return plan where appropriate;
- trusted-adult entry/check-in;
- track attendance response;
- Anchor does not diagnose or deliver therapy.

## What Anchor should not build as the core attendance intervention

### More dashboards

Useful for management, insufficient for behavior change.

### Generic AI chat

Useful for triage and drafting. It cannot repair a device, provide transportation, treat anxiety, rebuild a teacher relationship, or make a live human call.

### Rewards as the primary strategy

Attendance incentives can change behavior during the incentive period, but evidence includes heterogeneous and potentially negative post-incentive effects among low-baseline-attendance students. Incentives may be tested in customer-approved contexts but should not become the product's central mechanism.

Source:
- https://www.nber.org/papers/w22528

### Punitive attendance pressure

The product should not use public ranking, shame, surveillance, or student-level funding values to pressure attendance.

### Counting outreach as success

Messages sent, calls attempted, and cases closed are process measures. Success is verified return to instruction.

## Managed service: Anchor Resolve

The main commercial insight is that districts often know what should happen but lack staff capacity to execute it consistently.

Anchor Resolve can provide a managed Recovery Desk that:

- monitors live recovery queues;
- executes authorized student/family outreach;
- performs first-line barrier triage;
- coordinates commitments with school teams;
- verifies return;
- hands health/safety/mental-health issues back to qualified district personnel.

This is materially more defensible than selling "AI attendance."

## Monetization

### Anchor Core

Software for attendance ingestion, ResolutionOS, evidence, funding planning, and recovery workflow.

Potential pricing:
- annual district/network minimum;
- per-enrolled-student component.

### Anchor Virtual

Adds scheduled-session participation, live rescue, evidence adjudication, and virtual day-close operations.

Potential pricing:
- per virtual student/year with an annual minimum.

### Anchor Resolve

Managed attendance-recovery operations.

Price from expected caseload and service hours, not from a percentage of speculative funding gains.

Possible commercial structures:
- annual fixed managed-service fee;
- base fee + active-caseload band;
- SLA-based service tier.

Avoid compensation based on student-level funding value.

## Measurement plan

Every intervention should record:

- eligibility timestamp;
- treatment/action;
- contact channel;
- whether contact was delivered;
- barrier;
- owner;
- commitment;
- time to first action;
- time to resolution;
- attendance in subsequent instructional events.

For product learning, use district-approved randomized or staggered rollout designs when feasible.

Primary outcome:
- incremental attended student-days / instructional events relative to a defensible comparison.

Secondary outcomes:
- same-day recovery rate;
- recurrence within 5/20 instructional events;
- time to first action;
- time to resolution;
- verified commitment rate;
- staff minutes per recovery;
- cost per incremental attended day.

## Kill criteria

Do not scale an intervention when:

- it increases messages but not attendance;
- staff workload rises materially without attendance improvement;
- it works only for already-easy cases;
- students/families show high opt-out or complaint rates;
- schools cannot execute the routed support;
- the intervention creates pressure to manipulate attendance records;
- it worsens equity across student groups.

The purpose of Anchor is not to make absences look better. It is to make attendance recovery actually happen.
