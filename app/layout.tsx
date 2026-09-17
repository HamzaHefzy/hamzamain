import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anchor",
  description: "Attendance resolution and revenue assurance for school systems",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div>
              <div className="brand">Anchor</div>
              <p className="brand-subtitle">Attendance resolution + revenue assurance</p>
            </div>
            <nav className="nav">
              <Link href="/">Executive</Link>
              <Link href="/funding">Funding</Link>
              <Link href="/cases">ResolutionOS</Link>
            </nav>
            <div className="sidebar-note">Synthetic Texas charter-network MVP</div>
          </aside>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
