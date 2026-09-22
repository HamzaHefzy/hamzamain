import type { Metadata } from "next";
import RouteShell from "@/components/RouteShell";
import "./globals.css";
import "./marketing.css";
import "./forms.css";
import "./operator.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Operator",
  title: {
    default: "Operator | Hand off the work around your life",
    template: "%s | Operator",
  },
  description:
    "A personal operations assistant that can call, coordinate, book, follow up, and keep ownership of real-world tasks until they are finished.",
  openGraph: {
    title: "Operator | Hand off the work around your life",
    description:
      "Delegate calls, appointments, reservations, errands, follow-ups, and administrative work to one trusted operating layer.",
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
