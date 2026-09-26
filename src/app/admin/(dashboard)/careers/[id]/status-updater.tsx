"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCareerApplicationStatus } from "@/lib/actions/careers";

const STATUSES = ["new", "reviewing", "interview", "approved", "rejected"] as const;

export function StatusUpdater({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleUpdate() {
    startTransition(async () => {
      await updateCareerApplicationStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        disabled={pending || status === currentStatus}
        onClick={handleUpdate}
        className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {pending ? "Saving..." : "Update Status"}
      </button>
    </div>
  );
}
