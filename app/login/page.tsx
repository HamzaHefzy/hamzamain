import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="public-form-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Anchor home"><Logo /></Link>
        <Link href="/request-demo" className="m-button light compact">Request demo</Link>
      </header>

      <main className="auth-card">
        <div className="m-kicker">Secure workspace</div>
        <h1>Sign in to Anchor</h1>
        <p>Access attendance operations, virtual participation, ResolutionOS, funding impact, and district integrations.</p>
        <LoginForm />
        <div className="auth-help">
          New district or virtual program? <Link href="/request-demo">Request a working session.</Link>
        </div>
      </main>
    </div>
  );
}
