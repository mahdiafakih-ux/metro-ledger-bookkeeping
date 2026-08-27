import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-navy-50 text-navy-700",
    accent: "bg-accent-100 text-accent-700",
    success: "bg-success-100 text-success-600",
    warning: "bg-warning-100 text-warning-600",
    danger: "bg-danger-100 text-danger-600",
  };
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-navy-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-navy-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
