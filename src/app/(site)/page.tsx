import type { Metadata } from "next";
import { getActivePricingPlans, getBusinessSettings } from "@/lib/settings";
import { HomeAnimations } from "@/components/site/home-animations";
import { HomeHero } from "@/components/site/home/hero";
import { TrustBar } from "@/components/site/home/trust-bar";
import { HowItWorks } from "@/components/site/home/how-it-works";
import { ServicesGrid } from "@/components/site/home/services-grid";
import { BusinessSection } from "@/components/site/home/business-section";
import { PricingShowcase } from "@/components/site/home/pricing-showcase";
import { CtaBanner } from "@/components/site/home/cta-banner";
import { TwoWays } from "@/components/site/home/two-ways";
import { WhyNotare } from "@/components/site/home/why-notare";

// Reads admin-editable business settings/pricing from the database on every
// request rather than baking them into the build — also keeps this off
// Next's static prerender pass, which would otherwise run at build time
// (before a database may even be reachable, e.g. a fresh Vercel deploy).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Notar-E Services | Mobile & Online Notary in Michigan" },
  description:
    "Notarization, wherever you are. Mobile notary services and remote online notarization for eligible documents across Southeast Michigan, plus Business10 and Business30 plans for teams.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [plans, settings] = await Promise.all([getActivePricingPlans(), getBusinessSettings()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NotaryPublic",
    name: settings.businessName,
    telephone: settings.phone,
    email: settings.email,
    areaServed: settings.serviceArea,
    address: { "@type": "PostalAddress", addressRegion: "MI", addressCountry: "US" },
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Notary services",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Mobile notary services" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Remote online notarization (eligible documents)" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Business notary plans" } },
      ],
    },
  };

  return (
    <HomeAnimations>
      <noscript>
        <style>{`[data-hero-item],[data-hero-headline],[data-hero-sub],[data-hero-visual]{opacity:1!important}`}</style>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeHero serviceArea={settings.serviceArea} headline={settings.heroHeadline} subheadline={settings.heroSubheadline} />
      <TrustBar />
      <TwoWays />
      <HowItWorks />
      <WhyNotare />
      <ServicesGrid />
      <BusinessSection />
      <PricingShowcase plans={plans} />
      <CtaBanner />
    </HomeAnimations>
  );
}
