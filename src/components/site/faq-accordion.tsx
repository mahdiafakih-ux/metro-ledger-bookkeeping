"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-navy-100 rounded-2xl border border-navy-100">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="font-semibold text-navy-900">{item.q}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-navy-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && <p className="px-6 pb-5 text-sm leading-relaxed text-navy-500">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
