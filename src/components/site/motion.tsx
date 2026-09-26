"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

const qa = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel));

/**
 * Lightweight scroll motion shared by the public pages. Uses the same GSAP
 * install as the homepage (no second animation library). Hooks:
 *
 *  data-reveal           fade/rise into view once
 *  data-stagger          children rise in sequence once
 *  data-count="1000"     number counts up once (data-prefix / data-suffix)
 *  data-float            slow idle drift (desktop only)
 *
 * Only transform/opacity are animated; everything renders finished for
 * prefers-reduced-motion and without JavaScript.
 */
export function applySiteMotion(root: HTMLElement, opts: { lg: boolean }) {
  qa(root, "[data-reveal]").forEach((node) =>
    gsap.from(node, { y: 36, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: node, start: "top 88%", once: true } })
  );

  qa(root, "[data-stagger]").forEach((group) =>
    gsap.from(Array.from(group.children), {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.07,
      scrollTrigger: { trigger: group, start: "top 88%", once: true },
    })
  );

  qa(root, "[data-count]").forEach((node) => {
    const target = Number(node.dataset.count);
    if (!Number.isFinite(target)) return;
    const prefix = node.dataset.prefix ?? "";
    const suffix = node.dataset.suffix ?? "";
    const counter = { v: 0 };
    gsap.to(counter, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: node, start: "top 92%", once: true },
      onUpdate: () => {
        node.textContent = `${prefix}${Math.round(counter.v).toLocaleString("en-US")}${suffix}`;
      },
    });
  });

  if (opts.lg) {
    qa(root, "[data-float]").forEach((node, i) =>
      gsap.to(node, { y: i % 2 ? 10 : -10, duration: 4 + i, ease: "sine.inOut", repeat: -1, yoyo: true })
    );
  }
}

/** Wrap a page (or section) to enable the data-* motion hooks inside it. */
export function SiteMotion({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", lg: "(min-width: 1024px)" }, (mctx) => {
        const c = mctx.conditions as { motion: boolean; lg: boolean };
        if (!c.motion) return;
        applySiteMotion(el, { lg: c.lg });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
