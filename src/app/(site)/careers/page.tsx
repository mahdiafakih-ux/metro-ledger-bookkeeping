import type { Metadata } from "next";
import {
  Laptop,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
  Users,
  FileSignature,
  Video,
  BarChart2,
  Settings,
} from "lucide-react";
import { CareerApplicationForm } from "@/components/site/career-application-form";

export const metadata: Metadata = {
  title: "Careers | Join the Notar-E Network",
  description:
    "Join the Notar-E Services network. We're building the future of professional notarization across Metro Detroit and Southeast Michigan. Commissioned notaries, signing agents, and mobile notaries welcome.",
};

const benefits = [
  {
    icon: Laptop,
    title: "Technology-Driven",
    description:
      "We use modern tools to streamline booking, scheduling, and customer communication.",
  },
  {
    icon: Clock,
    title: "Flexible Work",
    description:
      "Set your own hours and take appointments that fit your schedule and location.",
  },
  {
    icon: TrendingUp,
    title: "Professional Growth",
    description:
      "Grow your notary practice within a structured, supportive network.",
  },
  {
    icon: Zap,
    title: "Modern Experience",
    description:
      "We invest in training, tools, and systems that make your work easier.",
  },
];

const roles = [
  {
    icon: FileSignature,
    title: "Commissioned Notaries",
    description: "Michigan-commissioned notaries for mobile appointments.",
  },
  {
    icon: Users,
    title: "Mobile Notaries",
    description: "Professionals comfortable traveling to client locations.",
  },
  {
    icon: FileSignature,
    title: "Notary Signing Agents",
    description: "Experienced with loan document signing packages.",
  },
  {
    icon: Video,
    title: "Remote Online Notaries",
    description: "Certified for remote online notarization.",
  },
  {
    icon: BarChart2,
    title: "Business Development",
    description: "Help grow our network of business partners.",
  },
  {
    icon: Settings,
    title: "Operations",
    description: "Support scheduling, coordination, and client management.",
  },
];

const values = [
  { icon: CheckCircle2, label: "Professionalism" },
  { icon: CheckCircle2, label: "Reliability" },
  { icon: CheckCircle2, label: "Accuracy" },
  { icon: CheckCircle2, label: "Communication" },
  { icon: CheckCircle2, label: "Customer Service" },
  { icon: CheckCircle2, label: "Growth Mindset" },
];

export default function CareersPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-accent-400/30 bg-accent-600/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent-300">
            Join Our Team
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Build the future of notarization with us.
          </h1>
          <p className="mt-5 text-lg text-navy-300">
            We&apos;re growing a network of professional notaries committed to convenience,
            accuracy, and exceptional service.
          </p>
          <a
            href="#apply"
            className="mt-8 inline-block rounded-xl bg-accent-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-accent-700 transition-colors"
          >
            Apply Now
          </a>
        </div>
      </section>

      {/* ── Why Notar-E ───────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-navy-900">Why Notar-E</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-navy-100 bg-navy-50 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who We're Looking For ─────────────────────────────────────── */}
      <section className="bg-navy-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center">
            <h2 className="text-3xl font-bold text-navy-900">Who we&apos;re looking for</h2>
            <p className="mt-3 text-navy-500">
              We welcome both experienced professionals and motivated newcomers to the notarial field.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-navy-100 bg-white p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-navy-900">{title}</h3>
                <p className="mt-1 text-sm text-navy-500">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-navy-400">
            Roles marked &ldquo;Join Our Network&rdquo; are open for expressions of interest. We&apos;ll reach out as opportunities match your profile.
          </p>
        </div>
      </section>

      {/* ── What We Value ─────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-navy-900">What we value</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {values.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-navy-100 py-5 text-center"
              >
                <Icon className="h-5 w-5 text-accent-600" />
                <span className="text-xs font-semibold text-navy-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ──────────────────────────────────────────── */}
      <section id="apply" className="bg-navy-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-navy-900">Express your interest</h2>
            <p className="mt-3 text-navy-500">
              Fill out the form below and we&apos;ll be in touch when a matching opportunity opens.
            </p>
          </div>
          <div className="rounded-3xl border border-navy-100 bg-white p-8 shadow-sm">
            <CareerApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
