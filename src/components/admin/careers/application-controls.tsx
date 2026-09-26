"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/careers";
import { deleteApplication, updateApplicationNotes, updateApplicationStatus } from "@/lib/actions/careers";
import { cn } from "@/lib/utils";

export function ApplicationControls({ id, status, notes }: { id: string; status: ApplicationStatus; notes: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(notes);

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Status</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {APPLICATION_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                aria-pressed={status === s}
                onClick={() =>
                  start(async () => {
                    const res = await updateApplicationStatus(id, s);
                    if (!res.success) toast.error(res.error);
                    else {
                      toast.success(`Marked ${APPLICATION_STATUS_LABELS[s]}`);
                      router.refresh();
                    }
                  })
                }
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold transition-colors",
                  status === s ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-600 hover:bg-navy-100"
                )}
              >
                {APPLICATION_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Private notes</p>
          <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Interview notes, follow-ups…" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            size="sm"
            disabled={pending || draft === notes}
            onClick={() =>
              start(async () => {
                const res = await updateApplicationNotes(id, draft);
                if (!res.success) toast.error(res.error);
                else {
                  toast.success("Notes saved");
                  router.refresh();
                }
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save notes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger-600 hover:bg-danger-100"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Permanently delete this application and resume?")) return;
              start(async () => {
                const res = await deleteApplication(id);
                if (!res.success) toast.error(res.error);
                else {
                  toast.success("Application deleted");
                  router.push("/admin/careers");
                }
              });
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
