"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearDemoData } from "@/lib/actions/demo";

export function DemoDataSection({ demoDataSeeded }: { demoDataSeeded: boolean }) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  if (!demoDataSeeded) {
    return <p className="text-sm text-navy-400">Demo data has already been cleared. Your dashboard now reflects only real data.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-warning-100 bg-warning-100/30 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
        <div>
          <p className="font-semibold text-navy-900">Demo data is currently loaded</p>
          <p className="text-sm text-navy-500">Clear it once you&apos;re ready to start using Notar-E Services for real. This cannot be undone.</p>
        </div>
      </div>
      <Button
        variant="danger"
        disabled={clearing}
        onClick={async () => {
          if (!confirm("Permanently delete all demo data? This cannot be undone.")) return;
          setClearing(true);
          await clearDemoData();
          setClearing(false);
          toast.success("Demo data cleared");
          router.refresh();
        }}
      >
        {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Clear Demo Data
      </Button>
    </div>
  );
}
