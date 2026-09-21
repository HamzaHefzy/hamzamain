import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import DailyLaunchForm from "@/components/DailyLaunchForm";
import { getDailyLaunchContext } from "@/lib/daily-launch-service";

type Props = { params: Promise<{ token: string }> };
export const dynamic = "force-dynamic";

export default async function DailyLaunchPage({ params }: Props) {
  const { token } = await params;
  const context = await getDailyLaunchContext(token);
  if (!context) notFound();

  return (
    <div className="public-form-page daily-launch-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Anchor home"><Logo /></Link>
        <span className="data-badge">Daily Launch</span>
      </header>

      <main className="daily-launch-card">
        <div className="m-kicker">Your school day</div>
        <h1>Good morning, {context.firstName}.</h1>
        <p>
          Here is what is scheduled today. You can enter class directly, or tell the support team now if something is likely to get in the way.
        </p>

        <section className="daily-schedule" aria-label="Today's schedule">
          {context.schedule.length ? context.schedule.map((session) => (
            <article key={session.id} className="daily-session">
              <time>
                {new Date(session.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </time>
              <div>
                <strong>{session.title}</strong>
                <span>Required instructional session</span>
              </div>
              {session.liveUrl ? (
                <a className="secondary-link" href={session.liveUrl} target="_blank" rel="noreferrer">Join class</a>
              ) : (
                <span className="muted-copy">Use your school class portal</span>
              )}
            </article>
          )) : <p className="muted-copy">No remaining required sessions are scheduled today.</p>}
        </section>

        {context.responded ? (
          <div className="checkin-success">
            Today’s response has already been submitted. You can still use the class links above.
          </div>
        ) : (
          <DailyLaunchForm token={token} />
        )}

        <p className="daily-launch-note">
          Anchor uses this response only to route attendance support. It is not a disciplinary form.
        </p>
      </main>
    </div>
  );
}
