"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { buttonClasses } from "@/components/portal/ui";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-navy-950">Something didn&apos;t load</h1>
      <p className="mt-1 text-sm text-navy-500">
        This part of your portal couldn&apos;t be loaded. Your account and appointments are safe — please try again.
      </p>
      <button type="button" onClick={reset} className={buttonClasses("secondary", "md") + " mt-6"}>
        <RotateCcw className="h-4 w-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
