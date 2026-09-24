// Server-safe portal UI primitives (no hooks, no client JS).
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusView, Tone } from "@/lib/portal/present";
import { initials } from "@/lib/portal/present";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-navy-950 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  className,
  children,
  as: As = "section",
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cn(
        "rounded-xl border border-navy-100 bg-white shadow-[0_1px_2px_rgba(10,17,40,0.04)]",
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  id,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4">
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-semibold text-navy-950">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-navy-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const TONE_CLASSES: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-navy-50 text-navy-600 ring-navy-100", dot: "bg-navy-300" },
  blue: { pill: "bg-navy-50 text-navy-800 ring-navy-100", dot: "bg-accent-500" },
  accent: { pill: "bg-accent-100 text-accent-700 ring-accent-200", dot: "bg-accent-600" },
  green: { pill: "bg-success-100 text-success-600 ring-success-100", dot: "bg-success-500" },
  amber: { pill: "bg-warning-100 text-warning-600 ring-warning-100", dot: "bg-warning-500" },
  red: { pill: "bg-danger-100 text-danger-600 ring-danger-100", dot: "bg-danger-500" },
};

export function StatusPill({ status, className }: { status: StatusView; className?: string }) {
  const t = TONE_CLASSES[status.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ring-1 ring-inset",
        t.pill,
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {status.label}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-6 py-8" : "px-6 py-14")}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy-100 bg-navy-50 text-navy-400">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-navy-950">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Primary/secondary portal buttons rendered as links. */
export function PortalLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(buttonClasses(variant, size), className)} {...rest}>
      {children}
    </Link>
  );
}

export function buttonClasses(variant: "primary" | "secondary" | "ghost" | "dark" = "primary", size: "sm" | "md" | "lg" = "md") {
  return cn(
    "portal-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-8 px-3 text-[13px]",
    size === "md" && "h-10 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-[15px]",
    variant === "primary" && "bg-accent-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_1px_2px_rgba(35,84,235,0.35)] hover:bg-accent-700",
    variant === "dark" && "bg-navy-950 text-white hover:bg-navy-800",
    variant === "secondary" && "border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50",
    variant === "ghost" && "text-navy-700 hover:bg-navy-50"
  );
}

export function NotaryAvatar({
  name,
  photoUrl,
  size = 40,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (photoUrl && /^https:\/\//.test(photoUrl)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-provided external URL; no remotePatterns configured
      <img
        src={photoUrl}
        alt=""
        style={style}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-navy-100", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-navy-900 font-semibold tracking-wide text-white",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-navy-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-navy-900">{children}</dd>
    </div>
  );
}

/**
 * Usage meter for Business 30. `used` may exceed `included`; the overage
 * portion is drawn in amber past a marker at the included limit.
 */
export function UsageMeter({ used, included }: { used: number; included: number }) {
  const over = Math.max(0, used - included);
  const scale = Math.max(included, used) || 1;
  const withinPct = (Math.min(used, included) / scale) * 100;
  const overPct = (over / scale) * 100;
  const markerPct = (included / scale) * 100;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={included}
      aria-valuenow={used}
      aria-label={`${used} of ${included} included appointments used`}
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-navy-100"
    >
      <div className="portal-meter-fill absolute inset-y-0 left-0 flex" style={{ width: `${withinPct + overPct}%` }}>
        <div className="h-full bg-accent-600" style={{ width: `${(withinPct / (withinPct + overPct || 1)) * 100}%` }} />
        {over > 0 && <div className="h-full flex-1 bg-warning-500" />}
      </div>
      {over > 0 && (
        <div aria-hidden className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `calc(${markerPct}% - 1px)` }} />
      )}
    </div>
  );
}
