import type { Metadata } from "next";
// Disabled due to network access limitations
// import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Notar-E Services | Michigan Notary Public",
    template: "%s | Notar-E Services",
  },
  description:
    "Fast, professional mobile and online notary services across Metro Detroit and Southeast Michigan. Book a Michigan-commissioned notary in minutes — for individuals, real estate, title, and law firms.",
  keywords: [
    "Michigan Notary",
    "Mobile Notary Michigan",
    "Notary Services Michigan",
    "Online Notary Michigan",
    "Dearborn Notary",
    "Metro Detroit Notary",
    "Business Notary Services",
    "Notary for Title Companies",
    "Notary for Real Estate",
  ],
  openGraph: {
    title: "Notar-E Services | Michigan Notary Public",
    description:
      "Fast, professional mobile and online notary services across Metro Detroit and Southeast Michigan.",
    url: siteUrl,
    siteName: "Notar-E Services",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notar-E Services | Michigan Notary Public",
    description:
      "Fast, professional mobile and online notary services across Metro Detroit and Southeast Michigan.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-white text-navy-900">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
