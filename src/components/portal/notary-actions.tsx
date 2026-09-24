"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Loader2, Star, X } from "lucide-react";
import { addPreferredNotary, removePreferredNotary, setPrimaryPreferredNotary } from "@/lib/actions/portal";
import { buttonClasses } from "./ui";
import { cn } from "@/lib/utils";

export function AddPreferredButton({
  notaryId,
  name,
  isPreferred,
  size = "sm",
  className,
}: {
  notaryId: string;
  name: string;
  isPreferred: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (isPreferred) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-700", className)}>
        <Heart className="h-4 w-4 fill-current" aria-hidden /> Preferred notary
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await addPreferredNotary(notaryId);
          if (res.success) {
            toast.success(`${name} added to your preferred notaries`);
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
      className={cn(buttonClasses("secondary", size), className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Heart className="h-4 w-4" aria-hidden />}
      Add {name} as preferred
    </button>
  );
}

export function PreferenceControls({
  preferenceId,
  name,
  isPrimary,
}: {
  preferenceId: string;
  name: string;
  isPrimary: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      {!isPrimary && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await setPrimaryPreferredNotary(preferenceId);
              if (res.success) {
                toast.success(`${name} is now your primary preferred notary`);
                router.refresh();
              } else toast.error(res.error);
            })
          }
          className={buttonClasses("ghost", "sm")}
        >
          <Star className="h-4 w-4" aria-hidden /> Make primary
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        aria-label={`Remove ${name} from preferred notaries`}
        onClick={() =>
          start(async () => {
            const res = await removePreferredNotary(preferenceId);
            if (res.success) {
              toast.success(`${name} removed from preferred notaries`);
              router.refresh();
            } else toast.error(res.error);
          })
        }
        className={cn(buttonClasses("ghost", "sm"), "px-2 text-navy-400 hover:text-danger-600")}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
