// Layered, CSS-only hero backdrop. Every layer is animated with transform /
// opacity only (see home-animations.tsx) — no live blur filters.
export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div data-bg-orbs className="absolute inset-0">
        <div data-orb className="hero-orb left-[-12%] top-[-28%] h-[760px] w-[760px] [--orb:rgba(59,107,255,0.42)]" />
        <div data-orb className="hero-orb right-[-18%] top-[4%] h-[680px] w-[680px] [--orb:rgba(102,144,255,0.26)]" />
        <div data-orb className="hero-orb bottom-[-45%] left-[28%] h-[860px] w-[860px] [--orb:rgba(29,78,216,0.34)]" />
      </div>
      <div data-bg-grid className="hero-grid absolute inset-0" />
      <div data-bg-scan className="hero-scan absolute inset-y-0 left-0 w-1/3 opacity-0" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-navy-950" />
      <div
        data-bg-horizon
        className="absolute inset-x-0 bottom-28 h-px origin-center bg-gradient-to-r from-transparent via-accent-400/70 to-transparent"
      />
    </div>
  );
}
