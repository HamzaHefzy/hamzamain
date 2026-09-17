import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Anchor",
  title: {
    default: "Anchor | Attendance Resolution & Revenue Assurance",
    template: "%s | Anchor",
  },
  description:
    "Attendance resolution and revenue assurance for school systems, beginning with Texas charter networks.",
  openGraph: {
    title: "Anchor | Attendance Resolution & Revenue Assurance",
    description:
      "See attendance trajectory, funding exposure, and unresolved student-support work in one operating system.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Primary navigation">
            <div>
              <div className="brand-mark" aria-hidden="true">A</div>
              <div className="brand">Anchor</div>
              <p className="brand-subtitle">Attendance resolution and revenue assurance</p>
            </div>
            <nav className="nav">
              <Link href="/">Executive</Link>
              <Link href="/funding">Funding</Link>
              <Link href="/cases">ResolutionOS</Link>
            </nav>
            <div className="sidebar-note">Synthetic Texas charter-network environment</div>
          </aside>
          <main className="main-content">
            {children}
            <footer className="app-footer">
              <span>© 2026 Anchor. Internal product prototype.</span>
              <span>Synthetic data only · No student-level financial valuation</span>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
