import Link from "next/link";
import Logo from "@/components/Logo";

export default function PublicNav() {
  return (
    <header className="y-public-nav">
      <Link href="/" className="y-public-brand" aria-label="Yumna home"><Logo /></Link>
      <nav className="y-public-links" aria-label="Public navigation">
        <Link href="/product">Product</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/use-cases">Use cases</Link>
        <Link href="/integrations">Integrations</Link>
        <Link href="/pricing">Pricing</Link>
      </nav>
      <div className="y-public-actions">
        <Link href="/login" className="y-text-link">Sign in</Link>
        <Link href="/signup" className="y-primary-link">Start free</Link>
      </div>
    </header>
  );
}
