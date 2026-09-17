"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Logo from "./Logo";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/funding", label: "Funding" },
  { href: "/virtual", label: "Virtual" },
  { href: "/virtual/show-up", label: "Show-Up" },
  { href: "/cases", label: "ResolutionOS" },
];

function isActive(pathname: string, href: string) {
  if (href === "/cases") return pathname === href || pathname.startsWith("/cases/");
  return pathname === href;
}

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar app-sidebar" aria-label="Primary navigation">
        <div>
          <Link href="/" className="app-logo-link" aria-label="Anchor home">
            <Logo />
          </Link>
          <p className="brand-subtitle">Attendance resolution and revenue assurance</p>
        </div>

        <nav className="nav app-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? "active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Anchor prototype</strong>
          <span>Synthetic operating data</span>
        </div>
      </aside>

      <main className="main-content">
        {children}
        <footer className="app-footer">
          <span>© 2026 Anchor. Internal product prototype.</span>
          <Link href="/">Back to public site</Link>
        </footer>
      </main>
    </div>
  );
}
