import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-xs font-bold uppercase tracking-[0.2em]",
            light ? "text-accent-300" : "text-accent-600"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className={cn("text-3xl font-bold tracking-tight sm:text-4xl", light ? "text-white" : "text-navy-900")}>
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-lg leading-relaxed", light ? "text-navy-200" : "text-navy-500")}>
          {description}
        </p>
      )}
    </div>
  );
}
