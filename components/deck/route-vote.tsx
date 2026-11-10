"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Check, Eye, RotateCcw } from "lucide-react";
import { playDeckSound } from "./deck-sound";

const direct = 10;
const firstLeg = 3;
const secondLeg = 4;
const viaB = firstLeg + secondLeg;
const directPath = "M111 116 H529";
const viaPath = "M111 116 L320 234 L529 116";

function Waypoint({ x, y, letter, label }: { x: number; y: number; letter: string; label: string }) {
  return <g transform={`translate(${x} ${y})`} className="vote-map-node">
    <ellipse cy="15" rx="36" ry="16" fill="#0b1c16" opacity=".55" />
    <path d="M-28 0 V10 A28 20 0 0 0 28 10 V0Z" fill="#6d8a76" />
    <ellipse rx="28" ry="21" fill="#e4f1e5" stroke="#f1f8ed" strokeWidth="2" />
    <text className="vote-map-letter" y="1" dominantBaseline="central" textAnchor="middle">{letter}</text>
    <text className="vote-map-label" y={letter === "B" ? 58 : -34} textAnchor="middle">{label}</text>
  </g>;
}

function EdgeWeight({ x, y, children }: { x: number; y: number; children: number }) {
  return <g className="vote-map-weight" transform={`translate(${x} ${y})`}>
    <rect x="-26" y="-20" width="52" height="40" rx="8" />
    <text textAnchor="middle" dominantBaseline="central">{children}</text>
  </g>;
}

export function RouteVote() {
  const [revealed, setRevealed] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const winner = useRef<SVGPathElement>(null);
  const traveler = useRef<SVGCircleElement>(null);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline();
      timeline.from(".vote-map-world", {
        rotateX: 15, z: -82, y: 16, opacity: .65, duration: .85, ease: "power4.out",
        clearProps: "transform,opacity",
      });
      timeline.from(".vote-map-lane", { strokeDashoffset: 1, duration: .58, stagger: .09, ease: "power2.out" }, .13);
      timeline.from(".vote-map-weight", { opacity: .35, duration: .3, stagger: .055 }, .37);
    }, scene);
    return () => media.revert();
  }, []);

  useLayoutEffect(() => {
    const path = winner.current;
    const dot = traveler.current;
    if (!revealed || !path || !dot) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const distance = path.getTotalLength();
      const trace = { progress: 0 };
      const timeline = gsap.timeline();
      timeline.from(".vote-total", { y: 8, opacity: 0, duration: .32, stagger: .13, ease: "power3.out" });
      timeline.from(path, { strokeDashoffset: 1, duration: .68, ease: "power2.inOut" }, .14);
      timeline.set(dot, { opacity: 1 }, .14);
      timeline.to(trace, {
        progress: 1, duration: .68, ease: "power2.inOut",
        onUpdate() {
          const point = path.getPointAtLength(trace.progress * distance);
          gsap.set(dot, { attr: { cx: point.x, cy: point.y } });
        },
      }, .14);
      timeline.to(dot, { opacity: 0, duration: .24 }, .82);
    }, scene);
    return () => media.revert();
  }, [revealed]);

  function toggleReveal() {
    playDeckSound(revealed ? "step" : "accept");
    setRevealed(value => !value);
  }

  return <div ref={scene} className="route-vote" data-revealed={revealed}>
    <div className="vote-map">
      <span className="vote-map-kicker eyebrow"><i /> Sample map</span>
      <div className="vote-map-view">
        <svg className="vote-map-world" viewBox="0 0 640 335" role="img"
          aria-label="Two routes from A to D. A to D is 10 units. A to B is 3 units, and B to D is 4 units.">
          <path d="M35 262 L95 69 H545 L605 262 V280 H35Z" fill="#203b30" />
          <path d="M35 262 H605 V280 H35Z" fill="#14281e" />
          <path d="M35 262 L95 69 H545 L605 262Z" fill="#29483a" stroke="#456757" strokeWidth="1.5" />
          <path d="M83 106 H557 M68 155 H572 M53 205 H587 M143 262 L182 69 M261 262 L275 69 M379 262 L365 69 M497 262 L458 69"
            fill="none" stroke="#537768" strokeWidth="1" opacity=".45" />
          <path d={directPath} transform="translate(0 7)" className="vote-map-lane-depth" />
          <path d={viaPath} transform="translate(0 7)" className="vote-map-lane-depth" />
          <path d={directPath} pathLength="1" className="vote-map-lane vote-map-lane--direct" />
          <path d={viaPath} pathLength="1" className="vote-map-lane vote-map-lane--via" />
          <path ref={winner} d={viaPath} pathLength="1" className="vote-map-winner" />
          <EdgeWeight x={320} y={113}>{direct}</EdgeWeight>
          <EdgeWeight x={209} y={172}>{firstLeg}</EdgeWeight>
          <EdgeWeight x={431} y={172}>{secondLeg}</EdgeWeight>
          <Waypoint x={111} y={116} letter="A" label="Start" />
          <Waypoint x={529} y={116} letter="D" label="Destination" />
          <Waypoint x={320} y={234} letter="B" label="Via B" />
          <circle ref={traveler} className="vote-map-traveler" cx="111" cy="116" r="7" />
        </svg>
      </div>
    </div>
    <div className="vote-panel">
      <div className="vote-panel-heading"><h2>Quick vote</h2><p>Go straight or take the detour?</p></div>
      <div className="vote-options">
        <div className="vote-option vote-option--direct">
          <div><span>Direct</span><strong>A → D</strong></div>
          {revealed && <span className="vote-total"><b>{direct}</b> units</span>}
        </div>
        <div className="vote-option vote-option--via">
          <div><span>Via B</span><strong>A → B → D</strong></div>
          {revealed && <span className="vote-total"><b>{viaB}</b> units</span>}
        </div>
      </div>
      <div className="vote-result" role="status" aria-atomic="true">
        {revealed && <><Check size={17} aria-hidden="true" /><p><strong>Via B is {direct - viaB} units shorter.</strong> Two walkways can still mean a shorter walk.</p></>}
      </div>
      <button type="button" className={`button button--${revealed ? "secondary" : "primary"}`} onClick={toggleReveal} aria-expanded={revealed}>
        {revealed ? <><RotateCcw size={17} /> Hide totals</> : <><Eye size={17} /> Reveal totals <ArrowRight size={16} /></>}
      </button>
    </div>
  </div>;
}
