import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getRecoverySettings } from "@/lib/recovery-service";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  dailyLaunchTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  preclassReminderMinutes: z.coerce.number().int().min(5).max(180),
  liveRescueMinutes: z.coerce.number().int().min(1).max(60),
  humanEscalationMinutes: z.coerce.number().int().min(1).max(120),
  stabilizationEvents: z.coerce.number().int().min(3).max(20),
  stabilizationRequiredSuccesses: z.coerce.number().int().min(1).max(20),
  incidentMinMissing: z.coerce.number().int().min(2).max(1000),
  incidentMissingRate: z.coerce.number().min(0.1).max(1),
  managedResolveEnabled: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.humanEscalationMinutes < value.liveRescueMinutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["humanEscalationMinutes"],
      message: "Human escalation cannot occur before the live-rescue trigger.",
    });
  }
  if (value.stabilizationRequiredSuccesses > value.stabilizationEvents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stabilizationRequiredSuccesses"],
      message: "Required successes cannot exceed observed events.",
    });
  }
});

export async function GET() {
  const auth = await apiSession("view");
  if (auth.response) return auth.response;
  return NextResponse.json({ settings: await getRecoverySettings(auth.session!.orgId) });
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());
    const sql = db();

    await sql`
      insert into attendance_recovery_settings (
        org_id, daily_launch_time, preclass_reminder_minutes,
        live_rescue_minutes, human_escalation_minutes,
        stabilization_events, stabilization_required_successes,
        incident_min_missing, incident_missing_rate,
        managed_resolve_enabled, updated_at
      )
      values (
        ${session.orgId}, ${input.dailyLaunchTime}::time,
        ${input.preclassReminderMinutes}, ${input.liveRescueMinutes},
        ${input.humanEscalationMinutes}, ${input.stabilizationEvents},
        ${input.stabilizationRequiredSuccesses}, ${input.incidentMinMissing},
        ${input.incidentMissingRate}, ${input.managedResolveEnabled}, now()
      )
      on conflict (org_id) do update
      set daily_launch_time = excluded.daily_launch_time,
          preclass_reminder_minutes = excluded.preclass_reminder_minutes,
          live_rescue_minutes = excluded.live_rescue_minutes,
          human_escalation_minutes = excluded.human_escalation_minutes,
          stabilization_events = excluded.stabilization_events,
          stabilization_required_successes = excluded.stabilization_required_successes,
          incident_min_missing = excluded.incident_min_missing,
          incident_missing_rate = excluded.incident_missing_rate,
          managed_resolve_enabled = excluded.managed_resolve_enabled,
          updated_at = now()
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "recovery_settings.updated",
      entityType: "attendance_recovery_settings",
      entityId: session.orgId,
      metadata: input,
      request,
    });

    return NextResponse.json({ ok: true, settings: input });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update recovery settings." },
      { status: 400 },
    );
  }
}
