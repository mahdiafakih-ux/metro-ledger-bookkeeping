import { ShieldCheck } from "lucide-react";

export function ComplianceNote({ className }: { className?: string }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4 text-xs leading-relaxed text-navy-500 ${className ?? ""}`}>
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
      <p>
        <strong className="text-navy-700">Michigan compliance:</strong> Under Michigan law (MCL 55.287), the fee a
        notary may charge for a notarial act is capped at $10 per act. Amounts shown above beyond the statutory fee
        are for separately-disclosed, lawful business services (such as travel, signing-agent time, document
        handling, or administrative services) — never advertised as the notarization fee itself. Notar-E Services is
        not a law firm and does not provide legal advice.
      </p>
    </div>
  );
}
