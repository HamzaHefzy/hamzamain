"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/attendance", label: "Attendance" },
  { href: "/cases", label: "ResolutionOS" },
  { href: "/virtual", label: "Virtual" },
  { href: "/virtual/show-up", label: "Show-Up" },
  { href: "/funding", label: "Funding" },
  { href: "/integrations", label: "Integrations" },
  { href: "/team", label: "Team" },
];

const publicPaths = new Set(["/", "/login", "/request-demo", "/pricing"]);

function isActive(pathname: string, href: string) {
  if (href === "/cases") return pathname === href || pathname.startsWith("/cases/");
  if (href === "/virtual") return pathname === href;
  return pathname === href;
}

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (publicPaths.has(pathname) || pathname === "/forgot-password" || pathname.startsWith("/check-in/") || pathname.startsWith("/invite/") || pathname.startsWith("/reset-password/")) {
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
          <strong>Secure workspace</strong>
          <span>Organization-scoped student records</span>
          <LogoutButton />
        </div>
      </aside>

      <main className="main-content">
        {children}
        <footer className="app-footer">
          <span>© 2026 Anchor.</span>
          <Link href="/">Public site</Link>
        </footer>
      </main>
    </div>
  );
}
