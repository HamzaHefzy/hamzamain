import type { Metadata } from "next";
import RouteShell from "@/components/RouteShell";
import "./globals.css";
import "./marketing.css";
import "./forms.css";
import "./operator.css";
import "./polish.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Yumna",
  title: {
    default: "Yumna | More time for your actual life",
    template: "%s | Yumna",
  },
  description:
    "A personal execution assistant that finds businesses, makes calls, works across your apps, books, follows up, and owns real-world tasks through completion.",
  openGraph: {
    title: "Yumna | More time for your actual life",
    description:
      "Delegate calls, appointments, reservations, connected-app work, follow-ups, and everyday administration.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><RouteShell>{children}</RouteShell></body>
    </html>
  );
}
