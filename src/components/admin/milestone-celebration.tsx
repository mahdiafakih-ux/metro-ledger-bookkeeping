"use client";

import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { getUnseenMilestones, markMilestonesSeen } from "@/lib/actions/revenue";

const CONFETTI_COLORS = ["#3b6bff", "#16b364", "#d97706", "#ef4444", "#6690ff"];

function makeConfettiPieces() {
  return Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.6,
    duration: 1.2 + Math.random() * 1.2,
  }));
}

export function MilestoneCelebration() {
  const [milestone, setMilestone] = useState<{ id: string; amountCents: number } | null>(null);
  const [confetti] = useState(makeConfettiPieces);

  useEffect(() => {
    getUnseenMilestones().then((rows) => {
      if (rows.length > 0) setMilestone(rows[0]);
    });
  }, []);

  if (!milestone) return null;

  async function dismiss() {
    if (!milestone) return;
    await markMilestonesSeen([milestone.id]);
    setMilestone(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/70 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="animate-confetti absolute top-0 block h-2.5 w-2.5 rounded-sm"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="animate-celebrate relative mx-4 max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <PartyPopper className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-navy-900">Milestone Reached!</h2>
        <p className="mt-2 text-4xl font-extrabold text-accent-600">
          ${(milestone.amountCents / 100).toLocaleString()}
        </p>
        <p className="mt-3 text-sm text-navy-500">You&apos;re making real progress toward your $50,000 goal.</p>
        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Keep Building
        </button>
      </div>
    </div>
  );
}
