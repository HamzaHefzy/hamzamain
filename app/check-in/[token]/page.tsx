import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import CheckinForm from "@/components/CheckinForm";
import { getCheckinContext } from "@/lib/show-up-service";

type Props = { params: Promise<{ token: string }> };
export const dynamic = "force-dynamic";

export default async function CheckinPage({ params }: Props) {
  const { token } = await params;
  const context = await getCheckinContext(token);
  if (!context) notFound();

  return (
    <div className="public-form-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Anchor home"><Logo /></Link>
      </header>
      <main className="auth-card checkin-card">
        <div className="m-kicker">Attendance support check-in</div>
        <h1>Hi {context.firstName}.</h1>
        {context.used ? (
          <div className="checkin-success">This check-in has already been submitted. Your school support team has the response.</div>
        ) : (
          <>
            <p>
              We noticed you may have missed {context.sessionTitle ? <strong>{context.sessionTitle}</strong> : "a required virtual session"}.
              This is not a punishment form. Tell us what got in the way so the school can route the right support.
            </p>
            <CheckinForm token={token} />
          </>
        )}
      </main>
    </div>
  );
}
