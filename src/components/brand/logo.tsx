import { useId } from "react";

// Original Notar-E Services mark: an "N" monogram on a rounded badge with a
// verification checkmark accent — evokes signature, security, and digital
// verification without relying on any external assets or fonts-as-logo.
type IconProps = {
  size?: number;
  className?: string;
};

export function NotareIcon({ size = 40, className }: IconProps) {
  // Unique per instance: a shared gradient id breaks the badge wherever the
  // first instance on the page is inside a display:none container.
  const gradientId = `notare-badge-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Notar-E Services icon"
    >
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <path
        d="M20 46V18h6.2L38 38.2V18h6v28h-6.2L26 27.6V46h-6Z"
        fill="white"
      />
      <circle cx="48" cy="48" r="11" fill="#3B6BFF" stroke="#050914" strokeWidth="2" />
      <path
        d="M43.2 48.2 46.6 51.6 53 44.8"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#131F3D" />
          <stop offset="1" stopColor="#050914" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function NotareIconMono({ size = 40, className, color = "#ffffff" }: IconProps & { color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Notar-E Services icon"
    >
      <rect width="64" height="64" rx="16" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M20 46V18h6.2L38 38.2V18h6v28h-6.2L26 27.6V46h-6Z" fill={color} />
      <circle cx="48" cy="48" r="11" fill="none" stroke={color} strokeWidth="2.5" />
      <path
        d="M43.2 48.2 46.6 51.6 53 44.8"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

type LogoProps = {
  variant?: "dark" | "light"; // dark = for light backgrounds (navy text), light = for dark backgrounds (white text)
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  className?: string;
};

const SIZE_MAP = {
  sm: { icon: 28, text: "text-lg", tagline: "text-[10px]" },
  md: { icon: 36, text: "text-xl", tagline: "text-xs" },
  lg: { icon: 48, text: "text-2xl", tagline: "text-xs" },
};

export function NotareLogo({ variant = "dark", size = "md", withTagline = false, className }: LogoProps) {
  const s = SIZE_MAP[size];
  const textColor = variant === "dark" ? "text-navy-900" : "text-white";
  const taglineColor = variant === "dark" ? "text-navy-400" : "text-navy-200";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <NotareIcon size={s.icon} />
      <span className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight ${s.text} ${textColor}`}>
          Notar-E <span className="text-accent-500">Services</span>
        </span>
        {withTagline && (
          <span className={`mt-0.5 font-medium uppercase tracking-widest ${s.tagline} ${taglineColor}`}>
            Michigan Notary
          </span>
        )}
      </span>
    </span>
  );
}
