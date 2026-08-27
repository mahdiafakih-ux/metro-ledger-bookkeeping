import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-navy-100 text-navy-700",
  blue: "bg-accent-100 text-accent-700",
  green: "bg-success-100 text-success-600",
  amber: "bg-warning-100 text-warning-600",
  red: "bg-danger-100 text-danger-600",
  dark: "bg-navy-900 text-white",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_TONES: Record<string, keyof typeof TONES> = {
  scheduled: "blue",
  completed: "green",
  cancelled: "neutral",
  no_show: "red",
  paid: "green",
  unpaid: "amber",
  draft: "neutral",
  sent: "blue",
  overdue: "red",
  new_lead: "blue",
  contacted: "blue",
  interested: "amber",
  proposal_sent: "amber",
  active_client: "green",
  recurring_client: "green",
  inactive: "neutral",
  lost: "red",
  won: "green",
  active: "green",
  lead: "blue",
  new: "blue",
  follow_up: "amber",
  meeting_booked: "green",
};
