"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";

const links = [
  ["/product", "Product"],
  ["/demo", "Demo"],
  ["/use-cases", "Use cases"],
  ["/integrations", "Integrations"],
  ["/pricing", "Pricing"],
] as const;

export default function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="y-public-nav">
        <Link href="/" className="y-public-brand" aria-label="Yumna home" onClick={() => setOpen(false)}><Logo /></Link>
        <nav className="y-public-links" aria-label="Public navigation">
          {links.map(([href,label]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>{label}</Link>
          ))}
        </nav>
        <div className="y-public-actions">
          <Link href="/login" className="y-text-link">Sign in</Link>
          <Link href="/signup" className="y-primary-link">Start free</Link>
          <button
            type="button"
            className="y-public-menu"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <i/><i/><i/>
          </button>
        </div>
      </header>
      <div className={"y-public-mobile" + (open ? " open" : "")}>
        <nav aria-label="Mobile navigation">
          {links.map(([href,label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<span>→</span></Link>
          ))}
          <Link href="/security" onClick={() => setOpen(false)}>Security<span>→</span></Link>
          <Link href="/login" onClick={() => setOpen(false)}>Sign in<span>→</span></Link>
        </nav>
      </div>
    </>
  );
}
