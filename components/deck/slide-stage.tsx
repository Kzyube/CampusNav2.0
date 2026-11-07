"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, type ReactNode } from "react";

type Entrance = "rise" | "split" | "lift" | "unfold" | "settle";

const moves: Record<Entrance, gsap.TweenVars> = {
  rise: { y: 25 },
  split: { x: -28 },
  lift: { y: 18, scale: .97 },
  unfold: { x: 14, scaleX: .94 },
  settle: { y: -16 },
};

export function SlideStage({ entrance, children }: { entrance: Entrance; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline();
      const body = root.querySelector(".slide-body-content");
      const cover = root.querySelector(".cover-map-window > .visual");
      const heading = root.querySelector(".slide-heading h1");

      if (heading) timeline.from(heading, {
        y: 12, opacity: .78, duration: .38, ease: "power3.out", clearProps: "transform,opacity",
      }, 0);
      if (body) timeline.from(body, {
        ...moves[entrance], opacity: .7, duration: .57, ease: "power4.out", clearProps: "transform,opacity",
      }, .06);
      if (cover) timeline.from(cover, {
        scale: 1.12, xPercent: 3, transformOrigin: "68% 48%", duration: 1.1, ease: "power3.out",
        clearProps: "transform,transformOrigin",
      }, 0);
    }, root);
    return () => media.revert();
  }, [entrance]);

  return <div ref={stage} className="stage-content" data-entrance={entrance}>{children}</div>;
}
