import { ClientForm } from "@/components/admin/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">New Client</h1>
        <p className="mt-1 text-sm text-navy-400">Add a client to your CRM.</p>
      </div>
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <ClientForm />
      </div>
    </div>
  );
}
