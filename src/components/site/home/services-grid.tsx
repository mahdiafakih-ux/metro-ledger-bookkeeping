import { ArrowRight, Building2, Car, FileSignature, Home as HomeIcon, Landmark, Scale } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";

const SERVICE_CATEGORIES = [
  { icon: HomeIcon, label: "Real Estate Documents" },
  { icon: Scale, label: "Power of Attorney" },
  { icon: Landmark, label: "Financial Documents" },
  { icon: Car, label: "Vehicle Documents" },
  { icon: FileSignature, label: "Affidavits & Jurats" },
  { icon: Building2, label: "Business Documents" },
];

export function ServicesGrid() {
  return (
    <section data-services className="relative overflow-hidden bg-navy-50 py-28">
      <div data-services-grid-bg aria-hidden className="light-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="What We Notarize" title="Document categories we handle every day" />
        </div>
        <div data-card3d-grid className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {SERVICE_CATEGORIES.map((c) => (
            <div key={c.label} data-card3d className="h-full">
              <div
                data-tilt
                data-spotlight
                style={{ ["--spot-color" as string]: "rgba(59,107,255,0.10)" }}
                className="spotlight group relative flex h-full flex-col items-center gap-4 overflow-hidden rounded-2xl border border-white bg-white px-4 py-8 text-center shadow-[0_10px_30px_-18px_rgba(10,17,40,0.35)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-25px_rgba(35,84,235,0.45)]"
              >
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100 text-accent-600 transition-[transform,background-color,color] duration-500 ease-out group-hover:-translate-y-1 group-hover:-rotate-6 group-hover:bg-accent-500 group-hover:text-white">
                  <c.icon className="h-6 w-6" />
                </div>
                <p className="relative z-10 text-sm font-semibold text-navy-800">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div data-reveal className="mt-12 text-center">
          <LinkButton href="/services" variant="outline" size="md" className="bg-white">
            View All Services <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
