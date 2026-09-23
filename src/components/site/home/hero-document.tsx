import { ShieldCheck } from "lucide-react";

// Decorative, text-free document composition for the hero (desktop only).
// Skeleton bars stand in for text so no claims or copy are introduced.
function Bar({ w, tone = "bg-navy-100" }: { w: string; tone?: string }) {
  return <span className={`block h-2 rounded-full ${tone}`} style={{ width: w }} />;
}

export function HeroDocument() {
  return (
    <div data-hero-visual aria-hidden className="relative hidden h-[540px] lg:block">
      <div data-doc-scroll className="absolute inset-0">
        <div data-doc-mouse className="absolute inset-0">
          {/* Glow behind the paper */}
          <div className="hero-orb right-[-4%] top-[8%] h-[520px] w-[520px] [--orb:rgba(59,107,255,0.35)]" />

          {/* The document */}
          <div
            data-doc-enter
            className="absolute right-4 top-2 w-[350px] rounded-2xl bg-gradient-to-b from-white to-[#eef2fd] p-8 shadow-[0_50px_120px_-30px_rgba(59,107,255,0.55)] ring-1 ring-white/60"
          >
            <div className="flex items-center justify-between">
              <span className="h-8 w-8 rounded-lg bg-navy-900" />
              <div className="space-y-1.5">
                <Bar w="72px" tone="bg-navy-200" />
                <Bar w="48px" />
              </div>
            </div>
            <div className="mt-8 space-y-2.5">
              <Bar w="58%" tone="bg-navy-300/70" />
              <Bar w="100%" />
              <Bar w="94%" />
              <Bar w="97%" />
              <Bar w="62%" />
            </div>
            <div className="mt-6 space-y-2.5">
              <Bar w="100%" />
              <Bar w="88%" />
              <Bar w="45%" />
            </div>

            {/* Signature line */}
            <div className="relative mt-10 h-20">
              <svg viewBox="0 0 220 70" className="absolute inset-x-0 bottom-3 h-16 w-[220px] overflow-visible" fill="none">
                <path
                  data-signature
                  pathLength={1}
                  d="M6 48c10-18 20-34 26-30 7 5-9 34-2 36 8 3 16-34 24-33 7 1-4 26 3 27 8 1 12-20 19-19 6 1 2 16 8 16 9 0 13-22 22-22 8 0 3 18 11 18 10 0 18-14 30-17 14-3 30 4 44 2"
                  stroke="#0a1128"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="doc-stroke"
                />
              </svg>
              <span className="absolute bottom-2 left-0 h-px w-[230px] bg-navy-200" />
            </div>

            {/* Seal */}
            <div data-seal className="absolute bottom-7 right-7 h-20 w-20">
              <span data-seal-ring className="absolute inset-0 rounded-full border-2 border-accent-400/70" />
              <svg viewBox="0 0 80 80" className="relative h-20 w-20" fill="none">
                <circle cx="40" cy="40" r="36" fill="#3b6bff" />
                <circle cx="40" cy="40" r="30" stroke="white" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="3 4" />
                <path
                  data-seal-check
                  pathLength={1}
                  d="M28 41l8 8 16-17"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="doc-stroke"
                />
              </svg>
            </div>
          </div>

          {/* Verification card */}
          <div
            data-doc-card
            className="absolute bottom-6 left-0 w-[270px] rounded-2xl border border-white/10 bg-navy-900/80 p-5 shadow-[0_30px_80px_-20px_rgba(5,9,20,0.8)] backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/15 text-accent-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="flex-1 space-y-1.5">
                <Bar w="70%" tone="bg-white/25" />
                <Bar w="45%" tone="bg-white/10" />
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <span data-doc-progress className="block h-full origin-left rounded-full bg-gradient-to-r from-accent-500 to-accent-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
