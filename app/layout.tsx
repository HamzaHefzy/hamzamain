import type { Metadata } from "next";
import RouteShell from "@/components/RouteShell";
import "./globals.css";
import "./marketing.css";
import "./forms.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Anchor",
  title: {
    default: "Anchor | Attendance that actually gets solved",
    template: "%s | Anchor",
  },
  description:
    "Anchor helps districts and virtual schools turn attendance data into barrier resolution, verified support, virtual participation recovery, and clearer funding impact.",
  openGraph: {
    title: "Anchor | Attendance that actually gets solved",
    description:
      "Attendance resolution, virtual participation recovery, and funding impact in one operating system for schools.",
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
