import Link from "next/link";
import Logo from "@/components/Logo";
import { verifyEmailToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  return (
    <div className="public-form-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Yumna home"><Logo /></Link>
      </header>
      <main className="auth-card">
        <div className="m-kicker">Email verification</div>
        {result.ok ? (
          <>
            <h1>Email verified.</h1>
            <p>Your Yumna workspace can now execute tasks and accept workspace changes.</p>
            <Link href="/assistant" className="m-button dark auth-submit">Open Yumna</Link>
          </>
        ) : (
          <>
            <h1>This verification link has expired.</h1>
            <p>Sign in to Yumna and request a fresh verification email from the banner at the top of your workspace.</p>
            <Link href="/login" className="m-button dark auth-submit">Sign in</Link>
          </>
        )}
      </main>
    </div>
  );
}
