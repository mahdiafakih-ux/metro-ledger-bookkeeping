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
    default: "Notar-E Services | Mobile & Online Notary in Michigan",
    template: "%s | Notar-E Services",
  },
  description:
    "Mobile notary services and remote online notarization (eligible documents) across Metro Detroit and Southeast Michigan. Business notary plans for title, lending, legal and real estate teams.",
  keywords: [
    "Michigan notary services",
    "mobile notary Michigan",
    "remote online notarization Michigan",
    "online notary Michigan",
    "business notary services",
    "Metro Detroit notary",
    "Dearborn notary",
  ],
  openGraph: {
    title: "Notar-E Services | Mobile & Online Notary in Michigan",
    description:
      "Mobile notary and remote online notarization for eligible documents, plus business plans — across Metro Detroit and Southeast Michigan.",
    url: siteUrl,
    siteName: "Notar-E Services",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notar-E Services | Mobile & Online Notary in Michigan",
    description:
      "Mobile notary and remote online notarization for eligible documents, plus business plans — across Southeast Michigan.",
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
