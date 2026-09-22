import Link from "next/link";
import Logo from "@/components/Logo";

export default function PublicFooter() {
  return (
    <footer className="y-public-footer">
      <div className="y-public-footer-brand">
        <Logo />
        <p>Personal execution for the work around your life.</p>
      </div>
      <nav>
        <Link href="/product">Product</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/integrations">Integrations</Link>
        <Link href="/security">Security</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
      <span>© 2026 Yumna</span>
    </footer>
  );
}
