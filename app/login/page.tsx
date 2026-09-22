import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/assistant");

  return (
    <div className="public-form-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Operator home"><Logo /></Link>
        <Link href="/signup" className="m-button light compact">Create account</Link>
      </header>

      <main className="auth-card">
        <div className="m-kicker">Your private workspace</div>
        <h1>Sign in to Operator</h1>
        <p>Hand off calls, bookings, follow-ups, scheduling, and the administrative work you do not want to carry.</p>
        <LoginForm />
        <div className="auth-help">
          New to Operator? <Link href="/signup">Create your workspace.</Link>
        </div>
      </main>
    </div>
  );
}
