"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { createNotary, setNotaryActive, updateNotary, type NotaryInput } from "@/lib/actions/notaries";

export interface NotaryRow {
  id: string;
  displayName: string;
  fullName: string;
  email: string;
  phone: string;
  photoUrl: string;
  isActive: boolean;
  upcoming: number;
  completed: number;
  preferredBy: number;
}

const EMPTY: NotaryInput = { displayName: "", fullName: "", email: "", phone: "", photoUrl: "" };

function NotaryForm({ initial, onDone, id }: { initial: NotaryInput; onDone: () => void; id?: string }) {
  const [form, setForm] = useState<NotaryInput>(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof NotaryInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = id ? await updateNotary(id, form) : await createNotary(form);
          if (!res.success) {
            toast.error(res.error);
            return;
          }
          toast.success(id ? "Notary updated" : "Notary added");
          router.refresh();
          onDone();
        });
      }}
    >
      <FormField label="Display name (shown to clients)" hint="Short and friendly, e.g. “Sarah M.”">
        <Input value={form.displayName} onChange={set("displayName")} required maxLength={60} />
      </FormField>
      <FormField label="Full name (internal)">
        <Input value={form.fullName} onChange={set("fullName")} maxLength={200} />
      </FormField>
      <FormField label="Email (internal)">
        <Input type="email" value={form.email} onChange={set("email")} />
      </FormField>
      <FormField label="Phone (internal)">
        <Input type="tel" value={form.phone} onChange={set("phone")} maxLength={30} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Photo URL (optional)" hint="https:// link to a real photo. Leave blank to show initials.">
          <Input value={form.photoUrl} onChange={set("photoUrl")} placeholder="https://" />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending}>{id ? "Save" : "Add notary"}</Button>
      </div>
    </form>
  );
}

export function NotaryManager({ notaries }: { notaries: NotaryRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-4">
      {adding ? (
        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <p className="mb-4 font-semibold text-navy-900">Add a notary</p>
          <NotaryForm initial={EMPTY} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add notary</Button>
      )}

      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
        {notaries.length === 0 ? (
          <p className="p-10 text-center text-sm text-navy-400">
            No notaries yet. Add yourself (and any team members) so appointments can be assigned and clients can choose preferred notaries.
          </p>
        ) : (
          <ul className="divide-y divide-navy-100">
            {notaries.map((n) => (
              <li key={n.id} className="p-5">
                {editing === n.id ? (
                  <NotaryForm
                    id={n.id}
                    initial={{ displayName: n.displayName, fullName: n.fullName, email: n.email, phone: n.phone, photoUrl: n.photoUrl }}
                    onDone={() => setEditing(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                      {n.displayName.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-semibold text-navy-900">
                        {n.displayName}
                        {!n.isActive && <Badge tone="neutral">Inactive</Badge>}
                      </p>
                      <p className="text-xs text-navy-400">
                        {[n.fullName, n.email, n.phone].filter(Boolean).join(" · ") || "No internal details"}
                      </p>
                    </div>
                    <div className="flex gap-4 text-center text-xs text-navy-400">
                      <div><p className="text-base font-bold text-navy-900">{n.upcoming}</p>Upcoming</div>
                      <div><p className="text-base font-bold text-navy-900">{n.completed}</p>Completed</div>
                      <div><p className="text-base font-bold text-navy-900">{n.preferredBy}</p>Preferred by</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(n.id)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const res = await setNotaryActive(n.id, !n.isActive);
                            if (!res.success) return void toast.error(res.error);
                            toast.success(n.isActive ? `${n.displayName} deactivated` : `${n.displayName} reactivated`);
                            router.refresh();
                          })
                        }
                      >
                        {n.isActive ? <><UserX className="h-3.5 w-3.5" /> Deactivate</> : <><UserCheck className="h-3.5 w-3.5" /> Reactivate</>}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
