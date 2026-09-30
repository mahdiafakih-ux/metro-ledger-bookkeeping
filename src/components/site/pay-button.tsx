"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PayButton({
  action,
  targetId,
  label = "Pay with Card",
}: {
  action: (id: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  targetId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await action(targetId);
    if (!res.success || !res.url) {
      setError(res.error ?? "Could not start checkout. Please try again.");
      setLoading(false);
      return;
    }
    window.location.href = res.url;
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} size="lg" className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {label}
      </Button>
      {error && <p className="mt-2 text-sm font-medium text-danger-600">{error}</p>}
    </div>
  );
}
