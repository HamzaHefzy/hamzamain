import ImportPanel from "@/components/ImportPanel";
import { requireSession } from "@/lib/auth";
import { getAttendanceOverview } from "@/lib/data-access";

export const dynamic = "force-dynamic";

const pct = (value: number | null) => value === null ? "—" : (value * 100).toFixed(1) + "%";

export default async function AttendancePage() {
  const session = await requireSession();
  const data = await getAttendanceOverview(session.orgId);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Attendance data</div>
          <h1>Bring official attendance into one operating record.</h1>
          <p className="lede">
            Import rosters and official attendance now; connect SIS/LMS feeds as they are configured. Every mutation remains scoped to {session.orgName}.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />Production data workspace</div>
      </header>

      <section className="panel">
        <div className="panel-heading">
          <div><div className="eyebrow">Ingestion</div><h2>Load district data</h2></div>
        </div>
        <div className="import-grid">
          <ImportPanel kind="students" />
          <ImportPanel kind="attendance" />
          <ImportPanel kind="virtual_evidence" />
          <ImportPanel kind="virtual_sessions" />
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Last 30 days</div><h2>Recorded attendance</h2></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Recorded student-days</th><th>Attendance</th><th>Absences</th></tr></thead>
              <tbody>
                {data.daily.length ? data.daily.map((row) => (
                  <tr key={row.date}><td>{row.date}</td><td>{row.total}</td><td>{pct(row.attendanceRate)}</td><td>{row.absences}</td></tr>
                )) : <tr><td colSpan={4}>No daily attendance has been imported yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Data operations</div><h2>Recent imports</h2></div></div>
          <div className="case-stack">
            {data.imports.length ? data.imports.map((item) => (
              <div className="case-card" key={item.id}>
                <div className="case-topline"><strong>{item.kind}</strong><span>{item.status}</span></div>
                <h3>{item.filename}</h3>
                <p>{item.rows_succeeded} succeeded · {item.rows_failed} failed · {item.rows_total} total</p>
              </div>
            )) : <p className="muted-copy">No imports yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
