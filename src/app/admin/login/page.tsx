"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { NotareLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { loginAction } from "@/lib/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loginAction({ email, password });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Login failed");
      return;
    }
    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-navy-800 bg-navy-900 p-8 shadow-2xl">
        <div className="flex justify-center">
          <NotareLogo variant="light" size="lg" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-navy-300">
          <Lock className="h-4 w-4" />
          <p className="text-sm font-medium">Notar-E Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label className="text-navy-300">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="!bg-navy-800 !border-navy-700 !text-white placeholder:!text-navy-500"
              placeholder="you@notareservices.com"
            />
          </div>
          <div>
            <Label className="text-navy-300">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="!bg-navy-800 !border-navy-700 !text-white placeholder:!text-navy-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm font-medium text-danger-500">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
