import Link from "next/link";
import IncidentActions from "@/components/IncidentActions";
import { can, requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMembers } from "@/lib/data-access";
import { getDailyLaunchSnapshot } from "@/lib/daily-launch-service";
import { getRecoveryDesk } from "@/lib/recovery-service";
import { getSessionIncidents } from "@/lib/session-incidents";

export const dynamic = "force-dynamic";

export default async function RecoveryDeskPage() {
  const session = await requireSession();
  if (!can(session.role, "attendance_write") && !can(session.role, "support_write")) redirect("/dashboard");
  const [desk, launch, incidents, members] = await Promise.all([
    getRecoveryDesk(session.orgId),
    getDailyLaunchSnapshot(session.orgId),
    getSessionIncidents(session.orgId, 25),
    getMembers(session.orgId),
  ]);

  const recoveryMembers = members.filter((member) =>
    ["owner","admin","attendance","support"].includes(member.role),
  );

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Recovery Desk</div>
          <h1>Keep ownership until attendance is stable.</h1>
          <p className="lede">
            One student trajectory, one accountable owner, one barrier-resolution path, and a Return Plan that verifies subsequent attendance before recovery is counted.
          </p>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-card accent"><span>Active episodes</span><strong>{desk.metrics.active}</strong><small>Open or stabilizing student trajectories</small></article>
        <article className="metric-card"><span>Stabilizing</span><strong>{desk.metrics.stabilizing}</strong><small>Return Plan currently observing attendance</small></article>
        <article className="metric-card"><span>Human tier</span><strong>{desk.metrics.navigatorTier + desk.metrics.multidisciplinary}</strong><small>Navigator or multidisciplinary ownership</small></article>
        <article className="metric-card"><span>Relapsed</span><strong>{desk.metrics.relapsed}</strong><small>Attendance broke down after a prior recovery</small></article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div><div className="eyebrow">Daily Launch · {launch.schoolDate}</div><h2>Problems surfaced before class</h2></div>
          </div>
          <div className="resolution-summary">
            <div><strong>{launch.sent}</strong><span>launches delivered</span></div>
            <div><strong>{launch.responded}</strong><span>student responses</span></div>
            <div><strong>{launch.helpRequested}</strong><span>help requested</span></div>
          </div>
          <p className="muted-copy">
            Students can flag a barrier before the first miss. A help request creates or updates their active Recovery Episode and routes a real next action.
          </p>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div><div className="eyebrow">Navigator capacity</div><h2>Balance the human queue</h2></div>
          </div>
          <div className="case-stack">
            {desk.navigators.length ? desk.navigators.map((navigator) => (
              <div className="case-card" key={navigator.userId}>
                <div className="case-topline"><strong>{navigator.name}</strong><span>{navigator.role}</span></div>
                <p>{navigator.activeEpisodes} active episodes · {navigator.urgentCases} urgent cases</p>
              </div>
            )) : <p className="muted-copy">No eligible attendance/support operators are active.</p>}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div><div className="eyebrow">Student trajectories</div><h2>Recovery Episodes</h2></div>
          <span className="data-badge">{desk.metrics.unassigned} unassigned</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Episode</th><th>Student</th><th>Barrier</th><th>Tier</th><th>Owner</th><th>Return Plan</th><th>Last signal</th></tr>
            </thead>
            <tbody>
              {desk.episodes.length ? desk.episodes.map((episode) => (
                <tr key={episode.id}>
                  <td><Link className="text-link" href={"/recovery/" + episode.id}>{episode.episodeNumber}</Link></td>
                  <td>{episode.studentName}<br /><small>{episode.externalId} · {episode.campusName ?? "No campus"}</small></td>
                  <td>{episode.barrierLabel ?? "Barrier discovery needed"}</td>
                  <td>{episode.tier.replaceAll("_"," ")}</td>
                  <td>{episode.ownerName ?? "Unassigned"}</td>
                  <td>
                    {episode.returnPlan
                      ? episode.returnPlan.successfulEvents + "/" + episode.returnPlan.targetEvents + " attended · " + episode.returnPlan.status
                      : "Not started"}
                  </td>
                  <td>{new Date(episode.lastSignalAt).toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan={7}>No active Recovery Episodes.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">School-side incident protection</div>
            <h2>Investigate clusters before blaming students</h2>
          </div>
          <span className="data-badge">{incidents.filter((item) => item.status === "open" || item.status === "investigating").length} active</span>
        </div>
        <div className="case-stack">
          {incidents.length ? incidents.map((incident) => (
            <article className="case-card incident-card" key={incident.id}>
              <div className="case-topline">
                <strong>{incident.sessionTitle}</strong>
                <span>{incident.status}</span>
              </div>
              <h3>{incident.missingCount}/{incident.scheduledCount} students not participating · {(incident.missingRate * 100).toFixed(0)}%</h3>
              <p>{incident.campusName ?? "No campus"} · {new Date(incident.startsAt).toLocaleString()}</p>
              <IncidentActions
                incidentId={incident.id}
                status={incident.status}
                incidentType={incident.incidentType}
                ownerUserId={incident.ownerUserId}
                members={recoveryMembers}
              />
            </article>
          )) : <p className="muted-copy">No session incidents detected.</p>}
        </div>
      </section>
    </div>
  );
}
