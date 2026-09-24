"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import { NotareLogo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/portal/ui";

export default function PortalLoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/portal/login/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      toast.success("Code sent to your email");
      setStep("code");
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/portal/login/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      toast.success("Signed in");
      // The httpOnly session cookie is now set; navigate and re-render on the server.
      router.replace("/portal/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const fieldCls =
    "block w-full rounded-lg border border-navy-200 bg-white px-3.5 py-3 text-[15px] text-navy-950 placeholder:text-navy-300 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 disabled:opacity-60";

  return (
    <div className="portal-root flex min-h-dvh flex-col items-center justify-center bg-[#f6f7fb] px-4 py-12">
      <Link href="/" aria-label="Notar-E Services home" className="mb-8">
        <NotareLogo size="md" />
      </Link>
      <div className="portal-enter w-full max-w-[400px] rounded-2xl border border-navy-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,17,40,0.04),0_16px_40px_-20px_rgba(10,17,40,0.18)] sm:p-8">
        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.01em] text-navy-950">Sign in to your portal</h1>
              <p className="mt-1 text-sm text-navy-500">We&apos;ll email you a one-time code. No password needed.</p>
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={loading}
                className={fieldCls}
              />
            </div>
            {error && <p role="alert" className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{error}</p>}
            <button type="submit" disabled={loading} className={buttonClasses("primary", "lg") + " w-full"}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
              Email me a code
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-5" noValidate>
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.01em] text-navy-950">Check your email</h1>
              <p className="mt-1 text-sm text-navy-500">
                Enter the 6-digit code sent to <span className="font-medium text-navy-800">{email}</span>. It expires in 10 minutes.
              </p>
            </div>
            <div>
              <label htmlFor="code" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Access code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
                className={fieldCls + " tabular text-center font-mono text-2xl tracking-[0.5em]"}
              />
            </div>
            {error && <p role="alert" className="rounded-lg bg-danger-100 px-3 py-2 text-sm text-danger-600">{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} className={buttonClasses("primary", "lg") + " w-full"}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
              Verify & sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className={buttonClasses("ghost", "md") + " w-full"}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
      <p className="mt-6 flex items-center gap-1.5 text-xs text-navy-400">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Secure sign-in · Notar-E Services
      </p>
    </div>
  );
}
