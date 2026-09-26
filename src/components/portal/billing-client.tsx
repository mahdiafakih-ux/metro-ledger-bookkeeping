"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

type Client = {
  id: string;
  stripeCustomerId: string;
};

/**
 * Opens the Stripe Billing Portal (payment methods, invoices, cancellation).
 * Pass `businessId` for a business subscription; the server resolves the
 * Stripe customer from the database and checks the caller's role.
 */
export function BillingClient({ client, businessId, label = "Manage Billing" }: { client?: Client; businessId?: string; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function openStripePortal() {
    if (!businessId && !client?.stripeCustomerId) {
      toast.error("No billing account found");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessId ? { businessId } : {}),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }

      // Redirect to Stripe Customer Portal
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-navy-900">Payment method, receipts &amp; cancellation</h3>
            <p className="text-sm text-navy-600 mt-1">Opens Stripe&apos;s secure billing portal.</p>
          </div>
          <Button onClick={openStripePortal} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {label}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
