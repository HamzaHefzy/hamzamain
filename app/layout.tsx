import type { Metadata } from "next";
import RouteShell from "@/components/RouteShell";
import "./globals.css";
import "./marketing.css";
import "./forms.css";
import "./operator.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Dexyra",
  title: {
    default: "Dexyra | Your right hand for real life",
    template: "%s | Dexyra",
  },
  description:
    "A personal execution assistant that can find businesses, make calls, work across your apps, book, follow up, and own real-world tasks through completion.",
  openGraph: {
    title: "Dexyra | Your right hand for real life",
    description:
      "Delegate calls, appointments, reservations, app actions, follow-ups, and administrative work to one trusted right hand.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
