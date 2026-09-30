"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Plugins are registered client-side only; registerPlugin is idempotent.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

type Conditions = { motion: boolean; md: boolean; lg: boolean; fine: boolean };
type Cleanup = () => void;

const q = <T extends Element = HTMLElement>(root: ParentNode | null | undefined, sel: string) =>
  (root ? root.querySelector<T>(sel) : null);
const qa = <T extends Element = HTMLElement>(root: ParentNode | null | undefined, sel: string) =>
  (root ? Array.from(root.querySelectorAll<T>(sel)) : []);

/** Prepare an SVG's strokes for a draw-on effect (reverted with the context). */
function prepStrokes(svg: Element | null | undefined) {
  const els = qa<SVGGeometryElement>(svg, "path, circle, rect, line, polyline, ellipse");
  gsap.set(els, { attr: { pathLength: 1 }, strokeDasharray: 1, strokeDashoffset: 1 });
  return els;
}

/**
 * Motion controller for the public homepage.
 *
 * The page stays a server component (it reads settings/pricing from the DB);
 * this wrapper only looks for data-* hooks inside its own subtree. All tweens,
 * ScrollTriggers, SplitText instances and pointer listeners are created inside
 * one gsap.context() + gsap.matchMedia() and fully reverted on unmount or when
 * a media condition changes, so Fast Refresh and route changes never leave
 * duplicates behind.
 *
 *  - prefers-reduced-motion: nothing animates; the page renders finished.
 *  - < 768px: no pinning, no pointer effects, lighter entrances.
 *  - ≥ 768px: pinned How It Works.
 *  - ≥ 1024px: pinned Business section, pricing composition, hero document.
 *  - ≥ 1024px with a fine pointer: mouse depth, magnetic buttons, tilt, card light.
 */
export function HomeAnimations({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let alive = true;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          md: "(min-width: 768px)",
          lg: "(min-width: 1024px)",
          fine: "(hover: hover) and (pointer: fine)",
        },
        (mctx) => {
          const c = mctx.conditions as Conditions;
          if (!c.motion) return; // reduced motion: CSS already renders the finished state

          const cleanups: Cleanup[] = [];
          const t0 = performance.now();

          heroSequence(el, c, cleanups);
          trustBar(el, t0);
          howItWorks(el, c, cleanups);
          services(el, c);
          business(el, c);
          pricing(el, c);
          ctaBanner(el, c);
          genericReveals(el);
          if (c.lg && c.fine) pointerEffects(el, cleanups);

          return () => cleanups.forEach((fn) => fn());
        }
      );
    }, el);

    const refresh = () => alive && ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    if (document.readyState !== "complete") window.addEventListener("load", refresh, { once: true });

    return () => {
      alive = false;
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}

/* ------------------------------------------------------------------------ */
/* Hero                                                                      */
/* ------------------------------------------------------------------------ */

function heroSequence(root: HTMLElement, c: Conditions, cleanups: Cleanup[]) {
  const hero = q(root, "[data-hero]");
  if (!hero) return;

  const headline = q(hero, "[data-hero-headline]");
  const underline = q<SVGSVGElement>(hero, "[data-hero-underline]");
  const sub = q(hero, "[data-hero-sub]");
  const ringStroke = prepStrokes(q(hero, "[data-hero-ring]"));
  const underlineStroke = prepStrokes(underline);

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Background comes up out of black.
  tl.from(q(hero, "[data-bg-grid]"), { opacity: 0, scale: 1.14, duration: 1.8, ease: "power2.out" }, 0)
    .from(qa(hero, "[data-bg-orbs] [data-orb]"), { opacity: 0, scale: 0.55, duration: 2.2, stagger: 0.15, ease: "power2.out" }, 0)
    .fromTo(q(hero, "[data-bg-horizon]"), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.6, ease: "expo.out" }, 0.45)
    .fromTo(q(hero, "[data-bg-scan]"), { xPercent: -110, opacity: 1 }, { xPercent: 420, duration: 2.4, ease: "power2.inOut" }, 0.2)
    .to(q(hero, "[data-bg-scan]"), { opacity: 0, duration: 0.5 }, 2.2);

  // Icon "stamps" in; a ring draws around it; the check pulses.
  tl.set(q(hero, '[data-hero-item="icon"]'), { opacity: 1 }, 0.3)
    .fromTo(q(hero, "[data-hero-badge]"), { scale: 1.35, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "expo.out" }, 0.3)
    .set(q(hero, "[data-hero-ring]"), { opacity: 1 }, 0.45)
    .to(ringStroke, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.45)
    .to(q(hero, "[data-hero-ring]"), { opacity: 0, scale: 1.25, duration: 0.7, ease: "power2.out" }, 1.35)
    .fromTo(q(hero, "[data-hero-pulse]"), { scale: 0.4, opacity: 0.9 }, { scale: 2.8, opacity: 0, duration: 1.1, ease: "power2.out" }, 0.95);

  // Eyebrow: tracking tightens as it fades in.
  tl.fromTo(
    q(hero, '[data-hero-item="eyebrow"]'),
    { opacity: 0, y: 8, letterSpacing: "0.65em" },
    { opacity: 1, y: 0, letterSpacing: "0.3em", duration: 1.2 },
    0.5
  );

  // Headline: words rise out of masks. Works for any admin-edited headline.
  if (headline) {
    let first = true;
    SplitText.create(headline, {
      type: "words",
      mask: "words",
      wordsClass: "hero-word",
      autoSplit: true,
      onSplit(self) {
        const last = self.words[self.words.length - 1] as HTMLElement | undefined;
        last?.classList.add("hero-accent-word");
        if (last && underline) placeUnderline(headline, last, underline);
        gsap.set(headline, { opacity: 1 });
        const delay = first ? 0.65 : 0;
        first = false;
        return gsap.fromTo(
          self.words,
          { yPercent: 115, rotate: 5, transformOrigin: "0% 100%" },
          { yPercent: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.075, delay }
        );
      },
    });
    tl.set(underline, { opacity: 1 }, 1.3).to(underlineStroke, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 1.3);
  }

  // Subheadline: lines come into focus (blur only on desktop).
  if (sub) {
    let first = true;
    SplitText.create(sub, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit(self) {
        gsap.set(sub, { opacity: 1 });
        const delay = first ? 1.1 : 0;
        first = false;
        const from: gsap.TweenVars = { yPercent: 100, opacity: 0 };
        const to: gsap.TweenVars = { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power3.out", delay };
        if (c.lg) {
          from.filter = "blur(8px)";
          to.filter = "blur(0px)";
          to.clearProps = "filter";
        }
        return gsap.fromTo(self.lines, from, to);
      },
    });
  }

  // CTAs rise; one sheen sweeps across the primary button.
  const cta = q(hero, '[data-hero-item="cta"]');
  tl.set(cta, { opacity: 1 }, 1.3)
    .from(cta ? Array.from(cta.children) : [], { y: 26, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out" }, 1.3)
    .fromTo(q(hero, "[data-sheen]"), { xPercent: -160 }, { xPercent: 360, duration: 1.2, ease: "power2.inOut" }, 1.9);

  // Document composition (desktop): rises, signs itself, gets sealed.
  if (c.lg) {
    const docMouse = q(hero, "[data-doc-mouse]");
    // Both paths carry pathLength={1} in the markup.
    const signature = q(hero, "[data-signature]");
    const sealCheck = q(hero, "[data-seal-check]");
    gsap.set([signature, sealCheck], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(docMouse, { transformPerspective: 1400, rotationY: -16, rotationX: 7 });

    tl.set(q(hero, "[data-hero-visual]"), { opacity: 1 }, 1.2)
      .fromTo(q(hero, "[data-doc-enter]"), { y: 140, opacity: 0, rotationX: 20 }, { y: 0, opacity: 1, rotationX: 0, duration: 1.6, ease: "expo.out" }, 1.25)
      .fromTo(q(hero, "[data-doc-card]"), { y: 90, x: -40, opacity: 0 }, { y: 0, x: 0, opacity: 1, duration: 1.4, ease: "expo.out" }, 1.6)
      .fromTo(q(hero, "[data-doc-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "power2.inOut" }, 1.9)
      .to(signature, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, 2.0)
      .fromTo(q(hero, "[data-seal]"), { scale: 1.9, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.45, ease: "power4.in" }, 3.25)
      .fromTo(q(hero, "[data-seal-ring]"), { scale: 1, opacity: 0.8 }, { scale: 2, opacity: 0, duration: 1, ease: "power2.out" }, 3.7)
      .to(sealCheck, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, 3.72)
      .to(q(hero, "[data-doc-card]"), { y: -10, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true }, 3.2);

    // Orbs drift slowly, forever.
    qa(hero, "[data-bg-orbs] [data-orb]").forEach((orb, i) => {
      gsap.to(orb, {
        x: i % 2 ? -70 : 60,
        y: i % 2 ? 40 : -50,
        duration: 12 + i * 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
  } else {
    gsap.set(q(hero, "[data-hero-visual]"), { opacity: 1 });
  }

  // Scrolling away: content recedes, document lifts faster, light lags behind.
  const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  gsap.to(q(hero, "[data-hero-content]"), { y: -90, scale: 0.94, opacity: 0.1, ease: "none", scrollTrigger: st });
  if (c.lg) {
    gsap.to(q(hero, "[data-doc-scroll]"), { y: -200, ease: "none", scrollTrigger: { ...st } });
    gsap.to(q(hero, "[data-bg-orbs]"), { yPercent: 22, ease: "none", scrollTrigger: { ...st } });
    gsap.to(q(hero, "[data-bg-grid]"), { yPercent: 12, ease: "none", scrollTrigger: { ...st } });
  }

  // Mouse depth (desktop, fine pointer).
  if (c.lg && c.fine) {
    const layer = (sel: string, dur = 1) => {
      const node = q(hero, sel);
      return node
        ? { x: gsap.quickTo(node, "x", { duration: dur, ease: "power3" }), y: gsap.quickTo(node, "y", { duration: dur, ease: "power3" }) }
        : null;
    };
    const orbs = layer("[data-bg-orbs]", 1.4);
    const grid = layer("[data-bg-grid]", 1.2);
    const content = layer("[data-hero-mouse-content]", 1);
    const docMouse = q(hero, "[data-doc-mouse]");
    const docRY = docMouse && gsap.quickTo(docMouse, "rotationY", { duration: 1.1, ease: "power3" });
    const docRX = docMouse && gsap.quickTo(docMouse, "rotationX", { duration: 1.1, ease: "power3" });
    const docX = docMouse && gsap.quickTo(docMouse, "x", { duration: 1.1, ease: "power3" });

    const move = (nx: number, ny: number) => {
      orbs?.x(nx * 36);
      orbs?.y(ny * 24);
      grid?.x(nx * -14);
      grid?.y(ny * -10);
      content?.x(nx * -8);
      content?.y(ny * -5);
      docRY?.(-16 + nx * 7);
      docRX?.(7 - ny * 5);
      docX?.(nx * 16);
    };
    const onMove = (e: PointerEvent) => {
      move((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => move(0, 0);
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    });
  }
}

/** Position the underline SVG beneath the headline's last word. */
function placeUnderline(headline: HTMLElement, word: HTMLElement, svg: SVGSVGElement) {
  const box = headline.parentElement?.getBoundingClientRect();
  const r = word.getBoundingClientRect();
  if (!box) return;
  gsap.set(svg, {
    left: r.left - box.left,
    top: r.bottom - box.top - r.height * 0.08,
    width: r.width,
  });
}

/* ------------------------------------------------------------------------ */
/* Trust bar                                                                 */
/* ------------------------------------------------------------------------ */

function trustBar(root: HTMLElement, t0: number) {
  const panel = q(root, "[data-trust]");
  if (!panel) return;

  // The glass panel rises over the hero's lower edge as you scroll.
  gsap.fromTo(panel, { y: 70 }, { y: 0, ease: "none", scrollTrigger: { trigger: panel, start: "top bottom", end: "top 55%", scrub: 0.6 } });

  const tl = gsap.timeline({ paused: true });
  qa(panel, "[data-trust-item]").forEach((item, i) => {
    const strokes = prepStrokes(q(item, "svg"));
    const at = i * 0.1;
    tl.from(q(item, "[data-trust-tile]"), { scale: 0.5, opacity: 0, duration: 0.8, ease: "expo.out" }, at)
      .to(strokes, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, at + 0.1)
      .from(qa(item, "p"), { y: 12, opacity: 0, duration: 0.7, stagger: 0.06 }, at + 0.25);
  });

  ScrollTrigger.create({
    trigger: panel,
    start: "top 92%",
    once: true,
    // If it's already on screen at load, wait for the hero text to land first.
    onEnter: () => gsap.delayedCall(Math.max(0, 1.7 - (performance.now() - t0) / 1000), () => tl.play()),
  });
}

/* ------------------------------------------------------------------------ */
/* How It Works — pinned deck on ≥768px, drawn timeline on phones            */
/* ------------------------------------------------------------------------ */

function howItWorks(root: HTMLElement, c: Conditions, cleanups: Cleanup[]) {
  const sec = q(root, "[data-steps]");
  const stage = q(sec, "[data-steps-stage]");
  const cards = qa(sec, "[data-step-card]");
  if (!sec || !stage || cards.length < 2) return;

  gsap.from(q(sec, "[data-steps-heading]"), {
    y: 50,
    opacity: 0,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: sec, start: "top 70%", once: true },
  });

  if (!c.md) {
    gsap.fromTo(q(sec, "[data-steps-line]"), { scaleY: 0 }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: stage, start: "top 75%", end: "bottom 55%", scrub: 0.5 },
    });
    cards.forEach((card) =>
      gsap.from(card, { y: 50, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 85%", once: true } })
    );
    return;
  }

  stage.classList.add("is-stacked");
  cleanups.push(() => stage.classList.remove("is-stacked"));

  const n = cards.length;
  const nodes = qa(sec, "[data-rail-node]");
  const dots = nodes.map((node) => q(node, "[data-rail-dot]"));
  const nums = nodes.map((node) => q(node, "[data-rail-num]"));
  const labels = nodes.map((node) => q(node, "[data-rail-label]"));

  // Deck positions: k = distance from the active card (negative = already passed).
  const pose = (k: number): gsap.TweenVars =>
    k < 0
      ? { y: -90, scale: 0.9, opacity: 0 }
      : { y: k * 28, scale: 1 - k * 0.05, opacity: k === 0 ? 1 : k === 1 ? 0.6 : 0.3 };

  gsap.set(cards, { transformOrigin: "50% 0%" });
  cards.forEach((card, i) => gsap.set(card, { ...pose(i), zIndex: n - i }));
  gsap.set(q(sec, "[data-rail-fill]"), { scaleY: 0 });
  gsap.set(dots, { scale: 0 });
  gsap.set(dots[0], { scale: 1 });
  gsap.set(nums, { color: "#94a1c4" });
  gsap.set(nums[0], { color: "#ffffff" });
  gsap.set(labels, { opacity: 0.4 });
  gsap.set(labels[0], { opacity: 1 });

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: sec,
      start: "top top",
      end: () => `+=${window.innerHeight * (n - 1)}`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: "power1.inOut" },
    },
  });

  for (let s = 1; s < n; s++) {
    const at = s - 1 + 0.2;
    tl.set(cards[s], { zIndex: 10 + s }, at);
    cards.forEach((card, i) => tl.to(card, { ...pose(i - s), duration: 0.6 }, at));
    tl.to(q(sec, "[data-rail-fill]"), { scaleY: s / (n - 1), duration: 0.6, ease: "none" }, at)
      .to(dots[s], { scale: 1, duration: 0.3 }, at + 0.3)
      .to(nums[s], { color: "#ffffff", duration: 0.3 }, at + 0.3)
      .to(labels[s], { opacity: 1, duration: 0.3 }, at + 0.3)
      .to(labels[s - 1], { opacity: 0.55, duration: 0.3 }, at + 0.3)
      .fromTo(q(cards[s], "[data-step-icon]"), { scale: 0.6, rotate: -14 }, { scale: 1, rotate: 0, duration: 0.35, ease: "expo.out" }, at + 0.3)
      .from(qa(cards[s], "[data-step-pop]"), { scale: 0, opacity: 0, duration: 0.3, stagger: 0.01, ease: "power3.out" }, at + 0.35);
  }
  tl.to({}, { duration: 0.2 }); // settle so step boundaries land on whole numbers
}

/* ------------------------------------------------------------------------ */
/* Services — 3D staggered entrance from the center                           */
/* ------------------------------------------------------------------------ */

function services(root: HTMLElement, c: Conditions) {
  const sec = q(root, "[data-services]");
  const grid = q(sec, "[data-card3d-grid]");
  if (!sec || !grid) return;

  gsap.fromTo(q(sec, "[data-services-grid-bg]"), { opacity: 0 }, {
    opacity: 1,
    ease: "none",
    scrollTrigger: { trigger: sec, start: "top bottom", end: "top 30%", scrub: true },
  });

  gsap.fromTo(
    qa(grid, "[data-card3d]"),
    { opacity: 0, y: 90, rotationX: c.md ? 48 : 20, transformPerspective: 900, transformOrigin: "50% 100%" },
    {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.3,
      ease: "expo.out",
      stagger: { amount: 0.5, from: "center", grid: "auto" },
      scrollTrigger: { trigger: grid, start: "top 85%", once: true },
    }
  );
}

/* ------------------------------------------------------------------------ */
/* Business — expanding dark stage, pinned benefit sequence on desktop        */
/* ------------------------------------------------------------------------ */

function business(root: HTMLElement, c: Conditions) {
  const sec = q(root, "[data-biz]");
  if (!sec) return;
  const items = qa(sec, "[data-biz-item]");
  const marker = q(sec, "[data-biz-marker]");
  const panel = q(sec, "[data-biz-panel]");
  const rows = qa(sec, "[data-biz-row]");
  const cta = q(sec, "[data-biz-cta]");
  const glow = q(sec, "[data-biz-glow]");
  const checks = items.map((it) => prepStrokes(q(it, "svg")));

  // The dark stage opens from an inset rounded card to full bleed.
  gsap.fromTo(
    q(sec, "[data-biz-bg]"),
    { scaleX: c.md ? 0.92 : 0.95, scaleY: 0.94, borderRadius: 40 },
    { scaleX: 1, scaleY: 1, borderRadius: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true } }
  );

  gsap.from(q(sec, "[data-biz-heading]"), {
    y: 60,
    opacity: 0,
    duration: 1.2,
    ease: "expo.out",
    scrollTrigger: { trigger: sec, start: "top 60%", once: true },
  });

  if (!c.lg) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: q(sec, "[data-biz-list]"), start: "top 80%", once: true } });
    tl.from(items, { x: -24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out" }, 0)
      .to(checks.flat(), { strokeDashoffset: 0, duration: 0.8, stagger: 0.04 }, 0.2)
      .from(cta, { y: 20, opacity: 0, duration: 0.8, ease: "expo.out" }, 0.5);
    gsap.from(panel, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: panel, start: "top 85%", once: true } });
    return;
  }

  const step = 0.9;
  gsap.set(items, { opacity: 0.3 });
  gsap.set(panel, { transformPerspective: 1400, rotationY: -24, rotationX: 9, x: 60, opacity: 0.35 });
  gsap.set(rows, { x: 90, opacity: 0 });
  gsap.set(cta, { y: 30, opacity: 0 });
  gsap.set(marker, { opacity: 1, y: () => items[0]?.offsetTop ?? 0, height: () => items[0]?.offsetHeight ?? 44 });
  gsap.set(glow, { opacity: 0.25, scale: 0.8 });

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: sec,
      start: "top top",
      end: () => `+=${window.innerHeight * 1.6}`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  tl.to(panel, { rotationY: 0, rotationX: 0, x: 0, opacity: 1, duration: 2.2, ease: "power2.out" }, 0)
    .to(glow, { opacity: 1, scale: 1.15, duration: items.length * step, ease: "none" }, 0);

  items.forEach((it, i) => {
    const at = i * step;
    tl.to(marker, { y: () => it.offsetTop, height: () => it.offsetHeight, duration: 0.45 }, at)
      .to(it, { opacity: 1, duration: 0.35 }, at)
      .to(checks[i], { strokeDashoffset: 0, duration: 0.45 }, at + 0.05);
    if (i > 0) tl.to(items[i - 1], { opacity: 0.7, duration: 0.35 }, at);
  });
  rows.forEach((r, i) => tl.to(r, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.9 + i * 1.3));

  const end = items.length * step;
  tl.to(items, { opacity: 1, duration: 0.4 }, end)
    .to(cta, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, end)
    .to({}, { duration: 0.4 });
}

/* ------------------------------------------------------------------------ */
/* Pricing — the three cards arrive as one composition                        */
/* ------------------------------------------------------------------------ */

function pricing(root: HTMLElement, c: Conditions) {
  const sec = q(root, "[data-pricing]");
  const stage = q(sec, "[data-pricing-stage]");
  const cards = qa(sec, "[data-price-card]");
  if (!sec || !stage || !cards.length) return;

  gsap.fromTo(q(sec, "[data-pricing-glow]"), { yPercent: -10 }, {
    yPercent: 20,
    ease: "none",
    scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
  });

  const fi = cards.findIndex((card) => card.hasAttribute("data-featured"));

  if (!c.lg || fi < 0) {
    cards.forEach((card) =>
      gsap.from(card, { y: 70, opacity: 0, scale: 0.96, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 88%", once: true } })
    );
    return;
  }

  const featured = cards[fi];
  const others = cards.filter((_, i) => i !== fi);

  // Start gathered: side cards tucked behind the recommended plan.
  cards.forEach((card, i) => {
    if (i === fi) return;
    const dir = fi - i; // >0: card sits left of the featured one
    gsap.set(card, { xPercent: dir * 100, x: dir * 32, rotationY: dir * 22, scale: 0.84, opacity: 0, transformPerspective: 1600, zIndex: 0 });
  });
  gsap.set(featured, { y: 110, scale: 0.9, opacity: 0, zIndex: 2 });

  const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: "top 80%", once: true } });
  tl.to(featured, { y: 50, scale: 0.94, opacity: 1, duration: 0.8, ease: "power3.out" }, 0)
    .to(others, { opacity: 1, duration: 0.35 }, 0.4)
    .to(others, { xPercent: 0, x: 0, rotationY: 0, scale: 1, duration: 1.4, ease: "expo.out", stagger: 0.08 }, 0.45)
    .to(featured, { y: 0, scale: 1, duration: 1.2, ease: "expo.out" }, 1.0)
    .fromTo(q(featured, ".price-glow"), { opacity: 0 }, { opacity: 1, duration: 1 }, 1.2);
}

/* ------------------------------------------------------------------------ */
/* Final CTA — bookends the hero                                              */
/* ------------------------------------------------------------------------ */

function ctaBanner(root: HTMLElement, c: Conditions) {
  const sec = q(root, "[data-cta]");
  if (!sec) return;

  gsap.fromTo(
    q(sec, "[data-cta-bg]"),
    { scaleX: c.md ? 0.9 : 0.94, scaleY: 0.86, borderRadius: 40 },
    { scaleX: 1, scaleY: 1, borderRadius: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top 40%", scrub: true } }
  );

  const headline = q(sec, "[data-cta-headline]");
  const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 70%", once: true } });
  if (headline) {
    const split = SplitText.create(headline, { type: "words", mask: "words", wordsClass: "cta-word" });
    tl.from(split.words, { yPercent: 115, rotate: 5, transformOrigin: "0% 100%", duration: 1, ease: "expo.out", stagger: 0.06 }, 0);
  }
  tl.from(q(sec, "[data-cta-sub]"), { y: 16, opacity: 0, duration: 0.9, ease: "power3.out" }, 0.4)
    .from(q(sec, "[data-cta-button]"), { y: 24, opacity: 0, duration: 1, ease: "expo.out" }, 0.55)
    .fromTo(q(sec, ".btn-sheen"), { xPercent: -160 }, { xPercent: 360, duration: 1.2, ease: "power2.inOut" }, 1.1);

  if (c.lg) {
    gsap.to(q(sec, "[data-cta-orb]"), { x: 120, y: 40, duration: 14, ease: "sine.inOut", repeat: -1, yoyo: true });
  }
}

/** Simple reveal for headings/links marked data-reveal. */
function genericReveals(root: HTMLElement) {
  qa(root, "[data-reveal]").forEach((node) =>
    gsap.from(node, { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: node, start: "top 85%", once: true } })
  );
}

/* ------------------------------------------------------------------------ */
/* Pointer effects — desktop with a fine pointer only                         */
/* ------------------------------------------------------------------------ */

function pointerEffects(root: HTMLElement, cleanups: Cleanup[]) {
  const listen = (node: HTMLElement, type: string, fn: (e: PointerEvent) => void) => {
    node.addEventListener(type, fn as EventListener);
    cleanups.push(() => node.removeEventListener(type, fn as EventListener));
  };

  // Magnetic buttons: the wrapper leans toward the cursor, the label a bit more.
  qa(root, "[data-magnetic]").forEach((wrap) => {
    const inner = q(wrap, "[data-magnetic-inner]");
    const btn = wrap.firstElementChild as HTMLElement | null;
    const wx = gsap.quickTo(wrap, "x", { duration: 0.6, ease: "power3" });
    const wy = gsap.quickTo(wrap, "y", { duration: 0.6, ease: "power3" });
    const ix = inner && gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" });
    const iy = inner && gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" });
    let rect: DOMRect | null = null;
    listen(wrap, "pointerenter", () => (rect = (btn ?? wrap).getBoundingClientRect()));
    listen(wrap, "pointermove", (e) => {
      rect ??= (btn ?? wrap).getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      wx(gsap.utils.clamp(-6, 6, dx * 0.2));
      wy(gsap.utils.clamp(-5, 5, dy * 0.3));
      ix?.(dx * 0.08);
      iy?.(dy * 0.1);
      wrap.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      wrap.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
    listen(wrap, "pointerleave", () => {
      rect = null;
      wx(0);
      wy(0);
      ix?.(0);
      iy?.(0);
    });
  });

  // 3D tilt toward the cursor.
  qa(root, "[data-tilt]").forEach((card) => {
    const strength = Number(card.dataset.tiltStrength ?? 1);
    gsap.set(card, { transformPerspective: 900 });
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3" });
    const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3" });
    let rect: DOMRect | null = null;
    listen(card, "pointerenter", () => (rect = card.getBoundingClientRect()));
    listen(card, "pointermove", (e) => {
      rect ??= card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rx(-py * 10 * strength);
      ry(px * 12 * strength);
    });
    listen(card, "pointerleave", () => {
      rect = null;
      rx(0);
      ry(0);
    });
  });

  // Cursor-following light (CSS reads --mx / --my).
  qa(root, "[data-spotlight]").forEach((node) => {
    listen(node, "pointermove", (e) => {
      const r = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${e.clientX - r.left}px`);
      node.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}
