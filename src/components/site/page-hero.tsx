import { cn } from "@/lib/utils";

/**
 * Dark hero band for inner pages — same visual language as the homepage
 * (blueprint grid + soft light orbs), much lighter weight.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  subtitle,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Optional trailing words rendered with the brand gradient. */
  accent?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("page-hero", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-grid absolute inset-0" />
        <div data-float className="hero-orb -left-40 -top-40 h-[520px] w-[520px] [--orb:rgba(59,107,255,0.35)]" />
        <div data-float className="hero-orb -right-40 top-10 h-[460px] w-[460px] [--orb:rgba(102,144,255,0.22)]" />
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        <p data-reveal className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-accent-300">
          {eyebrow}
        </p>
        <h1 data-reveal className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
          {title} {accent && <span className="text-gradient">{accent}</span>}
        </h1>
        {subtitle && (
          <p data-reveal className="mx-auto mt-6 max-w-xl text-lg text-navy-200">
            {subtitle}
          </p>
        )}
        {children && (
          <div data-reveal className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
