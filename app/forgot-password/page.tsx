import Link from "next/link";
import Logo from "@/components/Logo";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="public-form-page">
      <header className="public-form-header"><Link href="/"><Logo /></Link><Link href="/login" className="m-nav-secondary">Back to sign in</Link></header>
      <main className="auth-card">
        <div className="m-kicker">Account recovery</div>
        <h1>Reset your password</h1>
        <p>Enter your work email. If it belongs to an active Anchor account, we’ll send a one-hour reset link.</p>
        <ForgotPasswordForm />
      </main>
    </div>
  );
}
