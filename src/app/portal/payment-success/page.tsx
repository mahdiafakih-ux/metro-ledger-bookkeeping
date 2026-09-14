"use client";

import { useEffect, useState } from "react";
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

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: "processing",
  });
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  // Poll for payment status from the database
  useEffect(() => {
    if (!sessionId) {
      setPaymentStatus({ status: "failed" });
      setLoading(false);
      return;
    }

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment-status?sessionId=${sessionId}`);
        if (!response.ok) throw new Error("Failed to fetch payment status");

        const data = await response.json();

        if (data.status === "paid" || data.status === "failed") {
          setPaymentStatus(data);
          setLoading(false);
        } else if (pollCount < 30) {
          // Continue polling for up to 30 seconds
          setPollCount(p => p + 1);
          setTimeout(pollPaymentStatus, 1000);
        } else {
          // Timeout after 30 seconds
          setPaymentStatus({ status: "processing" });
          setLoading(false);
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        if (pollCount < 30) {
          setPollCount(p => p + 1);
          setTimeout(pollPaymentStatus, 1000);
        }
      }
    };

    pollPaymentStatus();
  }, [sessionId, pollCount]);

  if (loading || paymentStatus.status === "processing") {
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
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId}
            </p>
          </CardBody>
        </Card>
      </div>
    );
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
              {paymentStatus.amountCents && (
                <p className="text-lg font-semibold text-green-900 mt-2">
                  ${(paymentStatus.amountCents / 100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
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

            <p className="text-xs text-gray-600 text-center">
              Session ID: {sessionId}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Failed or unknown status
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

          <p className="text-xs text-gray-600 text-center">
            Session ID: {sessionId}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
