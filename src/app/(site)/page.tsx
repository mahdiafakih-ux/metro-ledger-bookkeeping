import { getActivePricingPlans, getBusinessSettings } from "@/lib/settings";
import { HomeAnimations } from "@/components/site/home-animations";
import { HomeHero } from "@/components/site/home/hero";
import { TrustBar } from "@/components/site/home/trust-bar";
import { HowItWorks } from "@/components/site/home/how-it-works";
import { ServicesGrid } from "@/components/site/home/services-grid";
import { BusinessSection } from "@/components/site/home/business-section";
import { PricingShowcase } from "@/components/site/home/pricing-showcase";
import { CtaBanner } from "@/components/site/home/cta-banner";

// Reads admin-editable business settings/pricing from the database on every
// request rather than baking them into the build — also keeps this off
// Next's static prerender pass, which would otherwise run at build time
// (before a database may even be reachable, e.g. a fresh Vercel deploy).
export const dynamic = "force-dynamic";

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
  };

  return (
    <HomeAnimations>
      <noscript>
        <style>{`[data-hero-item],[data-hero-headline],[data-hero-sub],[data-hero-visual]{opacity:1!important}`}</style>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeHero serviceArea={settings.serviceArea} headline={settings.heroHeadline} subheadline={settings.heroSubheadline} />
      <TrustBar />
      <HowItWorks />
      <ServicesGrid />
      <BusinessSection />
      <PricingShowcase plans={plans} />
      <CtaBanner />
    </HomeAnimations>
  );
}
