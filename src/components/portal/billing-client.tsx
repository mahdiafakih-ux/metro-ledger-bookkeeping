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

export function BillingClient({ client }: { client: Client }) {
  const [loading, setLoading] = useState(false);

  async function openStripePortal() {
    if (!client.stripeCustomerId) {
      toast.error("Stripe customer ID not found");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: client.stripeCustomerId }),
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy-900">Payment Method & Subscription</h3>
            <p className="text-sm text-navy-600 mt-1">
              Manage your payment method, billing address, and subscription settings in the Stripe portal
            </p>
          </div>
          <Button onClick={openStripePortal} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Manage Billing
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
