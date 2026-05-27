import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { BUILDER } from "@/config/builder";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BUILDER.links.liveUrl),
  title: {
    default: `Jetex Network Operations Control Tower · by ${BUILDER.name}`,
    template: `%s · Jetex Control Tower · ${BUILDER.name}`,
  },
  description: `Decision-support dashboard for senior ops managers across the Jetex FBO network. Portfolio project by ${BUILDER.name} (${BUILDER.location}) for the Jetex Operations Analyst role.`,
  authors: [{ name: BUILDER.name, url: BUILDER.links.linkedinUrl }],
  creator: BUILDER.name,
  applicationName: "Jetex Network Operations Control Tower",
  openGraph: {
    title: `Jetex Network Operations Control Tower · by ${BUILDER.name}`,
    description: `Built by ${BUILDER.name} — ${BUILDER.tagline}. Hiring portfolio for the Jetex Operations Analyst role.`,
    type: "website",
    locale: "en_US",
    url: BUILDER.links.liveUrl,
    siteName: "Jetex Control Tower",
  },
  twitter: {
    card: "summary_large_image",
    title: `Jetex Network Operations Control Tower · by ${BUILDER.name}`,
    description: `${BUILDER.tagline} — Hiring portfolio.`,
  },
  alternates: { canonical: BUILDER.links.liveUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} h-full`}>
      <body className="min-h-screen bg-jx-bg text-jx-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
