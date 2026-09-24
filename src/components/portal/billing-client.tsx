"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { buttonClasses } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Opens the existing Stripe Customer Portal via POST /api/portal. The server
 * derives the Stripe customer from the signed-in session — nothing sensitive
 * is sent from the browser.
 */
export function BillingPortalButton({
  label = "Manage billing",
  variant = "secondary",
  className,
}: {
  label?: string;
  variant?: "primary" | "secondary" | "dark";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = (await res.json().catch(() => ({}))) as { portalUrl?: string; error?: string };
      if (!res.ok || !data.portalUrl) {
        toast.error(data.error || "Billing management is unavailable right now. Please contact us.");
        setLoading(false);
        return;
      }
      window.location.assign(data.portalUrl); // external Stripe-hosted page
    } catch {
      toast.error("Couldn't reach billing. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={open} disabled={loading} className={cn(buttonClasses(variant, "md"), className)}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}
