"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-navy-100 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_20px_50px_-35px_rgba(10,17,40,0.35)]">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-navy-50/60 sm:px-6"
          >
            <span className="font-semibold text-navy-900">{item.q}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180 text-accent-600" : "text-navy-400"}`} />
          </button>
          {open === i && <p className="animate-fade-in-up px-5 pb-5 text-sm leading-relaxed text-navy-500 sm:px-6">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
