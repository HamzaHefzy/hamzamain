"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

const navItems = [
  { href: "/assistant", label: "Command center" },
  { href: "/assistant/activity", label: "Activity" },
  { href: "/assistant/routines", label: "Routines" },
  { href: "/assistant/memory", label: "Memory" },
  { href: "/assistant/contacts", label: "Contacts" },
  { href: "/assistant/places", label: "Places" },
  { href: "/assistant/authority", label: "Authority" },
  { href: "/assistant/connections", label: "Connections" },
  { href: "/assistant/billing", label: "Billing" },
  { href: "/assistant/privacy", label: "Data & privacy" },
];

const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/security",
  "/privacy",
]);

function isActive(pathname: string, href: string) {
  if (href === "/assistant") return pathname === href || pathname.startsWith("/assistant/tasks/");
  return pathname === href || pathname.startsWith(href + "/");
}

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (
    publicPaths.has(pathname) ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/verify-email/")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar app-sidebar" aria-label="Primary navigation">
        <div className="operator-shell-brand">
          <Link href="/assistant" className="app-logo-link" aria-label="Dexyra home">
            <Logo />
          </Link>
          <p className="operator-shell-subtitle">Your life&apos;s administrative operating layer</p>
        </div>

        <div className="operator-side-label">Workspace</div>
        <nav className="nav app-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Private by design</strong>
          <span>Every action is permissioned and auditable.</span>
          <LogoutButton />
        </div>
      </aside>

      <main className="main-content">
        {children}
        <footer className="app-footer">
          <span>© 2026 Dexyra.</span>
          <Link href="/">Public site</Link>
        </footer>
      </main>
    </div>
  );
}
