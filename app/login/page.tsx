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
        <Link href="/" aria-label="Dexyra home"><Logo /></Link>
        <Link href="/signup" className="m-button light compact">Create account</Link>
      </header>
      <main className="auth-card">
        <div className="m-kicker">Your private workspace</div>
        <h1>Sign in to Dexyra</h1>
        <p>Hand off calls, bookings, app work, follow-ups, scheduling, and the administrative load you do not want to carry.</p>
        <LoginForm />
        <div className="auth-help">
          New to Dexyra? <Link href="/signup">Create your workspace.</Link>
        </div>
      </main>
    </div>
  );
}
