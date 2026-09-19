import Link from "next/link";
import Logo from "@/components/Logo";
import ResetPasswordForm from "@/components/ResetPasswordForm";

type Props = { params: Promise<{ token: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;
  return (
    <div className="public-form-page">
      <header className="public-form-header"><Link href="/"><Logo /></Link></header>
      <main className="auth-card">
        <div className="m-kicker">Account recovery</div>
        <h1>Choose a new password</h1>
        <p>Use at least 12 characters and avoid reusing a password from another service.</p>
        <ResetPasswordForm token={token} />
      </main>
    </div>
  );
}
