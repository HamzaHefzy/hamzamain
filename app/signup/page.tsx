import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import SignupForm from "@/components/SignupForm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/assistant");

  return (
    <div className="public-form-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Operator home"><Logo /></Link>
        <Link href="/login" className="m-button light compact">Sign in</Link>
      </header>
      <main className="auth-card">
        <div className="m-kicker">Start delegating</div>
        <h1>Create your Operator</h1>
        <p>Your workspace starts with default-deny authority. Operator asks before consequential actions until you explicitly grant a rule.</p>
        <SignupForm />
        <div className="auth-help">Already have an account? <Link href="/login">Sign in.</Link></div>
      </main>
    </div>
  );
}
