import type { Metadata } from "next";
import { ShieldCheck, Zap, Users, Award } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description: "Notar-E Services is a Michigan-commissioned notary company built for speed, professionalism, and convenience.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-navy-950 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent-300">About Notar-E Services</p>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Notarization, reimagined for Michigan</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-200">
            We started Notar-E Services because getting a document notarized shouldn&apos;t mean
            driving across town, waiting in a lobby, or playing phone tag. We built a modern,
            technology-driven notary company that meets individuals and businesses where they are.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Our Mission" title="Make notarization simple, professional, and convenient" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: "Speed", desc: "Appointments booked online in minutes, completed in about 20." },
            { icon: ShieldCheck, title: "Trust", desc: "Michigan-commissioned, bonded, and insured." },
            { icon: Users, title: "Convenience", desc: "In-person and remote/online options, on your schedule." },
            { icon: Award, title: "Professionalism", desc: "A modern experience for individuals and businesses alike." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-navy-100 p-6 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-navy-900">{v.title}</h3>
              <p className="mt-2 text-sm text-navy-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy-50 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy-900">Commissioned & compliant</h2>
          <p className="mt-4 leading-relaxed text-navy-500">
            Notar-E Services operates in full compliance with Michigan notary law, including statutory
            fee limits under MCL 55.287. We are transparent about what is a notarial fee and what is a
            separately-disclosed service charge — always. Notar-E Services is not a law firm and does
            not provide legal advice.
          </p>
          <LinkButton href="/book" size="lg" className="mt-8">Book an Appointment</LinkButton>
        </div>
      </section>
    </div>
  );
}
