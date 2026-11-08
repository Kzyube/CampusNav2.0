"use client";

import { Component, useCallback, useSyncExternalStore, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { Box, Layers3, Map, MoveUpRight, Pause, Play } from "lucide-react";
import { playDeckSound } from "../deck/deck-sound";
import { NetworkMap, componentColors } from "./network-map";
import type { MapEmphasis } from "./map-motion";
import type { GraphState } from "@/lib/algorithms";
import { buildingById, type Vertex } from "@/lib/graph";

const CampusScene = dynamic(() => import("./campus-scene"), { ssr: false });

class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const query = "(max-width: 760px), (prefers-reduced-motion: reduce)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function avoid3D() { return window.matchMedia(query).matches; }

export function CampusVisual({ state, initialMode = "2D", graph = true, weights = true, title = "Campus graph", inspect = false, allow3D = true, controls = true, groupLabels, graphTour = false, emphasis }: {
  state?: GraphState; initialMode?: "2D" | "3D"; graph?: boolean; weights?: boolean; title?: string; inspect?: boolean; allow3D?: boolean; controls?: boolean; groupLabels?: string[]; graphTour?: boolean; emphasis?: MapEmphasis;
}) {
  const lightweight = useSyncExternalStore(subscribe, avoid3D, () => true);
  const reduced = Boolean(useReducedMotion());
  const [preferred, setPreferred] = useState<"2D" | "3D" | null>(null);
  const [failed, setFailed] = useState(false);
  const [overlay, setOverlay] = useState(graph);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<Vertex | undefined>();
  const mode = preferred ?? (lightweight ? "2D" : initialMode);
  const canShow3D = allow3D && !failed && mode === "3D";
  const lost = useCallback(() => setFailed(true), []);

  function selectMode(next: "2D" | "3D") {
    if (next === "3D" && typeof window.WebGL2RenderingContext === "undefined") {
      setFailed(true);
      return;
    }
    setPreferred(next);
  }

  const onSelect = inspect ? (id: Vertex) => setSelected(current => current === id ? undefined : id) : undefined;

  const groups = groupLabels ? state?.components : undefined;
  return (
    <div className={`visual ${groups?.length ? "visual--legend" : ""} ${canShow3D ? "visual--scene" : "visual--diagram"}`}>
      <div className="visual-inner">
        <div className="visual-svg" aria-hidden={canShow3D ? true : undefined} inert={canShow3D || undefined}>
          <NetworkMap state={state} selected={selected} onSelect={onSelect} showWeights={weights} showGroupOutline={Boolean(groups)} label={title} emphasis={emphasis} revealGraph={graphTour && overlay} />
        </div>
        {canShow3D && <div className="scene-layer"><CanvasBoundary onError={lost}>
          <CampusScene state={state ?? {}} graph={overlay} graphTour={graphTour} selected={selected} onSelect={onSelect} weights={weights && (initialMode !== "3D" || !graph)} reduced={reduced} paused={paused} onLost={lost} />
        </CanvasBoundary></div>}
      </div>
      <div className="visual-top">
        <span><span className="map-indicator" /> {graphTour && overlay ? "Graph view" : title}</span>
        {controls && allow3D && !failed && <div className="visual-toggle" aria-label="Map display">
          <button type="button" aria-pressed={!canShow3D} onClick={() => selectMode("2D")}><Map size={13} /> 2D</button>
          <button type="button" aria-pressed={canShow3D} onClick={() => selectMode("3D")}><Box size={13} /> 3D</button>
          {canShow3D && !reduced && !(graphTour && overlay) && <button type="button" aria-label={paused ? "Resume campus animation" : "Pause campus animation"} title={paused ? "Resume campus animation" : "Pause campus animation"} onClick={() => setPaused(value => !value)}>
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>}
        </div>}
      </div>
      <div className="visual-bottom">
        {groups?.length ? <ul className="map-legend" aria-label="Map legend">{groups.map((group, i) => <li key={i}><i className="map-group-key" data-group={i} style={{ backgroundColor: componentColors[i] }} /><span>{groupLabels?.[i]} · {[...group].sort().join(", ")}</span></li>)}</ul> : selected ? <span className="visual-selection"><b>{selected}</b> {buildingById[selected].name}</span>
          : <span>{failed ? "2D map · WebGL unavailable" : canShow3D && graphTour && overlay ? "Select a building" : canShow3D ? <><MoveUpRight size={13} /> Drag to orbit{inspect ? " · Select a building" : ""}</> : "CampusNav / Site plan"}</span>}
        {(canShow3D || graphTour) && controls && <button type="button" onClick={() => { playDeckSound(overlay ? "step" : "map"); setOverlay(!overlay); }} aria-pressed={overlay}><Layers3 size={13} /> Graph overlay</button>}
      </div>
    </div>
  );
}
