"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon: "home" | "place" | "schedule" | "activity" | "memory" | "contacts" | "shield" | "apps" | "billing" | "privacy";
};

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Work",
    items: [
      { href: "/assistant", label: "Home", icon: "home" },
      { href: "/assistant/places", label: "Places", icon: "place" },
      { href: "/assistant/routines", label: "Routines", icon: "schedule" },
      { href: "/assistant/activity", label: "Activity", icon: "activity" },
    ],
  },
  {
    label: "Personal",
    items: [
      { href: "/assistant/memory", label: "Memory", icon: "memory" },
      { href: "/assistant/contacts", label: "Contacts", icon: "contacts" },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/assistant/authority", label: "Authority", icon: "shield" },
      { href: "/assistant/connections", label: "Connections", icon: "apps" },
      { href: "/assistant/billing", label: "Billing", icon: "billing" },
      { href: "/assistant/privacy", label: "Data & privacy", icon: "privacy" },
    ],
  },
];

const publicPaths = new Set(["/", "/login", "/signup", "/pricing", "/security", "/privacy"]);

function isActive(pathname: string, href: string) {
  if (href === "/assistant") return pathname === href || pathname.startsWith("/assistant/tasks/");
  return pathname === href || pathname.startsWith(href + "/");
}

function Icon({ name }: { name: NavItem["icon"] }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "place") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (name === "schedule") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/></svg>;
  if (name === "activity") return <svg {...common}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>;
  if (name === "memory") return <svg {...common}><path d="M9 4a3 3 0 0 1 6 0v1a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5.2A3 3 0 0 1 17 19h-2a3 3 0 0 1-6 0H7a3 3 0 0 1-3-4.8A3 3 0 0 1 6 9V8a3 3 0 0 1 3-3V4Z"/><path d="M12 5v14M8.5 9H12M12 14h3.5"/></svg>;
  if (name === "contacts") return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M17 8h4M17 12h4M17 16h3"/></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 4.5 6v5.5c0 4.5 3 7.7 7.5 9.5 4.5-1.8 7.5-5 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "apps") return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
  if (name === "billing") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>;
  return <svg {...common}><path d="M12 3 5 6v6c0 4.2 2.8 7.3 7 9 4.2-1.7 7-4.8 7-9V6l-7-3Z"/><path d="M9.5 12h5M12 9.5v5"/></svg>;
}

function currentLabel(pathname: string) {
  for (const group of groups) {
    const match = group.items.find((item) => isActive(pathname, item.href));
    if (match) return match.label;
  }
  return "Yumna";
}

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (
    publicPaths.has(pathname) ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/verify-email/")
  ) return <>{children}</>;

  const navigation = (
    <>
      {groups.map((group) => (
        <div className="app-nav-group" key={group.label}>
          <div className="app-nav-label">{group.label}</div>
          <nav className="app-nav" aria-label={group.label}>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href) ? "active" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </>
  );

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <Link href="/assistant" className="app-brand" aria-label="Yumna home">
          <Logo />
        </Link>
        <Link href="/assistant#delegate" className="app-new-task">
          <span aria-hidden>＋</span>
          New task
        </Link>
        <div className="app-sidebar-scroll">{navigation}</div>
        <div className="app-sidebar-footer">
          <div>
            <strong>Private by design</strong>
            <span>Permissioned · auditable · reversible</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {mobileOpen ? (
        <button className="app-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside className={"app-mobile-drawer" + (mobileOpen ? " open" : "")}>
        <div className="app-mobile-drawer-head">
          <Logo />
          <button aria-label="Close navigation" onClick={() => setMobileOpen(false)}>×</button>
        </div>
        <Link href="/assistant#delegate" className="app-new-task" onClick={() => setMobileOpen(false)}>＋ New task</Link>
        {navigation}
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button className="app-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <span/><span/><span/>
            </button>
            <span className="app-current-title">{currentLabel(pathname)}</span>
          </div>
          <div className="app-topbar-right">
            <Link href="/assistant/connections" className="app-topbar-action">
              <Icon name="apps" />
              <span>Apps</span>
            </Link>
            <Link href="/assistant/authority" className="app-avatar" aria-label="Authority and account controls">W</Link>
          </div>
        </header>

        <main className="main-content">
          {children}
          <footer className="app-footer">
            <span>© 2026 Yumna</span>
            <div><Link href="/security">Security</Link><Link href="/privacy">Privacy</Link><Link href="/">Public site</Link></div>
          </footer>
        </main>
      </div>
    </div>
  );
}
