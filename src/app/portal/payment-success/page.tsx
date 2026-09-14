"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PaymentStatus {
  status: "processing" | "paid" | "failed";
  invoiceId?: string;
  appointmentId?: string;
  amountCents?: number;
}

function ProcessingCard() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Payment Processing</CardTitle>
        </CardHeader>
        <CardBody className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            We're confirming your payment. This usually takes a moment...
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: "processing",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setPaymentStatus({ status: "failed" });
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const pollPaymentStatus = async () => {
      if (cancelled) return;

      try {
        const response = await fetch(
          `/api/payment-status?sessionId=${encodeURIComponent(sessionId)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payment status");
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.status === "paid" || data.status === "failed") {
          setPaymentStatus(data);
          setLoading(false);
          return;
        }

        attempts += 1;

        if (attempts >= 30) {
          setPaymentStatus({ status: "processing" });
          setLoading(false);
          return;
        }

        timeout = setTimeout(pollPaymentStatus, 1000);
      } catch (error) {
        console.error("Error polling payment status:", error);

        attempts += 1;

        if (attempts >= 30) {
          setPaymentStatus({ status: "processing" });
          setLoading(false);
          return;
        }

        timeout = setTimeout(pollPaymentStatus, 1000);
      }
    };

    pollPaymentStatus();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [sessionId]);

  if (loading || paymentStatus.status === "processing") {
    return <ProcessingCard />;
  }

  if (paymentStatus.status === "paid") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-center text-green-900">
              ✓ Payment Received
            </CardTitle>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Thank you! Your payment has been successfully processed.
              </p>

              {paymentStatus.amountCents !== undefined && (
                <p className="text-lg font-semibold text-green-900 mt-2">
                  ${(paymentStatus.amountCents / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Link href="/portal/invoices" className="block">
                <Button className="w-full" variant="primary">
                  View Invoices
                </Button>
              </Link>

              <Link href="/portal/payments" className="block">
                <Button className="w-full" variant="outline">
                  View Payments
                </Button>
              </Link>

              <Link href="/portal/dashboard" className="block">
                <Button className="w-full" variant="ghost">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-center text-red-900">
            Payment Issue
          </CardTitle>
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <p className="text-sm text-red-800">
              We encountered an issue processing your payment. Please try again
              or contact support if the problem persists.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/portal/invoices" className="block">
              <Button className="w-full" variant="primary">
                Back to Invoices
              </Button>
            </Link>

            <Link href="/portal/support" className="block">
              <Button className="w-full" variant="outline">
                Contact Support
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<ProcessingCard />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
