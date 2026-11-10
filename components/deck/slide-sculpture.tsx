"use client";

import { Component, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { Award, Layers3, Waypoints } from "lucide-react";

export type SculptureKind = "traversal" | "graph" | "finale";

const SculptureCanvas = dynamic(() => import("./slide-sculpture-canvas"), { ssr: false });
const symbols = { traversal: Layers3, graph: Waypoints, finale: Award };

class SculptureBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function SlideSculpture({ kind }: { kind: SculptureKind }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = Boolean(useReducedMotion());
  const Icon = symbols[kind];

  return <div className={`slide-sculpture slide-sculpture--${kind}`}>
    {(!ready || failed) && <span className="sculpture-fallback" aria-hidden="true"><Icon size={40} strokeWidth={1.4} /></span>}
    {!failed && <div className="sculpture-view" aria-hidden="true"><SculptureBoundary onError={() => setFailed(true)}>
      <SculptureCanvas kind={kind} reduced={reduced} onReady={setReady} onLost={setFailed} />
    </SculptureBoundary></div>}
  </div>;
}
