import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  className,
  trackClassName,
  barClassName,
  animate = true,
}: {
  percent: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  animate?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-navy-100", trackClassName, className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400",
          animate && "animate-progress-fill",
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
